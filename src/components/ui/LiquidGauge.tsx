import React, { useId } from 'react';

export interface LiquidGaugeProps {
  /** Fill percentage (0 to 100). */
  value: number;
  /** Diameter of the circular gauge in pixels. Defaults to 56. */
  size?: number;
  /** Accessible label description. Defaults to "Explode". */
  label?: string;
  /** Optional click handler (e.g. to toggle state). */
  onClick?: () => void;
  /** Optional custom aria-label override. */
  'aria-label'?: string;
  /** Optional custom CSS class name. */
  className?: string;
}

/**
 * SVG Liquid Gauge themed with Knockout tokens (`--page`, `--line`, `--accent`, `--ink`).
 * Pauses wave animations at boundary values (0% / 100%) to keep idle compositor cost at zero.
 */
export const LiquidGauge: React.FC<LiquidGaugeProps> = ({
  value,
  size = 56,
  label = 'Explode',
  onClick,
  'aria-label': customAriaLabel,
  className = '',
}) => {
  const clipId = useId();

  const clampedValue = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  const roundedPercent = Math.round(clampedValue);

  const radius = size / 2;
  const innerRadius = Math.max(1, radius - 1);
  const waveWidth = size * 2;
  const waveHeight = size + 16;

  const isBoundary = clampedValue <= 0 || clampedValue >= 100;
  const amplitude = isBoundary ? 0 : Math.min(2.5, Math.max(0.8, size * 0.045));
  const fillY = size - (clampedValue / 100) * size;

  const p = size;
  const a = amplitude;
  const wavePath = `
    M 0 0
    C ${p * 0.25} ${-a}, ${p * 0.25} ${-a}, ${p * 0.5} 0
    C ${p * 0.75} ${a}, ${p * 0.75} ${a}, ${p} 0
    C ${p * 1.25} ${-a}, ${p * 1.25} ${-a}, ${p * 1.5} 0
    C ${p * 1.75} ${a}, ${p * 1.75} ${a}, ${waveWidth} 0
    L ${waveWidth} ${waveHeight}
    L 0 ${waveHeight}
    Z
  `
    .replace(/\s+/g, ' ')
    .trim();

  const ariaLabel = customAriaLabel || `${label}: ${roundedPercent}%`;

  return (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={roundedPercent}
      aria-label={ariaLabel}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={`relative inline-flex items-center justify-center rounded-full select-none shrink-0 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="w-full h-full overflow-hidden rounded-full"
      >
        <defs>
          <clipPath id={clipId}>
            <circle cx={radius} cy={radius} r={innerRadius - 0.5} />
          </clipPath>
        </defs>

        <circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="var(--page)"
          stroke="var(--line)"
          strokeWidth="1"
        />

        <g clipPath={`url(#${clipId})`}>
          <g
            className="liquid-fill-group"
            style={{
              transform: `translateY(${fillY}px)`,
              transition: 'transform 220ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <path
              d={wavePath}
              fill="var(--accent)"
              opacity={0.45}
              className={isBoundary ? undefined : 'liquid-wave-back'}
            />
            <path
              d={wavePath}
              fill="var(--accent)"
              className={isBoundary ? undefined : 'liquid-wave-front'}
            />
          </g>
        </g>

        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fill={roundedPercent > 55 ? 'var(--accent-ink)' : 'var(--ink)'}
          className="font-mono tabular-nums font-bold tracking-tighter pointer-events-none"
          style={{
            fontSize: size <= 32 ? '8.5px' : size <= 42 ? '10.5px' : '12px',
          }}
        >
          {roundedPercent}%
        </text>
      </svg>
    </div>
  );
};

export default LiquidGauge;
