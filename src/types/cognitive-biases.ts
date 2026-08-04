// Cognitive Biases Types for Sales Intelligence

// ============================================
// BIAS CATEGORIES
// ============================================
export type BiasCategory = 
  | 'decision_making'    // Vieses de tomada de decisão
  | 'social'             // Vieses sociais
  | 'memory'             // Vieses de memória
  | 'probability'        // Vieses de probabilidade
  | 'self_perception';   // Vieses de autopercepção

// ============================================
// COGNITIVE BIAS TYPES
// ============================================
export type CognitiveBiasType =
  // Decision Making Biases
  | 'anchoring'              // Ancoragem
  | 'loss_aversion'          // Aversão à perda
  | 'sunk_cost'              // Custo afundado
  | 'status_quo'             // Status quo
  | 'choice_overload'        // Sobrecarga de escolhas
  | 'framing_effect'         // Efeito de enquadramento
  
  // Social Biases
  | 'halo_effect'            // Efeito halo
  | 'authority_bias'         // Viés de autoridade
  | 'bandwagon_effect'       // Efeito manada
  | 'in_group_bias'          // Viés de grupo
  | 'liking_bias'            // Viés de afinidade
  
  // Memory Biases
  | 'recency_bias'           // Viés de recência
  | 'primacy_effect'         // Efeito de primazia
  | 'availability_heuristic' // Heurística de disponibilidade
  | 'peak_end_rule'          // Regra do pico-fim
  
  // Probability Biases
  | 'optimism_bias'          // Viés de otimismo
  | 'pessimism_bias'         // Viés de pessimismo
  | 'gambler_fallacy'        // Falácia do jogador
  | 'base_rate_neglect'      // Negligência da taxa base
  
  // Self-Perception Biases
  | 'confirmation_bias'      // Viés de confirmação
  | 'dunning_kruger'         // Efeito Dunning-Kruger
  | 'overconfidence'         // Excesso de confiança
  | 'self_serving'           // Viés autosservidor
  | 'hindsight_bias';        // Viés retrospectivo

// ============================================
// DETECTED BIAS
// ============================================
export interface DetectedBias {
  id: string;
  type: CognitiveBiasType;
  category: BiasCategory;
  indicator: string;           // Phrase that triggered detection
  context: string;             // Surrounding context
  confidence: number;          // 0-100
  polarity: 'exploitable' | 'obstacle' | 'neutral';
  detectedAt: string;
  interactionId?: string;
}

// ============================================
// BIAS INFO FOR DISPLAY
// ============================================
export interface CognitiveBiasInfo {
  name: string;
  namePt: string;
  category: BiasCategory;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  descriptionPt: string;
  example: string;
  salesApplication: {
    howToLeverage: string;
    howToCounter: string;
    ethicalNote: string;
  };
  indicators: string[];
}

// ============================================
// ANALYSIS RESULT
// ============================================
export interface BiasAnalysisResult {
  detectedBiases: DetectedBias[];
  biasProfile: {
    dominantBiases: CognitiveBiasType[];
    biasFrequency: Record<CognitiveBiasType, number>;
    categoryDistribution: Record<BiasCategory, number>;
  };
  vulnerabilities: {
    bias: CognitiveBiasType;
    strength: number;
    opportunities: string[];
  }[];
  resistances: {
    bias: CognitiveBiasType;
    strength: number;
    challenges: string[];
  }[];
  salesStrategies: {
    leverage: string[];
    avoid: string[];
    ethical_approach: string;
  };
  profileSummary: string;
  confidence: number;
  lastAnalyzed: string;
}

// ============================================
// CATEGORY INFO
// ============================================
export interface BiasCategoryInfo {
  name: string;
  namePt: string;
  icon: string;
  description: string;
  color: string;
}
