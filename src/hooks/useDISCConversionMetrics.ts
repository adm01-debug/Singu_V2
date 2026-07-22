import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { Tables } from '@/integrations/supabase/types';

export type DISCConversionMetric = Tables<'disc_conversion_metrics'>;

export function useDISCConversionMetrics() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DISCConversionMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async (signal?: { cancelled: boolean }) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('disc_conversion_metrics')
        .select('*')
        .eq('user_id', user.id)
        .order('conversion_rate', { ascending: false })
        .limit(200);
      if (signal?.cancelled) return;
      if (error) throw error;
      setMetrics(data || []);
    } catch (err) {
      if (!signal?.cancelled) logger.error('Error fetching DISC conversion metrics:', err);
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const signal = { cancelled: false };
    fetchMetrics(signal);
    return () => { signal.cancelled = true; };
  }, [fetchMetrics]);

  const bestProfile = metrics.length > 0 ? metrics[0] : null;
  const totalContacts = metrics.reduce((sum, m) => sum + m.total_contacts, 0);
  const totalConverted = metrics.reduce((sum, m) => sum + m.converted_count, 0);
  const overallConversionRate = totalContacts > 0 ? Math.round((totalConverted / totalContacts) * 100) : 0;

  return { metrics, loading, bestProfile, totalContacts, totalConverted, overallConversionRate, refresh: fetchMetrics };
}
