import { useAppStore } from '../store/app-store';
import { TeleportTarget } from '@react-three/xr';

export default function VrTeleport() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  if (!isVrActive) return null;

  return (
    <TeleportTarget>

      {/* الأرضية الأساسية */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6, 0.2, 64]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.15} metalness={0.85} />
      </mesh>

      {/* الحلقات والـ Focal Point - هون بنحدد وين المستخدم رح يتطلع */}
      <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>

        {/* حلقة الحدود البرانية */}
        <mesh>
          <torusGeometry args={[6, 0.03, 12, 120]} />
          <meshStandardMaterial
            color="#1a3a6e"
            emissive="#2a5ab0"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* النقطة المركزية - مشان المستخدم يعرف وين هو أول ما يدخل */}
        <mesh>
          <torusGeometry args={[0.3, 0.018, 8, 60]} />
          <meshStandardMaterial
            color="#2a5ab0"
            emissive="#3a7aff"
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>

      {/* النقطة اللي بالنص بالضبط */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 32]} />
        <meshStandardMaterial color="#3a7aff" emissive="#5a9aff" emissiveIntensity={1.0} />
      </mesh>

      {/* محطة Cisplatin - جهة الشمال */}
      <group position={[-3.0, 0.01, -1.5]}>

        {/* قاعدة المحطة - لون أزرق غامق */}
        <mesh>
          <cylinderGeometry args={[1.8, 1.8, 0.02, 64]} />
          <meshStandardMaterial color="#0a1526" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* حدود المحطة وعلامات التوجيه */}
        <group rotation={[-Math.PI / 2, 0, 0]}>

          {/* الحلقة اللي بتضوي برة */}
          <mesh>
            <torusGeometry args={[1.8, 0.04, 12, 80]} />
            <meshStandardMaterial
              color="#1a3a6e"
              emissive="#3a7aff"
              emissiveIntensity={0.9}
              metalness={0.3}
            />
          </mesh>

          {/* حلقة جوا مشان المنظر */}
          <mesh>
            <torusGeometry args={[1.5, 0.014, 8, 80]} />
            <meshStandardMaterial
              color="#0d1f42"
              emissive="#2a5ab0"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* نقطة نص المحطة */}
          <mesh>
            <torusGeometry args={[0.18, 0.014, 8, 40]} />
            <meshStandardMaterial
              color="#2a5ab0"
              emissive="#4a8aff"
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      </group>

      {/* محطة Oxaliplatin - جهة اليمين */}
      <group position={[3.0, 0.01, -1.5]}>

        {/* قاعدة المحطة - لون أخضر غامق */}
        <mesh>
          <cylinderGeometry args={[1.8, 1.8, 0.02, 64]} />
          <meshStandardMaterial color="#0a1f1b" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* حدود المحطة وعلامات التوجيه */}
        <group rotation={[-Math.PI / 2, 0, 0]}>

          {/* حلقة بتضوي برة */}
          <mesh>
            <torusGeometry args={[1.8, 0.04, 12, 80]} />
            <meshStandardMaterial
              color="#1a4a40"
              emissive="#3dcaa5"
              emissiveIntensity={0.9}
              metalness={0.3}
            />
          </mesh>

          {/* حلقة جوا رفيعة */}
          <mesh>
            <torusGeometry args={[1.5, 0.014, 8, 80]} />
            <meshStandardMaterial
              color="#0a2e28"
              emissive="#2a8a70"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* نقطة نص المحطة */}
          <mesh>
            <torusGeometry args={[0.18, 0.014, 8, 40]} />
            <meshStandardMaterial
              color="#1a6b5a"
              emissive="#5DCAA5"
              emissiveIntensity={1.0}
            />
          </mesh>
        </group>
      </group>

    </TeleportTarget>
  );
}
