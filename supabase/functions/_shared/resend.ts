// Envio pela API do Resend. `idempotencyKey` faz o Resend devolver o mesmo envio por 24 h em
// vez de mandar outro e-mail (retentativas e execuções repetidas não duplicam).
import { fetchAPI } from "./fetch-utils.ts";

export interface ResendEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  idempotencyKey: string;
}

export async function sendResendEmail(email: ResendEmail): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY não configurada" };
  const res = await fetchAPI("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": email.idempotencyKey },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "Promo Brindes <no-reply@promobrindes.com.br>",
      to: [email.to],
      subject: email.subject,
      html: email.html,
      ...(email.text ? { text: email.text } : {}),
    }),
  });
  const body = await res.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!res.ok || !body?.id) return { ok: false, error: `Resend ${res.status}: ${body?.message ?? "sem detalhe"}` };
  return { ok: true, id: body.id };
}
