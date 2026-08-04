// ==============================================
// DALE CARNEGIE PRINCIPLES - TYPE DEFINITIONS
// Based on "How to Win Friends and Influence People"
// ==============================================

export type LowMedHigh = 'low' | 'medium' | 'high';

// ============================================
// NOBLE CAUSE TRIGGER
// ============================================
export interface NobleCause {
  id: string;
  name: string;
  category: 'altruism' | 'legacy' | 'community' | 'family' | 'purpose' | 'growth' | 'justice' | 'innovation';
  description: string;
  emotionalAppeal: string;
  keywords: string[];
  templates: NobleCauseTemplate[];
  intensity: 1 | 2 | 3 | 4 | 5;
  discCompatibility: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
}

export interface NobleCauseTemplate {
  id: string;
  causeId: string;
  opening: string;
  bridge: string;
  callToAction: string;
  emotionalHook: string;
}

export interface NobleCauseDetection {
  detectedCauses: string[];
  primaryCause: string | null;
  confidence: number;
  matchedPhrases: string[];
  suggestedApproach: NobleCauseTemplate | null;
}

// ============================================
// IDENTITY LABELING
// ============================================
export type IdentityLabelCategory = 
  | 'achiever' 
  | 'innovator' 
  | 'leader' 
  | 'expert' 
  | 'pioneer' 
  | 'caregiver'
  | 'visionary'
  | 'perfectionist'
  | 'problem_solver'
  | 'connector'
  | 'mentor'
  | 'trailblazer';

export interface IdentityLabel {
  id: string;
  category: IdentityLabelCategory;
  label: string;
  description: string;
  reinforcementPhrases: string[];
  futureProjection: string;
  pastValidation: string;
  discAlignment: {
    D: number;
    I: number;
    S: number;
    C: number;
  };
  vakAlignment: {
    V: number;
    A: number;
    K: number;
    D: number;
  };
}

export interface IdentityLabelHistory {
  id: string;
  contactId: string;
  labelId: string;
  appliedAt: string;
  context: string;
  effectiveness: number | null;
  reinforcementCount: number;
}

export interface IdentityLabelSuggestion {
  label: IdentityLabel;
  confidence: number;
  reasoning: string;
  applicationScript: string;
}

// ============================================
// APPRECIATION TRACKER
// ============================================
export type AppreciationType = 
  | 'sincere_compliment'
  | 'specific_recognition'
  | 'effort_acknowledgment'
  | 'character_praise'
  | 'achievement_celebration'
  | 'growth_recognition'
  | 'contribution_thanks'
  | 'quality_admiration';

export interface Appreciation {
  id: string;
  contactId: string;
  type: AppreciationType;
  content: string;
  context: string;
  deliveredAt: string;
  channel: 'email' | 'call' | 'meeting' | 'message' | 'social';
  wasReciprocated: boolean;
  emotionalImpact: 'low' | 'medium' | 'high' | 'very_high';
  followUpRequired: boolean;
}

export interface AppreciationMetrics {
  totalGiven: number;
  byType: Record<AppreciationType, number>;
  averagePerContact: number;
  reciprocationRate: number;
  lastAppreciationDate: string | null;
  topAppreciatedContacts: string[];
  appreciationGap: number; // Days since last appreciation
  suggestedAppreciations: AppreciationSuggestion[];
}

export interface AppreciationSuggestion {
  contactId: string;
  contactName: string;
  type: AppreciationType;
  reason: string;
  template: string;
  urgency: LowMedHigh;
  daysSinceLastAppreciation: number;
}

// ============================================
// TALK RATIO ANALYZER
// ============================================
export interface TalkRatioAnalysis {
  speakerRatio: number; // 0-100, percentage user spoke
  listenerRatio: number; // 0-100, percentage user listened
  idealRatio: number; // Target ratio (usually 30-40% speaking)
  deviation: number; // How far from ideal
  quality: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  
  // Detailed metrics
  questionCount: number;
  statementCount: number;
  interruptionIndicators: number;
  activeListeningIndicators: number;
  
  // Patterns
  openEndedQuestions: number;
  closedQuestions: number;
  reflectiveStatements: number;
  acknowledgments: number;
  
  // Recommendations
  recommendations: TalkRatioRecommendation[];
}

export interface TalkRatioRecommendation {
  type: 'ask_more' | 'listen_more' | 'reflect_more' | 'acknowledge_more' | 'reduce_interruptions';
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  template: string;
}

export interface TalkRatioHistory {
  interactionId: string;
  contactId: string;
  date: string;
  ratio: number;
  quality: string;
}

// ============================================
// WARMTH SCORE
// ============================================
export interface WarmthScore {
  overall: number; // 0-100
  components: {
    greetingWarmth: number;
    empathyIndicators: number;
    positiveLanguage: number;
    personalTouches: number;
    emotionalConnection: number;
    genuineInterest: number;
  };
  level: 'cold' | 'neutral' | 'warm' | 'very_warm' | 'exceptional';
  trend: 'declining' | 'stable' | 'improving';
  
  // Detected elements
  warmthIndicators: WarmthIndicator[];
  coldIndicators: ColdIndicator[];
  
  // Suggestions
  improvementSuggestions: WarmthSuggestion[];
}

export interface WarmthIndicator {
  type: 'greeting' | 'empathy' | 'personal' | 'positive' | 'caring';
  phrase: string;
  impact: number;
}

export interface ColdIndicator {
  type: 'formal' | 'impersonal' | 'rushed' | 'dismissive' | 'negative';
  phrase: string;
  impact: number;
  alternative: string;
}

export interface WarmthSuggestion {
  area: string;
  currentState: string;
  suggestion: string;
  template: string;
  impact: LowMedHigh;
}

// ============================================
// FACE-SAVING TECHNIQUES
// ============================================
export type FaceSavingScenario = 
  | 'price_objection'
  | 'product_limitation'
  | 'missed_deadline'
  | 'service_failure'
  | 'misunderstanding'
  | 'competitor_comparison'
  | 'budget_constraint'
  | 'internal_resistance'
  | 'changed_requirements'
  | 'delayed_decision';

export interface FaceSavingTechnique {
  id: string;
  name: string;
  scenario: FaceSavingScenario;
  description: string;
  principle: string; // Carnegie principle it addresses
  
  // Templates
  acknowledgmentPhrase: string;
  bridgePhrase: string;
  solutionPhrase: string;
  closingPhrase: string;
  
  // Full script
  fullScript: string;
  
  // Variations by DISC
  discVariations: {
    D: string;
    I: string;
    S: string;
    C: string;
  };
  
  // Do's and Don'ts
  doThis: string[];
  avoidThis: string[];
}

export interface FaceSavingSuggestion {
  scenario: FaceSavingScenario;
  technique: FaceSavingTechnique;
  confidence: number;
  triggerPhrases: string[];
}

// ============================================
// VULNERABILITY TEMPLATES
// ============================================
export type VulnerabilityType = 
  | 'admitting_mistake'
  | 'sharing_failure'
  | 'acknowledging_limitation'
  | 'expressing_uncertainty'
  | 'asking_for_help'
  | 'showing_learning'
  | 'revealing_struggle'
  | 'accepting_feedback';

export interface VulnerabilityTemplate {
  id: string;
  type: VulnerabilityType;
  name: string;
  description: string;
  
  // Structure
  opening: string;
  vulnerability: string;
  lesson: string;
  connection: string;
  
  // Full script
  fullScript: string;
  
  // Context
  whenToUse: string[];
  whenToAvoid: string[];
  
  // Impact
  trustBuildingScore: number;
  authenticityScore: number;
  
  // DISC adaptation
  discAdaptation: {
    D: { approach: string; caution: string };
    I: { approach: string; caution: string };
    S: { approach: string; caution: string };
    C: { approach: string; caution: string };
  };
}

export interface VulnerabilityMoment {
  id: string;
  contactId: string;
  templateId: string;
  usedAt: string;
  context: string;
  clientReaction: 'positive' | 'neutral' | 'negative' | null;
  relationshipImpact: number | null;
}

// ============================================
// PROGRESS CELEBRATION
// ============================================
export type ProgressType = 
  | 'milestone_reached'
  | 'goal_achieved'
  | 'improvement_noted'
  | 'challenge_overcome'
  | 'skill_developed'
  | 'decision_made'
  | 'step_completed'
  | 'habit_formed'
  | 'breakthrough'
  | 'consistency';

export interface ProgressCelebration {
  id: string;
  type: ProgressType;
  name: string;
  description: string;
  
  // Celebration templates
  recognitionPhrase: string;
  amplificationPhrase: string;
  futureProjection: string;
  
  // Full celebration script
  fullScript: string;
  
  // Intensity levels
  microCelebration: string;
  standardCelebration: string;
  majorCelebration: string;
  
  // Follow-up
  followUpQuestion: string;
  nextStepSuggestion: string;
}

export interface ClientProgress {
  id: string;
  contactId: string;
  type: ProgressType;
  description: string;
  detectedAt: string;
  celebrated: boolean;
  celebratedAt: string | null;
  celebrationType: 'micro' | 'standard' | 'major' | null;
  clientReaction: 'positive' | 'neutral' | 'negative' | null;
}

export interface ProgressTracker {
  contactId: string;
  totalProgressPoints: number;
  celebratedCount: number;
  uncelebratedCount: number;
  progressHistory: ClientProgress[];
  suggestedCelebrations: ProgressCelebrationSuggestion[];
}

export interface ProgressCelebrationSuggestion {
  progress: ClientProgress;
  celebration: ProgressCelebration;
  urgency: LowMedHigh;
  script: string;
}

// ============================================
// CARNEGIE SCORE - UNIFIED METRIC
// ============================================
export interface CarnegieScore {
  overall: number; // 0-100
  
  // Component scores
  components: {
    nobleCause: number;
    identityLabeling: number;
    appreciation: number;
    talkRatio: number;
    warmth: number;
    faceSaving: number;
    vulnerability: number;
    progressCelebration: number;
  };
  
  // Level
  level: 'novice' | 'developing' | 'proficient' | 'expert' | 'master';
  
  // Strengths and areas for improvement
  strengths: string[];
  areasForImprovement: string[];
  
  // Recommendations
  priorityActions: CarnegieRecommendation[];
}

export interface CarnegieRecommendation {
  area: string;
  action: string;
  template: string;
  impact: LowMedHigh;
  effort: LowMedHigh;
}

// ============================================
// CARNEGIE ANALYSIS RESULT
// ============================================
export interface CarnegieAnalysisResult {
  score: CarnegieScore;
  nobleCauseDetection: NobleCauseDetection;
  identityLabels: IdentityLabelSuggestion[];
  appreciationMetrics: AppreciationMetrics;
  talkRatio: TalkRatioAnalysis;
  warmthScore: WarmthScore;
  faceSavingSuggestions: FaceSavingSuggestion[];
  vulnerabilityOpportunities: VulnerabilityTemplate[];
  progressToocelebrate: ProgressCelebrationSuggestion[];
}
