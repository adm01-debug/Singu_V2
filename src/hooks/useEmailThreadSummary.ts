import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';

export interface ThreadActionItem {
  task: string;
  responsible?: string;
  deadline?: string | null;
}

export interface EmailThreadSummary {
  id: string;
  user_id: string;
  thread_key: string;
  interaction_ids: string[];
  summary: string;
  key_points: string[];
  action_items: ThreadActionItem[];
  sentiment: string | null;
  next_steps: string[];
  generated_by_model: string;
  created_at: string;
  updated_at: string;
}

interface GenerateInput {
  interaction_id?: string;
  contact_id?: string;
  subject?: string;
}

async function computeThreadKey(contactId: string, subject: string): Promise<string> {
  const norm = subject.toLowerCase().replace(/^(re:|fw:|fwd:)\s*/gi, '').trim();
  const data = new TextEncoder().encode(`${contactId}::${norm}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .slice(0, 16)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useEmailThreadSummary(params?: { contactId?: string; subject?: string }) {
  const qc = useQueryClient();
  const enabled = !!(params?.contactId && params?.subject);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['email-thread-summary', params?.contactId, params?.subject],
    queryFn: async () => {
      if (!enabled) return null;
      const key = await computeThreadKey(params!.contactId!, params!.subject!);
      const { data, error } = await supabase
        .from('email_thread_summaries')
        .select('*')
        .eq('thread_key', key)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as EmailThreadSummary | null;
    },
    enabled,
    staleTime: 5 * 60_000,
  });

  const generate = useMutation({
    mutationFn: async (input: GenerateInput) => {
      const { data, error } = await supabase.functions.invoke('email-thread-summary', {
        body: input,
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as EmailThreadSummary;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-thread-summary'] });
      toast.success('Resumo da thread gerado!');
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
