import { describe, it, expect } from 'vitest';
import { EQ_PILLAR_INFO } from '@/data/emotionalIntelligenceData';

/**
 * Emotional Intelligence Data Integrity - 30+ scenarios
 */
describe('EQ Pillar Data Integrity', () => {
  const pillars = Object.entries(EQ_PILLAR_INFO);

  it('has exactly 5 Goleman pillars', () => {
    expect(pillars.length).toBe(5);
  });

  it('includes all 5 pillars', () => {
    const keys = Object.keys(EQ_PILLAR_INFO);
    expect(keys).toContain('self_awareness');
    expect(keys).toContain('self_regulation');
    expect(keys).toContain('motivation');
    expect(keys).toContain('empathy');
    expect(keys).toContain('social_skills');
  });

  describe.each(pillars)('Pillar %s', (key, info) => {
    it('has name in EN and PT', () => {
      expect(info.name).toBeTruthy();
      expect(info.namePt).toBeTruthy();
    });

    it('has icon', () => {
      expect(info.icon.length).toBeGreaterThan(0);
    });

    it('has color classes', () => {
      expect(info.color).toMatch(/^text-/);
      expect(info.bgColor).toMatch(/^bg-/);
    });

    it('has descriptions in EN and PT', () => {
      expect(info.description.length).toBeGreaterThan(20);
      expect(info.descriptionPt.length).toBeGreaterThan(20);
    });

    it('has high and low characteristics', () => {
      expect(info.characteristics.high.length).toBeGreaterThan(0);
      expect(info.characteristics.low.length).toBeGreaterThan(0);
    });

    it('has development tips', () => {
      expect(info.developmentTips.length).toBeGreaterThan(0);
    });
  });
});
