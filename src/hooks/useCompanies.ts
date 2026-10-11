import { useCallback, useMemo, useState } from 'react';
import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useActivityLogger } from '@/hooks/useActivityLogger';
import { queryExternalData, insertExternalData, updateExternalData, updateExternalDataWithVersion, deleteExternalData, ConcurrentEditError } from '@/lib/externalData';
import { showConcurrentEditToast } from '@/lib/concurrentEditToast';
import { z } from 'zod';
import { Constants, type Json, type Tables, type TablesInsert, type TablesUpdate } from '@/integrations/supabase/types';
import { logger } from "@/lib/logger";

type CompanyRow = Tables<'companies'>;
type CompanyAliases = {
  name: string;
  industry: string | null;
  tags: string[];
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  lat: number | null;
  lng: number | null;
};
type AddressSummary = Pick<Tables<'company_addresses'>, 'id' | 'is_primary' | 'logradouro' | 'numero' | 'cidade' | 'estado' | 'latitude' | 'longitude'>;
type EmailSummary = Pick<Tables<'company_emails'>, 'id' | 'is_primary' | 'email'>;
type PhoneSummary = Pick<Tables<'company_phones'>, 'id' | 'is_primary' | 'numero'>;
type CompanyRelations = {
  company_addresses: AddressSummary[];
  company_emails: EmailSummary[];
  company_phones: PhoneSummary[];
};

export type Company = Omit<CompanyRow, 'industry' | 'tags'> & CompanyAliases & CompanyRelations & {
  // Métricas virtuais agregadas por consumidores do domínio.
  _contact_count?: number;
  _last_interaction_days?: number | null;
  _health_score?: number;
  similarity?: number;
};
export type CompanyInsert = Omit<TablesInsert<'companies'>, 'nome_crm'> & Partial<CompanyAliases> & (
  { nome_crm: string } | { name: string; nome_crm?: string }
);
export type CompanyUpdate = TablesUpdate<'companies'> & Partial<CompanyAliases>;

const text = z.string().nullable().default(null);
const numeric = z.number().finite().nullable().default(null);
const boolean = z.boolean().nullable().default(null);
const strings = z.array(z.string()).nullable().default(null);
const json: z.ZodType<Json> = z.lazy(() => z.union([
  z.string(), z.number().finite(), z.boolean(), z.null(), z.array(json), z.record(json),
]));
const nullableJson = json.nullable().default(null);
// Todos os campos canônicos são validados; campos omitidos na listagem ficam nulos no domínio.
const companyShape = {
  id: z.string().min(1), nome_crm: z.string(), version: z.number().int().nonnegative(),
  action_filter: text, annual_revenue: text, bitrix_company_id: numeric,
  bitrix_created_at: text, bitrix_updated_at: text, brand_colors: nullableJson,
  capital_social: numeric, central_id: text, challenges: strings, chunk_size: text,
  cnpj: text, cnpj_base: text, cnpj_normalizado_em: text, comparison_style: text,
  competitors: strings, confederacao_id: text,
  cores_marca: z.array(z.enum(Constants.public.Enums.cor_grupo)).nullable().default(null),
  created_at: text, created_by_id: numeric, data_fundacao: text, deleted_at: text,
  deleted_by: text, emotional_confidence: numeric, emotional_state: text,
  emotional_trigger: text, employee_count: text, empresa_atualizada_em: text,
  extra_data_rf: nullableJson, financial_health: text, grupo_economico: text,
  grupo_economico_id: text, industry: text, inscricao_estadual: text,
  inscricao_municipal: text, is_carrier: boolean, is_customer: boolean,
  is_matriz: boolean, is_supplier: boolean, lead_score: numeric,
  lead_score_updated_at: text, lead_status: text, logo_color_url: text,
  logo_mono_url: text, logo_url: text, matriz_id: text, merge_notes: nullableJson,
  metaprogram_profile: nullableJson, most_frequent_objection: text,
  motivation_direction: text, natureza_juridica: text, natureza_juridica_desc: text,
  nicho_cliente: text, nome_crm_atualizado_em: text, nome_fantasia: text, notes: text,
  numero_cooperativa: text, numero_cooperativa_singular: text, porte_rf: text,
  ramo_atividade: text, razao_social: text, reference_frame: text, regime_tributario: text,
  search_vector: z.unknown(), singular_id: text, situacao_rf: text,
  situacao_rf_data: text, social_media_searched_at: text,
  status: z.enum(Constants.public.Enums.company_status).nullable().default(null),
  tags: strings, tags_array: strings, tipo_cooperativa: text, updated_at: text,
  user_id: text, vak_dominant: text, vak_profile: nullableJson,
  verificado_em: text, website: text, working_style: text,
} satisfies { [K in keyof CompanyRow]: z.ZodType<CompanyRow[K]> };
const companyRowSchema = z.object(companyShape);
const addressSummarySchema = z.object({
  id: z.string(), is_primary: boolean, logradouro: text, numero: text,
  cidade: text, estado: text, latitude: numeric, longitude: numeric,
});
const companySchema = companyRowSchema.extend({
  company_addresses: z.array(addressSummarySchema).default([]),
  company_emails: z.array(z.object({ id: z.string(), is_primary: boolean, email: z.string() })).default([]),
  company_phones: z.array(z.object({ id: z.string(), is_primary: boolean, numero: z.string() })).default([]),
  similarity: z.number().finite().optional(),
});

interface CompaniesPage { companies: Company[]; count: number }

const COMPANIES_PAGE_SIZE = 500;
const MAX_COMPANIES_TOTAL = 60000;
const INITIAL_FAST_LOAD = 100;

/** Columns needed for listing — avoids SELECT * which is slow on wide tables */
const LISTING_SELECT = [
   'id', 'nome_crm', 'nome_fantasia', 'razao_social', 'cnpj', 'cnpj_base',
   'vak_dominant', 'motivation_direction', 'working_style',
  'ramo_atividade', 'nicho_cliente', 'tags_array', 'status',
  'is_customer', 'is_carrier', 'is_supplier', 'is_matriz',
  'grupo_economico', 'grupo_economico_id', 'tipo_cooperativa', 'numero_cooperativa',
  'matriz_id', 'central_id', 'singular_id', 'confederacao_id',
  'capital_social', 'porte_rf', 'situacao_rf', 'situacao_rf_data',
  'natureza_juridica', 'natureza_juridica_desc', 'data_fundacao',
  'inscricao_estadual', 'inscricao_municipal', 'challenges', 'competitors', 'merge_notes',
  'website', 'logo_url', 'version', 'notes', 'industry', 'tags',
  'company_addresses(id,is_primary,logradouro,numero,cidade,estado,latitude,longitude)',
  'company_emails(id,is_primary,email)', 'company_phones(id,is_primary,numero)',
  'updated_at', 'created_at', 'user_id',
  'financial_health', 'annual_revenue', 'employee_count',
  'bitrix_company_id', 'cores_marca',
  'lead_score', 'lead_status', 'lead_score_updated_at',
  'bitrix_created_at', 'bitrix_updated_at', 'created_by_id',
  'deleted_at', 'deleted_by',
].join(',');
const companyAliasSchema = z.object({
  name: z.string(), phone: z.string().nullable(), email: z.string().email().nullable().or(z.literal('')),
  address: z.string().nullable(), city: z.string().nullable(), state: z.string().nullable(),
  lat: z.number().finite().nullable(), lng: z.number().finite().nullable(),
}).partial();
const relationMetadata = {
  id: z.string().optional(), created_at: text.optional(), updated_at: text.optional(),
  is_primary: z.boolean().nullable().optional(),
};
const phoneInsertSchema = z.object({
  ...relationMetadata, numero: z.string().min(1), numero_normalizado: text.optional(),
  numero_e164: text.optional(), phone_type: z.enum(Constants.public.Enums.phone_type).nullable().optional(),
  ramal: text.optional(), is_whatsapp: z.boolean().nullable().optional(),
  departamento: text.optional(), observacao: text.optional(), fonte: text.optional(),
  contexto: text.optional(), confiabilidade: numeric.optional(),
}).strict();
const emailInsertSchema = z.object({
  ...relationMetadata, email: z.string().email(), email_normalizado: text.optional(),
  email_type: z.enum(Constants.public.Enums.email_type).nullable().optional(),
  departamento: text.optional(), observacao: text.optional(), fonte: text.optional(),
  contexto: text.optional(), confiabilidade: numeric.optional(), is_verified: z.boolean().nullable().optional(),
}).strict();
const addressInsertSchema = z.object({
  ...relationMetadata, bairro: text.optional(), cep: text.optional(), cidade: text.optional(),
  cidade_ibge: numeric.optional(), complemento: text.optional(), estado: text.optional(),
  google_maps_url: text.optional(), google_place_id: text.optional(), horario_funcionamento: text.optional(),
  instrucoes_entrega: text.optional(), latitude: numeric.optional(), longitude: numeric.optional(),
  logradouro: text.optional(), numero: text.optional(), origem: text.optional(), pais: text.optional(),
  ponto_referencia: text.optional(), tipo: text.optional(), tipo_logradouro: text.optional(),
}).strict();
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
  // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
  const slashMatch = name.match(/[-–—]\s*([^-–—/]+)\/([A-Z]{2})\s*$/);
  if (slashMatch) return { city: slashMatch[1].trim(), state: slashMatch[2] };
  // Pattern: "... - UF" at end (2-letter state)
  const ufMatch = name.match(/[-–—]\s*([A-Z]{2})\s*$/);
  if (ufMatch) return { city: null, state: ufMatch[1] };
  return { city: null, state: null };
}

export function mapCompany(raw: unknown): Company {
  // A asserção única compensa a inferência opcional do Zod com strictNullChecks=false,
  // depois da validação de todos os campos e relações, sem confiar no JSON do proxy.
  const ext = companySchema.parse(raw) as CompanyRow & CompanyRelations & { similarity?: number };
  const rawName = ext.nome_crm || ext.nome_fantasia || ext.razao_social || 'Sem nome';
  
  // Extract location from name when city/state are missing
  const primaryAddress = primaryRelation(ext.company_addresses);
  const extCity = primaryAddress?.cidade;
  const extState = primaryAddress?.estado;
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
    industry: ext.ramo_atividade || ext.nicho_cliente || ext.industry || null,
    tags: ext.tags_array ?? ext.tags ?? [],
    is_customer: ext.is_customer ?? false,
    is_carrier: ext.is_carrier ?? false,
    is_supplier: ext.is_supplier ?? false,
    phone: primaryRelation(ext.company_phones)?.numero ?? null,
    email: primaryRelation(ext.company_emails)?.email ?? null,
    address: primaryAddress?.logradouro ?? null,
    city,
    state,
    lat: primaryAddress?.latitude ?? null,
    lng: primaryAddress?.longitude ?? null,
    similarity: ext.similarity,
  };
}

function primaryRelation<T extends { id: string; is_primary: boolean | null }>(rows: T[]): T | undefined {
  return [...rows].sort((a, b) => Number(b.is_primary === true) - Number(a.is_primary === true) || a.id.localeCompare(b.id))[0];
}

export function prepareCompanyWrite(input: CompanyUpdate): Record<string, unknown> {
  const { name, phone, email, address, city, state, lat, lng, id, version, ...record } = input;
  companyAliasSchema.parse({ name, phone, email, address, city, state, lat, lng });
  if (name !== undefined && record.nome_crm === undefined) record.nome_crm = name;
  if (input.industry !== undefined && record.ramo_atividade === undefined) record.ramo_atividade = input.industry;
  if (input.tags !== undefined && record.tags_array === undefined) record.tags_array = input.tags;
  return companyRowSchema.omit({ id: true, version: true }).partial().strict().parse(record);
}

async function fetchCompany(id: string): Promise<Company> {
  const { data, error } = await queryExternalData<unknown>({
    table: 'companies', select: LISTING_SELECT,
    filters: [{ type: 'eq', column: 'id', value: id }], range: { from: 0, to: 0 },
  });
  if (error) throw error;
  if (!data?.[0]) throw new Error('Empresa salva, mas não foi possível recarregar seus dados.');
  return mapCompany(data[0]);
}

async function saveCompanyAliases(id: string, input: CompanyUpdate, previous?: Company) {
  const email = primaryRelation(previous?.company_emails ?? []);
  const phone = primaryRelation(previous?.company_phones ?? []);
  const address = primaryRelation(previous?.company_addresses ?? []);
  const writes: Promise<
    { data: unknown; error: Error | null } | { success: boolean; error: Error | null }
  >[] = [];
  if (input.email !== undefined) {
    if (input.email) writes.push(email
      ? updateExternalData('company_emails', email.id, { email: input.email })
      : insertExternalData('company_emails', { company_id: id, email: input.email, is_primary: true }));
    else if (email) writes.push(deleteExternalData('company_emails', email.id));
  }
  if (input.phone !== undefined) {
    if (input.phone) writes.push(phone
      ? updateExternalData('company_phones', phone.id, { numero: input.phone })
      : insertExternalData('company_phones', { company_id: id, numero: input.phone, is_primary: true }));
    else if (phone) writes.push(deleteExternalData('company_phones', phone.id));
  }
  const addressUpdates: TablesUpdate<'company_addresses'> = {};
  if (input.address !== undefined) addressUpdates.logradouro = input.address;
  if (input.city !== undefined) addressUpdates.cidade = input.city;
  if (input.state !== undefined) addressUpdates.estado = input.state;
  if (input.lat !== undefined) addressUpdates.latitude = input.lat;
  if (input.lng !== undefined) addressUpdates.longitude = input.lng;
  if (Object.keys(addressUpdates).length && (address || Object.values(addressUpdates).some(value => value != null && value !== ''))) writes.push(address
    ? updateExternalData('company_addresses', address.id, addressUpdates)
    : insertExternalData('company_addresses', { ...addressUpdates, company_id: id, is_primary: true }));
  const results = await Promise.all(writes);
  const failure = results.find(result => result.error || ('success' in result ? !result.success : result.data == null));
  if (failure) throw new Error(`Empresa salva, mas houve falha nos dados relacionados: ${failure.error?.message || 'Resposta vazia da relação.'}`);
}

async function fetchCompaniesPage(search?: string, page = 0): Promise<CompaniesPage> {
  const buildOptions = (range: { from: number; to: number }, opts?: { countMethod?: 'exact' | 'planned' }): Parameters<typeof queryExternalData>[0] => ({
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
    ...(opts?.countMethod ? { countMethod: opts.countMethod } : {}),
  });

  const fetchBatch = async (range: { from: number; to: number }, opts?: { countMethod?: 'exact' | 'planned' }) => {
    const { data, count, error } = await queryExternalData<unknown>(buildOptions(range, opts));
    if (error) throw error;
    return { rows: (data || []).map(mapCompany), count: count || 0 };
  };

  const isFirstPage = page === 0;
  const from = isFirstPage ? 0 : INITIAL_FAST_LOAD + (page - 1) * COMPANIES_PAGE_SIZE;
  const to = isFirstPage ? INITIAL_FAST_LOAD - 1 : from + COMPANIES_PAGE_SIZE - 1;

  const batch = await fetchBatch({ from, to }, { countMethod: isFirstPage ? 'exact' : undefined });

  const seen = new Set<string>();
  const uniqueRows = batch.rows.filter((row) => {
    if (!row.id) return false;
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });

  return { companies: uniqueRows, count: batch.count };
}

/** Load remaining companies beyond initial fast load (called lazily) */
async function fetchRemainingCompanies(search?: string): Promise<Company[]> {
  return [];
}

export function useCompanies(options?: { enabled?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLogger();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const externalEnabled = options?.enabled ?? true;

  const queryKey = ['companies-infinite-v2', searchTerm || '__all__', user?.id];

  const {
    data,
    isLoading: loading,
    isFetching,
    error: queryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) => fetchCompaniesPage(searchTerm || undefined, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce((sum, p) => sum + p.companies.length, 0);
      const totalKnown = allPages[0]?.count || totalLoaded;
      if (totalLoaded >= totalKnown || totalLoaded >= MAX_COMPANIES_TOTAL) return undefined;
      return allPages.length;
    },
    enabled: !!user && externalEnabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const companies = useMemo(() => {
    const pages = data?.pages ?? [];
    const seen = new Set<string>();
    const result: Company[] = [];
    for (const p of pages) {
      for (const c of p.companies) {
        if (!c.id || seen.has(c.id)) continue;
        seen.add(c.id);
        result.push(c);
      }
    }
    return result;
  }, [data?.pages]);

  const totalCount = data?.pages?.[0]?.count ?? 0;

  const fetchCompanies = useCallback(async (search?: string) => {
    if (search !== undefined) setSearchTerm(search);
    await queryClient.invalidateQueries({ queryKey: ['companies-infinite-v2'] });
  }, [queryClient]);

  const createCompany = async (company: CompanyInsert & {
    phones?: Array<Omit<TablesInsert<'company_phones'>, 'company_id' | 'numero_normalizado'> & { numero_normalizado?: string }>;
    emails?: Array<Omit<TablesInsert<'company_emails'>, 'company_id'>>;
    addresses?: Array<Omit<TablesInsert<'company_addresses'>, 'company_id'>>;
  }) => {
    if (!user) return null;
    try {
      const { phones: rawPhones, emails: rawEmails, addresses: rawAddresses, ...companyData } = company;
      const phones = rawPhones?.map(phone => phoneInsertSchema.parse(phone));
      const emails = rawEmails?.map(email => emailInsertSchema.parse(email));
      const addresses = rawAddresses?.map(address => addressInsertSchema.parse(address));
      const input = companyData;
      const record = { ...prepareCompanyWrite(input), user_id: user.id };
      z.object({ nome_crm: z.string().trim().min(1) }).parse(record);

      const { data: raw, error } = await insertExternalData<unknown>('companies', record);
      if (error) throw error;
      if (!raw) throw new Error('Escrita não retornou uma empresa válida.');
      let data = mapCompany(raw);
      
      if (data) {
        const companyId = data.id;
        
        // Parallel insertion of related data if provided
        const relatedPromises = [];
        if (phones?.length) {
          relatedPromises.push(...phones.map(p => insertExternalData('company_phones', { ...p, company_id: companyId })));
        }
        if (emails?.length) {
          relatedPromises.push(...emails.map(e => insertExternalData('company_emails', { ...e, company_id: companyId })));
        }
        if (addresses?.length) {
          relatedPromises.push(...addresses.map(a => insertExternalData('company_addresses', { ...a, company_id: companyId })));
        }
        
        const results = await Promise.all(relatedPromises);
        const failure = results.find(result => result.error || result.data == null);
        if (failure) throw new Error(`Empresa criada, mas houve falha nos dados relacionados: ${failure.error?.message || 'Resposta vazia da relação.'}`);
        await saveCompanyAliases(companyId, input, await fetchCompany(companyId));
        const mapped = await fetchCompany(companyId);
        data = mapped;
        queryClient.setQueryData<InfiniteData<CompaniesPage>>(queryKey, prev =>
          prev
            ? {
                ...prev,
                pages: prev.pages.map((p, i) =>
                  i === 0
                    ? { ...p, companies: [mapped, ...p.companies], count: p.count + 1 }
                    : p
                ),
              }
            : { pages: [{ companies: [mapped], count: 1 }], pageParams: [0] }
        );
      }
      
      const companyName = data?.name || input.name || input.nome_crm || 'Empresa';
      toast({ title: 'Empresa criada', description: `${companyName} foi adicionada com sucesso.` });
      
      if (data) {
        logActivity({ 
          type: 'created', 
          entityType: 'company', 
          entityId: data.id,
          entityName: String(companyName), 
          description: 'Empresa criada com dados compostos' 
        });
      }
      return data;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao criar empresa:', { error: msg });
      void queryClient.invalidateQueries({ queryKey });
      toast({ title: 'Erro ao criar empresa', description: msg, variant: 'destructive' });
      return null;
    }
  };

  const updateCompany = async (id: string, updates: CompanyUpdate, expectedVersion?: number) => {
    const previous = queryClient.getQueryData<InfiniteData<CompaniesPage>>(queryKey);
    queryClient.setQueryData<InfiniteData<CompaniesPage>>(queryKey, prev =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map(p => ({
              ...p,
              companies: p.companies.map(c => c.id === id ? { ...c, ...updates, tags: updates.tags ?? c.tags } : c),
            })),
          }
        : prev
    );
    try {
      const input = updates;
      const clean = prepareCompanyWrite(input);
      const current = previous?.pages.flatMap(p => p.companies).find(c => c.id === id) ?? await fetchCompany(id);
      const versionToUse = expectedVersion ?? current.version;
      const { data: raw, error } = await updateExternalDataWithVersion<unknown>('companies', id, versionToUse, clean);
      if (error) throw error;
      if (!raw) throw new Error('Escrita não retornou uma empresa válida.');
      let data = mapCompany(raw);
      if (data) {
        await saveCompanyAliases(id, input, current);
        const mapped = await fetchCompany(id);
        data = mapped;
        queryClient.setQueryData<InfiniteData<CompaniesPage>>(queryKey, prev =>
          prev
            ? {
                ...prev,
                pages: prev.pages.map(p => ({
                  ...p,
                  companies: p.companies.map(c => c.id === id ? mapped : c),
                })),
              }
            : prev
        );
      }
      const finalName = data?.name || input.name || input.nome_crm || 'Empresa';
      toast({ title: 'Empresa atualizada', description: 'As alterações foram salvas.' });
      if (data) logActivity({ type: 'updated', entityType: 'company', entityId: id, entityName: String(finalName), description: 'Empresa atualizada' });
      return data;
    } catch (error) {
      if (previous) queryClient.setQueryData<InfiniteData<CompaniesPage>>(queryKey, previous);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao atualizar empresa:', { error: msg });
      void queryClient.invalidateQueries({ queryKey });
      if (error instanceof ConcurrentEditError) {
        showConcurrentEditToast({ entity: 'empresa', queryClient, queryKey });
      } else {
        toast({ title: 'Erro ao atualizar empresa', description: msg, variant: 'destructive' });
      }
      return null;
    }
  };

  const deleteCompany = async (id: string) => {
    const previous = queryClient.getQueryData<InfiniteData<CompaniesPage>>(queryKey);
    queryClient.setQueryData<InfiniteData<CompaniesPage>>(queryKey, prev =>
      prev
        ? {
            ...prev,
            pages: prev.pages.map(p => ({
              ...p,
              companies: p.companies.filter(c => c.id !== id),
              count: Math.max(0, p.count - 1),
            })),
          }
        : prev
    );
    try {
      const { success, error } = await deleteExternalData('companies', id);
      if (error || !success) throw error || new Error('Delete failed');
      const deleted = previous?.pages.flatMap(p => p.companies).find(c => c.id === id);
      logActivity({ type: 'deleted', entityType: 'company', entityId: id, entityName: deleted?.name || undefined, description: 'Empresa excluída' });
      toast({ title: 'Empresa removida', description: 'A empresa foi excluída com sucesso.' });
      return true;
    } catch (error) {
      if (previous) queryClient.setQueryData<InfiniteData<CompaniesPage>>(queryKey, previous);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('Erro ao excluir empresa:', { error: msg });
      toast({ title: 'Erro ao excluir empresa', description: msg, variant: 'destructive' });
      return false;
    }
  };

  return {
    companies, loading, isFetching, totalCount, searchTerm, error: queryError,
    setSearchTerm: (term: string) => { setSearchTerm(term); },
    fetchCompanies, createCompany, updateCompany, deleteCompany,
    fetchNextPage, hasNextPage, isFetchingNextPage,
  };
}
