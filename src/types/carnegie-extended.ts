// ==============================================
// DALE CARNEGIE EXTENDED PRINCIPLES - TYPE DEFINITIONS
// 14 Additional Principles from "How to Win Friends"
// ==============================================

export type DiscProfileKey = 'D' | 'I' | 'S' | 'C';

// ============================================
// 1. CRITICISM DETECTOR
// "Don't criticize, condemn, or complain"
// ============================================
export type CriticalLanguageType = 
  | 'direct_criticism'
  | 'passive_aggressive'
  | 'complaint'
  | 'condemnation'
  | 'blame'
  | 'sarcasm'
  | 'negative_comparison'
  | 'dismissive';

export interface CriticalPhrase {
  phrase: string;
  type: CriticalLanguageType;
  severity: 'low' | 'medium' | 'high';
  alternative: string;
  impact: string;
}

export interface CriticismAnalysis {
  hasCriticism: boolean;
  overallScore: number; // 0-100, higher = more positive
  criticalPhrases: CriticalPhrase[];
  positiveAlternatives: string[];
  recommendations: string[];
  tone: 'critical' | 'neutral' | 'positive' | 'very_positive';
}

// ============================================
// 2. EAGER WANT MAPPER
// "Arouse in the other person an eager want"
// ============================================
export type DesireCategory = 
  | 'recognition'
  | 'security'
  | 'autonomy'
  | 'belonging'
  | 'achievement'
  | 'growth'
  | 'pleasure'
  | 'meaning';

export interface EagerWant {
  id: string;
  category: DesireCategory;
  name: string;
  description: string;
  detectionKeywords: string[];
  arousalTechniques: EagerWantTechnique[];
  discAlignment: Record<DiscProfileKey, number>;
}

export interface EagerWantTechnique {
  id: string;
  technique: string;
  example: string;
  whenToUse: string;
}

export interface EagerWantAnalysis {
  detectedWants: DesireCategory[];
  primaryWant: DesireCategory | null;
  confidence: number;
  suggestedApproach: EagerWantTechnique[];
  scripts: string[];
}

// ============================================
// 3. GENUINE INTEREST TRACKER
// "Become genuinely interested in other people"
// ============================================
export interface InterestIndicator {
  type: 'question_asked' | 'follow_up' | 'memory_reference' | 'active_listening' | 'personal_detail';
  description: string;
  example: string;
  weight: number;
}

export interface GenuineInterestScore {
  overall: number; // 0-100
  components: {
    questionsAsked: number;
    followUpsMade: number;
    memoryReferences: number;
    activeListeningSignals: number;
    personalDetailsRemembered: number;
  };
  level: 'low' | 'moderate' | 'high' | 'exceptional';
  suggestions: string[];
}

// ============================================
// 4. POSITIVITY/SMILE ANALYZER
// "Smile"
// ============================================
export interface PositivityIndicator {
  pattern: string;
  type: 'greeting' | 'enthusiasm' | 'optimism' | 'encouragement' | 'humor' | 'warmth';
  impact: number;
}

export interface SmileScore {
  overall: number;
  writtenSmileIndicators: string[];
  enthusiasmLevel: 'flat' | 'neutral' | 'warm' | 'enthusiastic' | 'exuberant';
  suggestions: PositivitySuggestion[];
}

export interface PositivitySuggestion {
  area: string;
  currentState: string;
  improvement: string;
  example: string;
}

// ============================================
// 5. NAME PERSONALIZATION SYSTEM
// "Remember that a person's name is the sweetest sound"
// ============================================
export interface NameUsageMetrics {
  timesUsed: number;
  averagePerInteraction: number;
  optimalFrequency: number;
  lastUsed: string | null;
}

export interface NamePersonalizationTechnique {
  id: string;
  name: string;
  context: string;
  template: string;
  discVariation: Record<DiscProfileKey, string>;
}

// ============================================
// 6. INTEREST ALIGNMENT SYSTEM
// "Talk in terms of the other person's interests"
// ============================================
export interface InterestAlignmentAnalysis {
  alignmentScore: number; // 0-100
  clientInterests: string[];
  yourTopics: string[];
  matchedTopics: string[];
  missedOpportunities: string[];
  suggestions: InterestAlignmentSuggestion[];
}

export interface InterestAlignmentSuggestion {
  interest: string;
  howToIncorporate: string;
  bridgePhrase: string;
  example: string;
}

// ============================================
// 7. ARGUMENT AVOIDANCE DETECTOR
// "The only way to get the best of an argument is to avoid it"
// ============================================
export type ArgumentIndicator = 
  | 'contradiction'
  | 'defensive_response'
  | 'escalation'
  | 'absolute_statement'
  | 'interruption'
  | 'dismissal';

export interface ArgumentRisk {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: ArgumentIndicator[];
  triggerPhrases: string[];
  deEscalationScript: string;
  alternativeApproach: string;
}

export interface ArgumentAvoidanceTechnique {
  id: string;
  name: string;
  scenario: string;
  principle: string;
  script: string;
  discVariation: Record<DiscProfileKey, string>;
}

// ============================================
// 8. JUDGMENT-FREE LANGUAGE
// "Never say 'You're wrong'"
// ============================================
export interface JudgmentPhrase {
  phrase: string;
  type: 'direct_judgment' | 'implicit_judgment' | 'condescension' | 'dismissal';
  alternative: string;
  principle: string;
}

export interface JudgmentFreeAnalysis {
  hasJudgment: boolean;
  judgmentPhrases: JudgmentPhrase[];
  respectScore: number; // 0-100
  reframedText: string;
  learningPoints: string[];
}

// ============================================
// 9. YES-LADDER TECHNIQUE
// "Get the other person saying 'yes, yes' immediately"
// ============================================
export interface YesLadderStep {
  stepNumber: number;
  question: string;
  expectedResponse: 'yes' | 'agreement';
  purpose: string;
  transition: string;
}

export interface YesLadderTemplate {
  id: string;
  name: string;
  context: string;
  steps: YesLadderStep[];
  finalAsk: string;
  discVariation: Record<DiscProfileKey, YesLadderStep[]>;
}

export interface YesLadderAnalysis {
  currentYesCount: number;
  yesOpportunities: string[];
  suggestedQuestions: string[];
  readinessForAsk: number; // 0-100
}

// ============================================
// 10. OWNERSHIP TRANSFER
// "Let the other person feel that the idea is theirs"
// ============================================
export interface OwnershipTechnique {
  id: string;
  name: string;
  description: string;
  setupPhrase: string;
  seedingPhrase: string;
  confirmationPhrase: string;
  celebrationPhrase: string;
  fullScript: string;
  whenToUse: string[];
}

export interface OwnershipTransferAnalysis {
  ownershipGiven: boolean;
  controlLevel: 'you_dominated' | 'balanced' | 'client_owned';
  missedOpportunities: string[];
  suggestions: OwnershipTechnique[];
}

// ============================================
// 11. PERSPECTIVE TAKING SYSTEM
// "Try honestly to see things from the other person's point of view"
// ============================================
export interface PerspectiveShift {
  id: string;
  theirPerspective: string;
  theirFeeling: string;
  theirConcern: string;
  howToAcknowledge: string;
  bridgePhrase: string;
}

export interface PerspectiveTakingAnalysis {
  perspectiveScore: number; // 0-100
  theirLikelyViewpoint: string;
  acknowledgedPerspectives: string[];
  missedPerspectives: string[];
  empathyStatements: string[];
}

// ============================================
// 12. EMPATHY EXPRESSION TEMPLATES
// "Be sympathetic with the other person's ideas and desires"
// ============================================
export type EmpathyType = 
  | 'validation'
  | 'mirroring'
  | 'normalization'
  | 'understanding'
  | 'support'
  | 'shared_experience';

export interface EmpathyTemplate {
  id: string;
  type: EmpathyType;
  name: string;
  structure: string;
  examples: string[];
  whenToUse: string[];
  discVariation: Record<DiscProfileKey, string>;
}

export interface EmpathyAnalysis {
  empathyScore: number;
  empathyStatements: string[];
  missedEmpathyMoments: string[];
  suggestedResponses: EmpathyTemplate[];
}

// ============================================
// 13. STORYTELLING FRAMEWORK
// "Dramatize your ideas"
// ============================================
export type StoryType = 
  | 'hero_journey'
  | 'before_after'
  | 'problem_solution'
  | 'testimonial'
  | 'analogy'
  | 'contrast'
  | 'vision';

export interface StoryTemplate {
  id: string;
  type: StoryType;
  name: string;
  structure: {
    hook: string;
    conflict: string;
    journey: string;
    resolution: string;
    lesson: string;
  };
  example: string;
  whenToUse: string[];
  emotionalArc: string;
}

export interface StorytellingAnalysis {
  usesStorytelling: boolean;
  storyElements: string[];
  missedOpportunities: string[];
  suggestedStories: StoryTemplate[];
  dramatizationScore: number;
}

// ============================================
// 14. CHALLENGE/COMPETITION TRIGGER
// "Throw down a challenge"
// ============================================
export interface ChallengeTechnique {
  id: string;
  name: string;
  type: 'self_challenge' | 'comparison' | 'achievement' | 'gamification' | 'status';
  setupPhrase: string;
  challengePhrase: string;
  motivationPhrase: string;
  fullScript: string;
  discEffectiveness: Record<DiscProfileKey, number>;
  warnings: string[];
}

// ============================================
// 15. INDIRECT FEEDBACK SYSTEM
// "Call attention to people's mistakes indirectly"
// ============================================
export interface IndirectFeedbackTechnique {
  id: string;
  name: string;
  scenario: string;
  directApproach: string;
  indirectApproach: string;
  bridgePhrase: string;
  fullScript: string;
  principle: string;
}

// ============================================
// 16. QUESTION-BASED INFLUENCE
// "Ask questions instead of giving direct orders"
// ============================================
export interface QuestionInfluence {
  id: string;
  directOrder: string;
  questionAlternative: string;
  effect: string;
  category: 'suggestion' | 'exploration' | 'reflection' | 'commitment' | 'discovery';
}

export interface QuestionInfluenceAnalysis {
  ordersGiven: number;
  questionsAsked: number;
  ratio: number;
  missedQuestionOpportunities: string[];
  suggestedQuestions: QuestionInfluence[];
}

// ============================================
// 17. ENCOURAGEMENT SYSTEM
// "Use encouragement. Make the fault seem easy to correct"
// ============================================
export interface EncouragementTemplate {
  id: string;
  context: string;
  minimizePhrase: string;
  encouragePhrase: string;
  confidencePhrase: string;
  fullScript: string;
  discVariation: Record<DiscProfileKey, string>;
}

export interface EncouragementAnalysis {
  encouragementGiven: number;
  discouragementDetected: number;
  score: number;
  opportunities: string[];
  templates: EncouragementTemplate[];
}

// ============================================
// 18. MOTIVATION ALIGNMENT
// "Make the other person happy about doing the thing you suggest"
// ============================================
export interface MotivationAlignment {
  id: string;
  action: string;
  theirBenefit: string;
  emotionalHook: string;
  statusElevation: string;
  script: string;
}

export interface MotivationAlignmentAnalysis {
  alignmentScore: number;
  theirMotivations: string[];
  yourAsk: string;
  connectionStrength: 'weak' | 'moderate' | 'strong' | 'perfect';
  reframedAsk: string;
  happinessFactors: string[];
}

// ============================================
// UNIFIED EXTENDED CARNEGIE SCORE
// ============================================
export interface ExtendedCarnegieScore {
  overall: number;
  components: {
    criticismAvoidance: number;
    eagerWantArousal: number;
    genuineInterest: number;
    positivitySmile: number;
    namePersonalization: number;
    interestAlignment: number;
    argumentAvoidance: number;
    judgmentFreeLanguage: number;
    yesLadder: number;
    ownershipTransfer: number;
    perspectiveTaking: number;
    empathyExpression: number;
    storytelling: number;
    challengeTrigger: number;
    indirectFeedback: number;
    questionInfluence: number;
    encouragement: number;
    motivationAlignment: number;
  };
  level: 'novice' | 'developing' | 'proficient' | 'expert' | 'master';
  topStrengths: string[];
  priorityImprovements: string[];
}
