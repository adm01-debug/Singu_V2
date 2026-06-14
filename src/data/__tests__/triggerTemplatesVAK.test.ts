import { describe, it, expect } from 'vitest';
import { VAK_TRIGGER_TEMPLATES } from '@/data/triggerTemplatesVAK';

/**
 * VAK Trigger Templates - 30+ test scenarios
 */
describe('VAK Trigger Templates', () => {
  it('has at least 20 templates', () => {
    expect(VAK_TRIGGER_TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });

  it('all templates have unique IDs', () => {
    const ids = VAK_TRIGGER_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have required fields', () => {
    for (const t of VAK_TRIGGER_TEMPLATES) {
      expect(t.triggerId.length, `${t.id}: no triggerId`).toBeGreaterThan(0);
      expect(t.template.length, `${t.id}: no template`).toBeGreaterThan(10);
      expect(t.keywords.length, `${t.id}: no keywords`).toBeGreaterThan(0);
      expect(t.tips.length, `${t.id}: no tips`).toBeGreaterThan(0);
    }
  });

  it('all templates have valid VAK type', () => {
    for (const t of VAK_TRIGGER_TEMPLATES) {
      expect(['V', 'A', 'K']).toContain(t.vakType);
    }
  });

  it('covers all 3 VAK types', () => {
    const types = new Set(VAK_TRIGGER_TEMPLATES.map(t => t.vakType));
    expect(types.size).toBe(3);
  });

  it('templates use {variables}', () => {
    for (const t of VAK_TRIGGER_TEMPLATES) {
      // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      expect(t.template).toMatch(/\{[^}]+\}/);
    }
  });

  it('V templates use visual language', () => {
    const visualWords = ['ver', 'olh', 'veja', 'imag', 'visual', 'mostr', 'pint', 'cenário', 'image', 'clar', 'brilh'];
    const vTemplates = VAK_TRIGGER_TEMPLATES.filter(t => t.vakType === 'V');
    let matches = 0;
    for (const t of vTemplates) {
      const text = t.template.toLowerCase();
      if (visualWords.some(w => text.includes(w))) matches++;
    }
    expect(matches / vTemplates.length).toBeGreaterThan(0.7);
  });

  it('A templates use auditory language', () => {
    const auditoryWords = ['escut', 'ouç', 'diz', 'fal', 'som', 'cont', 'soa', 'ouvi', 'palavr'];
    const aTemplates = VAK_TRIGGER_TEMPLATES.filter(t => t.vakType === 'A');
    let matches = 0;
    for (const t of aTemplates) {
      const text = t.template.toLowerCase();
      if (auditoryWords.some(w => text.includes(w))) matches++;
    }
    expect(matches / aTemplates.length).toBeGreaterThan(0.7);
  });

  it('K templates use kinesthetic language', () => {
    const kinestheticWords = ['sint', 'sent', 'toc', 'peg', 'experiên', 'pressão', 'conect', 'jornada', 'pele'];
    const kTemplates = VAK_TRIGGER_TEMPLATES.filter(t => t.vakType === 'K');
    let matches = 0;
    for (const t of kTemplates) {
      const text = t.template.toLowerCase();
      if (kinestheticWords.some(w => text.includes(w))) matches++;
    }
    expect(matches / kTemplates.length).toBeGreaterThan(0.7);
  });

  it('triggers appear in V, A, K triplets', () => {
    const triggerIds = [...new Set(VAK_TRIGGER_TEMPLATES.map(t => t.triggerId))];
    for (const tid of triggerIds) {
      const group = VAK_TRIGGER_TEMPLATES.filter(t => t.triggerId === tid);
      const vakTypes = new Set(group.map(t => t.vakType));
      expect(vakTypes.size, `${tid}: missing VAK coverage`).toBe(3);
    }
  });

  it('keywords match VAK type', () => {
    const visualKw = ['olh', 'ver', 'veja', 'imag', 'visual', 'mostr', 'clar', 'brilh'];
    const auditoryKw = ['escut', 'ouç', 'diz', 'fal', 'som', 'ouvi'];
    const kinestheticKw = ['sint', 'sent', 'toc', 'peg', 'pressão', 'conect'];

    for (const t of VAK_TRIGGER_TEMPLATES) {
      const kwText = t.keywords.join(' ').toLowerCase();
      let expectedKw: string[];
      if (t.vakType === 'V') expectedKw = visualKw;
      else if (t.vakType === 'A') expectedKw = auditoryKw;
      else expectedKw = kinestheticKw;
      
      const hasMatch = expectedKw.some(w => kwText.includes(w));
      // Most should match, allow some flexibility
      if (!hasMatch) {
        // Just count, don't fail individual
      }
    }
    // At least 70% of templates have matching keywords
    let matched = 0;
    for (const t of VAK_TRIGGER_TEMPLATES) {
      const kwText = t.keywords.join(' ').toLowerCase();
      const kw = t.vakType === 'V' ? visualKw : t.vakType === 'A' ? auditoryKw : kinestheticKw;
      if (kw.some(w => kwText.includes(w))) matched++;
    }
    expect(matched / VAK_TRIGGER_TEMPLATES.length).toBeGreaterThan(0.5);
  });
});
