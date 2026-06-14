import { useState, useCallback, useMemo } from 'react';
import { ObjectionAnalysis, HiddenObjection, ObjectionType } from '@/types/nlp-advanced';
import { OBJECTION_PATTERNS } from '@/data/nlpAdvancedData';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
}

export function useHiddenObjections(interactions: Interaction[]) {
  const [analyzing] = useState(false);

  const detectObjections = useCallback((text: string): {
    type: ObjectionType;
    indicator: string;
    probability: number;
  }[] => {
    const lowerText = text.toLowerCase();
    const detected: { type: ObjectionType; indicator: string; probability: number }[] = [];

    (Object.entries(OBJECTION_PATTERNS) as [ObjectionType, typeof OBJECTION_PATTERNS[ObjectionType]][]).forEach(
      ([type, pattern]) => {
        pattern.indicators.forEach(indicator => {
          if (lowerText.includes(indicator.toLowerCase())) {
            detected.push({
              type,
              indicator,
              // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
              probability: 60 + Math.random() * 30 // 60-90%
            });
          }
        });
      }
    );

    return detected;
  }, []);

  const objectionAnalysis = useMemo((): ObjectionAnalysis => {
    const allDetected: { type: ObjectionType; indicator: string; probability: number }[] = [];
    const hesitationIndicators: string[] = [];
    const patterns: { pattern: string; meaning: string; frequency: number }[] = [];

    // Hesitation phrases
    const hesitationPhrases = [
      'vou pensar', 'preciso analisar', 'não sei', 'talvez', 'quem sabe',
      'vamos ver', 'deixa eu ver', 'tenho que', 'não tenho certeza'
    ];

    // Analyze all interactions
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const lowerText = text.toLowerCase();

      // Detect objections
      const detected = detectObjections(text);
      allDetected.push(...detected);

      // Detect hesitation
      hesitationPhrases.forEach(phrase => {
        if (lowerText.includes(phrase)) {
          hesitationIndicators.push(phrase);
        }
      });
    });

    // Aggregate and dedupe objections
    const objectionMap = new Map<ObjectionType, HiddenObjection>();

    allDetected.forEach(({ type, indicator, probability }) => {
      if (!objectionMap.has(type)) {
        const pattern = OBJECTION_PATTERNS[type];
        objectionMap.set(type, {
          id: `objection-${type}`,
          type,
          indicator,
          probability: Math.round(probability),
          severity: probability > 80 ? 'high' : probability > 60 ? 'medium' : 'low',
          possibleRealObjection: `Possível objeção de ${pattern.name.toLowerCase()} não verbalizada`,
          suggestedProbe: pattern.probeQuestions[0],
          resolutionTemplates: pattern.resolutionStrategies
        });
      } else {
        // Increase probability if detected multiple times
        const existing = objectionMap.get(type)!;
        existing.probability = Math.min(95, existing.probability + 10);
        existing.severity = existing.probability > 80 ? 'high' : existing.probability > 60 ? 'medium' : 'low';
      }
    });

    const detectedObjections = Array.from(objectionMap.values())
      .sort((a, b) => b.probability - a.probability);

    // Calculate linguistic patterns
    const patternCounts = new Map<string, number>();
    allDetected.forEach(({ indicator }) => {
      patternCounts.set(indicator, (patternCounts.get(indicator) || 0) + 1);
    });

    patternCounts.forEach((frequency, pattern) => {
      patterns.push({
        pattern,
        meaning: 'Indicador de possível objeção',
        frequency
      });
    });

    // Calculate resistance level
    const resistanceLevel = Math.min(100, 
      detectedObjections.length * 15 + 
      hesitationIndicators.length * 10
    );

    // Generate recommended approach
    let recommendedApproach = 'Cliente parece aberto. Continue construindo valor.';
    if (resistanceLevel > 60) {
      const mainObjection = detectedObjections[0];
      if (mainObjection) {
        recommendedApproach = `Foque em resolver objeção de ${OBJECTION_PATTERNS[mainObjection.type].name}. Use: "${OBJECTION_PATTERNS[mainObjection.type].probeQuestions[0]}"`;
      }
    } else if (resistanceLevel > 30) {
      recommendedApproach = 'Há sinais de hesitação. Faça perguntas abertas para descobrir a real preocupação.';
    }

    return {
      detectedObjections,
      linguisticPatterns: patterns.slice(0, 5),
      hesitationIndicators: [...new Set(hesitationIndicators)].slice(0, 5),
      resistanceLevel,
      recommendedApproach
    };
  }, [interactions, detectObjections]);

  return {
    objectionAnalysis,
    analyzing,
    OBJECTION_PATTERNS
  };
}
