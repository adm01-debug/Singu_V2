import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { supabase } from '@/integrations/supabase/client';
import type { RodizioKpi } from '@/types/rodizio';

/**
 * Lê `vw_rodizio_kpis` — a view já agrega tudo por closer, então o hook não
 * precisa mais buscar `lead_assignments`/`handoff_requests`/
 * `redistribution_log` e calcular métricas no client.
 */
export function useRoutingMetrics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['rodizio-kpis', user?.id],
    queryFn: async (): Promise<RodizioKpi[]> => {
      if (!user) return [];
      const { data, error } = await supabase.from('vw_rodizio_kpis')
        .select('*')
        .order('closer_nome', { ascending: true })
        .limit(500);
      if (error) {
        logger.error('Erro ao carregar KPIs do rodízio:', error);
        throw error;
      }
      return data ?? [];
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
