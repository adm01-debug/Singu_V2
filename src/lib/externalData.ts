import { supabase } from '@/integrations/supabase/client';
import { logger } from "@/lib/logger";
import { getCircuitBreaker, CircuitOpenError } from "@/lib/circuitBreaker";
import { z } from 'zod';

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
  } | Array<{ column: string; ascending?: boolean }>;
  range?: {
    from: number;
    to: number;
  };
  /** Use 'planned' for faster approximate counts */
  countMethod?: 'exact' | 'planned' | null;
  auditAccess?: boolean;
  /** AbortSignal to cancel the underlying fetch; does not trip the circuit breaker. */
  signal?: AbortSignal;
}

// Cached auth token to avoid calling getSession() on every request
let _cachedToken: string | null = null;
let _cachedUserId: string | null = null;
let _tokenExpiresAt = 0;

supabase.auth.onAuthStateChange((_event, session) => {
  _cachedToken = session?.access_token ?? null;
  _cachedUserId = session?.user?.id ?? null;
  _tokenExpiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
});

async function getAccessToken(): Promise<{ token: string; userId: string | null }> {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 30_000) {
    return { token: _cachedToken, userId: _cachedUserId };
  }
  const { data } = await supabase.auth.getSession();
  _cachedToken = data?.session?.access_token ?? null;
  _cachedUserId = data?.session?.user?.id ?? null;
  _tokenExpiresAt = data?.session?.expires_at ? data.session.expires_at * 1000 : 0;
  return { token: _cachedToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, userId: _cachedUserId };
}

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-data`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const CANONICAL_RPCS = new Set(['persist_rfm_analysis', 'persist_company_composite', 'enroll_sequence_contact', 'confirm_sequence_manual_step']);

const externalDbBreaker = getCircuitBreaker('external-db', {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
});

const canonicalDbBreaker = getCircuitBreaker('canonical-db', {
  failureThreshold: 3,
  resetTimeoutMs: 30_000,
});

const isAbortError = (e: unknown) => e instanceof Error && e.name === 'AbortError';

class ExternalDataClientError extends Error {}
class CanonicalRpcClientError extends ExternalDataClientError {}

const externalResponseSchema = z.object({
  error: z.string().nullish(),
  errorCode: z.string().optional(),
  fallback: z.boolean().optional(),
  data: z.unknown().optional(),
  count: z.number().int().nonnegative().nullable().optional(),
});

async function callExternalData(body: Record<string, unknown>, signal?: AbortSignal, canonicalRpc?: { functionName: string; params: Record<string, unknown> }, onRequestIdentity?: (userId: string | null) => void): Promise<z.infer<typeof externalResponseSchema>> {
  const breaker = canonicalRpc ? canonicalDbBreaker : externalDbBreaker;
  return breaker.call(async () => {
    const { token: accessToken, userId } = await getAccessToken();
    onRequestIdentity?.(userId);
    if (canonicalRpc && accessToken === ANON_KEY) throw new CanonicalRpcClientError('Autenticação necessária para a RPC do banco');
    const endpoint = canonicalRpc
      ? new URL(`/rest/v1/rpc/${encodeURIComponent(canonicalRpc.functionName)}`, import.meta.env.VITE_SUPABASE_URL).href
      : EDGE_URL;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'apikey': ANON_KEY,
      },
      body: JSON.stringify(canonicalRpc ? canonicalRpc.params : body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      if (canonicalRpc) {
        const message = `RPC do banco [${response.status}]: ${errorText}`;
        if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) throw new CanonicalRpcClientError(message);
        throw new Error(message);
      }
      // 409 vem como JSON estruturado { error: "CONCURRENT_EDIT", entity, id, attemptedVersion, traceId }
      // Preserva o JSON cru na mensagem para o caller parsear (ver updateExternalDataWithVersion).
      const message = `Edge function error [${response.status}]: ${errorText}`;
      if (response.status >= 400 && response.status < 500 && ![408, 429].includes(response.status)) throw new ExternalDataClientError(message);
      throw new Error(message);
    }

    if (canonicalRpc) {
      const data: unknown = await response.json();
      return { data };
    }
    const result = externalResponseSchema.parse(await response.json());
    if (result.fallback === true) {
      throw new Error(result.error || 'A fonte externa está indisponível; tente novamente');
    }
    if (result.error != null) {
      if (typeof body.functionName === 'string' && result.errorCode &&
        /^(22|23|42|P0001|PGRST[12])/.test(result.errorCode)) {
        throw new ExternalDataClientError(result.error);
      }
      throw new Error(result.error);
    }

    return result;
  }, error => isAbortError(error) || error instanceof ExternalDataClientError
    || error instanceof z.ZodError || error instanceof SyntaxError);
}

export { CircuitOpenError };

async function waitForOptionalAudit(task: Promise<void>): Promise<void> {
  let auditTimeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([task, new Promise<void>(resolve => {
      auditTimeout = setTimeout(resolve, 5000);
    })]);
  } finally {
    clearTimeout(auditTimeout);
  }
}

export async function queryExternalData<T = Record<string, unknown>>(options: ExternalQueryOptions): Promise<{ data: T[] | null; count: number | null; error: Error | null }> {
  const { signal, auditAccess = true, ...queryOptions } = options;
  try {
    let queryUserId: string | null = null;
    const result = await callExternalData({ action: 'select', ...queryOptions }, signal, undefined, userId => { queryUserId = userId; });
    if (!Array.isArray(result.data)) throw new Error('Resposta externa inválida: data deve ser uma lista');
    if (result.count === undefined) throw new Error('Resposta externa inválida: count ausente');
    const data = result.data as T[];
    const count = result.count;

    const auditEntity = queryOptions.table === 'contacts' || queryOptions.table === 'vw_singu_contact_360'
      ? 'contact' : queryOptions.table === 'companies' ? 'company' : null;
    if (auditAccess && data.length > 0 && auditEntity) {
      await waitForOptionalAudit((async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (queryUserId && session?.user?.id === queryUserId) {
            const idColumn = queryOptions.table === 'vw_singu_contact_360' ? 'contact_id' : 'id';
            const idFilter = queryOptions.filters?.find(filter => filter.type === 'eq' && filter.column === idColumn);
            const entityId = z.string().uuid().safeParse(idFilter?.value);
            const { error: auditErr } = await supabase.from('activities').insert({
              user_id: session.user.id,
              type: `${auditEntity}_viewed`,
              entity_type: auditEntity,
              entity_id: entityId.success ? entityId.data : null,
              description: `Acesso a ${data.length} registros da tabela ${queryOptions.table}`,
              metadata: { query_options: queryOptions, record_count: data.length },
            } as never);
            if (auditErr) logger.warn('Failed to write access audit log', { error: auditErr.message });
          }
        } catch (error) {
          logger.warn('Failed to write access audit log', { error: error instanceof Error ? error.message : String(error) });
        }
      })());
    }

    return { data, count, error: null };
  } catch (err) {
    if (isAbortError(err)) return { data: null, count: null, error: err as Error };
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error querying external data:', { error: msg });
    return { data: null, count: null, error: err as Error };
  }
}

export async function insertExternalData<T = Record<string, unknown>>(table: string, record: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'insert', table, record });
    const data = (result?.data as unknown as T) || null;
    return { data, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error inserting external data:', { error: msg });
    return { data: null, error: err as Error };
  }
}

export async function updateExternalData<T = Record<string, unknown>>(table: string, id: string, updates: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
  try {
    const result = await callExternalData({ action: 'update', table, id, updates });
    const data = (result?.data as unknown as T) || null;
    return { data, error: null };
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
  // eslint-disable-next-line sonarjs/super-linear-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
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
    const data = (result?.data as unknown as T) || null;
    return { data, error: null };
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

export async function deleteExternalData(table: string, id: string, audit?: { entityName?: string; description?: string; reason?: string }): Promise<{ success: boolean; error: Error | null }> {
  try {
    let deletionUserId: string | null = null;
    await callExternalData({ action: 'delete', table, id }, undefined, undefined, userId => { deletionUserId = userId; });
    const entity = table === 'contacts' ? 'contact' : table === 'companies' ? 'company' : table === 'interactions' ? 'interaction' : null;
    if (entity) {
      const auditTask = (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (deletionUserId && session?.user?.id === deletionUserId) {
            const { error: auditErr } = await supabase.from('activities').insert({
              user_id: session.user.id,
              type: `${entity}_deleted`,
              entity_type: entity,
              entity_id: id,
              entity_name: audit?.entityName ?? null,
              description: audit?.description ?? `Exclusão de registro na tabela ${table}`,
              reason: audit?.reason ?? 'Solicitação via interface',
            });
            if (auditErr) logger.warn('Failed to write delete audit log', { error: auditErr.message });
          }
        } catch (error) {
          logger.warn('Failed to write delete audit log', { error: error instanceof Error ? error.message : String(error) });
        }
      })();
      await waitForOptionalAudit(auditTask);
    }
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
    const canonicalRpc = CANONICAL_RPCS.has(functionName) ? { functionName, params } : undefined;
    const result = await callExternalData({ action: 'rpc', functionName, params }, undefined, canonicalRpc);
    return { data: (result?.data as T) ?? null, error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Error calling external RPC ${functionName}:`, { error: msg });
    return { data: null, error: err as Error };
  }
}
