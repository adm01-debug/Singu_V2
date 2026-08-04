import { DISCProfile } from '@/types';
import { TriggerUsageEntry } from '@/hooks/useTriggerHistory';

export interface TemplateHistoryByProfileProps {
  className?: string;
}

export interface ContactDISCInfo {
  contactId: string;
  contactName: string;
  discProfile: DISCProfile;
}

export interface ProfileMetrics {
  profile: DISCProfile;
  totalUsages: number;
  successCount: number;
  successRate: number;
  avgRating: number;
  topTemplates: {
    templateId: string;
    templateTitle: string;
    triggerType: string;
    usages: number;
    successRate: number;
    avgRating: number;
  }[];
  trend: 'up' | 'down' | 'stable';
  recentUsages: TriggerUsageEntry[];
}

export interface TemplateProfileMetrics {
  templateId: string;
  templateTitle: string;
  triggerType: string;
  byProfile: Record<DISCProfile, {
    usages: number;
    successCount: number;
    successRate: number;
    avgRating: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  totalUsages: number;
  overallSuccessRate: number;
  bestProfile: DISCProfile | null;
  worstProfile: DISCProfile | null;
}

export const DISC_CONFIG: Record<DISCProfile, { label: string; color: string; bgColor: string; description: string }> = {
  D: {
    label: 'Dominante',
    color: 'text-destructive',
    bgColor: 'bg-destructive dark:bg-destructive/30',
    description: 'Direto, decisivo, focado em resultados',
  },
  I: {
    label: 'Influente',
    color: 'text-warning',
    bgColor: 'bg-warning dark:bg-warning/30',
    description: 'Entusiasta, persuasivo, otimista',
  },
  S: {
    label: 'Estável',
    color: 'text-success',
    bgColor: 'bg-success dark:bg-success/30',
    description: 'Paciente, confiável, trabalha em equipe',
  },
  C: {
    label: 'Analítico',
    color: 'text-info',
    bgColor: 'bg-info dark:bg-info/30',
    description: 'Preciso, analítico, focado em qualidade',
  },
};
