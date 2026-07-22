import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';

export interface ContactEmailLog {
  id: string;
  contact_id: string;
  subject?: string;
  body_preview?: string;
  from_email?: string;
  to_email?: string;
  status?: string;
  sent_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  template_id?: string;
  created_at: string;
}

export function useContactEmailLogs(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-email-logs', contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactEmailLog>({
        table: 'email_logs',
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
