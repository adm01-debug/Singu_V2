import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useTriggerAnalytics(contactId?: string) {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['trigger-analytics', contactId, user?.id],
    queryFn: async () => {
      const abQuery = contactId
        ? supabase.from('trigger_ab_tests').select('*').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50)
        : supabase.from('trigger_ab_tests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);

      const chQuery = contactId
        ? supabase.from('trigger_channel_effectiveness').select('*').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50)
        : supabase.from('trigger_channel_effectiveness').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50);

      const [abRes, chRes, buRes, intRes] = await Promise.all([
        abQuery,
        chQuery,
        supabase.from('trigger_bundles').select('*').eq('user_id', user!.id).order('success_rate', { ascending: false }).limit(20),
        contactId
          ? supabase.from('trigger_intensity_history').select('*').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(30)
          : Promise.resolve({ data: [] as Tables<'trigger_intensity_history'>[] }),
      ]);

      return {
        abTests: (abRes.data || []) as Tables<'trigger_ab_tests'>[],
        channelEffectiveness: (chRes.data || []) as Tables<'trigger_channel_effectiveness'>[],
        bundles: (buRes.data || []) as Tables<'trigger_bundles'>[],
        intensityHistory: (intRes.data || []) as Tables<'trigger_intensity_history'>[],
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    abTests: data?.abTests || [],
    channelEffectiveness: data?.channelEffectiveness || [],
    bundles: data?.bundles || [],
    intensityHistory: data?.intensityHistory || [],
    loading,
  };
}
