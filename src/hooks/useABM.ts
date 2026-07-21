import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";
import { useAuth } from './useAuth';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { parseApiError } from '@/lib/errorMessages';

export type AccountTier = "strategic" | "enterprise" | "mid" | "smb";
export type AccountStatus = "active" | "nurture" | "closed_won" | "closed_lost" | "paused";
export type CommitteeRole = "decision_maker" | "influencer" | "champion" | "blocker" | "user" | "technical" | "economic";
export type WhitespaceType = "cross_sell" | "up_sell" | "expansion" | "renewal";
export type CampaignType = "one_to_one" | "one_to_few" | "one_to_many";

export interface ABMAccount {
  id: string;
  user_id: string;
  external_company_id: string;
  company_name: string;
  parent_account_id: string | null;
  tier: AccountTier;
  account_score: number;
  score_breakdown: { fit?: number; engagement?: number; intent?: number; influence?: number };
  status: AccountStatus;
  assigned_to: string | null;
  target_revenue: number | null;
  notes: string | null;
  last_scored_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BuyingCommitteeMember {
  id: string;
  account_id: string;
  contact_name: string;
  contact_email: string | null;
  contact_role: string | null;
  external_contact_id: string | null;
  committee_role: CommitteeRole;
  influence_level: number;
  engagement_score: number;
  notes: string | null;
}

export interface WhitespaceOpportunity {
  id: string;
  account_id: string;
  opportunity_type: WhitespaceType;
  product_category: string;
  estimated_value: number | null;
  confidence: number;
  rationale: string | null;
  status: string;
  identified_at: string;
}

export interface ABMAccountPlan {
  id: string;
  account_id: string;
  template_type: "strategic" | "growth" | "retention" | "penetration";
  goal: string | null;
  objectives: Array<{ title: string; completed?: boolean }>;
  strategies: string[];
  key_stakeholders: Array<{ name: string; role?: string }>;
  milestones: Array<{ title: string; date?: string; done?: boolean }>;
  status: "draft" | "active" | "completed" | "archived";
  target_revenue: number | null;
  start_date: string | null;
  end_date: string | null;
}

export interface ABMCampaign {
  id: string;
  name: string;
  description: string | null;
  campaign_type: CampaignType;
  target_account_ids: string[];
  channels: string[];
  status: "draft" | "active" | "paused" | "completed" | "archived";
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  metrics: Record<string, unknown>;
  created_at: string;
}

/* ───────────── Accounts ───────────── */

export function useABMAccounts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["abm", "accounts", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ABMAccount[]> => {
      const { data, error } = await supabase
        .from("abm_accounts")
        .select("*")
        .eq("user_id", user!.id)
        .order("account_score", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return Array.isArray(data) ? (data as unknown as ABMAccount[]) : [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useABMAccount(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["abm", "account", id, user?.id],
    queryFn: async (): Promise<ABMAccount | null> => {
      if (!id) return null;
      const { data, error } = await supabase.from("abm_accounts").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as unknown as ABMAccount | null;
    },
    enabled: !!id && !!user,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateABMAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      external_company_id: string;
      company_name: string;
      tier: AccountTier;
      target_revenue?: number;
      parent_account_id?: string | null;
      notes?: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("abm_accounts")
        .insert({ ...input, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar conta ABM");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abm", "accounts"] });
      toast.success("Conta ABM criada");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useUpdateABMAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ABMAccount> & { id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { data, error } = await supabase.from("abm_accounts").update(updates).eq('user_id', user.id).eq("id", id).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Conta ABM não encontrada");
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["abm", "accounts"] });
      qc.invalidateQueries({ queryKey: ["abm", "account", vars.id] });
      toast.success("Conta atualizada");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useDeleteABMAccount() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from("abm_accounts").delete().eq('user_id', user.id).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abm", "accounts"] });
      toast.success("Conta removida");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useRescoreAccounts(accountId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("abm-account-scorer", {
        body: accountId ? { account_id: accountId } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { scored?: number }) => {
      qc.invalidateQueries({ queryKey: ["abm"] });
      toast.success(`${data?.scored ?? 0} conta(s) reavaliada(s)`);
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

/* ───────────── Buying Committee ───────────── */

export function useBuyingCommittee(accountId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["abm", "committee", accountId, user?.id],
    queryFn: async (): Promise<BuyingCommitteeMember[]> => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from("abm_buying_committee")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", user!.id)
        .order("influence_level", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return Array.isArray(data) ? (data as unknown as BuyingCommitteeMember[]) : [];
    },
    enabled: !!accountId && !!user,
  });
}

export function useUpsertCommitteeMember() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Partial<BuyingCommitteeMember> & { account_id: string; contact_name: string; committee_role: CommitteeRole }
    ) => {
      if (!user) throw new Error("Não autenticado");
      if (input.id) {
        const { id, ...updates } = input;
        const { data, error } = await supabase.from("abm_buying_committee").update(updates).eq('user_id', user!.id).eq("id", id).select().maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Stakeholder não encontrado");
        return data;
      }
      const { data, error } = await supabase
        .from("abm_buying_committee")
        .insert({ ...input, user_id: user.id })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar stakeholder");
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["abm", "committee", vars.account_id] });
      toast.success("Stakeholder salvo");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useDeleteCommitteeMember() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; account_id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from("abm_buying_committee").delete().eq('user_id', user.id).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["abm", "committee", vars.account_id] });
      toast.success("Stakeholder removido");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

/* ───────────── Whitespace ───────────── */

export function useWhitespaceOpportunities(accountId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["abm", "whitespace", accountId, user?.id],
    queryFn: async (): Promise<WhitespaceOpportunity[]> => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from("abm_whitespace_opportunities")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", user!.id)
        .order("estimated_value", { ascending: false, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return Array.isArray(data) ? (data as unknown as WhitespaceOpportunity[]) : [];
    },
    enabled: !!accountId && !!user,
  });
}

export function useGenerateWhitespace() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke("abm-whitespace-analyzer", {
        body: { account_id: accountId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: { generated?: number }, accountId) => {
      qc.invalidateQueries({ queryKey: ["abm", "whitespace", accountId] });
      toast.success(`${data?.generated ?? 0} oportunidade(s) identificada(s) pela IA`);
    },
    onError: (e: Error) => {
      logger.error("whitespace error", e);
      toast.error(parseApiError(e));
    },
  });
}

export function useUpdateWhitespaceStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string; account_id: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from("abm_whitespace_opportunities").update({ status }).eq('user_id', user.id).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["abm", "whitespace", vars.account_id] });
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

/* ───────────── Account Plans ───────────── */

export function useABMAccountPlans(accountId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["abm", "plans", accountId, user?.id],
    queryFn: async (): Promise<ABMAccountPlan[]> => {
      if (!accountId) return [];
      const { data, error } = await supabase
        .from("abm_account_plans")
        .select("*")
        .eq("account_id", accountId)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return Array.isArray(data) ? (data as unknown as ABMAccountPlan[]) : [];
    },
    enabled: !!accountId && !!user,
  });
}

export function useUpsertAccountPlan() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ABMAccountPlan> & { account_id: string }) => {
      if (!user) throw new Error("Não autenticado");
      if (input.id) {
        const { id, ...updates } = input;
        const { data, error } = await supabase.from("abm_account_plans").update(updates).eq('user_id', user!.id).eq("id", id).select().maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Plano de conta não encontrado");
        return data;
      }
      const { data, error } = await supabase
        .from("abm_account_plans")
        .insert({ ...input, user_id: user.id, template_type: input.template_type ?? "strategic" })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar plano de conta");
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["abm", "plans", vars.account_id] });
      toast.success("Plano de conta salvo");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

/* ───────────── Campaigns ───────────── */

export function useABMCampaigns() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["abm", "campaigns", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ABMCampaign[]> => {
      const { data, error } = await supabase
        .from("abm_campaigns")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return Array.isArray(data) ? (data as unknown as ABMCampaign[]) : [];
    },
  });
}

export function useUpsertCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<ABMCampaign> & { name: string; campaign_type: CampaignType }) => {
      if (!user) throw new Error("Não autenticado");
      if (input.id) {
        const { id, metrics, ...rest } = input;
        const updates: Record<string, unknown> = { ...rest };
        if (metrics !== undefined) updates.metrics = metrics as unknown;
        const { data, error } = await supabase.from("abm_campaigns").update(updates as unknown as TablesUpdate<'abm_campaigns'>).eq('user_id', user!.id).eq("id", id).select().maybeSingle();
        if (error) throw error;
        if (!data) throw new Error("Campanha não encontrada");
        return data;
      }
      const { data, error } = await supabase
        .from("abm_campaigns")
        .insert({
          name: input.name,
          campaign_type: input.campaign_type,
          description: input.description ?? null,
          target_account_ids: input.target_account_ids ?? [],
          channels: input.channels ?? [],
          status: input.status ?? "draft",
          start_date: input.start_date ?? null,
          end_date: input.end_date ?? null,
          budget: input.budget ?? null,
          user_id: user.id,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Falha ao criar campanha");
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abm", "campaigns"] });
      toast.success("Campanha salva");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}

export function useDeleteCampaign() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from("abm_campaigns").delete().eq('user_id', user.id).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["abm", "campaigns"] });
      toast.success("Campanha removida");
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });
}
