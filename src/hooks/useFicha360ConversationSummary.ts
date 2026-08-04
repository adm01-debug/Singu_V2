import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { parseApiError } from '@/lib/errorMessages';

export interface ConversationSummaryPendency {
  item: string;
  prazo_estimado?: string;
}

export interface ConversationSummarySignal {
  tipo: 'positivo' | 'atencao' | 'negativo';
  descricao: string;
}

export interface ConversationSummary {
  perfil_resumido: string;
  estilo_comunicacao: string;
  topicos_principais: string[];
  decisoes_acordos: string[];
  pendencias: ConversationSummaryPendency[];
  sinais_relacionamento: ConversationSummarySignal[];
  proximos_passos_sugeridos: string[];
  risco_churn: 'baixo' | 'medio' | 'alto';
  confianca_analise: number;
}

export interface ConversationSummaryResult {
  summary: ConversationSummary;
  model: string;
  generated_at: string;
  interactions_analyzed: number;
  from_cache: boolean;
}

interface InteractionPayload {
  id: string;
  channel: string | null;
  direction: string | null;
  data_interacao: string | null;
  assunto: string | null;
  resumo: string | null;
}

export interface GenerateSummaryParams {
  contact_id: string;
  interactions: InteractionPayload[];
  contact_snapshot: {
    full_name: string;
    role_title?: string | null;
    company_name?: string | null;
    disc_profile?: string | null;
    hobbies?: string[];
    interests?: string[];
  };
  filters_summary: {
    period_days?: number;
    channels?: string[];
    tags?: string[];
    query?: string;
  };
  force_refresh?: boolean;
}

export interface SummaryHistoryItem {
  id: string;
  created_at: string;
  interactions_analyzed: number;
  filters_summary: GenerateSummaryParams['filters_summary'];
  summary: ConversationSummary;
  model: string;
}

export function useFicha360ConversationSummary(contactId?: string) {
  const qc = useQueryClient();

  const generate = useMutation({
    mutationFn: async (params: GenerateSummaryParams): Promise<ConversationSummaryResult> => {
      const { data, error } = await supabase.functions.invoke('ficha360-conversation-summary', {
        body: params,
      });
      if (error) throw new Error(error.message ?? 'Falha ao gerar resumo');
      const errMsg = (data as { error?: string } | null)?.error;
      if (errMsg) throw new Error(errMsg);
      return data as ConversationSummaryResult;
    },
    onSuccess: (res) => {
      if (res.from_cache) {
        toast.success('Resumo carregado do cache (válido por 24h).');
      } else {
        toast.success('Resumo gerado com sucesso!');
      }
      if (contactId) {
        qc.invalidateQueries({ queryKey: ['f360-summary-history', contactId] });
      }
    },
    onError: (e: Error) => toast.error(parseApiError(e, 'Erro ao gerar resumo')),
  });

  const history = useQuery({
    queryKey: ['f360-summary-history', contactId],
    queryFn: async (): Promise<SummaryHistoryItem[]> => {
      if (!contactId) return [];
      const { data, error } = await supabase
        .from('ficha360_conversation_summaries')
        .select('id, created_at, interactions_analyzed, filters_summary, summary, model')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        interactions_analyzed: r.interactions_analyzed,
        filters_summary: (r.filters_summary ?? {}) as GenerateSummaryParams['filters_summary'],
        summary: r.summary as unknown as ConversationSummary,
        model: r.model,
      }));
    },
    enabled: !!contactId,
    staleTime: 60_000,
  });

  return {
    generate: generate.mutateAsync,
    generating: generate.isPending,
    history: history.data ?? [],
    historyLoading: history.isLoading,
  };
}
