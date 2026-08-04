import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';

export interface ContactTask {
  id: string;
  contact_id: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  task_type?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export function useContactTasks(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-tasks', contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactTask>({
        table: 'tasks',
        select: '*',
        filters: [{ type: 'eq', column: 'contact_id', value: contactId }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: 49 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!contactId && !!user,
    staleTime: 5 * 60 * 1000,
  });
}
