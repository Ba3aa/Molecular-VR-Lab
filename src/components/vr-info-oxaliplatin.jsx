import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import { Interactive } from '@react-three/xr';
import { useAppStore } from '../store/app-store';

// ═══════════════════════════════════════════════════════════════════════
// ① CONSTANTS — بيانات التبويبات (Oxaliplatin)
// ═══════════════════════════════════════════════════════════════════════

const TABS = {
  general: {
    label: 'General',
    lines: [
      { text: 'Generation:  3rd-gen platinum complex',      color: '#ffffff' },
      { text: 'Carrier:  DACH (diaminocyclohexane)',        color: '#ffffff' },
      { text: 'Leaving group:  Oxalate',                    color: '#ffffff' },
      { text: 'Metal center:  Pt(II)  |  Square planar',    color: '#ffffff' },
      { text: 'Key edge: DACH adducts escape MMR',          color: '#5DCAA5' },
    ],
  },
  mechanism: {
    label: 'Mechanism',
    lines: [
      { text: '1. Entry via CTR1 and OCT2 transporters',    color: '#ffffff' },
      { text: '2. Aquation: Oxalate displaced by H2O',      color: '#ffffff' },
      { text: '3. Bulky DACH-Pt-DNA adduct formation',      color: '#ffffff' },
      { text: '4. MMR evasion vs. cisplatin resistance',    color: '#ffffff' },
      { text: '5. Replication block -> Apoptosis',          color: '#ffffff' },
    ],
  },
  adverse: {
    label: 'Side Effects',
    lines: [
      { text: '[HALLMARK]  Peripheral neuropathy',          color: '#e87575' },
      { text: '  Acute cold-triggered dysesthesia',         color: '#e87575' },
      { text: '[MOD]  Myelosuppression',                    color: '#e8c475' },
      { text: '[LOW]  Nephrotoxicity vs. cisplatin',        color: '#93d4b8' },
      { text: 'PEARL: D5W only — NO NaCl diluent',          color: '#5DCAA5' },
    ],
  },
  clinical: {
    label: 'Clinical',
    lines: [
      { text: '● Colorectal Cancer (FOLFOX)',              color: '#ffffff' },
      { text: '● Adjuvant Stage III Colon Ca',             color: '#ffffff' },
      { text: '● Advanced Gastric Adenocarcinoma',          color: '#ffffff' },
      { text: '● Pancreatic Cancer (FOLFIRINOX)',          color: '#ffffff' },
      { text: 'Synergy: Combined with 5-FU/LV',            color: '#5DCAA5' },
    ],
  },
};

const TAB_KEYS = ['general', 'mechanism', 'adverse', 'clinical'];

// أبعاد اللوحة - تم الضبط للراحة البصرية ومنع التداخل (W: 1.15m, H: 0.95m)
const PANEL_W = 1.15;
const PANEL_H = 0.95;

// موقع المرساة: متماثل مع لوحة Cisplatin على اليسار [-1.8, 1.4, -1.5]
// X = +1.8 = موقع Oxaliplatin (1.2) + 0.6م فاصل
// Z = -1.5 نفس عمق اللوحة اليسرى تماماً
// مُبعَدة للخلف (Z=-2.0) وللجانب (X=+2.2) — متماثلة مع لوحة Cisplatin
// لمنع حافة الـ Billboard من التداخل مع النموذج عند X=+1.0
// محطة Oxaliplatin — الجدار الأيمن
// تم الضبط رياضياً: المحطة عند X=+3.0، النموذج عند X=+2.4، اللوحة عند X=+3.6
const PANEL_POSITION = [3.6, 1.4, -1.6];

// ═══════════════════════════════════════════════════════════════════════
// زر التبويب — Interactive للـ VR laser، onHover للـ desktop
// ═══════════════════════════════════════════════════════════════════════
function TabButton({ label, isActive, position, onSelect }) {
  const [hovered, setHovered] = useState(false);

  const bgColor     = isActive ? '#1a6b5a' : hovered ? '#0f4a3d' : '#0a2e28';
  const borderColor = isActive ? '#5DCAA5' : '#1a4a40';
  const textColor   = isActive ? '#ffffff' : '#5DCAA5';

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
// المسافة مُكبَّرة من 0.1 إلى 0.115 — تمنع تداخل أي سطر مكسور مع التالي
// fontSize مُصغَّر إلى 0.026 — النصوص الطويلة تبقى على سطر واحد بأمان
// النصوص في adverse مُقصَّرة أيضاً لمنع الكسر التلقائي
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
export default function VrInfoOxaliplatin() {
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

    // slerp يجعل الدوران "كسولاً" يتبع حركة الرأس بفخامة
    panelRef.current.quaternion.slerp(_targetQuaternion, 0.05);
  });

  if (!isVrActive) return null;

  const isOxaliSelected = selectedModel === 'oxaliplatin';
  const titleColor      = isOxaliSelected ? '#7fffda' : '#ffffff';

  return (
    <group ref={panelRef} position={PANEL_POSITION}>

      {/* الخلفية الرئيسية - مادة هولوغرافية شفافة */}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.01]} />
        <meshBasicMaterial color="#061c19" transparent={true} opacity={0.95} />
        <Edges color="#5DCAA5" />
      </mesh>





      {/* خط فاصل */}
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[PANEL_W, 0.003, 0.001]} />
        <meshBasicMaterial color="#5DCAA5" />
      </mesh>

      {/*
        العنوان مثبَّت في الزاوية اليسرى (anchorX="left", X=-0.42)
        والمؤشر في الزاوية اليمنى (anchorX="right", X=+0.42)
        — يضمن فصلاً كاملاً بينهما بغض النظر عن طول الكلمة.
      */}
      <Text
        position={[-0.50, 0.36, 0.015]}
        fontSize={0.065}
        color={titleColor}
        anchorX="left"
        anchorY="middle"
        fontWeight="bold"
      >
        Oxaliplatin
      </Text>

      {isOxaliSelected && (
        <Text
          position={[0.50, 0.36, 0.015]}
          fontSize={0.022}
          color="#5DCAA5"
          anchorX="right"
          anchorY="middle"
        >
          ● ACTIVE
        </Text>
      )}

      {/*
        سطر التفاصيل عند Y=0.23 — يبتعد عن الخط الفاصل (Y=0.22)
        بمسافة 0.01م بدلاً من 0.04م السابقة التي كانت داخل شريط الرأس.
      */}
      {/* سطر التفاصيل - محاذى لليسار ومرفوع عن الخط الفاصل */}
      <Text
        position={[-0.50, 0.25, 0.015]}
        fontSize={0.032}
        color="#5DCAA5"
        anchorX="left"
        anchorY="middle"
      >
        3rd-gen platinum agent  |  MW: 397.3 g/mol
      </Text>

      {/* زر التبديل المطور لوضع الـ DNA - تصميم أنيق (Premium) */}
      <group position={[0.38, 0.31, 0.015]}>
        <Interactive onSelect={toggleDnaMode}>
          <mesh>
            <boxGeometry args={[0.36, 0.08, 0.015]} />
            <meshBasicMaterial color={isDnaMode ? '#064e3b' : '#022c22'} />
            <Edges color={'#34d399'} />
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
