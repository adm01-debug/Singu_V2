import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface ContactIntelligence {
  contact_id?: string;
  full_name?: string;
  relationship_score?: number;
  engagement_score?: number;
  disc_profile?: string;
  eq_level?: string;
  sentiment?: string;
  churn_risk?: string;
  best_channel?: string;
  best_time?: string;
  days_without_contact?: number;
  total_interactions?: number;
  last_interaction_at?: string;
  open_deals?: number;
  total_deal_value?: number;
  nps_score?: number;
  tags?: string[];
  [key: string]: unknown;
}

export function useContactIntelligence(contactId: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['contact-intelligence', contactId],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await callExternalRpc<ContactIntelligence | ContactIntelligence[]>(
        'get_contact_intelligence',
        { p_contact_id: contactId, p_user_id: user.id }
      );
      if (error) throw error;
      if (Array.isArray(data)) return data[0] || null;
      return data;
    },
    enabled: enabled && !!contactId && !!user,
    staleTime: 5 * 60_000,
  });
}
