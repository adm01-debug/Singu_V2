import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';

export interface ContactProposal {
  id: string;
  contact_id: string;
  deal_id?: string;
  title: string;
  value?: number;
  status?: string;
  sent_at?: string;
  viewed_at?: string;
  accepted_at?: string;
  rejected_at?: string;
  expires_at?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export function useContactProposals(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-proposals', contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactProposal>({
        table: 'proposals',
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
