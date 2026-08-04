// ==============================================
// NEUROMARKETING TYPES - Enterprise Neuroscience Layer
// Based on Patrick Renvoisé's SalesBrain & Latest Research
// ==============================================

// ============================================
// 1. THREE-BRAIN MODEL (Paul MacLean's Triune Brain)
// ============================================
export type BrainSystem = 
  | 'reptilian'   // Old Brain - Survival, Fight/Flight, Decision Trigger
  | 'limbic'      // Middle Brain - Emotions, Memory, Trust
  | 'neocortex';  // New Brain - Logic, Language, Analysis

export interface BrainSystemInfo {
  name: string;
  namePt: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  descriptionPt: string;
  evolutionAge: string;
  mainFunction: string;
  decisionRole: string;
  communicationStyle: string[];
  keyDrivers: string[];
  warnings: string[];
}

// ============================================
// 2. SIX STIMULI (SalesBrain NeuroMap)
// ============================================
export type PrimalStimulus = 
  | 'self_centered'  // Personal - "What's in it for ME?"
  | 'contrast'       // Before/After, With/Without
  | 'tangible'       // Concrete, Simple, Familiar
  | 'memorable'      // Beginning & End (Peak-End Rule)
  | 'visual'         // 50% brain dedicated to visual
  | 'emotional';     // Emotional trigger for decision

export interface PrimalStimulusInfo {
  name: string;
  namePt: string;
  icon: string;
  color: string;
  description: string;
  descriptionPt: string;
  applicationTips: string[];
  messageTemplates: string[];
  keywords: string[];
  effectiveness: number; // 1-10
}

// ============================================
// 3. NEUROCHEMICALS (Decision Drivers)
// ============================================
export type Neurochemical = 
  | 'dopamine'    // Reward, Anticipation, Desire
  | 'oxytocin'    // Trust, Bonding, Connection
  | 'cortisol'    // Fear, Urgency, Stress
  | 'serotonin'   // Confidence, Status, Well-being
  | 'endorphin'   // Pleasure, Relief, Reward
  | 'adrenaline'; // Action, Excitement, Risk

export interface NeurochemicalInfo {
  name: string;
  namePt: string;
  icon: string;
  color: string;
  bgColor: string;
  effect: string;
  effectPt: string;
  triggers: string[];
  salesApplication: string;
  warningSignals: string[];
  balanceWith: Neurochemical[];
}

// ============================================
// 4. PAIN-CLAIM-GAIN FRAMEWORK
// ============================================
export type PainClaimGainStage = 'pain' | 'claim' | 'gain';

export interface PainPoint {
  id: string;
  description: string;
  intensity: number; // 1-10
  frequency: 'daily' | 'weekly' | 'monthly' | 'occasionally';
  emotionalImpact: string;
  financialImpact?: string;
  detected: boolean;
  source?: string;
}

export interface ClaimStatement {
  id: string;
  claim: string;
  uniqueness: number; // 1-10
  credibility: number; // 1-10
  memorability: number; // 1-10
  proofPoints: string[];
}

export interface GainProof {
  id: string;
  gainType: 'financial' | 'strategic' | 'personal';
  description: string;
  quantified: boolean;
  value?: string;
  timeframe?: string;
  testimonial?: string;
}

export interface PainClaimGainAnalysis {
  contactId: string;
  pains: PainPoint[];
  claims: ClaimStatement[];
  gains: GainProof[];
  dominantPain: PainPoint | null;
  bestClaim: ClaimStatement | null;
  bestGain: GainProof | null;
  alignmentScore: number; // 0-100
  recommendations: string[];
}

// ============================================
// 5. NEURO DECISION PATH
// ============================================
export interface NeuroDecisionProfile {
  contactId: string;
  dominantBrain: BrainSystem;
  brainBalance: {
    reptilian: number;  // 0-100
    limbic: number;     // 0-100
    neocortex: number;  // 0-100
  };
  responsiveStimuli: PrimalStimulus[];
  dominantNeurochemical: Neurochemical;
  neurochemicalBalance: Record<Neurochemical, number>;
  decisionSpeed: 'impulsive' | 'moderate' | 'analytical';
  riskTolerance: 'high' | 'medium' | 'low';
  primaryMotivation: 'avoid_pain' | 'seek_gain' | 'balanced';
  trustLevel: 'skeptical' | 'neutral' | 'trusting';
  optimalApproach: string[];
  avoidApproach: string[];
  lastAnalyzed: string;
  confidence: number;
}

// ============================================
// 6. NEURO-ENRICHED TRIGGER
// ============================================
export interface NeuroEnrichedTrigger {
  triggerId: string;
  triggerName: string;
  brainSystem: BrainSystem;
  primaryStimulus: PrimalStimulus;
  secondaryStimuli: PrimalStimulus[];
  neurochemicalEffect: Neurochemical;
  neurochemicalIntensity: number; // 1-10
  optimalTiming: 'opening' | 'building' | 'closing' | 'any';
  effectivenessMultiplier: number; // Based on contact profile
}

// ============================================
// 7. NEURO COMMUNICATION SCRIPT
// ============================================
export interface NeuroScriptSection {
  stage: PainClaimGainStage;
  brainTarget: BrainSystem;
  stimuliUsed: PrimalStimulus[];
  neurochemicalGoal: Neurochemical;
  content: string;
  visualElement?: string;
  contrastPair?: { before: string; after: string };
  callToAction?: string;
  timing: string;
}

export interface NeuroOptimizedScript {
  contactId: string;
  contactName: string;
  neuroProfile: NeuroDecisionProfile;
  sections: NeuroScriptSection[];
  openingHook: string;
  closingAnchor: string;
  keyContrasts: { before: string; after: string }[];
  tangibleProofs: string[];
  emotionalTriggers: string[];
  predictedEffectiveness: number;
  generatedAt: string;
}

// ============================================
// 8. NEURO ANALYSIS RESULT
// ============================================
export interface NeuroAnalysisResult {
  text: string;
  detectedBrainSystem: BrainSystem;
  brainSystemScores: Record<BrainSystem, number>;
  detectedStimuli: {
    stimulus: PrimalStimulus;
    indicators: string[];
    score: number;
  }[];
  neurochemicalProfile: {
    chemical: Neurochemical;
    intensity: number;
    indicators: string[];
  }[];
  painIndicators: string[];
  gainIndicators: string[];
  recommendations: string[];
  confidence: number;
}

// ============================================
// 9. NEURO COMPATIBILITY
// ============================================
export interface NeuroCompatibility {
  score: number; // 0-100
  brainAlignment: number;
  stimuliMatch: number;
  chemicalBalance: number;
  communicationFit: number;
  strengths: string[];
  challenges: string[];
  adaptationTips: string[];
}
