import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from './useAuth';

export type ForecastCategory = "commit" | "best_case" | "pipeline" | "omitted";

export interface ForecastPeriod {
  id: string;
  user_id: string;
  period_type: "month" | "quarter";
  period_start: string;
  period_end: string;
  quota_amount: number;
  actual_won_amount: number;
  status: "open" | "closed";
  closed_at: string | null;
  notes: string | null;
}

export interface DealForecast {
  id: string;
  user_id: string;
  deal_id: string;
  deal_name: string | null;
  contact_id: string | null;
  company_id: string | null;
  period_id: string;
  category: ForecastCategory;
  confidence_score: number;
  forecasted_amount: number;
  forecasted_close_date: string | null;
  stage: string | null;
  risk_factors: string[];
  health_score: number;
  last_activity_at: string | null;
  slip_count: number;
  ai_rationale: string | null;
  notes: string | null;
  analyzed_at: string | null;
}

export interface ForecastSnapshot {
  id: string;
  period_id: string;
  snapshot_date: string;
  commit_total: number;
  best_case_total: number;
  pipeline_total: number;
  weighted_total: number;
  deal_count: number;
}

export interface QuotaSettings {
  default_monthly_quota: number;
  default_quarterly_quota: number;
  health_weight_activity: number;
  health_weight_stage_age: number;
  health_weight_engagement: number;
  health_weight_relationship: number;
  inactivity_threshold_days: number;
  slip_threshold_days: number;
}

export function useForecastPeriods() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forecast-periods", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("forecast_periods").select("*").eq("user_id", user!.id).order("period_start", { ascending: false })
      .limit(1000);
      if (error) throw error;
      return (data ?? []) as ForecastPeriod[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCurrentPeriod(type: "month" | "quarter" = "month") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forecast-current-period", type, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase.from("forecast_periods").select("*")
        .eq("user_id", user!.id).eq("period_type", type).eq("status", "open")
        .lte("period_start", today).gte("period_end", today)
        .maybeSingle();
      if (error) throw error;
      return data as ForecastPeriod | null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePeriod() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (type: "month" | "quarter") => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase.rpc("seed_forecast_period", { _user_id: user.id, _type: type });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecast-periods"] });
      qc.invalidateQueries({ queryKey: ["forecast-current-period"] });
      toast.success("Período criado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useClosePeriod() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (periodId: string) => {
      const { error } = await supabase.from("forecast_periods")
        .update({ status: "closed", closed_at: new Date().toISOString() })
        .eq("user_id", user!.id)
        .eq("id", periodId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecast-periods"] });
      toast.success("Período fechado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDealForecasts(periodId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["deal-forecasts", periodId, user?.id],
    queryFn: async () => {
      if (!periodId) return [];
      const { data, error } = await supabase.from("deal_forecasts").select("*")
        .eq("period_id", periodId).eq("user_id", user!.id).order("forecasted_amount", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as DealForecast[];
    },
    enabled: !!periodId && !!user,
    staleTime: 60 * 1000,
  });
}

export function useUpdateDealForecast() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<DealForecast> }) => {
      const { error } = await supabase.from("deal_forecasts").update(patch).eq("user_id", user!.id).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ["deal-forecasts"] });
      toast.success("Forecast atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAnalyzeForecast() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ periodId, deals }: { periodId: string; deals: Array<{ deal_id: string; deal_name?: string; amount: number; expected_close_date?: string; stage?: string; last_activity_at?: string; contact_id?: string; company_id?: string; contact_score?: number }> }) => {
      const { data, error } = await supabase.functions.invoke("forecast-analyzer", { body: { period_id: periodId, deals } });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deal-forecasts"] });
      toast.success("Forecast analisado pela IA");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export function useForecastSnapshots(periodId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forecast-snapshots", periodId, user?.id],
    queryFn: async () => {
      if (!periodId) return [];
      const { data, error } = await supabase.from("forecast_snapshots").select("*")
        .eq("period_id", periodId).eq("user_id", user!.id).order("snapshot_date", { ascending: true })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as ForecastSnapshot[];
    },
    enabled: !!periodId && !!user,
  });
}

export function useForecastSummary(periodId: string | undefined) {
  const { user } = useAuth();
  const { data: forecasts } = useDealForecasts(periodId);
  const { data: period } = useQuery({
    queryKey: ["forecast-period", periodId, user?.id],
    queryFn: async () => {
      if (!periodId) return null;
      const { data } = await supabase.from("forecast_periods").select("*").eq("id", periodId).eq("user_id", user!.id).maybeSingle();
      return data as ForecastPeriod | null;
    },
    enabled: !!periodId && !!user,
  });
  const f = forecasts ?? [];
  const commit = f.filter(x => x.category === "commit").reduce((s, x) => s + Number(x.forecasted_amount), 0);
  const bestCase = f.filter(x => x.category === "best_case").reduce((s, x) => s + Number(x.forecasted_amount), 0);
  const pipeline = f.filter(x => x.category === "pipeline").reduce((s, x) => s + Number(x.forecasted_amount), 0);
  const weighted = f.reduce((s, x) => s + Number(x.forecasted_amount) * (x.confidence_score / 100), 0);
  const quota = Number(period?.quota_amount ?? 0);
  const attainment = quota > 0 ? Math.round(((commit + Number(period?.actual_won_amount ?? 0)) / quota) * 100) : 0;
  const gap = Math.max(0, quota - commit - Number(period?.actual_won_amount ?? 0));
  return { commit, bestCase, pipeline, weighted, quota, attainment, gap, period, deals: f, atRisk: f.filter(x => x.health_score < 40) };
}

export function useForecastNarrative() {
  return useMutation({
    mutationFn: async (periodId: string) => {
      const { data, error } = await supabase.functions.invoke("forecast-narrative", { body: { period_id: periodId } });
      if (error) throw error;
      return data as { narrative: string; commit: number; best_case: number; quota: number; at_risk_count: number };
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useQuotaSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["forecast-quota-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("forecast_quota_settings").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as QuotaSettings | null;
    },
  });
}

export function useUpsertQuotaSettings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Partial<QuotaSettings>) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("forecast_quota_settings")
        .upsert({ user_id: user.id, ...s }, { onConflict: "user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["forecast-quota-settings"] });
      toast.success("Configurações salvas");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
