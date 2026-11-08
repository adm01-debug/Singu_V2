import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { bestEffortWrite } from "./best-effort-write.ts";

interface Delivery {
  reminder_id: string;
  contact_id: string;
  user_id: string;
  channel: "whatsapp";
}

export async function sendTrackedNotification(
  client: SupabaseClient,
  delivery: Delivery,
  send: () => Promise<Response>,
): Promise<"sent" | "skipped"> {
  const claim = { delivery_status: "pending", claim_token: crypto.randomUUID(), claim_expires_at: new Date(Date.now() + 15 * 60_000).toISOString() };
  const { error: claimError } = await client.from("notification_logs")
    .insert({ ...delivery, ...claim });
  if (claimError?.code === "23505") {
    const { data: existing, error: existingError } = await client.from("notification_logs")
      .select("delivery_status").eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel)
      .eq("user_id", delivery.user_id).maybeSingle();
    if (existingError) throw new Error("Não foi possível conferir a entrega existente", { cause: existingError });
    if (existing?.delivery_status !== "rejected") return "skipped";
    const { data: reclaimed, error: reclaimError } = await client.from("notification_logs")
      .update(claim).eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel)
      .eq("user_id", delivery.user_id).eq("delivery_status", "rejected").select("id").maybeSingle();
    if (reclaimError) throw new Error("Não foi possível reservar a nova tentativa", { cause: reclaimError });
    if (!reclaimed) return "skipped";
  } else if (claimError) throw new Error("Não foi possível reservar a entrega", { cause: claimError });

  let response: Response;
  try {
    response = await send();
  } catch (error) {
    await bestEffortWrite(client.from("notification_logs")
      .update({ delivery_status: "unknown" })
      .eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel).eq("user_id", delivery.user_id)
      .eq("claim_token", claim.claim_token),
      "Falha ao registrar entrega sem confirmação:");
    throw error;
  }

  if ([400, 401, 403, 404, 405, 413, 415, 422, 429].includes(response.status)) {
    const { data: rejected, error: rejectionError } = await client.from("notification_logs")
      .update({ delivery_status: "rejected" }).eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel)
      .eq("user_id", delivery.user_id).eq("claim_token", claim.claim_token).select("id").maybeSingle();
    if (rejectionError || !rejected) throw new Error("Não foi possível registrar a rejeição da entrega", { cause: rejectionError });
    throw new Error(`Entrega rejeitada: HTTP ${response.status}`);
  }

  const { data: confirmed, error: statusError } = await client.from("notification_logs")
    .update({ delivery_status: response.ok ? "sent" : "unknown", ...(response.ok ? { sent_at: new Date().toISOString() } : {}) })
    .eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel).eq("user_id", delivery.user_id)
    .eq("claim_token", claim.claim_token).select("id").maybeSingle();
  if (statusError || !confirmed) throw new Error("Não foi possível confirmar a entrega", { cause: statusError });
  if (!response.ok) throw new Error(`Entrega sem confirmação: HTTP ${response.status}`);
  return "sent";
}
