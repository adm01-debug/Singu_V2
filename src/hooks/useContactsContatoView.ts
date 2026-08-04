import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactContato {
  id: string;
  full_name: string;
  nome_tratamento: string | null;
  apelido: string | null;
  company_id: string | null;
  phone: string | null;
  phone_normalizado: string | null;
  whatsapp: string | null;
  email: string | null;
  email_normalizado: string | null;
  total_telefones: number | null;
  total_emails: number | null;
}

export function useContactsContatoView(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contacts-contato-view', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ContactContato>({
        table: 'vw_contacts_contato',
        filters: [{ type: 'eq', column: 'id', value: contactId }],
        range: { from: 0, to: 0 },
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    enabled: !!contactId,
    staleTime: 10 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
  });
}
