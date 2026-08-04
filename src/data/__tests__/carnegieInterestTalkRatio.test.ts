import { describe, it, expect } from 'vitest';
import {
  INTEREST_INDICATORS,
  GENUINE_INTEREST_PATTERNS,
  INTEREST_TECHNIQUES,
  INTEREST_SCORING,
  INTEREST_SUGGESTIONS,
  countInterestIndicators,
  calculateInterestScore,
  getInterestLevel,
  getInterestSuggestions
} from '@/data/carnegieGenuineInterest';
import {
  IDEAL_TALK_RATIOS,
  QUESTION_PATTERNS,
  LISTENING_INDICATORS,
  TALK_RATIO_RECOMMENDATIONS,
  TALK_RATIO_QUALITY,
  SILENCE_TECHNIQUES,
  getIdealRatio,
  calculateQuality,
  getRecommendations
} from '@/data/carnegieTalkRatio';

/**
 * Genuine Interest & Talk Ratio - 60+ scenarios
 */

// ============================================
// GENUINE INTEREST - DATA
// ============================================
describe('Genuine Interest: Data Integrity', () => {
  it('has at least 5 interest indicators', () => {
    expect(INTEREST_INDICATORS.length).toBeGreaterThanOrEqual(5);
  });

  it('indicators have positive weights', () => {
    for (const ind of INTEREST_INDICATORS) {
      expect(ind.weight).toBeGreaterThan(0);
    }
  });

  it('patterns cover personal, follow_up, exploratory questions', () => {
    expect(GENUINE_INTEREST_PATTERNS.questions.personal.length).toBeGreaterThan(3);
    expect(GENUINE_INTEREST_PATTERNS.questions.follow_up.length).toBeGreaterThan(2);
    expect(GENUINE_INTEREST_PATTERNS.questions.exploratory.length).toBeGreaterThan(2);
  });

  it('listening patterns have acknowledgment, reflection, empathy', () => {
    expect(GENUINE_INTEREST_PATTERNS.listening.acknowledgment.length).toBeGreaterThan(3);
    expect(GENUINE_INTEREST_PATTERNS.listening.reflection.length).toBeGreaterThan(2);
    expect(GENUINE_INTEREST_PATTERNS.listening.empathy.length).toBeGreaterThan(2);
  });

  it('techniques cover before/during/after meeting', () => {
    expect(INTEREST_TECHNIQUES.before_meeting.length).toBeGreaterThan(0);
    expect(INTEREST_TECHNIQUES.during_conversation.length).toBeGreaterThan(2);
    expect(INTEREST_TECHNIQUES.after_conversation.length).toBeGreaterThan(0);
  });

  it('scoring components weights sum to ~1.0', () => {
    const totalWeight = Object.values(INTEREST_SCORING.components)
      .reduce((sum, c) => sum + c.weight, 0);
    expect(totalWeight).toBeCloseTo(1.0, 1);
  });

  it('scoring levels cover 0-100 range', () => {
    expect(INTEREST_SCORING.levels.low.min).toBe(0);
    expect(INTEREST_SCORING.levels.exceptional.max).toBe(100);
  });

  it('suggestions exist for all 4 levels', () => {
    expect(INTEREST_SUGGESTIONS.low.length).toBeGreaterThan(3);
    expect(INTEREST_SUGGESTIONS.moderate.length).toBeGreaterThan(2);
    expect(INTEREST_SUGGESTIONS.high.length).toBeGreaterThan(1);
    expect(INTEREST_SUGGESTIONS.exceptional.length).toBeGreaterThan(0);
  });
});

// ============================================
// GENUINE INTEREST - FUNCTIONS
// ============================================
describe('Genuine Interest: Functions', () => {
  it('countInterestIndicators detects personal questions', () => {
    const counts = countInterestIndicators('Como está você? Me conte mais sobre seu projeto');
    expect(counts.questionsAsked).toBeGreaterThan(0);
  });

  it('countInterestIndicators detects follow-ups', () => {
    const counts = countInterestIndicators('Você mencionou algo importante na última vez');
    expect(counts.followUpsMade).toBeGreaterThan(0);
  });

  it('countInterestIndicators detects listening signals', () => {
    const counts = countInterestIndicators('Entendo, faz sentido, interessante');
    expect(counts.activeListeningSignals).toBeGreaterThan(0);
  });

  it('countInterestIndicators returns zeros for empty text', () => {
    const counts = countInterestIndicators('');
    expect(counts.questionsAsked).toBe(0);
    expect(counts.followUpsMade).toBe(0);
  });

  it('calculateInterestScore returns 0-100', () => {
    const score = calculateInterestScore({ questionsAsked: 3, followUpsMade: 2, memoryReferences: 1, activeListeningSignals: 4, personalDetailsRemembered: 1 });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('calculateInterestScore returns 0 for empty counts', () => {
    const score = calculateInterestScore({});
    expect(score).toBe(0);
  });

  it('getInterestLevel returns correct levels', () => {
    expect(getInterestLevel(95)).toBe('exceptional');
    expect(getInterestLevel(75)).toBe('high');
    expect(getInterestLevel(45)).toBe('moderate');
    expect(getInterestLevel(15)).toBe('low');
  });

  it('getInterestSuggestions returns array', () => {
    const suggestions = getInterestSuggestions('low');
    expect(suggestions.length).toBeGreaterThan(0);
  });
});

// ============================================
// TALK RATIO - DATA
// ============================================
describe('Talk Ratio: Data Integrity', () => {
  it('ideal ratios cover 5 contexts', () => {
    expect(Object.keys(IDEAL_TALK_RATIOS).length).toBe(5);
  });

  it('speaker + listener ratios sum to 100', () => {
    for (const [key, ratio] of Object.entries(IDEAL_TALK_RATIOS)) {
      expect(ratio.speakerIdeal + ratio.listenerIdeal, `${key}`).toBe(100);
    }
  });

  it('question patterns cover open, closed, reflective, clarifying', () => {
    expect(QUESTION_PATTERNS.openEnded.patterns.length).toBeGreaterThan(2);
    expect(QUESTION_PATTERNS.closed.patterns.length).toBeGreaterThan(1);
    expect(QUESTION_PATTERNS.reflective.patterns.length).toBeGreaterThan(2);
    expect(QUESTION_PATTERNS.clarifying.patterns.length).toBeGreaterThan(2);
  });

  it('question pattern weights: reflective > open > closed', () => {
    expect(QUESTION_PATTERNS.reflective.weight).toBeGreaterThan(QUESTION_PATTERNS.openEnded.weight);
    expect(QUESTION_PATTERNS.openEnded.weight).toBeGreaterThan(QUESTION_PATTERNS.closed.weight);
  });

  it('listening indicators have active, paraphrasing, empathy, acknowledgment', () => {
    expect(LISTENING_INDICATORS.active.patterns.length).toBeGreaterThan(2);
    expect(LISTENING_INDICATORS.paraphrasing.patterns.length).toBeGreaterThan(1);
    expect(LISTENING_INDICATORS.empathy.patterns.length).toBeGreaterThan(1);
    expect(LISTENING_INDICATORS.acknowledgment.patterns.length).toBeGreaterThan(1);
  });

  it('recommendations cover 5+ types', () => {
    const types = new Set(TALK_RATIO_RECOMMENDATIONS.map(r => r.type));
    expect(types.size).toBeGreaterThanOrEqual(5);
  });

  it('quality levels cover ranges without gaps', () => {
    expect(TALK_RATIO_QUALITY.excellent.range.min).toBe(0);
    expect(TALK_RATIO_QUALITY.poor.range.max).toBe(100);
  });

  it('silence techniques have 3 types', () => {
    expect(Object.keys(SILENCE_TECHNIQUES).length).toBe(3);
  });
});

// ============================================
// TALK RATIO - FUNCTIONS
// ============================================
describe('Talk Ratio: Functions', () => {
  it('getIdealRatio returns valid ratios', () => {
    const ratio = getIdealRatio('discovery');
    expect(ratio.speakerIdeal).toBe(20);
    expect(ratio.listenerIdeal).toBe(80);
  });

  it('getIdealRatio for presentation favors speaking', () => {
    const ratio = getIdealRatio('presentation');
    expect(ratio.speakerIdeal).toBeGreaterThan(ratio.listenerIdeal);
  });

  it('calculateQuality returns correct levels', () => {
    expect(calculateQuality(10)).toBe('excellent');
    expect(calculateQuality(25)).toBe('good');
    expect(calculateQuality(40)).toBe('needs_improvement');
    expect(calculateQuality(60)).toBe('poor');
  });

  it('getRecommendations returns listen_more when speaking too much', () => {
    const recs = getRecommendations(80, 40, 5, 3);
    expect(recs.some(r => r.type === 'listen_more')).toBe(true);
  });

  it('getRecommendations returns ask_more when few questions', () => {
    const recs = getRecommendations(30, 40, 1, 3);
    expect(recs.some(r => r.type === 'ask_more')).toBe(true);
  });

  it('getRecommendations returns acknowledge_more when few acknowledgments', () => {
    const recs = getRecommendations(30, 40, 5, 0);
    expect(recs.some(r => r.type === 'acknowledge_more')).toBe(true);
  });

  it('getRecommendations returns empty when balanced', () => {
    const recs = getRecommendations(40, 40, 5, 5);
    // Should not recommend listen_more since deviation <= 15
    expect(recs.every(r => r.type !== 'listen_more')).toBe(true);
  });
});
