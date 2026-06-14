import { useState, useCallback } from 'react';
import { EmotionalAnalysis, EmotionalState, EmotionalAnchor } from '@/types/nlp-advanced';
import { EMOTIONAL_STATE_KEYWORDS, EMOTIONAL_STATE_INFO } from '@/data/nlpAdvancedData';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
  createdAt?: string;
}

export function useEmotionalStates() {
  const [analyzing] = useState(false);

  const detectEmotionalState = useCallback((text: string): { 
    state: EmotionalState; 
    confidence: number;
    matchedWords: string[];
  } => {
    const lowerText = text.toLowerCase();
    const stateScores = (Object.keys(EMOTIONAL_STATE_KEYWORDS) as EmotionalState[]).reduce(
      (acc, state) => {
        acc[state] = { score: 0, words: [] };
        return acc;
      },
      {} as Record<EmotionalState, { score: number; words: string[] }>
    );

    // Count keyword matches for each state
    (Object.entries(EMOTIONAL_STATE_KEYWORDS) as [EmotionalState, string[]][]).forEach(([state, keywords]) => {
      keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
          stateScores[state].score += 1;
          stateScores[state].words.push(keyword);
        }
      });
    });

    // Find the dominant state
    let maxScore = 0;
    let dominantState: EmotionalState = 'neutral';
    let matchedWords: string[] = [];

    (Object.entries(stateScores) as [EmotionalState, { score: number; words: string[] }][]).forEach(([state, data]) => {
      if (data.score > maxScore) {
        maxScore = data.score;
        dominantState = state;
        matchedWords = data.words;
      }
    });

    const confidence = Math.min(100, maxScore * 25);

    return { state: dominantState, confidence, matchedWords };
  }, []);

  const extractAnchors = useCallback((interactions: Interaction[]): {
    positive: EmotionalAnchor[];
    negative: EmotionalAnchor[];
  } => {
    const positive: EmotionalAnchor[] = [];
    const negative: EmotionalAnchor[] = [];

    const positiveStates: EmotionalState[] = ['excited', 'interested', 'curious', 'hopeful', 'confident'];
    const negativeStates: EmotionalState[] = ['hesitant', 'skeptical', 'frustrated', 'anxious', 'resistant'];

    interactions.forEach((interaction, idx) => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);

      sentences.forEach(sentence => {
        const { state, confidence, matchedWords } = detectEmotionalState(sentence);
        
        if (confidence >= 50) {
          const anchor: EmotionalAnchor = {
            id: `anchor-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            type: positiveStates.includes(state) ? 'positive' : negativeStates.includes(state) ? 'negative' : 'positive',
            trigger: matchedWords[0] || sentence.substring(0, 50),
            state,
            context: sentence.trim().substring(0, 100),
            detectedAt: interaction.createdAt || new Date().toISOString(),
            strength: Math.round(confidence / 10)
          };

          if (positiveStates.includes(state)) {
            positive.push(anchor);
          } else if (negativeStates.includes(state)) {
            negative.push(anchor);
          }
        }
      });
    });

    return { positive, negative };
  }, [detectEmotionalState]);

  const analyzeEmotionalHistory = useCallback((interactions: Interaction[]): EmotionalAnalysis => {
    const stateHistory: { state: EmotionalState; timestamp: string; trigger?: string }[] = [];
    
    // Analyze each interaction chronologically
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const { state, matchedWords } = detectEmotionalState(text);
      stateHistory.push({
        state,
        timestamp: interaction.createdAt || new Date().toISOString(),
        trigger: matchedWords[0]
      });
    });

    // Get current state from most recent interaction
    const currentState = stateHistory.length > 0 
      ? stateHistory[stateHistory.length - 1].state 
      : 'neutral';

    // Extract anchors
    const { positive, negative } = extractAnchors(interactions);

    // Determine emotional trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (stateHistory.length >= 3) {
      const recentStates = stateHistory.slice(-3);
      const positiveStates: EmotionalState[] = ['excited', 'interested', 'curious', 'hopeful', 'confident'];
      const negativeStates: EmotionalState[] = ['hesitant', 'skeptical', 'frustrated', 'anxious', 'resistant'];
      
      const scores = recentStates.map(s => {
        if (positiveStates.includes(s.state)) return 1;
        if (negativeStates.includes(s.state)) return -1;
        return 0;
      });

      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (avgScore > 0.3) trend = 'improving';
      else if (avgScore < -0.3) trend = 'declining';
    }

    // Determine best moment to close
    const positiveStates: EmotionalState[] = ['excited', 'confident', 'interested'];
    const bestMomentToClose = {
      recommended: positiveStates.includes(currentState),
      reason: positiveStates.includes(currentState) 
        ? `Cliente está em estado ${EMOTIONAL_STATE_INFO[currentState].name}! Momento ideal para avançar.`
        : `Cliente está ${EMOTIONAL_STATE_INFO[currentState].name}. Trabalhe as objeções primeiro.`,
      optimalTiming: positiveStates.includes(currentState) ? 'Agora' : 'Após construir mais confiança'
    };

    return {
      currentState,
      stateHistory,
      positiveAnchors: positive.slice(0, 5),
      negativeAnchors: negative.slice(0, 5),
      bestMomentToClose,
      emotionalTrend: trend
    };
  }, [detectEmotionalState, extractAnchors]);

  return {
    analyzing,
    detectEmotionalState,
    extractAnchors,
    analyzeEmotionalHistory,
    EMOTIONAL_STATE_INFO
  };
}
