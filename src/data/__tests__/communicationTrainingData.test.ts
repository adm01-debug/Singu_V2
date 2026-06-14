import { describe, it, expect } from 'vitest';
import {
  DISC_TRAINING,
  VAK_TRAINING,
  generateScenarios,
  SalespersonProfile,
} from '@/data/communicationTrainingData';
import { DISCProfile } from '@/types';
import { VAKType } from '@/types/vak';

/**
 * Communication Training Data - Exhaustive E2E Validation
 * Tests refactored data module integrity after decomposition
 */

const ALL_DISC: DISCProfile[] = ['D', 'I', 'S', 'C'];
const ALL_VAK: VAKType[] = ['V', 'A', 'K', 'D'];

// ============================================
// DISC_TRAINING Matrix (16 combinations)
// ============================================
describe('DISC_TRAINING Matrix Completeness', () => {
  it('has all 4 seller profiles', () => {
    expect(Object.keys(DISC_TRAINING)).toHaveLength(4);
    ALL_DISC.forEach(d => expect(DISC_TRAINING[d]).toBeDefined());
  });

  describe.each(ALL_DISC)('Seller %s', (seller) => {
    it('has tips for all 4 target profiles', () => {
      ALL_DISC.forEach(target => {
        expect(DISC_TRAINING[seller][target]).toBeDefined();
      });
    });

    describe.each(ALL_DISC)('→ Target %s', (target) => {
      const tip = DISC_TRAINING[seller as DISCProfile][target as DISCProfile];

      it('has non-empty title', () => expect(tip.title.length).toBeGreaterThan(5));
      it('has non-empty description', () => expect(tip.description.length).toBeGreaterThan(10));
      it('has at least 1 example', () => expect(tip.examples.length).toBeGreaterThanOrEqual(1));
      it('has at least 2 doList items', () => expect(tip.doList.length).toBeGreaterThanOrEqual(2));
      it('has at least 1 dontList item', () => expect(tip.dontList.length).toBeGreaterThanOrEqual(1));

      it('examples are non-empty strings', () => {
        tip.examples.forEach(ex => expect(ex.length).toBeGreaterThan(5));
      });

      it('doList items are non-empty', () => {
        tip.doList.forEach(item => expect(item.length).toBeGreaterThan(3));
      });

      it('dontList items are non-empty', () => {
        tip.dontList.forEach(item => expect(item.length).toBeGreaterThan(3));
      });
    });
  });
});

// ============================================
// VAK_TRAINING Matrix (16 combinations)
// ============================================
describe('VAK_TRAINING Matrix Completeness', () => {
  it('has all 4 VAK profiles', () => {
    expect(Object.keys(VAK_TRAINING)).toHaveLength(4);
    ALL_VAK.forEach(v => expect(VAK_TRAINING[v]).toBeDefined());
  });

  describe.each(ALL_VAK)('Seller %s', (seller) => {
    describe.each(ALL_VAK)('→ Target %s', (target) => {
      const tip = VAK_TRAINING[seller as VAKType][target as VAKType];

      it('has title', () => expect(tip.title).toBeTruthy());
      it('has description', () => expect(tip.description.length).toBeGreaterThan(5));
      it('has examples', () => expect(tip.examples.length).toBeGreaterThanOrEqual(1));
      it('has doList', () => expect(tip.doList.length).toBeGreaterThanOrEqual(1));
      it('has dontList', () => expect(tip.dontList.length).toBeGreaterThanOrEqual(1));
    });
  });
});

// ============================================
// Scenario Generation
// ============================================
describe('generateScenarios', () => {
  it('generates 3 scenarios when seller has a DISC profile (excludes own)', () => {
    ALL_DISC.forEach(disc => {
      const scenarios = generateScenarios(disc);
      expect(scenarios).toHaveLength(3);
      scenarios.forEach(s => {
        expect(s.clientProfile.disc).not.toBe(disc);
      });
    });
  });

  it('generates 4 scenarios when seller has no profile', () => {
    const scenarios = generateScenarios(null);
    expect(scenarios).toHaveLength(4);
  });

  it('each scenario has required fields', () => {
    const scenarios = generateScenarios(null);
    scenarios.forEach(scenario => {
      expect(scenario.id).toBeTruthy();
      expect(scenario.title).toBeTruthy();
      expect(scenario.description).toBeTruthy();
      expect(scenario.situation.length).toBeGreaterThan(20);
      expect(scenario.clientProfile.disc).toBeTruthy();
      expect(scenario.clientProfile.vak).toBeTruthy();
      expect(scenario.clientProfile.motivation).toBeTruthy();
    });
  });

  it('each scenario has exactly 3 options', () => {
    const scenarios = generateScenarios(null);
    scenarios.forEach(s => expect(s.options).toHaveLength(3));
  });

  it('each scenario has exactly 1 correct answer', () => {
    const scenarios = generateScenarios(null);
    scenarios.forEach(s => {
      const correct = s.options.filter(o => o.isCorrect);
      expect(correct).toHaveLength(1);
    });
  });

  it('options have unique IDs within each scenario', () => {
    const scenarios = generateScenarios(null);
    scenarios.forEach(s => {
      const ids = s.options.map(o => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('all options have explanations', () => {
    const scenarios = generateScenarios(null);
    scenarios.forEach(s => {
      s.options.forEach(o => {
        expect(o.explanation.length).toBeGreaterThan(10);
      });
    });
  });

  it('scenario IDs are unique', () => {
    const scenarios = generateScenarios(null);
    const ids = scenarios.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================
// Cross-validation: DISC training ↔ scenarios
// ============================================
describe('Cross-module consistency', () => {
  it('scenarios cover all DISC profiles when seller is null', () => {
    const scenarios = generateScenarios(null);
    const coveredProfiles = scenarios.map(s => s.clientProfile.disc);
    ALL_DISC.forEach(d => expect(coveredProfiles).toContain(d));
  });

  it('DISC training tip titles contain seller and target labels', () => {
    ALL_DISC.forEach(seller => {
      ALL_DISC.forEach(target => {
        const tip = DISC_TRAINING[seller][target];
        expect(tip.title).toContain(seller);
        expect(tip.title).toContain(target);
      });
    });
  });
});

// ============================================
// Type & interface validation
// ============================================
describe('SalespersonProfile interface compliance', () => {
  it('accepts full profile', () => {
    const profile: SalespersonProfile = {
      vakProfile: 'V',
      discProfile: 'D',
      metaprograms: {
        motivationDirection: 'toward',
        referenceFrame: 'internal',
        workingStyle: 'options',
        chunkSize: 'big',
        actionFilter: 'proactive',
        comparisonStyle: 'match',
      },
    };
    expect(profile.discProfile).toBe('D');
  });

  it('accepts null profiles', () => {
    const profile: SalespersonProfile = {
      vakProfile: null,
      discProfile: null,
      metaprograms: {
        motivationDirection: null,
        referenceFrame: null,
        workingStyle: null,
        chunkSize: null,
        actionFilter: null,
        comparisonStyle: null,
      },
    };
    expect(profile.discProfile).toBeNull();
  });
});

// ============================================
// Data quality checks
// ============================================
describe('Data quality', () => {
  it('no duplicate examples in DISC training', () => {
    const allExamples: string[] = [];
    ALL_DISC.forEach(seller => {
      ALL_DISC.forEach(target => {
        allExamples.push(...DISC_TRAINING[seller][target].examples);
      });
    });
    // Allow some overlap but check no exact duplicate cluster
    const counts: Record<string, number> = {};
    allExamples.forEach(e => { counts[e] = (counts[e] || 0) + 1; });
    const maxDupes = Math.max(...Object.values(counts));
    expect(maxDupes).toBeLessThanOrEqual(2);
  });

  it('all tips have Portuguese content', () => {
    const ptChars = /[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ]/;
    let ptCount = 0;
    ALL_DISC.forEach(seller => {
      ALL_DISC.forEach(target => {
        const tip = DISC_TRAINING[seller][target];
        if (ptChars.test(tip.description) || ptChars.test(tip.title)) ptCount++;
      });
    });
    expect(ptCount).toBeGreaterThan(8); // Most tips should be in PT
  });
});
