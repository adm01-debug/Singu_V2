import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useIsAdmin } from './useIsAdmin';

interface CriticalAlertRow {
  id: string;
  alert_type: string;
  severity: string;
  message: string;
  created_at: string;
}

/**
 * Admin-only: monitora `system_alerts` do tipo `ai_gateway_*` com severidade
 * `critical` não reconhecidos e emite toast persistente (uma vez por id).
 * Poll a cada 60s para casar com a janela do avaliador (5min).
 */
export function useAiGatewayCriticalToast(): void {
  const { isAdmin } = useIsAdmin();
  const seenRef = useRef<Set<string>>(new Set());

  const { data } = useQuery({
    queryKey: ['ai-gateway-critical-alerts'],
    enabled: isAdmin,
    staleTime: 30_000,
    refetchInterval: 60_000,
    queryFn: async (): Promise<CriticalAlertRow[]> => {
      const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('system_alerts')
        .select('id, alert_type, severity, message, created_at')
        .like('alert_type', 'ai_gateway_%')
        .eq('severity', 'critical')
        .is('acknowledged_at', null)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as CriticalAlertRow[];
    },
  });

  useEffect(() => {
    if (!data) return;
    for (const alert of data as CriticalAlertRow[]) {
      if (seenRef.current.has(alert.id)) continue;
      seenRef.current.add(alert.id);
      toast.error(alert.message, {
        id: `ai-gw-crit-${alert.id}`,
        description: alert.alert_type.replace(/_/g, ' '),
        duration: 15_000,
        action: {
          label: 'Ver painel',
          onClick: () => {
            window.location.href = '/admin/error-budget';
          },
        },
      });
    }
  }, [data]);
}