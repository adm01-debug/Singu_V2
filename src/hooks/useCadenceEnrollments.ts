import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface CadenceEnrollment {
  id: string;
  contact_id: string;
  cadence_id?: string;
  cadence_name?: string;
  status?: string;
  enrolled_at?: string;
  completed_at?: string;
  paused_at?: string;
  current_step?: number;
  total_steps?: number;
  next_action_at?: string;
  created_at: string;
}

export function useCadenceEnrollments(contactId?: string) {
  return useQuery({
    queryKey: ['cadence-enrollments', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<CadenceEnrollment>({
        table: 'cadence_enrollments',
        select: '*',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId,
    staleTime: 5 * 60 * 1000,
  });
}
