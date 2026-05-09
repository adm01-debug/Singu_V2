import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

type PersonalityRow = Database['public']['Tables']['contact_personality']['Row'];
export type ContactPersonality = Partial<PersonalityRow>;

type MetaprogramsRow = Database['public']['Tables']['contact_metaprograms']['Row'];
export type ContactMetaprograms = Partial<MetaprogramsRow>;

export interface ContactBehavior {
  disc_primary?: 'D' | 'I' | 'S' | 'C';
  disc_confidence?: number;
  disc_notes?: string;
  vak_primary?: 'visual' | 'auditivo' | 'cinestesico';
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
  user_email: string;
  change_source: string;
  field_name: string;
  old_value: any;
  new_value: any;
  reason: string;
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

  const { data: behavior, isLoading: isLoadingBehavior } = useQuery({
    queryKey: ["contact-behavior", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_behavior")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactBehavior;
    },
    enabled: !!contactId,
  });

  const { data: decision, isLoading: isLoadingDecision } = useQuery({
    queryKey: ["contact-decision", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_decision_making")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactDecisionMaking;
    },
    enabled: !!contactId,
  });

  const { data: influence, isLoading: isLoadingInfluence } = useQuery({
    queryKey: ["contact-influence", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_influence")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactInfluence;
    },
    enabled: !!contactId,
  });

  const { data: personality, isLoading: isLoadingPersonality } = useQuery({
    queryKey: ["contact-personality", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_personality")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactPersonality;
    },
    enabled: !!contactId,
  });

  const { data: businessContext, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ["contact-business-context", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_business_context")
        .select("*")
        .eq("contact_id", contactId)
        .maybeSingle();
      if (error) throw error;
      return data as ContactBusinessContext;
    },
    enabled: !!contactId,
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
  });

  const { data: gaps, isLoading: isLoadingGaps } = useQuery({
    queryKey: ["contact-behavior-gaps", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_contact_behavior_gaps", {
        p_contact_id: contactId,
      });
      if (error) throw error;
      return data as ContactBehaviorGap[];
    },
    enabled: !!contactId,
  });

  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ["contact-behavior-audit", contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_contact_behavior_audit")
        .select("*")
        .eq("contact_id", contactId);
      if (error) throw error;
      return data as BehavioralAuditLog[];
    },
    enabled: !!contactId,
  });

  const { data: consistency, refetch: checkConsistency } = useQuery({
    queryKey: ["contact-behavior-consistency", contactId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("validate_behavioral_consistency", {
        p_contact_id: contactId,
      });
      if (error) throw error;
      return data as { is_consistent: boolean; issues: string[] };
    },
    enabled: !!contactId,
  });

  return {
    behavior,
    decision,
    influence,
    businessContext,
    personality,
    gaps,
    auditLogs,
    consistency,
    isLoading: isLoadingBehavior || isLoadingDecision || isLoadingInfluence || isLoadingBusiness || isLoadingGaps || isLoadingAudit || isLoadingPersonality,
    updateBehavior: updateBehaviorMutation.mutate,
    updateDecision: updateDecisionMutation.mutate,
    updateInfluence: updateInfluenceMutation.mutate,
    updateBusiness: updateBusinessMutation.mutate,
    updatePersonality: updatePersonalityMutation.mutate,
    checkConsistency,
  };
};
