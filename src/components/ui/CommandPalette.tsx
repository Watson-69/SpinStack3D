import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Disc,
  Eye,
  Camera,
  Play,
  Volume2,
  Layers,
  HelpCircle,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { useHddStore } from '../../store/useHddStore';
import { KNOCKOUT_THEMES } from '../../theme/knockoutTheme';
import { CAMERA_PRESETS, TOOLBAR_CAMERA_PRESETS } from '../../data/cameraPresets';
import { HDD_PARTS } from '../../data/hddParts';
import { toast } from './Toast';
import { sound } from '../../utils/sound';
import {
  selectCameraPresetWithFeedback,
  toggleExplodedWithFeedback,
  toggleSimulateWithFeedback,
  toggleSoundWithFeedback,
} from '../../utils/viewerActions';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHelp: () => void;
}

interface CommandItem {
  id: string;
  category: 'Components' | 'Views' | 'Actions' | 'Themes';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenHelp,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const setSelectedPartId = useHddStore((s) => s.setSelectedPartId);
  const toggleXRayMode = useHddStore((s) => s.toggleXRayMode);
  const setTheme = useHddStore((s) => s.setTheme);
  const replayIntro = useHddStore((s) => s.replayIntro);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const allCommands = useMemo<CommandItem[]>(() => {
    const partCommands: CommandItem[] = HDD_PARTS.map((part) => ({
      id: `part-${part.id}`,
      category: 'Components',
      title: `§${part.indexNumber} ${part.name}`,
      subtitle: `${part.section} • ${part.shortSubtitle}`,
      icon: Disc,
      action: () => {
        setSelectedPartId(part.id);
        sound.playUiClick(1000, 0.02);
        toast.info(`Selected: ${part.name}`);
        onClose();
      },
    }));

    const viewPresets = [...TOOLBAR_CAMERA_PRESETS, CAMERA_PRESETS.reset];
    const viewCommands: CommandItem[] = viewPresets.map((preset) => ({
      id: `view-${preset.id}`,
      category: 'Views',
      title: preset.id === 'reset' ? 'Reset / Fit Camera View' : `${preset.name} View`,
      subtitle: preset.subtitle,
      icon: preset.id === 'reset' ? RotateCcw : Camera,
      shortcut: preset.shortcut,
      action: () => {
        selectCameraPresetWithFeedback(preset.id);
        onClose();
      },
    }));

    const themeCommands: CommandItem[] = KNOCKOUT_THEMES.map((item) => ({
      id: `theme-${item.id}`,
      category: 'Themes',
      title: `${item.label} Theme`,
      subtitle: 'Switch Knockout editorial palette across UI and 3D canvas',
      icon: Palette,
      action: () => {
        setTheme(item.id);
        sound.playUiClick(920, 0.02);
        toast.info(`Theme: ${item.label}`);
        onClose();
      },
    }));

    const actionCommands: CommandItem[] = [
      {
        id: 'action-explode',
        category: 'Actions',
        title: 'Toggle Exploded Disassembly',
        subtitle: 'Separates components along vertical axis',
        icon: Layers,
        shortcut: 'E',
        action: () => {
          toggleExplodedWithFeedback();
          onClose();
        },
      },
      {
        id: 'action-simulate',
        category: 'Actions',
        title: 'Toggle 7,200 RPM Drive Simulation',
        subtitle: 'Starts platter spindle rotation & arm seeking',
        icon: Play,
        shortcut: 'S',
        action: () => {
          toggleSimulateWithFeedback();
          onClose();
        },
      },
      {
        id: 'action-xray',
        category: 'Actions',
        title: 'Toggle X-Ray Transparency',
        subtitle: 'Makes top cover translucent',
        icon: Eye,
        shortcut: 'X',
        action: () => {
          toggleXRayMode();
          onClose();
        },
      },
      {
        id: 'action-sound',
        category: 'Actions',
        title: 'Toggle Sound Effects',
        subtitle: 'Spindle hum, seek clicks, and UI audio',
        icon: Volume2,
        shortcut: 'M',
        action: () => {
          toggleSoundWithFeedback();
          onClose();
        },
      },
      {
        id: 'action-intro',
        category: 'Actions',
        title: 'Replay Intro Curtain',
        subtitle: 'Replay Knockout GSAP opening sequence',
        icon: RotateCcw,
        action: () => {
          onClose();
          replayIntro();
        },
      },
      {
        id: 'action-help',
        category: 'Actions',
        title: 'Keyboard Shortcuts Help',
        subtitle: 'Show complete hotkeys cheatsheet',
        icon: HelpCircle,
        shortcut: '?',
        action: () => {
          onClose();
          onOpenHelp();
        },
      },
    ];

    return [...partCommands, ...viewCommands, ...themeCommands, ...actionCommands];
  }, [
    setSelectedPartId,
    toggleXRayMode,
    setTheme,
    replayIntro,
    onClose,
    onOpenHelp,
  ]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allCommands;
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [allCommands, query]);

  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(0);
    }
  }, [filteredCommands.length, selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filteredCommands[selectedIndex]?.action();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
    activeEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-page border border-line text-ink shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="flex items-center px-4 py-3 border-b border-line bg-surface">
          <Search className="w-4 h-4 text-accent mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="TYPE A COMMAND, COMPONENT, OR THEME..."
            className="w-full bg-transparent text-xs font-mono text-ink placeholder-muted focus:outline-none"
          />
          <span className="linear-keycap text-[10px] ml-2">ESC</span>
        </div>

        <div ref={listRef} role="listbox" className="max-h-80 overflow-y-auto p-2 space-y-0.5">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs font-mono text-muted">
              No matching commands or parts for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = selectedIndex === idx;
              const Icon = cmd.icon;

              return (
                <button
                  key={cmd.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2 border transition-colors cursor-pointer ${isSelected
                    ? 'bg-surface border-accent text-ink'
                    : 'border-transparent text-ink/90 hover:bg-surface/60'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isSelected ? 'text-accent' : 'text-muted'
                        }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold tracking-tight truncate">{cmd.title}</div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-muted truncate">{cmd.subtitle}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="font-mono-tech text-[9.5px] text-muted uppercase">
                      {cmd.category}
                    </span>
                    {cmd.shortcut && <span className="linear-keycap">{cmd.shortcut}</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="px-4 py-2 border-t border-line bg-surface flex items-center justify-between text-[11px] font-mono-tech text-muted">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
};
