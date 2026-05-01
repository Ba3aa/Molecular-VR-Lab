import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// شاشة تحميل 100% ثلاثية الأبعاد — بلا Html، بلا DOM، بلا state
// موضوعة عند Z=-4.0 خلف لوحات الـ UI (Z=-1.5) بأمان كافٍ
// الحجم مُكبَّر 1.5x ليبقى مقروءاً عند الضعف البصري للبُعد الزائد
export default function VrLoadingScreen() {
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z += delta * 1.2;
    ringRef.current.rotation.y += delta * 0.4;
  });

  return (
    // Z=-4.0 يضعها خلف لوحات الـ UI (Z=-1.5) بفرق 2.5 متر
    // لا تداخل بصري محتمل مع أي عنصر في المشهد
    <group position={[0, 1.5, -4.0]}>

      {/*
        الحلقة الدوارة — حجمها 1.5x من النسخة السابقة:
        - radius: 0.35 → 0.52
        - tube:   0.025 → 0.038
        لتعويض بُعد 4 متر والحفاظ على الحجم الزاوي الظاهر للمستخدم.
      */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.52, 0.038, 16, 80]} />
        <meshBasicMaterial color="#3a6fd8" wireframe />
      </mesh>

      {/* حلقة خارجية ثابتة لعمق بصري */}
      <mesh>
        <torusGeometry args={[0.69, 0.012, 8, 80]} />
        <meshBasicMaterial color="#1a3a6e" wireframe />
      </mesh>

      {/*
        نص التحميل — fontSize مُكبَّر من 0.075 إلى 0.112 (1.5x)
        للحفاظ على قابلية القراءة من بُعد 4 متر.
      */}
      <Text
        position={[0, -0.93, 0]}
        fontSize={0.112}
        color="#93b4e8"
        anchorX="center"
        anchorY="middle"
      >
        Loading Lab...
      </Text>

    </group>
  );
}
