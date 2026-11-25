/**
 * Clamps a numeric value to [min, max]. Non-finite inputs fall back to min.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Clamps a numeric value to the unit interval [0, 1].
 */
export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

/**
 * Symmetric cubic ease-in-out curve for normalized progress t in [0, 1].
 */
export function easeInOutCubic(t: number): number {
  const clamped = clamp01(t);
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
}

/**
 * Normalizes either 0..1 fraction or 0..100 percentage input into [0, 1].
 */
export function normalizeProgressInput(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return clamp01(value > 1.0 ? value / 100 : value);
}
