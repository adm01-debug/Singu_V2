import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface ClosingScoreAlert {
  id: string;
  contact_id: string;
  contact_name: string;
  current_score: number;
  previous_score: number | null;
  change_type: string;
  created_at: string;
}

/**
 * Local closing score alerts from Supabase alerts table.
 * Falls back gracefully when no data exists.
 */
export function useClosingScoreAlerts() {
  const { user } = useAuth();

  const { data: alerts = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['closing-score-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'closing_score')
        .eq('dismissed', false)
        .order('created_at', { ascending: false })
        .limit(20);

      return (data || []).map(a => ({
        id: a.id,
        contact_id: a.contact_id || '',
        contact_name: a.title,
        current_score: 0,
        previous_score: null,
        change_type: a.priority === 'high' ? 'improved_to_high' : 'dropped_to_very_low',
        created_at: a.created_at,
      }));
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const dismissAlert = async (id: string) => {
    const { error } = await supabase.from('alerts').update({ dismissed: true }).eq('user_id', user.id).eq('id', id);
    if (error) logger.error('Error dismissing alert:', { error: error.message });
    refetch();
  };

  const dismissAllAlerts = async () => {
    if (!user) return;
    const { error } = await supabase.from('alerts').update({ dismissed: true }).eq('user_id', user.id).eq('type', 'closing_score');
    if (error) logger.error('Error dismissing all alerts:', { error: error.message });
    refetch();
  };

  return {
    alerts,
    loading,
    dismissAlert,
    dismissAllAlerts,
    refreshAlerts: () => { refetch(); },
    probabilityLabels: { high: 'Alta', medium: 'Média', low: 'Baixa', very_low: 'Muito Baixa' },
  };
}
