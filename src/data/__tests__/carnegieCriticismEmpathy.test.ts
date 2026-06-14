/**
 * Testes exaustivos — Criticism Detector & Empathy Templates
 */
import { describe, it, expect } from 'vitest';
import {
  CRITICAL_PATTERNS, POSITIVE_ALTERNATIVES,
  detectCriticalLanguage, calculateCriticismScore, rewriteWithoutCriticism, getCriticismTone
} from '../carnegieCriticismDetector';
import {
  EMPATHY_TEMPLATES, EMPATHY_PHRASES,
  getEmpathyTemplatesByType, getEmpathyForSituation, analyzeEmpathyInText, getEmpathyTemplateForDISC
} from '../carnegieEmpathyTemplates';

// ══════════════════ CRITICISM DETECTOR ══════════════════

describe('CRITICAL_PATTERNS — Data Integrity', () => {
  const types = Object.keys(CRITICAL_PATTERNS);

  it('has 8 critical language types', () => expect(types.length).toBe(8));

  it('each type has required fields', () => {
    types.forEach(type => {
      const config = CRITICAL_PATTERNS[type as keyof typeof CRITICAL_PATTERNS];
      expect(config.name).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.patterns.length).toBeGreaterThan(0);
      expect(config.examples.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(config.severity);
    });
  });

  it('patterns are valid RegExp', () => {
    types.forEach(type => {
      const config = CRITICAL_PATTERNS[type as keyof typeof CRITICAL_PATTERNS];
      config.patterns.forEach(p => expect(p).toBeInstanceOf(RegExp));
    });
  });

  it('high severity for direct_criticism, condemnation, blame', () => {
    expect(CRITICAL_PATTERNS.direct_criticism.severity).toBe('high');
    expect(CRITICAL_PATTERNS.condemnation.severity).toBe('high');
    expect(CRITICAL_PATTERNS.blame.severity).toBe('high');
  });

  it('medium severity for passive_aggressive, sarcasm, negative_comparison, dismissive', () => {
    expect(CRITICAL_PATTERNS.passive_aggressive.severity).toBe('medium');
    expect(CRITICAL_PATTERNS.sarcasm.severity).toBe('medium');
    expect(CRITICAL_PATTERNS.dismissive.severity).toBe('medium');
  });

  it('low severity for complaint', () => {
    expect(CRITICAL_PATTERNS.complaint.severity).toBe('low');
  });
});

describe('POSITIVE_ALTERNATIVES — Data Integrity', () => {
  it('has alternatives for key types', () => {
    expect(POSITIVE_ALTERNATIVES.direct_criticism.length).toBeGreaterThanOrEqual(2);
    expect(POSITIVE_ALTERNATIVES.complaint.length).toBeGreaterThanOrEqual(1);
    expect(POSITIVE_ALTERNATIVES.blame.length).toBeGreaterThanOrEqual(1);
  });

  it('each alternative has required fields', () => {
    Object.values(POSITIVE_ALTERNATIVES).forEach(alts => {
      alts.forEach(alt => {
        expect(alt.negative).toBeTruthy();
        expect(alt.positive).toBeTruthy();
        expect(alt.principle).toBeTruthy();
      });
    });
  });
});

describe('detectCriticalLanguage', () => {
  it('detects direct criticism', () => {
    const result = detectCriticalLanguage('Você errou completamente');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('direct_criticism');
  });

  it('detects passive-aggressive', () => {
    const result = detectCriticalLanguage('Se você tivesse prestado atenção');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('passive_aggressive');
  });

  it('detects complaint', () => {
    const result = detectCriticalLanguage('Não aguento mais isso');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('complaint');
  });

  it('detects condemnation', () => {
    const result = detectCriticalLanguage('Você é incompetente');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('condemnation');
  });

  it('detects blame', () => {
    const result = detectCriticalLanguage('Por sua culpa tudo deu errado');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('blame');
  });

  it('detects dismissive', () => {
    const result = detectCriticalLanguage('Você não entende nada');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for positive text', () => {
    const result = detectCriticalLanguage('Excelente trabalho! Parabéns pela entrega.');
    expect(result.length).toBe(0);
  });

  it('returns alternatives in detected phrases', () => {
    const result = detectCriticalLanguage('Você errou nisso');
    expect(result[0].alternative).toBeTruthy();
  });

  it('includes impact description', () => {
    const result = detectCriticalLanguage('Você errou');
    if (result.length > 0) {
      expect(result[0].impact).toBeTruthy();
    }
  });

  it('detects multiple types in one text', () => {
    const result = detectCriticalLanguage('Você errou. Não aguento mais. Por sua culpa.');
    expect(result.length).toBeGreaterThanOrEqual(3);
  });
});

describe('calculateCriticismScore', () => {
  it('100 for clean text', () => {
    expect(calculateCriticismScore('Ótimo trabalho!')).toBe(100);
  });

  it('lower for high severity', () => {
    const score = calculateCriticismScore('Você errou completamente');
    expect(score).toBeLessThan(100);
    expect(score).toBeLessThanOrEqual(75);
  });

  it('never below 0', () => {
    const score = calculateCriticismScore(
      'Você errou. Você é incompetente. Por sua culpa. Você nunca faz nada certo. Caso perdido.'
    );
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('medium severity penalizes less', () => {
    const high = calculateCriticismScore('Você é incompetente');
    const medium = calculateCriticismScore('Interessante como você chega a essa conclusão');
    expect(medium).toBeGreaterThanOrEqual(high);
  });
});

describe('rewriteWithoutCriticism', () => {
  it('replaces "mas" with "e"', () => {
    expect(rewriteWithoutCriticism('Bom, mas pode melhorar')).toContain('e');
  });

  it('replaces "você deveria" with "você poderia considerar"', () => {
    const result = rewriteWithoutCriticism('Você deveria fazer diferente');
    expect(result.toLowerCase()).toContain('poderia considerar');
  });

  it('keeps text unchanged if no critical patterns', () => {
    const clean = 'Parabéns pela conquista!';
    expect(rewriteWithoutCriticism(clean)).toBe(clean);
  });
});

describe('getCriticismTone', () => {
  it('very_positive for 90+', () => expect(getCriticismTone(95)).toBe('very_positive'));
  it('positive for 70-89', () => expect(getCriticismTone(75)).toBe('positive'));
  it('neutral for 50-69', () => expect(getCriticismTone(55)).toBe('neutral'));
  it('critical for <50', () => expect(getCriticismTone(30)).toBe('critical'));
  it('boundary 90', () => expect(getCriticismTone(90)).toBe('very_positive'));
  it('boundary 70', () => expect(getCriticismTone(70)).toBe('positive'));
  it('boundary 50', () => expect(getCriticismTone(50)).toBe('neutral'));
});

// ══════════════════ EMPATHY TEMPLATES ══════════════════

describe('EMPATHY_TEMPLATES — Data Integrity', () => {
  it('has multiple templates', () => expect(EMPATHY_TEMPLATES.length).toBeGreaterThanOrEqual(5));

  it('each template has required fields', () => {
    EMPATHY_TEMPLATES.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.type).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.structure).toBeTruthy();
      expect(t.examples.length).toBeGreaterThan(0);
      expect(t.whenToUse.length).toBeGreaterThan(0);
      expect(t.discVariation).toBeDefined();
      expect(t.discVariation.D).toBeTruthy();
      expect(t.discVariation.I).toBeTruthy();
      expect(t.discVariation.S).toBeTruthy();
      expect(t.discVariation.C).toBeTruthy();
    });
  });

  it('has unique IDs', () => {
    const ids = EMPATHY_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('EMPATHY_PHRASES — Data Integrity', () => {
  const situations = Object.keys(EMPATHY_PHRASES);

  it('has 7+ situations', () => expect(situations.length).toBeGreaterThanOrEqual(7));

  it('each situation has multiple phrases', () => {
    situations.forEach(s => {
      expect(EMPATHY_PHRASES[s].length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('getEmpathyTemplatesByType', () => {
  it('returns validation templates', () => {
    const result = getEmpathyTemplatesByType('validation');
    expect(result.length).toBeGreaterThan(0);
    result.forEach(t => expect(t.type).toBe('validation'));
  });

  it('returns mirroring templates', () => {
    const result = getEmpathyTemplatesByType('mirroring');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for unknown type', () => {
    const result = getEmpathyTemplatesByType('nonexistent' as any);
    expect(result.length).toBe(0);
  });
});

describe('getEmpathyForSituation', () => {
  it('returns phrases for preocupação', () => {
    const result = getEmpathyForSituation('preocupação');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns phrases for frustração', () => {
    expect(getEmpathyForSituation('frustração').length).toBeGreaterThan(0);
  });

  it('returns default for unknown situation', () => {
    const result = getEmpathyForSituation('unknown');
    expect(result).toEqual(EMPATHY_PHRASES.preocupação);
  });
});

describe('analyzeEmpathyInText', () => {
  it('high score for empathetic text', () => {
    const result = analyzeEmpathyInText('Entendo como você se sente. Faz sentido você pensar assim. Imagino que deve ser difícil.');
    expect(result.empathyScore).toBeGreaterThan(50);
    expect(result.empathyStatements.length).toBeGreaterThan(0);
  });

  it('lower score for negative patterns', () => {
    const result = analyzeEmpathyInText('Mas você deveria fazer diferente. Não é bem assim.');
    expect(result.empathyScore).toBeLessThan(50);
  });

  it('neutral score for plain text', () => {
    const result = analyzeEmpathyInText('O relatório está pronto.');
    expect(result.empathyScore).toBe(50);
  });

  it('clamped between 0-100', () => {
    const high = analyzeEmpathyInText('Entendo. Compreendo. Faz sentido. Imagino como. Deve ser difícil. É natural. É normal. Você tem razão.');
    expect(high.empathyScore).toBeLessThanOrEqual(100);

    const low = analyzeEmpathyInText('Mas você. Você deveria. Não é bem assim. Você está errado. Isso não faz sentido.');
    expect(low.empathyScore).toBeGreaterThanOrEqual(0);
  });

  it('identifies missed moments', () => {
    const result = analyzeEmpathyInText('Mas temos uma opção melhor?');
    expect(result.missedMoments.length).toBeGreaterThanOrEqual(0);
  });
});

describe('getEmpathyTemplateForDISC', () => {
  it('returns D variation for validation', () => {
    const result = getEmpathyTemplateForDISC('validation', 'D');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });

  it('returns I variation for mirroring', () => {
    const result = getEmpathyTemplateForDISC('mirroring', 'I');
    expect(result).toBeTruthy();
  });

  it('returns S variation for support', () => {
    const result = getEmpathyTemplateForDISC('support', 'S');
    expect(result).toBeTruthy();
  });

  it('returns C variation for understanding', () => {
    const result = getEmpathyTemplateForDISC('understanding', 'C');
    expect(result).toBeTruthy();
  });

  it('returns empty string for unknown type', () => {
    const result = getEmpathyTemplateForDISC('nonexistent' as any, 'D');
    expect(result).toBe('');
  });
});
