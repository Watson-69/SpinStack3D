import React, { useRef, useState, useCallback } from 'react';

export interface ExplodeSliderProps {
  /** Exploded value (0 to 100) */
  value: number;
  /** Callback when value changes (0 to 100) */
  onChange: (value: number) => void;
  /** Optional min value, default 0 */
  min?: number;
  /** Optional max value, default 100 */
  max?: number;
  /** Optional step, default 1 */
  step?: number;
  /** Optional disabled flag */
  disabled?: boolean;
  /** Optional CSS class name */
  className?: string;
  /** Optional custom aria-label */
  'aria-label'?: string;
}

/**
 * Sharp Knockout Precision Explode Slider
 *
 * Pointer-captured slider that prevents camera OrbitControls bleed and supports
 * full keyboard control with ARIA role="slider" semantics.
 */
export const ExplodeSlider: React.FC<ExplodeSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
  'aria-label': ariaLabel = 'Disassembly progress',
}) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const safeValue = Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
  const range = Math.max(1, max - min);
  const percent = ((safeValue - min) / range) * 100;

  const calculateValueFromPointer = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return safeValue;
      const rect = trackRef.current.getBoundingClientRect();
      if (rect.width <= 0) return safeValue;

      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      const raw = min + ratio * range;
      const stepped = Math.round(raw / step) * step;
      return Math.min(max, Math.max(min, Number(stepped.toFixed(2))));
    },
    [min, max, range, step, safeValue]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.stopPropagation();
    e.preventDefault();
    isDragging.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignore synthetic events
    }
    onChange(calculateValueFromPointer(e.clientX));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || disabled) return;
    e.stopPropagation();
    e.preventDefault();
    onChange(calculateValueFromPointer(e.clientX));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    e.stopPropagation();
    isDragging.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const delta = e.shiftKey ? step * 10 : step;
    let nextValue = safeValue;

    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        e.preventDefault();
        e.stopPropagation();
        nextValue = Math.min(max, safeValue + delta);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        e.preventDefault();
        e.stopPropagation();
        nextValue = Math.max(min, safeValue - delta);
        break;
      case 'Home':
        e.preventDefault();
        e.stopPropagation();
        nextValue = min;
        break;
      case 'End':
        e.preventDefault();
        e.stopPropagation();
        nextValue = max;
        break;
      case 'PageUp':
        e.preventDefault();
        e.stopPropagation();
        nextValue = Math.min(max, safeValue + delta * 2);
        break;
      case 'PageDown':
        e.preventDefault();
        e.stopPropagation();
        nextValue = Math.max(min, safeValue - delta * 2);
        break;
      default:
        return;
    }

    onChange(nextValue);
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(safeValue)}
      tabIndex={disabled ? -1 : 0}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ touchAction: 'none' }}
      className={`relative flex items-center h-6 w-20 sm:w-24 md:w-28 cursor-pointer select-none outline-none group ${
        disabled ? 'opacity-40 cursor-not-allowed' : ''
      } ${className}`}
    >
      {/* Sharp 1px Track */}
      <div className="relative w-full h-1 bg-page overflow-hidden border border-line">
        <div
          className="h-full bg-accent transition-colors"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Sharp Rectangular Tactile Thumb */}
      <div
        className={`absolute top-1/2 w-3 h-3 bg-ink border border-page pointer-events-none transition-transform ${
          isFocused || isHovered || isDragging.current ? 'scale-125' : ''
        }`}
        style={{
          left: `${percent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      />
    </div>
  );
};

export default ExplodeSlider;
