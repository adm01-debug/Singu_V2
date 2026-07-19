import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5, message: "Too many form submissions. Please wait before trying again." });

const MAX_BODY_BYTES = 32_768; // 32 KB guard against payload bombs

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

  // Size guard
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
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
      _page_url: page_url ?? null,
      _user_agent: user_agent ?? null,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("form-submit-handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
