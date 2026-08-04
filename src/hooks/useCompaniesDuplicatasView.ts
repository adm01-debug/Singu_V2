import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export function useCompaniesDuplicatasView(limit = 50) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vw-companies-duplicatas', limit, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_companies_duplicatas',
        select: '*',
        filters: [{ type: 'eq', column: 'user_id', value: user!.id }],
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
  });
}
