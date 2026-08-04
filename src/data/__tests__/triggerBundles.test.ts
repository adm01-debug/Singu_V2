import { describe, it, expect } from 'vitest';
import { TRIGGER_BUNDLES } from '@/data/triggerBundles';

/**
 * Trigger Bundles Data Integrity - 40+ scenarios
 */
describe('Trigger Bundles Integrity', () => {
  it('has at least 5 bundles', () => {
    expect(TRIGGER_BUNDLES.length).toBeGreaterThanOrEqual(5);
  });

  it('all bundles have unique IDs', () => {
    const ids = TRIGGER_BUNDLES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  describe.each(TRIGGER_BUNDLES.map(b => [b.id, b] as const))('Bundle %s', (id, bundle) => {
    it('has name in PT and EN', () => {
      expect(bundle.name).toBeTruthy();
      expect(bundle.nameEn).toBeTruthy();
    });

    it('has description', () => {
      expect(bundle.description.length).toBeGreaterThan(10);
    });

    it('has DISC profiles', () => {
      expect(bundle.discProfiles.length).toBeGreaterThan(0);
      for (const p of bundle.discProfiles) {
        expect(['D', 'I', 'S', 'C']).toContain(p);
      }
    });

    it('has VAK profiles', () => {
      expect(bundle.vakProfiles.length).toBeGreaterThan(0);
      for (const v of bundle.vakProfiles) {
        expect(['V', 'A', 'K']).toContain(v);
      }
    });

    it('has triggers', () => {
      expect(bundle.triggers.length).toBeGreaterThan(0);
    });

    it('has timing sequence', () => {
      expect(bundle.timing.length).toBeGreaterThan(0);
      for (const t of bundle.timing) {
        expect(t.delayMinutes).toBeGreaterThanOrEqual(0);
        expect(t.intensityLevel).toBeGreaterThanOrEqual(1);
        expect(t.intensityLevel).toBeLessThanOrEqual(5);
      }
    });

    it('has neural path', () => {
      expect(bundle.neuralPath.brainSequence.length).toBeGreaterThan(0);
      expect(bundle.neuralPath.chemicalFlow.length).toBeGreaterThan(0);
    });

    it('has templates', () => {
      expect(bundle.openingTemplate).toBeTruthy();
      expect(bundle.closingTemplate).toBeTruthy();
    });

    it('has valid success rate (0-100)', () => {
      expect(bundle.successRate).toBeGreaterThanOrEqual(0);
      expect(bundle.successRate).toBeLessThanOrEqual(100);
    });

    it('has valid difficulty level', () => {
      expect(['beginner', 'intermediate', 'advanced', 'expert']).toContain(bundle.difficultyLevel);
    });

    it('has do and dont lists', () => {
      expect(bundle.doList.length).toBeGreaterThan(0);
      expect(bundle.dontList.length).toBeGreaterThan(0);
    });

    it('estimated duration is positive', () => {
      expect(bundle.estimatedDurationMinutes).toBeGreaterThan(0);
    });
  });
});
