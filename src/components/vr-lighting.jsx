import { useAppStore } from '../store/app-store';

export default function VrLighting() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  if (!isVrActive) return null;

  return (
    <>
      {/* إضاءة محيطية خافتة لمنع الظلام التام في المناطق غير المضاءة */}
      <ambientLight intensity={0.5} />

      {/*
        مصدر ضوء موجَّه مع shadow camera مُوسَّعة:
        - left/right/top/bottom = ±6 متر تغطي الأرضية كاملاً (radius=4)
          مع هامش أمان 2 متر إضافي على كل جانب
        - shadow-mapSize [1024,1024] — دقة كافية بدون ثقل على الـ GPU
        - بدون التوسيع، الظلال كانت تُقطَع عند ±5 متر الافتراضي
          وتظهر كحدود مرئية مفاجئة على الأرضية
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

      {/* نقطة ضوء ثانوية لملء الظلال العميقة من الاتجاه المعاكس */}
      <pointLight position={[-10, 10, -10]} intensity={0.5} />
    </>
  );
}
