/**
 * Tipos de domínio do Rodízio de Carteira (Bloco 3).
 *
 * Substitui `@/types/leadRouting.ts` — a fonte de dados mudou de
 * `sales_team_members` / `lead_routing_rules` / `lead_assignments` /
 * `handoff_requests` / `redistribution_log` para as views e RPCs novas
 * (`vw_rodizio_*`, `rodizio_*`), então os tipos foram reescritos do zero
 * para bater com os campos reais.
 */

/* ─── Equipe (vw_rodizio_carga_closers / vw_rodizio_carga_sdrs) ─── */

export interface RodizioCloserCarga {
  closer_id: number;
  closer_nome: string;
  is_active: boolean;
  ordem_rodizio: number | null;
  capacidade_max: number | null;
  afastado_ate: string | null;
  total_ativo: number;
  total_nao_ativado: number;
  total_inativo: number;
  total_bloqueado: number;
  total_pool_frio: number;
  carga_atual: number;
  total_carteira: number;
}

export interface RodizioSdrCarga {
  sdr_id: number;
  sdr_nome: string;
  is_active: boolean;
  ordem_rodizio: number | null;
  capacidade_max: number | null;
  afastado_ate: string | null;
  total_nao_ativado: number;
  total_carteira: number;
}

/* ─── Ondas (rodizio_distribuicao_staging / vw_rodizio_execucoes) ─── */

export type StagingOrigem = 'MANUAL' | 'SUGESTAO_MOTOR' | 'IMPORT_CSV';
export type StagingStatus = 'RASCUNHO' | 'APROVADO' | 'APLICADO' | 'REJEITADO';

export interface RodizioStagingRow {
  id: string;
  onda: number;
  customer_id: string;
  closer_destino_id: number | null;
  sdr_destino_id: number | null;
  origem: StagingOrigem;
  status: StagingStatus;
  criado_por_id: number | null;
  aprovado_por_id: number | null;
  aplicado_em: string | null;
  execucao_id: string | null;
  observacoes: string | null;
}

export type ExecucaoTipo = 'CLOSER' | 'SDR' | 'SEGMENTAR' | 'DISTRIBUICAO_INICIAL';
export type ExecucaoModo = 'DRY_RUN' | 'REAL' | 'ROLLBACK';

export interface RodizioExecucao {
  id: string;
  tipo: ExecucaoTipo;
  modo: ExecucaoModo;
  iniciado_em: string;
  finalizado_em: string | null;
  total_elegiveis: number | null;
  total_rotacionados: number | null;
  executado_por_id: number | null;
  executado_por_nome: string | null;
  revertida_por_execucao_id: string | null;
  foi_revertida: boolean;
  parametros: Record<string, unknown> | null;
}

export interface RodizioFiltrosSugestao {
  vendedor_id?: number;
  uf?: string;
  ramo_atividade?: string;
  grupo_clientes?: string;
  valor_min?: number;
  valor_max?: number;
  segmento?: string;
  limit?: number;
}

export interface RodizioAplicarOndaResult {
  status: string;
  message?: string;
  modo: ExecucaoModo;
  onda: number;
  execucao_id: string | null;
  total_aprovados: number;
  total_aplicados: number;
  impacto: Record<string, unknown> | null;
  erros: unknown[] | null;
}

export interface RodizioSugerirDistribuicaoResult {
  status: string;
  message?: string;
  onda?: number;
  clientes_sugeridos?: number;
}

export interface RodizioCloserExecutarResult {
  status: string;
  message?: string;
  modo: ExecucaoModo;
  execucao_id: string | null;
  total_elegiveis: number;
  total_rotacionados: number;
  distribuicao: Record<string, unknown>[] | null;
  erros: unknown[] | null;
}

/* ─── Bloqueios (vw_rodizio_bloqueios) ─── */

export type BloqueioStatus = 'NENHUM' | 'EXPIRADO' | 'PENDENTE_APROVACAO' | 'ATIVO';

export interface RodizioBloqueio {
  customer_id: string;
  company_id: string | null;
  company_nome: string | null;
  vendedor_id: number | null;
  vendedor_nome: string | null;
  bloqueado_ate: string | null;
  bloqueio_motivo: string | null;
  bloqueado_por_id: number | null;
  bloqueado_por_nome: string | null;
  bloqueio_aprovado_por_id: number | null;
  aprovado_por_nome: string | null;
  status: BloqueioStatus;
}

export interface RodizioBloquearResult {
  status: string;
  code?: 'CLIENTE_NAO_ENCONTRADO' | 'DIAS_INVALIDOS' | 'SEM_EVIDENCIA' | string;
  message?: string;
  bloqueado_ate?: string;
  pendente_aprovacao?: boolean;
  bloqueios_mes?: number;
}

export interface RodizioAprovarBloqueioResult {
  status: string;
  customer_id?: string;
  message?: string;
}

export interface RodizioReverterResult {
  status: string;
  clientes_revertidos?: number;
  message?: string;
}

/* ─── Métricas (vw_rodizio_kpis) ─── */

export interface RodizioKpi {
  closer_id: number;
  closer_nome: string;
  total_ativo: number;
  total_nao_ativado: number;
  total_inativo: number;
  total_pool_frio: number;
  taxa_ativacao_pct: number;
  bloqueios_mes: number;
  clientes_recebidos_30d: number;
  vendas_pos_rotacao: number;
}

/* ─── Config (kill switches, somente leitura) ─── */

export interface RodizioConfigFlags {
  closerAtivo: boolean;
  sdrAtivo: boolean;
}

/* ─── Labels em pt-BR ─── */

export const STAGING_STATUS_LABELS: Record<StagingStatus, string> = {
  RASCUNHO: 'Rascunho',
  APROVADO: 'Aprovado',
  APLICADO: 'Aplicado',
  REJEITADO: 'Rejeitado',
};

export const EXECUCAO_TIPO_LABELS: Record<ExecucaoTipo, string> = {
  CLOSER: 'Closer',
  SDR: 'SDR',
  SEGMENTAR: 'Segmentar',
  DISTRIBUICAO_INICIAL: 'Distribuição Inicial',
};

export const EXECUCAO_MODO_LABELS: Record<ExecucaoModo, string> = {
  DRY_RUN: 'Simulação',
  REAL: 'Real',
  ROLLBACK: 'Rollback',
};

export const BLOQUEIO_STATUS_LABELS: Record<BloqueioStatus, string> = {
  NENHUM: 'Sem bloqueio',
  EXPIRADO: 'Expirado',
  PENDENTE_APROVACAO: 'Pendente de Aprovação',
  ATIVO: 'Ativo',
};
