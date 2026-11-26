import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

/** Linhas devolvidas pelo RPC get_sales_funnel() — uma por estagio do funil. */
export interface EstagioFunil {
  stage: string;
  stage_order: number;
  count: number;
  value: number;
}

export interface CanalConversao {
  channel: string;
  first_contact_count: number;
  converted_count: number;
  conversion_rate: number;
}

export interface MetricaCiclo {
  metric: string;
  value: number;
}

export interface CoorteRetencao {
  cohort_month: string;
  m0: number;
  m1: number;
  m2: number;
  m3: number;
}

export interface SegmentoLtv {
  segment: string;
  company_count: number;
  avg_ltv: number;
  total_ltv: number;
}

export interface FunilVendas {
  funil: EstagioFunil[];
  canais: CanalConversao[];
  ciclo: MetricaCiclo[];
  coortes: CoorteRetencao[];
  ltv: SegmentoLtv[];
}

/**
 * Consolida os cinco RPCs de funil/ciclo de vendas numa unica consulta.
 * Todos sao zero-arg e devolvem TABLE, por isso nenhum recebe parametro.
 */
export function useFunilVendas() {
  return useQuery<FunilVendas>({
    queryKey: ['funil-vendas'],
    queryFn: async () => {
      const [funil, canais, ciclo, coortes, ltv] = await Promise.all([
        callExternalRpc<EstagioFunil[]>('get_sales_funnel', {}),
        callExternalRpc<CanalConversao[]>('get_channel_conversion', {}),
        callExternalRpc<MetricaCiclo[]>('get_sales_cycle_analysis', {}),
        callExternalRpc<CoorteRetencao[]>('get_retention_by_cohort', {}),
        callExternalRpc<SegmentoLtv[]>('get_ltv_segments', {}),
      ]);

      const erro = funil.error ?? canais.error ?? ciclo.error ?? coortes.error ?? ltv.error;
      if (erro) throw erro;

      return {
        funil: funil.data ?? [],
        canais: canais.data ?? [],
        ciclo: ciclo.data ?? [],
        coortes: coortes.data ?? [],
        ltv: ltv.data ?? [],
      };
    },
    staleTime: 5 * 60_000,
  });
}