import { GLOBAL_READ_ONLY_TABLES, USER_RLS_READ_ONLY_TABLES, isAllowedRpc, isAllowedTable } from "./tables.ts";
import { getExternalClient, getUserScopedClient, hasAdminRole, hasRelationAccess } from "./database.ts";
import { handleMutation } from "./mutations.ts";
import { withAuthOrServiceRole, jsonError, jsonOk, handleCorsAndMethod, guardBody, isServiceRoleCaller } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import {
  enforceTenantIdentity,
  extractRelationId,
  getRelationScope,
  isSafeIdentifier,
  MAX_QUERY_FILTERS,
  parseQueryOrder,
} from "../_shared/tenant-guard.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";
import { isAllowedSelectProjection } from "../_shared/select-projection.ts";
import { buildSearchFilter, SearchFilterInputError } from "../_shared/search-filter.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 100, message: "Rate limit exceeded for external data. Please wait." });

const MAX_PAGE_SIZE = 500;
const DEFAULT_PAGE_SIZE = 50;

function clampRange(range?: { from: number; to: number }): { from: number; to: number } {
  const from = Math.max(0, range?.from ?? 0);
  const to = Math.min(range?.to ?? from + DEFAULT_PAGE_SIZE - 1, from + MAX_PAGE_SIZE - 1);
  return { from, to };
}

async function withRetry<T>(fn: () => Promise<T>, retries = 1): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries && lastError.message.includes('statement timeout')) {
        await new Promise(r => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

// eslint-disable-next-line sonarjs/cognitive-complexity
Deno.serve(async (req) => {
  const corsResponse = handleCorsAndMethod(req);
  if (corsResponse) return corsResponse;

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "external-data");

  const authResult = await withAuthOrServiceRole(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const isSvc = isServiceRoleCaller(userId);
  if (!isSvc) {
    const limited = limiter.check(userId, req);
    if (limited) return limited;
  }

  const startTime = performance.now();

  const { body: rawBody, error: bodyError } = await guardBody(req, 128 * 1024);
  if (bodyError) return bodyError;

  try {
    const body = rawBody as Record<string, unknown>;

    const action = typeof body.action === 'string' ? body.action : undefined;
    const table = typeof body.table === 'string' ? body.table : undefined;
    const operation = action || 'select';

    log.info("request_received", { method: req.method, action: operation, table });

    // ─── WHOAMI (debug — exposes only the external DB host, never keys) ───
    if (operation === 'whoami') {
      if (!isSvc) return jsonError('Service role required', 403, req);
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL') || '';
      let host = '';
      let ref = '';
      try {
        const u = new URL(extUrl);
        host = u.host;
        ref = u.host.split('.')[0] || '';
      } catch {
        host = 'INVALID_URL';
      }
      const hasKey = !!Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY');
      return jsonOk({ host, ref, hasServiceRoleKey: hasKey }, req);
    }

    // ─── LIST TABLES (schema discovery) ───
    if (operation === 'list_tables') {
      if (!isSvc) return jsonError('Service role required', 403, req);
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetchAPI(`${extUrl}/rest/v1/`, {
        headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
      });
      const swagger = await resp.json();
      const tableNames = swagger?.definitions
        ? Object.keys(swagger.definitions)
        : swagger?.paths
          ? Object.keys(swagger.paths).map((p: string) => p.replace('/', ''))
          : [];
      return jsonOk({ tables: tableNames }, req);
    }

    // ─── FULL SCHEMA INTROSPECTION ───
    if (operation === 'schema') {
      if (!isSvc && !await hasAdminRole(userId)) {
        return jsonError('Admin role required', 403, req);
      }
      const extUrl = Deno.env.get('EXTERNAL_SUPABASE_URL')!;
      const extKey = Deno.env.get('EXTERNAL_SUPABASE_SERVICE_ROLE_KEY')!;
      const resp = await fetchAPI(`${extUrl}/rest/v1/`, {
        headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
      });
      const swagger = await resp.json();

      const tables: Record<string, { columns: { name: string; type: string; format: string; required: boolean; description?: string }[] }> = {};

      if (swagger?.definitions) {
        for (const [tableName, def] of Object.entries(swagger.definitions)) {
          const d = def as Record<string, unknown>;
          const props = (d.properties || {}) as Record<string, Record<string, unknown>>;
          const required = (d.required || []) as string[];
          const columns = Object.entries(props).map(([colName, colDef]) => ({
            name: colName,
            type: (colDef.type as string) || (colDef.anyOf ? 'nullable' : 'unknown'),
            format: (colDef.format as string) || '',
            required: required.includes(colName),
            ...(colDef.description ? { description: colDef.description as string } : {}),
            ...(colDef.default !== undefined ? { default: colDef.default } : {}),
            ...(colDef.maxLength ? { maxLength: colDef.maxLength } : {}),
            ...(colDef.enum ? { enum: colDef.enum } : {}),
          }));
          tables[tableName] = { columns };
        }
      }

      let functions: string[] = [];
      try {
        const rpcResp = await fetchAPI(`${extUrl}/rest/v1/rpc/`, {
          headers: { 'apikey': extKey, 'Authorization': `Bearer ${extKey}` }
        });
        if (rpcResp.ok) {
          const rpcData = await rpcResp.json();
          functions = Array.isArray(rpcData) ? rpcData : Object.keys(rpcData || {});
        }
      } catch { /* ignore */ }

      return jsonOk({ tableCount: Object.keys(tables).length, tables, functions }, req);
    }

    // ─── DISTINCT VALUES (single column) ───
    if (operation === 'distinct') {
      const { column } = body;
      if (!table || !isAllowedTable(table)) return jsonError('Invalid table', 400, req);
      if (!isSafeIdentifier(column)) return jsonError('Invalid "column" for distinct', 400, req);
      if (!isSvc && getRelationScope(table)) {
        return jsonError('Relation scope required', 400, req);
      }

      const client = getExternalClient();
      let query = client
        .from(table)
        .select(column)
        .not(column, 'is', null)
        .order(column, { ascending: true })
        .limit(5000);
      if (!isSvc) query = query.eq('user_id', userId);

      const { data, error } = await query;

      if (error) throw new Error(`Distinct failed: ${error.message}`);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic DB query result shape not statically typed
      const unique = [...new Set((data as any[] || []).map((r: any) => r[column]).filter(Boolean))].sort();
      return jsonOk({ values: unique, count: unique.length }, req);
    }

    // ─── BATCH DISTINCT VALUES (multiple columns in one call) ───
    if (operation === 'batch_distinct') {
      const { columns } = body;
      if (!table || !isAllowedTable(table)) return jsonError('Invalid table', 400, req);
      if (!Array.isArray(columns) || columns.length === 0) return jsonError('Missing "columns" array for batch_distinct', 400, req);
      if (columns.length > 20) return jsonError('Max 20 columns per batch', 400, req);
      if (!columns.every(isSafeIdentifier)) return jsonError('Invalid column in batch_distinct', 400, req);
      if (!isSvc && getRelationScope(table)) {
        return jsonError('Relation scope required', 400, req);
      }

      const client = getExternalClient();
      const results: Record<string, string[]> = {};

      // Run all distinct queries in parallel
      const promises = columns.map(async (col: string) => {
        try {
          let query = client
            .from(table)
            .select(col)
            .not(col, 'is', null)
            .order(col, { ascending: true })
            .limit(5000);
          if (!isSvc) query = query.eq('user_id', userId);
          const { data, error } = await query;
          if (error) {
            log.warn("batch_distinct column failed", { col, error: error.message });
            return { col, values: [] };
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic DB query result shape not statically typed
          const unique = [...new Set((data as any[] || []).map((r: any) => r[col]).filter(Boolean))].sort();
          return { col, values: unique };
        } catch (err) {
          log.warn("batch_distinct column threw", { col, error: err instanceof Error ? err.message : String(err) });
          return { col, values: [] };
        }
      });

      const settled = await Promise.all(promises);
      for (const { col, values } of settled) {
        results[col] = values;
      }

      return jsonOk({ results }, req);
    }

    const client = getExternalClient();
    // ─── RPC (call external database functions) — must run BEFORE table validation ───
    if (operation === 'rpc') {
      const functionName = typeof body.functionName === 'string' ? body.functionName : undefined;
      if (!functionName || !isAllowedRpc(functionName)) {
        return jsonError(`Invalid or disallowed RPC: "${functionName}"`, 400, req);
      }

      const rawParams = (body.params && typeof body.params === 'object') ? body.params : {};
      const params = isSvc ? rawParams : enforceTenantIdentity(rawParams, userId);
      const rpcClient = isSvc ? client : getUserScopedClient(req.headers.get('Authorization') ?? '');
      if (!rpcClient) {
        log.error("RPC user client unavailable", { rpc: functionName });
        return jsonError('RPC unavailable for user sessions', 503, req);
      }

      const { data, error } = await rpcClient.rpc(functionName, params as Record<string, unknown>);
      if (error) {
        log.warn("RPC failed", { rpc: functionName, error: error.message });
        return jsonOk({ data: null, error: `RPC ${functionName} failed`, errorCode: error.code }, req);
      }
      return jsonOk({ data }, req);
    }

    // ─── Table validation (for non-RPC actions) ───
    if (!table || typeof table !== 'string' || !isAllowedTable(table)) {
      return jsonError(`Invalid table "${table}". Only allowed tables are permitted.`, 400, req);
    }
    if (GLOBAL_READ_ONLY_TABLES.has(table) && operation !== 'select') {
      return jsonError('Global metrics are read-only', 405, req);
    }
    if (!isSvc && USER_RLS_READ_ONLY_TABLES.has(table) && operation !== 'select') {
      return jsonError('O legado comercial aceita somente leitura nesta sessão', 405, req);
    }

    // ─── SELECT (read) ───
    if (operation === 'select') {
      if (!isSvc && GLOBAL_READ_ONLY_TABLES.has(table) && !await hasAdminRole(userId)) {
        return jsonError('Admin role required', 403, req);
      }
      const { filters, select, order, range, search, countMethod } = body;
      const relationScope = getRelationScope(table);
      if (!isSvc && relationScope) {
        const relationId = extractRelationId(filters, relationScope.foreignKey);
        if (!relationId) return jsonError(`${relationScope.foreignKey} scope required`, 400, req);
        if (!await hasRelationAccess(client, relationScope, relationId, userId)) {
          return jsonError('Forbidden', 403, req);
        }
      }
      const selectedColumns = typeof select === 'string' ? select : '*';
      if (!isAllowedSelectProjection(selectedColumns, relation =>
        !GLOBAL_READ_ONLY_TABLES.has(table) && isAllowedTable(relation) && !GLOBAL_READ_ONLY_TABLES.has(relation))) {
        return jsonError('Projeção de consulta inválida ou relação não permitida', 400, req);
      }
      const searchConfig = search && typeof search === 'object'
        ? search as Record<string, unknown>
        : undefined;
      const searchColumns = Array.isArray(searchConfig?.columns)
        ? searchConfig.columns.slice(0, 10)
        : [];
      if (!searchColumns.every(isSafeIdentifier)) {
        return jsonError('Invalid search column', 400, req);
      }
      const orderConfigs = parseQueryOrder(order);
      if (orderConfigs === null) {
        return jsonError('Invalid order column', 400, req);
      }
      const rangeConfig = range && typeof range === 'object'
        ? range as { from: number; to: number }
        : undefined;
      const readClient = isSvc || GLOBAL_READ_ONLY_TABLES.has(table)
        ? client
        : getUserScopedClient(req.headers.get('Authorization') ?? '');
      if (!readClient) {
        return jsonError('User-scoped database unavailable', 503, req);
      }

      const result = await withRetry(async () => {
        const countMode = countMethod === null ? undefined : countMethod === 'planned' ? 'planned' : 'exact';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TS2589 deep type instantiation with dynamic Supabase queries
        let query: any = readClient.from(table).select(selectedColumns, { count: countMode });
        if (!isSvc && !GLOBAL_READ_ONLY_TABLES.has(table) && !USER_RLS_READ_ONLY_TABLES.has(table) && !relationScope) {
          query = query.eq('user_id', userId);
        }

        if (
          typeof searchConfig?.term === 'string' &&
          searchConfig.term.trim() &&
          searchColumns.length > 0
        ) {
          query = query.or(buildSearchFilter(searchConfig.term, searchColumns, searchConfig.matchAllTerms === true));
        }

        // Allowlist of safe PostgREST filter methods — prevents method injection
        const ALLOWED_FILTER_TYPES = new Set([
          'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
          'like', 'ilike', 'is', 'in',
          'contains', 'overlaps', 'textSearch',
        ]);

        if (Array.isArray(filters)) {
          const cappedFilters = filters.slice(0, MAX_QUERY_FILTERS);
          for (const f of cappedFilters) {
            if (!f.column || !f.type) continue;
            if (!isSafeIdentifier(f.column)) {
              log.warn("skipping filter with invalid column", { column: f.column });
              continue;
            }
            if (!ALLOWED_FILTER_TYPES.has(f.type)) {
              log.warn("skipping filter with disallowed type", { type: f.type });
              continue;
            }
            // Guard: skip filters with non-primitive values (objects/arrays except for 'in')
            if (f.type !== 'in' && typeof f.value === 'object' && f.value !== null) {
              log.warn("skipping filter with object value", { column: f.column, type: f.type });
              continue;
            }
            const fn = query[f.type];
            if (typeof fn === 'function') {
              query = fn.call(query, f.column, f.value);
            }
          }
        }

        for (const orderConfig of orderConfigs) {
          query = query.order(orderConfig.column, { ascending: orderConfig.ascending });
        }
        const clamped = clampRange(rangeConfig);
        query = query.range(clamped.from, clamped.to);

        const { data, error, count } = await query as unknown as { data: unknown[]; error: { message: string } | null; count: number };
        if (error) throw new Error(`Select failed: ${error.message}`);
        return { data: data || [], count };
      });

      const elapsed = Math.round(performance.now() - startTime);
      if (elapsed > 5000) {
        log.warn("slow query", { table, elapsed_ms: elapsed });
      }

      return jsonOk(result, req);
    }

    const userWrite = !isSvc && ['insert', 'update', 'update_with_version', 'delete'].includes(operation);
    const writeClient = userWrite ? getUserScopedClient(req.headers.get('Authorization') ?? '') : client;
    if (!writeClient) return jsonError('User-scoped database unavailable', 503, req);
    return await handleMutation({ operation, body, table, client: writeClient, req, userId, isSvc, log });

  } catch (error) {
    if (error instanceof SearchFilterInputError) return jsonError(error.message, 400, req);
    const elapsed = Math.round(performance.now() - startTime);
    const message = error instanceof Error ? error.message : String(error);
    return jsonError(`Handler error: ${message} [t=${elapsed}ms]`, 500, req);
  }
});
