import { describe, it, expect } from 'vitest';
import { FACE_SAVING_TECHNIQUES } from '@/data/carnegieFaceSaving';
import { IDENTITY_LABELS, IDENTITY_DETECTION_PATTERNS, IDENTITY_REINFORCEMENT_SCRIPTS } from '@/data/carnegieIdentityLabels';
import { OWNERSHIP_TECHNIQUES, OWNERSHIP_LANGUAGE, OWNERSHIP_BY_DISC, analyzeOwnershipLanguage, getTechniquesForDISC } from '@/data/carnegieOwnershipTransfer';
import { PROGRESS_CELEBRATIONS, CELEBRATION_BY_DISC, PROGRESS_DETECTION_PATTERNS, getCelebrationTemplate, detectProgressType } from '@/data/carnegieProgressCelebration';
import { VULNERABILITY_TEMPLATES, VULNERABILITY_GUIDELINES } from '@/data/carnegieVulnerability';
import {
  YES_LADDER_TEMPLATES,
  UNIVERSAL_YES_QUESTIONS,
  YES_MOMENTUM_PRINCIPLES,
  countYesOpportunities,
  suggestYesQuestions,
  calculateYesReadiness
} from '@/data/carnegieYesLadder';

/**
 * Carnegie Data Integrity - 100+ test scenarios
 */

// ============================================
// FACE SAVING
// ============================================
describe('Face Saving Techniques', () => {
  it('has at least 8 techniques', () => {
    expect(FACE_SAVING_TECHNIQUES.length).toBeGreaterThanOrEqual(8);
  });

  it('covers multiple scenarios', () => {
    const scenarios = new Set(FACE_SAVING_TECHNIQUES.map(t => t.scenario));
    expect(scenarios.has('price_objection')).toBe(true);
    expect(scenarios.has('product_limitation')).toBe(true);
    expect(scenarios.has('missed_deadline')).toBe(true);
    expect(scenarios.has('service_failure')).toBe(true);
    expect(scenarios.has('misunderstanding')).toBe(true);
    expect(scenarios.has('competitor_comparison')).toBe(true);
  });

  it('every technique has DISC variations', () => {
    for (const t of FACE_SAVING_TECHNIQUES) {
      expect(t.discVariations.D, `${t.id}: missing D`).toBeTruthy();
      expect(t.discVariations.I, `${t.id}: missing I`).toBeTruthy();
      expect(t.discVariations.S, `${t.id}: missing S`).toBeTruthy();
      expect(t.discVariations.C, `${t.id}: missing C`).toBeTruthy();
    }
  });

  it('every technique has doThis and avoidThis lists', () => {
    for (const t of FACE_SAVING_TECHNIQUES) {
      expect(t.doThis.length, `${t.id}: no doThis`).toBeGreaterThan(0);
      expect(t.avoidThis.length, `${t.id}: no avoidThis`).toBeGreaterThan(0);
    }
  });

  it('every technique has full script', () => {
    for (const t of FACE_SAVING_TECHNIQUES) {
      expect(t.fullScript.length, `${t.id}: empty script`).toBeGreaterThan(50);
    }
  });

  it('unique IDs across all techniques', () => {
    const ids = FACE_SAVING_TECHNIQUES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ============================================
// IDENTITY LABELS
// ============================================
describe('Identity Labels', () => {
  it('has at least 15 labels', () => {
    expect(IDENTITY_LABELS.length).toBeGreaterThanOrEqual(15);
  });

  it('covers multiple categories', () => {
    const categories = new Set(IDENTITY_LABELS.map(l => l.category));
    expect(categories.size).toBeGreaterThanOrEqual(8);
    expect(categories.has('achiever')).toBe(true);
    expect(categories.has('innovator')).toBe(true);
    expect(categories.has('leader')).toBe(true);
    expect(categories.has('expert')).toBe(true);
  });

  it('every label has DISC alignment scores', () => {
    for (const l of IDENTITY_LABELS) {
      expect(l.discAlignment.D, `${l.id}: missing D`).toBeGreaterThanOrEqual(0);
      expect(l.discAlignment.I, `${l.id}: missing I`).toBeGreaterThanOrEqual(0);
      expect(l.discAlignment.S, `${l.id}: missing S`).toBeGreaterThanOrEqual(0);
      expect(l.discAlignment.C, `${l.id}: missing C`).toBeGreaterThanOrEqual(0);
    }
  });

  it('every label has VAK alignment scores', () => {
    for (const l of IDENTITY_LABELS) {
      expect(l.vakAlignment.V).toBeGreaterThanOrEqual(0);
      expect(l.vakAlignment.A).toBeGreaterThanOrEqual(0);
      expect(l.vakAlignment.K).toBeGreaterThanOrEqual(0);
    }
  });

  it('DISC alignment scores are 0-100', () => {
    for (const l of IDENTITY_LABELS) {
      for (const [key, val] of Object.entries(l.discAlignment)) {
        expect(val, `${l.id}.${key}`).toBeGreaterThanOrEqual(0);
        expect(val, `${l.id}.${key}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('reinforcement phrases are non-empty arrays', () => {
    for (const l of IDENTITY_LABELS) {
      expect(l.reinforcementPhrases.length, `${l.id}: no phrases`).toBeGreaterThan(0);
    }
  });

  it('detection patterns exist for each category', () => {
    const categories = new Set(IDENTITY_LABELS.map(l => l.category));
    for (const cat of categories) {
      expect(IDENTITY_DETECTION_PATTERNS[cat as keyof typeof IDENTITY_DETECTION_PATTERNS], `Missing patterns for ${cat}`).toBeDefined();
    }
  });

  it('reinforcement scripts cover initial/ongoing/challenge', () => {
    for (const [key, script] of Object.entries(IDENTITY_REINFORCEMENT_SCRIPTS)) {
      expect(script.initial.length, `${key}: empty initial`).toBeGreaterThan(10);
      expect(script.ongoing.length, `${key}: empty ongoing`).toBeGreaterThan(10);
      expect(script.challenge.length, `${key}: empty challenge`).toBeGreaterThan(10);
    }
  });
});

// ============================================
// OWNERSHIP TRANSFER
// ============================================
describe('Ownership Transfer', () => {
  it('has at least 6 techniques', () => {
    expect(OWNERSHIP_TECHNIQUES.length).toBeGreaterThanOrEqual(6);
  });

  it('unique IDs', () => {
    const ids = OWNERSHIP_TECHNIQUES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every technique has whenToUse', () => {
    for (const t of OWNERSHIP_TECHNIQUES) {
      expect(t.whenToUse.length, `${t.id}: no whenToUse`).toBeGreaterThan(0);
    }
  });

  it('ownership language has toAvoid and toUse', () => {
    expect(OWNERSHIP_LANGUAGE.toAvoid.length).toBeGreaterThan(3);
    expect(OWNERSHIP_LANGUAGE.toUse.length).toBeGreaterThan(3);
    expect(OWNERSHIP_LANGUAGE.celebration.length).toBeGreaterThan(3);
    expect(OWNERSHIP_LANGUAGE.attribution.length).toBeGreaterThan(3);
  });

  it('DISC-specific techniques reference valid IDs', () => {
    const validIds = new Set(OWNERSHIP_TECHNIQUES.map(t => t.id));
    for (const [disc, config] of Object.entries(OWNERSHIP_BY_DISC)) {
      for (const techId of config.techniques) {
        expect(validIds.has(techId), `${disc}: invalid technique ${techId}`).toBe(true);
      }
    }
  });

  it('analyzeOwnershipLanguage detects problematic phrases (fixed ellipsis stripping)', () => {
    // FIX: toAvoid no longer has "..." literals, matching works correctly
    const result = analyzeOwnershipLanguage('Na minha opinião isso é melhor');
    expect(result.problematicPhrases.length).toBeGreaterThan(0);
    expect(result.ownershipGiven).toBe(false);
  });

  it('analyzeOwnershipLanguage also detects with ellipsis in text', () => {
    const result = analyzeOwnershipLanguage('Na minha opinião... isso é melhor');
    expect(result.problematicPhrases.length).toBeGreaterThan(0);
  });

  it('analyzeOwnershipLanguage recognizes good ownership', () => {
    // FIX: toUse matching now strips ellipsis and question marks properly
    const result = analyzeOwnershipLanguage('O que você acha de expandirmos isso?');
    expect(result.problematicPhrases.length).toBe(0);
    expect(result.ownershipGiven).toBe(true);
  });

  it('getTechniquesForDISC returns valid techniques', () => {
    const dTech = getTechniquesForDISC('D');
    expect(dTech.length).toBeGreaterThan(0);
    const cTech = getTechniquesForDISC('C');
    expect(cTech.length).toBeGreaterThan(0);
  });
});

// ============================================
// PROGRESS CELEBRATION
// ============================================
describe('Progress Celebration', () => {
  it('has at least 10 celebration types', () => {
    expect(PROGRESS_CELEBRATIONS.length).toBeGreaterThanOrEqual(10);
  });

  it('covers all progress types', () => {
    const types = new Set(PROGRESS_CELEBRATIONS.map(c => c.type));
    expect(types.has('milestone_reached')).toBe(true);
    expect(types.has('goal_achieved')).toBe(true);
    expect(types.has('challenge_overcome')).toBe(true);
    expect(types.has('breakthrough')).toBe(true);
    expect(types.has('consistency')).toBe(true);
    expect(types.has('habit_formed')).toBe(true);
  });

  it('every celebration has 3 intensity levels', () => {
    for (const c of PROGRESS_CELEBRATIONS) {
      expect(c.microCelebration.length, `${c.id}: no micro`).toBeGreaterThan(3);
      expect(c.standardCelebration.length, `${c.id}: no standard`).toBeGreaterThan(10);
      expect(c.majorCelebration.length, `${c.id}: no major`).toBeGreaterThan(20);
    }
  });

  it('DISC celebration styles vary in preferred intensity', () => {
    expect(CELEBRATION_BY_DISC.D.preferredIntensity).toBe('micro');
    expect(CELEBRATION_BY_DISC.I.preferredIntensity).toBe('major');
  });

  it('progress detection patterns cover all types', () => {
    const types = Object.keys(PROGRESS_DETECTION_PATTERNS);
    expect(types.length).toBeGreaterThanOrEqual(10);
    for (const keywords of Object.values(PROGRESS_DETECTION_PATTERNS)) {
      expect(keywords.length).toBeGreaterThan(3);
    }
  });

  it('getCelebrationTemplate finds valid types', () => {
    const template = getCelebrationTemplate('breakthrough');
    expect(template).toBeDefined();
    expect(template!.type).toBe('breakthrough');
  });

  it('getCelebrationTemplate returns null for invalid type', () => {
    const template = getCelebrationTemplate('nonexistent' as never);
    expect(template).toBeNull();
  });

  it('detectProgress finds milestone keywords', () => {
    const type = detectProgressType('Alcançamos o marco de 100 clientes');
    expect(type).not.toBeNull();
  });
});

// ============================================
// VULNERABILITY
// ============================================
describe('Vulnerability Templates', () => {
  it('has at least 7 templates', () => {
    expect(VULNERABILITY_TEMPLATES.length).toBeGreaterThanOrEqual(7);
  });

  it('covers multiple vulnerability types', () => {
    const types = new Set(VULNERABILITY_TEMPLATES.map(t => t.type));
    expect(types.has('admitting_mistake')).toBe(true);
    expect(types.has('sharing_failure')).toBe(true);
    expect(types.has('acknowledging_limitation')).toBe(true);
    expect(types.has('expressing_uncertainty')).toBe(true);
    expect(types.has('asking_for_help')).toBe(true);
  });

  it('every template has DISC adaptations', () => {
    for (const t of VULNERABILITY_TEMPLATES) {
      expect(t.discAdaptation.D.approach, `${t.id}: D missing`).toBeTruthy();
      expect(t.discAdaptation.I.approach, `${t.id}: I missing`).toBeTruthy();
      expect(t.discAdaptation.S.approach, `${t.id}: S missing`).toBeTruthy();
      expect(t.discAdaptation.C.approach, `${t.id}: C missing`).toBeTruthy();
    }
  });

  it('trust and authenticity scores are 1-10', () => {
    for (const t of VULNERABILITY_TEMPLATES) {
      expect(t.trustBuildingScore, `${t.id}: trust`).toBeGreaterThanOrEqual(1);
      expect(t.trustBuildingScore, `${t.id}: trust`).toBeLessThanOrEqual(10);
      expect(t.authenticityScore, `${t.id}: auth`).toBeGreaterThanOrEqual(1);
      expect(t.authenticityScore, `${t.id}: auth`).toBeLessThanOrEqual(10);
    }
  });

  it('guidelines have safe and risky topics', () => {
    expect(VULNERABILITY_GUIDELINES.safeTopics.length).toBeGreaterThan(3);
    expect(VULNERABILITY_GUIDELINES.riskyTopics.length).toBeGreaterThan(3);
    expect(VULNERABILITY_GUIDELINES.redFlags.length).toBeGreaterThan(3);
    expect(VULNERABILITY_GUIDELINES.goldStandard.length).toBeGreaterThan(3);
  });
});

// ============================================
// YES LADDER
// ============================================
describe('Yes Ladder', () => {
  it('has at least 3 templates', () => {
    expect(YES_LADDER_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('every template has DISC variations', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      expect(t.discVariation.D.length, `${t.id}: D empty`).toBeGreaterThan(0);
      expect(t.discVariation.I.length, `${t.id}: I empty`).toBeGreaterThan(0);
      expect(t.discVariation.S.length, `${t.id}: S empty`).toBeGreaterThan(0);
      expect(t.discVariation.C.length, `${t.id}: C empty`).toBeGreaterThan(0);
    }
  });

  it('steps have sequential stepNumbers', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      for (let i = 0; i < t.steps.length; i++) {
        expect(t.steps[i].stepNumber).toBe(i + 1);
      }
    }
  });

  it('every template has a finalAsk', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      expect(t.finalAsk.length).toBeGreaterThan(10);
    }
  });

  it('universal yes questions have 4 categories', () => {
    expect(Object.keys(UNIVERSAL_YES_QUESTIONS).length).toBe(4);
    for (const [key, qs] of Object.entries(UNIVERSAL_YES_QUESTIONS)) {
      expect(qs.length, `${key}: empty`).toBeGreaterThan(0);
    }
  });

  it('yes momentum principles have at least 5', () => {
    expect(YES_MOMENTUM_PRINCIPLES.length).toBeGreaterThanOrEqual(5);
  });

  it('countYesOpportunities finds yes-patterns', () => {
    const count = countYesOpportunities('É importante resolver isso, você quer avançar?');
    expect(count).toBeGreaterThan(0);
  });

  it('suggestYesQuestions returns suggestions for problem context', () => {
    const suggestions = suggestYesQuestions('Temos um problema grave');
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it('calculateYesReadiness scales with yesCount', () => {
    expect(calculateYesReadiness(0)).toBe(10);
    expect(calculateYesReadiness(1)).toBe(30);
    expect(calculateYesReadiness(3)).toBe(70);
    expect(calculateYesReadiness(5)).toBe(95);
  });
});
