import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export type LeadScoreGrade = 'A' | 'B' | 'C' | 'D';

export interface LeadScoreRow {
  id: string;
  user_id: string;
  contact_id: string;
  fit_score: number;
  engagement_score: number;
  intent_score: number;
  relationship_score: number;
  total_score: number;
  grade: string;
  score_change: number | null;
  previous_score: number | null;
  computed_at: string;
  last_calculated_at: string;
}

export interface LeadScoreHistoryRow {
  id: string;
  contact_id: string;
  total_score: number;
  grade: string;
  fit_score: number;
  engagement_score: number;
  intent_score: number;
  relationship_score: number;
  breakdown: Record<string, unknown>;
  recorded_at: string;
}

export interface LeadScoreRule {
  id: string;
  dimension: 'fit' | 'engagement' | 'intent' | 'relationship';
  signal_key: string;
  weight: number;
  decay_days: number;
  active: boolean;
}

export interface LeadScoreThreshold {
  id: string;
  grade: LeadScoreGrade;
  min_score: number;
}

const STALE = 5 * 60 * 1000;

export function useLeadScore(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lead-score', contactId, user?.id],
    queryFn: async () => {
      if (!contactId || !user?.id) return null;
      const { data } = await supabase
        .from('lead_scores').select('id, user_id, contact_id, fit_score, engagement_score, intent_score, relationship_score, total_score, grade, score_change, previous_score, computed_at, last_calculated_at')
        .eq('contact_id', contactId).eq('user_id', user.id).maybeSingle();
      return data as LeadScoreRow | null;
    },
    enabled: !!contactId && !!user?.id,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
}

export function useTopLeads(grade?: LeadScoreGrade | 'all', limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lead-scores-top', grade, limit, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      let q = supabase
        .from('lead_scores')
        .select('*, contact:contacts(id, first_name, last_name, email, company_id, role_title)')
        .eq('user_id', user.id)
        .order('total_score', { ascending: false })
        .limit(limit);
      if (grade && grade !== 'all') q = q.eq('grade', grade);
      const { data } = await q;
      return (data ?? []) as Array<LeadScoreRow & { contact: { id: string; first_name?: string; last_name?: string; email?: string; role_title?: string; company_id?: string } | null }>;
    },
    enabled: !!user?.id,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
}

export function useLeadScoreDistribution() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lead-scores-distribution', user?.id],
    queryFn: async () => {
      if (!user?.id) return { A: 0, B: 0, C: 0, D: 0, avg: 0, total: 0, changes24h: 0 };
      const { data } = await supabase
        .from('lead_scores').select('grade, total_score, computed_at, score_change')
        .eq('user_id', user.id);
      const rows = (data ?? []) as Array<Pick<LeadScoreRow, 'grade' | 'total_score' | 'computed_at' | 'score_change'>>;
      const out = { A: 0, B: 0, C: 0, D: 0, avg: 0, total: rows.length, changes24h: 0 };
      const since = Date.now() - 86_400_000;
      let sum = 0;
      for (const r of rows) {
        const g = (['A','B','C','D'].includes(r.grade) ? r.grade : 'D') as LeadScoreGrade;
        out[g]++;
        sum += Number(r.total_score);
        if (r.computed_at && new Date(r.computed_at).getTime() >= since && Math.abs(Number(r.score_change ?? 0)) > 0) {
          out.changes24h++;
        }
      }
      out.avg = rows.length ? Math.round((sum / rows.length) * 10) / 10 : 0;
      return out;
    },
    enabled: !!user?.id,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
}

export function useLeadScoreHistory(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lead-score-history-srv', contactId, user?.id],
    queryFn: async () => {
      if (!contactId || !user?.id) return [];
      const { data } = await supabase
        .from('lead_score_history').select('id, contact_id, total_score, grade, fit_score, engagement_score, intent_score, relationship_score, breakdown, recorded_at')
        .eq('contact_id', contactId).eq('user_id', user.id)
        .order('recorded_at', { ascending: true }).limit(100);
      return (data ?? []) as LeadScoreHistoryRow[];
    },
    enabled: !!contactId && !!user?.id,
    staleTime: STALE,
    refetchOnWindowFocus: false,
  });
}

export function useRecomputeLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: string) => {
      const { data, error } = await supabase.functions.invoke('lead-scorer', { body: { contact_id: contactId } });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, contactId) => {
      toast.success('Lead score recalculado');
      qc.invalidateQueries({ queryKey: ['lead-score', contactId] });
      qc.invalidateQueries({ queryKey: ['lead-scores-top'] });
      qc.invalidateQueries({ queryKey: ['lead-scores-distribution'] });
      qc.invalidateQueries({ queryKey: ['lead-score-history-srv', contactId] });
    },
    onError: (e) => toast.error(`Erro: ${parseApiError(e)}`),
  });
}

export function useRecomputeAllLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (limit?: number) => {
      const { data, error } = await supabase.functions.invoke('lead-scorer', { body: { batch: true, limit: limit ?? 100 } });
      if (error) throw error;
      return data as { processed: number };
    },
    onSuccess: (data) => {
      toast.success(`${data?.processed ?? 0} leads recalculados`);
      qc.invalidateQueries({ queryKey: ['lead-scores-top'] });
      qc.invalidateQueries({ queryKey: ['lead-scores-distribution'] });
    },
    onError: (e) => toast.error(`Erro: ${parseApiError(e)}`),
  });
}

export function useScoreRules() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lead-score-rules', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('lead_score_rules').select('id, dimension, signal_key, weight, decay_days, active')
        .eq('user_id', user.id)
        .order('dimension', { ascending: true })
        .order('signal_key', { ascending: true })
        .limit(100);
      return (data ?? []) as LeadScoreRule[];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateRule() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<LeadScoreRule> & { id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('lead_score_rules').update({
        weight: rule.weight,
        decay_days: rule.decay_days,
        active: rule.active,
      }).eq('user_id', user.id).eq('id', rule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Regra atualizada');
      qc.invalidateQueries({ queryKey: ['lead-score-rules'] });
    },
    onError: (e) => toast.error(parseApiError(e)),
  });
}

export function useScoreThresholds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lead-score-thresholds', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('lead_score_thresholds').select('id, grade, min_score')
        .eq('user_id', user.id).order('min_score', { ascending: false })
        .limit(20);
      return (data ?? []) as LeadScoreThreshold[];
    },
    enabled: !!user?.id,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateThreshold() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Pick<LeadScoreThreshold, 'id' | 'min_score'>) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('lead_score_thresholds').update({ min_score: t.min_score }).eq('user_id', user.id).eq('id', t.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Threshold atualizado');
      qc.invalidateQueries({ queryKey: ['lead-score-thresholds'] });
    },
    onError: (e) => toast.error(parseApiError(e)),
  });
}
