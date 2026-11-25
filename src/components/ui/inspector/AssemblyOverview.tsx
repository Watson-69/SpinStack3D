import React from 'react';

const OVERVIEW_SYSTEM_SPECS: ReadonlyArray<{
  label: string;
  value: string;
  accent?: boolean;
}> = [
  { label: 'Form Factor', value: '3.5-inch Half Height (25.4 mm)' },
  { label: 'Rotational Speed', value: '7,200 RPM (120 Hz)', accent: true },
  { label: 'Recording Tech', value: 'PMR (Perpendicular Magnetic)' },
  { label: 'Interface Protocol', value: 'SATA 6.0 Gb/s (SFF-8482)' },
  { label: 'Enclosure Atmosphere', value: 'Cleanroom Class 100 Air' },
];

/**
 * Default right-hand architectural overview shown when no individual component is selected.
 */
export const AssemblyOverview: React.FC = () => {
  return (
    <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
      <div className="space-y-4">
        <div className="border-b border-line pb-3">
          <span className="font-mono-tech text-[10px] font-bold text-accent uppercase tracking-wider">
            VOL. 01 // HARDWARE ARCHITECTURE
          </span>
          <h2 className="font-editorial-title text-lg text-ink uppercase tracking-[-0.04em] mt-1 leading-tight">
            3.5-Inch Enterprise Storage Subsystem
          </h2>
          <p className="font-mono-tech text-[10px] text-muted uppercase tracking-wider mt-1">
            Perpendicular Magnetic Recording (PMR) Subsystem
          </p>
        </div>

        <div className="text-xs text-ink/90 leading-relaxed font-sans">
          <p className="drop-cap leading-relaxed">
            Modern hard disk drives represent one of humanity&rsquo;s most sophisticated electromechanical achievements, operating nanometer-scale read/write transducers across aerodynamic air bearings at rotational speeds up to 15,000 RPM within cleanroom-sealed enclosures.
          </p>
        </div>

        <div className="schematic-box p-3.5 space-y-2">
          <span className="font-mono-tech text-[10px] font-bold text-accent uppercase tracking-wider block border-b border-line pb-1.5">
            SYSTEM SPECIFICATIONS (SFF-8301)
          </span>

          <table className="w-full table-fixed text-xs text-left border-collapse">
            <tbody>
              {OVERVIEW_SYSTEM_SPECS.map((row, idx) => (
                <tr
                  key={row.label}
                  className={idx < OVERVIEW_SYSTEM_SPECS.length - 1 ? 'border-b border-line/60' : ''}
                >
                  <td className="py-1.5 pr-2 font-mono-tech text-[10px] text-muted uppercase w-[44%] break-words">
                    {row.label}
                  </td>
                  <td
                    className={`py-1.5 font-mono text-[11px] break-words ${
                      row.accent ? 'text-accent font-bold' : 'text-ink font-medium'
                    }`}
                  >
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border border-line bg-surface text-xs text-muted leading-relaxed">
          <span className="font-mono-tech text-[9px] font-bold uppercase text-ink block mb-1">
            INTERACTIVE INSTRUCTIONS
          </span>
          Select a chapter index on the left sidebar or click any component callout marker in the 3D viewport to inspect its governing physical principles, formulas, and tolerances.
        </div>
      </div>

      <div className="pt-4 border-t border-line flex items-center justify-between text-[10px] font-mono-tech text-muted">
        <span>CH. 01–04 // 11 PARTS</span>
        <span>REV. 2026.4</span>
      </div>
    </div>
  );
};
