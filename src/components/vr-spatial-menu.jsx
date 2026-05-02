import React, { useState, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Text, Edges } from '@react-three/drei';
import { Interactive } from '@react-three/xr';
import { useAppStore } from '../store/app-store';
import drugData from '../drug-data.json';

// ═══════════════════════════════════════════════════════════════════════
// ① CONSTANTS
// ═══════════════════════════════════════════════════════════════════════

const PANEL_W = 1.15;
const PANEL_H = 0.95;
const PANEL_POSITION = [-3.6, 1.4, -1.6];

const TAB_KEYS = ['General', 'Mechanism', 'Side Effects', 'Clinical'];

// ── Scratch Objects ────────────────────────────────────────────────────
const _targetQuaternion = new THREE.Quaternion();
const _dummyGroup = new THREE.Group();
const _vTargetScaleUI = new THREE.Vector3(1, 1, 1);

// ═══════════════════════════════════════════════════════════════════════
// زر التبويب - بيتفاعل مع ليزر الـ VR
function TabButton({ label, isActive, position, onSelect, color }) {
  const [hovered, setHovered] = useState(false);

  const bgColor     = isActive ? color : hovered ? '#1e3a6a' : '#111e3a';
  const borderColor = isActive ? '#ffffff' : '#2a3f6f';
  const textColor   = isActive ? '#ffffff' : '#93b4e8';

  return (
    <group position={position}>
      <Interactive
        onSelect={onSelect}
        onHover={() => setHovered(true)}
        onBlur={() => setHovered(false)}
      >
        <mesh>
          <boxGeometry args={[0.26, 0.08, 0.018]} />
          <meshBasicMaterial color={bgColor} />
          <Edges color={borderColor} />
        </mesh>
      </Interactive>
      <Text
        position={[0, 0, 0.013]}
        fontSize={0.030}
        color={textColor}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// المكون الأساسي للوحة
export default function VrSpatialMenu() {
  const isVrActive      = useAppStore((state) => state.isVrActive);
  const selectedModel   = useAppStore((state) => state.selectedModel);
  const isDnaMode       = useAppStore((state) => state.isDnaMode);
  const toggleDnaMode   = useAppStore((state) => state.toggleDnaMode);
  
  const [activeTab, setActiveTab] = useState('General');
  const panelRef = useRef();

  // بنجيب النص من ملف البيانات وبنرتبه مشان يوسع باللوحة
  const currentDrug = drugData['cisplatin'];
  const displayState = isDnaMode ? currentDrug.dnaState : currentDrug.baseState;

  // بنحدد النص حسب أي تبويب كبست
  let detailText = "";
  if (activeTab === 'General')       detailText = displayState.general;
  if (activeTab === 'Mechanism')     detailText = displayState.mechanism;
  if (activeTab === 'Side Effects')  detailText = displayState.sideEffects;
  if (activeTab === 'Clinical')      detailText = displayState.clinical;

  useFrame((state) => {
    if (!panelRef.current) return;
    const delta = state.delta || 0.016;
    panelRef.current.scale.lerp(_vTargetScaleUI, delta * 5.0);
    panelRef.current.position.y = 1.4 + Math.sin(state.clock.elapsedTime * 1.2) * 0.02;
    _dummyGroup.position.copy(panelRef.current.position);
    _dummyGroup.lookAt(state.camera.position);
    _targetQuaternion.copy(_dummyGroup.quaternion);
    panelRef.current.quaternion.slerp(_targetQuaternion, 0.05);
  });

  if (!isVrActive) return null;

  const isCisplatinSelected = selectedModel === 'cisplatin';
  const frameColor          = isCisplatinSelected ? '#5b9ef7' : '#ffffff';
  const titleColor          = isCisplatinSelected ? '#7db8ff' : '#ffffff';
  const separatorColor      = isCisplatinSelected ? '#5b9ef7' : '#2e5fa3';

  return (
    <group ref={panelRef} position={PANEL_POSITION} scale={0}>
      {/* الخلفية */}
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[PANEL_W, PANEL_H, 0.01]} />
        <meshBasicMaterial color="#08142b" transparent={true} opacity={0.95} />
        <Edges color={frameColor} />
      </mesh>

      {/* العنوان */}
      <Text position={[-0.50, 0.36, 0.015]} fontSize={0.055} color={titleColor} anchorX="left" anchorY="middle" fontWeight="bold">
        {currentDrug.name}
      </Text>

      {isCisplatinSelected && (
        <Text position={[0.50, 0.36, 0.015]} fontSize={0.022} color="#5b9ef7" anchorX="right" anchorY="middle">
          ● ACTIVE
        </Text>
      )}

      {/* التفاصيل اللي فوق */}
      <Text position={[-0.50, 0.25, 0.015]} fontSize={0.032} color="#93b4e8" anchorX="left" anchorY="middle">
        {currentDrug.formula}  |  {currentDrug.weight}
      </Text>

      {/* خط بالنص */}
      <mesh position={[0, 0.20, 0]}>
        <boxGeometry args={[PANEL_W - 0.1, 0.003, 0.001]} />
        <meshBasicMaterial color={separatorColor} />
      </mesh>

      {/* المحتوى حسب التبويب - نص مرتب */}
      <group position={[-0.50, 0.12, 0.015]}>
        <Text fontSize={0.038} color="#5b9ef7" anchorX="left" anchorY="top" fontWeight="bold">
          {activeTab.toUpperCase()}
        </Text>
        <Text 
          position={[0, -0.06, 0]} 
          fontSize={0.027} 
          color="#ffffff" 
          anchorX="left" 
          anchorY="top" 
          maxWidth={1.05}
          lineHeight={1.4}
        >
          {detailText}
        </Text>
      </group>

      {/* الكبسات اللي تحت */}
      {TAB_KEYS.map((key, i) => (
        <TabButton
          key={key}
          label={key}
          isActive={activeTab === key}
          position={[-0.405 + i * 0.27, -0.40, 0.01]}
          onSelect={() => setActiveTab(key)}
          color="#2e5fa3"
        />
      ))}

      {/* كبسة عرض الـ DNA */}
      <group position={[0.38, 0.31, 0.015]}>
        <Interactive onSelect={toggleDnaMode}>
          <mesh>
            <boxGeometry args={[0.36, 0.08, 0.015]} />
            <meshBasicMaterial color={isDnaMode ? '#1e3a8a' : '#0f172a'} />
            <Edges color={'#38bdf8'} />
          </mesh>
        </Interactive>
        <Text position={[0, 0, 0.01]} fontSize={0.030} color={'#ffffff'} anchorX="center" anchorY="middle" fontWeight="bold">
          🧬 DNA View
        </Text>
      </group>
    </group>
  );
}
