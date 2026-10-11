import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

type PersonalityRow = Database['public']['Tables']['contact_personality']['Row'];
export type ContactPersonality = Partial<PersonalityRow>;

type MetaprogramsRow = Database['public']['Tables']['contact_metaprograms']['Row'];
export type ContactMetaprograms = Partial<MetaprogramsRow>;

type RapportRow = Database['public']['Tables']['contact_rapport_strategy']['Row'];
export type ContactRapportStrategy = Partial<RapportRow>;

export interface ContactBehavior {
  disc_primary?: 'D' | 'I' | 'S' | 'C';
  disc_confidence?: number;
  disc_notes?: string;
  vak_primary?: 'visual' | 'auditivo' | 'cinestesico';
  vak_visual?: number;
  vak_auditory?: number;
  vak_kinesthetic?: number;
  motivation_primary?: string;
  main_fear?: string;
  career_stage?: string;
  current_pressure?: string;
  professional_goals?: string;
  preferred_channel?: string;
  message_style?: string;
  response_time_avg?: string;
  best_contact_window?: string;
  formality_level?: number;
  decision_speed?: string;
  decision_criteria?: string[];
  needs_approval?: boolean;
  approver_id?: string;
  budget_authority?: boolean;
  decision_role?: string;
  decision_power?: number;
  support_level?: number;
  influencer_ids?: string[];
  company_financial_health?: string;
  current_challenges?: string[];
  current_competitors?: string[];
  best_time_to_approach?: string;
  seasonal_notes?: string;
}

export interface ContactBehaviorGap {
  category: string;
  field_name: string;
  issue_type: string;
  priority: 'high' | 'medium' | 'low';
}

 export interface BehavioralAuditLog {
   id: string;
   timestamp: string;
   user_email?: string;
   change_source?: string;
   field_name?: string;
   old_value?: unknown;
   new_value?: unknown;
   reason?: string;
   analysis_type?: string;
   analyzed_text?: string;
   is_validated?: boolean;
   user_feedback?: string;
 }

export interface ContactDecisionMaking {
  decision_speed?: string;
  decision_criteria?: string[];
  needs_approval?: boolean;
  approver_id?: string;
  budget_authority?: string;
}

export interface ContactInfluence {
  decision_role?: string;
  decision_power?: number;
  support_level?: number;
  influencer_ids?: string[];
}

export interface ContactBusinessContext {
  financial_health?: string;
  current_challenges?: string[];
  competitors_used?: string[];
  best_moment_to_approach?: string;
  seasonal_notes?: string;
}

// ContactPersonality is now typed from Database types in the header

export const useContactBehavior = (contactId: string) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: behavior, isLoading: isLoadingBehavior } = useQuery({
    queryKey: ["contact-behavior", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_behavior")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactBehavior | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: decision, isLoading: isLoadingDecision } = useQuery({
    queryKey: ["contact-decision", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_decision_making")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactDecisionMaking | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: influence, isLoading: isLoadingInfluence } = useQuery({
    queryKey: ["contact-influence", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_influence")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactInfluence | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: personality, isLoading: isLoadingPersonality } = useQuery({
    queryKey: ["contact-personality", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_personality")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactPersonality | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: metaprograms, isLoading: isLoadingMetaprograms } = useQuery({
    queryKey: ["contact-metaprograms", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_metaprograms")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactMetaprograms | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: rapport, isLoading: isLoadingRapport } = useQuery({
    queryKey: ["contact-rapport", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_rapport_strategy")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactRapportStrategy | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: businessContext, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["contact-business-context", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_business_context")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactBusinessContext | null;
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const updateBehaviorMutation = useMutation({
    mutationFn: async (updates: Partial<ContactBehavior>) => {
      const { error } = await supabase
        .from("contact_behavior")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-behavior", contactId] });
      toast.success("Perfil comportamental atualizado");
    },
    onError: () => toast.error("Erro ao atualizar perfil comportamental"),
  });

  const updateDecisionMutation = useMutation({
    mutationFn: async (updates: Partial<ContactDecisionMaking>) => {
      const { error } = await supabase
        .from("contact_decision_making")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-decision", contactId] });
      toast.success("Critérios de decisão atualizados");
    },
    onError: () => toast.error("Erro ao atualizar critérios de decisão"),
  });

  const updateInfluenceMutation = useMutation({
    mutationFn: async (updates: Partial<ContactInfluence>) => {
      const { error } = await supabase
        .from("contact_influence")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-influence", contactId] });
      toast.success("Influência e poder atualizados");
    },
    onError: () => toast.error("Erro ao atualizar influência"),
  });

  const updateBusinessMutation = useMutation({
    mutationFn: async (updates: Partial<ContactBusinessContext>) => {
      const { error } = await supabase
        .from("contact_business_context")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-business-context", contactId] });
      toast.success("Contexto empresarial atualizado");
    },
    onError: () => toast.error("Erro ao atualizar contexto empresarial"),
  });

  const updatePersonalityMutation = useMutation({
    mutationFn: async (updates: Partial<ContactPersonality>) => {
      const { error } = await supabase
        .from("contact_personality")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-personality", contactId] });
      toast.success("Frameworks de personalidade atualizados");
    },
    onError: () => toast.error("Erro ao atualizar personalidade"),
  });

  const updateMetaprogramsMutation = useMutation({
    mutationFn: async (updates: Partial<ContactMetaprograms>) => {
      const { error } = await supabase
        .from("contact_metaprograms")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-metaprograms", contactId] });
      toast.success("Metaprogramas atualizados");
    },
    onError: () => toast.error("Erro ao atualizar metaprogramas"),
  });

  const updateRapportMutation = useMutation({
    mutationFn: async (updates: Partial<ContactRapportStrategy>) => {
      const { error } = await supabase
        .from("contact_rapport_strategy")
        .upsert({ contact_id: contactId, ...updates }, { onConflict: 'contact_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contact-rapport", contactId] });
      toast.success("Estratégia de Rapport atualizada");
    },
    onError: () => toast.error("Erro ao atualizar estratégia de rapport"),
  });

  const { data: gaps, isLoading: isLoadingGaps } = useQuery({
    queryKey: ["contact-behavior-gaps", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contact_behavior_gaps", {
        p_contact_id: contactId,
      });
      if (error) throw error;
      return data as ContactBehaviorGap[];
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ["contact-behavior-audit", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_relationship_audit_logs")
        .select("id, created_at, change_source, field_name, old_value, new_value, reason")
        .eq("contact_id", contactId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []).map(row => ({
        id: row.id, timestamp: row.created_at, change_source: row.change_source ?? undefined,
        field_name: row.field_name ?? undefined, old_value: row.old_value, new_value: row.new_value,
        reason: row.reason ?? undefined,
      }));
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: consistency, refetch: checkConsistency } = useQuery({
    queryKey: ["contact-behavior-consistency", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("validate_behavioral_consistency", {
        p_contact_id: contactId,
      });
      if (error) throw error;
      return data as { is_consistent: boolean; issues: string[] };
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: frameworkGaps, isLoading: isLoadingFGaps } = useQuery({
    queryKey: ["contact-framework-gaps", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contact_framework_gaps", {
        p_contact_id: contactId,
      });
      if (error) throw error;
      return data as ContactBehaviorGap[];
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: frameworkAudit, isLoading: isLoadingFAudit } = useQuery({
    queryKey: ["contact-personality-audit", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_contact_personality_audit")
        .select("*")
        .eq("contact_id", contactId)
        .limit(500);
      if (error) throw error;
      return data as BehavioralAuditLog[];
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const { data: lifeEventGaps, isLoading: isLoadingLEGaps } = useQuery({
    queryKey: ["contact-life-event-gaps", contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contact_life_event_gaps", {
        p_contact_id: contactId,
      });
      if (error) throw error;
      return data as ContactBehaviorGap[];
    },
    enabled: !!contactId,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    behavior,
    decision,
    influence,
    businessContext,
    personality,
    metaprograms,
    rapport,
    gaps: [...(gaps || []), ...(frameworkGaps || []), ...(lifeEventGaps || [])],
    auditLogs: [...(auditLogs || []), ...(frameworkAudit || [])],
    consistency,
    isLoading: isLoadingBehavior || isLoadingDecision || isLoadingInfluence || isLoadingBusiness || isLoadingGaps || isLoadingAudit || isLoadingPersonality || isLoadingMetaprograms || isLoadingFGaps || isLoadingFAudit || isLoadingRapport || isLoadingLEGaps,
    updateBehavior: updateBehaviorMutation.mutate,
    updateDecision: updateDecisionMutation.mutate,
    updateInfluence: updateInfluenceMutation.mutate,
    updateBusiness: updateBusinessMutation.mutate,
    updatePersonality: updatePersonalityMutation.mutate,
    updateMetaprograms: updateMetaprogramsMutation.mutate,
    updateRapport: updateRapportMutation.mutate,
    checkConsistency,
  };
};
