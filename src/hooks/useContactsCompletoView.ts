import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';

export interface ContactCompleto {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  nome_tratamento: string | null;
  assinatura_contato: string | null;
  apelido: string | null;
  cargo: string | null;
  sexo: string | null;
  relationship_stage: string | null;
  is_duplicate: boolean | null;
  company_id: string | null;
  company_title: string | null;
  company_razao: string | null;
  tipo_cooperativa: string | null;
  grupo_economico: string | null;
  telefone_principal: string | null;
  email_principal: string | null;
  total_phones: number | null;
  total_emails: number | null;
  created_at: string;
  updated_at: string;
}

export function useContactsCompletoView(contactId: string | undefined) {
  return useQuery({
    queryKey: ['contacts-completo', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const { data, error } = await queryExternalData<ContactCompleto>({
        table: 'vw_contacts_completo',
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
