import { useAppStore } from '../store/app-store';
import { TeleportTarget } from '@react-three/xr';

export default function VrTeleport() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  if (!isVrActive) return null;

  return (
    <TeleportTarget>

      {/* ══════════════════════════════════════════════════════
          الأرضية الرئيسية — المنصة المركزية الكاملة
          ══════════════════════════════════════════════════════ */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[6, 6, 0.2, 64]} />
        <meshStandardMaterial color="#0c0c0c" roughness={0.15} metalness={0.85} />
      </mesh>

      {/* حلقات الحدود والـ Focal Point — مسطَّحة بـ rotation={[-Math.PI/2,0,0]} */}
      <group position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>

        {/* حلقة الحدود الخارجية للأرضية الكاملة */}
        <mesh>
          <torusGeometry args={[6, 0.03, 12, 120]} />
          <meshStandardMaterial
            color="#1a3a6e"
            emissive="#2a5ab0"
            emissiveIntensity={0.4}
          />
        </mesh>

        {/* Focal Point المركزي — يُرشِد المستخدم عند أول دخول */}
        <mesh>
          <torusGeometry args={[0.3, 0.018, 8, 60]} />
          <meshStandardMaterial
            color="#2a5ab0"
            emissive="#3a7aff"
            emissiveIntensity={0.9}
          />
        </mesh>
      </group>

      {/* نقطة المركز (dot) */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 32]} />
        <meshStandardMaterial color="#3a7aff" emissive="#5a9aff" emissiveIntensity={1.0} />
      </mesh>

      {/* ══════════════════════════════════════════════════════
          محطة Cisplatin — الجدار الأيسر (X=-2.8)
          اللوحة أمام المستخدم (Z=-1.0)، النموذج خلفه (Z=+1.0)
          ══════════════════════════════════════════════════════ */}
      <group position={[-3.0, 0.01, -1.5]}>

        {/* قرص قاعدة المحطة — لون أزرق داكن (ثيم Cisplatin) */}
        <mesh>
          <cylinderGeometry args={[1.8, 1.8, 0.02, 64]} />
          <meshStandardMaterial color="#0a1526" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* حدود المحطة وعلامات التوجيه — مسطَّحة */}
        <group rotation={[-Math.PI / 2, 0, 0]}>

          {/* حلقة خارجية مُضيئة — الحدود الرئيسية للمحطة */}
          <mesh>
            <torusGeometry args={[1.8, 0.04, 12, 80]} />
            <meshStandardMaterial
              color="#1a3a6e"
              emissive="#3a7aff"
              emissiveIntensity={0.9}
              metalness={0.3}
            />
          </mesh>

          {/* حلقة داخلية رفيعة لعمق بصري */}
          <mesh>
            <torusGeometry args={[1.5, 0.014, 8, 80]} />
            <meshStandardMaterial
              color="#0d1f42"
              emissive="#2a5ab0"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* نقطة مركزية للمحطة */}
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

      {/* ══════════════════════════════════════════════════════
          محطة Oxaliplatin — الجدار الأيمن (X=+2.8)
          اللوحة أمام المستخدم (Z=-1.0)، النموذج خلفه (Z=+1.0)
          متماثلة مع محطة Cisplatin بثيم أخضر مائي
          ══════════════════════════════════════════════════════ */}
      <group position={[3.0, 0.01, -1.5]}>

        {/* قرص قاعدة المحطة — لون أخضر داكن (ثيم Oxaliplatin) */}
        <mesh>
          <cylinderGeometry args={[1.8, 1.8, 0.02, 64]} />
          <meshStandardMaterial color="#0a1f1b" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* حدود المحطة وعلامات التوجيه — مسطَّحة */}
        <group rotation={[-Math.PI / 2, 0, 0]}>

          {/* حلقة خارجية مُضيئة — الحدود الرئيسية */}
          <mesh>
            <torusGeometry args={[1.8, 0.04, 12, 80]} />
            <meshStandardMaterial
              color="#1a4a40"
              emissive="#3dcaa5"
              emissiveIntensity={0.9}
              metalness={0.3}
            />
          </mesh>

          {/* حلقة داخلية رفيعة */}
          <mesh>
            <torusGeometry args={[1.5, 0.014, 8, 80]} />
            <meshStandardMaterial
              color="#0a2e28"
              emissive="#2a8a70"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* نقطة مركزية للمحطة */}
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
