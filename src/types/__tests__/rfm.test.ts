import { describe, it, expect } from 'vitest';
import { determineRFMSegment, calculateRFMScore } from '../rfm';

describe('determineRFMSegment', () => {
  it('classifica R=5 F=5 M=5 como champions', () => {
    expect(determineRFMSegment(5, 5, 5)).toBe('champions');
  });

  it('classifica R=4 F=4 M=4 como champions (limiar)', () => {
    expect(determineRFMSegment(4, 4, 4)).toBe('champions');
  });

  it('classifica alta frequência+monetário mas recência média como loyal_customers', () => {
    expect(determineRFMSegment(3, 5, 5)).toBe('loyal_customers');
  });

  it('classifica recente com frequência baixa como recent_customers', () => {
    expect(determineRFMSegment(5, 1, 3)).toBe('recent_customers');
  });

  it('classifica R=1 F=1 M=1 como lost', () => {
    expect(determineRFMSegment(1, 1, 1)).toBe('lost');
  });

  it('classifica R=2 F=2 M=2 como hibernating', () => {
    // Após reordenar (lost/hibernating antes de about_to_sleep) — R=2 F=2 é low+low.
    expect(determineRFMSegment(2, 2, 2)).toBe('hibernating');
  });

  it('classifica R=2 F=1 M=3 como hibernating (low freq)', () => {
    expect(determineRFMSegment(2, 1, 3)).toBe('hibernating');
  });

  it('classifica R=2 F=3 M=2 como about_to_sleep', () => {
    expect(determineRFMSegment(2, 3, 2)).toBe('about_to_sleep');
  });

  it('classifica R=3 F=3 M=3 como needing_attention', () => {
    expect(determineRFMSegment(3, 3, 3)).toBe('needing_attention');
  });

  it('promissores: recência boa, monetário baixo', () => {
    expect(determineRFMSegment(3, 3, 1)).toBe('promising');
  });

  it('nunca retorna undefined para qualquer combinação válida', () => {
    type RfmScore = 1 | 2 | 3 | 4 | 5;
    for (let r = 1 as const; r <= 5; r++) {
      for (let f = 1 as const; f <= 5; f++) {
        for (let m = 1 as const; m <= 5; m++) {
          const seg = determineRFMSegment(r as RfmScore, f as RfmScore, m as RfmScore);
          expect(typeof seg).toBe('string');
          expect(seg.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('calculateRFMScore', () => {
  const percentiles = [10, 20, 30, 40]; // p20, p40, p60, p80

  describe('modo recency (menor é melhor)', () => {
    it('valor <= p20 retorna 5', () => {
      expect(calculateRFMScore(5, percentiles, true)).toBe(5);
      expect(calculateRFMScore(10, percentiles, true)).toBe(5);
    });

    it('valor entre p20 e p40 retorna 4', () => {
      expect(calculateRFMScore(15, percentiles, true)).toBe(4);
    });

    it('valor > p80 retorna 1', () => {
      expect(calculateRFMScore(100, percentiles, true)).toBe(1);
    });
  });

  describe('modo frequency/monetary (maior é melhor)', () => {
    it('valor >= p80 retorna 5', () => {
      expect(calculateRFMScore(50, percentiles, false)).toBe(5);
    });

    it('valor < p20 retorna 1', () => {
      expect(calculateRFMScore(5, percentiles, false)).toBe(1);
    });

    it('valor no limiar p60 retorna 4', () => {
      expect(calculateRFMScore(30, percentiles, false)).toBe(4);
    });
  });
});