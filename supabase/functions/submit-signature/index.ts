import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip);
  if (limited) return limited;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const { token, action, signature_typed, signature_image, declined_reason } = body;

    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
