export const EXCERPT_WINDOW_PRESETS = {
  short: 80,
  medium: 140,
  long: 240,
} as const;

export const FALLBACK_WINDOW_RATIO = 1.6;

export type ExcerptWindowPreset = keyof typeof EXCERPT_WINDOW_PRESETS;

export const DEFAULT_EXCERPT_PRESET: ExcerptWindowPreset = "medium";

export const EXCERPT_PRESET_STORAGE_KEY = "insights:excerpt-window";

export function getExcerptWindow(preset: ExcerptWindowPreset): number {
  return EXCERPT_WINDOW_PRESETS[preset];
}

export function getFallbackWindow(preset: ExcerptWindowPreset): number {
  return Math.round(EXCERPT_WINDOW_PRESETS[preset] * FALLBACK_WINDOW_RATIO);
}

export function isExcerptWindowPreset(v: unknown): v is ExcerptWindowPreset {
  return typeof v === "string" && v in EXCERPT_WINDOW_PRESETS;
}
