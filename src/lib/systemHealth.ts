import { FunctionsHttpError } from '@supabase/supabase-js';

export interface ComponentCheck {
  status: 'up' | 'degraded' | 'down' | 'not_configured';
  latency_ms?: number;
  error?: string;
  last_activity?: string;
  details?: string;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unavailable';
  timestamp: string;
  total_latency_ms: number;
  components: Record<string, ComponentCheck>;
  alerts_count: number | null;
}

function isHealthResponse(value: unknown): value is HealthResponse {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    ['healthy', 'degraded', 'unhealthy', 'unavailable'].includes(String(candidate.status)) &&
    typeof candidate.components === 'object' &&
    candidate.components !== null
  );
}

export async function resolveHealthResponse(
  data: unknown,
  error: unknown,
): Promise<HealthResponse> {
  if (isHealthResponse(data)) return data;

  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const payload: unknown = await error.context.clone().json().catch(() => null);
    if (isHealthResponse(payload)) return payload;
  }

  if (error instanceof Error) throw error;
  throw new Error('Resposta de saúde indisponível');
}
