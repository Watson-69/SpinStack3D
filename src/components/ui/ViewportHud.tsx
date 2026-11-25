import React, { useState, useEffect } from 'react';
import { useHddStore } from '../../store/useHddStore';
import { CameraPresetType, TOOLBAR_CAMERA_PRESETS } from '../../data/cameraPresets';
import { selectCameraPresetWithFeedback } from '../../utils/viewerActions';

/**
 * Floating 2D technical plate overlay rendered outside the WebGL `<Canvas>` tree
 * so HUD updates (such as 60fps `t` explosion ticks) never trigger Canvas re-renders.
 */
export const ViewportHud: React.FC = () => {
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const explodedProgress = useHddStore((s) => s.explodedProgress);
  const activeCameraPreset = useHddStore((s) => s.activeCameraPreset);

  const [showHint, setShowHint] = useState(true);

  useEffect(() => {
    if (selectedPartId || explodedProgress > 0.05) {
      setShowHint(false);
    }
  }, [selectedPartId, explodedProgress]);

  const handleCameraChange = (preset: CameraPresetType) => {
    setShowHint(false);
    selectCameraPresetWithFeedback(preset);
  };

  return (
    <>
      {/* Editorial Viewport Plate Header */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center gap-2">
        <span className="font-mono-tech text-[10px] text-accent font-bold uppercase tracking-wider bg-page/90 px-2 py-0.5 border border-line">
          FIG. 01 — 3.5&quot; DISK ASSEMBLY
        </span>
        <span className="font-mono-tech text-[9px] text-ink uppercase hidden sm:inline bg-surface/90 px-1.5 py-0.5 border border-line tabular-nums">
          t = {explodedProgress.toFixed(2)}
        </span>
      </div>

      <div className="absolute top-3 right-4 z-10 pointer-events-none hidden md:flex items-center gap-2">
        <span className="font-mono-tech text-[9px] text-muted uppercase bg-page/90 px-2 py-0.5 border border-line">
          SCALE: 1:1 MM // ISO-G-CODE
        </span>
      </div>

      {/* Dismissible First-Time Interaction Cue */}
      {showHint && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-1 bg-page/95 border border-line text-xs text-ink">
          <span className="w-1.5 h-1.5 bg-accent animate-pulse shrink-0" />
          <span className="font-mono-tech text-[10px] font-medium whitespace-nowrap">
            Click part or drag <span className="text-accent font-bold">DISASSEMBLE</span> to inspect
          </span>
          <button
            type="button"
            onClick={() => setShowHint(false)}
            className="ml-0.5 text-muted hover:text-ink transition-colors px-1 font-bold"
            aria-label="Dismiss guide hint"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bottom Camera Preset Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-1 p-1 bg-page/95 border border-line">
        {TOOLBAR_CAMERA_PRESETS.map((preset) => {
          const isActive = activeCameraPreset === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleCameraChange(preset.id)}
              aria-pressed={isActive}
              className={`manual-button px-2.5 py-1 text-[10.5px] font-mono-tech font-bold uppercase ${
                isActive ? 'active' : ''
              }`}
            >
              <span className="opacity-55 mr-1 text-[9px]">{preset.code}</span>
              <span>{preset.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Sharp Architectural Corner Brackets */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-line pointer-events-none z-10" />
      <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-line pointer-events-none z-10" />
      <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-line pointer-events-none z-10" />
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-line pointer-events-none z-10" />
    </>
  );
};
