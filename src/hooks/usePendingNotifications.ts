import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface PendingNotification {
  id?: string;
  contact_id?: string;
  user_id?: string;
  notification_type?: string;
  title?: string;
  description?: string;
  priority?: string;
  due_at?: string;
  created_at?: string;
  contact_name?: string;
  company_name?: string;
}

export function usePendingNotifications(limit = 20) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pending-notifications', limit, user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await queryExternalData<PendingNotification>({
        table: 'vw_pending_notifications',
        filters: [{ type: 'eq', column: 'user_id', value: user.id }],
        order: { column: 'created_at', ascending: false },
        range: { from: 0, to: limit - 1 },
      });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}
