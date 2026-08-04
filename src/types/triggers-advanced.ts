// ==============================================
// ADVANCED TRIGGERS TYPES - Enterprise Mental Trigger System
// Based on NLP, Behavioral Science & Neuroscience Research
// ==============================================

import { TriggerType, TriggerCategory } from './triggers';
import { Neurochemical, BrainSystem } from './neuromarketing';

// ============================================
// 1. ADVANCED TRIGGER TYPES
// ============================================
export type AdvancedTriggerType = 
  // NLP-Based Triggers
  | 'future_pacing'        // Projeção no futuro com solução
  | 'pattern_interrupt'    // Quebra de padrão mental
  | 'nested_loops'         // Histórias aninhadas
  | 'paradox_double_bind'  // Escolha que leva ao mesmo resultado
  // High-Conversion Triggers
  | 'loss_aversion'        // Aversão à perda amplificada
  | 'identity_shift'       // Mudança de identidade
  | 'tribal_belonging'     // Pertencimento tribal
  | 'cognitive_ease'       // Facilidade cognitiva
  // Extended Triggers (Phase 1)
  | 'priming'              // Preparação mental prévia
  | 'anchoring'            // Ancoragem de referência
  | 'decoy_effect'         // Efeito isca/chamariz
  | 'framing'              // Enquadramento de informação
  | 'curiosity_gap'        // Lacuna de curiosidade
  | 'peak_end_rule'        // Regra pico-fim
  | 'endowment_effect'     // Efeito posse
  | 'sunk_cost'            // Custo afundado
  | 'bandwagon'            // Efeito manada
  | 'halo_effect'          // Efeito halo
  | 'contrast_principle'   // Princípio do contraste
  | 'unity';               // Unidade/identidade compartilhada

// Union of all trigger types (base + advanced + extended)
export type AllTriggerTypes = TriggerType | AdvancedTriggerType;

// ============================================
// 2. TRIGGER CHAIN (SEQUENCING)
// ============================================
export interface TriggerChain {
  id: string;
  name: string;
  description: string;
  triggers: AllTriggerTypes[];
  intensity: 'gentle' | 'moderate' | 'aggressive';
  timing: {
    trigger: AllTriggerTypes;
    delayMinutes: number;
    channel?: 'same' | 'different';
  }[];
  bestFor: string[]; // DISC profiles
  scenario: string;
  successRate: number; // 0-100
  neuralPath: {
    brainSequence: BrainSystem[];
    chemicalFlow: Neurochemical[];
  };
}

export interface TriggerCombo {
  id: string;
  name: string;
  triggers: [AllTriggerTypes, AllTriggerTypes, AllTriggerTypes?];
  synergy: number; // 1-10 multiplier
  description: string;
  example: string;
  optimalOrder: boolean;
  conflictsWith: AllTriggerTypes[];
}

// ============================================
// 3. TRIGGER RESISTANCE & SATURATION
// ============================================
export interface TriggerExposure {
  contactId: string;
  triggerId: AllTriggerTypes;
  exposureCount: number;
  lastExposedAt: string;
  effectiveness: number[]; // Array of 1-10 ratings
  averageEffectiveness: number;
  saturated: boolean;
  saturationLevel: 'none' | 'low' | 'medium' | 'high';
  cooldownUntil?: string;
}

export interface ResistanceProfile {
  contactId: string;
  overallResistance: number; // 0-100
  triggerImmunities: AllTriggerTypes[];
  detectedDefenses: {
    type: 'skepticism' | 'analysis_paralysis' | 'delay_tactic' | 'price_anchor' | 'authority_challenge';
    strength: number; // 1-10
    indicators: string[];
  }[];
  recommendedApproach: 'indirect' | 'evidence_heavy' | 'relationship_first' | 'reduce_pressure';
  antiPatterns: string[];
}

// ============================================
// 4. TRIGGER CONFLICT MATRIX
// ============================================
export interface TriggerConflict {
  trigger1: AllTriggerTypes;
  trigger2: AllTriggerTypes;
  conflictLevel: 'minor' | 'moderate' | 'severe';
  reason: string;
  resolution?: string;
}

export interface TriggerSynergy {
  trigger1: AllTriggerTypes;
  trigger2: AllTriggerTypes;
  synergyLevel: number; // 1-10
  explanation: string;
  combinedEffect: string;
}

// ============================================
// 5. NEUROCHEMICAL TIMING
// ============================================
export interface NeurochemicalTiming {
  chemical: Neurochemical;
  optimalHours: number[]; // 0-23
  peakDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday')[];
  avoidHours: number[];
  reasoning: string;
  relatedTriggers: AllTriggerTypes[];
}

export interface TriggerTimingRecommendation {
  triggerId: AllTriggerTypes;
  bestHours: number[];
  bestDays: string[];
  neurochemicalReason: string;
  confidenceScore: number;
}

// ============================================
// 6. A/B NEURAL TESTING
// ============================================
export interface NeuralABTest {
  id: string;
  name: string;
  contactId?: string; // null = portfolio-wide
  variantA: {
    triggerId: AllTriggerTypes;
    template: string;
    uses: number;
    conversions: number;
    avgRating: number;
  };
  variantB: {
    triggerId: AllTriggerTypes;
    template: string;
    uses: number;
    conversions: number;
    avgRating: number;
  };
  winner?: 'A' | 'B' | 'tie';
  confidence: number; // 0-100
  discProfile?: string;
  startedAt: string;
  completedAt?: string;
}

// ============================================
// 7. FALLBACK TREE
// ============================================
export interface TriggerFallback {
  primaryTrigger: AllTriggerTypes;
  failureIndicators: string[];
  fallbackSequence: {
    trigger: AllTriggerTypes;
    condition: string;
    timing: 'immediate' | 'next_contact' | 'wait_24h';
  }[];
}

// ============================================
// 8. INTENSITY PROGRESSION
// ============================================
export interface IntensityLevel {
  level: 1 | 2 | 3 | 4 | 5;
  name: string;
  description: string;
  languageModifiers: string[];
  urgencyWords: string[];
  emotionalIntensity: 'subtle' | 'moderate' | 'strong' | 'intense' | 'maximum';
}

export interface TriggerProgression {
  triggerId: AllTriggerTypes;
  contactId: string;
  currentLevel: number;
  history: {
    level: number;
    usedAt: string;
    result: 'success' | 'neutral' | 'resistance';
  }[];
  maxRecommendedLevel: number;
  escalationBlocked: boolean;
  blockReason?: string;
}

// ============================================
// 9. EXTENDED TRIGGER CATEGORY
// ============================================
export type ExtendedTriggerCategory = TriggerCategory | 'nlp_advanced' | 'high_conversion';

// ============================================
// 10. ADVANCED TRIGGER DEFINITIONS
// ============================================
export interface AdvancedMentalTrigger {
  id: AdvancedTriggerType;
  name: string;
  category: ExtendedTriggerCategory;
  description: string;
  effectiveness: number;
  icon: string;
  color: string;
  examples: string[];
  bestFor: string[];
  avoidFor: string[];
  timing: 'early' | 'middle' | 'closing' | 'any';
  nlpTechnique?: string;
  neuralTarget: BrainSystem;
  primaryChemical: Neurochemical;
  intensityLevels: {
    level: number;
    template: string;
    words: string[];
  }[];
  fallbacks: AllTriggerTypes[];
  synergizes: AllTriggerTypes[];
  conflicts: AllTriggerTypes[];
  resistanceIndicators: string[];
  saturationThreshold: number; // Uses before saturation
}

// ============================================
// 10. ANALYSIS RESULTS
// ============================================
export interface AdvancedTriggerAnalysis {
  contactId: string;
  
  // Saturation Analysis
  saturationReport: {
    triggerId: AllTriggerTypes;
    saturationLevel: number; // 0-100
    usesInLast30Days: number;
    recommendCooldown: boolean;
  }[];
  
  // Resistance Score
  resistanceScore: number; // 0-100
  detectedDefenses: string[];
  
  // Optimal Timing
  optimalContactWindow: {
    dayOfWeek: string;
    hourRange: [number, number];
    neurochemicalReason: string;
  };
  
  // Recommended Chains
  recommendedChains: TriggerChain[];
  
  // Active A/B Tests
  activeTests: NeuralABTest[];
  
  // Conflict Warnings
  conflictWarnings: {
    recentTrigger: AllTriggerTypes;
    conflictsWith: AllTriggerTypes[];
    severity: string;
  }[];
}
