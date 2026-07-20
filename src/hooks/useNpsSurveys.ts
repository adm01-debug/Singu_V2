import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface CsatSurvey {
  id: string;
  user_id: string;
  contact_id: string;
  ticket_id: string | null;
  interaction_id: string | null;
  channel: string | null;
  score: number | null;
  feedback: string | null;
  status: string;
  sent_at: string | null;
  answered_at: string | null;
  expires_at: string | null;
  public_token: string;
  created_at: string;
  updated_at: string;
}

export interface NpsMetrics {
  total: number;
  answered: number;
  pending: number;
  promoters: number;
  passives: number;
  detractors: number;
  npsScore: number;
  responseRate: number;
  avgScore: number;
}

export function useNpsSurveys() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const surveysQuery = useQuery({
    queryKey: ['nps-surveys', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('csat_surveys')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as CsatSurvey[];
    },
  });

  const create = useMutation({
    mutationFn: async (input: { contact_id: string; channel?: string; ticket_id?: string | null; interaction_id?: string | null }) => {
      if (!user?.id) throw new Error('Não autenticado');
      const { data, error } = await supabase
        .from('csat_surveys')
        .insert({
          user_id: user.id,
          contact_id: input.contact_id,
          channel: input.channel ?? 'email',
          ticket_id: input.ticket_id ?? null,
          interaction_id: input.interaction_id ?? null,
          status: 'sent',
          sent_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Falha ao criar pesquisa NPS');
      return data;
    },
    onSuccess: () => {
      toast.success('Pesquisa enviada!');
      qc.invalidateQueries({ queryKey: ['nps-surveys'] });
    },
    onError: (e) => {
      logger.error('Failed to create NPS survey', e);
      toast.error('Falha ao enviar pesquisa');
    },
  });

  const answer = useMutation({
    mutationFn: async (input: { id: string; score: number; feedback?: string }) => {
      const { error } = await supabase
        .from('csat_surveys')
        .update({
          score: input.score,
          feedback: input.feedback ?? null,
          status: 'answered',
          answered_at: new Date().toISOString(),
        })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resposta registrada!');
      qc.invalidateQueries({ queryKey: ['nps-surveys'] });
    },
    onError: () => toast.error('Erro ao registrar resposta'),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('csat_surveys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Pesquisa removida');
      qc.invalidateQueries({ queryKey: ['nps-surveys'] });
    },
    onError: () => toast.error('Erro ao remover pesquisa'),
  });

  const surveys = surveysQuery.data ?? [];
  const answered = surveys.filter(s => s.status === 'answered' && s.score != null);
  const promoters = answered.filter(s => (s.score ?? 0) >= 9).length;
  const detractors = answered.filter(s => (s.score ?? 0) <= 6).length;
  const passives = answered.filter(s => (s.score ?? 0) >= 7 && (s.score ?? 0) <= 8).length;
  const npsScore = answered.length > 0
    ? Math.round(((promoters - detractors) / answered.length) * 100)
    : 0;
  const avgScore = answered.length > 0
    ? Number((answered.reduce((sum, s) => sum + (s.score ?? 0), 0) / answered.length).toFixed(1))
    : 0;

  const metrics: NpsMetrics = {
    total: surveys.length,
    answered: answered.length,
    pending: surveys.filter(s => s.status === 'sent').length,
    promoters,
    passives,
    detractors,
    npsScore,
    responseRate: surveys.length > 0 ? Math.round((answered.length / surveys.length) * 100) : 0,
    avgScore,
  };

  return {
    surveys,
    metrics,
    isLoading: surveysQuery.isLoading,
    refetch: surveysQuery.refetch,
    createSurvey: create.mutateAsync,
    answerSurvey: answer.mutateAsync,
    deleteSurvey: remove.mutateAsync,
    isCreating: create.isPending,
  };
}
