import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export type Percentual = string | number | null;

export const TAMANHO_PAGINA_CLIENTES = 25;

export interface ClienteStatusKpis {
  total: number;
  ativos: number;
  ativadosSemCompra: number;
  prospects: number;
  compradores: number;
}

export interface ClienteRow {
  customer_id: string | null;
  company_id: string | null;
  empresa: string | null;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
  cidade: string | null;
  estado: string | null;
  status_cliente: string | null;
  vendedor_nome: string | null;
  sdr_nome: string | null;
  data_ativacao: string | null;
  ativado_por: string | null;
  data_ultima_compra: string | null;
  total_pedidos: number | null;
  valor_total_compras: Percentual;
  ticket_medio: Percentual;
  dias_sem_compra: number | null;
}

export interface HierarquiaRow {
  id: string | null;
  empresa: string | null;
  cnpj: string | null;
  grupo_economico: string | null;
  tipo_grupo: string | null;
  is_matriz: boolean | null;
  matriz_nome: string | null;
  tipo_cooperativa: string | null;
  central_nome: string | null;
  singular_nome: string | null;
  classificacao_hierarquia: string | null;
  is_customer: boolean | null;
  is_supplier: boolean | null;
  status: string | null;
}

export interface CooperativaRow {
  nivel: string | null;
  grupo_economico: string | null;
  central: string | null;
  singular: string | null;
  pac: string | null;
  company_id: string | null;
}

export interface HistoricoEmpresaRow {
  company_id: string | null;
  customer_id: string | null;
  empresa: string | null;
  cnpj: string | null;
  data_cadastro_sistema: string | null;
  status_empresa: string | null;
  cliente_ativado: boolean | null;
  ja_comprou: boolean | null;
  classificacao: string | null;
  vendedor_carteira: string | null;
  data_entrada_carteira: string | null;
  data_primeira_compra: string | null;
  data_ultima_compra: string | null;
  total_pedidos: number | null;
  valor_total_compras: Percentual;
  dias_sem_compra: number | null;
  dias_para_inativar: number | null;
}

export interface PaginaResultado<T> {
  linhas: T[];
  total: number;
}

const CAMPOS_CLIENTE = [
  'customer_id', 'company_id', 'empresa', 'razao_social', 'nome_fantasia', 'cnpj',
  'telefone', 'email', 'cidade', 'estado', 'status_cliente', 'vendedor_nome', 'sdr_nome',
  'data_ativacao', 'ativado_por', 'data_ultima_compra', 'total_pedidos', 'valor_total_compras',
  'ticket_medio', 'dias_sem_compra',
].join(', ');

const CAMPOS_HIERARQUIA = [
  'id', 'empresa', 'cnpj', 'grupo_economico', 'tipo_grupo', 'is_matriz', 'matriz_nome',
  'tipo_cooperativa', 'central_nome', 'singular_nome', 'classificacao_hierarquia',
  'is_customer', 'is_supplier', 'status',
].join(', ');

const CAMPOS_HISTORICO = [
  'company_id', 'customer_id', 'empresa', 'cnpj', 'data_cadastro_sistema', 'status_empresa',
  'cliente_ativado', 'ja_comprou', 'classificacao', 'vendedor_carteira', 'data_entrada_carteira',
  'data_primeira_compra', 'data_ultima_compra', 'total_pedidos', 'valor_total_compras',
  'dias_sem_compra', 'dias_para_inativar',
].join(', ');

async function contarLinhas(
  table: string,
  filtros?: Array<{ type: 'eq' | 'ilike' | 'in' | 'neq' | 'is'; column: string; value: unknown }>,
  coluna = 'company_id',
): Promise<number> {
  const { count, error } = await queryExternalData<Record<string, unknown>>({
    table,
    select: coluna,
    filters: filtros,
    range: { from: 0, to: 0 },
    countMethod: 'exact',
    auditAccess: false,
  });
  if (error) throw error;
  return count ?? 0;
}

export function useClientesKpis() {
  return useQuery({
    queryKey: ['clientes-kpis'],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ClienteStatusKpis> => {
      const [total, ativos, ativadosSemCompra, prospects, compradores] = await Promise.all([
        contarLinhas('vw_cliente_completo'),
        contarLinhas('vw_status_clientes', [{ type: 'eq', column: 'status_calculado', value: 'CLIENTE_ATIVO' }], 'customer_id'),
        contarLinhas('vw_status_clientes', [{ type: 'eq', column: 'status_calculado', value: 'PROSPECT_ATIVADO' }], 'customer_id'),
        contarLinhas('vw_status_clientes', [{ type: 'eq', column: 'status_calculado', value: 'PROSPECT' }], 'customer_id'),
        contarLinhas('vw_cliente_completo', [{ type: 'eq', column: 'ja_comprou', value: true }]),
      ]);
      return { total, ativos, ativadosSemCompra, prospects, compradores };
    },
  });
}

export interface FiltrosListaClientes {
  pagina: number;
  termo: string;
  status: string;
  ordenacao: string;
  direcao: 'asc' | 'desc';
}

export function useClientesLista({ pagina, termo, status, ordenacao, direcao }: FiltrosListaClientes) {
  return useQuery({
    queryKey: ['clientes-lista', pagina, termo, status, ordenacao, direcao],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PaginaResultado<ClienteRow>> => {
      const from = pagina * TAMANHO_PAGINA_CLIENTES;
      const pesquisa = termo.trim();
      const { data, count, error } = await queryExternalData<ClienteRow>({
        table: 'vw_cliente_completo',
        select: CAMPOS_CLIENTE,
        filters: status ? [{ type: 'eq', column: 'status_cliente', value: status }] : undefined,
        search: pesquisa ? { term: pesquisa, columns: ['empresa', 'cnpj', 'cidade', 'razao_social'] } : undefined,
        order: [{ column: ordenacao, ascending: direcao === 'asc' }, { column: 'empresa', ascending: true }],
        range: { from, to: from + TAMANHO_PAGINA_CLIENTES - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { linhas: data ?? [], total: count ?? 0 };
    },
  });
}

export function useHierarquiaEmpresas(pagina: number, termo: string) {
  return useQuery({
    queryKey: ['clientes-hierarquia', pagina, termo],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PaginaResultado<HierarquiaRow>> => {
      const from = pagina * TAMANHO_PAGINA_CLIENTES;
      const pesquisa = termo.trim();
      const { data, count, error } = await queryExternalData<HierarquiaRow>({
        table: 'vw_empresas_hierarquia',
        select: CAMPOS_HIERARQUIA,
        search: pesquisa ? { term: pesquisa, columns: ['empresa', 'cnpj', 'grupo_economico', 'matriz_nome'] } : undefined,
        order: [{ column: 'empresa', ascending: true }],
        range: { from, to: from + TAMANHO_PAGINA_CLIENTES - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { linhas: data ?? [], total: count ?? 0 };
    },
  });
}

export function useCooperativas(pagina: number, termo: string) {
  return useQuery({
    queryKey: ['clientes-cooperativas', pagina, termo],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PaginaResultado<CooperativaRow>> => {
      const from = pagina * TAMANHO_PAGINA_CLIENTES;
      const pesquisa = termo.trim();
      const { data, count, error } = await queryExternalData<CooperativaRow>({
        table: 'vw_cooperativas_estrutura',
        select: 'nivel, grupo_economico, central, singular, pac, company_id',
        search: pesquisa ? { term: pesquisa, columns: ['grupo_economico', 'central', 'singular', 'pac'] } : undefined,
        order: [{ column: 'grupo_economico', ascending: true }],
        range: { from, to: from + TAMANHO_PAGINA_CLIENTES - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { linhas: data ?? [], total: count ?? 0 };
    },
  });
}

export function useHistoricoEmpresas(pagina: number, termo: string, apenasCompradores: boolean) {
  return useQuery({
    queryKey: ['clientes-historico', pagina, termo, apenasCompradores],
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
    queryFn: async (): Promise<PaginaResultado<HistoricoEmpresaRow>> => {
      const from = pagina * TAMANHO_PAGINA_CLIENTES;
      const pesquisa = termo.trim();
      const { data, count, error } = await queryExternalData<HistoricoEmpresaRow>({
        table: 'vw_empresa_historico_completo',
        select: CAMPOS_HISTORICO,
        filters: apenasCompradores ? [{ type: 'eq', column: 'ja_comprou', value: true }] : undefined,
        search: pesquisa ? { term: pesquisa, columns: ['empresa', 'cnpj', 'vendedor_carteira'] } : undefined,
        order: [{ column: 'valor_total_compras', ascending: false }, { column: 'empresa', ascending: true }],
        range: { from, to: from + TAMANHO_PAGINA_CLIENTES - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { linhas: data ?? [], total: count ?? 0 };
    },
  });
}