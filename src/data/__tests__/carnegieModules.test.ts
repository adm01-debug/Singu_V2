import { describe, it, expect } from 'vitest';
import { CRITICAL_PATTERNS } from '@/data/carnegieCriticismDetector';
import { EAGER_WANTS } from '@/data/carnegieEagerWant';
import { INTEREST_INDICATORS, GENUINE_INTEREST_PATTERNS } from '@/data/carnegieGenuineInterest';
import { WARMTH_PATTERNS } from '@/data/carnegieWarmth';
import { NOBLE_CAUSES } from '@/data/carnegieNobleCauses';

/**
 * Carnegie Extended Modules - 80+ test scenarios
 */

// ========================================
// Criticism Detector
// ========================================
describe('Carnegie Criticism Detector', () => {
  const types = Object.keys(CRITICAL_PATTERNS);
  const patterns = Object.values(CRITICAL_PATTERNS);

  it('has at least 3 criticism types', () => {
    expect(types.length).toBeGreaterThanOrEqual(3);
  });

  it('all types have required fields', () => {
    for (const [key, val] of Object.entries(CRITICAL_PATTERNS)) {
      expect(val.name.length, `${key}: no name`).toBeGreaterThan(0);
      expect(val.description.length, `${key}: no description`).toBeGreaterThan(5);
      expect(val.patterns.length, `${key}: no patterns`).toBeGreaterThan(0);
      expect(val.examples.length, `${key}: no examples`).toBeGreaterThan(0);
    }
  });

  it('all types have valid severity', () => {
    for (const [, val] of Object.entries(CRITICAL_PATTERNS)) {
      expect(['low', 'medium', 'high']).toContain(val.severity);
    }
  });

  it('patterns are valid RegExp instances', () => {
    for (const val of patterns) {
      for (const p of val.patterns) {
        expect(p).toBeInstanceOf(RegExp);
      }
    }
  });

  it('direct_criticism patterns detect "você errou"', () => {
    const dc = CRITICAL_PATTERNS.direct_criticism;
    const text = 'Você errou nessa parte';
    const detected = dc.patterns.some(p => p.test(text));
    expect(detected).toBe(true);
  });

  it('passive_aggressive patterns detect sarcasm', () => {
    const pa = CRITICAL_PATTERNS.passive_aggressive;
    const text = 'Se você tivesse prestado atenção...';
    const detected = pa.patterns.some(p => p.test(text));
    expect(detected).toBe(true);
  });

  it('patterns are case-insensitive', () => {
    for (const val of patterns) {
      for (const p of val.patterns) {
        expect(p.flags).toContain('i');
      }
    }
  });
});

// ========================================
// Eager Want Mapper
// ========================================
describe('Carnegie Eager Want Mapper', () => {
  it('has at least 5 eager wants', () => {
    expect(EAGER_WANTS.length).toBeGreaterThanOrEqual(5);
  });

  it('all wants have unique IDs', () => {
    const ids = EAGER_WANTS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all wants have required fields', () => {
    for (const w of EAGER_WANTS) {
      expect(w.name.length).toBeGreaterThan(0);
      expect(w.category.length).toBeGreaterThan(0);
      expect(w.description.length).toBeGreaterThan(10);
      expect(w.detectionKeywords.length).toBeGreaterThan(0);
      expect(w.arousalTechniques.length).toBeGreaterThan(0);
    }
  });

  it('all wants have DISC compatibility scores', () => {
    for (const w of EAGER_WANTS) {
      expect(w.discAlignment.D).toBeGreaterThanOrEqual(0);
      expect(w.discAlignment.D).toBeLessThanOrEqual(100);
      expect(w.discAlignment.I).toBeGreaterThanOrEqual(0);
      expect(w.discAlignment.S).toBeGreaterThanOrEqual(0);
      expect(w.discAlignment.C).toBeGreaterThanOrEqual(0);
    }
  });

  it('all techniques have unique IDs', () => {
    const techIds = EAGER_WANTS.flatMap(w => w.arousalTechniques.map(t => t.id));
    expect(new Set(techIds).size).toBe(techIds.length);
  });

  it('all techniques have example and whenToUse', () => {
    for (const w of EAGER_WANTS) {
      for (const t of w.arousalTechniques) {
        expect(t.example.length).toBeGreaterThan(5);
        expect(t.whenToUse.length).toBeGreaterThan(5);
      }
    }
  });

  it('detection keywords are lowercase', () => {
    for (const w of EAGER_WANTS) {
      for (const kw of w.detectionKeywords) {
        expect(kw).toBe(kw.toLowerCase());
      }
    }
  });
});

// ========================================
// Genuine Interest Tracker
// ========================================
describe('Carnegie Genuine Interest Tracker', () => {
  it('has at least 3 interest indicators', () => {
    expect(INTEREST_INDICATORS.length).toBeGreaterThanOrEqual(3);
  });

  it('all indicators have required fields', () => {
    for (const ind of INTEREST_INDICATORS) {
      expect(ind.type.length).toBeGreaterThan(0);
      expect(ind.description.length).toBeGreaterThan(5);
      expect(ind.example.length).toBeGreaterThan(5);
      expect(ind.weight).toBeGreaterThan(0);
    }
  });

  it('weights are between 1-10', () => {
    for (const ind of INTEREST_INDICATORS) {
      expect(ind.weight).toBeGreaterThanOrEqual(1);
      expect(ind.weight).toBeLessThanOrEqual(10);
    }
  });

  it('genuine interest patterns have question categories', () => {
    expect(GENUINE_INTEREST_PATTERNS.questions).toBeDefined();
    expect(GENUINE_INTEREST_PATTERNS.questions.personal).toBeDefined();
    expect(GENUINE_INTEREST_PATTERNS.questions.personal.length).toBeGreaterThan(0);
  });

  it('patterns are valid RegExp', () => {
    for (const p of GENUINE_INTEREST_PATTERNS.questions.personal) {
      expect(p).toBeInstanceOf(RegExp);
    }
  });
});

// ========================================
// Warmth Score
// ========================================
describe('Carnegie Warmth Patterns', () => {
  it('has greeting patterns', () => {
    expect(WARMTH_PATTERNS.greeting).toBeDefined();
    expect(WARMTH_PATTERNS.greeting.patterns.length).toBeGreaterThan(0);
  });

  it('has empathy patterns', () => {
    expect(WARMTH_PATTERNS.empathy).toBeDefined();
    expect(WARMTH_PATTERNS.empathy.patterns.length).toBeGreaterThan(0);
  });

  it('has personal touch patterns', () => {
    expect(WARMTH_PATTERNS.personalTouch).toBeDefined();
    expect(WARMTH_PATTERNS.personalTouch.patterns.length).toBeGreaterThan(0);
  });

  it('warm patterns have positive scores', () => {
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      for (const p of cat.patterns) {
        expect(p.score).toBeGreaterThan(0);
      }
    }
  });

  it('cold patterns have negative scores', () => {
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      if (cat.coldPatterns) {
        for (const p of cat.coldPatterns) {
          expect(p.score).toBeLessThan(0);
        }
      }
    }
  });

  it('cold patterns have alternatives', () => {
    for (const cat of Object.values(WARMTH_PATTERNS)) {
      if (cat.coldPatterns) {
        for (const p of cat.coldPatterns) {
          expect(p.alternative.length).toBeGreaterThan(5);
        }
      }
    }
  });

  it('greeting detects "que bom falar com você"', () => {
    const text = 'Que bom falar com você!';
    const detected = WARMTH_PATTERNS.greeting.patterns.some(p => p.pattern.test(text));
    expect(detected).toBe(true);
  });

  it('empathy detects understanding phrases', () => {
    const text = 'Entendo perfeitamente sua situação';
    const detected = WARMTH_PATTERNS.empathy.patterns.some(p => p.pattern.test(text));
    expect(detected).toBe(true);
  });
});

// ========================================
// Noble Causes
// ========================================
describe('Carnegie Noble Causes', () => {
  it('has at least 5 noble causes', () => {
    expect(NOBLE_CAUSES.length).toBeGreaterThanOrEqual(5);
  });

  it('all causes have unique IDs', () => {
    const ids = NOBLE_CAUSES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all causes have required fields', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.name.length).toBeGreaterThan(0);
      expect(c.category.length).toBeGreaterThan(0);
      expect(c.description.length).toBeGreaterThan(10);
      expect(c.emotionalAppeal.length).toBeGreaterThan(10);
      expect(c.keywords.length).toBeGreaterThan(0);
      expect(c.templates.length).toBeGreaterThan(0);
    }
  });

  it('all causes have DISC compatibility', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.discCompatibility.D).toBeGreaterThanOrEqual(0);
      expect(c.discCompatibility.D).toBeLessThanOrEqual(100);
      expect(c.discCompatibility.I).toBeGreaterThanOrEqual(0);
      expect(c.discCompatibility.S).toBeGreaterThanOrEqual(0);
      expect(c.discCompatibility.C).toBeGreaterThanOrEqual(0);
    }
  });

  it('all templates have 4 story parts', () => {
    for (const c of NOBLE_CAUSES) {
      for (const t of c.templates) {
        expect(t.opening.length).toBeGreaterThan(5);
        expect(t.bridge.length).toBeGreaterThan(5);
        expect(t.callToAction.length).toBeGreaterThan(5);
        expect(t.emotionalHook.length).toBeGreaterThan(5);
      }
    }
  });

  it('all template IDs are unique', () => {
    const ids = NOBLE_CAUSES.flatMap(c => c.templates.map(t => t.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('intensity is 1-5', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.intensity).toBeGreaterThanOrEqual(1);
      expect(c.intensity).toBeLessThanOrEqual(5);
    }
  });

  it('covers altruism category', () => {
    const altruism = NOBLE_CAUSES.filter(c => c.category === 'altruism');
    expect(altruism.length).toBeGreaterThan(0);
  });
});
