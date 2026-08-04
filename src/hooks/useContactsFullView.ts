import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactFull {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  email_normalized: string | null;
  phone: string | null;
  cargo: string | null;
  is_duplicate: boolean | null;
  created_at: string;
  updated_at: string;
  company_id: string | null;
  empresa_nome: string | null;
  empresa_razao_social: string | null;
  empresa_nome_fantasia: string | null;
  empresa_cnpj: string | null;
  empresa_phone: string | null;
  empresa_email: string | null;
  empresa_status: string | null;
  empresa_is_cliente: boolean | null;
  grupo_economico_id: string | null;
  grupo_economico_nome: string | null;
  is_active: boolean | null;
}

export function useContactsFullView(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contacts-full-view', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ContactFull>({
        table: 'vw_contacts_full',
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
