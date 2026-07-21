import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface CampaignRecipient {
  id: string;
  campaign_id: string;
  contact_id: string;
  email: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  created_at: string;
}

export function useCampaignRecipients(campaignId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['campaign-recipients', campaignId, user?.id],
    enabled: !!campaignId && !!user,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_recipients')
        .select('id, campaign_id, contact_id, email, status, sent_at, opened_at, clicked_at, created_at')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as CampaignRecipient[];
    },
  });
}
