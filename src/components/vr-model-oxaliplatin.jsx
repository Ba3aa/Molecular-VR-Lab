import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Interactive } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// ═══════════════════════════════════════════════════════════════════════
// ① CONSTANTS
// القيم الثابتة تُعرَّف هنا مرة واحدة فقط — لا شيء يُنشأ داخل useFrame
// ═══════════════════════════════════════════════════════════════════════

// مُكَبَّر من 0.02 إلى 0.035 — Oxaliplatin كان صغيراً جداً بالمقياس السابق
const FIXED_SCALE = 0.035;

// محطة Oxaliplatin — الجدار الأيمن
// تم الضبط رياضياً: المحطة عند X=+3.0، النموذج عند X=+2.4، اللوحة عند X=+3.6
// المتوسط (2.4 + 3.6) / 2 = 3.0 (تمركز مثالي)
const ANCHOR_POSITION = [2.4, 1.4, -1.4];

// حدود الزوم — 0 = مكان المرساة الأصلي، 0.85 = أقرب نقطة آمنة من الوجه
const MAX_ZOOM_RATIO = 0.85;
const MIN_ZOOM_RATIO = 0.0;

// حساسية كل وضع
const ROTATION_SPEED = 0.05;
const ZOOM_SPEED     = 0.018;

// عتبة الميت — تمنع الانجراف عند الراحة الصفرية للعصا
const DEADZONE = 0.12;

// إعدادات المادة الأساسية للنموذج
const MATERIAL_METALNESS = 0.5;
const MATERIAL_ROUGHNESS = 0.15;

// اللون المُضيء عند التحديد — تيل يتطابق مع ثيم محطة Oxaliplatin
const EMISSIVE_SELECTED   = new THREE.Color('#3dcaa5');
const EMISSIVE_DEFAULT    = new THREE.Color('#000000');
const SCALE_SELECTED      = FIXED_SCALE * 1.15;
const SCALE_DEFAULT       = FIXED_SCALE;

// ─── Scratch Objects — مخصصون لإعادة الاستخدام داخل useFrame ──────────
// ملاحظة: هذه الـ objects مُعرَّفة خارج المكوّن وخارج useFrame
// لذا لا تُنشأ من جديد في أي frame — هذا يُلغي ضغط الـ Garbage Collector

const _dirToCamera = new THREE.Vector3();
const _displacement = new THREE.Vector3();
const _yawQuat     = new THREE.Quaternion();
const _pitchQuat   = new THREE.Quaternion();
const _yawAxis     = new THREE.Vector3(0, 1, 0);
const _pitchAxis   = new THREE.Vector3(1, 0, 0);

// ═══════════════════════════════════════════════════════════════════════

export default function VrModelOxaliplatin() {

  // ═══════════════════════════════════════════════════════════════════
  // ② STATE / REFS
  // ═══════════════════════════════════════════════════════════════════

  const isVrActive      = useAppStore((state) => state.isVrActive);
  const selectedModel   = useAppStore((state) => state.selectedModel);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);

  // حالة التحويم — تمنع تداخل المدخلات (Input Leakage)
  const [isHovered, setIsHovered] = useState(false);

  // مرساة المتجهات — يتم تحديثها ديناميكياً إذا تغير الموضع
  const anchorVec = useMemo(() => new THREE.Vector3(...ANCHOR_POSITION), []);

  const { scene }      = useGLTF('/chemical-models/oxaliplatin-model.glb');
  const controllers    = useXR((state) => state.controllers);
  const { camera }     = useThree();

  // مجموعة الإزاحة — تنتقل نحو الكاميرا (الزوم)
  const positionGroupRef = useRef();

  // مجموعة الدوران — تدور محليًا حول نفسها
  const pivotGroupRef = useRef();

  // نسبة الزوم المتراكمة — ref وليس state لتجنب re-renders داخل useFrame
  const zoomRatioRef = useRef(0.0);

  // ═══════════════════════════════════════════════════════════════════
  // ③ EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!scene) return;

    scene.traverse((node) => {
      if (node.isMesh) {
        node.castShadow    = true;
        node.receiveShadow = true;

        node.material = new THREE.MeshStandardMaterial({
          color:     node.material?.color ?? new THREE.Color('#ffffff'),
          metalness: MATERIAL_METALNESS,
          roughness: MATERIAL_ROUGHNESS,
          emissive:  EMISSIVE_DEFAULT,
        });
      }
    });
  }, [scene]);

  // ═══════════════════════════════════════════════════════════════════
  // ④ useFrame — حلقة الإطار الرئيسية
  // ═══════════════════════════════════════════════════════════════════

  useFrame((state) => {
    if (!isVrActive)              return;
    if (!positionGroupRef.current) return;
    if (!pivotGroupRef.current)    return;

    const delta = state.delta || 0.016;

    // ── تحديث الحالة البصرية والـ Emissive ───────────────────────
    const isSelected = selectedModel === 'oxaliplatin';

    scene?.traverse((node) => {
      if (node.isMesh && node.material?.emissive) {
        node.material.emissive.copy(
          isSelected ? EMISSIVE_SELECTED : EMISSIVE_DEFAULT
        );
        // توهج "تيل" احترافي عند النشاط
        node.material.emissiveIntensity = isSelected ? 1.8 : 0;
      }
    });

    // ── بوابة التحكم (The Gatekeeper) ────────────────────────────
    // التدوير متاح فقط إذا كان المركب محدد ومختار حالياً
    if (!isHovered || !isSelected) return;
    
    if (!controllers || controllers.length === 0) return;

    // الخطوة 1: الحصول على الـ gamepad من وحدة التحكم النشطة
    const activeController = controllers.find((c) => c.inputSource?.gamepad);
    if (!activeController) return;
    const gamepad = activeController.inputSource.gamepad;

    // الخطوة 2: قراءة محاور العصا
    const thumbX = gamepad.axes[2] || 0;
    const thumbY = gamepad.axes[3] || 0;

    // الخطوة 3: قراءة زر الـ Grip
    const isGripPressed = gamepad.buttons[1]?.pressed ?? false;

    // الخطوة 4: منطق التكبير
    if (isGripPressed) {
      if (Math.abs(thumbY) > DEADZONE) {
        let newScale = positionGroupRef.current.scale.x + (thumbY * 0.02);
        newScale = Math.max(0.5, Math.min(3.0, newScale));
        positionGroupRef.current.scale.set(newScale, newScale, newScale);
      }
    } 
    // الخطوة 5: منطق الدوران الاحترافي (Quaternion Trackball)
    else {
      if (Math.abs(thumbX) > DEADZONE) {
        _yawQuat.setFromAxisAngle(_yawAxis, thumbX * ROTATION_SPEED * 60 * delta);
        pivotGroupRef.current.quaternion.premultiply(_yawQuat);
      }
      if (Math.abs(thumbY) > DEADZONE) {
        _pitchQuat.setFromAxisAngle(_pitchAxis, thumbY * ROTATION_SPEED * 60 * delta);
        pivotGroupRef.current.quaternion.premultiply(_pitchQuat);
      }
    }
  });

  if (!isVrActive || !scene) return null;

  return (
    <group position={ANCHOR_POSITION}>
      <group ref={positionGroupRef}>
        <group ref={pivotGroupRef} scale={FIXED_SCALE}>
          <Interactive 
            onSelect={() => setSelectedModel('oxaliplatin')}
            onHover={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
          >
            <Center>
              <primitive object={scene} />
            </Center>
          </Interactive>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload('/chemical-models/oxaliplatin-model.glb');
