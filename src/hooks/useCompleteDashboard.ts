import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CompleteDashboardData {
  overview: {
    total_companies: number;
    total_contacts: number;
    total_interactions: number;
    total_deals: number;
    active_deals_value: number;
    conversion_rate: number;
  };
  pipeline: {
    stage: string;
    count: number;
    value: number;
  }[];
  activity: {
    date: string;
    count: number;
  }[];
  conversion: {
    period: string;
    rate: number;
  }[];
  alerts_count: number;
}

export function useCompleteDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['complete-dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await callExternalRpc<CompleteDashboardData>(
        'get_complete_dashboard',
        { p_user_id: user.id }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
