import { createClient } from "npm:@supabase/supabase-js@2";

const SERVICE_ROLE_SENTINEL = "__SERVICE_ROLE__";

export type AuditOperation =
  | "select" | "insert" | "update" | "delete" | "distinct" | "schema" | "list_tables";
export type AuditOutcome = "success" | "denied" | "error";

const auditClient = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/**
 * logAudit ? registra uma operacao de escrita (ou tentativa negada) do
 * external-data em public.external_data_audit_log. Nunca quebra a request:
 * falha de auditoria so e logada no console.
 */
export async function logAudit(
  callerUserId: string,
  table: string,
  operation: AuditOperation,
  outcome: AuditOutcome,
  payload: Record<string, unknown> | null = null,
): Promise<void> {
  try {
    const user_id = callerUserId === SERVICE_ROLE_SENTINEL ? null : callerUserId;
    const { error } = await auditClient.from("external_data_audit_log").insert({
      user_id,
      table_name: table,
      operation,
      outcome,
      payload,
    });
    if (error) {
      console.error("audit_log_insert_failed", { operation, table, outcome, error: error.message });
    }
  } catch (err) {
    console.error("audit_log_insert_failed", {
      operation,
      table,
      outcome,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
