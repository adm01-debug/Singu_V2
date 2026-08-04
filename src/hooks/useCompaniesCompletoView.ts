import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export function useCompaniesCompletoView(companyId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vw-companies-completo', companyId, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData({
        table: 'vw_companies_completo',
        select: '*',
        filters: [
          { type: 'eq', column: 'id', value: companyId! },
          { type: 'eq', column: 'user_id', value: user!.id },
        ],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!companyId && !!user,
    staleTime: 10 * 60 * 1000,
  });
}
