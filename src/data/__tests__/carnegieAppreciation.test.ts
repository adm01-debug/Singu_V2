import { describe, it, expect } from 'vitest';
import { APPRECIATION_TEMPLATES } from '@/data/carnegieAppreciation';

/**
 * Carnegie Appreciation Data Integrity - 20+ scenarios
 */
describe('Carnegie Appreciation Templates', () => {
  const templates = Object.entries(APPRECIATION_TEMPLATES);

  it('has at least 3 appreciation types', () => {
    expect(templates.length).toBeGreaterThanOrEqual(3);
  });

  describe.each(templates)('Type %s', (key, tmpl) => {
    it('has name', () => {
      expect(tmpl.name).toBeTruthy();
    });

    it('has description', () => {
      expect(tmpl.description.length).toBeGreaterThan(10);
    });

    it('has examples', () => {
      expect(tmpl.examples.length).toBeGreaterThan(0);
      for (const ex of tmpl.examples) {
        expect(ex.length).toBeGreaterThan(5);
      }
    });

    it('has whenToUse', () => {
      expect(tmpl.whenToUse.length).toBeGreaterThan(0);
    });

    it('has valid impact', () => {
      expect(['low', 'medium', 'high', 'very_high']).toContain(tmpl.impact);
    });
  });
});
