import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, useXR } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// مكون مخفي لتتبع حالة الواقع الافتراضي
const XrSessionTracker = () => {
  const session = useXR((state) => state.session);
  const setVrActive = useAppStore((state) => state.setVrActive);

  useEffect(() => {
    setVrActive(!!session);
  }, [session, setVrActive]);

  return null;
};

export default function XrCanvas({ xrStore, children }) {
  return (
    <Canvas shadows>
      <XR store={xrStore}>
        <XrSessionTracker />
        {children}
      </XR>
    </Canvas>
  );
}
