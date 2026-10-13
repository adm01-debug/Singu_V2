import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

export type DataHealthRecord = Database['public']['Views']['vw_singu_data_health']['Row'];

export function useDataHealthView() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['vw-singu-data-health', user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData<DataHealthRecord>({
        table: 'vw_singu_data_health',
        select: '*',
        range: { from: 0, to: 99 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 15 * 60 * 1000,
  });
}
