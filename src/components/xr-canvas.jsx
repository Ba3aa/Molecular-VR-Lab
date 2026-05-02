import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, useXR } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// مكون مخفي مشان نعرف إحنا جوا الـ VR ولا برة ونضبط الوضع
const XrSessionTracker = () => {
  const session = useXR((state) => state.session);
  const setVrActive = useAppStore((state) => state.setVrActive);

  useEffect(() => {
    // بنتأكد إن الجلسة شغالة تمام قبل ما نفعل أي شي
    if (session) {
      setVrActive(true);
    } else {
      setVrActive(false);
    }
  }, [session, setVrActive]);

  return null;
};

export default function XrCanvas({ xrStore, children }) {
  // بنضبط كيف بنطلع الأشياء مشان جلسة الـ XR تضل ثابتة
  // [حماية] ما بنطلع المكونات اللي فيها تفاعل إلا لما نتأكد إن الـ XR شغال صح
  return (
    <Canvas 
      shadows 
      camera={{ fov: 75, near: 0.1, far: 2000 }}
      gl={{ antialias: true, alpha: false }}
    >
      <XR store={xrStore}>
        <XrSessionTracker />
        {children}
      </XR>
    </Canvas>
  );
}
