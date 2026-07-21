import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface ActionItem {
  task: string;
  responsible: string;
  deadline: string | null;
  status: 'pending' | 'done';
}

export interface MeetingSummary {
  id: string;
  interaction_id: string;
  user_id: string;
  summary: string;
  key_decisions: string[];
  action_items: ActionItem[];
  participants: string[];
  sentiment_overview: string | null;
  topics: string[];
  next_steps: string[];
  duration_minutes: number | null;
  generated_by_model: string;
  created_at: string;
  updated_at: string;
}

export function useMeetingSummary(interactionId?: string) {
  const qc = useQueryClient();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['meeting-summary', interactionId],
    queryFn: async () => {
      if (!interactionId) return null;
      const { data, error } = await supabase
        .from('meeting_summaries')
        .select('*')
        .eq('interaction_id', interactionId)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MeetingSummary | null;
    },
    enabled: !!interactionId,
    staleTime: 10 * 60_000,
  });

  const generate = useMutation({
    mutationFn: async (intId: string) => {
      const { data, error } = await supabase.functions.invoke('meeting-summary', {
        body: { interaction_id: intId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data as MeetingSummary;
    },
    onSuccess: (_, intId) => {
      qc.invalidateQueries({ queryKey: ['meeting-summary', intId] });
      toast.success('Resumo gerado com sucesso!');
    },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  return {
    summary,
    loading: isLoading,
    generate: generate.mutateAsync,
    generating: generate.isPending,
  };
}
