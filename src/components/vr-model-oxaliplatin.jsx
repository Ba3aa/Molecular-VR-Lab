import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useGLTF, Center, Line, Billboard, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useXR, Interactive } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// القيم الثابتة بنعرفها هون مرة وحدة مشان ما نضل نعيدها بـ useFrame

// كبرنا القيم مشان تناسب حجم النموذج وتنشاف منيح
const BINDING_TARGET = [0, 0, 0]; 
const LABEL_POSITION = [40, 30, 0]; 
const ANNOTATION_TEXT_SIZE = 12;

// كبرنا الحجم شوي (0.035) مشان Oxaliplatin كان صغير
const FIXED_SCALE = 0.035;

// محطة Oxaliplatin - جهة اليمين، حسبناها بالملي مشان تطلع بالنص
const ANCHOR_POSITION = [2.4, 1.4, -1.4];

// حدود الزوم — 0 = مكان المرساة الأصلي، 0.85 = أقرب نقطة آمنة من الوجه
const MAX_ZOOM_RATIO = 0.85;
const MIN_ZOOM_RATIO = 0.0;

// حساسية كل وضع
const ROTATION_SPEED = 0.05;
const ZOOM_SPEED     = 0.018;

// عتبة الميت - مشان الأوامر ما تتحرك لحالها
const DEADZONE = 0.12;

// إعدادات لما تختار الجزيء - لون تيل بناسب المحطة
const EMISSIVE_SELECTED   = new THREE.Color('#3dcaa5');
const EMISSIVE_DEFAULT    = new THREE.Color('#000000');
const SCALE_SELECTED      = FIXED_SCALE * 1.15;
const SCALE_DEFAULT       = FIXED_SCALE;

// كائنات المساعدة (Scratch Objects) - معرفة برا المكون مشان الأداء
// يعني بنعملها مرة وحدة بس مشان الـ Garbage Collector يضل مرتاح

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

  // حالة لما تحط الماوس أو المؤشر عليه
  const [isHovered, setIsHovered] = useState(false);

  // المتجه الأساسي، بيتحدث إذا غيرنا المكان
  const anchorVec = useMemo(() => new THREE.Vector3(...ANCHOR_POSITION), []);

  const isDnaMode       = useAppStore((state) => state.isDnaMode);
  // حالة العرض مشان حركة الـ "Pop & Swap" (يصغر، يتغير، بعدين يكبر)
  const [renderedMode, setRenderedMode] = useState(isDnaMode);

  // حملنا النموذجين من قبل مشان التبديل يكون ناعم
  const { scene: baseScene } = useGLTF(import.meta.env.BASE_URL + 'chemical-models/oxaliplatin-model.glb');
  const { scene: dnaScene }  = useGLTF(import.meta.env.BASE_URL + 'chemical-models/oxaliplatin-dna-mix.glb');

  // بنحدد أي مشهد شغال حسب وضع الـ DNA
  const activeScene = isDnaMode ? dnaScene : baseScene;

  const controllers    = useXR((state) => state.controllers);
  const session        = useXR((state) => state.session);
  const { camera }     = useThree();

  // مجموعة الإزاحة - بتقرب عالعين لما تسحبها (الزوم)
  const positionGroupRef = useRef();

  // مجموعة الدوران - بتلف حول حالها
  const pivotGroupRef = useRef();

  // متجه هدف للأنيميشن مشان السرعة
  const _vTargetScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);

  // مرجع للمواد مشان نتحكم بالضوء (Glow) لحاله
  const materialsRef = useRef([]);

  // مرجع لتبديل النماذج (Pop & Swap)
  const swapGroupRef = useRef();

  // ═══════════════════════════════════════════════════════════════════
  // ③ EFFECTS
  // ═══════════════════════════════════════════════════════════════════

  useEffect(() => {
    if (!activeScene) return;
    
    // إفراغ المصفوفة القديمة
    materialsRef.current = [];
    
    // بننسخ المواد مشان نغير الضوء براحتنا بدون ما نأثر عالباقي
    activeScene.traverse((node) => {
      if (node.isMesh && node.material) {
        node.castShadow    = true;
        node.receiveShadow = true;
        
        // نسخ المادة هو اللي بخلينا نضويها لحالها
        node.material = node.material.clone();
        node.material.emissive = new THREE.Color("#00FFFF"); 
        node.material.emissiveIntensity = 0;
        
        materialsRef.current.push(node.material);
      }
    });
  }, [activeScene]); // التحديث لما نبدل بين العادي والـ DNA

  // ═══════════════════════════════════════════════════════════════════
  // ④ useFrame — حلقة الإطار الرئيسية
  // ═══════════════════════════════════════════════════════════════════

  useFrame((state) => {
    if (!positionGroupRef.current) return;
    const delta = state.delta || 0.016;

    // أنيميشن الدخول والزوم في بداية اللفة مشان يشتغل صح
    positionGroupRef.current.scale.lerp(_vTargetScale, delta * 5.0);

    // بنصغر المجسم للصفر، بنبدله وهو مخفي، بعدين بنكبره
    if (isDnaMode !== renderedMode) {
      // أول شي: بصغر للصفر
      swapGroupRef.current.scale.lerp(new THREE.Vector3(0, 0, 0), delta * 15.0);
      if (swapGroupRef.current.scale.x < 0.05) {
        swapGroupRef.current.scale.setScalar(0);
        setRenderedMode(isDnaMode); 
      }
    } else {
      // ثاني شي: بيكبر للحجم العادي
      swapGroupRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), delta * 10.0);
    }

    // ── تحديث الضوء (Glow) ───────────────────────────
    const isSelected = selectedModel === 'oxaliplatin';
    const targetIntensity = isSelected ? 0.6 : 0;
    
    materialsRef.current.forEach((mat) => {
      if (mat) {
        mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetIntensity, delta * 10.0);
      }
    });

    if (!isVrActive || !session) return;
    if (!pivotGroupRef.current)    return;

    // ── بوابة التحكم والمُدخلات (The Gatekeeper) ──────────────────────────
    // بندور على كنترولر شغال مع حماية كاملة
    try {
      const activeController = controllers.find((c) => c && c.inputSource && c.inputSource.gamepad);
      if (!activeController) return;

      const gamepad = activeController.inputSource.gamepad;
      
      // بنتأكد من كل شي مشان ما يعلق البرنامج
      if (!gamepad || !gamepad.axes || !gamepad.buttons) return;
      if (gamepad.axes.length < 4 || gamepad.buttons.length < 2) return;

      const thumbX = gamepad.axes[2] ?? 0;
      const thumbY = gamepad.axes[3] ?? 0;

    const isGripPressed = gamepad.buttons[1]?.pressed ?? false;

    if (isGripPressed) {
      if (Math.abs(thumbY) > DEADZONE) {
        // بنحدث الحجم مشان الحركة تطلع ناعمة
        let newScale = _vTargetScale.x + (thumbY * 0.02);
        newScale = Math.max(0.5, Math.min(3.0, newScale));
        _vTargetScale.setScalar(newScale);
      }
    } 
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
    } catch (err) {
      // طنش أخطاء المحاكي مشان يضل الشغل ماشي
      console.warn("XR Input caught:", err.message);
    }
  });

  // ما بنطلع شي إذا ما كنا بالـ VR أو النماذج لسا ما حملت
  if (!isVrActive || !baseScene || !dnaScene) return null;

  return (
    <group position={ANCHOR_POSITION}>
    <group position={ANCHOR_POSITION}>
      {/* بنبلش بحجم صفر مشان يشتغل الأنيميشن */}
      <group ref={positionGroupRef} scale={0}>
        <group ref={pivotGroupRef} scale={FIXED_SCALE}>
          <Interactive 
            onSelect={() => setSelectedModel('oxaliplatin')}
            onHover={() => setIsHovered(true)}
            onBlur={() => setIsHovered(false)}
          >
            <group ref={swapGroupRef} scale={1}>
              <Center>
                {renderedMode ? (
                  <primitive object={dnaScene} name="dna-bound-model" />
                ) : (
                  <primitive object={baseScene} name="base-molecule-model" />
                )}
              </Center>

              {/* مؤشر لمكان الارتباط بالحمض النووي - سهم واضح */}
              {renderedMode && (
                <group name="oxaliplatin-annotation">
                  {/* النص */}
                  <Billboard position={LABEL_POSITION}>
                    <Text 
                      fontSize={ANNOTATION_TEXT_SIZE} 
                      color="#3dcaa5" 
                      anchorX="center" 
                      anchorY="bottom"
                      fontWeight="bold"
                      outlineWidth={0.5}
                      outlineColor="#000000"
                    >
                      BINDING SITE
                    </Text>
                  </Billboard>

                  {/* الخط تبع المؤشر */}
                  <Line 
                    points={[LABEL_POSITION, BINDING_TARGET]} 
                    color="#3dcaa5" 
                    lineWidth={4} 
                    transparent 
                    opacity={0.9}
                    raycast={() => null}
                  />
                </group>
              )}
            </group>
          </Interactive>
        </group>
      </group>
    </group>
  );
}

// تحميل مسبق مشان التبديل يكون ناعم
useGLTF.preload(import.meta.env.BASE_URL + 'chemical-models/oxaliplatin-model.glb');
useGLTF.preload(import.meta.env.BASE_URL + 'chemical-models/oxaliplatin-dna-mix.glb');
