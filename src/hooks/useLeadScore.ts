import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export type LeadGrade = 'cold' | 'warm' | 'hot' | 'on_fire';

export interface LeadScore {
  id: string;
  contact_id: string;
  total_score: number;
  grade: LeadGrade;
  engagement_score: number;
  fit_score: number;
  intent_score: number;
  relationship_score: number;
  score_factors: ScoreFactor[];
  score_change: number;
  previous_score: number;
  last_calculated_at: string;
}

export interface ScoreFactor {
  dimension: 'engagement' | 'fit' | 'intent' | 'relationship';
  factor: string;
  value: number;
  maxValue: number;
  description: string;
}

export interface LeadScoreConfig {
  id: string;
  weight_engagement: number;
  weight_fit: number;
  weight_intent: number;
  weight_relationship: number;
  grade_thresholds: { cold: number; warm: number; hot: number; on_fire: number };
  auto_recalculate: boolean;
  recalculate_interval_hours: number;
}

const GRADE_CONFIG: Record<LeadGrade, { label: string; color: string; emoji: string }> = {
  cold: { label: 'Frio', color: 'text-blue-500', emoji: '🧊' },
  warm: { label: 'Morno', color: 'text-yellow-500', emoji: '☀️' },
  hot: { label: 'Quente', color: 'text-orange-500', emoji: '🔥' },
  on_fire: { label: 'Em Chamas', color: 'text-red-500', emoji: '🚀' },
};

export { GRADE_CONFIG };

// ====== Cálculo client-side do score ======

interface ContactData {
  id: string;
  relationship_score: number | null;
  interactions_count: number;
  last_interaction_days: number | null;
  has_disc: boolean;
  has_eq: boolean;
  has_vak: boolean;
  has_metaprogram: boolean;
  profile_completeness: number; // 0-100
  active_deals: number;
  deal_stage_max: number; // 0-5 (higher = closer to close)
  response_rate: number; // 0-100
  rapport_score: number | null;
  churn_risk: number | null; // 0-100 (lower = better)
  hidden_objections_count: number;
  cadence_on_track: boolean;
}

function calculateEngagement(data: ContactData): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let total = 0;

  // Interaction recency (0-30 pts)
  const recencyScore = data.last_interaction_days === null ? 0 :
    data.last_interaction_days <= 3 ? 30 :
    data.last_interaction_days <= 7 ? 25 :
    data.last_interaction_days <= 14 ? 18 :
    data.last_interaction_days <= 30 ? 10 : 3;
  total += recencyScore;
  factors.push({ dimension: 'engagement', factor: 'Recência', value: recencyScore, maxValue: 30, description: data.last_interaction_days === null ? 'Sem interações' : `${data.last_interaction_days}d atrás` });

  // Interaction volume (0-25 pts)
  const volumeScore = Math.min(25, data.interactions_count * 2.5);
  total += volumeScore;
  factors.push({ dimension: 'engagement', factor: 'Volume', value: Math.round(volumeScore), maxValue: 25, description: `${data.interactions_count} interações` });

  // Response rate (0-25 pts)
  const responseScore = (data.response_rate / 100) * 25;
  total += responseScore;
  factors.push({ dimension: 'engagement', factor: 'Taxa de Resposta', value: Math.round(responseScore), maxValue: 25, description: `${Math.round(data.response_rate)}%` });

  // Cadence adherence (0-20 pts)
  const cadenceScore = data.cadence_on_track ? 20 : 5;
  total += cadenceScore;
  factors.push({ dimension: 'engagement', factor: 'Cadência', value: cadenceScore, maxValue: 20, description: data.cadence_on_track ? 'Em dia' : 'Atrasada' });

  return { score: Math.min(100, total), factors };
}

function calculateFit(data: ContactData): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let total = 0;

  // Profile completeness (0-30 pts)
  const completenessScore = (data.profile_completeness / 100) * 30;
  total += completenessScore;
  factors.push({ dimension: 'fit', factor: 'Perfil Completo', value: Math.round(completenessScore), maxValue: 30, description: `${Math.round(data.profile_completeness)}%` });

  // Behavioral profiles (0-40 pts, 10 each)
  const profileScore = (data.has_disc ? 10 : 0) + (data.has_eq ? 10 : 0) + (data.has_vak ? 10 : 0) + (data.has_metaprogram ? 10 : 0);
  total += profileScore;
  factors.push({ dimension: 'fit', factor: 'Perfis Comportamentais', value: profileScore, maxValue: 40, description: `${[data.has_disc && 'DISC', data.has_eq && 'EQ', data.has_vak && 'VAK', data.has_metaprogram && 'Meta'].filter(Boolean).join(', ') || 'Nenhum'}` });

  // Low churn risk (0-30 pts)
  const churnScore = data.churn_risk === null ? 15 : Math.max(0, 30 - (data.churn_risk / 100) * 30);
  total += churnScore;
  factors.push({ dimension: 'fit', factor: 'Baixo Risco Churn', value: Math.round(churnScore), maxValue: 30, description: data.churn_risk === null ? 'N/A' : `Risco ${Math.round(data.churn_risk)}%` });

  return { score: Math.min(100, total), factors };
}

function calculateIntent(data: ContactData): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let total = 0;

  // Active deals (0-35 pts)
  const dealScore = Math.min(35, data.active_deals * 15);
  total += dealScore;
  factors.push({ dimension: 'intent', factor: 'Deals Ativos', value: dealScore, maxValue: 35, description: `${data.active_deals} deal(s)` });

  // Deal stage proximity (0-35 pts)
  const stageScore = (data.deal_stage_max / 5) * 35;
  total += stageScore;
  factors.push({ dimension: 'intent', factor: 'Estágio do Deal', value: Math.round(stageScore), maxValue: 35, description: data.active_deals > 0 ? `Nível ${data.deal_stage_max}/5` : 'Sem deal' });

  // Few hidden objections (0-30 pts)
  const objectionScore = Math.max(0, 30 - data.hidden_objections_count * 10);
  total += objectionScore;
  factors.push({ dimension: 'intent', factor: 'Objeções Ocultas', value: objectionScore, maxValue: 30, description: data.hidden_objections_count === 0 ? 'Nenhuma' : `${data.hidden_objections_count} detectada(s)` });

  return { score: Math.min(100, total), factors };
}

function calculateRelationship(data: ContactData): { score: number; factors: ScoreFactor[] } {
  const factors: ScoreFactor[] = [];
  let total = 0;

  // Relationship score (0-40 pts)
  const relScore = ((data.relationship_score ?? 0) / 100) * 40;
  total += relScore;
  factors.push({ dimension: 'relationship', factor: 'Score Relacionamento', value: Math.round(relScore), maxValue: 40, description: `${data.relationship_score ?? 0}/100` });

  // Rapport (0-35 pts)
  const rapportVal = ((data.rapport_score ?? 0) / 100) * 35;
  total += rapportVal;
  factors.push({ dimension: 'relationship', factor: 'Rapport', value: Math.round(rapportVal), maxValue: 35, description: `${Math.round(data.rapport_score ?? 0)}/100` });

  // Cadence on track (0-25 pts)
  const cadScore = data.cadence_on_track ? 25 : 8;
  total += cadScore;
  factors.push({ dimension: 'relationship', factor: 'Frequência OK', value: cadScore, maxValue: 25, description: data.cadence_on_track ? 'Ativa' : 'Irregular' });

  return { score: Math.min(100, total), factors };
}

function getGrade(score: number, thresholds: LeadScoreConfig['grade_thresholds']): LeadGrade {
  if (score >= thresholds.on_fire) return 'on_fire';
  if (score >= thresholds.hot) return 'hot';
  if (score >= thresholds.warm) return 'warm';
  return 'cold';
}

export function computeLeadScore(
  data: ContactData,
  weights = { engagement: 0.30, fit: 0.20, intent: 0.25, relationship: 0.25 },
  thresholds = { cold: 0, warm: 30, hot: 60, on_fire: 85 }
) {
  const engagement = calculateEngagement(data);
  const fit = calculateFit(data);
  const intent = calculateIntent(data);
  const relationship = calculateRelationship(data);

  const total = Math.round(
    engagement.score * weights.engagement +
    fit.score * weights.fit +
    intent.score * weights.intent +
    relationship.score * weights.relationship
  );

  return {
    total_score: Math.min(100, total),
    grade: getGrade(total, thresholds),
    engagement_score: Math.round(engagement.score),
    fit_score: Math.round(fit.score),
    intent_score: Math.round(intent.score),
    relationship_score: Math.round(relationship.score),
    score_factors: [
      ...engagement.factors,
      ...fit.factors,
      ...intent.factors,
      ...relationship.factors,
    ],
  };
}

// ====== Hook principal ======

export function useLeadScore(contactId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-score', contactId],
    queryFn: async () => {
      if (!contactId || !user?.id) return null;
      const { data, error } = await supabase
        .from('lead_scores')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        total_score: Number(data.total_score),
        engagement_score: Number(data.engagement_score),
        fit_score: Number(data.fit_score),
        intent_score: Number(data.intent_score),
        relationship_score: Number(data.relationship_score),
        score_change: Number(data.score_change),
        previous_score: Number(data.previous_score),
        score_factors: (data.score_factors ?? []) as unknown as ScoreFactor[],
      } as LeadScore;
    },
    enabled: !!contactId && !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useLeadScoreHistory(contactId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-score-history', contactId],
    queryFn: async () => {
      if (!contactId || !user?.id) return [];
      const { data, error } = await supabase
        .from('lead_score_history')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: true })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!contactId && !!user?.id,
    staleTime: 10 * 60 * 1000,
  });
}

export function useLeadScoreConfig() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-score-config', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('lead_score_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        ...data,
        weight_engagement: Number(data.weight_engagement),
        weight_fit: Number(data.weight_fit),
        weight_intent: Number(data.weight_intent),
        weight_relationship: Number(data.weight_relationship),
        grade_thresholds: (data.grade_thresholds ?? { cold: 0, warm: 30, hot: 60, on_fire: 85 }) as unknown as LeadScoreConfig['grade_thresholds'],
      } as LeadScoreConfig;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCalculateLeadScore() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, contactData }: { contactId: string; contactData: ContactData }) => {
      if (!user?.id) throw new Error('Não autenticado');

      // Config and previous score are independent — fetch in parallel
      const [{ data: config }, { data: existing }] = await Promise.all([
        supabase.from('lead_score_config').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('lead_scores').select('total_score').eq('contact_id', contactId).eq('user_id', user.id).maybeSingle(),
      ]);

      const weights = config
        ? { engagement: Number(config.weight_engagement), fit: Number(config.weight_fit), intent: Number(config.weight_intent), relationship: Number(config.weight_relationship) }
        : undefined;

      const thresholds = config?.grade_thresholds
        ? config.grade_thresholds as LeadScoreConfig['grade_thresholds']
        : undefined;

      const result = computeLeadScore(contactData, weights, thresholds);
      const previousScore = existing?.total_score ? Number(existing.total_score) : 0;

      // Upsert score
      const upsertPayload = {
        contact_id: contactId,
        user_id: user.id,
        total_score: result.total_score,
        grade: result.grade,
        engagement_score: result.engagement_score,
        fit_score: result.fit_score,
        intent_score: result.intent_score,
        relationship_score: result.relationship_score,
        score_factors: JSON.parse(JSON.stringify(result.score_factors)),
        weight_engagement: weights?.engagement ?? 0.30,
        weight_fit: weights?.fit ?? 0.20,
        weight_intent: weights?.intent ?? 0.25,
        weight_relationship: weights?.relationship ?? 0.25,
        last_calculated_at: new Date().toISOString(),
        score_change: result.total_score - previousScore,
        previous_score: previousScore,
      };
      const { error } = await supabase
        .from('lead_scores')
        .upsert([upsertPayload], { onConflict: 'contact_id,user_id' });

      if (error) throw error;

      // Record history (fire-and-forget — response uses in-memory result)
      void supabase.from('lead_score_history').insert({
        contact_id: contactId,
        user_id: user.id,
        total_score: result.total_score,
        grade: result.grade,
        engagement_score: result.engagement_score,
        fit_score: result.fit_score,
        intent_score: result.intent_score,
        relationship_score: result.relationship_score,
      }).catch((e: unknown) => logger.error('lead_score_history insert error:', e));

      return { ...result, score_change: result.total_score - previousScore, previous_score: previousScore };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-score', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['lead-score-history', variables.contactId] });
      toast.success('Lead Score calculado com sucesso');
    },
    onError: (err) => {
      logger.error('Error calculating lead score', err);
      toast.error('Erro ao calcular Lead Score');
    },
  });
}

export function useAllLeadScores() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['lead-scores-all'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('lead_scores')
        .select('*, contacts:contact_id(first_name, last_name, company_id)')
        .eq('user_id', user.id)
        .order('total_score', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}
