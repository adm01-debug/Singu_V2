import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useScoreHistory(contactId: string) {
  const { user } = useAuth();

  const { data: history = [], isLoading: loading } = useQuery({
    queryKey: ['score-history', contactId, user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('score_history')
        .select('*')
        .eq('contact_id', contactId)
        .eq('user_id', user!.id)
        .order('calculated_at', { ascending: false })
        .limit(50);
      return (data || []) as Tables<'score_history'>[];
    },
    enabled: !!user && !!contactId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  return { history, loading };
}
