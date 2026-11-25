import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, ShieldAlert } from 'lucide-react';
import { HddPartData } from '../../../data/hddParts';
import { formatFormula } from '../../../utils/formula';
import { copyToClipboard } from '../../../utils/clipboard';
import { sound } from '../../../utils/sound';
import { toast } from '../Toast';

export const PrinciplesTab: React.FC<{ part: HddPartData }> = ({ part }) => {
  const formula = part.physicalPrinciples.formula
    ? formatFormula(part.physicalPrinciples.formula)
    : null;

  return (
    <div className="space-y-4">
      <div className="text-xs text-ink/90 leading-relaxed font-sans">
        <p className="drop-cap leading-relaxed">{part.physicalPrinciples.description}</p>
      </div>

      <div className="schematic-box p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-line pb-2">
          <span className="font-mono-tech text-[10px] text-accent font-bold uppercase tracking-wider">
            FIG. {part.indexNumber}-A // GOVERNING PHYSICAL LAW
          </span>
          <span className="font-mono-tech text-[9px] text-muted uppercase">SI UNITS</span>
        </div>

        {formula && (
          <div className="py-2.5 px-3 bg-page border border-line text-center space-y-1">
            <div className="font-mono text-xs sm:text-sm text-ink tracking-wider font-bold">
              {formula.eq}
            </div>
            {formula.caption && (
              <div className="font-mono-tech text-[9px] text-muted uppercase tracking-widest">
                {formula.caption}
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5 pt-1">
          <span className="font-mono-tech text-[9px] font-bold uppercase text-muted block tracking-wider">
            Key Engineering Axioms:
          </span>
          <ul className="space-y-1">
            {part.physicalPrinciples.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] text-ink/90">
                <span className="text-accent font-mono select-none font-bold">―</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-3 border border-line bg-surface">
        <span className="font-mono-tech text-[9px] font-bold uppercase text-muted block mb-1">
          ARCHITECTURAL SUMMARY
        </span>
        <p className="text-xs text-ink leading-relaxed">{part.summary}</p>
      </div>
    </div>
  );
};

export const SpecificationsTab: React.FC<{ part: HddPartData }> = ({ part }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopySpec = async (label: string, value: string, unit?: string) => {
    const text = `${label}: ${value}${unit ? ` ${unit}` : ''}`;
    const ok = await copyToClipboard(text);
    if (!ok) {
      toast.info('Clipboard unavailable in this browser context');
      return;
    }

    setCopiedKey(label);
    sound.playUiClick(1100, 0.02);
    toast.copy(`Copied: ${text}`);
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleCopyAllSpecs = async () => {
    const all = [
      `CHAPTER § ${part.indexNumber}: ${part.name}`,
      `Subsystem: ${part.subsystem}`,
      `Section: ${part.section}`,
      `Summary: ${part.summary}`,
      '',
      'ENGINEERING SPECIFICATIONS:',
      ...part.specifications.map((s) => `  - ${s.label}: ${s.value}${s.unit ? ` ${s.unit}` : ''}`),
    ].join('\n');

    const ok = await copyToClipboard(all);
    if (!ok) {
      toast.info('Clipboard unavailable in this browser context');
      return;
    }
    sound.playUiClick(1150, 0.03);
    toast.success('All specifications copied to clipboard');
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-1">
        <span className="font-mono-tech text-[10px] font-bold uppercase text-muted tracking-wider">
          TECHNICAL PARAMETERS
        </span>
        <button
          type="button"
          onClick={handleCopyAllSpecs}
          className="manual-button px-2 py-0.5 text-[10px] font-bold inline-flex items-center gap-1"
        >
          <Copy className="w-3 h-3 text-muted" />
          <span>COPY ALL</span>
        </button>
      </div>

      <div className="border border-line overflow-hidden bg-page">
        <table className="w-full table-fixed text-left border-collapse text-xs">
          <tbody>
            {part.specifications.map((spec, idx) => (
              <tr
                key={spec.label}
                className={`border-b border-line/60 last:border-b-0 hover:bg-surface transition-colors group ${
                  idx % 2 === 0 ? 'bg-transparent' : 'bg-surface/40'
                }`}
              >
                <td className="py-2 px-3 font-mono-tech text-[10px] text-muted uppercase tracking-wider w-[44%] break-words">
                  {spec.label}
                </td>
                <td className="py-2 px-2 font-mono text-[11px] text-ink break-words">
                  <span className="font-semibold">{spec.value}</span>
                  {spec.unit && (
                    <span className="text-muted ml-1 text-[10px]">{spec.unit}</span>
                  )}
                </td>
                <td className="py-2 pr-2 text-right w-8">
                  <button
                    type="button"
                    onClick={() => handleCopySpec(spec.label, spec.value, spec.unit)}
                    title={`Copy ${spec.label}`}
                    aria-label={`Copy ${spec.label}`}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-ink transition-opacity"
                  >
                    {copiedKey === spec.label ? (
                      <Check className="w-3 h-3 text-accent" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-2.5 border border-line bg-surface flex items-center justify-between">
        <span className="font-mono-tech text-[9px] uppercase text-muted">
          SFF SPECIFICATION
        </span>
        <span className="font-mono-tech text-[9px] font-bold uppercase text-accent">
          SFF-8301 COMPLIANT
        </span>
      </div>
    </div>
  );
};

export const FieldAdvisoryTab: React.FC<{ part: HddPartData }> = ({ part }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 pb-1">
        <ShieldAlert className="w-3.5 h-3.5 text-accent" />
        <span className="font-mono-tech text-[10px] font-bold uppercase text-accent tracking-wider">
          FIELD SERVICE BULLETINS
        </span>
      </div>

      {part.failureModes.map((failure, idx) => (
        <div
          key={idx}
          className="p-3.5 border border-line border-l-[3px] border-l-accent bg-surface space-y-2.5"
        >
          <div className="flex items-start justify-between gap-2 border-b border-line pb-2">
            <span className="font-mono-tech text-[10px] font-bold text-ink uppercase tracking-wider">
              {failure.title}
            </span>
            {failure.smartAttribute && (
              <span className="font-mono-tech text-[9px] font-bold text-accent-ink bg-accent px-1.5 py-0.5 uppercase shrink-0">
                {failure.smartAttribute}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div>
              <span className="font-mono-tech text-[9px] uppercase text-muted block font-bold">
                Symptom:
              </span>
              <p className="text-ink/90 leading-relaxed">{failure.symptom}</p>
            </div>
            <div>
              <span className="font-mono-tech text-[9px] uppercase text-muted block font-bold">
                Root Cause:
              </span>
              <p className="text-muted leading-relaxed">{failure.rootCause}</p>
            </div>
            <div>
              <span className="font-mono-tech text-[9px] uppercase text-accent block font-bold">
                Prevention:
              </span>
              <p className="text-ink/85 leading-relaxed">{failure.prevention}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
