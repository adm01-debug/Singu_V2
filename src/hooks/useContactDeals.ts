import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface ContactDeal {
  id: string;
  contact_id: string | null;
  company_id?: string;
  titulo: string;
  valor?: number;
  status?: string;
  pipeline_stage?: string;
  probabilidade?: number;
  previsao_fechamento?: string;
  closed_at?: string;
  motivo_perda?: string;
  notas?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

export function useContactDeals(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-deals', user?.id, contactId],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactDeal>({
        table: 'deals',
        select: '*',
        filters: [
          { type: 'eq', column: 'contact_id', value: contactId },
          { type: 'eq', column: 'user_id', value: user!.id },
        ],
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
