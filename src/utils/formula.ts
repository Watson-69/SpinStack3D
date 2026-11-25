const FORMULA_REPLACEMENTS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\\nabla/g, '∇'],
  [/\\cdot/g, ' · '],
  [/\\times/g, ' × '],
  [/\\partial/g, '∂'],
  [/\\left\s*[([{]/g, '('],
  [/\\right\s*[)\]}]/g, ')'],
  [/\\left\b/g, ''],
  [/\\right\b/g, ''],
  [/\\ge\b/g, '≥'],
  [/\\le\b/g, '≤'],
  [/\\approx/g, '≈'],
  [/\\xrightarrow\{([^}]+)\}/g, '→($1)'],
  [/\\text\{([^}]+)\}/g, '$1'],
  [/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)'],
  [/\\mu/g, 'μ'],
  [/\\theta/g, 'θ'],
  [/\\tau/g, 'τ'],
  [/\\alpha/g, 'α'],
  [/\\Delta/g, 'Δ'],
  [/\\pi/g, 'π'],
  [/\\vec\{([^}]+)\}/g, '$1⃗'],
  [/\\,/g, ' '],
  [/\\/g, ''],
  [/\s+/g, ' '],
];

export interface FormattedFormula {
  eq: string;
  caption: string;
}

/**
 * Formats LaTeX-style equation strings into clean Unicode textbook notation.
 */
export function formatFormula(raw: string): FormattedFormula {
  if (!raw) return { eq: '', caption: '' };

  const parts = raw.split(/\\quad|\t/);
  let eq = parts[0] || '';
  const rawCaption = parts[1] || '';

  for (const [pattern, replacement] of FORMULA_REPLACEMENTS) {
    eq = eq.replace(pattern, replacement);
  }

  const caption = rawCaption
    ? rawCaption.replace(/[()~]/g, ' ').replace(/\s+/g, ' ').trim()
    : '';

  return { eq: eq.trim(), caption };
}
