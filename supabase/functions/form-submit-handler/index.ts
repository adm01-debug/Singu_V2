import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders } from "../_shared/auth.ts";

// Simple in-memory rate limiter: max 5 submissions per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown"
  );
}

const MAX_BODY_BYTES = 32_768; // 32 KB guard against payload bombs

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Rate limiting
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { ...cors, "Content-Type": "application/json", "Retry-After": "60" },
    });
  }

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
