import { useState, useCallback, useMemo } from 'react';
import { 
  CognitiveBiasType, 
  BiasCategory,
  DetectedBias, 
  BiasAnalysisResult 
} from '@/types/cognitive-biases';
import { 
  COGNITIVE_BIAS_INFO, 
  BIAS_CATEGORY_INFO
} from '@/data/cognitiveBiasesData';
import { Contact } from '@/types';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
  createdAt?: string;
}

export function useCognitiveBiases(contact: Contact, interactions: Interaction[]) {
  const [analyzing] = useState(false);

  // Detect biases in text
  const detectBiases = useCallback((
    text: string,
    interactionId: string,
    timestamp: string
  ): DetectedBias[] => {
    const lowerText = text.toLowerCase();
    const detectedBiases: DetectedBias[] = [];
    const biasTypes = Object.keys(COGNITIVE_BIAS_INFO) as CognitiveBiasType[];

    biasTypes.forEach(biasType => {
      const biasInfo = COGNITIVE_BIAS_INFO[biasType];
      
      biasInfo.indicators.forEach(indicator => {
        if (lowerText.includes(indicator.toLowerCase())) {
          // Find surrounding context (sentence)
          const sentences = text.split(/[.!?]+/);
          // eslint-disable-next-line sonarjs/no-nested-functions
          const sentence = sentences.find(s => 
            s.toLowerCase().includes(indicator.toLowerCase())
          ) || '';

          // Determine polarity based on bias type and context
          let polarity: 'exploitable' | 'obstacle' | 'neutral' = 'neutral';
          
          // Decision-making biases can be obstacles or exploitable
          if (biasInfo.category === 'decision_making') {
            polarity = ['status_quo', 'choice_overload', 'sunk_cost'].includes(biasType) 
              ? 'obstacle' 
              : 'exploitable';
          } else if (biasInfo.category === 'social') {
            polarity = 'exploitable';
          } else if (biasInfo.category === 'memory') {
            polarity = 'exploitable';
          } else if (biasInfo.category === 'probability') {
            polarity = biasType === 'pessimism_bias' ? 'obstacle' : 'neutral';
          } else if (biasInfo.category === 'self_perception') {
            polarity = ['overconfidence', 'dunning_kruger'].includes(biasType) 
              ? 'obstacle' 
              : 'neutral';
          }

          // Check if already detected (avoid duplicates per interaction)
          const exists = detectedBiases.some(
            // eslint-disable-next-line sonarjs/no-nested-functions
            b => b.type === biasType && b.interactionId === interactionId
          );

          if (!exists) {
            detectedBiases.push({
              id: `${interactionId}-${biasType}-${Date.now()}`,
              type: biasType,
              category: biasInfo.category,
              indicator,
              context: sentence.trim().slice(0, 150),
              // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness
              confidence: 60 + Math.random() * 30, // 60-90%
              polarity,
              detectedAt: timestamp,
              interactionId
            });
          }
        }
      });
    });

    return detectedBiases;
  }, []);

  // Main analysis
  const analysisResult = useMemo((): BiasAnalysisResult => {
    const allDetectedBiases: DetectedBias[] = [];

    // Analyze all interactions
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const timestamp = interaction.createdAt || new Date().toISOString();
      const biases = detectBiases(text, interaction.id, timestamp);
      allDetectedBiases.push(...biases);
    });

    // Calculate frequency per bias type
    const biasFrequency = {} as Record<CognitiveBiasType, number>;
    (Object.keys(COGNITIVE_BIAS_INFO) as CognitiveBiasType[]).forEach(type => {
      biasFrequency[type] = allDetectedBiases.filter(b => b.type === type).length;
    });

    // Calculate category distribution
    const categoryDistribution = {} as Record<BiasCategory, number>;
    (Object.keys(BIAS_CATEGORY_INFO) as BiasCategory[]).forEach(cat => {
      categoryDistribution[cat] = allDetectedBiases.filter(b => b.category === cat).length;
    });

    // Find dominant biases (top 5 by frequency)
    const dominantBiases = Object.entries(biasFrequency)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, _]) => type as CognitiveBiasType);

    // Identify vulnerabilities (exploitable biases)
    const vulnerabilities = allDetectedBiases
      .filter(b => b.polarity === 'exploitable')
      .reduce((acc, bias) => {
        const existing = acc.find(v => v.bias === bias.type);
        if (existing) {
          existing.strength = Math.min(100, existing.strength + 10);
        } else {
          acc.push({
            bias: bias.type,
            strength: 50 + (biasFrequency[bias.type] * 10),
            opportunities: [COGNITIVE_BIAS_INFO[bias.type].salesApplication.howToLeverage]
          });
        }
        return acc;
      }, [] as { bias: CognitiveBiasType; strength: number; opportunities: string[] }[])
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);

    // Identify resistances (obstacle biases)
    const resistances = allDetectedBiases
      .filter(b => b.polarity === 'obstacle')
      .reduce((acc, bias) => {
        const existing = acc.find(r => r.bias === bias.type);
        if (existing) {
          existing.strength = Math.min(100, existing.strength + 10);
        } else {
          acc.push({
            bias: bias.type,
            strength: 50 + (biasFrequency[bias.type] * 10),
            challenges: [COGNITIVE_BIAS_INFO[bias.type].salesApplication.howToCounter]
          });
        }
        return acc;
      }, [] as { bias: CognitiveBiasType; strength: number; challenges: string[] }[])
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5);

    // Generate sales strategies
    const leverageStrategies = vulnerabilities
      .slice(0, 3)
      .map(v => COGNITIVE_BIAS_INFO[v.bias].salesApplication.howToLeverage);

    const avoidStrategies = resistances
      .slice(0, 3)
      .map(r => COGNITIVE_BIAS_INFO[r.bias].salesApplication.howToCounter);

    const ethicalApproaches = dominantBiases
      .slice(0, 2)
      .map(b => COGNITIVE_BIAS_INFO[b].salesApplication.ethicalNote);

    // Generate profile summary
    const profileSummary = generateProfileSummary(
      contact, 
      dominantBiases, 
      vulnerabilities, 
      resistances
    );

    return {
      detectedBiases: allDetectedBiases,
      biasProfile: {
        dominantBiases,
        biasFrequency,
        categoryDistribution
      },
      vulnerabilities,
      resistances,
      salesStrategies: {
        leverage: leverageStrategies,
        avoid: avoidStrategies,
        ethical_approach: ethicalApproaches.join(' ')
      },
      profileSummary,
      confidence: Math.min(95, 30 + allDetectedBiases.length * 5),
      lastAnalyzed: new Date().toISOString()
    };
  }, [contact, interactions, detectBiases]);

  return {
    analysisResult,
    analyzing,
    COGNITIVE_BIAS_INFO,
    BIAS_CATEGORY_INFO
  };
}

function generateProfileSummary(
  contact: Contact,
  dominantBiases: CognitiveBiasType[],
  vulnerabilities: { bias: CognitiveBiasType; strength: number }[],
  resistances: { bias: CognitiveBiasType; strength: number }[]
): string {
  if (dominantBiases.length === 0) {
    return `Ainda não há dados suficientes para traçar o perfil de vieses cognitivos de ${contact.firstName}.`;
  }

  const topBias = dominantBiases[0];
  const topBiasInfo = COGNITIVE_BIAS_INFO[topBias];
  
  let summary = `${contact.firstName} demonstra predominantemente ${topBiasInfo.namePt}`;
  
  if (dominantBiases.length > 1) {
    summary += ` combinado com ${COGNITIVE_BIAS_INFO[dominantBiases[1]].namePt}`;
  }
  
  summary += '. ';

  if (vulnerabilities.length > 0) {
    const topVuln = COGNITIVE_BIAS_INFO[vulnerabilities[0].bias];
    summary += `Oportunidade principal: usar ${topVuln.namePt} a favor. `;
  }

  if (resistances.length > 0) {
    const topRes = COGNITIVE_BIAS_INFO[resistances[0].bias];
    summary += `Atenção com: ${topRes.namePt} pode ser obstáculo.`;
  }

  return summary;
}
