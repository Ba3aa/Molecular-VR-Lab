import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// شاشة تحميل ثلاثية أبعاد بالكامل - لا HTML ولا وجع راس
// حطيناها ورا شوي عند Z=-4 مشان ما تخبص بالـ UI
// كبرنا الحجم مرة ونص مشان تنشاف من بعيد
export default function VrLoadingScreen() {
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z += delta * 1.2;
    ringRef.current.rotation.y += delta * 0.4;
  });

  return (
    // حطيناها بعيدة 4 متر مشان تضل ورا كل شي وما تدخل بأي عنصر ثاني
    <group position={[0, 1.5, -4.0]}>

      {/* الحلقة اللي بتلف - كبرناها مشان تبين واضحة من بعيد */}
      <mesh ref={ringRef}>
        <torusGeometry args={[0.52, 0.038, 16, 80]} />
        <meshBasicMaterial color="#3a6fd8" wireframe />
      </mesh>

      {/* حلقة برانية ثابتة مشان المنظر */}
      <mesh>
        <torusGeometry args={[0.69, 0.012, 8, 80]} />
        <meshBasicMaterial color="#1a3a6e" wireframe />
      </mesh>

      {/* الخط كبرناه مرة ونص مشان ينشاف من 4 متر */}
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
