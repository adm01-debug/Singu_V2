// Advanced NLP Types for Sales Intelligence

export type LowMedHigh = 'low' | 'medium' | 'high';

// ============================================
// 1. EMOTIONAL STATES & ANCHORS
// ============================================
export type EmotionalState = 
  | 'excited' | 'interested' | 'curious' | 'hopeful' | 'confident'  // Positive
  | 'neutral' | 'thoughtful' | 'analytical'                         // Neutral
  | 'hesitant' | 'skeptical' | 'frustrated' | 'anxious' | 'resistant'; // Negative

export interface EmotionalAnchor {
  id: string;
  type: 'positive' | 'negative';
  trigger: string; // Word, phrase or topic that triggers the state
  state: EmotionalState;
  context: string;
  detectedAt: string;
  strength: number; // 1-10
}

export interface EmotionalAnalysis {
  currentState: EmotionalState;
  stateHistory: { state: EmotionalState; timestamp: string; trigger?: string }[];
  positiveAnchors: EmotionalAnchor[];
  negativeAnchors: EmotionalAnchor[];
  bestMomentToClose: {
    recommended: boolean;
    reason: string;
    optimalTiming: string;
  };
  emotionalTrend: 'improving' | 'stable' | 'declining';
}

// ============================================
// 2. RAPPORT GENERATOR
// ============================================
export interface RapportScript {
  id: string;
  category: 'mirroring' | 'pacing' | 'leading' | 'matching' | 'anchoring';
  title: string;
  script: string;
  explanation: string;
  adaptedFor: {
    vak?: string;
    disc?: string;
    metaprogram?: string;
  };
  keywords: string[];
  tips: string[];
}

export interface RapportProfile {
  mirroringStrategies: RapportScript[];
  pacingStrategies: RapportScript[];
  connectionKeywords: string[];
  avoidKeywords: string[];
  bodyLanguageTips: string[];
  voiceTips: string[];
  openingLines: string[];
  transitionPhrases: string[];
  rapportScore: number;
}

// ============================================
// 3. CLIENT VALUES & CRITERIA MAP
// ============================================
export type ValueCategory = 
  | 'security' | 'freedom' | 'growth' | 'recognition' 
  | 'connection' | 'achievement' | 'control' | 'innovation'
  | 'tradition' | 'balance' | 'wealth' | 'impact';

export interface ClientValue {
  id: string;
  category: ValueCategory;
  name: string;
  importance: number; // 1-10
  detectedPhrases: string[];
  frequency: number;
  lastMentioned: string;
}

export interface DecisionCriterion {
  id: string;
  name: string;
  priority: number; // 1 = highest
  type: 'must_have' | 'nice_to_have' | 'deal_breaker';
  detectedFrom: string;
  howToAddress: string;
}

export interface ValuesMap {
  coreValues: ClientValue[];
  decisionCriteria: DecisionCriterion[];
  valueHierarchy: string[];
  benefitAlignment: {
    value: string;
    benefit: string;
    template: string;
  }[];
  motivationalDrivers: string[];
  fearDrivers: string[];
}

// ============================================
// 4. HIDDEN OBJECTIONS DETECTOR
// ============================================
export type ObjectionType = 
  | 'price' | 'timing' | 'authority' | 'need' | 'trust' 
  | 'competition' | 'change_resistance' | 'past_experience';

export interface HiddenObjection {
  id: string;
  type: ObjectionType;
  indicator: string; // The phrase/pattern that indicated this
  probability: number; // 0-100%
  severity: LowMedHigh;
  possibleRealObjection: string;
  suggestedProbe: string; // Question to uncover the real objection
  resolutionTemplates: string[];
}

export interface ObjectionAnalysis {
  detectedObjections: HiddenObjection[];
  linguisticPatterns: {
    pattern: string;
    meaning: string;
    frequency: number;
  }[];
  hesitationIndicators: string[];
  resistanceLevel: number; // 0-100
  recommendedApproach: string;
}

// ============================================
// 5. PERSONALIZED SALES SCRIPT
// ============================================
export type SalesStage = 
  | 'rapport' | 'discovery' | 'presentation' | 'objection_handling' 
  | 'negotiation' | 'closing' | 'follow_up';

export interface ScriptSection {
  stage: SalesStage;
  title: string;
  objective: string;
  script: string;
  magicWords: string[];
  anchorPhrases: string[];
  transitionTo: string;
  warningSignals: string[];
  adaptations: {
    ifPositive: string;
    ifNegative: string;
    ifNeutral: string;
  };
  estimatedDuration: string;
}

export interface PersonalizedScript {
  contactId: string;
  contactName: string;
  generatedAt: string;
  profileSummary: string;
  sections: ScriptSection[];
  powerWords: string[];
  wordsToAvoid: string[];
  keyInsights: string[];
  successProbability: number;
}

// ============================================
// 6. NEGOTIATION SIMULATOR
// ============================================
export interface NegotiationScenario {
  id: string;
  name: string;
  description: string;
  clientReaction: string;
  probability: number;
  bestResponse: string;
  alternativeResponses: string[];
  nextScenarios: string[];
}

export interface NegotiationPath {
  approach: string;
  predictedReactions: {
    reaction: string;
    probability: number;
    counterStrategy: string;
  }[];
  successProbability: number;
  riskLevel: LowMedHigh;
  recommendedSequence: string[];
}

export interface SimulationResult {
  scenarios: NegotiationScenario[];
  optimalPath: NegotiationPath;
  alternativePaths: NegotiationPath[];
  anticipatedObjections: string[];
  closingStrategies: {
    strategy: string;
    effectiveness: number;
    script: string;
  }[];
}

// ============================================
// 7. PERSUASION SCORE ANALYZER
// ============================================
export interface MessageAnalysis {
  originalMessage: string;
  overallScore: number; // 0-100
  breakdown: {
    vakAlignment: number;
    discAlignment: number;
    metaprogramAlignment: number;
    emotionalImpact: number;
    clarity: number;
    callToAction: number;
  };
  issues: {
    issue: string;
    severity: LowMedHigh;
    suggestion: string;
    location?: string;
  }[];
  optimizedVersion: string;
  wordsToReplace: {
    original: string;
    suggested: string;
    reason: string;
  }[];
  missingElements: string[];
  strengths: string[];
}

// ============================================
// 8. CLIENT DICTIONARY
// ============================================
export interface WordUsage {
  word: string;
  frequency: number;
  context: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  lastUsed: string;
  engagementLevel: number; // How much engagement this word generates
}

export interface ClientDictionary {
  favoriteWords: WordUsage[];
  favoriteExpressions: WordUsage[];
  avoidWords: WordUsage[];
  techTermsUsed: WordUsage[];
  emotionalTriggers: WordUsage[];
  vocabularyStyle: 'formal' | 'informal' | 'technical' | 'casual' | 'mixed';
  communicationTempo: 'fast' | 'moderate' | 'slow';
  preferredGreetings: string[];
  preferredClosings: string[];
  topEngagementWords: string[];
}

// ============================================
// COMBINED PROFILE
// ============================================
export interface AdvancedNLPProfile {
  contactId: string;
  emotionalAnalysis: EmotionalAnalysis;
  rapportProfile: RapportProfile;
  valuesMap: ValuesMap;
  objectionAnalysis: ObjectionAnalysis;
  personalizedScript: PersonalizedScript;
  simulationResult: SimulationResult;
  clientDictionary: ClientDictionary;
  lastUpdated: string;
  confidenceScore: number;
}
