import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface WhatsappMessage {
  id: string;
  company_id?: string;
  contact_id?: string;
  direction: string;
  message_type?: string;
  content?: string;
  media_url?: string;
  whatsapp_id?: string;
  status?: string;
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
}

export function useWhatsappMessages(contactId?: string) {
  return useQuery({
    queryKey: ['whatsapp-messages', contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<WhatsappMessage>({
        table: 'whatsapp_messages',
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
