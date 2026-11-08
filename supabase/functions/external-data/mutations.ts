import { jsonError, jsonOk } from "../_shared/auth.ts";
import { enforceTenantIdentity, getRelationScope } from "../_shared/tenant-guard.ts";
import { assertVersionMatch } from "../_shared/version-guard.ts";
import { databaseWriteError } from "../_shared/write-error.ts";
import type { tracedLogger } from "../_shared/tracing.ts";
import { getExternalClient, getRelationIdForRecord, hasRelationAccess } from "./database.ts";
import type { AllowedTable } from "./tables.ts";

type MutationContext = {
  operation: string; body: Record<string, unknown>; table: AllowedTable;
  client: ReturnType<typeof getExternalClient>; req: Request;
  userId: string; isSvc: boolean; log: ReturnType<typeof tracedLogger>;
};

async function insertRecord(context: MutationContext): Promise<Response> {
  const { body, table, client, req, userId, isSvc } = context;
  const { record } = body;
  if (!record || typeof record !== 'object') return jsonError('Missing or invalid "record" for insert', 400, req);

  // Inject user_id so records are always tenant-scoped (service role bypasses RLS — no need)
  const relationScope = getRelationScope(table);
  if (!isSvc && relationScope) {
    const relationId = (record as Record<string, unknown>)[relationScope.foreignKey];
    if (
      typeof relationId !== 'string' ||
      !await hasRelationAccess(client, relationScope, relationId, userId)
    ) {
      return jsonError('Forbidden', 403, req);
    }
  }
  const safeRecord = isSvc || relationScope
    ? (record as Record<string, unknown>)
    : {
        ...(enforceTenantIdentity(record, userId) as Record<string, unknown>),
        user_id: userId,
      };
  const { data, error } = await client.from(table).insert(safeRecord).select().single();
  if (error) return databaseWriteError(error, req);
  return jsonOk({ data }, req);
}

async function updateRecord(context: MutationContext): Promise<Response> {
  const { body, table, client, req, userId, isSvc } = context;
  const id = body.id;
  const updates = body.updates;
  if (!id || typeof id !== 'string') return jsonError('Missing or invalid "id" for update', 400, req);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) return jsonError('Invalid UUID format for "id"', 400, req);
  if (!updates || typeof updates !== 'object') return jsonError('Missing or invalid "updates" for update', 400, req);

  // user_id filter prevents updating another tenant's record (service role bypasses RLS)
  const relationScope = getRelationScope(table);
  let authorizedRelationId: string | null = null;
  if (!isSvc && relationScope) {
    const relationId = await getRelationIdForRecord(client, table, id, relationScope);
    if (
      !relationId ||
      !await hasRelationAccess(client, relationScope, relationId, userId)
    ) {
      return jsonError('Forbidden', 403, req);
    }
    const requestedRelationId = (updates as Record<string, unknown>)[relationScope.foreignKey];
    if (requestedRelationId !== undefined && requestedRelationId !== relationId) {
      return jsonError(`${relationScope.foreignKey} cannot be changed`, 400, req);
    }
    authorizedRelationId = relationId;
  }
  const safeUpdates = (
    isSvc || relationScope ? updates : enforceTenantIdentity(updates, userId)
  ) as Record<string, unknown>;
  let q = client.from(table).update(safeUpdates).eq('id', id);
  if (!isSvc && !relationScope) q = q.eq('user_id', userId);
  if (relationScope && authorizedRelationId) {
    q = q.eq(relationScope.foreignKey, authorizedRelationId);
  }
  const { data, error } = await q.select().single();
  if (error) return databaseWriteError(error, req);
  return jsonOk({ data }, req);
}

async function updateRecordWithVersion(context: MutationContext): Promise<Response> {
  const { body, table, client, req, userId, isSvc, log } = context;
  const id = typeof body.id === 'string' ? body.id : undefined;
  const version = typeof body.version === 'number' ? body.version : undefined;
  const updates = body.updates;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!id || !uuidRegex.test(id)) return jsonError('Invalid "id" for update_with_version', 400, req);
  if (version === undefined || !Number.isFinite(version)) return jsonError('Missing or invalid "version" (number) for update_with_version', 400, req);
  if (!updates || typeof updates !== 'object') return jsonError('Missing or invalid "updates" for update_with_version', 400, req);

  // Conditional update: only succeeds if version matches AND record belongs to this user.
  // O trigger incrementa version; o guard do banco serializa as relações com o pai.
  const relationScope = getRelationScope(table);
  let authorizedRelationId: string | null = null;
  if (!isSvc && relationScope) {
    const relationId = await getRelationIdForRecord(client, table, id, relationScope);
    if (
      !relationId ||
      !await hasRelationAccess(client, relationScope, relationId, userId)
    ) {
      return jsonError('Forbidden', 403, req);
    }
    const requestedRelationId = (updates as Record<string, unknown>)[relationScope.foreignKey];
    if (requestedRelationId !== undefined && requestedRelationId !== relationId) {
      return jsonError(`${relationScope.foreignKey} cannot be changed`, 400, req);
    }
    authorizedRelationId = relationId;
  }
  const safeUpdates = (
    isSvc || relationScope ? updates : enforceTenantIdentity(updates, userId)
  ) as Record<string, unknown>;
  let q = client.from(table).update(safeUpdates).eq('id', id).eq('version', version);
  if (!isSvc && !relationScope) q = q.eq('user_id', userId);
  if (relationScope && authorizedRelationId) {
    q = q.eq(relationScope.foreignKey, authorizedRelationId);
  }
  const { data, error } = await q.select();

  if (error) return databaseWriteError(error, req);

  const rows = Array.isArray(data) ? data : [];
  const conflict = assertVersionMatch(rows, { entity: table, id, attemptedVersion: version, req });
  if (conflict) {
    log.warn("concurrent_edit_detected", { table, id, attemptedVersion: version });
    return conflict;
  }
  return jsonOk({ data: rows[0] }, req);
}

async function deleteRecord(context: MutationContext): Promise<Response> {
  const { body, table, client, req, userId, isSvc } = context;
  const id = body.id;
  if (!id || typeof id !== 'string') return jsonError('Missing or invalid "id" for delete', 400, req);
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id as string)) return jsonError('Invalid UUID format for "id"', 400, req);

  // user_id filter prevents deleting another tenant's record (service role bypasses RLS)
  const relationScope = getRelationScope(table);
  let authorizedRelationId: string | null = null;
  if (!isSvc && relationScope) {
    const relationId = await getRelationIdForRecord(client, table, id, relationScope);
    if (
      !relationId ||
      !await hasRelationAccess(client, relationScope, relationId, userId)
    ) {
      return jsonError('Forbidden', 403, req);
    }
    authorizedRelationId = relationId;
  }
  let q = client.from(table).delete().eq('id', id);
  if (!isSvc && !relationScope) q = q.eq('user_id', userId);
  if (relationScope && authorizedRelationId) {
    q = q.eq(relationScope.foreignKey, authorizedRelationId);
  }
  const { data, error } = await (isSvc ? q : q.select('id'));
  if (error) return databaseWriteError(error, req);
  if (!isSvc && (!Array.isArray(data) || data.length === 0)) return jsonError('Forbidden', 403, req);
  return jsonOk({ success: true }, req);
}

export async function handleMutation(context: MutationContext): Promise<Response> {
  const { operation, req } = context;
  if (operation === 'insert') return insertRecord(context);
  if (operation === 'update') return updateRecord(context);
  if (operation === 'update_with_version') return updateRecordWithVersion(context);
  if (operation === 'delete') return deleteRecord(context);
  return jsonError(`Unknown action: ${operation}`, 400, req);
}
