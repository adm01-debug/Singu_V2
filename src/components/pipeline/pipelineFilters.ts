/** Filtros do pipeline. Cada chave liga/desliga um recorte sobre a lista de deals. */
export interface PipelineFilters {
  /** probabilidade acima de 70% */
  altaProbabilidade: boolean;
  /** valor acima de R$ 10.000 */
  ticketAlto: boolean;
  /** previsão de fechamento dentro do mês corrente */
  fechamentoNoMes: boolean;
}

export const EMPTY_PIPELINE_FILTERS: PipelineFilters = {
  altaProbabilidade: false,
  ticketAlto: false,
  fechamentoNoMes: false,
};

export function countActiveFilters(filters: PipelineFilters): number {
  return Object.values(filters).filter(Boolean).length;
}
