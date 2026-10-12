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
  const { error: claimError } = await client.from("notification_logs")
    .insert({ ...delivery, delivery_status: "pending" });
  if (claimError?.code === "23505") return "skipped";
  if (claimError) throw new Error("Não foi possível reservar a entrega", { cause: claimError });

  let response: Response;
  try {
    response = await send();
  } catch (error) {
    await bestEffortWrite(client.from("notification_logs")
      .update({ delivery_status: "unknown" })
      .eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel).eq("user_id", delivery.user_id),
      "Falha ao registrar entrega sem confirmação:");
    throw error;
  }

  const { error: statusError } = await client.from("notification_logs")
    .update({ delivery_status: response.ok ? "sent" : "unknown", ...(response.ok ? { sent_at: new Date().toISOString() } : {}) })
    .eq("reminder_id", delivery.reminder_id).eq("channel", delivery.channel).eq("user_id", delivery.user_id);
  if (statusError) throw new Error("Não foi possível confirmar a entrega", { cause: statusError });
  if (!response.ok) throw new Error(`Entrega sem confirmação: HTTP ${response.status}`);
  return "sent";
}
