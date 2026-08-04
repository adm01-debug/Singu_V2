// Core Types for SINGU System - Extended Behavioral Model

import { TemperamentProfile } from './temperament';

export type ContactRole = 'owner' | 'manager' | 'buyer' | 'contact' | 'decision_maker' | 'influencer';

export type InteractionType = 'whatsapp' | 'call' | 'email' | 'meeting' | 'note' | 'social';

export type SentimentType = 'positive' | 'neutral' | 'negative';

// Personality Framework Types
export interface BigFiveProfile {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  confidence: number;
  analyzedAt: string;
}

export interface MBTIProfile {
  type: string;
  confidence: number;
  dimensions: {
    E_I: { E: number; I: number };
    S_N: { S: number; N: number };
    T_F: { T: number; F: number };
    J_P: { J: number; P: number };
  };
  analyzedAt: string;
}

export interface EnneagramProfile {
  type: number;
  wing: number | null;
  confidence: number;
  scores: Record<number, number>;
  analyzedAt: string;
}

// DISC Profile Types
export type DISCProfile = 'D' | 'I' | 'S' | 'C' | null;

export type CommunicationStyle = 'formal' | 'casual' | 'technical' | 'emotional';

export type PreferredChannel = 'whatsapp' | 'call' | 'email' | 'meeting' | 'video';

export type MessageStyle = 'audio' | 'short_text' | 'long_text' | 'documents';

export type DecisionSpeed = 'impulsive' | 'fast' | 'moderate' | 'slow';

export type DecisionRole = 'final_decision' | 'technical' | 'economic' | 'user' | 'blocker' | 'champion';

export type CareerStage = 'early' | 'growth' | 'established' | 'transition' | 'senior';

export type CompanyHealth = 'growing' | 'stable' | 'cutting' | 'unknown';

export type FormalityLevel = 1 | 2 | 3 | 4 | 5;

export type RelationshipStage = 
  | 'unknown' 
  | 'prospect' 
  | 'qualified_lead' 
  | 'opportunity' 
  | 'negotiation' 
  | 'customer' 
  | 'loyal_customer' 
  | 'advocate' 
  | 'at_risk' 
  | 'lost';


// Decision Criteria
export type DecisionCriteria = 
  | 'price' 
  | 'quality' 
  | 'relationship' 
  | 'speed' 
  | 'support' 
  | 'innovation' 
  | 'reputation' 
  | 'referral';

export const DISC_LABELS: Record<string, { name: string; description: string; color: string }> = {
  D: { name: 'Dominante', description: 'Direto, decisivo, focado em resultados', color: 'bg-destructive/10 text-destructive border-destructive/20' },
  I: { name: 'Influente', description: 'Entusiasta, otimista, focado em pessoas', color: 'bg-warning/10 text-warning border-warning/20' },
  S: { name: 'Estável', description: 'Paciente, confiável, focado em segurança', color: 'bg-success/10 text-success border-success/20' },
  C: { name: 'Conforme', description: 'Analítico, preciso, focado em qualidade', color: 'bg-info/10 text-info border-info/20' },
};

export const DECISION_ROLE_LABELS: Record<DecisionRole, string> = {
  final_decision: 'Decisor Final',
  technical: 'Influenciador Técnico',
  economic: 'Influenciador Econômico',
  user: 'Usuário Final',
  blocker: 'Bloqueador',
  champion: 'Defensor Interno',
};

export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  early: 'Início de Carreira',
  growth: 'Crescimento',
  established: 'Consolidado',
  transition: 'Transição',
  senior: 'Sênior/Experiente',
};

export const DECISION_SPEED_LABELS: Record<DecisionSpeed, string> = {
  impulsive: 'Impulsivo',
  fast: 'Rápido',
  moderate: 'Moderado',
  slow: 'Lento',
};

export const DECISION_CRITERIA_LABELS: Record<DecisionCriteria, string> = {
  price: 'Preço',
  quality: 'Qualidade',
  relationship: 'Relacionamento',
  speed: 'Velocidade',
  support: 'Suporte',
  innovation: 'Inovação',
  reputation: 'Reputação',
  referral: 'Indicação',
};

export const RELATIONSHIP_STAGE_LABELS: Record<RelationshipStage, string> = {
  unknown: 'Desconhecido',
  prospect: 'Prospect',
  qualified_lead: 'Lead Qualificado',
  opportunity: 'Oportunidade',
  negotiation: 'Negociação',
  customer: 'Cliente',
  loyal_customer: 'Cliente Fiel',
  advocate: 'Promotor/Advogado',
  at_risk: 'Em Risco',
  lost: 'Perdido',
};


export interface Company {
  id: string;
  name: string;
  industry: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  logo?: string;
  notes?: string;
  tags: string[];
  contactCount: number;
  lastInteraction?: Date;
  // New fields
  financialHealth: CompanyHealth;
  employeeCount?: string;
  annualRevenue?: string;
  competitors: string[];
  challenges: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LifeEvent {
  id: string;
  type: 'birthday' | 'anniversary' | 'promotion' | 'travel' | 'family' | 'achievement' | 'other';
  title: string;
  date: Date;
  notes?: string;
  reminder: boolean;
}

// VAK Profile
export interface VAKProfile {
  visual: number;
  auditory: number;
  kinesthetic: number;
  primary: 'V' | 'A' | 'K';
}

export interface ContactBehavior {
  // DISC Profile
  discProfile: DISCProfile;
  discConfidence: number; // 0-100
  discNotes?: string;
  
  // VAK Profile
  vakProfile?: VAKProfile;
  
  // Motivations
  primaryMotivation?: string;
  primaryFear?: string;
  careerStage?: CareerStage;
  currentPressure?: string;
  professionalGoals?: string;
  
  // Communication Preferences
  preferredChannel: PreferredChannel;
  messageStyle?: MessageStyle;
  avgResponseTimeHours?: number;
  bestContactWindow?: string;
  formalityLevel: FormalityLevel;
  
  // Decision Making
  decisionSpeed?: DecisionSpeed;
  decisionCriteria: DecisionCriteria[];
  needsApproval: boolean;
  approverContactId?: string;
  budgetAuthority?: string;
  
  // Influence & Power
  decisionRole?: DecisionRole;
  decisionPower: number; // 1-10
  supportLevel: number; // 1-10
  influencedByIds: string[];
  influencesIds: string[];
  
  // Company Context
  companyFinancialHealth?: CompanyHealth;
  currentChallenges: string[];
  competitorsUsed: string[];
  bestTimeToApproach?: string;
  seasonalNotes?: string;
  
  // Personality Frameworks (optional enrichment)
  temperamentProfile?: TemperamentProfile;
  bigFiveProfile?: BigFiveProfile;
  mbtiProfile?: MBTIProfile;
  enneagramProfile?: EnneagramProfile;
}

export interface Contact {
  id: string;
  companyId: string;
  companyName: string;
  firstName: string;
  lastName: string;
  role: ContactRole;
  roleTitle: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  avatar?: string;
  birthday?: Date;
  notes?: string;
  tags: string[];
  
  // Communication Style (legacy - keeping for compatibility)
  communicationStyle?: CommunicationStyle;
  preferredContactMethod?: PreferredChannel;
  bestTimeToContact?: string;
  
  // Personal Interests
  hobbies: string[];
  interests: string[];
  familyInfo?: string;
  personalNotes?: string;
  
  // Relationship Status
  relationshipStage: RelationshipStage;
  relationshipScore: number; // 0-100
  lastInteraction?: Date;
  interactionCount: number;
  sentiment: SentimentType;
  daysSinceContact?: number;
  
  // Extended Behavioral Profile
  behavior: ContactBehavior;
  
  // Life Events
  lifeEvents: LifeEvent[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface Interaction {
  id: string;
  contactId: string;
  companyId: string;
  type: InteractionType;
  title: string;
  content: string;
  audioUrl?: string;
  transcription?: string;
  sentiment: SentimentType;
  tags: string[];
  duration?: number; // in seconds for calls
  attachments?: string[];
  // New fields
  initiatedBy: 'us' | 'them';
  responseTime?: number; // in minutes
  keyInsights?: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  createdAt: Date;
}

export interface Insight {
  id: string;
  contactId: string;
  category: 'personality' | 'preference' | 'behavior' | 'opportunity' | 'risk' | 'relationship';
  title: string;
  description: string;
  confidence: number; // 0-100
  source: string;
  actionable: boolean;
  actionSuggestion?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export interface Activity {
  id: string;
  type: 'company_created' | 'contact_created' | 'interaction_added' | 'insight_generated' | 'tag_added' | 'profile_updated' | 'alert_triggered';
  entityType: 'company' | 'contact' | 'interaction';
  entityId: string;
  entityName: string;
  description: string;
  createdAt: Date;
}

export interface Alert {
  id: string;
  contactId: string;
  type: 'birthday' | 'no_contact' | 'sentiment_drop' | 'opportunity' | 'follow_up' | 'life_event';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  actionUrl?: string;
  dismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
}

export interface DashboardStats {
  totalCompanies: number;
  totalContacts: number;
  interactionsThisWeek: number;
  averageRelationshipScore: number;
  topCompanies: Company[];
  recentActivities: Activity[];
  upcomingFollowUps: Contact[];
  alerts: Alert[];
}
