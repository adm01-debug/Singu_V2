import { describe, it, expect } from 'vitest';
import { METAPROGRAM_TEMPLATES } from '@/data/metaprogramTemplates';
import { 
  METAPROGRAM_TRIGGER_TEMPLATES, 
  getMetaprogramTemplatesForTrigger, 
  getMetaprogramKeywords, 
  detectMetaprogramFromText, 
  adaptTemplateToMetaprogram,
  MetaprogramType
} from '@/data/triggerTemplatesMetaprograms';

describe('Metaprogram Templates', () => {
  it('has at least 5 templates', () => {
    expect(METAPROGRAM_TEMPLATES.length).toBeGreaterThanOrEqual(5);
  });

  it('all templates have unique IDs', () => {
    const ids = METAPROGRAM_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have valid category', () => {
    const valid = ['sales', 'objection', 'follow_up', 'closing', 'relationship'];
    for (const t of METAPROGRAM_TEMPLATES) {
      expect(valid, `${t.id}: invalid category ${t.category}`).toContain(t.category);
    }
  });

  it('all templates have all 3 variation dimensions', () => {
    for (const t of METAPROGRAM_TEMPLATES) {
      expect(t.variations.motivationDirection.toward.length).toBeGreaterThan(10);
      expect(t.variations.motivationDirection.away_from.length).toBeGreaterThan(10);
      expect(t.variations.referenceFrame.internal.length).toBeGreaterThan(10);
      expect(t.variations.referenceFrame.external.length).toBeGreaterThan(10);
      expect(t.variations.workingStyle.options.length).toBeGreaterThan(10);
      expect(t.variations.workingStyle.procedures.length).toBeGreaterThan(10);
    }
  });

  it('all templates have variables array', () => {
    for (const t of METAPROGRAM_TEMPLATES) {
      expect(t.variables.length).toBeGreaterThan(0);
    }
  });

  it('most toward templates use gain-oriented language', () => {
    const gainWords = ['conquistar', 'alcançar', 'ganhar', 'conseguir', 'resultado', 'crescer', 'construir', 'objetivo', 'sucesso', 'positiv', 'melhor', 'aproxim'];
    let matches = 0;
    for (const t of METAPROGRAM_TEMPLATES) {
      const text = t.variations.motivationDirection.toward.toLowerCase();
      if (gainWords.some(w => text.includes(w))) matches++;
    }
    expect(matches / METAPROGRAM_TEMPLATES.length).toBeGreaterThan(0.7);
  });

  it('most away_from templates use pain-avoidance language', () => {
    const painWords = ['resolver', 'eliminar', 'não', 'perder', 'livrar', 'problema', 'custo', 'dor', 'frustrar', 'preocup', 'evit', 'cuidado', 'continu'];
    let matches = 0;
    for (const t of METAPROGRAM_TEMPLATES) {
      const text = t.variations.motivationDirection.away_from.toLowerCase();
      if (painWords.some(w => text.includes(w))) matches++;
    }
    expect(matches / METAPROGRAM_TEMPLATES.length).toBeGreaterThan(0.7);
  });
});

describe('Metaprogram Trigger Templates', () => {
  it('has at least 20 templates', () => {
    expect(METAPROGRAM_TRIGGER_TEMPLATES.length).toBeGreaterThanOrEqual(20);
  });

  it('all templates have unique IDs', () => {
    const ids = METAPROGRAM_TRIGGER_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have required fields', () => {
    for (const t of METAPROGRAM_TRIGGER_TEMPLATES) {
      expect(t.triggerId.length).toBeGreaterThan(0);
      expect(t.metaprogram.length).toBeGreaterThan(0);
      expect(t.template.length).toBeGreaterThan(10);
      expect(t.keywords.length).toBeGreaterThan(0);
      expect(t.tips.length).toBeGreaterThan(0);
    }
  });

  it('all templates use {variables}', () => {
    for (const t of METAPROGRAM_TRIGGER_TEMPLATES) {
      // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
      expect(t.template).toMatch(/\{[^}]+\}/);
    }
  });

  it('covers all 8 metaprogram types', () => {
    const types = new Set(METAPROGRAM_TRIGGER_TEMPLATES.map(t => t.metaprogram));
    expect(types.size).toBe(8);
  });
});

describe('getMetaprogramTemplatesForTrigger', () => {
  it('returns templates for scarcity + toward', () => {
    const results = getMetaprogramTemplatesForTrigger('scarcity', 'toward');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].metaprogram).toBe('toward');
  });

  it('returns empty for nonexistent trigger', () => {
    const results = getMetaprogramTemplatesForTrigger('nonexistent', 'toward');
    expect(results.length).toBe(0);
  });
});

describe('getMetaprogramKeywords', () => {
  const types: MetaprogramType[] = ['toward', 'away_from', 'internal', 'external', 'proactive', 'reactive', 'options', 'procedures'];
  
  for (const type of types) {
    it(`returns keywords for ${type}`, () => {
      const kw = getMetaprogramKeywords(type);
      expect(kw.length).toBeGreaterThan(3);
    });
  }
});

describe('detectMetaprogramFromText', () => {
  it('detects toward from gain language', () => {
    const scores = detectMetaprogramFromText('Quero conquistar mais clientes e alcançar minha meta');
    expect(scores.toward).toBeGreaterThan(0);
  });

  it('detects away_from from pain language', () => {
    const scores = detectMetaprogramFromText('O problema é que preciso evitar esse risco e resolver isso');
    expect(scores.away_from).toBeGreaterThan(0);
  });

  it('detects proactive from action language', () => {
    const scores = detectMetaprogramFromText('Vamos fazer isso já, agora!');
    expect(scores.proactive).toBeGreaterThan(0);
  });

  it('detects reactive from analysis language', () => {
    const scores = detectMetaprogramFromText('Preciso pensar, vou analisar com calma');
    expect(scores.reactive).toBeGreaterThan(0);
  });

  it('returns empty for neutral text', () => {
    const scores = detectMetaprogramFromText('olá tudo bem');
    expect(Object.keys(scores).length).toBe(0);
  });
});

describe('adaptTemplateToMetaprogram', () => {
  it('adapts toward: replaces "problema" with "oportunidade"', () => {
    const result = adaptTemplateToMetaprogram('Isso é um problema sério', 'toward');
    expect(result).toContain('oportunidade');
  });

  it('adapts away_from: replaces "ganhar" with "não perder"', () => {
    const result = adaptTemplateToMetaprogram('Você pode ganhar muito', 'away_from');
    expect(result.toLowerCase()).toContain('não perder');
  });

  it('adapts proactive: replaces "pense" with "aja"', () => {
    const result = adaptTemplateToMetaprogram('Pense nisso', 'proactive');
    expect(result.toLowerCase()).toContain('aja');
  });

  it('returns unchanged if no matching words', () => {
    const result = adaptTemplateToMetaprogram('Hello world', 'toward');
    expect(result).toBe('Hello world');
  });
});
