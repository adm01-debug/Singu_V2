import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { isServiceRoleCaller, jsonError, withAuthOrServiceRole } from "./auth.ts";

export async function resolveValidationOwner(
  req: Request,
  requestedUserId: string | undefined,
  contactId: string | null | undefined,
): Promise<{ userId: string; admin: SupabaseClient } | Response> {
  const caller = await withAuthOrServiceRole(req);
  if (caller instanceof Response) return caller;

  if (isServiceRoleCaller(caller) && !requestedUserId) {
    return jsonError("Destinatário obrigatório", 400, req);
  }
  const userId = isServiceRoleCaller(caller) ? requestedUserId! : caller;
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (contactId) {
    const { data, error } = await admin.from("contacts")
      .select("id").eq("id", contactId).eq("user_id", userId)
      .abortSignal(AbortSignal.timeout(5_000)).maybeSingle();
    if (error) return jsonError("Consulta do proprietário indisponível", 503, req);
    if (!data) return jsonError("Contato não pertence ao usuário", 403, req);
  }

  return { userId, admin };
}
