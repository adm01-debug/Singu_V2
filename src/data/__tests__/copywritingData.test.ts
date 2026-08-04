import { describe, it, expect } from 'vitest';
import { FAB_TEMPLATES } from '@/data/copywritingData';

/**
 * Copywriting Data Integrity - 30+ scenarios
 */
describe('FAB Templates Integrity', () => {
  it('has at least 3 FAB templates', () => {
    expect(FAB_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('all templates have unique IDs', () => {
    const ids = FAB_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have required fields', () => {
    for (const tmpl of FAB_TEMPLATES) {
      expect(tmpl.id, 'id missing').toBeTruthy();
      expect(tmpl.name, `${tmpl.id}: name missing`).toBeTruthy();
      expect(tmpl.category, `${tmpl.id}: category missing`).toBeTruthy();
    }
  });

  it('all templates have prompts', () => {
    for (const tmpl of FAB_TEMPLATES) {
      expect(tmpl.template.featurePrompt, `${tmpl.id}: featurePrompt`).toBeTruthy();
      expect(tmpl.template.advantagePrompt, `${tmpl.id}: advantagePrompt`).toBeTruthy();
      expect(tmpl.template.benefitPrompt, `${tmpl.id}: benefitPrompt`).toBeTruthy();
    }
  });

  it('all templates have examples', () => {
    for (const tmpl of FAB_TEMPLATES) {
      expect(tmpl.example, `${tmpl.id}: example missing`).toBeTruthy();
      expect(tmpl.example.feature, `${tmpl.id}: feature`).toBeTruthy();
      expect(tmpl.example.advantage, `${tmpl.id}: advantage`).toBeTruthy();
      expect(tmpl.example.benefit, `${tmpl.id}: benefit`).toBeTruthy();
    }
  });

  it('all templates have power words', () => {
    for (const tmpl of FAB_TEMPLATES) {
      expect(tmpl.powerWords.length, `${tmpl.id}: no power words`).toBeGreaterThan(0);
    }
  });

  it('example IDs are unique', () => {
    const ids = FAB_TEMPLATES.map(t => t.example.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
