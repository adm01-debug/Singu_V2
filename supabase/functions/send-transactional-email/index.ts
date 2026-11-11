// Envio de e-mail transacional via Resend. Chamado só internamente (service role) pelo
// sequence-processor; responde { ok: true, messageId } apenas quando o Resend aceita o envio.
import { handleCorsAndMethod, withAuthOrServiceRole, isServiceRoleCaller, jsonError, jsonOk, guardBody } from "../_shared/auth.ts";
import { validate } from "../_shared/validate.ts";
import { fetchAPI } from "../_shared/fetch-utils.ts";

const RESEND_URL = "https://api.resend.com/emails";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

Deno.serve(async (req) => {
  const guard = handleCorsAndMethod(req);
  if (guard) return guard;

  const auth = await withAuthOrServiceRole(req);
  if (auth instanceof Response) return auth;
  if (!isServiceRoleCaller(auth)) return jsonError("Forbidden", 403, req);

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY não configurada");
    return jsonError("Email provider not configured", 503, req);
  }

  const { body: raw, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;
  const v = validate(raw, {
    templateName: { type: "string", required: true, maxLength: 64 },
    recipientEmail: { type: "string", required: true, maxLength: 320, pattern: /^[^\s@]{1,64}@[\w.-]{1,252}\.[a-z]{2,24}$/i },
    idempotencyKey: { type: "string", required: true, maxLength: 256 },
    templateData: { type: "object", required: true },
  });
  if (!v.ok) return jsonError(v.error, 400, req);

  const { recipientEmail, idempotencyKey, templateData } = v.data as {
    recipientEmail: string;
    idempotencyKey: string;
    templateData: { subject?: unknown; body?: unknown };
  };
  const subject = typeof templateData.subject === "string" && templateData.subject.trim() ? templateData.subject.slice(0, 300) : "Mensagem";
  const text = typeof templateData.body === "string" ? templateData.body : "";
  if (!text.trim()) return jsonError("templateData.body vazio", 400, req);

  const res = await fetchAPI(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // o Resend devolve o mesmo envio para a mesma chave em 24 h: retentativas não duplicam o e-mail
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      from: Deno.env.get("RESEND_FROM") || "Promo Brindes <no-reply@promobrindes.com.br>",
      to: [recipientEmail],
      subject,
      text,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;white-space:pre-wrap">${escapeHtml(text)}</div>`,
    }),
  });

  const result = await res.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!res.ok || !result?.id) {
    console.error("Resend recusou o envio:", res.status, result?.message ?? "");
    return jsonError(`Resend ${res.status}: ${result?.message ?? "sem detalhe"}`, 502, req);
  }
  return jsonOk({ ok: true, messageId: result.id }, req);
});
