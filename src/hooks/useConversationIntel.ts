import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { parseApiError } from '@/lib/errorMessages';

export type SentimentOverall = "positive" | "neutral" | "negative" | "mixed";

export interface ConversationAnalysis {
  id: string;
  interaction_id: string;
  contact_id: string | null;
  duration_seconds: number | null;
  talk_ratio_rep: number | null;
  talk_ratio_customer: number | null;
  longest_monologue_seconds: number | null;
  questions_asked: number;
  sentiment_overall: SentimentOverall | null;
  sentiment_timeline: Array<{ position_pct: number; sentiment: string; note?: string }>;
  topics: Array<{ topic_key?: string; label: string; category: string; mentions: number; relevance?: number }>;
  objections: Array<{ objection: string; category: string; handled: boolean; suggested_response?: string }>;
  action_items: Array<{ task: string; owner: string; deadline?: string }>;
  key_moments: Array<{ position_pct: number; moment_type: string; description: string }>;
  coaching_score: number | null;
  coaching_tips: string[];
  next_best_action: string | null;
  analyzed_at: string;
  model_used: string | null;
}

export interface ConversationTopic {
  id: string;
  topic_key: string;
  label: string;
  category: "product" | "pricing" | "competition" | "objection" | "closing" | "discovery" | "other";
  keywords: string[];
  active: boolean;
  sort_order: number;
}

export interface CoachingScorecard {
  id: string;
  name: string;
  description: string | null;
  criteria: Array<{ key: string; label: string; weight: number }>;
  active: boolean;
  is_default: boolean;
}

// ──────────── Analyses ────────────
export function useConversationAnalysis(interactionId: string | undefined) {
  return useQuery({
    queryKey: ["conversation-analysis", interactionId],
    enabled: !!interactionId,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_analyses")
        .select("*")
        .eq("interaction_id", interactionId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as ConversationAnalysis | null;
    },
  });
}

export function useConversationAnalyses(filters?: { sentiment?: SentimentOverall; minScore?: number; days?: number }) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation-analyses", user?.id, filters],
    enabled: !!user?.id,
    staleTime: 10 * 60_000,
    queryFn: async () => {
      let q = supabase
        .from("conversation_analyses")
        .select("*, interactions(title, type, created_at)")
        .eq("user_id", user!.id)
        .order("analyzed_at", { ascending: false })
        .limit(100);
      if (filters?.sentiment) q = q.eq("sentiment_overall", filters.sentiment);
      if (filters?.minScore != null) q = q.gte("coaching_score", filters.minScore);
      if (filters?.days) {
        const since = new Date(Date.now() - filters.days * 86400_000).toISOString();
        q = q.gte("analyzed_at", since);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAnalyzeConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ interactionId, force }: { interactionId: string; force?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("conversation-analyzer", {
        body: { interaction_id: interactionId, force },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["conversation-analysis", vars.interactionId] });
      qc.invalidateQueries({ queryKey: ["conversation-analyses"] });
      toast.success("Análise concluída");
    },
    onError: (e: Error) => toast.error(parseApiError(e, "Falha ao analisar")),
  });
}

// ──────────── Topics ────────────
export function useTopicsCatalog() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["conversation-topics", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversation_topics_catalog")
        .select("*")
        .eq("user_id", user!.id)
        .order("sort_order")
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as ConversationTopic[];
    },
  });
}

export function useUpsertTopic() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (topic: Partial<ConversationTopic> & { topic_key: string; label: string; category: ConversationTopic["category"] }) => {
      const { error } = await supabase
        .from("conversation_topics_catalog")
        .upsert({ ...topic, user_id: user!.id }, { onConflict: "user_id,topic_key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation-topics"] });
      toast.success("Tópico salvo");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useDeleteTopic() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("conversation_topics_catalog").delete().eq('user_id', user!.id).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation-topics"] });
      toast.success("Tópico removido");
    },
    onError: () => toast.error("Erro ao remover tópico"),
  });
}

export function useSeedTopics() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.rpc("seed_conversation_topics", { _user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation-topics"] });
      toast.success("Tópicos padrão criados");
    },
    onError: () => toast.error("Erro ao criar tópicos padrão"),
  });
}

// ──────────── Scorecards ────────────
export function useCoachingScorecards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coaching-scorecards", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_scorecards")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as unknown as CoachingScorecard[];
    },
  });
}

export function useUpsertScorecard() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (sc: Partial<CoachingScorecard> & { name: string }) => {
      const payload = { ...sc, user_id: user!.id };
      if (sc.id) {
        const { error } = await supabase.from("coaching_scorecards").update(payload).eq('user_id', user!.id).eq("id", sc.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coaching_scorecards").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaching-scorecards"] });
      toast.success("Scorecard salvo");
    },
    onError: () => toast.error("Erro ao salvar scorecard"),
  });
}

// ──────────── Metrics ────────────
export function useCoachingMetrics(periodDays: number = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["coaching-metrics", user?.id, periodDays],
    enabled: !!user?.id,
    queryFn: async () => {
      const since = new Date(Date.now() - periodDays * 86400_000).toISOString();
      const { data, error } = await supabase
        .from("conversation_analyses")
        .select("coaching_score, sentiment_overall, talk_ratio_rep, objections, topics, analyzed_at")
        .eq("user_id", user!.id)
        .gte("analyzed_at", since)
        .limit(1000);
      if (error) throw error;
      const list = data ?? [];
      const total = list.length;
      const avgScore = total ? Math.round(list.reduce((s, a) => s + (a.coaching_score ?? 0), 0) / total) : 0;
      const avgTalk = total ? Math.round(list.reduce((s, a) => s + Number(a.talk_ratio_rep ?? 0), 0) / total) : 0;
      const objCount: Record<string, number> = {};
      let unhandled = 0;
      const topicCount: Record<string, number> = {};
      for (const a of list) {
        for (const o of (a.objections as Array<{ objection: string; handled: boolean }> ?? [])) {
          objCount[o.objection] = (objCount[o.objection] ?? 0) + 1;
          if (!o.handled) unhandled++;
        }
        for (const t of (a.topics as Array<{ label: string; mentions: number }> ?? [])) {
          topicCount[t.label] = (topicCount[t.label] ?? 0) + (t.mentions ?? 1);
        }
      }
      const topObjections = Object.entries(objCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
      const topTopics = Object.entries(topicCount).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, count]) => ({ label, count }));
      const trend = list
        .map((a) => ({ date: a.analyzed_at.slice(0, 10), score: a.coaching_score ?? 0 }))
        .reverse();
      return { total, avgScore, avgTalk, unhandled, topObjections, topTopics, trend };
    },
  });
}
