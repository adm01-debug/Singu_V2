import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DailyUptimePoint {
  date: string;
  uptime_pct: number;
  samples: number;
}

export interface ActiveErrorBudgetAlert {
  id: string;
  severity: 'warning' | 'high' | 'critical';
  threshold_pct: number;
  consumed_pct: number;
  message: string;
  created_at: string;
}

export interface ErrorBudgetData {
  slo_target_pct: number;
  window_hours: number;
  uptime_pct: number;
  downtime_minutes: number;
  budget_total_minutes: number;
  budget_consumed_pct: number;
  freeze_active: boolean;
  freeze_warning: boolean;
  total_samples: number;
  down_samples: number;
  degraded_samples: number;
  sample_interval_minutes: number;
  computed_at: string;
  daily_uptime: DailyUptimePoint[];
  active_alerts: ActiveErrorBudgetAlert[];
}

export function useErrorBudget() {
  return useQuery<ErrorBudgetData>({
    queryKey: ['error-budget'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('error-budget', { body: {} });
      if (error) throw error;
      return data as ErrorBudgetData;
    },
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    staleTime: 4 * 60_000,
  });
}
