import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface CSATSurvey {
  id: string;
  user_id: string;
  contact_id: string;
  interaction_id: string | null;
  ticket_id: string | null;
  score: number | null;
  feedback: string | null;
  channel: string;
  status: 'pending' | 'sent' | 'answered' | 'expired';
  sent_at: string | null;
  answered_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export function useCSATSurveys(contactId?: string) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['csat-surveys', contactId, user?.id];

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      let query = supabase.from('csat_surveys').select('id, user_id, contact_id, interaction_id, ticket_id, score, feedback, channel, status, sent_at, answered_at, expires_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false });
      if (contactId) query = query.eq('contact_id', contactId);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as unknown as CSATSurvey[];
    },
    staleTime: 5 * 60_000,
  });

  const send = useMutation({
    mutationFn: async (input: { contactId: string; interactionId?: string; ticketId?: string; channel?: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('csat_surveys').insert({
        user_id: user.id,
        contact_id: input.contactId,
        interaction_id: input.interactionId || null,
        ticket_id: input.ticketId || null,
        channel: input.channel || 'email',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Pesquisa CSAT enviada!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const answer = useMutation({
    mutationFn: async ({ id, score, feedback }: { id: string; score: number; feedback?: string }) => {
      if (!user) throw new Error('Não autenticado');
      if (score < 0 || score > 10) throw new Error('Score deve ser entre 0 e 10');
      const { error } = await supabase.from('csat_surveys').update({
        score,
        feedback: feedback || null,
        status: 'answered' as const,
        answered_at: new Date().toISOString(),
      }).eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Resposta registrada!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const stats = {
    total: surveys.length,
    answered: surveys.filter(s => s.status === 'answered').length,
    avgScore: surveys.filter(s => s.score).reduce((sum, s) => sum + (s.score || 0), 0) / (surveys.filter(s => s.score).length || 1),
    responseRate: surveys.length > 0 ? Math.round((surveys.filter(s => s.status === 'answered').length / surveys.length) * 100) : 0,
  };

  return { surveys, isLoading, send, answer, stats };
}
