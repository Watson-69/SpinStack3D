import React, { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useHddStore } from '../../store/useHddStore';
import { sound } from '../../utils/sound';

export const KeyboardShortcutsModal: React.FC = () => {
  const isShortcutsModalOpen = useHddStore((s) => s.isShortcutsModalOpen);
  const setIsShortcutsModalOpen = useHddStore((s) => s.setIsShortcutsModalOpen);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isShortcutsModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsShortcutsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsModalOpen, setIsShortcutsModalOpen]);

  if (!isShortcutsModalOpen) return null;

  const shortcutGroups = [
    {
      category: 'Navigation & Selection',
      items: [
        { keys: ['J', 'K'], desc: 'Step to next / previous component' },
        { keys: ['↓', '↑'], desc: 'Navigate components list' },
        { keys: ['↵ Enter'], desc: 'Select focused component' },
        { keys: ['Esc'], desc: 'Clear selection / Close overlay' },
      ],
    },
    {
      category: 'View & Inspection',
      items: [
        { keys: ['E'], desc: 'Toggle exploded / assembled view' },
        { keys: ['F'], desc: 'Refit camera to center / current part' },
        { keys: ['S'], desc: 'Toggle 7,200 RPM drive simulation' },
        { keys: ['X'], desc: 'Toggle X-Ray transparent chassis' },
        { keys: ['L'], desc: 'Toggle 3D callout labels' },
        { keys: ['1 - 5'], desc: 'Switch camera presets (Hero, Platters, VCM, PCB, Blueprint)' },
      ],
    },
    {
      category: 'General',
      items: [
        { keys: ['⌘K'], desc: 'Open Command Palette' },
        { keys: ['/'], desc: 'Focus sidebar search' },
        { keys: ['M'], desc: 'Toggle audio sound effects' },
        { keys: ['?'], desc: 'Show this keyboard help' },
      ],
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard Shortcuts"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={() => setIsShortcutsModalOpen(false)}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-page border border-line p-5 text-ink shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-accent" />
            <h3 className="font-editorial-title text-sm uppercase tracking-[-0.02em] text-ink">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsShortcutsModalOpen(false);
              sound.playUiClick(750, 0.02);
            }}
            aria-label="Close shortcuts modal"
            className="manual-button p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {shortcutGroups.map((group) => (
            <div key={group.category} className="space-y-1.5">
              <h4 className="font-mono-tech text-[10px] font-bold text-accent uppercase tracking-wider">
                {group.category}
              </h4>
              <div className="space-y-0.5 border border-line bg-surface">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-1.5 px-2.5 border-b border-line/50 last:border-b-0 text-xs"
                  >
                    <span className="text-ink font-medium">{item.desc}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {item.keys.map((k) => (
                        <span key={k} className="linear-keycap bg-page text-[10px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-line pt-3 mt-4 flex items-center justify-between text-[10px] font-mono-tech text-muted uppercase">
          <span>3.5&quot; HDD CAD NAVIGATION</span>
          <span>LMB: ORBIT • RMB: PAN</span>
        </div>
      </div>
    </div>
  );
};
