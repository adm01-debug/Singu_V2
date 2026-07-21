import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Database, Json } from "@/integrations/supabase/types";
import { type BattleCard } from "@/hooks/useBattleCards";
import { logger } from "@/lib/logger";

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

export interface PlaybookUsageLog {
  id: string;
  user_id: string;
  playbook_id: string | null;
  battle_card_id: string | null;
  contact_id: string | null;
  deal_id: string | null;
  action: "opened" | "copied" | "shared" | "recommended" | "used_in_deal";
  context: Record<string, unknown> | null;
  opened_at: string;
}

export interface PlaybookFilters {
  scenario?: PlaybookScenario;
  industry?: string;
  search?: string;
  activeOnly?: boolean;
}

type PlaybookInsert = Database["public"]["Tables"]["sales_playbooks"]["Insert"];
type PlaybookUpdate = Database["public"]["Tables"]["sales_playbooks"]["Update"];

export function usePlaybooks(filters: PlaybookFilters = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbooks", user?.id, filters],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      let q = supabase.from("sales_playbooks").select("*").eq("user_id", user!.id).order("usage_count", { ascending: false })
      .limit(1000);
      
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
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbook", id, user?.id],
    enabled: !!id && !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const { data, error } = await supabase.from("sales_playbooks").select("*").eq("id", id!).eq("user_id", user!.id).maybeSingle();
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
      if (!user) throw new Error("Usuário não autenticado");

      const basePayload = {
        name: input.name,
        description: input.description,
        scenario: input.scenario,
        stage_target: input.stage_target,
        industry_target: input.industry_target,
        persona_target: input.persona_target,
        content: (input.content as unknown as Json) ?? { sections: [] },
        tags: input.tags ?? [],
        active: input.active ?? true,
        user_id: user.id,
      };

      if (input.id) {
        const updatePayload: PlaybookUpdate = basePayload;
        const { data, error } = await supabase
          .from("sales_playbooks")
          .update(updatePayload)
          .eq("id", input.id)
          .select()
          .maybeSingle();
        
        if (error) throw error;
        if (!data) throw new Error("Playbook não encontrado");
        return data as unknown as SalesPlaybook;
      }

      if (!input.name) throw new Error("Nome do playbook é obrigatório");
      if (!input.scenario) throw new Error("Cenário do playbook é obrigatório");

      const insertPayload: PlaybookInsert = {
        ...basePayload,
        name: input.name,
        scenario: input.scenario,
      };

      const { data, error } = await supabase
        .from("sales_playbooks")
        .insert(insertPayload)
        .select()
        .maybeSingle();
      
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar playbook");
      return data as unknown as SalesPlaybook;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playbooks"] });
      qc.invalidateQueries({ queryKey: ["playbook"] });
      toast.success("Playbook salvo com sucesso");
    },
    onError: (e: Error) => {
      logger.error("[useUpsertPlaybook] Erro:", e);
      toast.error(e.message || "Erro ao salvar playbook");
    },
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
    onError: (e: Error) => {
      logger.error("[useDeletePlaybook] Erro:", e);
      toast.error(e.message || "Erro ao remover playbook");
    },
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
    onError: (e: Error) => {
      logger.error("[useGeneratePlaybook] Erro:", e);
      toast.error(e.message || "Erro ao gerar playbook");
    },
  });
}

export function useRecommendPlaybooks() {
  return useMutation({
    mutationFn: async (input: {
      contact_id?: string;
      deal_id?: string;
      current_stage?: string;
      recent_topics?: string[];
      industry?: string;
      persona?: string;
      competitor_mentioned?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke("playbook-recommender", { body: input });
      if (error) throw error;

      return data as {
        recommendations: Array<{ playbook: SalesPlaybook; score: number; reasons: string[] }>;
        battle_card?: BattleCard;
      };
    },
    onError: (e: Error) => toast.error(e.message || "Erro ao recomendar playbooks"),
  });
}

export function useLogPlaybookUsage() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: {
      playbook_id?: string; 
      battle_card_id?: string;
      contact_id?: string; 
      deal_id?: string;
      action: "opened" | "copied" | "shared" | "recommended" | "used_in_deal";
      context?: Record<string, unknown>;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase.from("playbook_usage_log").insert({
        user_id: user.id,
        action: input.action,
        playbook_id: input.playbook_id ?? null,
        battle_card_id: input.battle_card_id ?? null,
        contact_id: input.contact_id ?? null,
        deal_id: input.deal_id ?? null,
        context: (input.context as unknown as Json) ?? null,
      });
      
      if (error) {
        logger.error("[useLogPlaybookUsage] Erro ao registrar log:", error);
      }
    },
  });
}

export function usePlaybookUsageLog(filters: { playbookId?: string; days?: number } = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["playbook-usage-log", user?.id, filters],
    enabled: !!user,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const since = new Date(Date.now() - (filters.days ?? 30) * 86400_000).toISOString();
      let q = supabase
        .from("playbook_usage_log")
        .select("*")
        .eq("user_id", user!.id)
        .gte("opened_at", since)
        .order("opened_at", { ascending: false })
        .limit(200);
      
      if (filters.playbookId) q = q.eq("playbook_id", filters.playbookId);
      
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PlaybookUsageLog[];
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
