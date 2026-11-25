import React from 'react';
import { Asterisk, Menu, Play, Volume2, VolumeX, Eye, Command } from 'lucide-react';
import { useHddStore } from '../../store/useHddStore';
import { KNOCKOUT_THEMES } from '../../theme/knockoutTheme';
import { getPartById } from '../../data/hddParts';
import { toast } from './Toast';
import { sound } from '../../utils/sound';
import {
  toggleExplodedWithFeedback,
  toggleSimulateWithFeedback,
  toggleSoundWithFeedback,
} from '../../utils/viewerActions';
import { LiquidGauge } from './LiquidGauge';
import { ExplodeSlider } from './ExplodeSlider';

interface HeaderBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpenMobile?: boolean;
  onOpenCommandPalette?: () => void;
  menuButtonRef?: React.RefObject<HTMLButtonElement>;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  onToggleSidebar,
  isSidebarOpenMobile,
  onOpenCommandPalette,
  menuButtonRef,
}) => {
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const selectedPart = getPartById(selectedPartId);

  const isExploded = useHddStore((s) => s.isExploded);
  const explodedProgress = useHddStore((s) => s.explodedProgress);
  const setExplodedProgress = useHddStore((s) => s.setExplodedProgress);

  const isSimulating = useHddStore((s) => s.isSimulating);
  const rpm = useHddStore((s) => s.rpm);

  const isXRayMode = useHddStore((s) => s.isXRayMode);
  const toggleXRayMode = useHddStore((s) => s.toggleXRayMode);

  const soundEnabled = useHddStore((s) => s.soundEnabled);

  const theme = useHddStore((s) => s.theme);
  const setTheme = useHddStore((s) => s.setTheme);
  const replayIntro = useHddStore((s) => s.replayIntro);

  const explodePercent = Math.round(explodedProgress * 100);

  return (
    <header className="w-full h-14 bg-page border-b border-line text-ink select-none px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-20">
      {/* Left: Knockout Asterisk Intro Replay + Menu Toggle + Editorial Title */}
      <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
        {onToggleSidebar && (
          <button
            ref={menuButtonRef}
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle navigation Table of Contents"
            aria-expanded={isSidebarOpenMobile}
            title="Toggle Table of Contents"
            className="manual-button p-1.5 shrink-0"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            sound.playUiClick(980, 0.02);
            replayIntro();
          }}
          aria-label="Replay introduction curtain"
          title="Replay Intro"
          className="inline-grid place-items-center w-8 h-8 -ml-0.5 text-ink hover:text-accent transition-colors shrink-0"
        >
          <Asterisk className="w-5 h-5 stroke-[1.6]" aria-hidden="true" />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-editorial-title text-sm sm:text-base uppercase tracking-[-0.04em] text-ink leading-none whitespace-nowrap">
              Making Hardware
            </h1>
            <span className="text-line font-mono text-[10px] hidden sm:inline">/</span>
            <span className="font-mono-tech text-[10px] uppercase text-accent font-bold tracking-wider hidden md:inline whitespace-nowrap">
              HDD(01)
            </span>
            <span className="manual-tag text-[9px] hidden xl:inline whitespace-nowrap">
              SFF-8301
            </span>
          </div>

          <div className="text-[10px] font-mono-tech uppercase text-muted mt-0.5 truncate">
            {selectedPart ? (
              <span className="text-ink font-semibold truncate">
                § {selectedPart.indexNumber} · {selectedPart.name}
              </span>
            ) : (
              <span className="text-muted truncate">
                Assembly Overview · 3.5&quot; PMR Drive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Disassemble Slider + Controls + Knockout Theme Swatches */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="flex items-center gap-2 px-2 sm:px-2.5 py-1 border border-line bg-surface">
          <button
            type="button"
            onClick={toggleExplodedWithFeedback}
            aria-label="Toggle Exploded View"
            title="Toggle Exploded View [E]"
            className={`font-mono-tech text-[10px] uppercase font-bold flex items-center gap-1.5 transition-colors ${isExploded ? 'text-accent' : 'text-ink hover:text-accent'
              }`}
          >
            <span className="hidden sm:inline">DISASSEMBLE</span>
            <span className="manual-tag text-[9px] px-1 py-0 bg-page">E</span>
          </button>

          <ExplodeSlider
            value={explodePercent}
            onChange={(val) => setExplodedProgress(val / 100)}
            aria-label="Disassembly progress"
            className="w-12 sm:w-20 md:w-24"
          />

          <span
            data-testid="explode-readout"
            className="font-mono text-[11px] tabular-nums text-ink w-7 text-right font-bold hidden sm:inline"
          >
            {explodePercent}%
          </span>

          <LiquidGauge
            value={explodePercent}
            size={24}
            label="Explode Disassembly Level"
            onClick={toggleExplodedWithFeedback}
            className="transition-transform active:scale-95 hover:opacity-90 shrink-0"
          />
        </div>

        <button
          type="button"
          onClick={toggleSimulateWithFeedback}
          title="Toggle 7,200 RPM Spindle Rotation [S]"
          aria-label="Toggle Spindle Motor Simulation"
          className={`manual-button px-2 sm:px-2.5 py-1.5 text-[10px] flex items-center gap-1.5 font-extrabold uppercase tracking-tight ${isSimulating && rpm > 0 ? 'active' : ''
            }`}
        >
          {isSimulating && rpm > 0 ? (
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          <span className="font-mono-tech hidden md:inline">
            {isSimulating ? '7,200 RPM' : 'SPINDLE'}
          </span>
          <span className="manual-tag text-[9px] px-1 py-0 hidden xl:inline">S</span>
        </button>

        <button
          type="button"
          onClick={toggleXRayMode}
          title="Toggle X-Ray Internal Inspection [X]"
          aria-label="Toggle X-Ray Transparency"
          className={`manual-button p-1.5 ${isXRayMode ? 'active' : ''}`}
        >
          <Eye className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={toggleSoundWithFeedback}
          title="Toggle Sound Effects [M]"
          aria-label="Toggle Audio Effects"
          className={`manual-button p-1.5 ${soundEnabled ? '' : 'opacity-60'}`}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-accent" />
          ) : (
            <VolumeX className="w-3.5 h-3.5 text-muted" />
          )}
        </button>

        {onOpenCommandPalette && (
          <button
            type="button"
            onClick={onOpenCommandPalette}
            title="Search Index (⌘K / Ctrl+K)"
            aria-label="Open Technical Index"
            className="manual-button px-2 py-1.5 gap-1.5 hidden sm:inline-flex items-center"
          >
            <Command className="w-3 h-3 text-muted" />
            <span className="font-mono-tech text-[10px] font-bold">INDEX</span>
            <span className="manual-tag text-[9px] px-1 py-0">⌘K</span>
          </button>
        )}

        {/* Knockout Tri-Theme Swatch Switcher */}
        <div
          className="knockout-swatches pl-1 border-l border-line hidden sm:inline-flex"
          role="group"
          aria-label="Color theme"
        >
          {KNOCKOUT_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={`${item.label} theme`}
              title={`${item.label} theme`}
              aria-pressed={theme === item.id}
              onClick={() => {
                setTheme(item.id);
                sound.playUiClick(920, 0.02);
                toast.info(`Theme: ${item.label}`);
              }}
            >
              <span style={{ backgroundColor: item.color }} />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
