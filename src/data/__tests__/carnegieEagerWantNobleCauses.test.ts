import { describe, it, expect } from 'vitest';
import {
  EAGER_WANTS,
  ALL_EAGER_WANT_KEYWORDS,
  detectEagerWants,
  getEagerWantByCategory,
  getTechniquesForWant,
  getEagerWantsByDISC,
  generateEagerWantScript
} from '@/data/carnegieEagerWant';
import {
  NOBLE_CAUSES,
  NOBLE_CAUSE_KEYWORDS,
  NOBLE_CAUSE_INTENSIFIERS,
  getNobleCausesByCategory,
  getNobleCausesByDISC,
  getRandomTemplate
} from '@/data/carnegieNobleCauses';

/**
 * Eager Want & Noble Causes - 80+ scenarios
 */

// ============================================
// EAGER WANTS - DATA
// ============================================
describe('Eager Wants: Data Integrity', () => {
  it('has exactly 8 desire categories', () => {
    expect(EAGER_WANTS.length).toBe(8);
  });

  it('covers all 8 categories', () => {
    const cats = new Set(EAGER_WANTS.map(w => w.category));
    expect(cats.has('recognition')).toBe(true);
    expect(cats.has('security')).toBe(true);
    expect(cats.has('autonomy')).toBe(true);
    expect(cats.has('belonging')).toBe(true);
    expect(cats.has('achievement')).toBe(true);
    expect(cats.has('growth')).toBe(true);
    expect(cats.has('pleasure')).toBe(true);
    expect(cats.has('meaning')).toBe(true);
  });

  it('unique IDs', () => {
    const ids = EAGER_WANTS.map(w => w.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every want has DISC alignment with valid scores 0-100', () => {
    for (const w of EAGER_WANTS) {
      for (const [key, val] of Object.entries(w.discAlignment)) {
        expect(val, `${w.id}.${key}`).toBeGreaterThanOrEqual(0);
        expect(val, `${w.id}.${key}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('every want has at least 3 arousal techniques', () => {
    for (const w of EAGER_WANTS) {
      expect(w.arousalTechniques.length, `${w.id}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('techniques have unique IDs within each want', () => {
    for (const w of EAGER_WANTS) {
      const techIds = w.arousalTechniques.map(t => t.id);
      expect(new Set(techIds).size, `${w.id}: duplicate technique IDs`).toBe(techIds.length);
    }
  });

  it('every want has at least 10 detection keywords', () => {
    for (const w of EAGER_WANTS) {
      expect(w.detectionKeywords.length, `${w.id}`).toBeGreaterThanOrEqual(10);
    }
  });

  it('ALL_EAGER_WANT_KEYWORDS covers all 8 categories', () => {
    expect(Object.keys(ALL_EAGER_WANT_KEYWORDS).length).toBe(8);
    for (const keywords of Object.values(ALL_EAGER_WANT_KEYWORDS)) {
      expect(keywords.length).toBeGreaterThan(10);
    }
  });
});

// ============================================
// EAGER WANTS - FUNCTIONS
// ============================================
describe('Eager Wants: Functions', () => {
  it('detectEagerWants finds recognition keywords', () => {
    const result = detectEagerWants('Quero reconhecimento pelo meu trabalho');
    expect(result).toContain('recognition');
  });

  it('FIX: detectEagerWants now matches word variants like "reconhecido" via stemming', () => {
    const result = detectEagerWants('Quero ser reconhecido');
    // FIX: stemming now matches "reconhec" root from "reconhecimento"
    expect(result).toContain('recognition');
  });

  it('detectEagerWants finds security keywords', () => {
    const result = detectEagerWants('Preciso de garantia e segurança');
    expect(result).toContain('security');
  });

  it('detectEagerWants finds multiple categories', () => {
    const result = detectEagerWants('Quero reconhecimento e segurança para minha família');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('FIX: detectEagerWants no longer false-positives on "bom" in neutral context', () => {
    // FIX: "bom" now requires meaningful context (e.g. "muito bom", "bom resultado")
    const result = detectEagerWants('O tempo está bom hoje');
    expect(result).not.toContain('pleasure'); // No longer a false positive!
  });

  it('detectEagerWants still detects "bom" in meaningful context', () => {
    const result = detectEagerWants('Isso é um bom resultado para todos');
    expect(result).toContain('pleasure');
  });

  it('detectEagerWants handles empty string', () => {
    expect(detectEagerWants('')).toEqual([]);
  });

  it('getEagerWantByCategory finds existing category', () => {
    const want = getEagerWantByCategory('recognition');
    expect(want).toBeDefined();
    expect(want!.category).toBe('recognition');
  });

  it('getEagerWantByCategory returns undefined for invalid', () => {
    const want = getEagerWantByCategory('nonexistent' as never);
    expect(want).toBeUndefined();
  });

  it('getTechniquesForWant returns techniques', () => {
    const techs = getTechniquesForWant('autonomy');
    expect(techs.length).toBe(3);
  });

  it('getTechniquesForWant returns empty for invalid', () => {
    const techs = getTechniquesForWant('nonexistent' as never);
    expect(techs).toEqual([]);
  });

  it('getEagerWantsByDISC returns sorted by alignment', () => {
    const dWants = getEagerWantsByDISC('D');
    expect(dWants.length).toBe(8);
    // D-aligned wants should be sorted descending
    for (let i = 1; i < dWants.length; i++) {
      expect(dWants[i - 1].discAlignment.D).toBeGreaterThanOrEqual(dWants[i].discAlignment.D);
    }
  });

  it('getEagerWantsByDISC: D top want is autonomy or achievement', () => {
    const dWants = getEagerWantsByDISC('D');
    expect(['autonomy', 'achievement']).toContain(dWants[0].category);
  });

  it('getEagerWantsByDISC: S top want is security or belonging', () => {
    const sWants = getEagerWantsByDISC('S');
    expect(['security', 'belonging']).toContain(sWants[0].category);
  });

  it('generateEagerWantScript returns non-empty for valid category', () => {
    const script = generateEagerWantScript('recognition');
    expect(script.length).toBeGreaterThan(10);
  });

  it('generateEagerWantScript returns empty for invalid', () => {
    expect(generateEagerWantScript('nonexistent' as never)).toBe('');
  });
});

// ============================================
// NOBLE CAUSES - DATA
// ============================================
describe('Noble Causes: Data Integrity', () => {
  it('has at least 12 noble causes', () => {
    expect(NOBLE_CAUSES.length).toBeGreaterThanOrEqual(12);
  });

  it('unique IDs', () => {
    const ids = NOBLE_CAUSES.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers all expected categories', () => {
    const cats = new Set(NOBLE_CAUSES.map(c => c.category));
    expect(cats.has('altruism')).toBe(true);
    expect(cats.has('legacy')).toBe(true);
    expect(cats.has('family')).toBe(true);
    expect(cats.has('purpose')).toBe(true);
    expect(cats.has('growth')).toBe(true);
    expect(cats.has('justice')).toBe(true);
    expect(cats.has('innovation')).toBe(true);
    expect(cats.has('community')).toBe(true);
  });

  it('every cause has DISC compatibility 0-100', () => {
    for (const c of NOBLE_CAUSES) {
      for (const [key, val] of Object.entries(c.discCompatibility)) {
        expect(val, `${c.id}.${key}`).toBeGreaterThanOrEqual(0);
        expect(val, `${c.id}.${key}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it('every cause has at least 1 template', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.templates.length, `${c.id}: no templates`).toBeGreaterThan(0);
    }
  });

  it('every template has opening, bridge, callToAction, emotionalHook', () => {
    for (const c of NOBLE_CAUSES) {
      for (const t of c.templates) {
        expect(t.opening.length, `${t.id}: no opening`).toBeGreaterThan(10);
        expect(t.bridge.length, `${t.id}: no bridge`).toBeGreaterThan(10);
        expect(t.callToAction.length, `${t.id}: no CTA`).toBeGreaterThan(10);
        expect(t.emotionalHook.length, `${t.id}: no hook`).toBeGreaterThan(10);
      }
    }
  });

  it('intensity scores are 1-5', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.intensity, `${c.id}`).toBeGreaterThanOrEqual(1);
      expect(c.intensity, `${c.id}`).toBeLessThanOrEqual(5);
    }
  });

  it('every cause has at least 8 keywords', () => {
    for (const c of NOBLE_CAUSES) {
      expect(c.keywords.length, `${c.id}`).toBeGreaterThanOrEqual(8);
    }
  });

  it('NOBLE_CAUSE_KEYWORDS covers all categories', () => {
    expect(Object.keys(NOBLE_CAUSE_KEYWORDS).length).toBe(8);
    for (const [key, keywords] of Object.entries(NOBLE_CAUSE_KEYWORDS)) {
      expect(keywords.length, `${key}`).toBeGreaterThan(10);
    }
  });

  it('intensifiers cover 4 levels', () => {
    expect(NOBLE_CAUSE_INTENSIFIERS.low.length).toBeGreaterThan(3);
    expect(NOBLE_CAUSE_INTENSIFIERS.medium.length).toBeGreaterThan(3);
    expect(NOBLE_CAUSE_INTENSIFIERS.high.length).toBeGreaterThan(3);
    expect(NOBLE_CAUSE_INTENSIFIERS.extreme.length).toBeGreaterThan(3);
  });
});

// ============================================
// NOBLE CAUSES - FUNCTIONS
// ============================================
describe('Noble Causes: Functions', () => {
  it('getNobleCausesByCategory returns correct causes', () => {
    const altruism = getNobleCausesByCategory('altruism');
    expect(altruism.length).toBeGreaterThanOrEqual(2);
    altruism.forEach(c => expect(c.category).toBe('altruism'));
  });

  it('getNobleCausesByCategory returns empty for invalid', () => {
    const result = getNobleCausesByCategory('nonexistent' as never);
    expect(result).toEqual([]);
  });

  it('getNobleCausesByDISC returns sorted by compatibility', () => {
    const dCauses = getNobleCausesByDISC('D');
    expect(dCauses.length).toBe(NOBLE_CAUSES.length);
    for (let i = 1; i < dCauses.length; i++) {
      expect(dCauses[i - 1].discCompatibility.D).toBeGreaterThanOrEqual(dCauses[i].discCompatibility.D);
    }
  });

  it('getRandomTemplate returns template for valid cause', () => {
    const template = getRandomTemplate('altruism_community');
    expect(template).not.toBeNull();
    expect(template!.causeId).toBe('altruism_community');
  });

  it('getRandomTemplate returns null for invalid cause', () => {
    const template = getRandomTemplate('nonexistent');
    expect(template).toBeNull();
  });
});
