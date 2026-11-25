import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useHddStore, KnockoutTheme } from '../../store/useHddStore';
import { HDD_PARTS } from '../../data/hddParts';

const GUIDE_PARTS = HDD_PARTS.filter((part) => Math.abs(part.explodedOffset[1]) >= 0.4);

const GUIDE_COLORS: Record<KnockoutTheme, string> = {
  dark: '#ff6255',
  light: '#bb1815',
  signal: '#fff0eb',
};

/**
 * Renders vertical dashed blueprint axis lines and datum rings synced to the active Knockout theme.
 */
export const ExplodedGuides: React.FC = () => {
  const { invalidate } = useThree();
  const isVisible = useHddStore((s) => s.explodedProgress >= 0.15);
  const theme = useHddStore((s) => s.theme);
  const guideColor = GUIDE_COLORS[theme];

  const lineRefs = useRef<(THREE.Line | null)[]>([]);
  const ringMatRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const sharedRingGeo = useMemo(() => new THREE.RingGeometry(0.04, 0.07, 16), []);
  const unitLineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
    ]);
  }, []);

  const lineObjects = useMemo(() => {
    return GUIDE_PARTS.map(() => {
      const mat = new THREE.LineDashedMaterial({
        color: '#ff6255',
        dashSize: 0.1,
        gapSize: 0.08,
        transparent: true,
        opacity: 0,
      });
      const line = new THREE.Line(unitLineGeo, mat);
      line.computeLineDistances();
      return { line, mat };
    });
  }, [unitLineGeo]);

  useEffect(() => {
    lineObjects.forEach(({ mat }) => {
      mat.color.set(guideColor);
    });
    invalidate();
  }, [guideColor, lineObjects, invalidate]);

  useEffect(() => {
    return () => {
      sharedRingGeo.dispose();
      unitLineGeo.dispose();
      lineObjects.forEach(({ mat }) => mat.dispose());
    };
  }, [sharedRingGeo, unitLineGeo, lineObjects]);

  useFrame(() => {
    const progress = useHddStore.getState().explodedProgress;
    if (progress < 0.15) return;

    const lineOpacity = Math.min(0.68, (progress - 0.15) * 1.5);
    const ringOpacity = Math.min(0.55, (progress - 0.15) * 1.2);

    for (let i = 0; i < GUIDE_PARTS.length; i++) {
      const currentY = GUIDE_PARTS[i].explodedOffset[1] * progress;
      const lineObj = lineRefs.current[i];
      if (lineObj) {
        lineObj.scale.set(1, currentY, 1);
        (lineObj.material as THREE.LineDashedMaterial).opacity = lineOpacity;
      }
      const ringMat = ringMatRefs.current[i];
      if (ringMat) {
        ringMat.opacity = ringOpacity;
      }
    }
  });

  if (!isVisible) return null;

  return (
    <group>
      {GUIDE_PARTS.map((part, idx) => {
        const originX = part.cameraTargetOffset[0];
        const originZ = part.cameraTargetOffset[2];

        return (
          <group key={part.id} position={[originX, 0, originZ]}>
            <primitive
              object={lineObjects[idx].line}
              ref={(el: THREE.Line | null) => {
                lineRefs.current[idx] = el;
              }}
            />
            <mesh
              position={[0, 0.01, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              geometry={sharedRingGeo}
            >
              <meshBasicMaterial
                ref={(el) => {
                  ringMatRefs.current[idx] = el;
                }}
                color={guideColor}
                transparent
                opacity={0}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};
