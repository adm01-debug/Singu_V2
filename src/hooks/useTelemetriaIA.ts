import { useQuery } from '@tanstack/react-query';
import { callExternalRpc } from '@/lib/externalData';

export interface TotaisGateway {
  requests: number;
  errors: number;
  error_rate_pct: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  tokens_in: number;
  tokens_out: number;
}

export interface LinhaFuncaoGateway {
  function_name: string;
  requests: number;
  errors: number;
  error_rate_pct: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  last_seen: string | null;
}

export interface LinhaModeloGateway {
  model: string;
  requests: number;
  errors: number;
  error_rate_pct: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  tokens_in: number;
  tokens_out: number;
}

export interface CelulaHeatmapGateway {
  dow: number;
  hour: number;
  requests: number;
  errors: number;
  error_rate_pct: number | null;
}

export interface SaudeGateway {
  window_hours: number;
  computed_at: string;
  totals: TotaisGateway;
  by_function: LinhaFuncaoGateway[];
  by_model: LinhaModeloGateway[];
  active_alerts: Record<string, unknown>[];
  error_heatmap: CelulaHeatmapGateway[];
  resolved_mttr: Record<string, unknown>[];
  worst_windows: Record<string, unknown>[];
  resolved_recent: Record<string, unknown>[];
}

export interface ParticaoGateway {
  partition_name: string;
  range_start: string;
  range_end: string;
  estimated_rows: number;
  total_bytes: number;
  min_created_at: string | null;
  max_created_at: string | null;
  is_current: boolean;
  is_future: boolean;
  is_expiring: boolean;
}

export const JANELAS_TELEMETRIA = [
  { valor: '1', label: 'Última hora', horas: 1 },
  { valor: '24', label: 'Últimas 24 h', horas: 24 },
  { valor: '168', label: 'Últimos 7 dias', horas: 168 },
  { valor: '720', label: 'Últimos 30 dias', horas: 720 },
] as const;

export function useSaudeGatewayIA(horas: number) {
  return useQuery({
    queryKey: ['telemetria-ia-saude', horas],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<SaudeGateway>('get_ai_gateway_health', { _hours: horas });
      if (error) throw error;
      if (!data) throw new Error('A telemetria não devolveu dados.');
      return data;
    },
    staleTime: 60_000,
  });
}

export function useParticoesGatewayIA() {
  return useQuery({
    queryKey: ['telemetria-ia-particoes'],
    queryFn: async () => {
      const { data, error } = await callExternalRpc<ParticaoGateway[]>('get_ai_gateway_partition_stats', {});
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}