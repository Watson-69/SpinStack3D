import React, { useRef, useMemo, useEffect, Component, ErrorInfo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useHddStore } from '../../store/useHddStore';
import { isInternalPartId } from '../../data/hddParts';
import { easeInOutCubic } from '../../utils/math';
import { createHddCoverDecalTexture } from './hddTextures';
import { hddPartRegistry } from './partRegistry';
import { sound } from '../../utils/sound';
import {
  MM_TO_SCENE,
  HDD_MODEL_URL,
  DRACO_DECODER_PATH,
  PLATTER_ROTATION_KEYS,
  ACTUATOR_SEEK_KEYS,
  buildHddComponentMap,
  syncComponentMaterials,
  resolvePointerPartId,
} from './hddModelUtils';

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}

class ModelErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.warn('GLTF Model load error, activating procedural fallback:', error, info);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/**
 * Detailed 3.5-inch Enterprise HDD Model Loader & On-Demand Mechanical Animator.
 */
const DetailedHddInternals: React.FC = () => {
  const { invalidate } = useThree();
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const hoveredPartId = useHddStore((s) => s.hoveredPartId);
  const isXRayMode = useHddStore((s) => s.isXRayMode);
  const isSimulating = useHddStore((s) => s.isSimulating);
  const rpm = useHddStore((s) => s.rpm);
  const isCoverClosed = useHddStore((s) => s.explodedProgress < 0.35);
  const setSelectedPartId = useHddStore((s) => s.setSelectedPartId);
  const setHoveredPartId = useHddStore((s) => s.setHoveredPartId);

  const shouldGhostCover = isXRayMode || (isInternalPartId(selectedPartId) && isCoverClosed);

  const gltf = useGLTF(HDD_MODEL_URL, DRACO_DECODER_PATH);
  const rootScene = gltf.scene;

  const coverDecal = useMemo(() => createHddCoverDecalTexture(), []);
  const { map: componentMap, dispose: disposeMaterials } = useMemo(
    () => buildHddComponentMap(rootScene),
    [rootScene]
  );

  // Cache local anchors once after mount and notify demand frameloop
  useEffect(() => {
    rootScene.updateMatrixWorld(true);
    hddPartRegistry.precomputeLocalAnchors();
    invalidate();
  }, [rootScene, componentMap, invalidate]);

  // Reusable outline edges geometry for selected Top Cover
  const topCoverEdgesGeo = useMemo(() => {
    const box = new THREE.BoxGeometry(101.6, 2.0, 147.0);
    const edges = new THREE.EdgesGeometry(box);
    box.dispose();
    return edges;
  }, []);

  useEffect(() => {
    return () => {
      coverDecal.dispose();
      topCoverEdgesGeo.dispose();
      disposeMaterials();
      document.body.style.cursor = 'auto';
    };
  }, [coverDecal, topCoverEdgesGeo, disposeMaterials]);

  useEffect(() => {
    syncComponentMaterials(componentMap, {
      selectedPartId,
      hoveredPartId,
      isXRayMode,
      shouldGhostCover,
    });
    invalidate();
  }, [componentMap, selectedPartId, hoveredPartId, isXRayMode, shouldGhostCover, invalidate]);

  useEffect(() => {
    sound.updateSpindleMotor(isSimulating, rpm);
  }, [isSimulating, rpm]);

  const decalRef = useRef<THREE.Mesh>(null);
  const seekTargetAngle = useRef(0);
  const currentSeekAngle = useRef(-0.34);
  const seekTimer = useRef(0);
  const lastClickTime = useRef(0);
  const needsInitialMatrixSync = useRef(true);

  useFrame((state, rawDelta) => {
    const storeState = useHddStore.getState();
    if (!storeState.isInitialized) return;

    const delta = Math.min(rawDelta, 0.05);
    const { explodedProgress, isSimulating: simActive, rpm: currentRpm } = storeState;

    let anyTransformChanged = needsInitialMatrixSync.current;
    let stillAnimating = false;
    needsInitialMatrixSync.current = false;

    // 1. Interpolate each component between restPosition and explodeOffset
    componentMap.forEach((comp) => {
      const [start, end] = comp.staggerWindow;
      const t =
        explodedProgress > start
          ? Math.min(1, (explodedProgress - start) / (end - start))
          : 0;
      const easedT = easeInOutCubic(t);

      const targetX = comp.restPosition.x + comp.explodeOffset.x * easedT;
      const targetY = comp.restPosition.y + comp.explodeOffset.y * easedT;
      const targetZ = comp.restPosition.z + comp.explodeOffset.z * easedT;

      if (
        Math.abs(comp.object.position.x - targetX) > 1e-4 ||
        Math.abs(comp.object.position.y - targetY) > 1e-4 ||
        Math.abs(comp.object.position.z - targetZ) > 1e-4
      ) {
        comp.object.position.x = THREE.MathUtils.damp(comp.object.position.x, targetX, 10, delta);
        comp.object.position.y = THREE.MathUtils.damp(comp.object.position.y, targetY, 10, delta);
        comp.object.position.z = THREE.MathUtils.damp(comp.object.position.z, targetZ, 10, delta);
        comp.object.updateMatrixWorld();
        anyTransformChanged = true;
        stillAnimating = true;
      } else if (
        comp.object.position.x !== targetX ||
        comp.object.position.y !== targetY ||
        comp.object.position.z !== targetZ
      ) {
        comp.object.position.set(targetX, targetY, targetZ);
        comp.object.updateMatrixWorld();
        anyTransformChanged = true;
      }
    });

    // 2. Track top cover position and ghost opacity for decal specification plate
    const topCover = componentMap.get('Top_Cover');
    if (topCover && decalRef.current) {
      const coverY = topCover.object.position.y + 1.1;
      if (
        decalRef.current.position.x !== topCover.object.position.x ||
        decalRef.current.position.y !== coverY ||
        decalRef.current.position.z !== topCover.object.position.z
      ) {
        decalRef.current.position.set(
          topCover.object.position.x,
          coverY,
          topCover.object.position.z
        );
      }

      const decalMat = decalRef.current.material as THREE.MeshStandardMaterial | undefined;
      if (decalMat) {
        const targetOpacity =
          isInternalPartId(storeState.selectedPartId) && explodedProgress < 0.35 ? 0.08 : 1.0;
        if (Math.abs(decalMat.opacity - targetOpacity) > 1e-3) {
          decalMat.opacity = THREE.MathUtils.damp(decalMat.opacity, targetOpacity, 10, delta);
          stillAnimating = true;
        }
      }
    }

    // 3. Mechanical 7,200 RPM rotation for Platters & Spindle Hub
    if (simActive && currentRpm > 0) {
      const rotStep = (currentRpm / 60) * Math.PI * 2 * delta;
      for (let i = 0; i < PLATTER_ROTATION_KEYS.length; i++) {
        const comp = componentMap.get(PLATTER_ROTATION_KEYS[i]);
        if (comp) {
          comp.object.rotation.y += rotStep;
          comp.object.updateMatrixWorld();
          anyTransformChanged = true;
        }
      }
      stillAnimating = true;
    }

    // 4. Actuator Seek Movement
    if (simActive && currentRpm > 0) {
      seekTimer.current -= delta;
      if (seekTimer.current <= 0) {
        seekTargetAngle.current = -0.26 + Math.random() * 0.44;
        seekTimer.current = 0.08 + Math.random() * 0.26;

        const now = performance.now();
        if (now - lastClickTime.current > 120 && Math.random() > 0.3) {
          sound.playSeekClick();
          lastClickTime.current = now;
        }
      }
      const jitter = (Math.random() - 0.5) * 0.003;
      currentSeekAngle.current = THREE.MathUtils.damp(
        currentSeekAngle.current,
        seekTargetAngle.current + jitter,
        16,
        delta
      );
      anyTransformChanged = true;
      stillAnimating = true;
    } else if (Math.abs(currentSeekAngle.current - -0.34) > 1e-4) {
      currentSeekAngle.current = THREE.MathUtils.damp(
        currentSeekAngle.current,
        -0.34,
        6,
        delta
      );
      anyTransformChanged = true;
      stillAnimating = true;
    }

    if (anyTransformChanged) {
      for (let i = 0; i < ACTUATOR_SEEK_KEYS.length; i++) {
        const comp = componentMap.get(ACTUATOR_SEEK_KEYS[i]);
        if (comp) {
          comp.object.rotation.y = currentSeekAngle.current;
          comp.object.updateMatrixWorld();
        }
      }
    }

    if (stillAnimating) {
      state.invalidate();
    }
  });

  const pickPartFromPointerEvent = (e: {
    intersections?: ReadonlyArray<{ object: THREE.Object3D }>;
    object: THREE.Object3D;
  }) =>
    resolvePointerPartId(
      e.intersections,
      e.object,
      rootScene,
      decalRef.current,
      componentMap,
      shouldGhostCover
    );

  return (
    <group
      scale={[MM_TO_SCENE, MM_TO_SCENE, MM_TO_SCENE]}
      onClick={(e) => {
        e.stopPropagation();
        const matchedPartId = pickPartFromPointerEvent(e);
        if (matchedPartId) {
          setSelectedPartId(matchedPartId);
          sound.playUiClick(980, 0.04);
        }
      }}
      onPointerOver={(e) => {
        // Skip expensive hover state transitions while mouse-dragging OrbitControls
        if (e.buttons !== 0) return;
        e.stopPropagation();
        const matchedPartId = pickPartFromPointerEvent(e);
        if (matchedPartId && useHddStore.getState().hoveredPartId !== matchedPartId) {
          setHoveredPartId(matchedPartId);
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        if (useHddStore.getState().hoveredPartId !== null) {
          setHoveredPartId(null);
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <primitive object={rootScene} />

      {!isXRayMode && (
        <mesh ref={decalRef} position={[0, 10.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[84.0, 116.0]} />
          <meshStandardMaterial
            map={coverDecal}
            roughness={0.92}
            metalness={0.01}
            envMapIntensity={0.15}
            transparent
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      )}

      {selectedPartId === 'top_cover' && (
        <lineSegments position={[0, 9.6, 0]} geometry={topCoverEdgesGeo}>
          <lineBasicMaterial color="#ff6255" linewidth={2} />
        </lineSegments>
      )}
    </group>
  );
};

const SimplifiedHddFallback: React.FC = () => (
  <group position={[0, 0, 0]}>
    <mesh position={[0, -0.32, 0]}>
      <boxGeometry args={[4.2, 0.65, 2.9]} />
      <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
    </mesh>
    <mesh position={[0.6, 0.1, 0]}>
      <cylinderGeometry args={[1.3, 1.3, 0.1, 32]} />
      <meshStandardMaterial color="#e2e8f0" metalness={0.98} roughness={0.05} />
    </mesh>
  </group>
);

export const HddModel: React.FC = () => {
  return (
    <ModelErrorBoundary fallback={<SimplifiedHddFallback />}>
      <DetailedHddInternals />
    </ModelErrorBoundary>
  );
};
