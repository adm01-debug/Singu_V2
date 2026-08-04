import { useQuery } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';

export interface CompanyStatistics {
  total_contacts: number;
  total_interactions: number;
  total_deals: number;
  open_deals: number;
  open_deals_value: number;
  won_deals_value: number;
  total_proposals: number;
  total_meetings: number;
  total_tasks: number;
  avg_relationship_score: number;
  last_interaction_at: string | null;
  days_since_last_interaction: number | null;
}

export interface CompanyTimelineEvent {
  event_type: string;
  event_date: string;
  title: string;
  description?: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: Record<string, unknown>;
}

export interface Company360 {
  id: string;
  name: string;
  cnpj?: string;
  industry?: string;
  health_score?: number;
  rfm_segment?: string;
  total_contacts?: number;
  total_revenue?: number;
  churn_risk?: number;
  top_contacts?: Array<{ id: string; name: string; role?: string; score?: number }>;
  recent_activities?: Array<{ type: string; date: string; description: string }>;
  key_metrics?: Record<string, unknown>;
}

export interface NextBestAction {
  action_type: string;
  description: string;
  priority: string;
  reason: string;
  suggested_date?: string;
}

export interface AccountPlan {
  company_id: string;
  objectives: string[];
  key_contacts: Array<{ id: string; name: string; role: string }>;
  opportunities: Array<{ title: string; value: number; stage: string }>;
  risks: string[];
  next_steps: string[];
}

export interface TouchpointSummary {
  total_touchpoints: number;
  by_channel: Record<string, number>;
  by_month: Array<{ month: string; count: number }>;
  last_touchpoint: string | null;
  avg_gap_days: number;
}

/**
 * Fetches company stats from `vw_companies_stats` view (exists in external DB).
 */
export function useCompanyStatistics(companyId?: string) {
  return useQuery({
    queryKey: ['company-statistics', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<CompanyStatistics>({
        table: 'vw_companies_stats',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'id', value: companyId }] : [],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

/**
 * Fetches full 360° view via RPC get_company_360_view.
 * Falls back to v_company_summary view if RPC fails.
 */
export function useCompany360(companyId?: string) {
  return useQuery({
    queryKey: ['company-360', companyId],
    queryFn: async () => {
      // Try RPC first
      const { data: rpcData, error: rpcError } = await callExternalRpc<Company360>(
        'get_company_360_view',
        { p_company_id: companyId }
      );
      if (!rpcError && rpcData) return rpcData;

      // Fallback to view
      const { data, error } = await queryExternalData<Record<string, unknown>>({
        table: 'v_company_summary',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'id', value: companyId }] : [],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      const row = data?.[0];
      if (!row) return null;
      return {
        id: row.id as string,
        name: (row.nome_crm || row.nome_fantasia || row.razao_social || '') as string,
        cnpj: row.cnpj as string | undefined,
        industry: row.ramo_atividade as string | undefined,
        health_score: row.health_score as number | undefined,
        rfm_segment: row.rfm_segment as string | undefined,
        total_contacts: row.total_contacts as number | undefined,
        total_revenue: row.total_revenue as number | undefined,
        churn_risk: row.churn_risk as number | undefined,
      } as Company360;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Uses the RPC calculate_company_health_score.
 */
export function useCompanyHealthScore(companyId?: string) {
  return useQuery({
    queryKey: ['company-health-score', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc(
        'calculate_company_health_score',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data as { score: number; factors: Record<string, number>; level: string } | null;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

/**
 * Fetches company timeline via RPC get_company_timeline.
 */
export function useCompanyTimeline(companyId?: string, limit = 30) {
  return useQuery({
    queryKey: ['company-timeline', companyId, limit],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<CompanyTimelineEvent[]>(
        'get_company_timeline',
        { p_company_id: companyId, p_limit: limit }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetches next best action for a company.
 */
export function useNextBestAction(companyId?: string) {
  return useQuery({
    queryKey: ['next-best-action', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<NextBestAction>(
        'get_next_best_action',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches account plan for a company.
 */
export function useAccountPlan(companyId?: string) {
  return useQuery({
    queryKey: ['account-plan', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<AccountPlan>(
        'get_account_plan',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Calculates churn risk for a company.
 */
export function useChurnRisk(companyId?: string) {
  return useQuery({
    queryKey: ['churn-risk', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<string>(
        'calculate_churn_risk',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Calculates propensity score for a company.
 */
export function usePropensityScore(companyId?: string) {
  return useQuery({
    queryKey: ['propensity-score', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<number>(
        'calculate_propensity_score',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetches key contacts for a company.
 */
export function useKeyContacts(companyId?: string) {
  return useQuery({
    queryKey: ['key-contacts', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Array<{
        id: string;
        name: string;
        role: string;
        importance_score: number;
      }>>(
        'get_key_contacts',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches touchpoint summary for a company.
 */
export function useTouchpointSummary(companyId?: string) {
  return useQuery({
    queryKey: ['touchpoint-summary', companyId],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<TouchpointSummary>(
        'get_touchpoint_summary',
        { p_company_id: companyId }
      );
      if (error) throw error;
      return data;
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Fetches strategic accounts.
 */
export function useStrategicAccounts() {
  return useQuery({
    queryKey: ['strategic-accounts'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Array<{
        id: string;
        name: string;
        health_score: number;
        revenue: number;
        churn_risk: string;
      }>>(
        'get_strategic_accounts',
        {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Fetches duplicates from `vw_companies_duplicatas` view.
 */
export function useCompanyDuplicates(companyId?: string) {
  return useQuery({
    queryKey: ['company-duplicates', companyId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<Record<string, unknown>>({
        table: 'vw_companies_duplicatas',
        select: '*',
        filters: companyId ? [{ type: 'eq', column: 'company_id', value: companyId }] : [],
        range: { from: 0, to: 19 },
      });
      if (error) throw error;
      return (data || []).map(row => ({
        id: row.duplicate_id as string || row.id as string,
        name: row.nome_crm as string || '',
        cnpj: row.cnpj as string | undefined,
        similarity: (row.similarity as number) || 0,
      }));
    },
    enabled: !!companyId,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });
}

/**
 * Tag management hooks.
 */
export function useAllTags() {
  return useQuery({
    queryKey: ['all-tags'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<string[]>(
        'get_all_tags',
        {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCompaniesByTag(tag?: string) {
  return useQuery({
    queryKey: ['companies-by-tag', tag],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Array<{ id: string; name: string }>>(
        'get_companies_by_tag',
        { p_tag: tag }
      );
      if (error) throw error;
      return data || [];
    },
    enabled: !!tag,
    staleTime: 5 * 60 * 1000,
  });
}
