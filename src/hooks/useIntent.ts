import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type IntentScope = "contact" | "account";
export type IntentTrend = "rising" | "stable" | "falling";

export interface IntentSignal {
  id: string;
  user_id: string;
  contact_id: string | null;
  external_company_id: string | null;
  signal_type: string;
  signal_source: string | null;
  signal_value: Record<string, unknown>;
  weight: number;
  occurred_at: string;
  created_at: string;
}

export interface IntentScore {
  id: string;
  user_id: string;
  scope: IntentScope;
  scope_id: string;
  intent_score: number;
  score_trend: IntentTrend;
  signal_count_30d: number;
  top_signals: Array<{ type: string; weight: number }>;
  computed_at: string;
}

export interface IntentPixel {
  id: string;
  user_id: string;
  pixel_key: string;
  domain: string;
  label: string | null;
  active: boolean;
  signal_count: number;
  last_signal_at: string | null;
  created_at: string;
}

const STALE = 5 * 60 * 1000;

function generatePixelKey() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return "px_" + Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function useIntentSignals(filters?: { signal_type?: string; days?: number; limit?: number }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["intent-signals", user?.id, filters],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async (): Promise<IntentSignal[]> => {
      const since = new Date(Date.now() - (filters?.days ?? 30) * 86400_000).toISOString();
      let q = supabase.from("intent_signals").select("*")
        .eq("user_id", user!.id)
        .gte("occurred_at", since)
        .order("occurred_at", { ascending: false })
        .limit(filters?.limit ?? 200);
      if (filters?.signal_type) q = q.eq("signal_type", filters.signal_type);
      const { data, error } = await q;
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as IntentSignal[];
    },
  });
}

export function useIntentScore(scope: IntentScope, scopeId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["intent-score", user?.id, scope, scopeId],
    enabled: !!user?.id && !!scopeId,
    staleTime: STALE,
    queryFn: async (): Promise<IntentScore | null> => {
      const { data, error } = await supabase.from("intent_scores").select("*")
        .eq("user_id", user!.id).eq("scope", scope).eq("scope_id", scopeId!).maybeSingle();
      if (error) throw error;
      return (data as unknown as IntentScore | null) ?? null;
    },
  });
}

export function useTopIntentScores(scope: IntentScope = "account", limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["intent-scores-top", user?.id, scope, limit],
    enabled: !!user?.id,
    staleTime: STALE,
    queryFn: async (): Promise<IntentScore[]> => {
      const { data, error } = await supabase.from("intent_scores").select("*")
        .eq("user_id", user!.id).eq("scope", scope)
        .order("intent_score", { ascending: false }).limit(limit);
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as unknown as IntentScore[];
    },
  });
}

export function useIntentPixels() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["intent-pixels", user?.id],
    enabled: !!user?.id,
    staleTime: STALE,
    queryFn: async (): Promise<IntentPixel[]> => {
      const { data, error } = await supabase.from("intent_tracking_pixels").select("*")
        .eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (Array.isArray(data) ? data : []) as IntentPixel[];
    },
  });
}

export function useCreatePixel() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { domain: string; label?: string }) => {
      if (!user?.id) throw new Error("not_authenticated");
      const { data, error } = await supabase.from("intent_tracking_pixels").insert({
        user_id: user.id,
        domain: input.domain,
        label: input.label ?? null,
        pixel_key: generatePixelKey(),
        active: true,
      }).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar pixel de intenção');
      return data as IntentPixel;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-pixels"] });
      toast.success("Pixel criado");
    },
    onError: (e: Error) => toast.error(`Erro ao criar pixel: ${e.message}`),
  });
}

export function useTogglePixel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; active: boolean }) => {
      const { error } = await supabase.from("intent_tracking_pixels")
        .update({ active: input.active }).eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["intent-pixels"] }),
  });
}

export function useDeletePixel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("intent_tracking_pixels").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-pixels"] });
      toast.success("Pixel removido");
    },
  });
}

export function useRefreshIntent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("intent-aggregator", { body: {} });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["intent-score"] });
      qc.invalidateQueries({ queryKey: ["intent-scores-top"] });
      const d = data as { contacts_scored?: number; accounts_scored?: number };
      toast.success(`Intent atualizado · ${d?.contacts_scored ?? 0} contatos · ${d?.accounts_scored ?? 0} contas`);
    },
    onError: (e: Error) => toast.error(`Falha ao recalcular: ${e.message}`),
  });
}

export function useCreateManualSignal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      signal_type: string; weight?: number;
      contact_id?: string | null; external_company_id?: string | null;
      signal_source?: string; signal_value?: Record<string, unknown>;
    }) => {
      if (!user?.id) throw new Error("not_authenticated");
      const { error } = await supabase.from("intent_signals").insert([{
        user_id: user.id,
        signal_type: input.signal_type,
        weight: input.weight ?? 1,
        contact_id: input.contact_id ?? null,
        external_company_id: input.external_company_id ?? null,
        signal_source: input.signal_source ?? "manual",
        signal_value: (input.signal_value ?? {}) as never,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["intent-signals"] });
      toast.success("Sinal registrado");
    },
    onError: (e: Error) => toast.error(`Erro: ${e.message}`),
  });
}

export const SIGNAL_TYPE_LABELS: Record<string, string> = {
  page_view: "Visita de página",
  email_open: "Abertura de email",
  email_click: "Clique em email",
  form_submit: "Envio de formulário",
  content_download: "Download de conteúdo",
  pricing_view: "Visita à página de preços",
  demo_request: "Pedido de demo",
  social_engagement: "Engajamento social",
  search_query: "Busca interna",
  competitor_mention: "Menção a concorrente",
};
