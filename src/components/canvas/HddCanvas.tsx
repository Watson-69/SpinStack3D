import React, { useRef, Suspense, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, Lightformer, Grid } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { HddModel } from './HddModel';
import { CameraController } from './CameraController';
import { ExplodedGuides } from './ExplodedGuides';
import { CalloutSystem } from './CalloutSystem';
import { ViewportHud } from '../ui/ViewportHud';
import { useHddStore, CAMERA_PRESETS, KnockoutTheme } from '../../store/useHddStore';

interface ScenePalette {
  bg: string;
  fog: string;
  ambientColor: string;
  ambientIntensity: number;
  rimColor: string;
  rimIntensity: number;
  cellColor: string;
  sectionColor: string;
  shadowColor: string;
  shadowOpacity: number;
}

const SCENE_THEME_PALETTES: Record<KnockoutTheme, ScenePalette> = {
  dark: {
    bg: '#070707',
    fog: '#070707',
    ambientColor: '#f5efe9',
    ambientIntensity: 0.72,
    rimColor: '#ff6255',
    rimIntensity: 0.65,
    cellColor: '#25201f',
    sectionColor: '#4b4240',
    shadowColor: '#000000',
    shadowOpacity: 0.72,
  },
  light: {
    bg: '#e4d6cf',
    fog: '#e4d6cf',
    ambientColor: '#fff9f5',
    ambientIntensity: 0.88,
    rimColor: '#bb1815',
    rimIntensity: 0.35,
    cellColor: '#cabbb3',
    sectionColor: '#96867f',
    shadowColor: '#2b211e',
    shadowOpacity: 0.42,
  },
  signal: {
    bg: '#b91612',
    fog: '#b91612',
    ambientColor: '#fff5f0',
    ambientIntensity: 0.78,
    rimColor: '#fff0eb',
    rimIntensity: 0.75,
    cellColor: '#df6f60',
    sectionColor: '#fff0eb',
    shadowColor: '#2d0605',
    shadowOpacity: 0.62,
  },
};

const HERO_PRESET = CAMERA_PRESETS.isometric;

/** Triggers on-demand Canvas re-renders whenever reactive state changes. */
const SceneInvalidator: React.FC = () => {
  const { invalidate } = useThree();
  const theme = useHddStore((s) => s.theme);
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const hoveredPartId = useHddStore((s) => s.hoveredPartId);
  const explodedProgress = useHddStore((s) => s.explodedProgress);
  const isXRayMode = useHddStore((s) => s.isXRayMode);
  const isSimulating = useHddStore((s) => s.isSimulating);
  const rpm = useHddStore((s) => s.rpm);
  const showCalloutPins = useHddStore((s) => s.showCalloutPins);
  const activeCameraPreset = useHddStore((s) => s.activeCameraPreset);

  useEffect(() => {
    invalidate();
  }, [
    theme,
    selectedPartId,
    hoveredPartId,
    explodedProgress,
    isXRayMode,
    isSimulating,
    rpm,
    showCalloutPins,
    activeCameraPreset,
    invalidate,
  ]);

  return null;
};

export const HddCanvas: React.FC = () => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const setSelectedPartId = useHddStore((s) => s.setSelectedPartId);
  const theme = useHddStore((s) => s.theme);
  const palette = SCENE_THEME_PALETTES[theme];

  return (
    <div className="relative w-full h-full bg-[var(--canvas-bg)] overflow-hidden select-none">
      <ViewportHud />

      <Canvas
        frameloop="demand"
        shadows
        dpr={[1, 1.5]}
        camera={{
          position: HERO_PRESET.position,
          fov: HERO_PRESET.fov,
          near: 0.1,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.94,
        }}
        onPointerMissed={(e) => {
          if (e && (e.target as HTMLElement)?.tagName !== 'CANVAS') return;
          setSelectedPartId(null);
        }}
      >
        <SceneInvalidator />
        <color attach="background" args={[palette.bg]} />
        <fog attach="fog" args={[palette.fog, 12, 32]} />

        {/* Cleanroom Studio Illumination */}
        <ambientLight intensity={palette.ambientIntensity} color={palette.ambientColor} />

        {/* Key Directional Light (1024 shadow map keeps frame time lean) */}
        <directionalLight
          position={[6, 8, 5]}
          intensity={1.32}
          color="#ffffff"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-bias={-0.0002}
        />

        {/* Editorial Rim Accent Light */}
        <directionalLight
          position={[-6, 4, -5]}
          intensity={palette.rimIntensity}
          color={palette.rimColor}
        />

        {/* Warm Amber Fill Light for Copper Coils & Bearings */}
        <directionalLight position={[0, -4, 5]} intensity={0.42} color="#f59e0b" />

        {/* Soft Diffuse Top Fill */}
        <pointLight position={[1, 5, 2]} intensity={0.24} color="#fff7ed" />

        <Suspense fallback={null}>
          {/* Procedural Offline Studio Environment (zero external HDRI fetches) */}
          <Environment resolution={128} frames={1} environmentIntensity={0.58}>
            <Lightformer
              form="rect"
              intensity={2.2}
              color="#ffffff"
              scale={[10, 10, 1]}
              position={[0, 6, 0]}
              rotation={[Math.PI / 2, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={1.6}
              color="#f8fafc"
              scale={[8, 4, 1]}
              position={[6, 3, 4]}
              target={[0, 0, 0]}
            />
            <Lightformer
              form="rect"
              intensity={1.2}
              color="#ffe4dc"
              scale={[8, 4, 1]}
              position={[-6, 2, -4]}
              target={[0, 0, 0]}
            />
          </Environment>

          <HddModel />
          <ExplodedGuides />
          <CalloutSystem />

          {/* Baked static contact shadow (frames=1 eliminates per-frame 1024px blur passes) */}
          <ContactShadows
            key={theme}
            frames={1}
            position={[0, -0.65, 0]}
            opacity={palette.shadowOpacity}
            scale={12}
            blur={2.2}
            far={4}
            resolution={256}
            color={palette.shadowColor}
          />

          <Grid
            position={[0, -0.66, 0]}
            args={[24, 24]}
            cellSize={0.4}
            cellThickness={0.8}
            cellColor={palette.cellColor}
            sectionSize={2.0}
            sectionThickness={1.2}
            sectionColor={palette.sectionColor}
            fadeDistance={18}
            fadeStrength={1.5}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={1.2}
          maxDistance={14.0}
          maxPolarAngle={Math.PI / 2 + 0.25}
          panSpeed={0.8}
          rotateSpeed={0.8}
        />

        <CameraController controlsRef={controlsRef} />
      </Canvas>
    </div>
  );
};
