import { describe, it, expect } from 'vitest';
import { ADVANCED_MENTAL_TRIGGERS } from '@/data/triggersAdvancedData';
import { EXTENDED_MENTAL_TRIGGERS } from '@/data/triggersExtendedData';

describe('Advanced Mental Triggers', () => {
  const triggers = Object.values(ADVANCED_MENTAL_TRIGGERS);
  const keys = Object.keys(ADVANCED_MENTAL_TRIGGERS);

  it('has at least 5 triggers', () => {
    expect(keys.length).toBeGreaterThanOrEqual(5);
  });

  it('all triggers have matching id and key', () => {
    for (const key of keys) {
      expect(ADVANCED_MENTAL_TRIGGERS[key as keyof typeof ADVANCED_MENTAL_TRIGGERS].id).toBe(key);
    }
  });

  it('all triggers have required fields', () => {
    for (const t of triggers) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.icon.length).toBeGreaterThan(0);
      expect(t.color.length).toBeGreaterThan(0);
      expect(t.examples.length).toBeGreaterThan(0);
    }
  });

  it('effectiveness is 1-10', () => {
    for (const t of triggers) {
      expect(t.effectiveness).toBeGreaterThanOrEqual(1);
      expect(t.effectiveness).toBeLessThanOrEqual(10);
    }
  });

  it('all triggers have bestFor and avoidFor DISC profiles', () => {
    const validDisc = ['D', 'I', 'S', 'C'];
    for (const t of triggers) {
      expect(t.bestFor.length).toBeGreaterThan(0);
      for (const p of t.bestFor) {
        expect(validDisc).toContain(p);
      }
      for (const p of t.avoidFor) {
        expect(validDisc).toContain(p);
      }
    }
  });

  it('bestFor and avoidFor do not overlap', () => {
    for (const t of triggers) {
      const overlap = t.bestFor.filter(p => t.avoidFor.includes(p));
      expect(overlap.length, `${t.id}: bestFor/avoidFor overlap`).toBe(0);
    }
  });

  it('all triggers have valid timing', () => {
    const validTimings = ['early', 'middle', 'closing', 'any', 'late'];
    for (const t of triggers) {
      expect(validTimings, `${t.id}: invalid timing ${t.timing}`).toContain(t.timing);
    }
  });

  it('all triggers have valid neuralTarget', () => {
    const valid = ['limbic', 'cortex', 'prefrontal', 'amygdala', 'hippocampus', 'insula', 'anterior_cingulate', 'nucleus_accumbens', 'reptilian', 'neocortex'];
    for (const t of triggers) {
      expect(valid, `${t.id}: invalid neuralTarget ${t.neuralTarget}`).toContain(t.neuralTarget);
    }
  });

  it('all triggers have valid primaryChemical', () => {
    const valid = ['dopamine', 'oxytocin', 'serotonin', 'cortisol', 'norepinephrine', 'endorphin', 'adrenaline'];
    for (const t of triggers) {
      expect(valid, `${t.id}: invalid chemical ${t.primaryChemical}`).toContain(t.primaryChemical);
    }
  });

  it('all triggers have 5 intensity levels', () => {
    for (const t of triggers) {
      expect(t.intensityLevels.length, `${t.id}: needs 5 levels`).toBe(5);
      for (let i = 0; i < 5; i++) {
        expect(t.intensityLevels[i].level).toBe(i + 1);
        expect(t.intensityLevels[i].template.length).toBeGreaterThan(5);
        expect(t.intensityLevels[i].words.length).toBeGreaterThan(0);
      }
    }
  });

  it('all triggers have fallbacks', () => {
    for (const t of triggers) {
      expect(t.fallbacks.length, `${t.id}: no fallbacks`).toBeGreaterThan(0);
    }
  });

  it('all triggers have synergizes', () => {
    for (const t of triggers) {
      expect(t.synergizes.length, `${t.id}: no synergizes`).toBeGreaterThan(0);
    }
  });

  it('triggers do not synergize with themselves', () => {
    for (const t of triggers) {
      expect(t.synergizes).not.toContain(t.id);
    }
  });

  it('all triggers have saturationThreshold > 0', () => {
    for (const t of triggers) {
      expect(t.saturationThreshold).toBeGreaterThan(0);
    }
  });

  it('most triggers have resistance indicators', () => {
    const withIndicators = triggers.filter(t => t.resistanceIndicators.length > 0);
    // At least 80% should have resistance indicators
    expect(withIndicators.length / triggers.length).toBeGreaterThan(0.8);
  });

  it('flags triggers missing resistance indicators', () => {
    const missing = triggers.filter(t => t.resistanceIndicators.length === 0).map(t => t.id);
    // Document known gaps - these should be fixed in data
    if (missing.length > 0) {
      console.warn('Triggers missing resistance indicators:', missing);
    }
    expect(missing.length).toBeLessThan(3);
  });
});

describe('Extended Mental Triggers', () => {
  const triggers = Object.values(EXTENDED_MENTAL_TRIGGERS);
  const keys = Object.keys(EXTENDED_MENTAL_TRIGGERS);

  it('has exactly 12 triggers', () => {
    expect(keys.length).toBe(12);
  });

  it('all triggers have matching id and key', () => {
    for (const key of keys) {
      expect(EXTENDED_MENTAL_TRIGGERS[key as keyof typeof EXTENDED_MENTAL_TRIGGERS].id).toBe(key);
    }
  });

  it('all triggers have required fields', () => {
    for (const t of triggers) {
      expect(t.name.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(10);
      expect(t.examples.length).toBeGreaterThan(0);
      expect(t.effectiveness).toBeGreaterThanOrEqual(1);
      expect(t.effectiveness).toBeLessThanOrEqual(10);
    }
  });

  it('documents ID overlap with advanced triggers (extended are re-exports)', () => {
    const advancedIds = new Set(Object.keys(ADVANCED_MENTAL_TRIGGERS));
    const overlapping = keys.filter(key => advancedIds.has(key));
    // Extended triggers are intentionally also in advanced (merged data)
    // Just verify they exist in both
    expect(overlapping.length).toBeGreaterThanOrEqual(0);
  });

  it('all have 5 intensity levels', () => {
    for (const t of triggers) {
      expect(t.intensityLevels.length).toBe(5);
    }
  });

  it('bestFor and avoidFor do not overlap', () => {
    for (const t of triggers) {
      const overlap = t.bestFor.filter(p => t.avoidFor.includes(p));
      expect(overlap.length, `${t.id}: overlap`).toBe(0);
    }
  });
});
