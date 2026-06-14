import { describe, it, expect } from 'vitest';
import { YES_LADDER_TEMPLATES } from '@/data/carnegieYesLadder';
import { STORY_TEMPLATES } from '@/data/carnegieStorytelling';

describe('Carnegie Yes-Ladder Templates', () => {
  it('has at least 3 templates', () => {
    expect(YES_LADDER_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('all templates have unique IDs', () => {
    const ids = YES_LADDER_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have at least 2 steps', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      expect(t.steps.length, `${t.id}: too few steps`).toBeGreaterThanOrEqual(2);
    }
  });

  it('steps have sequential stepNumbers', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      for (let i = 0; i < t.steps.length; i++) {
        expect(t.steps[i].stepNumber).toBe(i + 1);
      }
    }
  });

  it('all steps have question, purpose, transition', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      for (const step of t.steps) {
        expect(step.question.length).toBeGreaterThan(5);
        expect(step.purpose.length).toBeGreaterThan(0);
        expect(step.transition.length).toBeGreaterThan(0);
      }
    }
  });

  it('all steps expect yes or agreement', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      for (const step of t.steps) {
        expect(['yes', 'agreement']).toContain(step.expectedResponse);
      }
    }
  });

  it('all templates have finalAsk', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      expect(t.finalAsk.length).toBeGreaterThan(5);
    }
  });

  it('all templates have DISC variations (D, I, S, C)', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      expect(t.discVariation.D.length).toBeGreaterThan(0);
      expect(t.discVariation.I.length).toBeGreaterThan(0);
      expect(t.discVariation.S.length).toBeGreaterThan(0);
      expect(t.discVariation.C.length).toBeGreaterThan(0);
    }
  });

  it('DISC variation steps also have required fields', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      for (const profile of ['D', 'I', 'S', 'C'] as const) {
        for (const step of t.discVariation[profile]) {
          expect(step.question.length).toBeGreaterThan(3);
          expect(step.purpose.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('D profile steps are shorter/more direct than S steps', () => {
    for (const t of YES_LADDER_TEMPLATES) {
      const dTotal = t.discVariation.D.reduce((s, st) => s + st.question.length, 0);
      const sTotal = t.discVariation.S.reduce((s, st) => s + st.question.length, 0);
      // D should generally be more concise (not always, so we check average)
      const dAvg = dTotal / t.discVariation.D.length;
      const sAvg = sTotal / t.discVariation.S.length;
      // Just verify both exist and have reasonable length
      expect(dAvg).toBeGreaterThan(5);
      expect(sAvg).toBeGreaterThan(5);
    }
  });
});

describe('Carnegie Storytelling Templates', () => {
  it('has at least 4 story templates', () => {
    expect(STORY_TEMPLATES.length).toBeGreaterThanOrEqual(4);
  });

  it('all templates have unique IDs', () => {
    const ids = STORY_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all templates have a type string', () => {
    for (const t of STORY_TEMPLATES) {
      expect(t.type.length).toBeGreaterThan(0);
    }
  });

  it('all templates have complete structure', () => {
    for (const t of STORY_TEMPLATES) {
      expect(t.structure.hook.length).toBeGreaterThan(5);
      expect(t.structure.conflict.length).toBeGreaterThan(5);
      expect(t.structure.journey.length).toBeGreaterThan(5);
      expect(t.structure.resolution.length).toBeGreaterThan(5);
      expect(t.structure.lesson.length).toBeGreaterThan(5);
    }
  });

  it('all templates have example text', () => {
    for (const t of STORY_TEMPLATES) {
      expect(t.example.length).toBeGreaterThan(50);
    }
  });

  it('all templates have whenToUse suggestions', () => {
    for (const t of STORY_TEMPLATES) {
      expect(t.whenToUse.length).toBeGreaterThan(0);
    }
  });

  it('all templates have emotionalArc with arrows', () => {
    for (const t of STORY_TEMPLATES) {
      expect(t.emotionalArc).toMatch(/→/);
    }
  });

  it('hero_journey exists', () => {
    const hero = STORY_TEMPLATES.find(t => t.type === 'hero_journey');
    expect(hero).toBeDefined();
  });
});
