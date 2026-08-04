import { describe, it, expect } from 'vitest';
import { BRAIN_SYSTEM_INFO } from '@/data/neuromarketingData';

/**
 * Data integrity tests for neuromarketing dataset
 */
describe('Neuromarketing Data Integrity', () => {
  const systems = Object.entries(BRAIN_SYSTEM_INFO);

  it('has exactly 3 brain systems (triune model)', () => {
    expect(systems.length).toBe(3);
  });

  it('includes reptilian, limbic, and neocortex', () => {
    const keys = Object.keys(BRAIN_SYSTEM_INFO);
    expect(keys).toContain('reptilian');
    expect(keys).toContain('limbic');
    expect(keys).toContain('neocortex');
  });

  it('all systems have required fields', () => {
    for (const [key, info] of systems) {
      expect(info.name, `${key}.name`).toBeTruthy();
      expect(info.namePt, `${key}.namePt`).toBeTruthy();
      expect(info.icon, `${key}.icon`).toBeTruthy();
      expect(info.description, `${key}.description`).toBeTruthy();
      expect(info.descriptionPt, `${key}.descriptionPt`).toBeTruthy();
      expect(info.mainFunction, `${key}.mainFunction`).toBeTruthy();
      expect(info.decisionRole, `${key}.decisionRole`).toBeTruthy();
    }
  });

  it('all systems have communication style tips', () => {
    for (const [key, info] of systems) {
      expect(info.communicationStyle.length, `${key}.communicationStyle empty`).toBeGreaterThan(0);
    }
  });

  it('all systems have key drivers', () => {
    for (const [key, info] of systems) {
      expect(info.keyDrivers.length, `${key}.keyDrivers empty`).toBeGreaterThan(0);
    }
  });

  it('all systems have warnings', () => {
    for (const [key, info] of systems) {
      expect(info.warnings.length, `${key}.warnings empty`).toBeGreaterThan(0);
    }
  });

  it('all color classes are valid', () => {
    for (const [key, info] of systems) {
      expect(info.color, `${key}.color`).toMatch(/^text-/);
      expect(info.bgColor, `${key}.bgColor`).toMatch(/^bg-/);
    }
  });
});
