import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type FunnelStage = "visitor" | "lead" | "mql" | "sql" | "opportunity" | "customer";

export interface RevOpsSnapshot {
  id: string;
  user_id: string;
  period: string;
  funnel_stage: FunnelStage;
  count: number;
  conversion_rate: number | null;
  avg_velocity_days: number | null;
  total_value: number | null;
  captured_at: string;
}

export interface RevOpsBenchmark {
  id: string;
  user_id: string;
  metric_key: string;
  target_value: number;
  warning_threshold: number;
  critical_threshold: number;
  description: string | null;
  updated_at: string;
}

export interface RevOpsAlert {
  id: string;
  user_id: string;
  metric_key: string;
  severity: "info" | "warning" | "critical";
  message: string;
  current_value: number | null;
  expected_value: number | null;
  period: string | null;
  dismissed: boolean;
  created_at: string;
}

export interface RevOpsKPIs {
  mql_count: number;
  sql_count: number;
  opp_count: number;
  won_count: number;
  lost_count: number;
  won_value: number;
  open_pipeline: number;
  quota: number;
  mql_to_sql_rate: number;
  sql_to_opp_rate: number;
  sql_to_won_rate: number;
  win_rate: number;
  pipeline_coverage: number;
  quota_attainment: number;
  avg_cycle_days: number;
  period_start: string;
  period_end: string;
}

export function useRevOpsSnapshots(periodStart: string, periodEnd: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["revops-snapshots", user?.id, periodStart, periodEnd],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revops_snapshots")
        .select("*")
        .gte("period", periodStart)
        .lte("period", periodEnd)
        .order("period", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as RevOpsSnapshot[];
    },
  });
}

export function useRevOpsKPIs(periodStart: string, periodEnd: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["revops-kpis", user?.id, periodStart, periodEnd],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("compute_revops_kpis", {
        _user_id: user!.id,
        _period_start: periodStart,
        _period_end: periodEnd,
      });
      if (error) throw error;
      return data as unknown as RevOpsKPIs;
    },
  });
}

export function useRevOpsBenchmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["revops-benchmarks", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revops_benchmarks")
        .select("*")
        .order("metric_key");
      if (error) throw error;
      return (data || []) as unknown as RevOpsBenchmark[];
    },
  });
}

export function useUpsertBenchmark() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<RevOpsBenchmark> & { metric_key: string; target_value: number }) => {
      const { data, error } = await supabase
        .from("revops_benchmarks")
        .upsert({
          user_id: user!.id,
          metric_key: input.metric_key,
          target_value: input.target_value,
          warning_threshold: input.warning_threshold ?? 90,
          critical_threshold: input.critical_threshold ?? 75,
          description: input.description ?? null,
        }, { onConflict: "user_id,metric_key" })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao salvar benchmark');
      return data as unknown as RevOpsBenchmark;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revops-benchmarks"] });
      toast.success("Benchmark salvo");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar benchmark"),
  });
}

export function useRevOpsAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["revops-alerts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revops_alerts")
        .select("*")
        .eq("dismissed", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as unknown as RevOpsAlert[];
    },
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase.rpc("dismiss_revops_alert", { _alert_id: alertId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["revops-alerts"] }),
    onError: (e: Error) => toast.error(e.message || "Erro ao dispensar alerta"),
  });
}

export function useTriggerRevOpsSnapshot() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("revops-snapshot-builder", {
        body: { user_id: user!.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revops-snapshots"] });
      qc.invalidateQueries({ queryKey: ["revops-kpis"] });
      qc.invalidateQueries({ queryKey: ["revops-alerts"] });
      toast.success("Snapshot gerado");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao gerar snapshot"),
  });
}
