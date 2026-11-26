import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export type TipoParceiro = 'fornecedor' | 'transportadora';

/** Percentuais vêm do Postgres como string (às vezes numéricos) e podem ser nulos. */
export type Percentual = string | number | null;

export const PARCEIROS_PAGE_SIZE = 25;

export interface ParceiroDashboardRow {
  total_fornecedores?: number | null;
  total_transportadoras?: number | null;
  total_homologados: number | null;
  total_nao_homologados: number | null;
  qtd_sem_avaliacao: number | null;
  score_medio_geral: number | null;
  total_avaliacoes_realizadas: number | null;
  pct_homologados: Percentual;
}

export interface ParceiroQualidadeRow {
  total_fornecedores?: number | null;
  total_transportadoras?: number | null;
  com_cnpj: number | null;
  pct_cnpj: Percentual;
  com_telefone: number | null;
  pct_telefone: Percentual;
  com_email: number | null;
  pct_email: Percentual;
  com_endereco: number | null;
  pct_endereco: Percentual;
  cadastro_completo: number | null;
  pct_cadastro_completo: Percentual;
}

export interface ParceiroEstadoRow {
  estado: string | null;
  total: number | null;
  homologados: number | null;
  nao_homologados: number | null;
  com_avaliacao: number | null;
}

export interface ParceiroRankingRow {
  ranking: number | null;
  fornecedor?: string | null;
  transportadora?: string | null;
  cnpj: string | null;
  homologado: boolean | null;
  score_geral: number | null;
  classificacao: string | null;
  total_avaliacoes: number | null;
  ultima_avaliacao: string | null;
  [coluna: string]: unknown;
}

export interface ParceiroFilaRow {
  fornecedor?: string | null;
  transportadora?: string | null;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  ultimo_status: string | null;
  motivo_reprovacao: string | null;
  acao_necessaria: string | null;
  prioridade_ordem: number | null;
}

interface ParceiroConfig {
  nome: string;
  singular: string;
  /** Colunas que carregam o nome do parceiro (a view usa um nome por tipo). */
  camposNome: string[];
  camposBusca: string[];
  campoTotal: string;
  scores: Array<{ coluna: string; label: string }>;
  views: {
    dashboard: string;
    porEstado: string;
    qualidade: string;
    ranking: string;
    fila: string;
    controle: string;
  };
  qualificadores: string[];
}

/**
 * As views de fornecedor e de transportadora são espelhadas: mesmas colunas de
 * ranking/qualidade/homologação, mudando só o nome da coluna que carrega o parceiro.
 * Por isso a tela é uma só, parametrizada por tipo.
 */
export const PARCEIRO_CONFIG: Record<TipoParceiro, ParceiroConfig> = {
  fornecedor: {
    nome: 'Fornecedores',
    singular: 'fornecedor',
    camposNome: ['fornecedor', 'razao_social'],
    camposBusca: ['fornecedor', 'cnpj'],
    campoTotal: 'total_fornecedores',
    scores: [
      { coluna: 'score_preco', label: 'Preço' },
      { coluna: 'score_prazo', label: 'Prazo' },
      { coluna: 'score_qualidade', label: 'Qualidade' },
      { coluna: 'score_entrega', label: 'Entrega' },
    ],
    views: {
      dashboard: 'vw_supplier_qualification_dashboard',
      porEstado: 'vw_supplier_by_state',
      qualidade: 'vw_supplier_data_quality',
      ranking: 'vw_supplier_ranking',
      fila: 'vw_supplier_homologation_queue',
      controle: 'vw_supplier_homologation_control',
    },
    qualificadores: ['Excelente', 'Bom', 'Regular', 'Insuficiente', 'Crítico'],
  },
  transportadora: {
    nome: 'Transportadoras',
    singular: 'transportadora',
    camposNome: ['transportadora', 'razao_social'],
    camposBusca: ['transportadora', 'cnpj'],
    campoTotal: 'total_transportadoras',
    scores: [
      { coluna: 'score_pontualidade', label: 'Pontualidade' },
      { coluna: 'score_conservacao', label: 'Conservação' },
      { coluna: 'score_preco_frete', label: 'Frete' },
      { coluna: 'score_rastreamento', label: 'Rastreamento' },
      { coluna: 'score_cobertura', label: 'Cobertura' },
    ],
    views: {
      dashboard: 'vw_carrier_qualification_dashboard',
      porEstado: 'vw_carrier_by_state',
      qualidade: 'vw_carrier_data_quality',
      ranking: 'vw_carrier_ranking',
      fila: 'vw_carrier_homologation_queue',
      controle: 'vw_carrier_homologation_control',
    },
    qualificadores: ['Excelente', 'Bom', 'Regular', 'Insuficiente', 'Crítico'],
  },
};

export function totalDoParceiro(tipo: TipoParceiro, row: ParceiroDashboardRow | ParceiroQualidadeRow | null): number {
  if (!row) return 0;
  const valor = (row as unknown as Record<string, unknown>)[PARCEIRO_CONFIG[tipo].campoTotal];
  return typeof valor === 'number' ? valor : 0;
}

export function nomeDoParceiro(tipo: TipoParceiro, row: object | null | undefined): string {
  if (!row) return '—';
  const registro = row as unknown as Record<string, unknown>;
  for (const campo of PARCEIRO_CONFIG[tipo].camposNome) {
    const valor = registro[campo];
    if (typeof valor === 'string' && valor.trim()) return valor;
  }
  return '—';
}

export interface ParceiroResumo {
  dashboard: ParceiroDashboardRow | null;
  qualidade: ParceiroQualidadeRow | null;
  estados: ParceiroEstadoRow[];
}

export function useParceiroResumo(tipo: TipoParceiro) {
  const config = PARCEIRO_CONFIG[tipo];
  return useQuery({
    queryKey: ['parceiro-resumo', tipo],
    queryFn: async (): Promise<ParceiroResumo> => {
      const [dashboard, qualidade, estados] = await Promise.all([
        queryExternalData<ParceiroDashboardRow>({ table: config.views.dashboard, select: '*', auditAccess: false }),
        queryExternalData<ParceiroQualidadeRow>({ table: config.views.qualidade, select: '*', auditAccess: false }),
        queryExternalData<ParceiroEstadoRow>({
          table: config.views.porEstado,
          select: '*',
          order: { column: 'total', ascending: false },
          auditAccess: false,
        }),
      ]);
      if (dashboard.error) throw dashboard.error;
      if (qualidade.error) throw qualidade.error;
      if (estados.error) throw estados.error;
      return {
        dashboard: dashboard.data?.[0] ?? null,
        qualidade: qualidade.data?.[0] ?? null,
        estados: estados.data ?? [],
      };
    },
    staleTime: 5 * 60_000,
  });
}

export function useParceiroRanking(
  tipo: TipoParceiro,
  params: { page: number; search: string; somenteHomologados: boolean },
) {
  const config = PARCEIRO_CONFIG[tipo];
  const from = params.page * PARCEIROS_PAGE_SIZE;
  return useQuery({
    queryKey: ['parceiro-ranking', tipo, params.page, params.search, params.somenteHomologados],
    queryFn: async () => {
      const { data, count, error } = await queryExternalData<ParceiroRankingRow>({
        table: config.views.ranking,
        select: '*',
        search: params.search.trim()
          ? { term: params.search.trim(), columns: config.camposBusca, matchAllTerms: true }
          : undefined,
        filters: params.somenteHomologados ? [{ type: 'eq', column: 'homologado', value: true }] : undefined,
        order: { column: 'ranking', ascending: true },
        range: { from, to: from + PARCEIROS_PAGE_SIZE - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useParceiroFilaHomologacao(tipo: TipoParceiro) {
  const config = PARCEIRO_CONFIG[tipo];
  return useQuery({
    queryKey: ['parceiro-fila', tipo],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ParceiroFilaRow>({
        table: config.views.fila,
        select: '*',
        order: { column: 'prioridade_ordem', ascending: true },
        range: { from: 0, to: 24 },
        auditAccess: false,
      });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export interface ParceiroControleRow {
  fornecedor?: string | null;
  transportadora?: string | null;
  cnpj: string | null;
  homologado: boolean | null;
  ultimo_status: string | null;
  data_solicitacao: string | null;
  data_decisao: string | null;
  validade: string | null;
  dias_para_vencer: number | null;
  situacao: string | null;
  avaliador: string | null;
  motivo_reprovacao: string | null;
  observacoes: string | null;
  criterios_checados: unknown;
  [coluna: string]: unknown;
}

/** Situações calculadas pela própria view, na ordem em que o negócio as acompanha. */
export const SITUACOES_HOMOLOGACAO = [
  { valor: 'NUNCA_SOLICITADA', label: 'Nunca solicitada' },
  { valor: 'pendente', label: 'Pendente' },
  { valor: 'em_analise', label: 'Em análise' },
  { valor: 'VENCIDA', label: 'Vencida' },
  { valor: 'VENCENDO_EM_BREVE', label: 'Vencendo em 30 dias' },
  { valor: 'VIGENTE', label: 'Vigente' },
  { valor: 'homologado', label: 'Homologado' },
  { valor: 'reprovado', label: 'Reprovado' },
] as const;

export function useParceiroControleHomologacao(
  tipo: TipoParceiro,
  params: { page: number; search: string; situacao: string },
) {
  const config = PARCEIRO_CONFIG[tipo];
  const from = params.page * PARCEIROS_PAGE_SIZE;
  return useQuery({
    queryKey: ['parceiro-controle', tipo, params.page, params.search, params.situacao],
    queryFn: async () => {
      const { data, count, error } = await queryExternalData<ParceiroControleRow>({
        table: config.views.controle,
        select: '*',
        search: params.search.trim()
          ? { term: params.search.trim(), columns: config.camposBusca, matchAllTerms: true }
          : undefined,
        filters:
          params.situacao === 'todas'
            ? undefined
            : [{ type: 'eq', column: 'situacao', value: params.situacao }],
        order: [
          { column: 'dias_para_vencer', ascending: true },
          { column: 'cnpj', ascending: true },
        ],
        range: { from, to: from + PARCEIROS_PAGE_SIZE - 1 },
        countMethod: 'exact',
        auditAccess: false,
      });
      if (error) throw error;
      return { rows: data ?? [], total: count ?? 0 };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}