import { TriggerType } from '@/types/triggers';
import { TriggerResult } from '@/hooks/useTriggerHistory';

export type DISCProfile = 'D' | 'I' | 'S' | 'C';

export interface TriggerUsageWithContact {
  id: string;
  trigger_type: string;
  result: string;
  effectiveness_rating: number | null;
  used_at: string;
  contact_disc: DISCProfile | null;
}

export interface DISCTriggerStats {
  discProfile: DISCProfile;
  totalUsages: number;
  successRate: number;
  avgRating: number;
  topTriggers: Array<{
    type: TriggerType;
    count: number;
    successRate: number;
    avgRating: number;
  }>;
}

export interface TriggerEffectiveness {
  triggerType: TriggerType;
  totalUsages: number;
  successRate: number;
  avgRating: number;
  byDISC: Record<DISCProfile, { usages: number; successRate: number; avgRating: number }>;
}

export const DISC_COLORS: Record<DISCProfile, string> = {
  D: 'hsl(0, 84%, 60%)',
  I: 'hsl(45, 93%, 47%)',
  S: 'hsl(142, 76%, 36%)',
  C: 'hsl(221, 83%, 53%)',
};

export const DISC_BG_COLORS: Record<DISCProfile, string> = {
  D: 'bg-destructive/10 text-destructive',
  I: 'bg-warning/10 text-warning',
  S: 'bg-success/10 text-success',
  C: 'bg-info/10 text-info',
};

export const DISC_NAMES: Record<DISCProfile, string> = {
  D: 'Dominante',
  I: 'Influente',
  S: 'Estável',
  C: 'Conforme',
};

export const RESULT_COLORS: Record<TriggerResult, string> = {
  success: 'hsl(142, 76%, 36%)',
  neutral: 'hsl(215, 16%, 47%)',
  failure: 'hsl(0, 84%, 60%)',
  pending: 'hsl(45, 93%, 47%)',
};
