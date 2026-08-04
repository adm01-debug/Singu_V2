import { describe, it, expect } from 'vitest';
import { SLEIGHT_OF_MOUTH_PATTERNS, SleightOfMouthPattern } from '@/data/sleightOfMouth';

describe('Sleight of Mouth Patterns', () => {
  const patterns = Object.values(SLEIGHT_OF_MOUTH_PATTERNS);
  const patternKeys = Object.keys(SLEIGHT_OF_MOUTH_PATTERNS) as SleightOfMouthPattern[];

  it('has exactly 14 patterns (Robert Dilts)', () => {
    expect(patternKeys.length).toBe(14);
  });

  it('all patterns have matching id and key', () => {
    for (const key of patternKeys) {
      expect(SLEIGHT_OF_MOUTH_PATTERNS[key].id).toBe(key);
    }
  });

  it('all patterns have required string fields', () => {
    for (const p of patterns) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.nameEn.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(10);
      expect(p.howItWorks.length).toBeGreaterThan(10);
      expect(p.formula.length).toBeGreaterThan(5);
      expect(p.icon.length).toBeGreaterThan(0);
      expect(p.color.length).toBeGreaterThan(0);
    }
  });

  it('all patterns have valid category', () => {
    const validCategories = ['meaning', 'context', 'challenge'];
    for (const p of patterns) {
      expect(validCategories).toContain(p.category);
    }
  });

  it('all 3 categories are represented', () => {
    const categories = new Set(patterns.map(p => p.category));
    expect(categories.size).toBe(3);
  });

  it('all patterns have at least 1 example', () => {
    for (const p of patterns) {
      expect(p.examples.length, `${p.id}: no examples`).toBeGreaterThan(0);
    }
  });

  it('all patterns have bestFor suggestions', () => {
    for (const p of patterns) {
      expect(p.bestFor.length, `${p.id}: no bestFor`).toBeGreaterThan(0);
    }
  });

  it('examples are non-empty strings', () => {
    for (const p of patterns) {
      for (const ex of p.examples) {
        expect(ex.length).toBeGreaterThan(5);
      }
    }
  });

  it('pattern colors use Tailwind classes', () => {
    for (const p of patterns) {
      expect(p.color).toMatch(/bg-\w+/);
      expect(p.color).toMatch(/text-\w+/);
    }
  });

  it('no duplicate pattern names', () => {
    const names = patterns.map(p => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('no duplicate English names', () => {
    const names = patterns.map(p => p.nameEn);
    expect(new Set(names).size).toBe(names.length);
  });

  it('formulas contain template brackets or quotes', () => {
    for (const p of patterns) {
      const hasTemplate = p.formula.includes('[') || p.formula.includes('"');
      expect(hasTemplate, `${p.id}: formula lacks template markers`).toBe(true);
    }
  });
});
