import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { logger } from '@/lib/logger';

/** Company stats from vw_companies_stats */
export interface CompanyStats {
  id: string;
  total_contacts?: number;
  total_deals?: number;
  open_deals_value?: number;
  won_deals_value?: number;
  total_interactions?: number;
  last_interaction_at?: string;
  avg_relationship_score?: number;
  [key: string]: unknown;
}

/** Company contact summary from vw_companies_contato */
export interface CompanyContato {
  id: string;
  primary_phone?: string;
  primary_email?: string;
  total_phones?: number;
  total_emails?: number;
  [key: string]: unknown;
}

/** Company brand colors from vw_companies_cores */
export interface CompanyCores {
  id: string;
  cores_marca?: string;
  logo_url?: string;
  [key: string]: unknown;
}

/** Full company summary from v_company_summary */
export interface CompanySummary {
  id: string;
  nome_crm?: string;
  cnpj?: string;
  total_contacts?: number;
  total_deals?: number;
  total_revenue?: number;
  health_score?: number;
  rfm_segment?: string;
  lead_score?: number;
  lead_status?: string;
  [key: string]: unknown;
}

function useCompanyView<T>(viewName: string, companyId?: string) {
  return useQuery({
    queryKey: [viewName, companyId],
    queryFn: async () => {
      try {
        const { data, error } = await queryExternalData<T>({
          table: viewName,
          select: '*',
          filters: companyId ? [{ type: 'eq', column: 'id', value: companyId }] : [],
          range: { from: 0, to: 0 },
        });
        if (error) {
          logger.warn(`[useCompanyView] ${viewName} not available:`, error.message);
          return null;
        }
        return (data?.[0] as T) || null;
      } catch (err) {
        logger.warn(`[useCompanyView] ${viewName} failed:`, err);
        return null;
      }
    },
    enabled: !!companyId,
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useCompanyStatsView(companyId?: string) {
  return useCompanyView<CompanyStats>('vw_companies_stats', companyId);
}

export function useCompanyContatoView(companyId?: string) {
  return useCompanyView<CompanyContato>('vw_companies_contato', companyId);
}

export function useCompanyCoresView(companyId?: string) {
  return useCompanyView<CompanyCores>('vw_companies_cores', companyId);
}

export function useCompanySummaryView(companyId?: string) {
  return useCompanyView<CompanySummary>('v_company_summary', companyId);
}
