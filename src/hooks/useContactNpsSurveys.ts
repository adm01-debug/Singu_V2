import { useQuery } from '@tanstack/react-query';
import { queryExternalData } from '@/lib/externalData';
import { useAuth } from './useAuth';

export interface ContactNpsSurvey {
  id: string;
  contact_id: string;
  score?: number;
  feedback?: string;
  category?: string;
  survey_type?: string;
  sent_at?: string;
  responded_at?: string;
  created_at: string;
}

export function useContactNpsSurveys(contactId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-nps-surveys', contactId, user?.id],
    queryFn: async () => {
      const { data, error } = await queryExternalData<ContactNpsSurvey>({
        table: 'nps_surveys',
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
