// Emotional Intelligence (EQ) Types based on Daniel Goleman's 5 Pillars

// ============================================
// EQ PILLAR TYPES
// ============================================
export type EQPillar = 
  | 'self_awareness'      // Autoconsciência
  | 'self_regulation'     // Autorregulação
  | 'motivation'          // Motivação
  | 'empathy'             // Empatia
  | 'social_skills';      // Habilidades Sociais

export type EQLevel = 'low' | 'developing' | 'moderate' | 'high' | 'exceptional';

// ============================================
// INDICATOR TYPES
// ============================================
export interface EQIndicator {
  id: string;
  pillar: EQPillar;
  indicator: string;
  detectedPhrase: string;
  context: string;
  polarity: 'positive' | 'negative';
  strength: number; // 1-10
  timestamp: string;
}

export interface EQPillarScore {
  pillar: EQPillar;
  score: number; // 0-100
  level: EQLevel;
  positiveIndicators: number;
  negativeIndicators: number;
  trend: 'improving' | 'stable' | 'declining';
  insights: string[];
  recommendations: string[];
}

// ============================================
// ANALYSIS RESULT
// ============================================
export interface EQAnalysisResult {
  overallScore: number; // 0-100
  overallLevel: EQLevel;
  pillarScores: Record<EQPillar, EQPillarScore>;
  indicators: EQIndicator[];
  strengths: EQPillar[];
  areasForGrowth: EQPillar[];
  
  // Relationship implications
  communicationStyle: {
    preferredApproach: string;
    avoidApproach: string;
    tips: string[];
  };
  
  // Sales implications
  salesImplications: {
    decisionMakingStyle: string;
    persuasionApproach: string;
    objectionHandling: string;
    closingStrategy: string;
  };
  
  // Comparative insights
  profileSummary: string;
  lastAnalyzed: string;
  confidence: number;
}

// ============================================
// PILLAR INFO FOR DISPLAY
// ============================================
export interface EQPillarInfo {
  name: string;
  namePt: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  descriptionPt: string;
  characteristics: {
    high: string[];
    low: string[];
  };
  developmentTips: string[];
}

// ============================================
// EQ PROFILE (Combined with other profiles)
// ============================================
export interface EQProfile {
  contactId: string;
  analysis: EQAnalysisResult;
  history: {
    date: string;
    overallScore: number;
    pillarScores: Record<EQPillar, number>;
  }[];
  createdAt: string;
  updatedAt: string;
}
