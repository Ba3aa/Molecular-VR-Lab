import { Environment } from '@react-three/drei';
import { useAppStore } from '../store/app-store';

export default function VrLighting() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  if (!isVrActive) return null;

  return (
    <>
      {/* بنضيف بيئة مشان المجسمات تبين حقيقية زي القزاز والمعدن */}
      <Environment preset="city" />

      {/* ضوء خفيف مشان الدنيا ما تكون عتمة بالمرة */}
      <ambientLight intensity={0.5} />

      {/*
        ضوء بوجه (Directional) مع كاميرا ظلال وسيعة:
        - غطينا الأرضية بـ 6 متر يمين وشمال وفوق وتحت مشان الظلال ما تروح
        - دقة الظلال 1024 كويسة وما بتقل عالجهاز
        - لو ما وسعنا كان الظلال انقصت وطلعت فجأة عالأرض
      */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />

      {/* ضوء ثاني مشان نعبي الظلال اللي بتطلع بالجهة الثانية */}
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
    </>
  );
}
