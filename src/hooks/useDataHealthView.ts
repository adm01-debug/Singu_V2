import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export function useDataHealthView() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vw-singu-data-health', user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_singu_data_health',
        select: '*',
        filters: [{ type: 'eq', column: 'user_id', value: user!.id }],
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
  });
}
