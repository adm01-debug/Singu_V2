import { describe, it, expect } from 'vitest';
import {
  WARMTH_PATTERNS,
  WARMTH_LEVELS,
  WARMTH_TEMPLATES,
  WARMTH_BY_DISC,
  detectWarmthIndicators,
  detectColdIndicators,
  calculateWarmthScore,
  getWarmthLevel,
  getWarmthSuggestions
} from '@/data/carnegieWarmth';

/**
 * Warmth Score - 55+ scenarios
 */

// ============================================
// DATA INTEGRITY
// ============================================
describe('Warmth: Data Integrity', () => {
  it('has 6 pattern categories', () => {
    const categories = Object.keys(WARMTH_PATTERNS);
    expect(categories.length).toBe(6);
    expect(categories).toContain('greeting');
    expect(categories).toContain('empathy');
    expect(categories).toContain('personalTouch');
    expect(categories).toContain('positiveLanguage');
    expect(categories).toContain('emotionalConnection');
    expect(categories).toContain('genuineInterest');
  });

  it('every category has warm patterns', () => {
    for (const [key, data] of Object.entries(WARMTH_PATTERNS)) {
      expect(data.patterns.length, `${key}: no patterns`).toBeGreaterThan(3);
    }
  });

  it('every category has cold patterns', () => {
    for (const [key, data] of Object.entries(WARMTH_PATTERNS)) {
      expect(data.coldPatterns.length, `${key}: no cold patterns`).toBeGreaterThan(0);
    }
  });

  it('warm patterns have positive scores', () => {
    for (const data of Object.values(WARMTH_PATTERNS)) {
      for (const p of data.patterns) {
        expect(p.score).toBeGreaterThan(0);
      }
    }
  });

  it('cold patterns have negative scores', () => {
    for (const data of Object.values(WARMTH_PATTERNS)) {
      for (const p of data.coldPatterns) {
        expect(p.score).toBeLessThan(0);
      }
    }
  });

  it('cold patterns have alternatives', () => {
    for (const data of Object.values(WARMTH_PATTERNS)) {
      for (const p of data.coldPatterns) {
        expect(p.alternative.length).toBeGreaterThan(5);
      }
    }
  });

  it('warmth levels cover full 0-100 range', () => {
    expect(WARMTH_LEVELS.cold.range.min).toBe(0);
    expect(WARMTH_LEVELS.exceptional.range.max).toBe(100);
  });

  it('warmth levels have no gaps', () => {
    expect(WARMTH_LEVELS.cold.range.max + 1).toBe(WARMTH_LEVELS.neutral.range.min);
    expect(WARMTH_LEVELS.neutral.range.max + 1).toBe(WARMTH_LEVELS.warm.range.min);
    expect(WARMTH_LEVELS.warm.range.max + 1).toBe(WARMTH_LEVELS.very_warm.range.min);
    expect(WARMTH_LEVELS.very_warm.range.max + 1).toBe(WARMTH_LEVELS.exceptional.range.min);
  });

  it('every level has suggestions', () => {
    for (const [key, level] of Object.entries(WARMTH_LEVELS)) {
      expect(level.suggestions.length, `${key}: no suggestions`).toBeGreaterThan(0);
    }
  });

  it('templates cover openings, transitions, closings, empathy_responses', () => {
    expect(WARMTH_TEMPLATES.openings.first_contact.length).toBeGreaterThan(1);
    expect(WARMTH_TEMPLATES.openings.follow_up.length).toBeGreaterThan(1);
    expect(WARMTH_TEMPLATES.openings.after_long_time.length).toBeGreaterThan(1);
    expect(WARMTH_TEMPLATES.transitions.to_business.length).toBeGreaterThan(1);
    expect(WARMTH_TEMPLATES.closings.standard.length).toBeGreaterThan(1);
    expect(WARMTH_TEMPLATES.empathy_responses.frustration.length).toBeGreaterThan(1);
  });

  it('DISC warmth preferences are defined for D/I/S/C', () => {
    for (const profile of ['D', 'I', 'S', 'C'] as const) {
      const config = WARMTH_BY_DISC[profile];
      expect(config.doThis.length).toBeGreaterThan(2);
      expect(config.avoidThis.length).toBeGreaterThan(1);
      expect(config.examples.length).toBeGreaterThan(1);
    }
  });

  it('I profile prefers very_high warmth, D prefers moderate', () => {
    expect(WARMTH_BY_DISC.I.preferredWarmthLevel).toBe('very_high');
    expect(WARMTH_BY_DISC.D.preferredWarmthLevel).toBe('moderate');
  });
});

// ============================================
// FUNCTIONS
// ============================================
describe('Warmth: detectWarmthIndicators', () => {
  it('detects greeting warmth', () => {
    const result = detectWarmthIndicators('Que bom falar com você!');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('greeting');
  });

  it('detects empathy patterns', () => {
    const result = detectWarmthIndicators('Imagino como deve ser difícil para você');
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects personal touch', () => {
    const result = detectWarmthIndicators('Lembrei de você quando vi isso');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].type).toBe('personalTouch');
  });

  it('detects positive language', () => {
    const result = detectWarmthIndicators('Adorei o resultado, parabéns!');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns empty for neutral text', () => {
    const result = detectWarmthIndicators('O relatório está pronto');
    expect(result.length).toBe(0);
  });
});

describe('Warmth: detectColdIndicators', () => {
  it('detects cold greetings', () => {
    const result = detectColdIndicators('Vamos direto ao assunto');
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects dismissive language', () => {
    const result = detectColdIndicators('Você está errado sobre isso');
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].alternative.length).toBeGreaterThan(5);
  });

  it('returns empty for warm text', () => {
    const result = detectColdIndicators('Que alegria falar com você!');
    expect(result.length).toBe(0);
  });
});

describe('Warmth: calculateWarmthScore', () => {
  it('returns 50 for neutral text', () => {
    const score = calculateWarmthScore('O relatório está disponível.');
    expect(score).toBe(50);
  });

  it('returns higher for warm text', () => {
    const score = calculateWarmthScore('Que bom falar com você! Adorei o resultado!');
    expect(score).toBeGreaterThan(60);
  });

  it('returns lower for cold text', () => {
    const score = calculateWarmthScore('Vamos direto ao assunto, você está errado');
    expect(score).toBeLessThan(50);
  });

  it('clamps between 0-100', () => {
    const cold = calculateWarmthScore('Vamos direto ao assunto. Você está errado. Não faz sentido. Tanto faz. Não me importa.');
    expect(cold).toBeGreaterThanOrEqual(0);
    expect(cold).toBeLessThanOrEqual(100);
  });
});

describe('Warmth: getWarmthLevel', () => {
  it('cold for 0-30', () => {
    expect(getWarmthLevel(0)).toBe('cold');
    expect(getWarmthLevel(30)).toBe('cold');
  });
  it('neutral for 31-55', () => {
    expect(getWarmthLevel(31)).toBe('neutral');
    expect(getWarmthLevel(55)).toBe('neutral');
  });
  it('warm for 56-75', () => {
    expect(getWarmthLevel(56)).toBe('warm');
    expect(getWarmthLevel(75)).toBe('warm');
  });
  it('very_warm for 76-90', () => {
    expect(getWarmthLevel(76)).toBe('very_warm');
    expect(getWarmthLevel(90)).toBe('very_warm');
  });
  it('exceptional for 91+', () => {
    expect(getWarmthLevel(91)).toBe('exceptional');
    expect(getWarmthLevel(100)).toBe('exceptional');
  });
});

describe('Warmth: getWarmthSuggestions', () => {
  it('returns suggestions based on cold indicators', () => {
    const coldIndicators = detectColdIndicators('Vamos direto ao assunto');
    const suggestions = getWarmthSuggestions(30, coldIndicators);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some(s => s.impact === 'high')).toBe(true);
  });

  it('returns general suggestions for warm text', () => {
    const suggestions = getWarmthSuggestions(80, []);
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.every(s => s.area === 'Geral')).toBe(true);
  });
});
