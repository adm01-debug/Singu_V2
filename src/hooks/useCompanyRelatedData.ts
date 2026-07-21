import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryExternalData, insertExternalData, updateExternalData, deleteExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';

// ─── Types ─────────────────────────────────────────────────────

export interface CompanyPhone {
  id?: string;
  company_id: string;
  phone_type: 'fixo_comercial' | 'celular_corporativo' | 'celular_pessoal';
  numero: string;
  numero_normalizado?: string;
  ramal?: string;
  is_primary?: boolean;
  is_whatsapp?: boolean;
  departamento?: string;
  observacao?: string;
}

export interface CompanyEmail {
  id?: string;
  company_id: string;
  email_type: 'corporativo' | 'pessoal' | 'financeiro' | 'nfe' | 'marketing';
  email: string;
  email_normalizado?: string;
  is_primary?: boolean;
  departamento?: string;
  observacao?: string;
  is_verified?: boolean;
}

export interface CompanyAddress {
  id?: string;
  company_id: string;
  tipo?: string;
  is_primary?: boolean;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
  latitude?: number;
  longitude?: number;
  ponto_referencia?: string;
  instrucoes_entrega?: string;
  horario_funcionamento?: string;
  google_maps_url?: string;
  google_place_id?: string;
  tipo_logradouro?: string;
}

export interface CompanySocialMedia {
  id?: string;
  company_id: string;
  plataforma: 'linkedin' | 'instagram' | 'facebook' | 'x' | 'youtube' | 'tiktok' | 'website' | 'whatsapp';
  handle?: string;
  url?: string;
  nome_perfil?: string;
  is_verified?: boolean;
  is_active?: boolean;
  seguidores?: number;
  observacoes?: string;
}

// ─── Generic hook factory ──────────────────────────────────────

function useCompanyRelated<T extends { id?: string; company_id: string }>(
  table: string,
  companyId: string | undefined,
  label: string,
) {
  const queryClient = useQueryClient();
  const queryKey = [table, companyId];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!companyId) return [];
      try {
        const { data, error } = await queryExternalData<T>({
          table,
          filters: [{ type: 'eq', column: 'company_id', value: companyId }],
          order: { column: 'created_at', ascending: true },
          range: { from: 0, to: 99 },
        });
        if (error) {
          // Gracefully handle missing tables in external DB (404/406)
          logger.warn(`[useCompanyRelated] Table "${table}" not available:`, error.message);
          return [];
        }
        return data || [];
      } catch (err) {
        logger.warn(`[useCompanyRelated] Failed to fetch "${table}":`, err);
        return [];
      }
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const upsert = useMutation({
    mutationFn: async (record: T) => {
      // Normalize: remove empty strings → null
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(record)) {
        cleaned[k] = v === '' ? null : v;
      }

      if (record.id) {
        const { id, company_id, ...updates } = cleaned as Record<string, unknown>;
        const { error } = await updateExternalData(table, record.id, updates);
        if (error) throw error;
      } else {
        const { error } = await insertExternalData(table, cleaned);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao salvar ${label}: ${parseApiError(err)}`);
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteExternalData(table, id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: Error) => {
      toast.error(`Erro ao remover ${label}: ${parseApiError(err)}`);
    },
  });

  return { data: query.data || [], isLoading: query.isLoading, upsert, remove, refetch: query.refetch };
}

// ─── Additional Types ──────────────────────────────────────────

export interface CompanyCnae {
  id?: string;
  company_id: string;
  codigo: string;
  descricao?: string;
  is_principal?: boolean;
  ordem?: number;
}

export interface CompanyRfmScore {
  id?: string;
  company_id: string;
  recency_score?: number;
  frequency_score?: number;
  monetary_score?: number;
  rfm_segment?: string;
  total_score?: number;
  last_purchase_date?: string;
  total_purchases?: number;
  total_revenue?: number;
  calculated_at?: string;
}

export interface CompanyStakeholder {
  id?: string;
  company_id: string;
  contact_id?: string;
  nome?: string;
  cargo?: string;
  departamento?: string;
  nivel_influencia?: number;
  nivel_decisao?: number;
  papel?: string;
  observacoes?: string;
}

// ─── Exported hooks ────────────────────────────────────────────

export function useCompanyPhones(companyId?: string) {
  return useCompanyRelated<CompanyPhone>('company_phones', companyId, 'telefone');
}

export function useCompanyEmails(companyId?: string) {
  return useCompanyRelated<CompanyEmail>('company_emails', companyId, 'email');
}

export function useCompanyAddresses(companyId?: string) {
  return useCompanyRelated<CompanyAddress>('company_addresses', companyId, 'endereço');
}

export function useCompanySocialMedia(companyId?: string) {
  return useCompanyRelated<CompanySocialMedia>('company_social_media', companyId, 'rede social');
}

export function useCompanyCnaes(companyId?: string) {
  return useCompanyRelated<CompanyCnae>('company_cnaes', companyId, 'CNAE');
}

export function useCompanyRfmScores(companyId?: string) {
  return useCompanyRelated<CompanyRfmScore>('company_rfm_scores', companyId, 'RFM');
}

export function useCompanyStakeholders(companyId?: string) {
  return useCompanyRelated<CompanyStakeholder>('company_stakeholder_map', companyId, 'stakeholder');
}
