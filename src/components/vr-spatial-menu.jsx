import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import { Interactive } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// ═══════════════════════════════════════════════════════════════════════
// ① CONSTANTS — بيانات التبويبات (Cisplatin)
// ═══════════════════════════════════════════════════════════════════════

const TABS = {
  general: {
    label: 'General',
    lines: [
      { text: 'Class:  Platinum-based antineoplastic', color: '#ffffff' },
      { text: 'Metal:  Pt(II)  |  d8 square planar',  color: '#ffffff' },
      { text: 'Formula:  PtCl2(NH3)2',                color: '#ffffff' },
      { text: 'MW:  300.05 g/mol',                    color: '#ffffff' },
      { text: 'Route:  IV infusion',                   color: '#ffffff' },
    ],
  },
  mechanism: {
    label: 'Mechanism',
    lines: [
      { text: '1.  Entry via CTR1 transporter',        color: '#ffffff' },
      { text: '2.  Cl- replaced by H2O (Aquation)',    color: '#ffffff' },
      { text: '3.  Binds N7 of guanine on DNA',        color: '#ffffff' },
      { text: '4.  Forms intrastrand crosslinks',       color: '#ffffff' },
      { text: '5.  Replication block -> Apoptosis',    color: '#ffffff' },
    ],
  },
  adverse: {
    label: 'Adverse Effects',
    lines: [
      { text: '[HIGH]  Nephrotoxicity (dose-limiting)', color: '#e87575' },
      { text: '[HIGH]  Nausea & Vomiting',              color: '#e87575' },
      { text: '[MOD]   Ototoxicity',                    color: '#e8c475' },
      { text: '[MOD]   Peripheral Neuropathy',          color: '#e8c475' },
      { text: 'Hydration: 1-2 L NS before & after',    color: '#93b4e8' },
    ],
  },
  clinical: {
    label: 'Clinical',
    lines: [
      { text: '● Testicular Cancer (Gold Standard)',    color: '#ffffff' },
      { text: '● Advanced Ovarian Cancer',             color: '#ffffff' },
      { text: '● Bladder & Cervical Cancers',           color: '#ffffff' },
      { text: '● Head and Neck Squamous Cell Ca',       color: '#ffffff' },
      { text: 'Note: Often used in BEP/EP regimens',   color: '#93b4e8' },
    ],
  },
};

const TAB_KEYS = ['general', 'mechanism', 'adverse', 'clinical'];

// أبعاد اللوحة - تم الضبط للراحة البصرية ومنع التداخل (W: 1.15m, H: 0.95m)
const PANEL_W = 1.15;
const PANEL_H = 0.95;

// موقع المرساة: متماثل مع لوحة Oxaliplatin على اليمين [1.8, 1.4, -1.5]
// X = -1.8 يضعها خارج النموذج بـ 0.6 متر (|-1.2| + 0.6)
// Z = -1.5 نفس عمق اللوحة اليمنى لضمان التماثل البصري
// مُبعَدة للخلف (Z=-2.0) وللجانب (X=-2.2) لمنع حافة الـ Billboard
// من الاقتراب والتداخل مع النموذج عند X=-1.0 عند الدوران نحو المستخدم
// محطة Cisplatin — الجدار الأيسر
// تم الضبط رياضياً: المحطة عند X=-3.0، النموذج عند X=-2.4، اللوحة عند X=-3.6
const PANEL_POSITION = [-3.6, 1.4, -1.6];

// ═══════════════════════════════════════════════════════════════════════
// زر التبويب — Interactive للـ VR laser، onHover للـ desktop
// ═══════════════════════════════════════════════════════════════════════
function TabButton({ label, isActive, position, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const bgColor     = isActive ? '#2e5fa3' : hovered ? '#1e3a6a' : '#111e3a';
  const borderColor = isActive ? '#5b9ef7' : '#2a3f6f';
  const textColor   = isActive ? '#ffffff' : '#93b4e8';

  return (
    <group position={position}>
      <Interactive
        onSelect={onSelect}
        onHover={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <mesh>
          <boxGeometry args={[0.24, 0.08, 0.018]} />
          <meshBasicMaterial color={bgColor} />
          <Edges color={borderColor} />
        </mesh>
      </Interactive>



      <Text
        position={[0, 0, 0.013]}
        fontSize={0.032}
        color={textColor}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// محتوى التبويب النشط
// المسافة الأفقية مُكبَّرة من 0.1 إلى 0.115 لمنع تداخل الأسطر المكسورة
// fontSize مُصغَّر من 0.03 إلى 0.026 لاستيعاب النصوص الطويلة بأمان
// ═══════════════════════════════════════════════════════════════════════
function TabContent({ tabKey }) {
  const lines = TABS[tabKey].lines;

  return (
    <group>
      {lines.map((line, index) => (
        <Text
          key={index}
          position={[-0.50, 0.12 - (index * 0.105), 0.015]} 
          fontSize={0.038} 
          color={line.color || '#ffffff'}
          anchorX="left"
          anchorY="top"
          maxWidth={1.05}
        >
          {line.text}
        </Text>
      ))}
    </group>
  );
}

// ── Scratch Objects ────────────────────────────────────────────────────
const _targetQuaternion = new THREE.Quaternion();
const _dummyGroup = new THREE.Group();

// ═══════════════════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════════════════
export default function VrSpatialMenu() {
  const isVrActive      = useAppStore((state) => state.isVrActive);
  const selectedModel   = useAppStore((state) => state.selectedModel);
  const isDnaMode       = useAppStore((state) => state.isDnaMode);
  const toggleDnaMode   = useAppStore((state) => state.toggleDnaMode);
  const [activeTab, setActiveTab] = useState('general');

  const panelRef = useRef();

  // ═══════════════════════════════════════════════════════════════════
  // المنطق الذكي للوحة (حركة الطفو + الدوران الناعم)
  // ═══════════════════════════════════════════════════════════════════
  useFrame((state) => {
    if (!panelRef.current) return;

    // 1. حركة الطفو (Hover) - تجعل اللوحة تتنفس بارتفاع 2 سم
    panelRef.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 1.2) * 0.02;

    // 2. الدوران الناعم (Lazy Rotation) - تواجه المستخدم بنعومة (Damping)
    _dummyGroup.position.copy(panelRef.current.position);
    _dummyGroup.lookAt(state.camera.position);
    _targetQuaternion.copy(_dummyGroup.quaternion);

    // slerp يعطي ملمساً فاخراً (Premium Feel) بجعل الدوران يتأخر قليلاً عن حركة الرأس
    panelRef.current.quaternion.slerp(_targetQuaternion, 0.05);
  });

  if (!isVrActive) return null;

  const isCisplatinSelected = selectedModel === 'cisplatin';
  const frameColor          = isCisplatinSelected ? '#5b9ef7' : '#ffffff';
  const titleColor          = isCisplatinSelected ? '#7db8ff' : '#ffffff';
  const separatorColor      = isCisplatinSelected ? '#5b9ef7' : '#2e5fa3';

  return (
    <group ref={panelRef} position={PANEL_POSITION}>

      {/* الخلفية الرئيسية - مادة هولوغرافية شفافة */}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.01]} />
        <meshBasicMaterial color="#08142b" transparent={true} opacity={0.95} />
        <Edges color={frameColor} />
      </mesh>





      {/* خط فاصل تحت الرأس */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[PANEL_W, 0.003, 0.001]} />
        <meshBasicMaterial color={separatorColor} />
      </mesh>

      {/*
        العنوان مثبَّت في الزاوية اليسرى (anchorX="left", X=-0.42)
        والمؤشر في الزاوية اليمنى (anchorX="right", X=+0.42)
        — يمنع التداخل بينهما مهما كان حجم الخط.
      */}
      <Text
        position={[-0.50, 0.36, 0.015]}
        fontSize={0.07}
        color={titleColor}
        anchorX="left"
        anchorY="middle"
        fontWeight="bold"
      >
        Cisplatin
      </Text>

      {isCisplatinSelected && (
        <Text
          position={[0.50, 0.36, 0.015]}
          fontSize={0.022}
          color="#5b9ef7"
          anchorX="right"
          anchorY="middle"
        >
          ● ACTIVE
        </Text>
      )}

      {/*
        سطر التفاصيل مُنزَّل إلى Y=0.23 (كان 0.24)
        ليبتعد عن الخط الفاصل عند Y=0.22 بمسافة 0.01م كافية.
      */}
      {/* سطر التفاصيل - مرفوع للأعلى قليلاً لتجنب الخط الفاصل */}
      <Text
        position={[-0.50, 0.25, 0.015]}
        fontSize={0.032}
        color="#93b4e8"
        anchorX="left"
        anchorY="middle"
      >
        cis-PtCl2(NH3)2  |  300.05 g/mol
      </Text>

      {/* زر التبديل المطور لوضع الـ DNA - تصميم أنيق (Premium) */}
      <group position={[0.38, 0.31, 0.015]}>
        <Interactive onSelect={toggleDnaMode}>
          <mesh>
            <boxGeometry args={[0.36, 0.08, 0.015]} />
            <meshBasicMaterial color={isDnaMode ? '#1e3a8a' : '#0f172a'} />
            <Edges color={'#38bdf8'} />
          </mesh>
        </Interactive>
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.030}
          color={'#ffffff'}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          🧬 DNA View
        </Text>
      </group>

      {/* محتوى التبويب */}
      <TabContent tabKey={activeTab} />

      {/* أزرار التبويب - تم التوزيع بمسافات متناسقة مع عرض 1.15 */}
      {TAB_KEYS.map((key, i) => (
        <TabButton
          key={key}
          label={TABS[key].label}
          isActive={activeTab === key}
          position={[-0.39 + i * 0.26, -0.40, 0.01]}
          onSelect={() => setActiveTab(key)}
        />
      ))}

    </group>
  );
}
