import { useMemo } from 'react';
import { DISCProfile } from '@/types';
import type { ApproachRecommendation, UseApproachRecommendationProps, ApproachContext } from './approach/approachTypes';
import {
  getStrategyName, getStrategyDescription, calculateRiskLevel, calculateSuccessRate,
  generatePhases, generateChannels, generateMessages, generateDoAndDont,
  generateObjectionHandling, generateClosingTechniques, generateUrgencyTriggers,
  generateTrustBuilders, generateDecisionAccelerators,
} from './approach/generators';

// Re-export types for consumers
export type {
  ApproachRecommendation, ApproachPhase, CommunicationChannel, PersonalizedMessage,
} from './approach/approachTypes';

export function useApproachRecommendation({
  contact,
  vakProfile,
  metaprogramProfile,
  eqResult,
  biasResult,
  emotionalState,
  topValues = [],
  activeTriggers = [],
  hiddenObjections = [],
  rapportScore = 0,
}: UseApproachRecommendationProps): ApproachRecommendation {
  return useMemo(() => {
    const discProfile = contact.behavior?.discProfile as DISCProfile | undefined;
    const vakType = vakProfile?.primary;

    const confidenceFactors = [
      contact.behavior?.discConfidence || 50,
      vakProfile?.confidence || 50,
      metaprogramProfile?.overallConfidence || 50,
      eqResult?.confidence || 0,
    ].filter(c => c > 0);

    const overallConfidence = confidenceFactors.length > 0
      ? Math.round(confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length)
      : 30;

    const ctx: ApproachContext = {
      discProfile, vakType, firstName: contact.firstName, contact,
      metaprogramProfile, eqResult, biasResult,
      topValues, activeTriggers, hiddenObjections, rapportScore, overallConfidence,
      calculateRiskLevel: () => calculateRiskLevel(ctx),
    };

    const keyMetrics = [
      { name: 'Confiança do Perfil', value: `${overallConfidence}%`, impact: overallConfidence > 70 ? 'Alta precisão' : overallConfidence > 50 ? 'Precisão moderada' : 'Dados limitados' },
      { name: 'Score de Rapport', value: `${rapportScore}%`, impact: rapportScore > 70 ? 'Conexão forte' : rapportScore > 40 ? 'Em desenvolvimento' : 'Precisa atenção' },
      { name: 'Objeções Ocultas', value: `${hiddenObjections.length}`, impact: hiddenObjections.length > 2 ? 'Alto risco' : hiddenObjections.length > 0 ? 'Atenção necessária' : 'Caminho livre' },
      { name: 'Gatilhos Ativos', value: `${activeTriggers.length}`, impact: activeTriggers.length > 2 ? 'Múltiplas oportunidades' : activeTriggers.length > 0 ? 'Opções disponíveis' : 'Descoberta necessária' },
    ];

    return {
      overallStrategy: {
        name: getStrategyName(ctx),
        description: getStrategyDescription(ctx),
        confidence: overallConfidence,
        riskLevel: calculateRiskLevel(ctx),
        estimatedSuccessRate: calculateSuccessRate(ctx),
      },
      phases: generatePhases(ctx),
      channels: generateChannels(ctx),
      personalizedMessages: generateMessages(ctx),
      doAndDont: generateDoAndDont(ctx),
      objectionHandling: generateObjectionHandling(ctx),
      closingTechniques: generateClosingTechniques(ctx),
      urgencyTriggers: generateUrgencyTriggers(ctx),
      trustBuilders: generateTrustBuilders(ctx),
      decisionAccelerators: generateDecisionAccelerators(ctx),
      keyMetrics,
    };
  }, [contact, vakProfile, metaprogramProfile, eqResult, biasResult, topValues, activeTriggers, hiddenObjections, rapportScore]);
}
