import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface PendenciasQualidade {
  generated_at: string | null;
  deals_stalled: number | null;
  contacts_total: number | null;
  companies_total: number | null;
  contacts_orphans: number | null;
  companies_without_cnpj: number | null;
  companies_without_email: number | null;
  companies_without_owner: number | null;
}

export interface CnpjInvalido {
  company_id: string;
  name: string | null;
  cnpj: string | null;
  issue: string | null;
}

export interface CnpjDuplicado {
  cnpj: string;
  count: number;
  company_ids: string[];
}

export interface EmpresaIncompleta {
  company_id: string;
  company_name: string | null;
  missing_fields: string[] | null;
  completeness_pct: number | null;
}

export const ROTULO_CAMPO: Record<string, string> = {
  cnpj: 'CNPJ',
  email: 'E-mail',
  phone: 'Telefone',
  telefone: 'Telefone',
  owner_id: 'Responsável',
  ramo_atividade: 'Ramo de atividade',
  website: 'Site',
  endereco: 'Endereço',
  cidade: 'Cidade',
  estado: 'Estado',
};

export function usePendenciasQualidade() {
  return useQuery({
    queryKey: ['qualidade-cadastral-pendencias'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<PendenciasQualidade>('get_data_quality_report', {});
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCnpjsInvalidos() {
  return useQuery({
    queryKey: ['qualidade-cadastral-cnpj-invalido'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<CnpjInvalido[]>('find_invalid_cnpjs', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCnpjsDuplicados() {
  return useQuery({
    queryKey: ['qualidade-cadastral-cnpj-duplicado'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<CnpjDuplicado[]>('detect_cnpj_duplicates', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useEmpresasIncompletas(limite = 300) {
  return useQuery({
    queryKey: ['qualidade-cadastral-incompletas', limite],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<EmpresaIncompleta[]>('get_incomplete_companies', { p_limit: limite });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}