import { Stars } from '@react-three/drei';
import { useAppStore } from '../store/app-store';

export default function VrStars() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  if (!isVrActive) return null;

  return (
    <>
      {/* لون الخلفية - بنخليها سوداء فحم، هيك بكفي وما بدها غلبة ثانية */}
      <color attach="background" args={['#000000']} />

      {/*
        ضبطنا النجوم:
        - وسعنا المدى مشان الفضاء يبين كبير
        - زدنا العمق مشان تحس إنك بنص الفضاء فعلاً
        - كثرنا النجوم شوي (7000 نجمة)
        - كبرنا النجوم مشان تضوي أحسن وتكون واضحة
        - بتختفي النجوم بالتدريج بالأطراف مشان ما تبين مقطوعة فجأة
      */}
      <Stars
        radius={200}
        depth={100}
        count={7000}
        factor={6}
        saturation={0}
        fade
      />
    </>
  );
}
