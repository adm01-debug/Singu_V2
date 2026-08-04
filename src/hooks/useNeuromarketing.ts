// ==============================================
// NEUROMARKETING HOOK - Enterprise Neuroscience Analysis
// Analyzes contacts and interactions through neuroscience lens
// ==============================================

import { useCallback } from 'react';
import { 
  BrainSystem, 
  PrimalStimulus, 
  Neurochemical,
  NeuroDecisionProfile,
  NeuroAnalysisResult,
  PainPoint,
  NeuroCompatibility
} from '@/types/neuromarketing';
import {
  BRAIN_SYSTEM_INFO,
  PRIMAL_STIMULUS_INFO,
  NEUROCHEMICAL_INFO,
  TRIGGER_BRAIN_MAPPING,
  BIAS_BRAIN_MAPPING,
  DISC_BRAIN_CORRELATION,
  PAIN_KEYWORDS
} from '@/data/neuromarketingData';

type DISCProfile = 'D' | 'I' | 'S' | 'C';

// ============================================
// BRAIN SYSTEM DETECTION KEYWORDS
// ============================================
const BRAIN_SYSTEM_KEYWORDS: Record<BrainSystem, string[]> = {
  reptilian: [
    'medo', 'perder', 'urgente', 'agora', 'risco', 'ameaça', 'sobreviver',
    'segurança', 'proteger', 'garantia', 'imediato', 'preciso', 'necessário',
    'não posso esperar', 'já', 'antes que', 'concorrência', 'ficar para trás'
  ],
  limbic: [
    'sinto', 'emoção', 'confiança', 'relacionamento', 'parceiro', 'juntos',
    'equipe', 'família', 'história', 'experiência', 'memória', 'lembro',
    'conexão', 'pertencer', 'comunidade', 'valores', 'acredito', 'sonho'
  ],
  neocortex: [
    'análise', 'dados', 'estatística', 'comparar', 'lógica', 'razão',
    'planejamento', 'estratégia', 'metodologia', 'processo', 'sistema',
    'evidência', 'pesquisa', 'estudo', 'calcular', 'ROI', 'métricas'
  ]
};

// ============================================
// STIMULUS DETECTION PATTERNS
// ============================================
const STIMULUS_PATTERNS: Record<PrimalStimulus, RegExp[]> = {
  self_centered: [
    /\b(eu|meu|minha|meus|minhas|pra mim|para mim)\b/gi,
    /\b(minha empresa|meu negócio|meu time|minha equipe)\b/gi
  ],
  contrast: [
    /\b(antes|depois|com|sem|versus|vs|diferente|comparado)\b/gi,
    /\b(de .+ para|era .+ agora|antigamente|atualmente)\b/gi
  ],
  tangible: [
    /\b(\d+%|\d+ por cento|R\$\s*\d+|\d+ dias|\d+ meses)\b/gi,
    /\b(exatamente|especificamente|precisamente|concretamente)\b/gi
  ],
  memorable: [
    /\b(primeiro|último|nunca esqueço|marcou|inesquecível)\b/gi,
    /\b(lembro que|o melhor foi|o pior foi|destaque)\b/gi
  ],
  visual: [
    /\b(veja|olhe|observe|visualize|imagine|claro|evidente)\b/gi,
    /\b(mostrar|demonstrar|apresentar|ilustrar|imagem)\b/gi
  ],
  emotional: [
    /\b(sinto|emocionado|frustrado|feliz|triste|ansioso)\b/gi,
    /\b(medo|esperança|orgulho|raiva|alívio|prazer)\b/gi
  ]
};

export function useNeuromarketing() {
  
  // Analyze text for brain system dominance
  const analyzeBrainSystem = useCallback((text: string): Record<BrainSystem, number> => {
    const lowerText = text.toLowerCase();
    const scores: Record<BrainSystem, number> = {
      reptilian: 0,
      limbic: 0,
      neocortex: 0
    };
    
    Object.entries(BRAIN_SYSTEM_KEYWORDS).forEach(([system, keywords]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          scores[system as BrainSystem] += matches.length * 10;
        }
      });
    });
    
    // Normalize scores to 0-100
    const total = Math.max(1, scores.reptilian + scores.limbic + scores.neocortex);
    return {
      reptilian: Math.round((scores.reptilian / total) * 100),
      limbic: Math.round((scores.limbic / total) * 100),
      neocortex: Math.round((scores.neocortex / total) * 100)
    };
  }, []);

  // Analyze text for primal stimuli
  const analyzeStimuliResponse = useCallback((text: string): {
    stimulus: PrimalStimulus;
    score: number;
    indicators: string[];
  }[] => {
    const results: { stimulus: PrimalStimulus; score: number; indicators: string[] }[] = [];
    
    Object.entries(STIMULUS_PATTERNS).forEach(([stimulus, patterns]) => {
      const indicators: string[] = [];
      let score = 0;
      
      patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
          score += matches.length * 15;
          indicators.push(...matches.slice(0, 3));
        }
      });
      
      if (score > 0) {
        results.push({
          stimulus: stimulus as PrimalStimulus,
          score: Math.min(100, score),
          indicators: [...new Set(indicators)]
        });
      }
    });
    
    return results.sort((a, b) => b.score - a.score);
  }, []);

  // Analyze pain points in text
  const detectPainPoints = useCallback((text: string): PainPoint[] => {
    const pains: PainPoint[] = [];
    const lowerText = text.toLowerCase();
    
    // High intensity pains
    PAIN_KEYWORDS.high_intensity.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        const context = extractContext(text, keyword);
        pains.push({
          id: `pain-${keyword}-${Date.now()}`,
          description: context,
          intensity: 9,
          frequency: 'daily',
          emotionalImpact: 'Alto impacto emocional detectado',
          detected: true,
          source: keyword
        });
      }
    });
    
    // Medium intensity pains
    PAIN_KEYWORDS.medium_intensity.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        const context = extractContext(text, keyword);
        pains.push({
          id: `pain-${keyword}-${Date.now()}`,
          description: context,
          intensity: 6,
          frequency: 'weekly',
          emotionalImpact: 'Impacto moderado',
          detected: true,
          source: keyword
        });
      }
    });
    
    return pains.slice(0, 5); // Top 5 pains
  }, []);

  // Extract context around keyword
  const extractContext = (text: string, keyword: string): string => {
    const index = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (index === -1) return keyword;
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + keyword.length + 50);
    return text.slice(start, end).trim();
  };

  // Generate neuro profile from DISC
  const generateNeuroProfileFromDISC = useCallback((
    discProfile: DISCProfile | null
  ): Partial<NeuroDecisionProfile> => {
    if (!discProfile) {
      return {
        dominantBrain: 'limbic',
        brainBalance: { reptilian: 33, limbic: 34, neocortex: 33 },
        responsiveStimuli: ['emotional', 'self_centered'],
        dominantNeurochemical: 'oxytocin',
        decisionSpeed: 'moderate',
        riskTolerance: 'medium',
        primaryMotivation: 'balanced'
      };
    }
    
    const correlation = DISC_BRAIN_CORRELATION[discProfile];
    if (!correlation) {
      return {
        dominantBrain: 'limbic',
        brainBalance: { reptilian: 33, limbic: 34, neocortex: 33 },
        responsiveStimuli: ['emotional', 'self_centered'],
        dominantNeurochemical: 'oxytocin',
        decisionSpeed: 'moderate',
        riskTolerance: 'medium',
        primaryMotivation: 'balanced'
      };
    }
    
    const brainBalance: Record<BrainSystem, number> = {
      reptilian: 20,
      limbic: 20,
      neocortex: 20
    };
    brainBalance[correlation.primaryBrain] = 50;
    brainBalance[correlation.secondaryBrain] = 30;
    
    return {
      dominantBrain: correlation.primaryBrain,
      brainBalance,
      responsiveStimuli: correlation.responsiveStimuli,
      dominantNeurochemical: correlation.dominantNeurochemical,
      decisionSpeed: discProfile === 'D' ? 'impulsive' : discProfile === 'C' ? 'analytical' : 'moderate',
      riskTolerance: discProfile === 'D' || discProfile === 'I' ? 'high' : 'low',
      primaryMotivation: discProfile === 'D' ? 'seek_gain' : 
                         discProfile === 'S' ? 'avoid_pain' : 'balanced'
    };
  }, []);

  // Full neuro analysis of text
  const analyzeText = useCallback((text: string): NeuroAnalysisResult => {
    const brainScores = analyzeBrainSystem(text);
    const stimuliResponse = analyzeStimuliResponse(text);
    const painPoints = detectPainPoints(text);
    
    // Determine dominant brain
    const dominantBrain = (Object.entries(brainScores) as [BrainSystem, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    
    // Infer neurochemicals from detected patterns
    const neurochemicalProfile: { chemical: Neurochemical; intensity: number; indicators: string[] }[] = [];
    
    if (brainScores.reptilian > 40) {
      neurochemicalProfile.push({
        chemical: 'cortisol',
        intensity: Math.round(brainScores.reptilian * 0.8),
        indicators: ['Palavras de urgência/medo detectadas']
      });
    }
    
    if (brainScores.limbic > 40) {
      neurochemicalProfile.push({
        chemical: 'oxytocin',
        intensity: Math.round(brainScores.limbic * 0.8),
        indicators: ['Linguagem emocional/relacional detectada']
      });
    }
    
    if (stimuliResponse.some(s => s.stimulus === 'emotional' && s.score > 30)) {
      neurochemicalProfile.push({
        chemical: 'dopamine',
        intensity: 60,
        indicators: ['Padrões de antecipação/desejo detectados']
      });
    }
    
    // Generate recommendations
    const recommendations: string[] = [];
    
    if (dominantBrain === 'reptilian') {
      recommendations.push('Foque em segurança e garantias');
      recommendations.push('Use contraste claro: Antes vs Depois');
      recommendations.push('Crie urgência genuína');
    } else if (dominantBrain === 'limbic') {
      recommendations.push('Construa rapport e confiança primeiro');
      recommendations.push('Use storytelling e conexão emocional');
      recommendations.push('Mostre pertencimento e valores compartilhados');
    } else {
      recommendations.push('Forneça dados e evidências');
      recommendations.push('Use comparações detalhadas');
      recommendations.push('Permita tempo para análise');
    }
    
    return {
      text,
      detectedBrainSystem: dominantBrain,
      brainSystemScores: brainScores,
      detectedStimuli: stimuliResponse,
      neurochemicalProfile,
      painIndicators: painPoints.map(p => p.source || p.description),
      gainIndicators: [], // Could be expanded
      recommendations,
      confidence: Math.round((Math.max(...Object.values(brainScores)) / 100) * 100)
    };
  }, [analyzeBrainSystem, analyzeStimuliResponse, detectPainPoints]);

  // Calculate neuro compatibility between salesperson and contact
  const calculateNeuroCompatibility = useCallback((
    salespersonDISC: DISCProfile,
    contactNeuroProfile: NeuroDecisionProfile
  ): NeuroCompatibility => {
    const salespersonCorrelation = DISC_BRAIN_CORRELATION[salespersonDISC];
    
    // Brain alignment
    const brainAlignment = salespersonCorrelation?.primaryBrain === contactNeuroProfile.dominantBrain 
      ? 80 : salespersonCorrelation?.secondaryBrain === contactNeuroProfile.dominantBrain 
      ? 60 : 40;
    
    // Stimuli match
    const salespersonStimuli = salespersonCorrelation?.responsiveStimuli || [];
    const contactStimuli = contactNeuroProfile.responsiveStimuli || [];
    const stimuliOverlap = salespersonStimuli.filter(s => contactStimuli.includes(s)).length;
    const stimuliMatch = Math.round((stimuliOverlap / Math.max(1, contactStimuli.length)) * 100);
    
    // Chemical balance
    const chemicalBalance = salespersonCorrelation?.dominantNeurochemical === contactNeuroProfile.dominantNeurochemical
      ? 85 : 50;
    
    // Communication fit
    const communicationFit = Math.round((brainAlignment + stimuliMatch + chemicalBalance) / 3);
    
    const score = Math.round((brainAlignment * 0.3 + stimuliMatch * 0.3 + chemicalBalance * 0.2 + communicationFit * 0.2));
    
    const strengths: string[] = [];
    const challenges: string[] = [];
    const adaptationTips: string[] = [];
    
    if (brainAlignment >= 70) {
      strengths.push('Alinhamento natural de estilo de pensamento');
    } else {
      challenges.push('Estilos de pensamento diferentes');
      adaptationTips.push(`Adapte sua comunicação para o cérebro ${BRAIN_SYSTEM_INFO[contactNeuroProfile.dominantBrain].namePt}`);
    }
    
    if (stimuliMatch >= 60) {
      strengths.push('Respondem aos mesmos estímulos');
    } else {
      challenges.push('Estímulos de resposta diferentes');
      adaptationTips.push(`Use mais estímulos: ${contactStimuli.map(s => PRIMAL_STIMULUS_INFO[s].namePt).join(', ')}`);
    }
    
    return {
      score,
      brainAlignment,
      stimuliMatch,
      chemicalBalance,
      communicationFit,
      strengths,
      challenges,
      adaptationTips
    };
  }, []);

  // Get brain system info
  const getBrainSystemInfo = useCallback((system: BrainSystem) => {
    return BRAIN_SYSTEM_INFO[system];
  }, []);

  // Get stimulus info
  const getStimulusInfo = useCallback((stimulus: PrimalStimulus) => {
    return PRIMAL_STIMULUS_INFO[stimulus];
  }, []);

  // Get neurochemical info
  const getNeurochemicalInfo = useCallback((chemical: Neurochemical) => {
    return NEUROCHEMICAL_INFO[chemical];
  }, []);

  // Get trigger neuro mapping
  const getTriggerNeuroMapping = useCallback((triggerId: string) => {
    return TRIGGER_BRAIN_MAPPING[triggerId] || null;
  }, []);

  // Get bias neuro mapping
  const getBiasNeuroMapping = useCallback((biasId: string) => {
    return BIAS_BRAIN_MAPPING[biasId] || null;
  }, []);

  return {
    // Analysis functions
    analyzeText,
    analyzeBrainSystem,
    analyzeStimuliResponse,
    detectPainPoints,
    generateNeuroProfileFromDISC,
    calculateNeuroCompatibility,
    
    // Info getters
    getBrainSystemInfo,
    getStimulusInfo,
    getNeurochemicalInfo,
    getTriggerNeuroMapping,
    getBiasNeuroMapping,
    
    // Data exports
    BRAIN_SYSTEM_INFO,
    PRIMAL_STIMULUS_INFO,
    NEUROCHEMICAL_INFO,
    TRIGGER_BRAIN_MAPPING,
    BIAS_BRAIN_MAPPING,
    DISC_BRAIN_CORRELATION
  };
}
