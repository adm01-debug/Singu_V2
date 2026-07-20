import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Rate limit exceeded for health." });

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  const startTime = Date.now();
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {};

  try {
    const dbStart = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { error } = await supabase.from("profiles").select("id").limit(1);
    checks.database = {
      status: error ? "degraded" : "healthy",
      latencyMs: Date.now() - dbStart,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    checks.database = { status: "unhealthy", error: String(e) };
  }

  checks.runtime = { status: "healthy" };

  try {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (extUrl && extKey) {
      const extStart = Date.now();
      const extClient = createClient(extUrl, extKey);
      const { error } = await extClient.from("companies").select("id").limit(1);
      checks.external_database = {
        status: error ? "degraded" : "healthy",
        latencyMs: Date.now() - extStart,
        ...(error && { error: error.message }),
      };
    } else {
      checks.external_database = { status: "not_configured" };
    }
  } catch (e) {
    checks.external_database = { status: "unhealthy", error: String(e) };
  }

  const allHealthy = Object.values(checks).every(
    (c) => c.status === "healthy" || c.status === "not_configured"
  );

  return new Response(JSON.stringify({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startTime,
    checks,
    version: "1.0.0",
  }), {
    status: allHealthy ? 200 : 503,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
