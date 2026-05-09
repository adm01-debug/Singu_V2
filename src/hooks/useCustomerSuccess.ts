import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type CSTier = "strategic" | "enterprise" | "mid" | "smb";
export type CSLifecycle = "onboarding" | "adopting" | "mature" | "at_risk" | "churned";
export type SignalType = "usage" | "support" | "engagement" | "sentiment" | "payment" | "nps";
export type RenewalStatus = "upcoming" | "in_negotiation" | "renewed" | "churned" | "downgraded" | "expanded";

export interface CSAccount {
  id: string;
  user_id: string;
  account_name: string;
  contact_id: string | null;
  company_id: string | null;
  csm_owner_id: string | null;
  tier: CSTier;
  arr: number;
  contract_start: string | null;
  renewal_date: string | null;
  lifecycle_stage: CSLifecycle;
  health_score: number;
  health_trend: "up" | "stable" | "down";
  notes: string | null;
  last_health_recalc_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HealthSignal {
  id: string;
  account_id: string;
  signal_type: SignalType;
  score: number;
  weight: number;
  source: string | null;
  metadata: Record<string, unknown>;
  captured_at: string;
}

export interface NPSResponse {
  id: string;
  account_id: string;
  contact_id: string | null;
  score: number;
  category: "promoter" | "passive" | "detractor";
  comment: string | null;
  surveyed_at: string;
}

export interface QBR {
  id: string;
  account_id: string;
  title: string;
  scheduled_at: string;
  completed_at: string | null;
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  agenda: unknown[];
  outcomes: unknown[];
  next_steps: unknown[];
  attendees: unknown[];
  notes: string | null;
}

export interface Renewal {
  id: string;
  account_id: string;
  renewal_date: string;
  status: RenewalStatus;
  forecasted_arr: number;
  actual_arr: number | null;
  risk_level: "low" | "medium" | "high" | "critical";
  notes: string | null;
}

// ============ Accounts ============
export function useCSAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cs-accounts", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("health_score", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CSAccount[];
    },
  });
}

export function useCSAccount(id: string | undefined) {
  return useQuery({
    queryKey: ["cs-account", id],
    enabled: !!id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_accounts")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data as CSAccount | null;
    },
  });
}

export function useUpsertCSAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<CSAccount> & { account_name: string }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const payload = { ...input, user_id: user.id };
      const { data, error } = input.id
        ? await supabase.from("cs_accounts").update(payload).eq("id", input.id).select().maybeSingle()
        : await supabase.from("cs_accounts").insert(payload).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao salvar conta");
      return data as CSAccount;
    },
    onSuccess: () => {
      toast.success("Conta salva");
      qc.invalidateQueries({ queryKey: ["cs-accounts"] });
      qc.invalidateQueries({ queryKey: ["cs-account"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRecalcAccountHealth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.rpc("compute_account_health", { _account_id: accountId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Health score recalculado");
      qc.invalidateQueries({ queryKey: ["cs-accounts"] });
      qc.invalidateQueries({ queryKey: ["cs-account"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ Health Signals ============
export function useHealthSignals(accountId: string | undefined) {
  return useQuery({
    queryKey: ["cs-signals", accountId],
    enabled: !!accountId,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cs_health_signals")
        .select("*")
        .eq("account_id", accountId!)
        .order("captured_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as HealthSignal[];
    },
  });
}

export function useRecordSignal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { account_id: string; signal_type: SignalType; score: number; weight?: number; source?: string }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const { error } = await supabase.from("cs_health_signals").insert({
        user_id: user.id,
        account_id: input.account_id,
        signal_type: input.signal_type,
        score: input.score,
        weight: input.weight ?? 1,
        source: input.source ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success("Sinal registrado");
      qc.invalidateQueries({ queryKey: ["cs-signals", vars.account_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ NPS ============
export function useNPS(accountId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cs-nps", accountId ?? "all", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("cs_nps_responses").select("*").eq("user_id", user!.id);
      if (accountId) q = q.eq("account_id", accountId);
      const { data, error } = await q.order("surveyed_at", { ascending: false }).limit(500);
      if (error) throw error;
      return (data ?? []) as NPSResponse[];
    },
  });
}

export function useSubmitNPS() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { account_id: string; score: number; comment?: string; contact_id?: string }) => {
      if (!user?.id) throw new Error("Não autenticado");
      const category = input.score >= 9 ? "promoter" : input.score >= 7 ? "passive" : "detractor";
      const { error } = await supabase.from("cs_nps_responses").insert({
        user_id: user.id,
        account_id: input.account_id,
        contact_id: input.contact_id ?? null,
        score: input.score,
        category,
        comment: input.comment ?? null,
      });
      if (error) throw error;

      // Registrar como signal para influenciar o health score
      const signalScore = input.score * 10; // 0-10 → 0-100
      await supabase.from("cs_health_signals").insert({
        user_id: user.id,
        account_id: input.account_id,
        signal_type: "nps",
        score: signalScore,
        weight: 2,
        source: "nps_response",
        metadata: { score: input.score, category },
      });
    },
    onSuccess: (_, vars) => {
      toast.success("Resposta NPS registrada");
      qc.invalidateQueries({ queryKey: ["cs-nps"] });
      qc.invalidateQueries({ queryKey: ["cs-signals", vars.account_id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ QBRs ============
export function useQBRs(accountId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cs-qbrs", accountId ?? "all", user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      let q = supabase.from("cs_qbrs").select("*").eq("user_id", user!.id);
      if (accountId) q = q.eq("account_id", accountId);
      const { data, error } = await q.order("scheduled_at", { ascending: false }).limit(200);
      if (error) throw error;
      return (data ?? []) as QBR[];
    },
  });
}

export function useUpsertQBR() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<QBR> & { account_id: string; title: string; scheduled_at: string }) => {
      if (!user?.id) throw new Error("Não autenticado");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, unknown> = { ...input, user_id: user.id };
      const { data, error } = input.id
        ? await supabase.from("cs_qbrs").update(payload).eq("id", input.id).select().maybeSingle()
        : await supabase.from("cs_qbrs").insert(payload).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao salvar QBR");
      return data as QBR;
    },
    onSuccess: () => {
      toast.success("QBR salvo");
      qc.invalidateQueries({ queryKey: ["cs-qbrs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ============ Renewals ============
export function useRenewals(daysAhead = 90) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["cs-renewals-pipeline", user?.id, daysAhead],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("cs_renewal_pipeline", {
        _user_id: user!.id,
        _days_ahead: daysAhead,
      });
      if (error) throw error;
      return data as {
        total_count: number;
        total_arr: number;
        at_risk_count: number;
        at_risk_arr: number;
        renewals: Array<{
          id: string;
          account_id: string;
          account_name: string;
          tier: CSTier;
          health_score: number;
          renewal_date: string;
          days_until: number;
          status: RenewalStatus;
          forecasted_arr: number;
          risk_level: "low" | "medium" | "high" | "critical";
        }>;
      };
    },
  });
}

export function useUpdateRenewal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Renewal> & { id: string }) => {
      const { data, error } = await supabase.from("cs_renewals").update(input).eq("id", input.id).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Renovação não encontrada");
      return data as Renewal;
    },
    onSuccess: () => {
      toast.success("Renovação atualizada");
      qc.invalidateQueries({ queryKey: ["cs-renewals-pipeline"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
