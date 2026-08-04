import { Contact, DISCProfile } from '@/types';
import { VAKProfile } from '@/types/vak';
import { MetaprogramProfile } from '@/types/metaprograms';
import { EQAnalysisResult } from '@/types/emotional-intelligence';
import { BiasAnalysisResult } from '@/types/cognitive-biases';

export interface ApproachPhase {
  id: string;
  name: string;
  priority: number;
  actions: string[];
  techniques: string[];
  scripts: string[];
  warnings: string[];
  timing: string;
  duration: string;
  successIndicators: string[];
}

export interface CommunicationChannel {
  channel: string;
  effectiveness: number;
  reason: string;
  bestTimeSlot: string;
  tips: string[];
}

export interface PersonalizedMessage {
  context: string;
  message: string;
  tone: string;
  keyPhrases: string[];
}

export interface ApproachRecommendation {
  overallStrategy: {
    name: string;
    description: string;
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    estimatedSuccessRate: number;
  };
  phases: ApproachPhase[];
  channels: CommunicationChannel[];
  personalizedMessages: PersonalizedMessage[];
  doAndDont: {
    do: string[];
    dont: string[];
  };
  objectionHandling: {
    objection: string;
    response: string;
    technique: string;
  }[];
  closingTechniques: {
    technique: string;
    script: string;
    effectiveness: number;
    bestFor: string;
  }[];
  urgencyTriggers: string[];
  trustBuilders: string[];
  decisionAccelerators: string[];
  keyMetrics: {
    name: string;
    value: string;
    impact: string;
  }[];
}

export interface UseApproachRecommendationProps {
  contact: Contact;
  vakProfile?: VAKProfile | null;
  metaprogramProfile?: MetaprogramProfile | null;
  eqResult?: EQAnalysisResult;
  biasResult?: BiasAnalysisResult;
  emotionalState?: string | null;
  topValues?: { name: string; importance?: number }[];
  activeTriggers?: { trigger: { id: string; name: string } }[];
  hiddenObjections?: { objection_type: string; indicator: string; suggested_probe?: string }[];
  rapportScore?: number;
}

export interface ApproachContext {
  discProfile: DISCProfile | undefined;
  vakType: string | undefined;
  firstName: string;
  contact: Contact;
  metaprogramProfile?: MetaprogramProfile | null;
  eqResult?: EQAnalysisResult;
  biasResult?: BiasAnalysisResult;
  topValues: { name: string; importance?: number }[];
  activeTriggers: { trigger: { id: string; name: string } }[];
  hiddenObjections: { objection_type: string; indicator: string; suggested_probe?: string }[];
  rapportScore: number;
  overallConfidence: number;
  calculateRiskLevel: () => 'low' | 'medium' | 'high';
}
