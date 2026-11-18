import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Dados reais dos widgets do Report Builder.
 *
 * Antes desta camada o WidgetRenderer era placeholder: cada widget mostrava o
 * proprio nome num card cinza. As consultas aqui sao todas escopadas por
 * user_id e passam pelo RLS como qualquer outra leitura do app.
 */

const CINCO_MIN = 5 * 60 * 1000;

export function useContactsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['widget-contacts-count', user?.id],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useCompaniesCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['widget-companies-count', user?.id],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('companies')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .is('deleted_at', null);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export interface InteracoesSemana {
  ultimos7: number;
  semanaAnterior: number;
}

export function useInteractionsWeek() {
  const { user } = useAuth();
  return useQuery<InteracoesSemana>({
    queryKey: ['widget-interactions-week', user?.id],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const agora = Date.now();
      const seteDias = new Date(agora - 7 * 24 * 60 * 60 * 1000).toISOString();
      const quatorzeDias = new Date(agora - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [recentes, anteriores] = await Promise.all([
        supabase.from('interactions').select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id).gte('data_interacao', seteDias),
        supabase.from('interactions').select('id', { count: 'exact', head: true })
          .eq('user_id', user!.id).gte('data_interacao', quatorzeDias).lt('data_interacao', seteDias),
      ]);
      if (recentes.error) throw recentes.error;
      if (anteriores.error) throw anteriores.error;
      return { ultimos7: recentes.count ?? 0, semanaAnterior: anteriores.count ?? 0 };
    },
  });
}

export interface ResumoPipeline {
  valorEmAberto: number;
  porEstagio: { estagio: string; quantidade: number; valor: number }[];
}

export function usePipelineWidget() {
  const { user } = useAuth();
  return useQuery<ResumoPipeline>({
    queryKey: ['widget-pipeline', user?.id],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deals')
        .select('valor, status, pipeline_stage')
        .eq('user_id', user!.id);
      if (error) throw error;

      const linhas = data ?? [];
      const emAberto = linhas.filter(d => d.status !== 'ganho' && d.status !== 'perdido');
      const mapa = new Map<string, { quantidade: number; valor: number }>();
      for (const deal of emAberto) {
        const estagio = deal.pipeline_stage || 'sem_estagio';
        const atual = mapa.get(estagio) ?? { quantidade: 0, valor: 0 };
        atual.quantidade += 1;
        atual.valor += Number(deal.valor ?? 0);
        mapa.set(estagio, atual);
      }
      return {
        valorEmAberto: emAberto.reduce((soma, d) => soma + Number(d.valor ?? 0), 0),
        porEstagio: [...mapa.entries()]
          .map(([estagio, v]) => ({ estagio, ...v }))
          .sort((a, b) => b.valor - a.valor),
      };
    },
  });
}

export interface ContatoEmRisco {
  contact_id: string;
  contact_name: string | null;
  days_since_contact: number | null;
  risk_level: string | null;
}

export function useChurnRiskWidget(limite = 5) {
  const { user } = useAuth();
  return useQuery<ContatoEmRisco[]>({
    queryKey: ['widget-churn-risk', user?.id, limite],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      // A view ja ordena o risco em churn_ranking (1 = mais critico) e e
      // escopada pelo RLS do usuario, como as demais leituras do app.
      const { data, error } = await supabase
        .from('vw_churn_risk_ranking')
        .select('contact_id, contact_name, days_since_contact, risk_level')
        .order('churn_ranking', { ascending: true, nullsFirst: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? []) as unknown as ContatoEmRisco[];
    },
  });
}

export interface DistribuicaoSentimento {
  rotulo: string;
  total: number;
}

/** Agrupa os rotulos equivalentes que convivem na base (positivo/positive). */
const GRUPOS_SENTIMENTO: { rotulo: string; valores: string[] }[] = [
  { rotulo: 'Positivo', valores: ['positivo', 'positive'] },
  { rotulo: 'Neutro', valores: ['neutral', 'neutro'] },
  { rotulo: 'Negativo', valores: ['negativo', 'negative'] },
];

export function useSentimentDistribution() {
  const { user } = useAuth();
  return useQuery<DistribuicaoSentimento[]>({
    queryKey: ['widget-sentiment', user?.id],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const resultados = await Promise.all(
        GRUPOS_SENTIMENTO.map(async grupo => {
          const { count, error } = await supabase
            .from('interactions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user!.id)
            .in('sentiment', grupo.valores);
          if (error) throw error;
          return { rotulo: grupo.rotulo, total: count ?? 0 };
        }),
      );
      return resultados.filter(r => r.total > 0);
    },
  });
}

export interface AtividadeRecente {
  id: string;
  assunto: string | null;
  channel: string | null;
  data_interacao: string | null;
}

export function useRecentActivity(limite = 5) {
  const { user } = useAuth();
  return useQuery<AtividadeRecente[]>({
    queryKey: ['widget-recent-activity', user?.id, limite],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select('id, assunto, channel, data_interacao')
        .eq('user_id', user!.id)
        .order('data_interacao', { ascending: false, nullsFirst: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? []) as AtividadeRecente[];
    },
  });
}

export interface ContatoPorScore {
  id: string;
  full_name: string | null;
  relationship_score: number | null;
}

export function useTopContactsByScore(limite = 5) {
  const { user } = useAuth();
  return useQuery<ContatoPorScore[]>({
    queryKey: ['widget-top-contacts', user?.id, limite],
    enabled: !!user,
    staleTime: CINCO_MIN,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, full_name, relationship_score')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('relationship_score', { ascending: false, nullsFirst: false })
        .limit(limite);
      if (error) throw error;
      return (data ?? []) as ContatoPorScore[];
    },
  });
}
