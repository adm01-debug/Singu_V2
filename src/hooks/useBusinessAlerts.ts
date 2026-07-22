import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

export interface BusinessAlert {
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  affected_count: number;
  action_required: string;
}

const SEVERITY_MAP: Record<string, BusinessAlert['severity']> = {
  'CRÍTICO': 'critical',
  'CRITICO': 'critical',
  'critical': 'critical',
  'ALTO': 'high',
  'high': 'high',
  'MÉDIO': 'medium',
  'MEDIO': 'medium',
  'medium': 'medium',
  'BAIXO': 'low',
  'low': 'low',
};

export function useBusinessAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['business-alerts', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Record<string, unknown>[]>(
        'get_business_alerts',
        {}
      );
      if (error) throw error;
      return (data ?? []).map((item) => ({
        ...item,
        severity: SEVERITY_MAP[String(item.severity ?? '').toUpperCase()] 
          ?? SEVERITY_MAP[String(item.severity ?? '')] 
          ?? 'low',
      })) as BusinessAlert[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
