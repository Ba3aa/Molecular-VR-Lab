import { Suspense } from 'react';
import { createXRStore } from '@react-three/xr';
import { useAppStore } from './store/app-store';
import XrCanvas from './components/xr-canvas';
import VrStars from './components/vr-stars';
import VrLighting from './components/vr-lighting';
import VrTeleport from './components/vr-teleport';
import VrLoadingScreen from './components/vr-loading-screen';
import VrModelCisplatin from './components/vr-model-cisplatin';
import VrModelOxaliplatin from './components/vr-model-oxaliplatin';
import VrSpatialMenu from './components/vr-spatial-menu';
import VrInfoOxaliplatin from './components/vr-info-oxaliplatin';

// xrStore يُنشأ مرة واحدة خارج المكوّن لمنع إعادة التصيير
const xrStore = createXRStore();

export default function App() {
  const isVrActive = useAppStore((state) => state.isVrActive);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', background: '#000' }}>

      {/* ══════════════════════════════════════════════════════
          زر دخول VR — يظهر فقط خارج جلسة الواقع الافتراضي
          enterVR() تستدعي WebXR API لطلب immersive-vr session
          ══════════════════════════════════════════════════════ */}
      {!isVrActive && (
        <div style={{
          position:        'absolute',
          bottom:          '2rem',
          left:            '50%',
          transform:       'translateX(-50%)',
          zIndex:          10,
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          gap:             '0.5rem',
        }}>
          <button
            onClick={() => xrStore.enterVR()}
            style={{
              padding:         '0.85rem 2.5rem',
              fontSize:        '1rem',
              fontWeight:      700,
              letterSpacing:   '0.08em',
              color:           '#ffffff',
              background:      'linear-gradient(135deg, #1a3a6e 0%, #0d1f42 100%)',
              border:          '1px solid #3a6fd8',
              borderRadius:    '8px',
              cursor:          'pointer',
              boxShadow:       '0 0 24px rgba(58,111,216,0.45)',
              transition:      'box-shadow 0.2s, transform 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 40px rgba(58,111,216,0.75)';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 0 24px rgba(58,111,216,0.45)';
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            }}
          >
            ⬡ Enter VR
          </button>
          <span style={{ color: '#4a6fa5', fontSize: '0.72rem', letterSpacing: '0.05em' }}>
            Requires WebXR-compatible headset
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          الـ Canvas الرئيسي — كل المحتوى ثلاثي الأبعاد داخله
          ══════════════════════════════════════════════════════ */}
      <XrCanvas xrStore={xrStore}>
        {/*
          Suspense boundary واحدة تغلِّف كل مكوّنات VR:
          - VrSpatialMenu و VrInfoOxaliplatin يستخدمان <Text> من drei
            الذي يُحمِّل خطوطاً بشكل async — يجب أن يكونا داخل Suspense
          - VrStars و VrLighting و VrTeleport خفيفة لكن لا ضرر من وضعها
            داخل نفس الـ boundary لضمان ترتيب ظهور موحَّد
        */}
        <Suspense fallback={<VrLoadingScreen />}>
          <VrStars />
          <VrLighting />
          <VrTeleport />
          <VrSpatialMenu />
          <VrInfoOxaliplatin />
          <VrModelCisplatin />
          <VrModelOxaliplatin />
        </Suspense>
      </XrCanvas>
    </div>
  );
}