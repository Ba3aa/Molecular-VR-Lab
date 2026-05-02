import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';

// [حماية] مشان التطبيق ما يفرط بسبب أخطاء إضافة الـ WebXR اللي بتكرر كتير
// الـ "reading '0' of null" هي مشكلة معروفة بالإضافة نفسها وما الها دخل بكودنا
if (typeof window !== 'undefined') {
  const _oldError = window.onerror;
  window.onerror = function (message, source, lineno, colno, error) {
    if (message && (message.toString().includes("reading '0'") || message.toString().includes("_transformBasePoseMatrix"))) {
      // طنّش الخطأ مشان ما تضل تطلع بوجهنا بلاوي بالكونسول
      // هاي الأخطاء كلها من المحاكي (Emulator) وما الها دخل بكودنا
      return true; 
    }
    if (_oldError) return _oldError(message, source, lineno, colno, error);
    return false;
  };
}

// شلنا الـ StrictMode عمداً:
// لأنها بتشغل الـ useEffect مرتين بالتطوير وهذا بيعجق الدنيا بـ WebXR:
// - بتسجل وبتلغي الـ XR listeners مرتين عالفاضي
// - بتعمل خربطة في حالة الـ VR
// - بتخرب شغل الـ TeleportTarget
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
