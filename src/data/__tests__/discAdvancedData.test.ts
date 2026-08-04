import { describe, it, expect } from 'vitest';
import { DISC_PROFILES } from '@/data/discAdvancedData';

/**
 * DISC Advanced Data Integrity - 50+ scenarios
 */
describe('DISC Advanced Data Integrity', () => {
  const profiles = Object.entries(DISC_PROFILES);
  const profileKeys = Object.keys(DISC_PROFILES);

  it('has exactly 4 DISC profiles', () => {
    expect(profiles.length).toBe(4);
  });

  it('includes D, I, S, C', () => {
    expect(profileKeys).toContain('D');
    expect(profileKeys).toContain('I');
    expect(profileKeys).toContain('S');
    expect(profileKeys).toContain('C');
  });

  describe.each(profiles)('Profile %s', (key, info) => {
    it('has valid type matching key', () => {
      expect(info.type).toBe(key);
    });

    it('has name', () => {
      expect(info.name).toBeTruthy();
      expect(info.name.length).toBeGreaterThan(2);
    });

    it('has descriptions', () => {
      expect(info.shortDescription).toBeTruthy();
      expect(info.detailedDescription).toBeTruthy();
      expect(info.detailedDescription.length).toBeGreaterThan(50);
    });

    it('has core psychology', () => {
      expect(info.coreDrive).toBeTruthy();
      expect(info.coreFear).toBeTruthy();
      expect(info.underPressure).toBeTruthy();
      expect(info.idealEnvironment).toBeTruthy();
    });

    it('has valid communication style', () => {
      expect(['fast', 'moderate', 'slow']).toContain(info.communicationStyle.pace);
      expect(['task', 'people', 'data', 'harmony']).toContain(info.communicationStyle.focus);
      expect(info.communicationStyle.preferredFormat).toBeTruthy();
      expect(info.communicationStyle.responseExpectation).toBeTruthy();
    });

    it('has valid decision style', () => {
      expect(['impulsive', 'fast', 'moderate', 'slow', 'analytical']).toContain(info.decisionStyle.speed);
      expect(info.decisionStyle.criteria.length).toBeGreaterThan(0);
      expect(info.decisionStyle.needsFrom.length).toBeGreaterThan(0);
      expect(info.decisionStyle.avoidsIn.length).toBeGreaterThan(0);
    });

    it('has complete sales approach', () => {
      expect(info.salesApproach.opening.length).toBeGreaterThan(0);
      expect(info.salesApproach.presentation.length).toBeGreaterThan(0);
      expect(info.salesApproach.objectionHandling.length).toBeGreaterThan(0);
      expect(info.salesApproach.closing.length).toBeGreaterThan(0);
      expect(info.salesApproach.followUp.length).toBeGreaterThan(0);
      expect(info.salesApproach.warnings.length).toBeGreaterThan(0);
    });

    it('has language patterns', () => {
      expect(info.powerWords.length).toBeGreaterThan(0);
      expect(info.avoidWords.length).toBeGreaterThan(0);
      expect(info.typicalPhrases.length).toBeGreaterThan(0);
      expect(info.detectionKeywords.length).toBeGreaterThan(0);
    });

    it('powerWords and avoidWords have no overlap', () => {
      const overlap = info.powerWords.filter(w => info.avoidWords.includes(w));
      expect(overlap, `${key}: overlapping words: ${overlap.join(', ')}`).toEqual([]);
    });

    it('has visual config', () => {
      expect(info.color.primary).toBeTruthy();
      expect(info.color.bg).toBeTruthy();
      expect(info.icon).toBeTruthy();
    });
  });
});
