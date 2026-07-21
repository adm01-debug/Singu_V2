import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Tables } from '@/integrations/supabase/types';

export function useRFMSegmentConfig() {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['rfm-segment-config', user?.id],
    queryFn: async () => {
      const [segRes, metRes] = await Promise.all([
        supabase.from('rfm_segment_config').select('*').order('priority', { ascending: true }).limit(20),
        supabase.from('rfm_metrics').select('*').order('created_at', { ascending: false }).limit(1),
      ]);
      return {
        segments: segRes.data || [],
        metrics: (metRes.data?.[0] || null) as Tables<'rfm_metrics'> | null,
      };
    },
    enabled: !!user,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return { segments: data?.segments || [], metrics: data?.metrics || null, loading };
}
