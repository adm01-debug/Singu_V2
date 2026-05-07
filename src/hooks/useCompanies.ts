import { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { queryExternalData, insertExternalData, updateExternalData, updateExternalDataWithVersion, deleteExternalData, ConcurrentEditError } from '@/lib/externalData';
import { showConcurrentEditToast } from '@/lib/concurrentEditToast';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

export type Company = Tables<'companies'>;
export type CompanyInsert = TablesInsert<'companies'>;
export type CompanyUpdate = TablesUpdate<'companies'>;

/** Fields from the local Supabase schema that do NOT exist in the external DB */
const LOCAL_ONLY = new Set([
  'name', 'industry', 'tags', 'notes', 'phone', 'email', 'address',
  'city', 'state', 'instagram', 'linkedin', 'facebook',
  'youtube', 'twitter', 'tiktok', 'merge_notes',
]);

interface ExternalRow extends Record<string, unknown> {
  nome_crm?: string;
  nome_fantasia?: string;
  razao_social?: string;
  ramo_atividade?: string;
  tags_array?: string[];
  id?: string;
}

interface CompaniesPage { companies: Company[]; count: number }

const COMPANIES_PAGE_SIZE = 500;
const MAX_COMPANIES_TOTAL = 2000;
const INITIAL_FAST_LOAD = 100;

/** Columns needed for listing — avoids SELECT * which is slow on wide tables */
const LISTING_SELECT = [
  'id', 'nome_crm', 'nome_fantasia', 'razao_social', 'cnpj', 'cnpj_base',
  'ramo_atividade', 'nicho_cliente', 'tags_array', 'status',
  'is_customer', 'is_carrier', 'is_supplier', 'is_matriz',
  'grupo_economico', 'grupo_economico_id', 'tipo_cooperativa', 'numero_cooperativa',
  'matriz_id', 'central_id', 'singular_id', 'confederacao_id',
  'capital_social', 'porte_rf', 'situacao_rf', 'situacao_rf_data',
  'natureza_juridica', 'natureza_juridica_desc', 'data_fundacao',
  'website', 'logo_url',
  'updated_at', 'created_at', 'user_id',
  'financial_health', 'annual_revenue', 'employee_count',
  'bitrix_company_id', 'cores_marca',
  'lead_score', 'lead_status', 'lead_score_updated_at',
  'bitrix_created_at', 'bitrix_updated_at', 'created_by_id',
  'deleted_at', 'deleted_by',
].join(',');
const COMPANY_SEARCH_COLUMNS = [
  'nome_crm',
  'nome_fantasia',
  'razao_social',
  'ramo_atividade',
  'nicho_cliente',
  'grupo_economico',
  'tipo_cooperativa',
  'cnpj',
] as const;

/** Extract city/state from nome_crm patterns like "PAC Xerém - RJ - Duque de Caxias/RJ" */
function extractLocationFromName(name: string): { city: string | null; state: string | null } {
  // Pattern: "... - City/UF" at end
  const slashMatch = name.match(/[-–—]\s*([^-–—/]+)\/([A-Z]{2})\s*$/);
  if (slashMatch) return { city: slashMatch[1].trim(), state: slashMatch[2] };
  // Pattern: "... - UF" at end (2-letter state)
  const ufMatch = name.match(/[-–—]\s*([A-Z]{2})\s*$/);
  if (ufMatch) return { city: null, state: ufMatch[1] };
  return { city: null, state: null };
}

function mapCompany(ext: ExternalRow): Company {
  const rawName = ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome';
  
  // Extract location from name when city/state are missing
  const extCity = ext.city as string | null;
  const extState = ext.state as string | null;
  let city = extCity || null;
  let state = extState || null;
  
  if (!city && !state) {
    const parsed = extractLocationFromName(rawName);
    city = parsed.city;
    state = parsed.state;
  }

  return {
    ...ext,
    name: rawName,
    industry: ext.ramo_atividade || ext.nicho_cliente as string || null,
    tags: ext.tags_array || [],
    city,
    state,
    // Dados fiscais/cadastrais
    capital_social: ext.capital_social as number | null ?? null,
    cnpj: ext.cnpj as string | null ?? null,
    cnpj_base: ext.cnpj_base as string | null ?? null,
    razao_social: ext.razao_social as string | null ?? null,
    situacao_rf: ext.situacao_rf as string | null ?? null,
    situacao_rf_data: ext.situacao_rf_data as string | null ?? null,
    porte_rf: ext.porte_rf as string | null ?? null,
    natureza_juridica: ext.natureza_juridica as string | null ?? null,
    natureza_juridica_desc: ext.natureza_juridica_desc as string | null ?? null,
    data_fundacao: ext.data_fundacao as string | null ?? null,
    inscricao_estadual: ext.inscricao_estadual as string | null ?? null,
    inscricao_municipal: ext.inscricao_municipal as string | null ?? null,
    // Classificação
    ramo_atividade: ext.ramo_atividade as string | null ?? null,
    nicho_cliente: ext.nicho_cliente as string | null ?? null,
    is_customer: ext.is_customer as boolean | null ?? false,
    is_carrier: ext.is_carrier as boolean | null ?? false,
    is_supplier: ext.is_supplier as boolean | null ?? false,
    is_matriz: ext.is_matriz as boolean | null ?? null,
    // Estrutura cooperativista / grupo
    grupo_economico: ext.grupo_economico as string | null ?? null,
    grupo_economico_id: ext.grupo_economico_id as string | null ?? null,
    tipo_cooperativa: ext.tipo_cooperativa as string | null ?? null,
    numero_cooperativa: ext.numero_cooperativa as string | null ?? null,
    matriz_id: ext.matriz_id as string | null ?? null,
    central_id: ext.central_id as string | null ?? null,
    singular_id: ext.singular_id as string | null ?? null,
    confederacao_id: ext.confederacao_id as string | null ?? null,
    // Outros
    website: ext.website as string | null ?? null,
    financial_health: ext.financial_health as string | null ?? null,
    annual_revenue: ext.annual_revenue as string | null ?? null,
    employee_count: ext.employee_count as string | null ?? null,
    status: ext.status as string | null ?? null,
    logo_url: ext.logo_url as string | null ?? null,
    bitrix_company_id: ext.bitrix_company_id as number | null ?? null,
    extra_data_rf: ext.extra_data_rf ?? null,
    cores_marca: ext.cores_marca as string | null ?? null,
    lead_score: ext.lead_score as number | null ?? null,
    lead_status: ext.lead_status as string | null ?? null,
    lead_score_updated_at: ext.lead_score_updated_at as string | null ?? null,
    bitrix_created_at: ext.bitrix_created_at as string | null ?? null,
    bitrix_updated_at: ext.bitrix_updated_at as string | null ?? null,
    created_by_id: ext.created_by_id as string | null ?? null,
    deleted_at: ext.deleted_at as string | null ?? null,
    deleted_by: ext.deleted_by as string | null ?? null,
  } as unknown as Company;
}

function stripLocal(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (!LOCAL_ONLY.has(k)) out[k] = v;
  }
  return out;
}

async function fetchCompaniesPage(search?: string): Promise<CompaniesPage> {
  const buildOptions = (range: { from: number; to: number }): Parameters<typeof queryExternalData>[0] => ({
    table: 'companies',
    select: LISTING_SELECT,
    countMethod: 'planned',
    order: { column: 'updated_at', ascending: false },
    range,
    filters: [
      { type: 'is', column: 'deleted_at', value: null },
    ],
    ...(search && search.trim().length >= 2
      ? {
          search: {
            term: search.trim(),
            columns: [...COMPANY_SEARCH_COLUMNS],
          },
        }
      : {}),
  });

  const fetchBatch = async (range: { from: number; to: number }) => {
    const { data, count, error } = await queryExternalData<ExternalRow>(buildOptions(range));
    if (error) throw error;
    return { rows: data || [], count: count || 0 };
  };

  // Fast initial load — just the first batch
  const firstBatch = await fetchBatch({ from: 0, to: INITIAL_FAST_LOAD - 1 });
  const totalCount = firstBatch.count || firstBatch.rows.length;

  const seen = new Set<string>();
  const uniqueRows = firstBatch.rows.filter((row) => {
    if (!row.id) return false;
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  return { companies: uniqueRows.map(mapCompany), count: totalCount };
}

/** Load remaining companies beyond initial fast load (called lazily) */
async function fetchRemainingCompanies(search?: string): Promise<Company[]> {
  const buildOptions = (range: { from: number; to: number }): Parameters<typeof queryExternalData>[0] => ({
    table: 'companies',
    select: LISTING_SELECT,
    order: { column: 'updated_at', ascending: false },
    range,
    filters: [
      { type: 'is', column: 'deleted_at', value: null },
    ],
    ...(search && search.trim().length >= 2
      ? {
          search: {
            term: search.trim(),
            columns: [...COMPANY_SEARCH_COLUMNS],
          },
        }
      : {}),
  });

  // First, get total count
  const { count } = await queryExternalData<ExternalRow>({
    ...buildOptions({ from: 0, to: 0 }),
    select: 'id',
  });
  const totalCount = count || 0;
  const cappedTotal = Math.min(totalCount, MAX_COMPANIES_TOTAL);

  if (cappedTotal <= INITIAL_FAST_LOAD) return [];

  const pendingRanges: Array<{ from: number; to: number }> = [];
  for (let from = INITIAL_FAST_LOAD; from < cappedTotal; from += COMPANIES_PAGE_SIZE) {
    pendingRanges.push({
      from,
      to: Math.min(from + COMPANIES_PAGE_SIZE - 1, cappedTotal - 1),
    });
  }

  let allRows: ExternalRow[] = [];
  for (let index = 0; index < pendingRanges.length; index += 3) {
    const slice = pendingRanges.slice(index, index + 3);
    const batches = await Promise.all(slice.map(async (range) => {
      const { data, error } = await queryExternalData<ExternalRow>(buildOptions(range));
      if (error) throw error;
      return data || [];
    }));
    allRows = allRows.concat(batches.flat());
  }

  const seen = new Set<string>();
  return allRows
    .filter((row) => {
      if (!row.id) return false;
      if (seen.has(row.id)) return false;
      seen.add(row.id);
      return true;
    })
    .map(mapCompany);
}

export function useCompanies(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const externalEnabled = options?.enabled ?? true;

  const queryKey = ['companies', searchTerm || '__all__'];

  const { data, isLoading: loading } = useQuery({
    queryKey,
    queryFn: () => fetchCompaniesPage(searchTerm || undefined),
    enabled: !!user && externalEnabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  // Background-load remaining companies — deferred to avoid blocking initial render
  const remainingKey = ['companies-remaining', searchTerm || '__all__'];
  const { data: remainingCompanies } = useQuery({
    queryKey: remainingKey,
    queryFn: async () => {
      // Wait 2s before starting background fetch to prioritize initial render
      await new Promise(r => setTimeout(r, 2000));
      return fetchRemainingCompanies(searchTerm || undefined);
    },
    enabled: !!user && externalEnabled && !!data && data.count > INITIAL_FAST_LOAD,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const companies = useMemo(() => {
    const initial = data?.companies ?? [];
    if (!remainingCompanies || remainingCompanies.length === 0) return initial;
    // Merge & deduplicate
    const seen = new Set(initial.map(c => c.id));
    const extra = remainingCompanies.filter(c => !seen.has(c.id));
    return [...initial, ...extra];
  }, [data?.companies, remainingCompanies]);

  const totalCount = data?.count ?? 0;

  const fetchCompanies = useCallback(async (search?: string) => {
    if (search !== undefined) setSearchTerm(search);
    await queryClient.invalidateQueries({ queryKey: ['companies'] });
  }, [queryClient]);

  const createCompany = async (company: Omit<CompanyInsert, 'user_id'>) => {
    if (!user) return null;
    try {
      const input = company as Record<string, unknown>;
      const ext = stripLocal(input);
      const record = { ...ext, user_id: user.id } as Record<string, unknown>;
      if (!record.nome_crm && input.name) record.nome_crm = input.name;

      const { data, error } = await insertExternalData<Company>('companies', record);
      if (error) throw error;
      if (data) {
        queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
          prev
            ? { ...prev, companies: [mapCompany(data as unknown as ExternalRow), ...prev.companies], count: prev.count + 1 }
            : { companies: [mapCompany(data as unknown as ExternalRow)], count: 1 }
        );
      }
      const companyName = (data as Record<string, unknown>)?.nome_crm || 'Empresa';
      toast({ title: 'Empresa criada', description: `${companyName} foi adicionada com sucesso.` });
      if (data) logActivity({ type: 'created', entityType: 'company', entityId: (data as Record<string, unknown>).id as string, entityName: String(companyName), description: 'Empresa criada' });
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error creating company:', { error: msg });
      toast({ title: 'Erro ao criar empresa', description: msg, variant: 'destructive' });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate, expectedVersion?: number) => {
    const previous = queryClient.getQueryData<CompaniesPage>(queryKey);
    queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
      prev ? { ...prev, companies: prev.companies.map(c => c.id === id ? { ...c, ...updates } as Company : c) } : prev
    );
    try {
      const input = updates as Record<string, unknown>;
      const clean = stripLocal(input);
      delete clean.id;
      const { data, error } = expectedVersion !== undefined
        ? await updateExternalDataWithVersion<Company>('companies', id, expectedVersion, clean)
        : await updateExternalData<Company>('companies', id, clean);
      if (error) throw error;
      if (data) {
        queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
          prev ? { ...prev, companies: prev.companies.map(c => c.id === id ? mapCompany(data as unknown as ExternalRow) : c) } : prev
        );
      }
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      if (data) logActivity({ type: 'updated', entityType: 'company', entityId: id, entityName: (data as Record<string, unknown>).nome_crm as string || 'Empresa', description: 'Empresa atualizada' });
      return data;
    } catch (error) {
      if (previous) queryClient.setQueryData<CompaniesPage>(queryKey, previous);
      logger.error('Error updating company:', error);
      if (error instanceof ConcurrentEditError) {
        showConcurrentEditToast({ entity: 'empresa', queryClient, queryKey });
      } else {
        toast({ title: 'Erro ao atualizar empresa', description: 'Verifique os dados e tente novamente.', variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    const previous = queryClient.getQueryData<CompaniesPage>(queryKey);
    queryClient.setQueryData<CompaniesPage>(queryKey, prev =>
      prev ? { ...prev, companies: prev.companies.filter(c => c.id !== id), count: Math.max(0, prev.count - 1) } : prev
    );
    try {
      const { success, error } = await deleteExternalData('companies', id);
      if (error || !success) throw error || new Error('Delete failed');
      const deleted = previous?.companies.find(c => c.id === id);
      logActivity({ type: 'deleted', entityType: 'company', entityId: id, entityName: deleted?.name || undefined, description: 'Empresa excluída' });
      toast({ title: 'Empresa removida', description: 'A empresa foi excluída com sucesso.' });
      return true;
    } catch (error) {
      if (previous) queryClient.setQueryData<CompaniesPage>(queryKey, previous);
      logger.error('Error deleting company:', error);
      toast({ title: 'Erro ao excluir empresa', description: 'Não foi possível excluir a empresa.', variant: 'destructive' });
      return false;
    }
  };

  return {
    companies, loading, totalCount, searchTerm,
    setSearchTerm: (term: string) => { setSearchTerm(term); },
    fetchCompanies, createCompany, updateCompany, deleteCompany,
  };
}
