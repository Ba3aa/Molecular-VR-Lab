import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, Center } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Interactive } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// ═══════════════════════════════════════════════════════════════════════
// ① CONSTANTS
// القيم الثابتة تُعرَّف هنا مرة واحدة — لا شيء يُنشأ داخل useFrame
// ═══════════════════════════════════════════════════════════════════════

// المقياس الموحد لضمان رؤية ممتازة (تم تحديثه إلى 0.012)
const FIXED_SCALE = 0.012;

// محطة Cisplatin — الجدار الأيسر
// تم الضبط رياضياً: المحطة عند X=-3.0، النموذج عند X=-2.4، اللوحة عند X=-3.6
// المتوسط (-2.4 + -3.6) / 2 = -3.0 (تمركز مثالي)
const ANCHOR_POSITION = [-2.4, 1.4, -1.4];

const MAX_ZOOM_RATIO = 0.85;
const MIN_ZOOM_RATIO = 0.0;

const ROTATION_SPEED = 0.05;
const ZOOM_SPEED     = 0.018;
const DEADZONE       = 0.12;

// إعدادات التحديد
const EMISSIVE_SELECTED = new THREE.Color('#004aaa');
const EMISSIVE_DEFAULT  = new THREE.Color('#000000');
// SCALE_SELECTED يُحسَب هنا بعد تعريف FIXED_SCALE
const SCALE_SELECTED    = FIXED_SCALE * 1.15;
const SCALE_DEFAULT     = FIXED_SCALE;

// ─── Scratch Objects ────────────────────────────────────────────────────
// مُعرَّفة خارج المكوّن وخارج useFrame تماماً.
// هذا يعني أنها تُنشأ مرة واحدة فقط طوال عمر التطبيق.
// داخل useFrame نستخدم .copy() / .subVectors() / .multiplyScalar()
// بدلاً من new THREE.Vector3() — هذا يُلغي ضغط الـ Garbage Collector.

const _dirToCamera  = new THREE.Vector3();
const _displacement = new THREE.Vector3();
const _yawQuat      = new THREE.Quaternion();
const _pitchQuat    = new THREE.Quaternion();
const _yawAxis      = new THREE.Vector3(0, 1, 0);
const _pitchAxis    = new THREE.Vector3(1, 0, 0);

// ═══════════════════════════════════════════════════════════════════════

export default function VrModelCisplatin() {

  // ═══════════════════════════════════════════════════════════════════
  // ② STATE / REFS
  // ═══════════════════════════════════════════════════════════════════

  const isVrActive       = useAppStore((state) => state.isVrActive);
  const selectedModel    = useAppStore((state) => state.selectedModel);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);

  // حالة التحويم — تمنع تداخل المدخلات (Input Leakage)
  const [isHovered, setIsHovered] = useState(false);

  // مرساة المتجهات — يتم تحديثها ديناميكياً إذا تغير الموضع
  const anchorVec = useMemo(() => new THREE.Vector3(...ANCHOR_POSITION), []);

  const isDnaMode       = useAppStore((state) => state.isDnaMode);

  // تحديث المسارات لتعمل بشكل صحيح على GitHub Pages (Subpath Compatibility)
  const modelPath = isDnaMode 
    ? import.meta.env.BASE_URL + 'chemical-models/cisplatin-dna-mix.glb'
    : import.meta.env.BASE_URL + 'chemical-models/cisplatin-model.glb';

  const { scene }     = useGLTF(modelPath);
  const controllers   = useXR((state) => state.controllers);
  const { camera }    = useThree();

  // ─── التسلسل الهرمي للمجموعات ─────────────────────────────────────
  //
  //  <group position={ANCHOR_POSITION}>            ← ① مرساة العالم (ثابتة)
  //    <group ref={positionGroupRef}>              ← ② مجموعة الإزاحة (الزوم)
  //      <group ref={pivotGroupRef} scale={0.02}> ← ③ مجموعة الدوران
  //        <Interactive>
  //          <Center>
  //            <primitive object={scene} />
  //          </Center>
  //        </Interactive>
  //      </group>
  //    </group>
  //  </group>

  // مجموعة الإزاحة — تنتقل نحو الكاميرا عند السحب
  const positionGroupRef = useRef();

  // مجموعة الدوران — تدور محليًا حول نفسها فقط
  const pivotGroupRef = useRef();

  // نسبة الزوم المتراكمة — ref لتجنب re-render داخل useFrame
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
      }
    });
    // لا نُعدِّل scene.position — <Center> يتولى التمركز بأمان
  }, [scene]);

  // ═══════════════════════════════════════════════════════════════════
  // ④ useFrame — حلقة الإطار الرئيسية
  // ═══════════════════════════════════════════════════════════════════

  useFrame((state) => {
    if (!isVrActive)               return;
    if (!positionGroupRef.current) return;
    if (!pivotGroupRef.current)    return;

    const delta = state.delta || 0.016; // لضمان سرعة دوران ثابتة مهما كان عدد الإطارات (FPS)

    // ── تحديث الحالة البصرية والـ Emissive ───────────────────────
    const isSelected = selectedModel === 'cisplatin';
    
    // توهج إضافي عند الاختيار (Glow Feedback)
    scene?.traverse((node) => {
      if (node.isMesh && node.material?.emissive) {
        node.material.emissive.copy(
          isSelected ? EMISSIVE_SELECTED : EMISSIVE_DEFAULT
        );
        // زيادة شدة الإضاءة المنبعثة عند النشاط
        node.material.emissiveIntensity = isSelected ? 1.5 : 0;
      }
    });

    // ── بوابة التحكم (The Gatekeeper) ────────────────────────────
    // التدوير والزوم متاح فقط إذا كان المركب "محدد" (isSelected) و "يؤشر عليه" (isHovered)
    if (!isHovered || !isSelected) return;
    
    if (!controllers || controllers.length === 0) return;

    // الخطوة 1: الحصول على الـ gamepad من وحدة التحكم النشطة
    const activeController = controllers.find((c) => c.inputSource?.gamepad);
    if (!activeController) return;
    const gamepad = activeController.inputSource.gamepad;

    // الخطوة 2: قراءة محاور العصا (ThumbX, ThumbY)
    const thumbX = gamepad.axes[2] || 0;
    const thumbY = gamepad.axes[3] || 0;

    // الخطوة 3: قراءة زر الـ Grip للتبديل بين الدوران والزوم
    const isGripPressed = gamepad.buttons[1]?.pressed ?? false;

    // الخطوة 4: منطق التكبير (Scaling) عند ضغط الزر الجانبي
    if (isGripPressed) {
      if (Math.abs(thumbY) > DEADZONE) {
        let newScale = positionGroupRef.current.scale.x + (thumbY * 0.02);
        newScale = Math.max(0.5, Math.min(3.0, newScale));
        positionGroupRef.current.scale.set(newScale, newScale, newScale);
      }
    } 
    // الخطوة 5: منطق الدوران الاحترافي (Quaternion Trackball)
    else {
      // الدوران الأفقي (Yaw) - حول المحور Y العالمي
      if (Math.abs(thumbX) > DEADZONE) {
        _yawQuat.setFromAxisAngle(_yawAxis, thumbX * ROTATION_SPEED * 60 * delta);
        pivotGroupRef.current.quaternion.premultiply(_yawQuat);
      }
      // الدوران الرأسي (Pitch) - حول المحور X العالمي
      if (Math.abs(thumbY) > DEADZONE) {
        _pitchQuat.setFromAxisAngle(_pitchAxis, thumbY * ROTATION_SPEED * 60 * delta);
        pivotGroupRef.current.quaternion.premultiply(_pitchQuat);
      }
    }
  });

  // ─── لا نعرض شيئًا خارج VR أو قبل تحميل النموذج ────────────────
  if (!isVrActive || !scene) return null;

  // ═══════════════════════════════════════════════════════════════════
  // ⑤ JSX
  // ═══════════════════════════════════════════════════════════════════
  return (
    // ① المرساة: موقع ثابت في الفضاء العالمي
    <group position={ANCHOR_POSITION}>

      {/* ② مجموعة الإزاحة: تنتقل نحو الكاميرا عند الزوم */}
      <group ref={positionGroupRef}>

        {/* ③ مجموعة الدوران: تدور محليًا، scale يُعدَّل في useFrame */}
        <group ref={pivotGroupRef} scale={FIXED_SCALE}>

          {/* Interactive يُمكِّن الـ controller ray من اكتشاف النموذج */}
          <Interactive 
            onSelect={() => setSelectedModel('cisplatin')}
            onHover={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
          >

            {/* Center يُعيد تمركز الجيومتري بأمان دون تلويث الـ cached scene */}
            <Center>
              <primitive object={scene} />
            </Center>

          </Interactive>

        </group>
      </group>
    </group>
  );
}

// تحميل مسبق لكلا النموذجين لضمان انتقال سلس بين الأوضاع
useGLTF.preload(import.meta.env.BASE_URL + 'chemical-models/cisplatin-model.glb');
useGLTF.preload(import.meta.env.BASE_URL + 'chemical-models/cisplatin-dna-mix.glb');
