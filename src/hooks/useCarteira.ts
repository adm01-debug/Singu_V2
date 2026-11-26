import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export type Percentual = string | number | null;

export interface CarteiraVendedorRow {
  vendedor_id: number | null;
  vendedor_nome: string | null;
  total_clientes: number | null;
  ativos: number | null;
  ex_clientes: number | null;
  prospects: number | null;
  pct_ativos: Percentual;
  valor_total_carteira: Percentual;
  total_pedidos_carteira: number | null;
  ticket_medio_cliente: Percentual;
  em_risco: number | null;
  criticos: number | null;
  para_inativar: number | null;
  total_alertas: number | null;
  novos_30_dias: number | null;
  compraram_30_dias: number | null;
}

export interface CarteiraResumoDiaRow {
  vendedor_id: number | null;
  vendedor_nome: string | null;
  total_ativos: number | null;
  total_prospects: number | null;
  alertas_urgentes: number | null;
  alertas_risco: number | null;
  valor_carteira_ativa: Percentual;
  mensagem_dia: string | null;
}

export interface CarteiraEventoRow {
  customer_id: string | null;
  company_id: string | null;
  empresa: string | null;
  ativador_nome?: string | null;
  inativador_nome?: string | null;
  data_ativacao?: string | null;
  data_inativacao?: string | null;
  motivo_inativacao?: string | null;
  evento_tipo?: string | null;
}

export interface CarteiraRiscoRow {
  company_id: string | null;
  empresa: string | null;
  vendedor_nome: string | null;
  data_ultima_compra: string | null;
  dias_sem_compra: number | null;
  dias_para_inativar: number | null;
  status_risco: string | null;
  prioridade: number | null;
  total_pedidos: number | null;
  valor_total_compras: Percentual;
}

export interface CarteiraPrioridadeRow {
  company_id: string | null;
  empresa: string | null;
  cnpj: string | null;
  cidade: string | null;
  estado: string | null;
  cliente_ativado: boolean | null;
  ja_comprou: boolean | null;
  vendedor_nome: string | null;
  data_ultima_compra: string | null;
  valor_total_compras: Percentual;
  total_pedidos: number | null;
  dias_sem_compra: number | null;
  nivel_prioridade: number | null;
  status_prioridade: string | null;
  acao_sugerida: string | null;
}

export interface TopClienteRow {
  vendedor_nome: string | null;
  empresa: string | null;
  cidade: string | null;
  estado: string | null;
  ja_comprou: boolean | null;
  valor_total_compras: Percentual;
  total_pedidos: number | null;
  ticket_medio: Percentual;
  data_ultima_compra: string | null;
  ranking_valor: number | null;
  pct_carteira: Percentual;
}

export interface MatrizFiliaisRow {
  matriz_id: string | null;
  matriz_nome: string | null;
  matriz_cnpj: string | null;
  grupo_economico: string | null;
  total_filiais: number | null;
  filiais: string | null;
}

export interface CarteiraHistoricoRow {
  empresa_nome: string | null;
  empresa_cnpj: string | null;
  vendedor_id: number | null;
  registrado_por_nome: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  motivo_entrada: string | null;
  motivo_saida: string | null;
  observacoes: string | null;
}

const SEM_FILTRO_USER_ID = { auditAccess: false as const, countMethod: 'exact' as const };

function consultar<T>(table: string, order?: { column: string; ascending: boolean }, limit?: number) {
  return queryExternalData<T>({
    ...SEM_FILTRO_USER_ID,
    table,
    select: '*',
    order,
    range: limit ? { from: 0, to: limit - 1 } : undefined,
  });
}

export function useCarteiraPainel() {
  return useQuery({
    queryKey: ['carteira', 'painel'],
    queryFn: async () => {
      const [vendedores, resumoDia, ativacoes, inativacoes, risco, prioridade, topClientes, matrizes, historico] =
        await Promise.all([
          consultar<CarteiraVendedorRow>('vw_dashboard_vendedor_v2', { column: 'total_clientes', ascending: false }),
          consultar<CarteiraResumoDiaRow>('vw_resumo_diario_vendedor', { column: 'total_ativos', ascending: false }),
          consultar<CarteiraEventoRow>('vw_quem_ativou', { column: 'data_ativacao', ascending: false }, 25),
          consultar<CarteiraEventoRow>('vw_quem_inativou', { column: 'data_inativacao', ascending: false }, 25),
          consultar<CarteiraRiscoRow>('vw_risco_inativacao', { column: 'prioridade', ascending: true }, 50),
          consultar<CarteiraPrioridadeRow>('vw_clientes_prioridade', { column: 'nivel_prioridade', ascending: true }, 50),
          consultar<TopClienteRow>('vw_top_clientes_vendedor', { column: 'valor_total_compras', ascending: false }, 25),
          consultar<MatrizFiliaisRow>('vw_matriz_filiais', { column: 'total_filiais', ascending: false }, 25),
          consultar<CarteiraHistoricoRow>('vw_historico_carteira', { column: 'data_inicio', ascending: false }, 25),
        ]);

      const erro = [vendedores, resumoDia, ativacoes, inativacoes, risco, prioridade, topClientes, matrizes, historico]
        .find((resultado) => resultado.error)?.error;
      if (erro) throw erro;

      return {
        vendedores: vendedores.data ?? [],
        resumoDia: resumoDia.data ?? [],
        ativacoes: ativacoes.data ?? [],
        inativacoes: inativacoes.data ?? [],
        risco: risco.data ?? [],
        prioridade: prioridade.data ?? [],
        topClientes: topClientes.data ?? [],
        matrizes: matrizes.data ?? [],
        historico: historico.data ?? [],
      };
    },
    staleTime: 5 * 60_000,
  });
}