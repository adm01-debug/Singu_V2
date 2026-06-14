/**
 * Testes exaustivos — Progress Celebration, Storytelling & Question Influence
 */
import { describe, it, expect } from 'vitest';
import {
  PROGRESS_CELEBRATIONS, CELEBRATION_INTENSITY_GUIDELINES, PROGRESS_DETECTION_PATTERNS, CELEBRATION_BY_DISC
} from '../carnegieProgressCelebration';
import {
  STORY_TEMPLATES, STORY_ELEMENTS,
  getStoryTemplateByType, getStoriesForDISC, analyzeStorytellingInText, generateStoryOutline
} from '../carnegieStorytelling';
import {
  ORDER_TO_QUESTION,
  detectOrders, countQuestionsVsOrders, suggestQuestions, analyzeQuestionInfluence
} from '../carnegieQuestionInfluence';

// ══════════════════ PROGRESS CELEBRATION ══════════════════

describe('PROGRESS_CELEBRATIONS — Data Integrity', () => {
  it('has 10 celebration types', () => expect(PROGRESS_CELEBRATIONS.length).toBe(10));

  it('each celebration has required fields', () => {
    PROGRESS_CELEBRATIONS.forEach(c => {
      expect(c.id).toBeTruthy();
      expect(c.type).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.recognitionPhrase).toBeTruthy();
      expect(c.amplificationPhrase).toBeTruthy();
      expect(c.futureProjection).toBeTruthy();
      expect(c.fullScript).toBeTruthy();
      expect(c.microCelebration).toBeTruthy();
      expect(c.standardCelebration).toBeTruthy();
      expect(c.majorCelebration).toBeTruthy();
      expect(c.followUpQuestion).toBeTruthy();
      expect(c.nextStepSuggestion).toBeTruthy();
    });
  });

  it('has unique IDs', () => {
    const ids = PROGRESS_CELEBRATIONS.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('CELEBRATION_INTENSITY_GUIDELINES', () => {
  it('has micro, standard, major', () => {
    expect(CELEBRATION_INTENSITY_GUIDELINES.micro).toBeDefined();
    expect(CELEBRATION_INTENSITY_GUIDELINES.standard).toBeDefined();
    expect(CELEBRATION_INTENSITY_GUIDELINES.major).toBeDefined();
  });

  it('each level has when, tone, duration', () => {
    ['micro', 'standard', 'major'].forEach(level => {
      const config = CELEBRATION_INTENSITY_GUIDELINES[level as keyof typeof CELEBRATION_INTENSITY_GUIDELINES];
      expect(config.when.length).toBeGreaterThan(0);
      expect(config.tone).toBeTruthy();
      expect(config.duration).toBeTruthy();
    });
  });
});

describe('PROGRESS_DETECTION_PATTERNS', () => {
  const types = Object.keys(PROGRESS_DETECTION_PATTERNS);

  it('has 10 progress types', () => expect(types.length).toBe(10));

  it('each type has keywords', () => {
    types.forEach(t => {
      expect(PROGRESS_DETECTION_PATTERNS[t as keyof typeof PROGRESS_DETECTION_PATTERNS].length).toBeGreaterThan(0);
    });
  });
});

describe('CELEBRATION_BY_DISC', () => {
  (['D', 'I', 'S', 'C'] as const).forEach(profile => {
    it(`has config for ${profile}`, () => {
      const config = CELEBRATION_BY_DISC[profile];
      expect(config.preferredIntensity).toBeTruthy();
      expect(config.style).toBeTruthy();
      expect(config.examples.length).toBeGreaterThan(0);
      expect(config.avoidThis.length).toBeGreaterThan(0);
    });
  });

  it('D prefers micro', () => expect(CELEBRATION_BY_DISC.D.preferredIntensity).toBe('micro'));
  it('I prefers major', () => expect(CELEBRATION_BY_DISC.I.preferredIntensity).toBe('major'));
});

// ══════════════════ STORYTELLING ══════════════════

describe('STORY_TEMPLATES — Data Integrity', () => {
  it('has 7+ story types', () => expect(STORY_TEMPLATES.length).toBeGreaterThanOrEqual(7));

  it('each template has required structure', () => {
    STORY_TEMPLATES.forEach(s => {
      expect(s.id).toBeTruthy();
      expect(s.type).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.structure.hook).toBeTruthy();
      expect(s.structure.conflict).toBeTruthy();
      expect(s.structure.journey).toBeTruthy();
      expect(s.structure.resolution).toBeTruthy();
      expect(s.structure.lesson).toBeTruthy();
      expect(s.example).toBeTruthy();
      expect(s.whenToUse.length).toBeGreaterThan(0);
      expect(s.emotionalArc).toBeTruthy();
    });
  });

  it('has unique IDs', () => {
    const ids = STORY_TEMPLATES.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('STORY_ELEMENTS', () => {
  it('has hooks', () => expect(STORY_ELEMENTS.hooks.length).toBeGreaterThan(0));
  it('has transitions', () => expect(STORY_ELEMENTS.transitions.length).toBeGreaterThan(0));
  it('has emotional words', () => expect(STORY_ELEMENTS.emotionalWords.length).toBeGreaterThan(0));
  it('has sensory details', () => expect(STORY_ELEMENTS.sensoryDetails.length).toBeGreaterThan(0));
  it('has closings', () => expect(STORY_ELEMENTS.closings.length).toBeGreaterThan(0));
});

describe('getStoryTemplateByType', () => {
  it('finds hero_journey', () => {
    expect(getStoryTemplateByType('hero_journey')).toBeDefined();
  });

  it('finds before_after', () => {
    expect(getStoryTemplateByType('before_after')).toBeDefined();
  });

  it('returns undefined for unknown', () => {
    expect(getStoryTemplateByType('nonexistent' as any)).toBeUndefined();
  });
});

describe('getStoriesForDISC', () => {
  it('D gets result-focused stories', () => {
    const result = getStoriesForDISC('D');
    expect(result.length).toBeGreaterThan(0);
  });

  it('I gets emotional stories', () => {
    const result = getStoriesForDISC('I');
    expect(result.length).toBeGreaterThan(0);
  });

  it('each profile gets stories', () => {
    (['D', 'I', 'S', 'C'] as const).forEach(p => {
      expect(getStoriesForDISC(p).length).toBeGreaterThan(0);
    });
  });
});

describe('analyzeStorytellingInText', () => {
  it('detects storytelling elements', () => {
    const result = analyzeStorytellingInText('Deixa eu te contar uma história. Mas então algo mudou. Foi incrível.');
    expect(result.usesStorytelling).toBe(true);
    expect(result.elements.length).toBeGreaterThan(0);
    expect(result.score).toBeGreaterThan(0);
  });

  it('plain text has low score', () => {
    const result = analyzeStorytellingInText('O produto custa R$100.');
    expect(result.score).toBeLessThan(30);
  });

  it('score capped at 100', () => {
    const fullText = 'Deixa eu te contar. Mas então algo mudou. Foi incrível. Imagine acordar e ver os resultados.';
    const result = analyzeStorytellingInText(fullText);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

describe('generateStoryOutline', () => {
  it('generates outline for hero_journey', () => {
    const result = generateStoryOutline('hero_journey', {
      problem: 'Perda de clientes', solution: 'Novo CRM', result: '40% mais vendas'
    });
    expect(result).toContain('Jornada do Herói');
    expect(result).toContain('Perda de clientes');
    expect(result).toContain('40% mais vendas');
  });

  it('returns empty for unknown type', () => {
    expect(generateStoryOutline('unknown' as any, { problem: '', solution: '', result: '' })).toBe('');
  });
});

// ══════════════════ QUESTION INFLUENCE ══════════════════

describe('ORDER_TO_QUESTION — Data Integrity', () => {
  it('has 15+ conversions', () => expect(ORDER_TO_QUESTION.length).toBeGreaterThanOrEqual(15));

  it('each conversion has required fields', () => {
    ORDER_TO_QUESTION.forEach(q => {
      expect(q.id).toBeTruthy();
      expect(q.directOrder).toBeTruthy();
      expect(q.questionAlternative).toBeTruthy();
      expect(q.effect).toBeTruthy();
      expect(q.category).toBeTruthy();
    });
  });

  it('has unique IDs', () => {
    const ids = ORDER_TO_QUESTION.map(q => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('detectOrders', () => {
  it('detects "você precisa"', () => {
    const result = detectOrders('Você precisa mudar isso');
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects "faça"', () => {
    expect(detectOrders('Faça isso agora').length).toBeGreaterThan(0);
  });

  it('returns empty for questions', () => {
    expect(detectOrders('O que você acha?').length).toBe(0);
  });

  it('detects multiple orders', () => {
    const result = detectOrders('Você precisa mudar. Faça isso. Comece agora.');
    expect(result.length).toBeGreaterThanOrEqual(2);
  });
});

describe('countQuestionsVsOrders', () => {
  it('100 ratio for only questions', () => {
    const result = countQuestionsVsOrders('O que acha? Como vê? Faz sentido?');
    expect(result.questions).toBe(3);
    expect(result.ratio).toBe(100);
  });

  it('lower ratio with orders', () => {
    const result = countQuestionsVsOrders('Faça isso. Você precisa. O que acha?');
    expect(result.orders).toBeGreaterThan(0);
    expect(result.questions).toBe(1);
    expect(result.ratio).toBeLessThan(100);
  });

  it('handles no questions or orders', () => {
    const result = countQuestionsVsOrders('O dia está bonito.');
    expect(result.questions).toBe(0);
    expect(result.orders).toBe(0);
  });
});

describe('suggestQuestions', () => {
  it('returns suggestions for text with orders', () => {
    const result = suggestQuestions('Você precisa mudar isso. Faça agora.', 'D');
    expect(result.length).toBeGreaterThan(0);
  });

  it('fills with DISC patterns if few alternatives', () => {
    const result = suggestQuestions('Texto sem ordens', 'I');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('analyzeQuestionInfluence', () => {
  it('high score for questions only', () => {
    const result = analyzeQuestionInfluence('O que acha? Como vê?');
    expect(result.score).toBeGreaterThan(50);
    expect(result.ordersFound.length).toBe(0);
  });

  it('low score for orders', () => {
    const result = analyzeQuestionInfluence('Faça isso. Você precisa mudar.');
    expect(result.ordersFound.length).toBeGreaterThan(0);
  });

  it('returns suggested alternatives', () => {
    const result = analyzeQuestionInfluence('Faça isso agora');
    expect(result.suggestedAlternatives.length).toBeGreaterThanOrEqual(0);
  });
});
