import { useState, useCallback, useMemo } from 'react';
import { 
  EQPillar, 
  EQIndicator, 
  EQPillarScore, 
  EQAnalysisResult 
} from '@/types/emotional-intelligence';
import { 
  EQ_KEYWORDS, 
  EQ_PILLAR_INFO, 
  EQ_SALES_STRATEGIES,
  getEQLevel,
  generatePillarInsights
} from '@/data/emotionalIntelligenceData';
import { Contact } from '@/types';

interface Interaction {
  id: string;
  content?: string;
  transcription?: string;
  createdAt?: string;
}

export function useEmotionalIntelligence(contact: Contact, interactions: Interaction[]) {
  const [analyzing] = useState(false);

  // Detect indicators in text for a specific pillar
  const detectPillarIndicators = useCallback((
    text: string, 
    pillar: EQPillar,
    interactionId: string,
    timestamp: string
  ): EQIndicator[] => {
    const lowerText = text.toLowerCase();
    const indicators: EQIndicator[] = [];
    const keywords = EQ_KEYWORDS[pillar];

    // Check positive indicators
    keywords.positive.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        // Find the sentence containing the keyword
        const sentences = text.split(/[.!?]+/);
        const sentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase())) || '';
        
        indicators.push({
          id: `${interactionId}-${pillar}-pos-${keyword.slice(0, 10)}`,
          pillar,
          indicator: keyword,
          detectedPhrase: sentence.trim().slice(0, 100),
          context: 'Indicador positivo detectado',
          polarity: 'positive',
          strength: 7 + Math.random() * 3, // 7-10
          timestamp
        });
      }
    });

    // Check negative indicators
    keywords.negative.forEach(keyword => {
      if (lowerText.includes(keyword.toLowerCase())) {
        const sentences = text.split(/[.!?]+/);
        const sentence = sentences.find(s => s.toLowerCase().includes(keyword.toLowerCase())) || '';
        
        indicators.push({
          id: `${interactionId}-${pillar}-neg-${keyword.slice(0, 10)}`,
          pillar,
          indicator: keyword,
          detectedPhrase: sentence.trim().slice(0, 100),
          context: 'Indicador negativo detectado',
          polarity: 'negative',
          strength: 3 + Math.random() * 4, // 3-7
          timestamp
        });
      }
    });

    return indicators;
  }, []);

  // Calculate score for a specific pillar based on indicators
  const calculatePillarScore = useCallback((indicators: EQIndicator[], pillar: EQPillar): EQPillarScore => {
    const pillarIndicators = indicators.filter(i => i.pillar === pillar);
    const positiveCount = pillarIndicators.filter(i => i.polarity === 'positive').length;
    const negativeCount = pillarIndicators.filter(i => i.polarity === 'negative').length;
    
    // Base score starts at 50 (neutral)
    let score = 50;
    
    if (pillarIndicators.length > 0) {
      const totalPositiveStrength = pillarIndicators
        .filter(i => i.polarity === 'positive')
        .reduce((sum, i) => sum + i.strength, 0);
      
      const totalNegativeStrength = pillarIndicators
        .filter(i => i.polarity === 'negative')
        .reduce((sum, i) => sum + i.strength, 0);
      
      // Calculate weighted score
      const netStrength = totalPositiveStrength - totalNegativeStrength;
      const maxPossibleStrength = pillarIndicators.length * 10;
      
      // Adjust score based on net strength (range: 0-100)
      score = Math.max(0, Math.min(100, 50 + (netStrength / maxPossibleStrength) * 50));
    }

    const level = getEQLevel(score);
    const insights = generatePillarInsights(pillar, score);

    // Determine trend based on recent indicators
    const recentIndicators = pillarIndicators.slice(-5);
    const recentPositive = recentIndicators.filter(i => i.polarity === 'positive').length;
    const recentNegative = recentIndicators.filter(i => i.polarity === 'negative').length;
    
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (recentPositive > recentNegative + 1) trend = 'improving';
    else if (recentNegative > recentPositive + 1) trend = 'declining';

    return {
      pillar,
      score: Math.round(score),
      level,
      positiveIndicators: positiveCount,
      negativeIndicators: negativeCount,
      trend,
      insights,
      recommendations: EQ_PILLAR_INFO[pillar].developmentTips
    };
  }, []);

  // Main analysis result
  const analysisResult = useMemo((): EQAnalysisResult => {
    const pillars: EQPillar[] = ['self_awareness', 'self_regulation', 'motivation', 'empathy', 'social_skills'];
    const allIndicators: EQIndicator[] = [];

    // Analyze all interactions
    interactions.forEach(interaction => {
      const text = interaction.content || interaction.transcription || '';
      if (!text) return;

      const timestamp = interaction.createdAt || new Date().toISOString();

      pillars.forEach(pillar => {
        const indicators = detectPillarIndicators(text, pillar, interaction.id, timestamp);
        allIndicators.push(...indicators);
      });
    });

    // Calculate scores for each pillar
    const pillarScores = {} as Record<EQPillar, EQPillarScore>;
    pillars.forEach(pillar => {
      pillarScores[pillar] = calculatePillarScore(allIndicators, pillar);
    });

    // Calculate overall score (weighted average)
    const weights: Record<EQPillar, number> = {
      self_awareness: 0.20,
      self_regulation: 0.20,
      motivation: 0.20,
      empathy: 0.20,
      social_skills: 0.20
    };

    const overallScore = Math.round(
      Object.entries(pillarScores).reduce((sum, [pillar, score]) => {
        return sum + (score.score * weights[pillar as EQPillar]);
      }, 0)
    );

    // Identify strengths and areas for growth
    const sortedPillars = [...pillars].sort((a, b) => pillarScores[b].score - pillarScores[a].score);
    const strengths = sortedPillars.slice(0, 2).filter(p => pillarScores[p].score >= 60);
    const areasForGrowth = sortedPillars.slice(-2).filter(p => pillarScores[p].score < 50);

    // Generate communication style recommendations
    const highestPillar = sortedPillars[0];
    const lowestPillar = sortedPillars[sortedPillars.length - 1];
    
    const communicationStyle = {
      preferredApproach: EQ_SALES_STRATEGIES[highestPillar].highStrategy,
      avoidApproach: EQ_SALES_STRATEGIES[lowestPillar].lowStrategy.replace('Evite pressão. ', ''),
      tips: [
        EQ_PILLAR_INFO[highestPillar].developmentTips[0],
        `Aproveite a ${EQ_PILLAR_INFO[highestPillar].namePt} como ponto de conexão`,
        `Tenha paciência com questões de ${EQ_PILLAR_INFO[lowestPillar].namePt}`
      ]
    };

    // Generate sales implications
    const salesImplications = {
      decisionMakingStyle: getDecisionMakingStyle(pillarScores),
      persuasionApproach: getPersuasionApproach(pillarScores),
      objectionHandling: getObjectionHandling(pillarScores),
      closingStrategy: getClosingStrategy(pillarScores)
    };

    // Generate profile summary
    const profileSummary = generateProfileSummary(contact, pillarScores, overallScore);

    return {
      overallScore,
      overallLevel: getEQLevel(overallScore),
      pillarScores,
      indicators: allIndicators,
      strengths,
      areasForGrowth,
      communicationStyle,
      salesImplications,
      profileSummary,
      lastAnalyzed: new Date().toISOString(),
      confidence: Math.min(100, allIndicators.length * 5 + 30) // More indicators = higher confidence
    };
  }, [contact, interactions, detectPillarIndicators, calculatePillarScore]);

  return {
    analysisResult,
    analyzing,
    EQ_PILLAR_INFO,
    EQ_SALES_STRATEGIES
  };
}

// Helper functions
function getDecisionMakingStyle(scores: Record<EQPillar, EQPillarScore>): string {
  if (scores.self_awareness.score > 70 && scores.self_regulation.score > 70) {
    return 'Analítico e reflexivo - toma decisões ponderadas após análise cuidadosa';
  }
  if (scores.motivation.score > 70) {
    return 'Orientado a objetivos - decide rapidamente quando vê alinhamento com metas';
  }
  if (scores.empathy.score > 70) {
    return 'Consultivo - considera impacto nos outros antes de decidir';
  }
  if (scores.social_skills.score > 70) {
    return 'Colaborativo - prefere decisões em grupo ou com input de outros';
  }
  return 'Pragmático - decide com base em benefícios tangíveis e imediatos';
}

function getPersuasionApproach(scores: Record<EQPillar, EQPillarScore>): string {
  const highest = Object.entries(scores).sort((a, b) => b[1].score - a[1].score)[0];
  
  switch (highest[0] as EQPillar) {
    case 'self_awareness':
      return 'Use perguntas reflexivas que conectem a solução com valores pessoais';
    case 'self_regulation':
      return 'Apresente informações de forma calma e estruturada, sem pressão';
    case 'motivation':
      return 'Conecte benefícios a metas e mostre como acelera o progresso';
    case 'empathy':
      return 'Compartilhe histórias e mostre impacto humano da solução';
    case 'social_skills':
      return 'Envolva em diálogo colaborativo e co-criação da solução';
    default:
      return 'Adapte-se ao contexto e observe reações';
  }
}

function getObjectionHandling(scores: Record<EQPillar, EQPillarScore>): string {
  if (scores.empathy.score > 65) {
    return 'Valide emoções primeiro, depois aborde a objeção com compreensão';
  }
  if (scores.self_regulation.score > 65) {
    return 'Dê espaço para processar e retome a conversa depois';
  }
  if (scores.motivation.score > 65) {
    return 'Reframe a objeção como obstáculo temporário no caminho do objetivo';
  }
  return 'Aborde com fatos e benefícios concretos';
}

function getClosingStrategy(scores: Record<EQPillar, EQPillarScore>): string {
  if (scores.motivation.score > 70) {
    return 'Fechamento orientado a ação: "Quando começamos?"';
  }
  if (scores.social_skills.score > 70) {
    return 'Fechamento colaborativo: "Vamos definir juntos os próximos passos?"';
  }
  if (scores.empathy.score > 70) {
    return 'Fechamento relacional: "Como posso ajudar você a avançar?"';
  }
  if (scores.self_regulation.score > 70) {
    return 'Fechamento suave: "Quando você se sentir confortável, estou aqui"';
  }
  return 'Fechamento direto com opções claras';
}

function generateProfileSummary(
  contact: Contact, 
  scores: Record<EQPillar, EQPillarScore>,
  overallScore: number
): string {
  const level = getEQLevel(overallScore);
  const sortedPillars = Object.entries(scores)
    .sort((a, b) => b[1].score - a[1].score);
  
  const strongest = sortedPillars[0];
  const weakest = sortedPillars[sortedPillars.length - 1];

  const levelDescriptions = {
    low: 'demonstra oportunidades significativas de desenvolvimento em inteligência emocional',
    developing: 'está em processo de desenvolvimento de sua inteligência emocional',
    moderate: 'apresenta inteligência emocional adequada para maioria das situações',
    high: 'demonstra forte inteligência emocional',
    exceptional: 'possui inteligência emocional excepcional'
  };

  return `${contact.firstName} ${levelDescriptions[level]}. ` +
    `Destaca-se em ${EQ_PILLAR_INFO[strongest[0] as EQPillar].namePt} (${strongest[1].score}%) ` +
    `e pode desenvolver mais ${EQ_PILLAR_INFO[weakest[0] as EQPillar].namePt} (${weakest[1].score}%). ` +
    `Abordagem recomendada: ${EQ_SALES_STRATEGIES[strongest[0] as EQPillar].highStrategy}`;
}
