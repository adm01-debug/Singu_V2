// ==============================================
// DISC TYPES - Enterprise Level Type Definitions
// ==============================================

import { DISCProfile } from './index';

// Extended DISC Score with all 4 dimensions
export interface DISCScores {
  dominance: number;    // 0-100
  influence: number;    // 0-100
  steadiness: number;   // 0-100
  conscientiousness: number; // 0-100
}

// Full DISC Profile with primary, secondary, and blend
export interface DISCFullProfile {
  scores: DISCScores;
  primary: Exclude<DISCProfile, null>;
  secondary: Exclude<DISCProfile, null> | null;
  blend: string | null;  // e.g., 'DI', 'SC'
  
  // Stress profile
  stressPrimary?: Exclude<DISCProfile, null>;
  stressSecondary?: Exclude<DISCProfile, null> | null;
}

// Analysis source tracking
export type DISCAnalysisSource = 'manual' | 'ai_analysis' | 'questionnaire' | 'behavior_tracking';

// Complete DISC Analysis Record (matches DB schema)
export interface DISCAnalysisRecord {
  id: string;
  userId: string;
  contactId: string;
  interactionId?: string;
  
  // Scores
  dominanceScore: number;
  influenceScore: number;
  steadinessScore: number;
  conscientiousnessScore: number;
  
  // Profiles
  primaryProfile: Exclude<DISCProfile, null>;
  secondaryProfile: Exclude<DISCProfile, null> | null;
  blendProfile: string | null;
  
  // Stress profiles
  stressPrimary?: Exclude<DISCProfile, null>;
  stressSecondary?: Exclude<DISCProfile, null> | null;
  
  // Confidence & source
  confidence: number;
  analysisSource: DISCAnalysisSource;
  
  // Evidence
  detectedKeywords: string[];
  detectedPhrases: string[];
  behaviorIndicators: string[];
  
  // Metadata
  analyzedText?: string;
  analysisNotes?: string;
  profileSummary?: string;
  
  // Timestamps
  analyzedAt: Date;
  createdAt: Date;
}

// AI Analysis Request
export interface DISCAnalysisRequest {
  contactId: string;
  texts: string[];
  interactionId?: string;
  existingProfile?: DISCFullProfile;
}

// AI Analysis Response
export interface DISCAnalysisResponse {
  success: boolean;
  profile?: DISCFullProfile;
  confidence: number;
  detectedKeywords: string[];
  detectedPhrases: string[];
  behaviorIndicators: string[];
  summary: string;
  recommendations: string[];
  error?: string;
}

// Conversion metrics for analytics
export interface DISCConversionMetrics {
  profile: Exclude<DISCProfile, null>;
  blendProfile?: string;
  totalContacts: number;
  totalOpportunities: number;
  convertedCount: number;
  lostCount: number;
  conversionRate: number;
  averageDealSize: number;
  averageSalesCycleDays: number;
  averageRelationshipScore: number;
  averageCompatibilityScore: number;
  periodStart: Date;
  periodEnd: Date;
}

// Communication log for tracking adaptations
export interface DISCCommunicationLog {
  id: string;
  contactId: string;
  interactionId?: string;
  contactDiscProfile: Exclude<DISCProfile, null>;
  approachAdapted: boolean;
  adaptationTipsShown: string[];
  tipsFollowed: string[];
  communicationOutcome?: 'positive' | 'neutral' | 'negative';
  outcomeNotes?: string;
  effectivenessRating?: number; // 1-5
  createdAt: Date;
}

// Dashboard analytics data
export interface DISCDashboardData {
  portfolioDistribution: {
    profile: Exclude<DISCProfile, null>;
    count: number;
    percentage: number;
  }[];
  
  blendDistribution: {
    blend: string;
    count: number;
    percentage: number;
  }[];
  
  conversionByProfile: {
    profile: Exclude<DISCProfile, null>;
    rate: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  
  compatibilityInsights: {
    bestPerforming: Exclude<DISCProfile, null>;
    needsImprovement: Exclude<DISCProfile, null>;
    avgCompatibilityScore: number;
  };
  
  recentAnalyses: DISCAnalysisRecord[];
  
  profiledContacts: number;
  totalContacts: number;
  coveragePercentage: number;
  
  averageConfidence: number;
}

// Training mode types
export interface DISCTrainingScenario {
  id: string;
  title: string;
  description: string;
  clientProfile: {
    disc: Exclude<DISCProfile, null>;
    situation: string;
  };
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface DISCTrainingProgress {
  userId: string;
  scenariosCompleted: number;
  correctAnswers: number;
  profileMastery: {
    profile: Exclude<DISCProfile, null>;
    score: number;
    practiceCount: number;
  }[];
}
