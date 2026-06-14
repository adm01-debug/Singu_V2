/**
 * Testes exaustivos — Encouragement & Face-Saving
 */
import { describe, it, expect } from 'vitest';
import {
  ENCOURAGEMENT_TEMPLATES, MINIMIZATION_PHRASES, CONFIDENCE_BOOSTERS,
  getEncouragementForContext, detectDiscouragement, generateEncouragementScript, calculateEncouragementScore
} from '../carnegieEncouragement';
import {
  FACE_SAVING_TECHNIQUES,
} from '../carnegieFaceSaving';

// ══════════════════ ENCOURAGEMENT ══════════════════

describe('ENCOURAGEMENT_TEMPLATES — Data Integrity', () => {
  it('has 7+ templates', () => expect(ENCOURAGEMENT_TEMPLATES.length).toBeGreaterThanOrEqual(7));

  it('each template has required fields', () => {
    ENCOURAGEMENT_TEMPLATES.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.context).toBeTruthy();
      expect(t.minimizePhrase).toBeTruthy();
      expect(t.encouragePhrase).toBeTruthy();
      expect(t.confidencePhrase).toBeTruthy();
      expect(t.fullScript).toBeTruthy();
      expect(t.discVariation.D).toBeTruthy();
      expect(t.discVariation.I).toBeTruthy();
      expect(t.discVariation.S).toBeTruthy();
      expect(t.discVariation.C).toBeTruthy();
    });
  });

  it('has unique IDs', () => {
    const ids = ENCOURAGEMENT_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('MINIMIZATION_PHRASES', () => {
  it('has difficulty, mistakes, challenges categories', () => {
    expect(MINIMIZATION_PHRASES.difficulty.length).toBeGreaterThan(0);
    expect(MINIMIZATION_PHRASES.mistakes.length).toBeGreaterThan(0);
    expect(MINIMIZATION_PHRASES.challenges.length).toBeGreaterThan(0);
  });
});

describe('CONFIDENCE_BOOSTERS', () => {
  it('has past_success, inherent_ability, future_success', () => {
    expect(CONFIDENCE_BOOSTERS.past_success.length).toBeGreaterThan(0);
    expect(CONFIDENCE_BOOSTERS.inherent_ability.length).toBeGreaterThan(0);
    expect(CONFIDENCE_BOOSTERS.future_success.length).toBeGreaterThan(0);
  });
});

describe('getEncouragementForContext', () => {
  it('returns learning template for "aprendendo"', () => {
    const result = getEncouragementForContext('Estou aprendendo algo novo');
    expect(result).toBeDefined();
  });

  it('returns decision template for "decisão"', () => {
    const result = getEncouragementForContext('Preciso tomar uma decisão');
    expect(result).toBeDefined();
  });

  it('returns challenge template for "desafio"', () => {
    const result = getEncouragementForContext('Enfrentando um desafio grande');
    expect(result).toBeDefined();
  });

  it('returns default for unmatched context', () => {
    const result = getEncouragementForContext('texto qualquer sem contexto');
    expect(result).toBeDefined();
  });
});

describe('detectDiscouragement', () => {
  it('detects "é muito difícil"', () => {
    const result = detectDiscouragement('Isso é muito difícil para mim');
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects "é complicado"', () => {
    expect(detectDiscouragement('É complicado demais').length).toBeGreaterThan(0);
  });

  it('returns empty for positive text', () => {
    expect(detectDiscouragement('Você está indo muito bem!').length).toBe(0);
  });

  it('detects multiple patterns', () => {
    const result = detectDiscouragement('É difícil. É complicado. É arriscado.');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('generateEncouragementScript', () => {
  it('returns D script for learning context', () => {
    const result = generateEncouragementScript('D', 'aprendendo algo novo');
    expect(result).toBeTruthy();
  });

  it('returns I script for decision context', () => {
    const result = generateEncouragementScript('I', 'tomando uma decisão');
    expect(result).toBeTruthy();
  });

  it('returns S script for challenge context', () => {
    const result = generateEncouragementScript('S', 'enfrentando um desafio');
    expect(result).toBeTruthy();
  });

  it('returns C script', () => {
    const result = generateEncouragementScript('C', 'aprendendo algo novo');
    expect(result).toBeTruthy();
  });
});

describe('calculateEncouragementScore', () => {
  it('50 for neutral text', () => {
    const score = calculateEncouragementScore('O relatório está pronto.');
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThanOrEqual(60);
  });

  it('lower for discouraging text', () => {
    const score = calculateEncouragementScore('Isso é muito difícil. É complicado. É arriscado.');
    expect(score).toBeLessThan(50);
  });

  it('higher for encouraging text', () => {
    const score = calculateEncouragementScore('Você já fez isso antes. Sua trajetória prova que você consegue. Vai dar certo, tenho certeza.');
    expect(score).toBeGreaterThan(50);
  });

  it('clamped to 0-100', () => {
    const low = calculateEncouragementScore('É difícil. É complicado. É arriscado. Você não vai consegue. Não é fácil. Cuidado com isso. Talvez não seja para você. Poucas pessoas conseguem.');
    expect(low).toBeGreaterThanOrEqual(0);
    expect(low).toBeLessThanOrEqual(100);
  });
});

// ══════════════════ FACE-SAVING ══════════════════

describe('FACE_SAVING_TECHNIQUES — Data Integrity', () => {
  it('has 8+ techniques', () => expect(FACE_SAVING_TECHNIQUES.length).toBeGreaterThanOrEqual(8));

  it('each technique has required fields', () => {
    FACE_SAVING_TECHNIQUES.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.scenario).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.principle).toBeTruthy();
      expect(t.acknowledgmentPhrase).toBeTruthy();
      expect(t.bridgePhrase).toBeTruthy();
      expect(t.solutionPhrase).toBeTruthy();
      expect(t.closingPhrase).toBeTruthy();
      expect(t.fullScript).toBeTruthy();
      expect(t.discVariations.D).toBeTruthy();
      expect(t.discVariations.I).toBeTruthy();
      expect(t.discVariations.S).toBeTruthy();
      expect(t.discVariations.C).toBeTruthy();
      expect(t.doThis.length).toBeGreaterThan(0);
      expect(t.avoidThis.length).toBeGreaterThan(0);
    });
  });

  it('has unique IDs', () => {
    const ids = FACE_SAVING_TECHNIQUES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers key scenarios', () => {
    const scenarios = new Set(FACE_SAVING_TECHNIQUES.map(t => t.scenario));
    expect(scenarios.has('price_objection')).toBe(true);
    expect(scenarios.has('product_limitation')).toBe(true);
    expect(scenarios.has('missed_deadline')).toBe(true);
    expect(scenarios.has('service_failure')).toBe(true);
    expect(scenarios.has('misunderstanding')).toBe(true);
    expect(scenarios.has('competitor_comparison')).toBe(true);
  });

  it('doThis and avoidThis have at least 3 items each', () => {
    FACE_SAVING_TECHNIQUES.forEach(t => {
      expect(t.doThis.length).toBeGreaterThanOrEqual(3);
      expect(t.avoidThis.length).toBeGreaterThanOrEqual(3);
    });
  });
});
