import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Agregação real de atividade por período, vinda da RPC get_activity_overview.
 *
 * Substitui os blocos de número cravado que alimentavam /analytics, o
 * RelationshipStatsPanel e os gráficos do dashboard. A agregação acontece no
 * banco porque o PostgREST não faz GROUP BY e baixar as interações todas para
 * contar no navegador não é opção.
 */

export type PeriodoAtividade = '7d' | '30d' | '90d' | '365d';

export interface PontoSerie { inicio: string; interacoes: number; contatos: number }
export interface TotalCanal { canal: string; total: number; enviadas: number; recebidas: number }
export interface TotalSentimento { sentimento: string; total: number }
export interface TotalDiaSemana { dia: number; total: number }

export interface ResumoAtividade {
  periodo: { de: string; ate: string; bucket: 'day' | 'week' | 'month' };
  totais: { interacoes: number; contatos_alcancados: number; enviadas: number; recebidas: number };
  serie: PontoSerie[];
  por_canal: TotalCanal[];
  por_sentimento: TotalSentimento[];
  por_dia_semana: TotalDiaSemana[];
}

const DIAS: Record<PeriodoAtividade, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
const BUCKET: Record<PeriodoAtividade, 'day' | 'week' | 'month'> = {
  '7d': 'day', '30d': 'week', '90d': 'month', '365d': 'month',
};

export function janelaDoPeriodo(periodo: PeriodoAtividade, deslocamento = 0) {
  const dias = DIAS[periodo];
  const fim = new Date(Date.now() - deslocamento * dias * 24 * 60 * 60 * 1000);
  const inicio = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);
  return { de: inicio.toISOString(), ate: fim.toISOString(), bucket: BUCKET[periodo] };
}

async function buscar(de: string, ate: string, bucket: string): Promise<ResumoAtividade> {
  // Chamada direta ao banco canonico, como os demais hooks que leem
  // `interactions` (useTimelineByEntity, useDealsAtRisk, useDISCAnalysis...).
  // O gateway `external-data` existe para o banco EXTERNO; rotear por ele
  // exigiria redeploy da function so para liberar esta RPC na allowlist.
  // A funcao e SECURITY INVOKER, entao o RLS do usuario filtra as linhas.
  //
  // O cast existe porque `types.ts` e gerado e ainda nao conhece esta RPC;
  // a assinatura abaixo e exatamente a da migration 20261118182753.
  const chamarRpc = supabase.rpc as unknown as (
    nome: 'get_activity_overview',
    args: { p_from: string; p_to: string; p_bucket: string },
  ) => Promise<{ data: ResumoAtividade | null; error: { message: string } | null }>;

  const { data, error } = await chamarRpc('get_activity_overview', {
    p_from: de, p_to: ate, p_bucket: bucket,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Resposta vazia da agregacao de atividade');
  return data;
}

/**
 * @param deslocamento 0 = período atual, 1 = o período imediatamente anterior,
 * usado para as comparações "vs período anterior" das telas.
 */
export function useActivityOverview(periodo: PeriodoAtividade, deslocamento = 0) {
  const { user } = useAuth();
  const { de, ate, bucket } = janelaDoPeriodo(periodo, deslocamento);

  return useQuery<ResumoAtividade>({
    queryKey: ['activity-overview', user?.id, periodo, deslocamento],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    queryFn: () => buscar(de, ate, bucket),
  });
}

export interface RelacionamentoTopo {
  id: string;
  nome: string;
  score: number;
}

/**
 * Contatos com maior score de relacionamento. Substitui a lista de pessoas
 * inventadas que `getTopPerformersData()` devolvia (João Silva, Maria Santos...).
 */
export function useTopRelationships(limite = 5) {
  const { user } = useAuth();
  return useQuery<RelacionamentoTopo[]>({
    queryKey: ['top-relationships', user?.id, limite],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, relationship_score')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('relationship_score', { ascending: false, nullsFirst: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? []).map(c => ({
        id: c.id,
        nome: c.full_name ?? 'Sem nome',
        score: c.relationship_score ?? 0,
      }));
    },
  });
}
