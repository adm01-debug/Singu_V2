import { z } from "npm:zod@3.23.8";
import { parsePhoneNumberFromString } from "npm:libphonenumber-js@1.11.7/max";
import { rateLimit } from "../_shared/rate-limit.ts";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
import { resolveValidationOwner } from "../_shared/validation-owner.ts";


const BodySchema = z.object({
  phone: z.string().min(5).max(30),
  defaultCountry: z.string().length(2).optional().default("BR"),
  contactId: z.string().uuid().optional().nullable(),
  userId: z.string().uuid().optional(),
  persist: z.boolean().optional().default(true),
  queueId: z.string().uuid().optional(),
  claimToken: z.string().uuid().optional(),
}).refine(body => !!body.queueId === !!body.claimToken && (!body.queueId || body.persist));

const limiter = rateLimit({ windowMs: 60_000, max: 60 });

type PhoneValidationResult = {
  status: "valid" | "invalid" | "unreachable";
  line_type: string;
  country: string | null;
  country_code: string | null;
  phone_e164: string | null;
  reasons: string[];
};

function mapType(type: string | undefined): string {
  if (!type) return "unknown";
  const t = type.toLowerCase();
  if (t.includes("mobile")) return "mobile";
  if (t.includes("fixed")) return "landline";
  if (t.includes("voip")) return "voip";
  if (t.includes("toll_free")) return "toll_free";
  if (t.includes("premium")) return "premium";
  return "unknown";
}

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

    const { phone, defaultCountry, contactId, persist, userId, queueId, claimToken } = parsed.data;
    const owner = await resolveValidationOwner(req, userId, contactId);
    if (owner instanceof Response) return owner;
    if (queueId && !owner.internal) return new Response(JSON.stringify({ error: "Reserva exclusiva do serviço" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    const reasons: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- libphonenumber-js CountryCode not re-exported from this Deno path
    const parsedPhone = parsePhoneNumberFromString(phone, defaultCountry as any);

    let result: PhoneValidationResult;
    if (!parsedPhone) {
      result = { status: "invalid", line_type: "unknown", country: null, country_code: null, phone_e164: null, reasons: ["unparseable"] };
    } else {
      const valid = parsedPhone.isValid();
      const possible = parsedPhone.isPossible();
      const type = mapType(parsedPhone.getType());
      if (!valid) reasons.push("invalid_for_country");
      if (!possible) reasons.push("not_possible");
      result = {
        status: valid ? "valid" : (possible ? "unreachable" : "invalid"),
        line_type: type,
        country: parsedPhone.country ?? null,
        country_code: parsedPhone.countryCallingCode ? `+${parsedPhone.countryCallingCode}` : null,
        phone_e164: parsedPhone.format("E.164"),
        reasons,
      };
    }

    if (queueId) {
      const { data, error } = await owner.admin.rpc("complete_validation_queue_item", {
        p_queue_id: queueId, p_claim_token: claimToken, p_user_id: owner.userId,
        p_contact_id: contactId ?? null, p_kind: "phone", p_value: phone, p_result: result,
      }).abortSignal(AbortSignal.timeout(5_000));
      if (error) return new Response(JSON.stringify({ error: "Não foi possível confirmar a validação" }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
      if (data !== queueId) return new Response(JSON.stringify({ error: "Reserva substituída" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ ...result, queueId, validationId: data }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (persist) {
      const { error } = await owner.admin.from("phone_validations").insert({
        user_id: owner.userId,
        contact_id: contactId ?? null,
        phone_input: phone,
        phone_e164: result.phone_e164,
        status: result.status,
        line_type: result.line_type,
        country: result.country,
        country_code: result.country_code,
        is_active: result.status === "valid",
        reasons: result.reasons,
        provider: "libphonenumber",
        raw: result,
      }).abortSignal(AbortSignal.timeout(5_000));
      if (error) return new Response(JSON.stringify({ error: "Não foi possível salvar a validação" }), { status: 503, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify(result), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (err) {
    console.error('phone-validator error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
