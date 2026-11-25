import React from 'react';
import { X, Crosshair, ArrowLeft } from 'lucide-react';
import { useHddStore } from '../../store/useHddStore';
import { getPartById } from '../../data/hddParts';
import { toast } from './Toast';
import { sound } from '../../utils/sound';
import { AssemblyOverview } from './inspector/AssemblyOverview';
import {
  PrinciplesTab,
  SpecificationsTab,
  FieldAdvisoryTab,
} from './inspector/PartInspectorTabs';

const INSPECTOR_TABS = [
  { id: 'mechanism', label: 'Principles', code: '§ 1.0' },
  { id: 'specs', label: 'Specs', code: '§ 2.0' },
  { id: 'failure', label: 'Advisory', code: '§ 3.0' },
] as const;

export const FocusCard: React.FC = () => {
  const selectedPartId = useHddStore((s) => s.selectedPartId);
  const part = getPartById(selectedPartId);
  const setSelectedPartId = useHddStore((s) => s.setSelectedPartId);
  const activeTab = useHddStore((s) => s.activeInspectorTab);
  const setActiveTab = useHddStore((s) => s.setActiveInspectorTab);
  const requestCameraRefit = useHddStore((s) => s.requestCameraRefit);

  const handleBackToOverview = () => {
    setSelectedPartId(null);
    sound.playUiClick(750, 0.02);
  };

  const handleRefitCamera = () => {
    requestCameraRefit();
    sound.playUiClick(950, 0.02);
    toast.info('Refitted 3D camera to view');
  };

  return (
    <aside
      className="w-full h-full flex flex-col bg-page text-ink select-none overflow-hidden min-w-[280px]"
      aria-label="Component engineering monograph"
    >
      {part ? (
        <>
          <div className="p-4 border-b border-line bg-page flex flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleBackToOverview}
              className="flex items-center gap-1.5 text-[10px] font-mono-tech font-bold text-accent hover:underline underline-offset-4 transition-colors w-fit group cursor-pointer"
              title="Return to full drive assembly overview"
            >
              <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
              <span>BACK TO OVERVIEW</span>
            </button>

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono-tech text-[10px] uppercase font-bold px-1.5 py-0.5 bg-accent text-accent-ink">
                    CHAPTER § {part.indexNumber}
                  </span>
                  <span className="font-mono-tech text-[10px] text-muted uppercase tracking-wider truncate">
                    {part.subsystem}
                  </span>
                </div>
                <h2 className="font-editorial-title text-base sm:text-lg text-ink uppercase tracking-[-0.035em] leading-snug">
                  {part.name}
                </h2>
                <p className="font-mono-tech text-[10px] text-muted uppercase tracking-wider mt-0.5">
                  {part.shortSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleRefitCamera}
                  title="Refit Camera to this component [F]"
                  aria-label="Refit Camera"
                  className="manual-button p-1.5"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleBackToOverview}
                  aria-label="Close component datasheet"
                  className="manual-button p-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-4 py-2 border-b border-line bg-surface shrink-0">
            <div className="flex items-center gap-1" role="tablist">
              {INSPECTOR_TABS.map(({ id, label, code }) => {
                const isActive = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTab(id);
                      sound.playUiClick(900, 0.02);
                    }}
                    aria-selected={isActive}
                    role="tab"
                    className={`manual-button flex-1 py-1 text-[11px] font-extrabold uppercase tracking-tight ${
                      isActive ? 'active' : 'bg-page'
                    }`}
                  >
                    <span className="opacity-60 mr-1 text-[9px] font-mono-tech">{code}</span>
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'mechanism' && <PrinciplesTab part={part} />}
            {activeTab === 'specs' && <SpecificationsTab part={part} />}
            {activeTab === 'failure' && <FieldAdvisoryTab part={part} />}

            <div className="pt-3 border-t border-line flex items-center justify-between">
              <button
                type="button"
                onClick={handleBackToOverview}
                className="flex items-center gap-1.5 text-[11px] font-mono-tech font-bold text-accent hover:underline underline-offset-4 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Overview</span>
              </button>
              <span className="font-mono-tech text-[9px] text-muted uppercase">
                SFF-8301 MONOGRAPH
              </span>
            </div>
          </div>
        </>
      ) : (
        <AssemblyOverview />
      )}
    </aside>
  );
};
