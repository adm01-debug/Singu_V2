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
});

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

    const { email, contactId, persist, userId } = parsed.data;
    const owner = await resolveValidationOwner(req, userId, contactId);
    if (owner instanceof Response) return owner;
    const result = await verifyEmail(email);

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
