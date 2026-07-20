import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        .select('*')
        .eq('user_id', user.id)
        .order('usage_count', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as CannedResponse[];
    },
    staleTime: 5 * 60_000,
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
    onError: (e: Error) => toast.error(e.message),
  });

  const use = useMutation({
    mutationFn: async (id: string) => {
      const r = responses.find(r => r.id === id);
      if (!r) return '';
      await supabase.from('canned_responses').update({
        usage_count: r.usage_count + 1
      }).eq('id', id);
      return r.content;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('canned_responses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: key }); toast.success('Resposta removida!'); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { responses, isLoading, create, use, remove };
}
