export type KnockoutTheme = 'dark' | 'light' | 'signal';

export const KNOCKOUT_THEMES: ReadonlyArray<{
  id: KnockoutTheme;
  label: string;
  color: string;
}> = [
  { id: 'dark', label: 'Obsidian', color: 'var(--cutline-obsidian)' },
  { id: 'light', label: 'Alabaster', color: 'var(--cutline-cream)' },
  { id: 'signal', label: 'Signal red', color: 'var(--cutline-signal)' },
];
