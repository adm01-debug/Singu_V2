import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface DealFull {
  id: string;
  codigo: string | null;
  titulo: string | null;
  pipeline_id: string | null;
  stage_id: string | null;
  status: string | null;
  company_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  valor: number | null;
  valor_mensal_recorrente: number | null;
  desconto_percentual: number | null;
  valor_final: number | null;
  probabilidade: number | null;
  valor_ponderado: number | null;
  data_previsao_fechamento: string | null;
  data_fechamento: string | null;
  prioridade: string | null;
  descricao: string | null;
  proximos_passos: string | null;
  observacoes: string | null;
  tags_array: string[] | null;
  dias_no_pipeline: number | null;
  dias_no_estagio_atual: number | null;
  created_at: string;
  pipeline_nome: string | null;
  stage_nome: string | null;
  stage_cor: string | null;
  source_nome: string | null;
  loss_reason_nome: string | null;
  company_nome: string | null;
  company_cnpj: string | null;
  contact_nome: string | null;
}

export function useDealsFullView(contactId?: string, companyId?: string, limit = 20) {
  return useQuery({
    queryKey: ['deals-full', contactId, companyId, limit],
    queryFn: async () => {
      const filters: Array<{ type: 'eq'; column: string; value: unknown }> = [];
      if (contactId) filters.push({ type: 'eq', column: 'contact_id', value: contactId });
      if (companyId) filters.push({ type: 'eq', column: 'company_id', value: companyId });
      const { data, error } = await queryExternalData<DealFull>({
        table: 'vw_deals_full',
        filters,
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!(contactId || companyId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
