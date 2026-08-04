// Tipagem para o campo JSONB 'behavior' do Supabase
// Permite acesso tipado aos dados comportamentais

import { DISCProfile } from './index';
import { VAKType } from './vak';

// Interface unificada para o behavior JSONB que pode vir do Supabase
export interface BehaviorJson {
  // DISC Profile
  discProfile?: DISCProfile;
  disc?: DISCProfile; // Alias usado em alguns lugares
  discConfidence?: number;
  discNotes?: string;

  // VAK Profile - pode ter duas estruturas
  vakProfile?: {
    primary?: VAKType | null;
    secondary?: VAKType | null;
    confidence?: number;
    scores?: {
      visual?: number;
      auditory?: number;
      kinesthetic?: number;
      digital?: number;
    };
    // Formato alternativo
    visual?: number;
    auditory?: number;
    kinesthetic?: number;
  };

  // Motivations
  primaryMotivation?: string;
  primaryFear?: string;
  careerStage?: string;
  currentPressure?: string;
  professionalGoals?: string;

  // Communication Preferences
  preferredChannel?: string;
  messageStyle?: string;
  avgResponseTimeHours?: number;
  bestContactWindow?: string;
  formalityLevel?: number;

  // Decision Making
  decisionSpeed?: string;
  decisionCriteria?: string[];
  needsApproval?: boolean;
  approverContactId?: string;
  budgetAuthority?: string;

  // Influence & Power
  decisionRole?: string;
  decisionPower?: number;
  supportLevel?: number;
  influencedByIds?: string[];
  influencesIds?: string[];

  // Company Context
  companyFinancialHealth?: string;
  currentChallenges?: string[];
  competitorsUsed?: string[];
  bestTimeToApproach?: string;
  seasonalNotes?: string;
}

// Type guard para verificar se behavior é um objeto válido
export function isBehaviorJson(value: unknown): value is BehaviorJson {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Função helper para acessar behavior de forma segura
export function getBehavior(behavior: unknown): BehaviorJson | null {
  if (isBehaviorJson(behavior)) {
    return behavior;
  }
  return null;
}

// Função helper para extrair DISC profile
export function getDISCProfile(behavior: unknown): DISCProfile {
  const b = getBehavior(behavior);
  return b?.discProfile ?? b?.disc ?? null;
}

// Função helper para extrair VAK profile primary
export function getVAKPrimary(behavior: unknown): VAKType | null {
  const b = getBehavior(behavior);
  return b?.vakProfile?.primary ?? null;
}

// Função helper para extrair VAK profile secondary
export function getVAKSecondary(behavior: unknown): VAKType | null {
  const b = getBehavior(behavior);
  return b?.vakProfile?.secondary ?? null;
}

// Função helper para extrair VAK confidence
export function getVAKConfidence(behavior: unknown): number {
  const b = getBehavior(behavior);
  return b?.vakProfile?.confidence ?? 50;
}
