import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useHddStore, KnockoutTheme } from '../../store/useHddStore';
import { HDD_PARTS } from '../../data/hddParts';
import { sound } from '../../utils/sound';
import { hddPartRegistry } from './partRegistry';
import {
  CALLOUT_BADGE_WIDTH,
  PlacedLabel,
  ScreenAnchor,
  computeCalloutLayout,
} from './calloutLayout';

interface CalloutSvgPalette {
  accent: string;
  lineIdle: string;
  lineHover: string;
  haloBg: string;
  selectedFill: string;
  hoverFill: string;
  dotSelectedCore: string;
}

const CALLOUT_SVG_PALETTES: Record<KnockoutTheme, CalloutSvgPalette> = {
  dark: {
    accent: '#ff6255',
    lineIdle: 'rgba(234, 224, 218, 0.34)',
    lineHover: 'rgba(255, 114, 101, 0.95)',
    haloBg: 'rgba(5, 5, 5, 0.8)',
    selectedFill: 'rgba(255, 98, 85, 0.28)',
    hoverFill: 'rgba(234, 224, 218, 0.2)',
    dotSelectedCore: '#eae0da',
  },
  light: {
    accent: '#bb1815',
    lineIdle: 'rgba(21, 18, 17, 0.36)',
    lineHover: 'rgba(171, 21, 19, 0.95)',
    haloBg: 'rgba(235, 222, 216, 0.88)',
    selectedFill: 'rgba(187, 24, 21, 0.22)',
    hoverFill: 'rgba(21, 18, 17, 0.16)',
    dotSelectedCore: '#151211',
  },
  signal: {
    accent: '#fff0eb',
    lineIdle: 'rgba(255, 240, 235, 0.45)',
    lineHover: '#ffffff',
    haloBg: 'rgba(141, 23, 21, 0.85)',
    selectedFill: 'rgba(255, 240, 235, 0.28)',
    hoverFill: 'rgba(255, 240, 235, 0.22)',
    dotSelectedCore: '#8f1714',
  },
};

function copyMatrix16(source: THREE.Matrix4, dest: Float64Array): boolean {
  const src = source.elements;
  let changed = false;
  for (let i = 0; i < 16; i++) {
    if (Math.abs(src[i] - dest[i]) > 1e-6) {
      dest[i] = src[i];
      changed = true;
    }
  }
  return changed;
}

export const CalloutSystem: React.FC = () => {
  const { camera, size, invalidate } = useThree();
  const theme = useHddStore((s) => s.theme);
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const hoveredPartId = useHddStore((s) => s.hoveredPartId);
  const isLidClosed = useHddStore((s) => s.explodedProgress < 0.18);
  const isXRayMode = useHddStore((s) => s.isXRayMode);
  const showCalloutPins = useHddStore((s) => s.showCalloutPins);
  const setSelectedPartId = useHddStore((s) => s.setSelectedPartId);
  const setHoveredPartId = useHddStore((s) => s.setHoveredPartId);

  const svgPalette = CALLOUT_SVG_PALETTES[theme];

  // State only updates when visible membership changes, keeping 60fps orbit/drag React-free!
  const [placedLabels, setPlacedLabels] = useState<PlacedLabel[]>([]);
  const lastSignatureRef = useRef('');
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // Direct DOM refs updated mutatively inside useFrame (zero React reconciliation on camera motion)
  const badgeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const hitRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const pulseRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const haloRefs = useRef<Map<string, SVGCircleElement>>(new Map());
  const coreRefs = useRef<Map<string, SVGCircleElement>>(new Map());

  const lastCamMatrix = useRef(new Float64Array(16));
  const lastProjMatrix = useRef(new Float64Array(16));
  const lastWidth = useRef(0);
  const lastHeight = useRef(0);
  const lastExplode = useRef(-1);
  const lastLidClosed = useRef(isLidClosed);
  const lastXRay = useRef(isXRayMode);
  const lastSelected = useRef(selectedPartId);
  const settleFrames = useRef(60);

  const syncDomGeometry = useCallback((labels: PlacedLabel[]) => {
    for (let i = 0; i < labels.length; i++) {
      const { part, anchorX, anchorY, badgeX, labelY, gutter } = labels[i];

      const badgeEl = badgeRefs.current.get(part.id);
      if (badgeEl) {
        badgeEl.style.transform = `translate3d(${badgeX}px, ${labelY - 14}px, 0)`;
      }

      const pathEl = pathRefs.current.get(part.id);
      if (pathEl) {
        const targetX = gutter === 'left' ? badgeX + CALLOUT_BADGE_WIDTH : badgeX;
        const elbowX =
          gutter === 'left'
            ? Math.max(targetX + 16, anchorX - 24)
            : Math.min(targetX - 16, anchorX + 24);
        pathEl.setAttribute('d', `M ${anchorX} ${anchorY} L ${elbowX} ${labelY} L ${targetX} ${labelY}`);
      }

      const hitEl = hitRefs.current.get(part.id);
      if (hitEl) {
        hitEl.setAttribute('cx', String(anchorX));
        hitEl.setAttribute('cy', String(anchorY));
      }
      const pulseEl = pulseRefs.current.get(part.id);
      if (pulseEl) {
        pulseEl.setAttribute('cx', String(anchorX));
        pulseEl.setAttribute('cy', String(anchorY));
      }
      const haloEl = haloRefs.current.get(part.id);
      if (haloEl) {
        haloEl.setAttribute('cx', String(anchorX));
        haloEl.setAttribute('cy', String(anchorY));
      }
      const coreEl = coreRefs.current.get(part.id);
      if (coreEl) {
        coreEl.setAttribute('cx', String(anchorX));
        coreEl.setAttribute('cy', String(anchorY));
      }
    }
  }, []);

  useEffect(() => {
    settleFrames.current = 45;
    invalidate();
  }, [selectedPartId, isLidClosed, isXRayMode, showCalloutPins, invalidate]);

  useFrame((state) => {
    if (!showCalloutPins) return;

    const store = useHddStore.getState();
    const {
      explodedProgress,
      isSimulating,
      rpm,
      isXRayMode: xray,
      selectedPartId: selId,
      hoveredPartId: hovId,
    } = store;
    const lidClosed = explodedProgress < 0.18;

    const camMoved = copyMatrix16(camera.matrixWorldInverse, lastCamMatrix.current);
    const projChanged = copyMatrix16(camera.projectionMatrix, lastProjMatrix.current);
    const sizeChanged = lastWidth.current !== size.width || lastHeight.current !== size.height;
    const explodeChanged = Math.abs(lastExplode.current - explodedProgress) > 1e-4;
    const stateFlagsChanged =
      lastLidClosed.current !== lidClosed ||
      lastXRay.current !== xray ||
      lastSelected.current !== selId;
    const activeMotion = (isSimulating && rpm > 0) || settleFrames.current > 0;

    if (explodeChanged || stateFlagsChanged) {
      lastExplode.current = explodedProgress;
      lastLidClosed.current = lidClosed;
      lastXRay.current = xray;
      lastSelected.current = selId;
      settleFrames.current = 45;
    } else if (settleFrames.current > 0) {
      settleFrames.current -= 1;
      state.invalidate();
    }

    if (!camMoved && !projChanged && !sizeChanged && !explodeChanged && !stateFlagsChanged && !activeMotion) {
      return;
    }

    lastWidth.current = size.width;
    lastHeight.current = size.height;

    const newAnchors: ScreenAnchor[] = new Array(HDD_PARTS.length);
    for (let i = 0; i < HDD_PARTS.length; i++) {
      const part = HDD_PARTS[i];
      const hasPoint = hddPartRegistry.getAnchorWorldPoint(part.id, tempVec);
      if (!hasPoint) {
        tempVec.set(
          part.anchorPoint[0] + part.explodedOffset[0] * explodedProgress,
          part.anchorPoint[1] + part.explodedOffset[1] * explodedProgress,
          part.anchorPoint[2] + part.explodedOffset[2] * explodedProgress
        );
      }

      tempVec.project(camera);
      newAnchors[i] = {
        part,
        x: (tempVec.x * 0.5 + 0.5) * size.width,
        y: (-tempVec.y * 0.5 + 0.5) * size.height,
        visible: tempVec.z < 1.0,
      };
    }

    const layout = computeCalloutLayout({
      anchors: newAnchors,
      viewportWidth: size.width,
      viewportHeight: size.height,
      isLidClosed: lidClosed,
      isXRayMode: xray,
      selectedPartId: selId,
      hoveredPartId: hovId,
    });

    const sig = layout.map((l) => `${l.part.id}:${l.gutter}`).join('|');
    if (sig !== lastSignatureRef.current) {
      lastSignatureRef.current = sig;
      setPlacedLabels(layout);
    } else {
      syncDomGeometry(layout);
    }
  });

  if (!showCalloutPins || !placedLabels.length) return null;

  return (
    <Html fullscreen zIndexRange={[20, 0]} className="pointer-events-none">
      <div className="relative w-full h-full pointer-events-none overflow-hidden select-none">
        {/* SVG Hairline Leader Lines & Interactive 3D Touchpoints */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {placedLabels.map(({ part, anchorX, anchorY, badgeX, labelY, gutter }) => {
            const isSelected = selectedPartId === part.id;
            const isHovered = hoveredPartId === part.id;
            const targetX = gutter === 'left' ? badgeX + CALLOUT_BADGE_WIDTH : badgeX;
            const elbowX =
              gutter === 'left'
                ? Math.max(targetX + 16, anchorX - 24)
                : Math.min(targetX - 16, anchorX + 24);

            const isHighlighted = isSelected || isHovered;
            const strokeColor = isSelected
              ? svgPalette.accent
              : isHovered
              ? svgPalette.lineHover
              : svgPalette.lineIdle;
            const strokeWidth = isSelected ? 1.8 : isHovered ? 1.4 : 1.0;

            return (
              <g key={part.id}>
                <path
                  ref={(el) => {
                    if (el) pathRefs.current.set(part.id, el);
                    else pathRefs.current.delete(part.id);
                  }}
                  d={`M ${anchorX} ${anchorY} L ${elbowX} ${labelY} L ${targetX} ${labelY}`}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeDasharray={isHighlighted ? 'none' : '2 3'}
                />

                <g
                  className="pointer-events-auto cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPartId(part.id);
                    sound.playUiClick(980, 0.03);
                  }}
                  onMouseEnter={() => setHoveredPartId(part.id)}
                  onMouseLeave={() => setHoveredPartId(null)}
                >
                  <circle
                    ref={(el) => {
                      if (el) hitRefs.current.set(part.id, el);
                      else hitRefs.current.delete(part.id);
                    }}
                    cx={anchorX}
                    cy={anchorY}
                    r={14}
                    fill="transparent"
                  />

                  {isSelected && (
                    <circle
                      ref={(el) => {
                        if (el) pulseRefs.current.set(part.id, el);
                        else pulseRefs.current.delete(part.id);
                      }}
                      cx={anchorX}
                      cy={anchorY}
                      r={8}
                      fill="none"
                      stroke={svgPalette.accent}
                      strokeWidth={1.3}
                      opacity={0.9}
                    />
                  )}

                  <circle
                    ref={(el) => {
                      if (el) haloRefs.current.set(part.id, el);
                      else haloRefs.current.delete(part.id);
                    }}
                    cx={anchorX}
                    cy={anchorY}
                    r={isSelected ? 5.0 : isHovered ? 4.5 : 3.0}
                    fill={
                      isSelected
                        ? svgPalette.selectedFill
                        : isHovered
                        ? svgPalette.hoverFill
                        : svgPalette.haloBg
                    }
                    stroke={isSelected || isHovered ? svgPalette.accent : svgPalette.lineHover}
                    strokeWidth={isSelected ? 1.5 : 1}
                  />

                  <circle
                    ref={(el) => {
                      if (el) coreRefs.current.set(part.id, el);
                      else coreRefs.current.delete(part.id);
                    }}
                    cx={anchorX}
                    cy={anchorY}
                    r={isSelected ? 2.2 : 1.5}
                    fill={isSelected ? svgPalette.dotSelectedCore : svgPalette.accent}
                  />
                </g>
              </g>
            );
          })}
        </svg>

        {/* Sharp Knockout Floating Callout Badges */}
        {placedLabels.map(({ part, badgeX, labelY }) => {
          const isSelected = selectedPartId === part.id;
          const isHovered = hoveredPartId === part.id;

          return (
            <div
              key={part.id}
              ref={(el) => {
                if (el) badgeRefs.current.set(part.id, el);
                else badgeRefs.current.delete(part.id);
              }}
              style={{
                transform: `translate3d(${badgeX}px, ${labelY - 14}px, 0)`,
                width: `${CALLOUT_BADGE_WIDTH}px`,
              }}
              className="absolute top-0 left-0 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => {
                  setSelectedPartId(part.id);
                  sound.playUiClick(900, 0.02);
                }}
                onMouseEnter={() => setHoveredPartId(part.id)}
                onMouseLeave={() => setHoveredPartId(null)}
                aria-label={`Inspect ${part.name}`}
                title={`§${part.indexNumber} - ${part.name}`}
                className={`manual-button w-full text-left px-2.5 py-1.5 flex items-center justify-between gap-1.5 border group ${
                  isSelected
                    ? 'active border-accent bg-accent text-accent-ink'
                    : isHovered
                    ? 'border-accent bg-surface text-ink'
                    : 'border-line bg-page/95 hover:border-accent hover:bg-surface text-ink'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span
                    className={`font-mono-tech text-[10px] font-bold shrink-0 ${
                      isSelected ? 'text-accent-ink' : 'text-accent'
                    }`}
                  >
                    FIG_{part.indexNumber}
                  </span>
                  <span
                    className={`text-[10.5px] font-sans font-bold tracking-tight whitespace-nowrap overflow-visible group-hover:underline underline-offset-4 ${
                      isSelected ? 'text-accent-ink' : 'text-ink'
                    }`}
                  >
                    {part.name}
                  </span>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </Html>
  );
};
