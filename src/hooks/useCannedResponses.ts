import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { parseApiError } from '@/lib/errorMessages';

export interface CannedResponse {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  shortcut: string | null;
  usage_count: number;
  created_at: string;
}

export function useCannedResponses() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['canned-responses', user?.id];

  const { data: responses = [], isLoading } = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('canned_responses')
        .select('id, user_id, title, content, category, shortcut, usage_count, created_at')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as CannedResponse[];
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  const create = useMutation({
    mutationFn: async (input: { title: string; content: string; category?: string; shortcut?: string }) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('canned_responses').insert([{
        ...input,
        user_id: user.id
      }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Resposta rápida criada!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  const use = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return '';
      const r = responses.find(r => r.id === id);
      if (!r) return '';
      const { error } = await supabase.from('canned_responses').update({
        usage_count: r.usage_count + 1
      }).eq('user_id', user.id).eq('id', id);
      if (error) logger.warn('Failed to increment usage_count', { error: error.message });
      return r.content;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e: Error) => logger.warn('Failed to use canned response:', { error: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Não autenticado');
      const { error } = await supabase.from('canned_responses').delete().eq('user_id', user.id).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Resposta removida!'); },
    onError: (e: Error) => toast.error(parseApiError(e)),
  });

  return { responses, isLoading, create, use, remove };
}
