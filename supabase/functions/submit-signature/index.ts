import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const v = validate(rawBody, {
      token:            { type: 'string', required: true, maxLength: 512 },
      action:           { type: 'string', required: true, maxLength: 20 },
      signature_typed:  { type: 'string', maxLength: 500 },
      declined_reason:  { type: 'string', maxLength: 1000 },
    });
    if (!v.ok) {
      return new Response(JSON.stringify({ error: v.error }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { token, action, declined_reason } = v.data as { token: string; action: string; declined_reason?: string };
    // signature_image is a base64 dataURL — accept from raw body with size cap (guardBody already enforces 64 KB)
    const signature_typed = v.data.signature_typed as string | undefined;
    const signature_image = typeof (rawBody as Record<string, unknown>)?.signature_image === 'string'
      ? ((rawBody as Record<string, unknown>).signature_image as string).slice(0, 65_536)
      : undefined;

    const { data: existing } = await supabase
      .from("document_signatures")
      .select("id, status, expires_at")
      .eq("signature_token", token)
      .maybeSingle();

    if (!existing) {
      return new Response(JSON.stringify({ error: "Documento não encontrado" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (existing.status === "signed") {
      return new Response(JSON.stringify({ error: "Documento já assinado" }), {
        status: 409,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (existing.expires_at && new Date(existing.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Documento expirado" }), {
        status: 410,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const ua = req.headers.get("user-agent") || null;

    if (action === "sign") {
      if (!signature_typed && !signature_image) {
        return new Response(JSON.stringify({ error: "Assinatura ausente" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const { error } = await supabase
        .from("document_signatures")
        .update({
          status: "signed",
          signed_at: new Date().toISOString(),
          signature_typed: signature_typed ?? null,
          signature_image: signature_image ?? null,
          signed_ip: ip,
          signed_user_agent: ua,
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else if (action === "decline") {
      const { error } = await supabase
        .from("document_signatures")
        .update({
          status: "declined",
          declined_at: new Date().toISOString(),
          declined_reason: declined_reason ?? "Recusado pelo signatário",
        })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      return new Response(JSON.stringify({ error: "Ação inválida" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("submit-signature error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
