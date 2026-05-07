import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";
import { getCircuitBreaker, CircuitOpenError } from "@/lib/circuitBreaker";

interface ExternalQueryOptions {
  table: string;
  select?: string;
  filters?: Array<{
    type: 'eq' | 'ilike' | 'in' | 'neq' | 'is';
    column: string;
    value: unknown;
  }>;
  search?: {
    term: string;
    columns: string[];
  };
  order?: {
    column: string;
    ascending?: boolean;
  };
  range?: {
    from: number;
    to: number;
  };
  /** Use 'planned' for faster approximate counts */
  countMethod?: 'exact' | 'planned';
}

// Cached auth token to avoid calling getSession() on every request
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null;
  _tokenExpiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
});

async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 30_000) {
    return _cachedToken;
  }
  const { data } = await supabase.auth.getSession();
  _cachedToken = data?.session?.access_token ?? null;
  _tokenExpiresAt = data?.session?.expires_at ? data.session.expires_at * 1000 : 0;
  return _cachedToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-data`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const externalDbBreaker = getCircuitBreaker('external-db', {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
});

async function callExternalData(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  return externalDbBreaker.call(async () => {
    const accessToken = await getAccessToken();

    const response = await fetch(EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 409 vem como JSON estruturado { error: "CONCURRENT_EDIT", entity, id, attemptedVersion, traceId }
      // Preserva o JSON cru na mensagem para o caller parsear (ver updateExternalDataWithVersion).
      throw new Error(`Edge function error [${response.status}]: ${errorText}`);
    }

    const result = await response.json();
    if (result?.error) {
      // Soft fallback from upstream gateway failures — degrade gracefully without tripping breaker
      if (result?.fallback === true) {
        logger.warn('External data fallback:', result.error);
        return result;
      }
      throw new Error(result.error);
    }

    return result;
  });
}

export { CircuitOpenError };

export async function queryExternalData<T = Record<string, unknown>>(options: ExternalQueryOptions): Promise<{ data: T[] | null; count: number | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'select', ...options });
    return { data: (result?.data as T[]) || [], count: (result?.count as number) || 0, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error querying external data:', { error: msg });
    return { data: null, count: null, error: err as Error };
  }
}

export async function insertExternalData<T = Record<string, unknown>>(table: string, record: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'insert', table, record });
    return { data: (result?.data as T) || null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error inserting external data:', { error: msg });
    return { data: null, error: err as Error };
  }
}

export async function updateExternalData<T = Record<string, unknown>>(table: string, id: string, updates: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'update', table, id, updates });
    return { data: (result?.data as T) || null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error updating external data:', { error: msg });
    return { data: null, error: err as Error };
  }
}

/** Sentinela emitida quando um UPDATE versionado falha por edição concorrente. */
export class ConcurrentEditError extends Error {
  constructor(
    public readonly table: string,
    public readonly id: string,
    public readonly attemptedVersion?: number,
    public readonly traceId?: string,
  ) {
    super('CONCURRENT_EDIT');
    this.name = 'ConcurrentEditError';
  }
}

/**
 * Tenta extrair payload JSON estruturado de erro 409 da edge function.
 * Mantém retrocompat com mensagem string legada (`CONCURRENT_EDIT entity=... id=...`).
 */
function parseConcurrentEditPayload(msg: string, fallbackTable: string, fallbackId: string): {
  table: string; id: string; attemptedVersion?: number; traceId?: string;
} {
  // Formato novo: "Edge function error [409]: {"error":"CONCURRENT_EDIT","entity":"...","id":"...",...}"
  const jsonMatch = msg.match(/\{.*"error"\s*:\s*"CONCURRENT_EDIT".*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        table: parsed.entity ?? fallbackTable,
        id: parsed.id ?? fallbackId,
        attemptedVersion: typeof parsed.attemptedVersion === 'number' ? parsed.attemptedVersion : undefined,
        traceId: typeof parsed.traceId === 'string' ? parsed.traceId : undefined,
      };
    } catch {
      // fall through para retrocompat
    }
  }
  return { table: fallbackTable, id: fallbackId };
}

/**
 * UPDATE versionado (optimistic locking).
 * Lança {@link ConcurrentEditError} quando a versão informada já não corresponde
 * ao estado atual do registro (HTTP 409 do edge function).
 */
export async function updateExternalDataWithVersion<T = Record<string, unknown>>(
  table: string,
  id: string,
  version: number,
  updates: Record<string, unknown>,
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'update_with_version', table, id, version, updates });
    return { data: (result?.data as T) || null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/\b409\b/.test(msg) || /CONCURRENT_EDIT/i.test(msg)) {
      const parsed = parseConcurrentEditPayload(msg, table, id);
      return {
        data: null,
        error: new ConcurrentEditError(parsed.table, parsed.id, parsed.attemptedVersion, parsed.traceId),
      };
    }
    const msgFinal = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error updating external data with version:', { error: msgFinal });
    return { data: null, error: err as Error };
  }
}

export async function deleteExternalData(table: string, id: string): Promise<{ success: boolean; error: Error | null }> {
  try {
    await callExternalData({ action: 'delete', table, id });
    return { success: true, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error deleting external data:', { error: msg });
    return { success: false, error: err as Error };
  }
}

/** Call an RPC (database function) on the external database */
export async function callExternalRpc<T = unknown>(
  functionName: string,
  params: Record<string, unknown> = {}
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'rpc', functionName, params });
    return { data: (result?.data as T) ?? null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Error calling external RPC ${functionName}:`, { error: msg });
    return { data: null, error: err as Error };
  }
}
