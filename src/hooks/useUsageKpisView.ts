import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export function useUsageKpisView() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vw-singu-usage-kpis', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_singu_usage_kpis',
        select: '*',
        filters: [{ type: 'eq', column: 'user_id', value: user!.id }],
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}
