import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface InstantKpis {
  total_companies: number;
  total_contacts: number;
  total_deals: number;
  open_deals_value: number;
  deals_won_month: number;
  revenue_month: number;
  interactions_today: number;
  pending_followups: number;
  overdue_tasks: number;
}

export function useInstantKpis() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['instant-kpis', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await callExternalRpc<InstantKpis>('get_instant_kpis', { p_user_id: user.id });
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
