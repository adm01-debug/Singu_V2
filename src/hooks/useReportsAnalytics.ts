import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';
import { useAuth } from '@/hooks/useAuth';

// ── Types ──────────────────────────────────────────

export interface RfmDashboard {
  segments: Array<{
    segment: string;
    count: number;
    percentage: number;
    avg_revenue: number;
  }>;
  summary: {
    total_customers: number;
    avg_recency: number;
    avg_frequency: number;
    avg_monetary: number;
  };
}

export interface CohortData {
  cohort_month: string;
  months: Array<{
    month_number: number;
    retention_rate: number;
    revenue: number;
  }>;
}

export interface SeasonalityData {
  month: number;
  month_name: string;
  avg_revenue: number;
  avg_deals: number;
  avg_interactions: number;
}

export interface PeriodComparison {
  metric: string;
  current: number;
  previous: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ConversionFunnel {
  stage: string;
  count: number;
  conversion_rate: number;
  avg_days: number;
}

export interface ParetoCustomer {
  id: string;
  name: string;
  revenue: number;
  cumulative_percent: number;
  segment: string;
}

export interface TrendData {
  period: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
}

export interface LossReasonData {
  reason: string;
  count: number;
  percentage: number;
  avg_deal_value: number;
}

export interface IndustryAnalysis {
  industry: string;
  company_count: number;
  total_revenue: number;
  avg_deal_size: number;
  conversion_rate: number;
}

export interface ChannelAnalysis {
  channel: string;
  interaction_count: number;
  response_rate: number;
  avg_response_time: number;
  conversion_rate: number;
}

// ── Hooks ──────────────────────────────────────────

export function useRfmDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['rfm-dashboard', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<RfmDashboard>(
        'get_rfm_dashboard', {}
      );
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useCohortAnalysis(months = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['cohort-analysis', months, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<CohortData[]>(
        'get_cohort_analysis', { p_months: months }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useSeasonalityAnalysis(months = 12) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seasonality', months, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<SeasonalityData[]>(
        'get_seasonality_analysis', { p_months: months }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useComparePeriods(metric: string, days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['compare-periods', metric, days, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<PeriodComparison>(
        'compare_periods', { p_metric: metric, p_days: days }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useYoyComparison(year?: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['yoy-comparison', year, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const params: Record<string, unknown> = {};
      if (year) params.p_year = year;
      const { data, error } = await callExternalRpc<Array<Record<string, unknown>>>(
        'get_yoy_comparison', params
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useConversionFunnel(days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversion-funnel', days, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ConversionFunnel[]>(
        'get_conversion_funnel', { p_days: days }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useParetoCustomers() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['pareto-customers', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ParetoCustomer[]>(
        'get_pareto_customers', {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useMonthlyReport(year: number, month: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['monthly-report', year, month, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Record<string, unknown>>(
        'generate_monthly_report', { p_year: year, p_month: month }
      );
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000,
  });
}

export function useTrendAnalysis(months = 6) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['trend-analysis', months, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<TrendData[]>(
        'get_trend_analysis', { p_months: months }
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useLossReasonAnalysis() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['loss-reason-analysis', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<LossReasonData[]>(
        'get_loss_reason_analysis', {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useIndustryAnalysis() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['industry-analysis', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<IndustryAnalysis[]>(
        'get_industry_analysis', {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useChannelAnalysis() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['channel-analysis', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ChannelAnalysis[]>(
        'get_channel_analysis', {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });
}

export function useChurnRiskReport() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['churn-risk-report', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Array<Record<string, unknown>>>(
        'get_churn_risk_report', {}
      );
      if (error) throw error;
      return data || [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function useDailyInsights() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['daily-insights', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await callExternalRpc<Record<string, unknown>>(
        'generate_daily_insights', {}
      );
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });
}
