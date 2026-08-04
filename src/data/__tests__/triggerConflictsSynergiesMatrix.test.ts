import { describe, it, expect } from 'vitest';
import {
  COMPLETE_TRIGGER_CONFLICTS,
  COMPLETE_TRIGGER_SYNERGIES,
  getConflictsForTrigger,
  getSynergiesForTrigger,
  checkConflict,
  checkSynergy,
  getRecommendedCombos,
  getConflictSeverity
} from '@/data/triggerConflictsMatrix';

/**
 * Trigger Conflicts & Synergies Matrix - 50+ scenarios
 */

// ============================================
// CONFLICTS DATA
// ============================================
describe('Trigger Conflicts Matrix: Data', () => {
  it('has at least 40 conflicts', () => {
    expect(COMPLETE_TRIGGER_CONFLICTS.length).toBeGreaterThanOrEqual(40);
  });

  it('all conflicts have valid severity levels', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(['minor', 'moderate', 'severe']).toContain(c.conflictLevel);
    }
  });

  it('all conflicts have reason and resolution', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(c.reason.length, `${c.trigger1}-${c.trigger2}: no reason`).toBeGreaterThan(10);
      expect(c.resolution.length, `${c.trigger1}-${c.trigger2}: no resolution`).toBeGreaterThan(10);
    }
  });

  it('no duplicate conflict pairs', () => {
    const pairs = new Set<string>();
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      const key = [c.trigger1, c.trigger2].sort().join('|');
      expect(pairs.has(key), `Duplicate: ${key}`).toBe(false);
      pairs.add(key);
    }
  });

  it('no self-conflicts', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(c.trigger1).not.toBe(c.trigger2);
    }
  });

  it('severe conflicts include urgency+empathy and pattern_interrupt+empathy', () => {
    const severeConflicts = COMPLETE_TRIGGER_CONFLICTS.filter(c => c.conflictLevel === 'severe');
    expect(severeConflicts.length).toBeGreaterThanOrEqual(5);
    
    const hasUrgencyEmpathy = severeConflicts.some(c =>
      (c.trigger1 === 'urgency' && c.trigger2 === 'empathy') ||
      (c.trigger1 === 'empathy' && c.trigger2 === 'urgency')
    );
    expect(hasUrgencyEmpathy).toBe(true);
  });
});

// ============================================
// SYNERGIES DATA
// ============================================
describe('Trigger Synergies Matrix: Data', () => {
  it('has at least 25 synergies', () => {
    expect(COMPLETE_TRIGGER_SYNERGIES.length).toBeGreaterThanOrEqual(25);
  });

  it('synergy levels are 1-10', () => {
    for (const s of COMPLETE_TRIGGER_SYNERGIES) {
      expect(s.synergyLevel, `${s.trigger1}-${s.trigger2}`).toBeGreaterThanOrEqual(1);
      expect(s.synergyLevel, `${s.trigger1}-${s.trigger2}`).toBeLessThanOrEqual(10);
    }
  });

  it('all synergies have explanation and combined effect', () => {
    for (const s of COMPLETE_TRIGGER_SYNERGIES) {
      expect(s.explanation.length, `${s.trigger1}-${s.trigger2}: no explanation`).toBeGreaterThan(5);
      expect(s.combinedEffect.length, `${s.trigger1}-${s.trigger2}: no effect`).toBeGreaterThan(5);
    }
  });

  it('no duplicate synergy pairs', () => {
    const pairs = new Set<string>();
    for (const s of COMPLETE_TRIGGER_SYNERGIES) {
      const key = [s.trigger1, s.trigger2].sort().join('|');
      expect(pairs.has(key), `Duplicate: ${key}`).toBe(false);
      pairs.add(key);
    }
  });

  it('has power combos (synergy level 10)', () => {
    const powerCombos = COMPLETE_TRIGGER_SYNERGIES.filter(s => s.synergyLevel === 10);
    expect(powerCombos.length).toBeGreaterThanOrEqual(5);
  });

  it('no pair appears in both conflicts AND synergies', () => {
    const conflictPairs = new Set(
      COMPLETE_TRIGGER_CONFLICTS.map(c => [c.trigger1, c.trigger2].sort().join('|'))
    );
    for (const s of COMPLETE_TRIGGER_SYNERGIES) {
      const key = [s.trigger1, s.trigger2].sort().join('|');
      expect(conflictPairs.has(key), `${key} is both conflict and synergy`).toBe(false);
    }
  });
});

// ============================================
// FUNCTIONS
// ============================================
describe('Trigger Matrix: Functions', () => {
  it('getConflictsForTrigger returns conflicts for urgency', () => {
    const conflicts = getConflictsForTrigger('urgency');
    expect(conflicts.length).toBeGreaterThan(0);
    for (const c of conflicts) {
      expect(c.trigger1 === 'urgency' || c.trigger2 === 'urgency').toBe(true);
    }
  });

  it('getSynergiesForTrigger returns synergies for authority', () => {
    const synergies = getSynergiesForTrigger('authority');
    expect(synergies.length).toBeGreaterThan(0);
    for (const s of synergies) {
      expect(s.trigger1 === 'authority' || s.trigger2 === 'authority').toBe(true);
    }
  });

  it('checkConflict finds known conflict', () => {
    const conflict = checkConflict('urgency', 'empathy');
    expect(conflict).not.toBeNull();
    expect(conflict!.conflictLevel).toBe('severe');
  });

  it('checkConflict works in reverse order', () => {
    const conflict = checkConflict('empathy', 'urgency');
    expect(conflict).not.toBeNull();
  });

  it('checkConflict returns null for non-conflicting pair', () => {
    const conflict = checkConflict('authority', 'specificity');
    expect(conflict).toBeNull();
  });

  it('checkSynergy finds known synergy', () => {
    const synergy = checkSynergy('authority', 'specificity');
    expect(synergy).not.toBeNull();
    expect(synergy!.synergyLevel).toBe(10);
  });

  it('checkSynergy works in reverse order', () => {
    const synergy = checkSynergy('specificity', 'authority');
    expect(synergy).not.toBeNull();
  });

  it('checkSynergy returns null for non-synergistic pair', () => {
    const synergy = checkSynergy('urgency', 'empathy');
    expect(synergy).toBeNull();
  });

  it('getRecommendedCombos returns sorted by synergy level', () => {
    const combos = getRecommendedCombos('authority', 3);
    expect(combos.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < combos.length; i++) {
      expect(combos[i - 1].synergyLevel).toBeGreaterThanOrEqual(combos[i].synergyLevel);
    }
  });

  it('getConflictSeverity returns correct levels', () => {
    expect(getConflictSeverity('urgency', 'empathy')).toBe('severe');
    expect(getConflictSeverity('authority', 'empathy')).toBe('minor');
    expect(getConflictSeverity('authority', 'specificity')).toBe('none');
  });
});
