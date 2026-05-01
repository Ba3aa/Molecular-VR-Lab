import { Stars } from '@react-three/drei';
import { useAppStore } from '../store/app-store';

export default function VrStars() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  if (!isVrActive) return null;

  return (
    <>
      {/*
        لون الخلفية الصلبة — يُعيِّن clearColor الـ WebGL مباشرةً.
        هذا وحده كافٍ لخلفية سوداء — لا نحتاج sphere إضافية.
      */}
      <color attach="background" args={['#000000']} />

      {/*
        النجوم المُعايَرة:
        - radius=70: أقرب نجمة على بُعد (70 - depth=10) = 60 متر
          — لا تظهر نجوم قريبة بشكل غير طبيعي بعد الآن
        - depth=10: سُمك طبقة النجوم محدود — توزيع مضغوط يبدو طبيعياً
        - count=5000: كثافة كافية دون ثقل على الـ GPU
        - factor=4: حجم النجوم معقول
        - fade=true: تتلاشى النجوم عند الأطراف لتجنب حواف مقطوعة مفاجئة
        - الكرة السوداء المحيطة (r=200) حُذفت — مكررة ومُكلِّفة
      */}
      <Stars
        radius={70}
        depth={10}
        count={5000}
        factor={4}
        saturation={0}
        fade
      />
    </>
  );
}
