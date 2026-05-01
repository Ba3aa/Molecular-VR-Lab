import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';

// StrictMode مُزالة بشكل مقصود:
// تُشغِّل useEffect مرتين في development مما يُسبِّب:
// - تسجيل/إلغاء XR session listeners مرتين
// - race condition في setVrActive
// - انهيار منطق TeleportTarget
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
