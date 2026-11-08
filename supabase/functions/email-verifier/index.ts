import { z } from "npm:zod@3.23.8";
import { rateLimit } from "../_shared/rate-limit.ts";
import { verifyEmail } from "../_shared/email-verify.ts";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
import { resolveValidationOwner } from "../_shared/validation-owner.ts";


const BodySchema = z.object({
  email: z.string().email().max(255),
  contactId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional(),
  persist: z.boolean().optional().default(true),
  queueId: z.string().uuid().optional(),
  claimToken: z.string().uuid().optional(),
}).refine(body => !!body.queueId === !!body.claimToken && (!body.queueId || body.persist));

const limiter = rateLimit({ windowMs: 60_000, max: 60 });


Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const parsed = BodySchema.safeParse(rawBody);
    if (!parsed.success) return new Response(JSON.stringify({ error: parsed.error.flatten() }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const { email, contactId, persist, userId, queueId, claimToken } = parsed.data;
    const owner = await resolveValidationOwner(req, userId, contactId);
    if (owner instanceof Response) return owner;
    if (queueId && !owner.internal) return new Response(JSON.stringify({ error: "Reserva exclusiva do serviço" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    const result = await verifyEmail(email);

    if (queueId) {
      const { data, error } = await owner.admin.rpc("complete_validation_queue_item", {
        p_queue_id: queueId, p_claim_token: claimToken, p_user_id: owner.userId,
        p_contact_id: contactId ?? null, p_kind: "email", p_value: email, p_result: result,
      }).abortSignal(AbortSignal.timeout(5_000));
      if (error) return new Response(JSON.stringify({ error: "Não foi possível confirmar a validação" }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
      if (data !== queueId) return new Response(JSON.stringify({ error: "Reserva substituída" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ email, ...result, queueId, validationId: data }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (persist) {
      const { error } = await owner.admin.from("email_verifications").insert({
        user_id: owner.userId,
        contact_id: contactId ?? null,
        email,
        ...result,
        provider: "internal",
        raw: result,
      }).abortSignal(AbortSignal.timeout(5_000));
      if (error) return new Response(JSON.stringify({ error: "Não foi possível salvar a validação" }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ email, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error('email-verifier error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
