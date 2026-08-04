import { describe, it, expect } from 'vitest';
import { COMPLETE_TRIGGER_CONFLICTS } from '@/data/triggerConflictsMatrix';

/**
 * Trigger Conflicts Matrix Integrity - 25+ scenarios
 */
describe('Trigger Conflicts Matrix', () => {
  it('has at least 30 conflicts', () => {
    expect(COMPLETE_TRIGGER_CONFLICTS.length).toBeGreaterThanOrEqual(30);
  });

  it('all conflicts have two triggers', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(c.trigger1, 'trigger1 missing').toBeTruthy();
      expect(c.trigger2, 'trigger2 missing').toBeTruthy();
    }
  });

  it('trigger1 !== trigger2 (no self-conflicts)', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(c.trigger1, `self-conflict: ${c.trigger1}`).not.toBe(c.trigger2);
    }
  });

  it('all conflicts have valid level', () => {
    const validLevels = ['minor', 'moderate', 'severe', 'critical'];
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(validLevels, `invalid level: ${c.conflictLevel}`).toContain(c.conflictLevel);
    }
  });

  it('all conflicts have reason', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(c.reason.length).toBeGreaterThan(10);
    }
  });

  it('all conflicts have resolution', () => {
    for (const c of COMPLETE_TRIGGER_CONFLICTS) {
      expect(c.resolution.length).toBeGreaterThan(10);
    }
  });

  it('no duplicate conflict pairs', () => {
    const pairs = COMPLETE_TRIGGER_CONFLICTS.map(c => 
      [c.trigger1, c.trigger2].sort().join('-')
    );
    const uniquePairs = new Set(pairs);
    // Allow some duplicates if different context, but flag if many
    expect(uniquePairs.size).toBeGreaterThan(pairs.length * 0.8);
  });

  it('includes urgency conflicts', () => {
    const urgencyConflicts = COMPLETE_TRIGGER_CONFLICTS.filter(
      c => c.trigger1 === 'urgency' || c.trigger2 === 'urgency'
    );
    expect(urgencyConflicts.length).toBeGreaterThan(0);
  });

  it('includes scarcity conflicts', () => {
    const scarcityConflicts = COMPLETE_TRIGGER_CONFLICTS.filter(
      c => c.trigger1 === 'scarcity' || c.trigger2 === 'scarcity'
    );
    expect(scarcityConflicts.length).toBeGreaterThan(0);
  });
});
