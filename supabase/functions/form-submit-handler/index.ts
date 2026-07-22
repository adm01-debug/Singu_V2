import { createClient } from "npm:@supabase/supabase-js@2";
import { guardBody, scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5, message: "Too many form submissions. Please wait before trying again." });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // IP-based rate limiting for public form endpoint
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  const limited = limiter.check(ip, req);
  if (limited) return limited;

  const { body: rawBody, error: bodyError } = await guardBody(req, 64 * 1024);
  if (bodyError) return bodyError;

  try {
    const body = rawBody;
    const { slug, data, utms = {}, page_url, user_agent } = body || {};

    if (!slug || typeof slug !== "string" || slug.length > 128) {
      return new Response(JSON.stringify({ error: "slug required (string ≤128 chars)" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return new Response(JSON.stringify({ error: "data must be a plain object" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: result, error } = await supabase.rpc("submit_public_form", {
      _slug: slug,
      _data: data,
      _utms: utms,
      _page_url: page_url ? String(page_url).slice(0, 2000) : null,
      _user_agent: user_agent ? String(user_agent).slice(0, 500) : null,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("form-submit-handler error", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
