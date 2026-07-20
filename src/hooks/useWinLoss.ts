import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────

export type WinLossOutcome = 'won' | 'lost' | 'no_decision' | 'pending';
export type ReasonCategory = 'price' | 'product' | 'timing' | 'relationship' | 'competition' | 'budget' | 'authority' | 'need' | 'other';
export type ReasonOutcomeType = 'won' | 'lost' | 'both';
export type InsightType = 'pattern' | 'recommendation' | 'alert';
export type InsightSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface WinLossRecord {
  id: string;
  user_id: string;
  deal_id: string;
  outcome: WinLossOutcome;
  primary_reason_id: string | null;
  secondary_reasons: string[];
  competitor_id: string | null;
  deal_value: number | null;
  sales_cycle_days: number | null;
  decision_maker_contact_id: string | null;
  notes: string | null;
  lessons_learned: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface WinLossReason {
  id: string;
  user_id: string;
  category: ReasonCategory;
  label: string;
  outcome_type: ReasonOutcomeType;
  active: boolean;
  sort_order: number;
}

export interface Competitor {
  id: string;
  user_id: string;
  name: string;
  website: string | null;
  strengths: string[];
  weaknesses: string[];
  typical_price_range: string | null;
  win_rate_against: number;
  notes: string | null;
  active: boolean;
}

export interface WinLossInsight {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  insight_type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  supporting_data: Record<string, unknown>;
  generated_at: string;
}

interface RecordsFilter {
  outcome?: WinLossOutcome;
  competitor_id?: string;
  fromDate?: string;
}

// ── Records ──────────────────────────────────────────

export function useWinLossRecords(filters: RecordsFilter = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['win-loss-records', filters, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('win_loss_records')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(500);
      if (filters.outcome) q = q.eq('outcome', filters.outcome);
      if (filters.competitor_id) q = q.eq('competitor_id', filters.competitor_id);
      if (filters.fromDate) q = q.gte('recorded_at', filters.fromDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as WinLossRecord[];
    },
    staleTime: 60_000,
  });
}

export function useWinLossRecordByDeal(dealId: string | null | undefined) {
  return useQuery({
    queryKey: ['win-loss-record-by-deal', dealId],
    queryFn: async () => {
      if (!dealId) return null;
      const { data, error } = await supabase
        .from('win_loss_records')
        .select('*')
        .eq('deal_id', dealId)
        .maybeSingle();
      if (error) throw error;
      return data as WinLossRecord | null;
    },
    enabled: !!dealId,
  });
}

export function useUpsertWinLossRecord() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WinLossRecord> & { deal_id: string; outcome: WinLossOutcome }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('win_loss_records')
        .upsert({ ...payload, user_id: user.id }, { onConflict: 'user_id,deal_id' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao registrar Win/Loss");
      return data as WinLossRecord;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['win-loss-records'] });
      qc.invalidateQueries({ queryKey: ['win-loss-metrics'] });
      qc.invalidateQueries({ queryKey: ['win-loss-record-by-deal'] });
    },
    onError: () => toast.error('Erro ao registrar resultado'),
  });
}

export function useDeleteWinLossRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('win_loss_records').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['win-loss-records'] });
      qc.invalidateQueries({ queryKey: ['win-loss-metrics'] });
    },
    onError: () => toast.error('Erro ao remover registro'),
  });
}

// ── Reasons ──────────────────────────────────────────

export function useWinLossReasons(outcome?: ReasonOutcomeType) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['win-loss-reasons', outcome, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase
        .from('win_loss_reasons')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (outcome) q = q.in('outcome_type', [outcome, 'both']);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as WinLossReason[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpsertReason() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<WinLossReason> & { category: ReasonCategory; label: string; outcome_type: ReasonOutcomeType }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('win_loss_reasons')
        .upsert({ ...r, user_id: user.id }, { onConflict: 'user_id,category,label' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao salvar motivo");
      return data as WinLossReason;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['win-loss-reasons'] }),
    onError: () => toast.error('Erro ao salvar motivo'),
  });
}

export function useDeleteReason() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('win_loss_reasons').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['win-loss-reasons'] }),
    onError: () => toast.error('Erro ao remover motivo'),
  });
}

export function useSeedReasons() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: Error | null }>)('seed_win_loss_defaults', { _user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['win-loss-reasons'] }),
    onError: () => toast.error('Erro ao configurar motivos padrão'),
  });
}

// ── Competitors ──────────────────────────────────────

export function useCompetitors() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['competitors', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return (data ?? []) as Competitor[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpsertCompetitor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Competitor> & { name: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('competitors')
        .upsert({ ...c, user_id: user.id }, { onConflict: 'user_id,name' })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao salvar competidor");
      return data as Competitor;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitors'] }),
    onError: () => toast.error('Erro ao salvar concorrente'),
  });
}

export function useDeleteCompetitor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('competitors').update({ active: false }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['competitors'] }),
    onError: () => toast.error('Erro ao remover concorrente'),
  });
}

// ── Metrics ─────────────────────────────────────────

export interface WinLossMetrics {
  total: number;
  won: number;
  lost: number;
  pending: number;
  win_rate: number;
  avg_won_value: number;
  avg_lost_value: number;
  avg_cycle_won: number;
  top_loss_reason: { id: string; label: string; count: number } | null;
  reason_distribution: Array<{ id: string; label: string; won: number; lost: number }>;
  competitor_distribution: Array<{ id: string; name: string; won: number; lost: number; rate: number }>;
}

export function useWinLossMetrics(periodDays = 90) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['win-loss-metrics', periodDays, user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WinLossMetrics> => {
      const fromDate = new Date(Date.now() - periodDays * 86400_000).toISOString();
      const { data: records, error } = await supabase
        .from('win_loss_records')
        .select('*')
        .gte('recorded_at', fromDate);
      if (error) throw error;

      const list = (records ?? []) as WinLossRecord[];
      const won = list.filter(r => r.outcome === 'won');
      const lost = list.filter(r => r.outcome === 'lost');
      const pending = list.filter(r => r.outcome === 'pending').length;
      const decided = won.length + lost.length;
      const winRate = decided > 0 ? (won.length / decided) * 100 : 0;
      const avgWon = won.length > 0 ? won.reduce((s, r) => s + Number(r.deal_value || 0), 0) / won.length : 0;
      const avgLost = lost.length > 0 ? lost.reduce((s, r) => s + Number(r.deal_value || 0), 0) / lost.length : 0;
      const cyclesWon = won.filter(r => r.sales_cycle_days != null);
      const avgCycleWon = cyclesWon.length > 0 ? cyclesWon.reduce((s, r) => s + (r.sales_cycle_days || 0), 0) / cyclesWon.length : 0;

      // Reason distribution
      const reasonMap = new Map<string, { won: number; lost: number }>();
      list.forEach(r => {
        if (!r.primary_reason_id) return;
        const cur = reasonMap.get(r.primary_reason_id) ?? { won: 0, lost: 0 };
        if (r.outcome === 'won') cur.won++;
        if (r.outcome === 'lost') cur.lost++;
        reasonMap.set(r.primary_reason_id, cur);
      });
      const reasonIds = [...reasonMap.keys()];

      // Competitor distribution
      const compMap = new Map<string, { won: number; lost: number }>();
      list.forEach(r => {
        if (!r.competitor_id) return;
        const cur = compMap.get(r.competitor_id) ?? { won: 0, lost: 0 };
        if (r.outcome === 'won') cur.won++;
        if (r.outcome === 'lost') cur.lost++;
        compMap.set(r.competitor_id, cur);
      });
      const compIds = [...compMap.keys()];

      const [{ data: reasons }, { data: comps }] = await Promise.all([
        reasonIds.length > 0 ? supabase.from('win_loss_reasons').select('id, label').in('id', reasonIds) : Promise.resolve({ data: [] }),
        compIds.length > 0 ? supabase.from('competitors').select('id, name').in('id', compIds) : Promise.resolve({ data: [] }),
      ]);

      const reasonLabels = new Map((reasons ?? []).map((r: { id: string; label: string }) => [r.id, r.label]));
      const reasonDist = [...reasonMap.entries()].map(([id, c]) => ({
        id, label: reasonLabels.get(id) ?? '?', won: c.won, lost: c.lost,
      })).sort((a, b) => (b.won + b.lost) - (a.won + a.lost));
      const topLoss = reasonDist.filter(r => r.lost > 0).sort((a, b) => b.lost - a.lost)[0];
      const compNames = new Map((comps ?? []).map((c: { id: string; name: string }) => [c.id, c.name]));
      const compDist = [...compMap.entries()].map(([id, c]) => {
        const total = c.won + c.lost;
        return {
          id, name: compNames.get(id) ?? '?',
          won: c.won, lost: c.lost,
          rate: total > 0 ? (c.won / total) * 100 : 0,
        };
      }).sort((a, b) => (b.won + b.lost) - (a.won + a.lost));

      return {
        total: list.length,
        won: won.length,
        lost: lost.length,
        pending,
        win_rate: Number(winRate.toFixed(1)),
        avg_won_value: Number(avgWon.toFixed(2)),
        avg_lost_value: Number(avgLost.toFixed(2)),
        avg_cycle_won: Number(avgCycleWon.toFixed(1)),
        top_loss_reason: topLoss ? { id: topLoss.id, label: topLoss.label, count: topLoss.lost } : null,
        reason_distribution: reasonDist,
        competitor_distribution: compDist,
      };
    },
    staleTime: 60_000,
  });
}

// ── Insights ────────────────────────────────────────

export function useWinLossInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['win-loss-insights', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('win_loss_insights')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as WinLossInsight[];
    },
    staleTime: 60_000,
  });
}

export function useGenerateInsights() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (periodDays: number = 90) => {
      const { data, error } = await supabase.functions.invoke('win-loss-analyzer', {
        body: { period_days: periodDays },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['win-loss-insights'] }),
    onError: () => toast.error('Erro ao gerar insights'),
  });
}

export function useDeleteInsight() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('win_loss_insights').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['win-loss-insights'] }),
    onError: () => toast.error('Erro ao remover insight'),
  });
}
