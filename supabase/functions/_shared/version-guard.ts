/**
 * Version Guard — helper compartilhado para optimistic locking.
 *
 * Padroniza a resposta HTTP 409 (`CONCURRENT_EDIT`) emitida quando uma operação
 * `update_with_version` falha por divergência de versão. Garante payload JSON
 * uniforme para que o frontend (`ConcurrentEditError` em `src/lib/externalData.ts`)
 * reconheça o erro via campo `error: "CONCURRENT_EDIT"` independente da tabela
 * ou edge function que o emitiu.
 *
 * Uso:
 *   const rows = Array.isArray(data) ? data : [];
 *   const guard = assertVersionMatch(rows, { entity: table, id, attemptedVersion: version, req });
 *   if (guard) return guard; // já devolve 409 padronizado
 *   return jsonOk({ data: rows[0] }, req);
 */
import { jsonConflict } from "./auth.ts";

export interface VersionGuardOptions {
  entity: string;
  id: string;
  attemptedVersion: number;
  req: Request;
  traceId?: string;
}

/**
 * Devolve `null` se o UPDATE conditional retornou ao menos 1 linha (versão bateu).
 * Devolve uma `Response` 409 padronizada (JSON estruturado) se nenhuma linha foi
 * afetada (conflito) ou se `rows` for nulo/inválido (defensivo).
 */
export function assertVersionMatch(
  rows: unknown,
  opts: VersionGuardOptions,
): Response | null {
  if (Array.isArray(rows) && rows.length > 0) return null;
  return jsonConflict(
    {
      entity: opts.entity,
      id: opts.id,
      attemptedVersion: opts.attemptedVersion,
      traceId: opts.traceId,
    },
    opts.req,
  );
}
