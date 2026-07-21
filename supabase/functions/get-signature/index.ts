import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, guardBody } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";
import { validate } from "../_shared/validate.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 20 });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody } = await guardBody(req, 32 * 1024);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    let bodyToken: string | undefined;
    if (rawBody) {
      const vgs = validate(rawBody, { token: { type: 'string', maxLength: 128 } });
      if (vgs.ok) bodyToken = vgs.data.token as string | undefined;
    }
    const token = url.searchParams.get("token") || bodyToken;

    if (!token || typeof token !== "string" || token.length < 16) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: signature, error } = await supabase
      .from("document_signatures")
      .select("id, signer_name, signer_email, rendered_html, status, viewed_at, signed_at, declined_at, expires_at, created_at")
      .eq("signature_token", token)
      .maybeSingle();

    if (error) throw error;
    if (!signature) {
      return new Response(JSON.stringify({ error: "Documento não encontrado" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Check expiration
    if (signature.expires_at && new Date(signature.expires_at) < new Date()) {
      supabase
        .from("document_signatures")
        .update({ status: "expired" })
        .eq("id", signature.id)
        .catch((e: unknown) => console.error("document_signatures expired update error:", e));
      return new Response(JSON.stringify({ ...signature, status: "expired" }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Mark as viewed if pending
    if (signature.status === "pending") {
      await supabase
        .from("document_signatures")
        .update({ status: "viewed", viewed_at: new Date().toISOString() })
        .eq("id", signature.id);
      signature.status = "viewed";
      signature.viewed_at = new Date().toISOString();
    }

    // Track view (best-effort)
    const viewerIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
    const ua = req.headers.get("user-agent") || null;
    supabase.from("document_views").insert({
      signature_id: signature.id,
      viewer_ip: viewerIp,
      viewer_user_agent: ua,
      viewer_email: signature.signer_email,
    }).catch((e: unknown) => console.error("document_views insert error:", e));

    return new Response(JSON.stringify(signature), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("get-signature error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
