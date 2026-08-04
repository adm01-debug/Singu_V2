import { describe, it, expect } from 'vitest';
import { EMOTIONAL_STATE_KEYWORDS, EMOTIONAL_STATE_INFO } from '@/data/nlpAdvancedData';
import { PAS_TEMPLATES, FOUR_PS_TEMPLATES, STORYTELLING_TEMPLATES } from '@/data/copywritingAdvancedData';

describe('NLP Advanced - Emotional States', () => {
  const stateKeys = Object.keys(EMOTIONAL_STATE_KEYWORDS);
  const infoKeys = Object.keys(EMOTIONAL_STATE_INFO);

  it('has at least 10 emotional states', () => {
    expect(stateKeys.length).toBeGreaterThanOrEqual(10);
  });

  it('keywords and info keys match', () => {
    expect(stateKeys.sort()).toEqual(infoKeys.sort());
  });

  it('all states have at least 5 keywords', () => {
    for (const [state, keywords] of Object.entries(EMOTIONAL_STATE_KEYWORDS)) {
      expect(keywords.length, `${state}: too few keywords`).toBeGreaterThanOrEqual(5);
    }
  });

  it('no duplicate keywords within a state', () => {
    for (const [state, keywords] of Object.entries(EMOTIONAL_STATE_KEYWORDS)) {
      expect(new Set(keywords).size, `${state}: duplicates`).toBe(keywords.length);
    }
  });

  it('all state info has name, icon, color, description, salesApproach', () => {
    for (const [state, info] of Object.entries(EMOTIONAL_STATE_INFO)) {
      expect(info.name.length, `${state}: no name`).toBeGreaterThan(0);
      expect(info.icon.length, `${state}: no icon`).toBeGreaterThan(0);
      expect(info.color, `${state}: no color`).toMatch(/text-\w+/);
      expect(info.bgColor, `${state}: no bgColor`).toMatch(/bg-\w+/);
      expect(info.description.length, `${state}: no description`).toBeGreaterThan(5);
      expect(info.salesApproach.length, `${state}: no salesApproach`).toBeGreaterThan(5);
    }
  });

  it('keywords are lowercase or known acronyms', () => {
    const allowedUppercase = ['ROI'];
    for (const keywords of Object.values(EMOTIONAL_STATE_KEYWORDS)) {
      for (const kw of keywords) {
        const isLower = kw === kw.toLowerCase();
        const isAllowed = allowedUppercase.includes(kw);
        expect(isLower || isAllowed, `unexpected uppercase: ${kw}`).toBe(true);
      }
    }
  });
});

describe('Copywriting Advanced - PAS Templates', () => {
  it('has at least 3 PAS templates', () => {
    expect(PAS_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('all PAS templates have unique IDs', () => {
    const ids = PAS_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all PAS templates have 3 sections (problem, agitate, solution)', () => {
    for (const t of PAS_TEMPLATES) {
      expect(t.sections.length).toBe(3);
      const stages = t.sections.map(s => s.stage);
      expect(stages).toContain('problem');
      expect(stages).toContain('agitate');
      expect(stages).toContain('solution');
    }
  });

  it('all PAS sections have content and techniques', () => {
    for (const t of PAS_TEMPLATES) {
      for (const s of t.sections) {
        expect(s.content.length).toBeGreaterThan(10);
        expect(s.techniques.length).toBeGreaterThan(0);
      }
    }
  });

  it('estimatedConversion is between 0-100', () => {
    for (const t of PAS_TEMPLATES) {
      expect(t.estimatedConversion).toBeGreaterThan(0);
      expect(t.estimatedConversion).toBeLessThanOrEqual(100);
    }
  });

  it('agitate has higher emotional intensity than solution', () => {
    for (const t of PAS_TEMPLATES) {
      const agitate = t.sections.find(s => s.stage === 'agitate')!;
      const solution = t.sections.find(s => s.stage === 'solution')!;
      expect(agitate.emotionalIntensity, `${t.id}: agitate should be more intense`).toBeGreaterThanOrEqual(solution.emotionalIntensity);
    }
  });
});

describe('Copywriting Advanced - 4Ps Templates', () => {
  it('has at least 2 templates', () => {
    expect(FOUR_PS_TEMPLATES.length).toBeGreaterThanOrEqual(2);
  });

  it('all 4Ps have 4 sections', () => {
    for (const t of FOUR_PS_TEMPLATES) {
      expect(t.sections.length).toBe(4);
      const stages = t.sections.map(s => s.stage);
      expect(stages).toEqual(['promise', 'picture', 'proof', 'push']);
    }
  });

  it('all sections have powerWords', () => {
    for (const t of FOUR_PS_TEMPLATES) {
      for (const s of t.sections) {
        expect(s.powerWords.length, `${t.id}/${s.stage}: no powerWords`).toBeGreaterThan(0);
      }
    }
  });
});

describe('Copywriting Advanced - Storytelling Templates', () => {
  it('has at least 1 template', () => {
    expect(STORYTELLING_TEMPLATES.length).toBeGreaterThanOrEqual(1);
  });

  it('all templates have unique IDs', () => {
    const ids = STORYTELLING_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
