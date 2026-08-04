import { describe, it, expect } from 'vitest';
import { BIAS_CATEGORY_INFO } from '@/data/cognitiveBiasesData';

/**
 * Data integrity tests for cognitive biases dataset
 * Ensures data structure consistency across all entries
 */
describe('Cognitive Biases Data Integrity', () => {
  const categories = Object.entries(BIAS_CATEGORY_INFO);

  it('has at least 4 bias categories', () => {
    expect(categories.length).toBeGreaterThanOrEqual(4);
  });

  it('all categories have required fields', () => {
    for (const [key, info] of categories) {
      expect(info.name, `${key}.name missing`).toBeTruthy();
      expect(info.namePt, `${key}.namePt missing`).toBeTruthy();
      expect(info.icon, `${key}.icon missing`).toBeTruthy();
      expect(info.description, `${key}.description missing`).toBeTruthy();
      expect(info.color, `${key}.color missing`).toBeTruthy();
    }
  });

  it('all category colors are valid tailwind classes', () => {
    for (const [key, info] of categories) {
      expect(info.color, `${key}.color invalid`).toMatch(/^text-[\w-]+$/);
    }
  });

  it('all category icons are emojis (non-empty)', () => {
    for (const [key, info] of categories) {
      expect(info.icon.length, `${key}.icon empty`).toBeGreaterThan(0);
    }
  });

  it('no duplicate category names', () => {
    const names = categories.map(([, info]) => info.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('no duplicate PT names', () => {
    const names = categories.map(([, info]) => info.namePt);
    expect(new Set(names).size).toBe(names.length);
  });
});
