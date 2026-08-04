import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface SalesActivity {
  id: string;
  sale_id?: string;
  salesperson_id?: string;
  activity_type?: string;
  outcome?: string;
  notes?: string;
  duration_minutes?: number;
  contact_name?: string;
  deleted_at?: string;
  deleted_by?: string;
  delete_reason?: string;
  created_at?: string;
}

export function useSalesActivities(contactName?: string) {
  return useQuery({
    queryKey: ['sales-activities', contactName],
    queryFn: async () => {
      if (!contactName) return [];
      const { data, error } = await queryExternalData<SalesActivity>({
        table: 'sales_activities',
        select: '*',
        search: { term: contactName, columns: ['contact_name'] },
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactName,
    staleTime: 5 * 60 * 1000,
  });
}
