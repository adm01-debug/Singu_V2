/**
 * Testes exaustivos — Identity Labels & Ownership Transfer
 */
import { describe, it, expect } from 'vitest';
import {
  IDENTITY_LABELS, IDENTITY_DETECTION_PATTERNS, IDENTITY_REINFORCEMENT_SCRIPTS
} from '../carnegieIdentityLabels';
import {
  OWNERSHIP_TECHNIQUES, OWNERSHIP_LANGUAGE, OWNERSHIP_BY_DISC,
  getOwnershipTechnique, getTechniquesForDISC, analyzeOwnershipLanguage
} from '../carnegieOwnershipTransfer';

// ══════════════════ IDENTITY LABELS ══════════════════

describe('IDENTITY_LABELS — Data Integrity', () => {
  it('has 15+ labels', () => expect(IDENTITY_LABELS.length).toBeGreaterThanOrEqual(15));

  it('each label has required fields', () => {
    IDENTITY_LABELS.forEach(l => {
      expect(l.id).toBeTruthy();
      expect(l.category).toBeTruthy();
      expect(l.label).toBeTruthy();
      expect(l.description).toBeTruthy();
      expect(l.reinforcementPhrases.length).toBeGreaterThanOrEqual(3);
      expect(l.futureProjection).toBeTruthy();
      expect(l.pastValidation).toBeTruthy();
      expect(l.discAlignment).toBeDefined();
      expect(l.discAlignment.D).toBeGreaterThanOrEqual(0);
      expect(l.discAlignment.I).toBeGreaterThanOrEqual(0);
      expect(l.discAlignment.S).toBeGreaterThanOrEqual(0);
      expect(l.discAlignment.C).toBeGreaterThanOrEqual(0);
      expect(l.vakAlignment).toBeDefined();
    });
  });

  it('has unique IDs', () => {
    const ids = IDENTITY_LABELS.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('DISC alignment scores in 0-100 range', () => {
    IDENTITY_LABELS.forEach(l => {
      (['D', 'I', 'S', 'C'] as const).forEach(k => {
        expect(l.discAlignment[k]).toBeGreaterThanOrEqual(0);
        expect(l.discAlignment[k]).toBeLessThanOrEqual(100);
      });
    });
  });

  it('covers key categories', () => {
    const categories = new Set(IDENTITY_LABELS.map(l => l.category));
    expect(categories.has('achiever')).toBe(true);
    expect(categories.has('innovator')).toBe(true);
    expect(categories.has('leader')).toBe(true);
    expect(categories.has('expert')).toBe(true);
  });
});

describe('IDENTITY_DETECTION_PATTERNS', () => {
  const categories = Object.keys(IDENTITY_DETECTION_PATTERNS);

  it('has 10+ categories', () => expect(categories.length).toBeGreaterThanOrEqual(10));

  it('each category has keywords', () => {
    categories.forEach(c => {
      expect(IDENTITY_DETECTION_PATTERNS[c as keyof typeof IDENTITY_DETECTION_PATTERNS].length).toBeGreaterThan(0);
    });
  });
});

describe('IDENTITY_REINFORCEMENT_SCRIPTS', () => {
  const categories = Object.keys(IDENTITY_REINFORCEMENT_SCRIPTS);

  it('has scripts for all categories', () => {
    expect(categories.length).toBeGreaterThanOrEqual(10);
  });

  it('each script has initial, ongoing, challenge', () => {
    categories.forEach(c => {
      const script = IDENTITY_REINFORCEMENT_SCRIPTS[c as keyof typeof IDENTITY_REINFORCEMENT_SCRIPTS];
      expect(script.initial).toBeTruthy();
      expect(script.ongoing).toBeTruthy();
      expect(script.challenge).toBeTruthy();
    });
  });
});

// ══════════════════ OWNERSHIP TRANSFER ══════════════════

describe('OWNERSHIP_TECHNIQUES — Data Integrity', () => {
  it('has 6 techniques', () => expect(OWNERSHIP_TECHNIQUES.length).toBe(6));

  it('each technique has required fields', () => {
    OWNERSHIP_TECHNIQUES.forEach(t => {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.setupPhrase).toBeTruthy();
      expect(t.seedingPhrase).toBeTruthy();
      expect(t.confirmationPhrase).toBeTruthy();
      expect(t.celebrationPhrase).toBeTruthy();
      expect(t.fullScript).toBeTruthy();
      expect(t.whenToUse.length).toBeGreaterThan(0);
    });
  });

  it('has unique IDs', () => {
    const ids = OWNERSHIP_TECHNIQUES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('OWNERSHIP_LANGUAGE', () => {
  it('has toAvoid phrases', () => expect(OWNERSHIP_LANGUAGE.toAvoid.length).toBeGreaterThan(0));
  it('has toUse phrases', () => expect(OWNERSHIP_LANGUAGE.toUse.length).toBeGreaterThan(0));
  it('has celebration phrases', () => expect(OWNERSHIP_LANGUAGE.celebration.length).toBeGreaterThan(0));
  it('has attribution phrases', () => expect(OWNERSHIP_LANGUAGE.attribution.length).toBeGreaterThan(0));
});

describe('OWNERSHIP_BY_DISC', () => {
  (['D', 'I', 'S', 'C'] as const).forEach(profile => {
    it(`has config for ${profile}`, () => {
      const config = OWNERSHIP_BY_DISC[profile];
      expect(config.approach).toBeTruthy();
      expect(config.techniques.length).toBeGreaterThan(0);
      expect(config.language.length).toBeGreaterThan(0);
      expect(config.avoid.length).toBeGreaterThan(0);
    });
  });
});

describe('getOwnershipTechnique', () => {
  it('finds by ID', () => {
    const result = getOwnershipTechnique('ownership_seed');
    expect(result).toBeDefined();
    expect(result?.name).toContain('Semente');
  });

  it('returns undefined for unknown ID', () => {
    expect(getOwnershipTechnique('nonexistent')).toBeUndefined();
  });
});

describe('getTechniquesForDISC', () => {
  it('returns techniques for D', () => {
    const result = getTechniquesForDISC('D');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns techniques for I', () => {
    expect(getTechniquesForDISC('I').length).toBeGreaterThan(0);
  });

  it('returns techniques for S', () => {
    expect(getTechniquesForDISC('S').length).toBeGreaterThan(0);
  });

  it('returns techniques for C', () => {
    expect(getTechniquesForDISC('C').length).toBeGreaterThan(0);
  });
});

describe('analyzeOwnershipLanguage', () => {
  it('detects problematic phrases', () => {
    const result = analyzeOwnershipLanguage('Eu sugiro que você faça isso. Minha recomendação é...');
    expect(result.problematicPhrases.length).toBeGreaterThan(0);
    expect(result.ownershipGiven).toBe(false);
  });

  it('detects ownership-giving language', () => {
    const result = analyzeOwnershipLanguage('O que você acha de tentarmos isso?');
    expect(result.problematicPhrases.length).toBe(0);
    expect(result.ownershipGiven).toBe(true);
  });

  it('returns suggestions when not giving ownership', () => {
    const result = analyzeOwnershipLanguage('Você deveria fazer isso assim.');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('handles empty text', () => {
    const result = analyzeOwnershipLanguage('');
    expect(result.problematicPhrases.length).toBe(0);
  });
});
