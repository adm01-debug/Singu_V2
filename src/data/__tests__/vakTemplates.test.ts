import { describe, it, expect } from 'vitest';
import { VAK_ADAPTED_TEMPLATES } from '@/data/vakTemplates';

/**
 * VAK Templates Integrity - 40+ scenarios
 */
describe('VAK Adapted Templates', () => {
  it('has at least 5 templates', () => {
    expect(VAK_ADAPTED_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('all templates have unique IDs', () => {
    const ids = VAK_ADAPTED_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have base title', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      expect(tmpl.baseTitle, `${tmpl.id}: missing baseTitle`).toBeTruthy();
    }
  });

  it('all templates have valid channel', () => {
    const validChannels = ['whatsapp', 'email', 'call', 'meeting', 'any'];
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      expect(validChannels, `${tmpl.id}: invalid channel ${tmpl.channel}`).toContain(tmpl.channel);
    }
  });

  it('all templates have variations', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      expect(tmpl.variations.length, `${tmpl.id}: no variations`).toBeGreaterThan(0);
    }
  });

  it('all templates have universal tips', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      expect(tmpl.universalTips.length, `${tmpl.id}: no universalTips`).toBeGreaterThan(0);
    }
  });

  it('variations cover V, A, K types', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      const vakTypes = tmpl.variations.map(v => v.vakType);
      expect(vakTypes, `${tmpl.id}: missing V`).toContain('V');
      expect(vakTypes, `${tmpl.id}: missing A`).toContain('A');
      expect(vakTypes, `${tmpl.id}: missing K`).toContain('K');
    }
  });

  it('all variations have template text', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      for (const variation of tmpl.variations) {
        expect(variation.template.length, `${tmpl.id}/${variation.vakType}: empty template`).toBeGreaterThan(10);
      }
    }
  });

  it('all variations have keywords', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      for (const variation of tmpl.variations) {
        expect(variation.keywords.length, `${tmpl.id}/${variation.vakType}: no keywords`).toBeGreaterThan(0);
      }
    }
  });

  it('all variations have tips', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      for (const variation of tmpl.variations) {
        expect(variation.tips.length, `${tmpl.id}/${variation.vakType}: no tips`).toBeGreaterThan(0);
      }
    }
  });

  it('template variables are referenced in variation templates', () => {
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      if (tmpl.variables.length > 0) {
        for (const variation of tmpl.variations) {
          // At least one variable should be in the template
          const hasVariable = tmpl.variables.some(v => variation.template.includes(`{${v}}`));
          expect(hasVariable, `${tmpl.id}/${variation.vakType}: no variables used in template`).toBe(true);
        }
      }
    }
  });

  it('V templates use visual language', () => {
    const visualKeywords = ['ver', 'visão', 'mostrar', 'imagine', 'olh', 'panorama', 'imag', 'brilh', 'clar'];
    for (const tmpl of VAK_ADAPTED_TEMPLATES) {
      const vVariation = tmpl.variations.find(v => v.vakType === 'V');
      if (vVariation) {
        const text = vVariation.template.toLowerCase();
        const hasVisual = visualKeywords.some(k => text.includes(k));
        // Allow for some templates not having explicit visual words
        if (!hasVisual) {
          const keywordsHaveVisual = vVariation.keywords.some(k =>
            visualKeywords.some(vk => k.toLowerCase().includes(vk))
          );
          expect(keywordsHaveVisual || hasVisual, `${tmpl.id}/V: no visual language`).toBe(true);
        }
      }
    }
  });
});
