import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type PlaybookScenario =
  | "discovery" | "demo" | "negotiation" | "objection"
  | "closing" | "winback" | "onboarding" | "custom";

export type PlaybookSectionType = "talktrack" | "questions" | "objections" | "next_steps" | "resources";

export interface PlaybookSection {
  title: string;
  type: PlaybookSectionType;
  body: string;
  items: string[];
}

export interface SalesPlaybook {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  scenario: PlaybookScenario;
  stage_target: string | null;
  industry_target: string | null;
  persona_target: string | null;
  content: { sections: PlaybookSection[] };
  tags: string[];
  active: boolean;
  usage_count: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface PlaybookFilters {
  scenario?: PlaybookScenario;
  industry?: string;
  search?: string;
  activeOnly?: boolean;
}

export function usePlaybooks(filters: PlaybookFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbooks", user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("sales_playbooks").select("*").order("usage_count", { ascending: false });
      if (filters.scenario) q = q.eq("scenario", filters.scenario);
      if (filters.industry) q = q.ilike("industry_target", `%${filters.industry}%`);
      if (filters.activeOnly !== false) q = q.eq("active", true);
      if (filters.search) q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as SalesPlaybook[];
    },
  });
}

export function usePlaybook(id?: string) {
  return useQuery({
    queryKey: ["playbook", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_playbooks").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data as unknown as SalesPlaybook | null;
    },
  });
}

export function useUpsertPlaybook() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SalesPlaybook> & { id?: string }) => {
      if (!user) throw new Error("not authenticated");
      const payload = { ...input, user_id: user.id } as Record<string, any>;
      if (input.id) {
        const { data, error } = await (supabase.from("sales_playbooks") as any).update(payload).eq("id", input.id).select().single();
        if (error) throw error;
        return data as unknown as SalesPlaybook;
      }
      const { data, error } = await (supabase.from("sales_playbooks") as any).insert(payload).select().single();
      if (error) throw error;
      return data as unknown as SalesPlaybook;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbooks"] });
      qc.invalidateQueries({ queryKey: ["playbook"] });
      toast.success("Playbook salvo");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao salvar playbook"),
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_playbooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbooks"] });
      toast.success("Playbook removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useGeneratePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      scenario: PlaybookScenario;
      prompt: string;
      industry?: string;
      persona?: string;
      product_context?: string;
      save?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke("playbook-generator", { body: input });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as SalesPlaybook;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbooks"] });
      toast.success("Playbook gerado por IA");
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao gerar playbook"),
  });
}

export function useRecommendPlaybooks() {
  return useMutation({
    mutationFn: async (input: {
      contact_id?: string; deal_id?: string; current_stage?: string;
      recent_topics?: string[]; industry?: string; persona?: string;
      competitor_mentioned?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("playbook-recommender", { body: input });
      if (error) throw error;
      return data as { recommendations: Array<{ playbook: SalesPlaybook; score: number; reasons: string[] }>; battle_card: any };
    },
  });
}

export function useLogPlaybookUsage() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      playbook_id?: string; battle_card_id?: string;
      contact_id?: string; deal_id?: string;
      action: "opened" | "copied" | "shared" | "recommended" | "used_in_deal";
      context?: Record<string, unknown>;
    }) => {
      if (!user) return;
      await supabase.from("playbook_usage_log").insert({
        user_id: user.id,
        action: input.action,
        playbook_id: input.playbook_id ?? null,
        battle_card_id: input.battle_card_id ?? null,
        contact_id: input.contact_id ?? null,
        deal_id: input.deal_id ?? null,
        context: (input.context ?? {}) as any,
      });
    },
  });
}

export function usePlaybookUsageLog(filters: { playbookId?: string; days?: number } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbook-usage-log", user?.id, filters],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date(Date.now() - (filters.days ?? 30) * 86400_000).toISOString();
      let q = supabase.from("playbook_usage_log").select("*").gte("opened_at", since).order("opened_at", { ascending: false }).limit(200);
      if (filters.playbookId) q = q.eq("playbook_id", filters.playbookId);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });
}

export const SCENARIO_LABELS: Record<PlaybookScenario, string> = {
  discovery: "Discovery",
  demo: "Demo",
  negotiation: "Negociação",
  objection: "Objeções",
  closing: "Fechamento",
  winback: "Win-back",
  onboarding: "Onboarding",
  custom: "Customizado",
};

export const SECTION_LABELS: Record<PlaybookSectionType, string> = {
  talktrack: "Roteiro",
  questions: "Perguntas",
  objections: "Objeções & Respostas",
  next_steps: "Próximos Passos",
  resources: "Recursos",
};
