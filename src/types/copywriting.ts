// ==============================================
// COPYWRITING SALES TOOLS - Type Definitions
// Enterprise-grade copywriting framework types
// ==============================================

// ============================================
// 1. FAB - FEATURE, ADVANTAGE, BENEFIT
// ============================================
export interface FABElement {
  id: string;
  feature: string;           // O que é (característica técnica)
  advantage: string;         // O que faz (vantagem funcional)
  benefit: string;           // Por que importa (benefício emocional)
  emotionalHook?: string;    // Gancho emocional adicional
  targetPain?: string;       // Dor que resolve
}

export interface FABTemplate {
  id: string;
  name: string;
  category: 'product' | 'service' | 'feature' | 'solution';
  template: {
    featurePrompt: string;
    advantagePrompt: string;
    benefitPrompt: string;
  };
  example: FABElement;
  powerWords: string[];
}

export interface FABAnalysis {
  elements: FABElement[];
  overallStrength: number;      // 0-100
  missingEmotionalHooks: boolean;
  suggestions: string[];
}

// ============================================
// 2. AIDA - ATTENTION, INTEREST, DESIRE, ACTION
// ============================================
export type AIDAStage = 'attention' | 'interest' | 'desire' | 'action';

export interface AIDASection {
  stage: AIDAStage;
  title: string;
  content: string;
  techniques: string[];
  powerWords: string[];
  duration?: string;          // Tempo estimado de leitura/fala
  transitionPhrase?: string;  // Frase de transição para próximo estágio
}

export interface AIDATemplate {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email' | 'call' | 'presentation' | 'landing_page';
  targetProfile?: {
    disc?: string;
    vak?: string;
  };
  sections: AIDASection[];
  estimatedConversion: number;
  tips: string[];
}

export interface AIDAScript {
  id: string;
  contactId?: string;
  channel: string;
  sections: AIDASection[];
  totalDuration: string;
  adaptations: {
    ifPositive: string;
    ifNegative: string;
    ifNeutral: string;
  };
  generatedAt: string;
}

// ============================================
// 3. CTA - CALL TO ACTION
// ============================================
export type CTAType = 
  | 'primary'      // Ação principal
  | 'secondary'    // Ação alternativa
  | 'soft'         // Baixo comprometimento
  | 'urgent'       // Com urgência
  | 'exclusive'    // Com exclusividade
  | 'social'       // Com prova social
  | 'guarantee';   // Com garantia

export type CTAVerb = 
  | 'descobrir' | 'garantir' | 'reservar' | 'acessar' | 'começar'
  | 'aproveitar' | 'experimentar' | 'transformar' | 'conquistar' | 'dominar'
  | 'liberar' | 'desbloquear' | 'ativar' | 'receber' | 'obter';

export interface CTATemplate {
  id: string;
  type: CTAType;
  verb: CTAVerb;
  template: string;
  example: string;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  bestFor: string[];
  avoidFor: string[];
  discCompatibility: {
    D: number;  // 0-100
    I: number;
    S: number;
    C: number;
  };
}

export interface CTAVariation {
  original: string;
  variations: {
    text: string;
    type: CTAType;
    strength: number;
  }[];
  recommendedFor: {
    disc?: string;
    urgencyLevel?: string;
    channel?: string;
  };
}

// ============================================
// 4. TARGET SEGMENTATION
// ============================================
export interface TargetSegment {
  id: string;
  name: string;
  description: string;
  painPoints: string[];
  desires: string[];
  objections: string[];
  demographics?: {
    ageRange?: string;
    profession?: string;
    industry?: string;
    companySize?: string;
  };
  psychographics?: {
    values: string[];
    fears: string[];
    aspirations: string[];
  };
}

export interface IdealForSection {
  primaryAudience: string;
  secondaryAudiences: string[];
  notIdealFor: string[];
  qualifyingQuestions: string[];
  disqualifyingSignals: string[];
}

export interface SegmentationAnalysis {
  detectedSegments: TargetSegment[];
  idealForSection: IdealForSection;
  messagingRecommendations: {
    segment: string;
    keyMessage: string;
    avoidMessage: string;
  }[];
  confidence: number;
}

// ============================================
// 5. TRANSITION WORDS & CONNECTORS
// ============================================
export type TransitionCategory = 
  | 'contrast'      // Mas, porém, no entanto
  | 'addition'      // Além disso, também
  | 'cause'         // Porque, já que
  | 'consequence'   // Portanto, assim
  | 'emphasis'      // Principalmente, especialmente
  | 'example'       // Por exemplo, como
  | 'conclusion'    // Em resumo, finalmente
  | 'temporal'      // Primeiro, depois, agora
  | 'comparison';   // Assim como, da mesma forma

export interface TransitionWord {
  word: string;
  category: TransitionCategory;
  usage: string;
  example: string;
  formalLevel: 'informal' | 'neutral' | 'formal';
  persuasionStrength: number; // 1-5
}

export interface PersuasiveConnector {
  id: string;
  phrase: string;
  purpose: string;
  example: string;
  bestAfter: TransitionCategory[];
  bestBefore: TransitionCategory[];
  emotionalImpact: 'low' | 'medium' | 'high';
}

// ============================================
// 6. HEADLINE FORMULAS
// ============================================
export type HeadlineType = 
  | 'how_to'           // Como [fazer algo]
  | 'number_list'      // X maneiras de...
  | 'question'         // Você sabia que...?
  | 'command'          // Descubra, Aprenda...
  | 'testimonial'      // "Citação do cliente"
  | 'news'             // Novo, Lançamento
  | 'reason_why'       // Por que [algo acontece]
  | 'secret'           // O segredo para...
  | 'warning'          // Cuidado com...
  | 'guarantee';       // Garantido ou...

export interface HeadlineFormula {
  id: string;
  type: HeadlineType;
  formula: string;
  example: string;
  variables: string[];
  effectiveness: number; // 1-10
  bestFor: string[];
  powerWordsToUse: string[];
}

// ============================================
// 7. COMBINED COPYWRITING PROFILE
// ============================================
export interface CopywritingProfile {
  contactId?: string;
  fabAnalysis: FABAnalysis;
  aidaScript: AIDAScript;
  recommendedCTAs: CTATemplate[];
  segmentation: SegmentationAnalysis;
  headlines: HeadlineFormula[];
  transitionWords: TransitionWord[];
  overallScore: number;
  generatedAt: string;
}

// ============================================
// 8. COPYWRITING GENERATION OPTIONS
// ============================================
export interface CopywritingGenerationOptions {
  channel: 'whatsapp' | 'email' | 'call' | 'presentation' | 'landing_page';
  tone: 'formal' | 'casual' | 'urgent' | 'friendly' | 'professional';
  length: 'short' | 'medium' | 'long';
  includeEmoji: boolean;
  urgencyLevel: 1 | 2 | 3 | 4 | 5;
  targetDisc?: string;
  targetVak?: string;
  productOrService?: string;
  mainBenefit?: string;
  mainPain?: string;
}

// ============================================
// 9. PAS - PROBLEM, AGITATE, SOLUTION
// ============================================
export interface PASSection {
  stage: 'problem' | 'agitate' | 'solution';
  title: string;
  content: string;
  techniques: string[];
  emotionalIntensity: 1 | 2 | 3 | 4 | 5;
  tips: string[];
}

export interface PASTemplate {
  id: string;
  name: string;
  channel: string;
  targetProfile?: { disc?: string; vak?: string };
  sections: PASSection[];
  estimatedConversion: number;
}

export interface PASScript {
  id: string;
  problem: string;
  agitate: string;
  solution: string;
  generatedAt: string;
}

// ============================================
// 10. 4Ps - PROMISE, PICTURE, PROOF, PUSH
// ============================================
export interface FourPsSection {
  stage: 'promise' | 'picture' | 'proof' | 'push';
  title: string;
  content: string;
  techniques: string[];
  powerWords: string[];
}

export interface FourPsTemplate {
  id: string;
  name: string;
  channel: string;
  sections: FourPsSection[];
  bestFor: string[];
}

// ============================================
// 11. STORYTELLING STRUCTURES
// ============================================
export type StoryArc = 
  | 'hero_journey'        // Jornada do Herói
  | 'before_after'        // Antes e Depois
  | 'problem_solution'    // Problema → Solução
  | 'rags_to_riches'      // Da Lama ao Luxo
  | 'overcoming_monster'  // Superando Obstáculos
  | 'quest'               // A Busca
  | 'transformation';     // Transformação

export interface StoryElement {
  id: string;
  name: string;
  description: string;
  example: string;
  position: number;
}

export interface StorytellingTemplate {
  id: string;
  arc: StoryArc;
  name: string;
  description: string;
  elements: StoryElement[];
  emotionalPeaks: string[];
  bestFor: string[];
  example: string;
}

// ============================================
// 12. COPY ANALYZER
// ============================================
export interface ReadabilityMetrics {
  fleschScore: number;           // 0-100 (adaptado PT-BR)
  avgSentenceLength: number;
  avgWordLength: number;
  complexWordPercentage: number;
  level: 'muito_facil' | 'facil' | 'medio' | 'dificil' | 'muito_dificil';
  recommendation: string;
}

export interface TriggerDensity {
  totalTriggers: number;
  triggersPerSentence: number;
  dominantTriggers: string[];
  missingTriggers: string[];
  saturationLevel: 'low' | 'optimal' | 'high';
  recommendation: string;
}

export interface EmotionalProfile {
  joy: number;
  trust: number;
  fear: number;
  surprise: number;
  sadness: number;
  disgust: number;
  anger: number;
  anticipation: number;
  urgency: number;
}

 export interface TextComplexity {
   longSentences: Array<{ text: string; startIndex: number; endIndex: number }>;
   complexWords: Array<{ text: string; startIndex: number; endIndex: number }>;
 }
 
export interface CopyAnalysis {
   complexity?: TextComplexity;
  id: string;
  originalText: string;
  readability: ReadabilityMetrics;
  triggerDensity: TriggerDensity;
  persuasionScore: number;        // 0-100
  emotionalScore: number;         // 0-100
  emotionalProfile?: EmotionalProfile;
  sentiment: 'positive' | 'neutral' | 'negative';
  clarityScore: number;           // 0-100
  ctaStrength: number;            // 0-100
  highlightedTriggers?: Array<{ text: string; category: string; startIndex: number; endIndex: number }>;
  issues: {
    issue: string;
    severity: 'low' | 'medium' | 'high';
    suggestion: string;
    location?: string;
  }[];
  strengths: string[];
  optimizedVersion?: string;
  generatedAt: string;
}

// ============================================
// 13. EMOJI INTELLIGENCE
// ============================================
export interface EmojiContext {
  category: 'urgency' | 'celebration' | 'trust' | 'growth' | 'money' | 'action' | 'warning' | 'love' | 'question';
  emojis: string[];
  usage: string;
  discCompatibility: { D: number; I: number; S: number; C: number };
  channelCompatibility: { whatsapp: number; email: number; call: number };
}

export interface EmojiSuggestion {
  position: 'start' | 'middle' | 'end' | 'inline';
  emoji: string;
  context: string;
  impact: 'low' | 'medium' | 'high';
}

// ============================================
// 14. MULTI-CHANNEL PREVIEW
// ============================================
export interface ChannelPreview {
  channel: 'whatsapp' | 'email' | 'instagram' | 'linkedin' | 'sms';
  formattedText: string;
  characterCount: number;
  characterLimit?: number;
  isWithinLimit: boolean;
  suggestions: string[];
  preview: {
    style: 'bubble' | 'card' | 'plain';
    backgroundColor?: string;
    textColor?: string;
  };
}

// ============================================
// 15. COPY HISTORY
// ============================================
export interface SavedCopy {
  id: string;
  contactId?: string;
  title: string;
  content: string;
  framework: 'fab' | 'aida' | 'pas' | '4ps' | 'storytelling' | 'custom';
  channel: string;
  tags: string[];
  performance?: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================
// 16. ENHANCED COPYWRITING PROFILE
// ============================================
export interface EnhancedCopywritingProfile extends CopywritingProfile {
  pasScript?: PASScript;
  fourPsScript?: FourPsSection[];
  storyTemplate?: StorytellingTemplate;
  copyAnalysis?: CopyAnalysis;
  emojiSuggestions?: EmojiSuggestion[];
  channelPreviews?: ChannelPreview[];
  savedCopies?: SavedCopy[];
}
