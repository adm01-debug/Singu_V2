import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export function useDiscDashboardView() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vw-singu-disc-dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_singu_disc_dashboard',
        select: '*',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });
}
