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

  const checkLocalDb = async () => {
    const t = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      return { status: error ? "degraded" : "healthy", latencyMs: Date.now() - t, ...(error && { error: error.message }) };
    } catch (e) {
      return { status: "unhealthy", error: String(e) };
    }
  };

  const checkExternalDb = async () => {
    const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
    const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
    if (!extUrl || !extKey) return { status: "not_configured" };
    const t = Date.now();
    try {
      const extClient = createClient(extUrl, extKey);
      const { error } = await extClient.from("companies").select("id").limit(1);
      return { status: error ? "degraded" : "healthy", latencyMs: Date.now() - t, ...(error && { error: error.message }) };
    } catch (e) {
      return { status: "unhealthy", error: String(e) };
    }
  };

  const [dbResult, extResult] = await Promise.all([checkLocalDb(), checkExternalDb()]);
  const checks: Record<string, { status: string; latencyMs?: number; error?: string }> = {
    database: dbResult,
    runtime: { status: "healthy" },
    external_database: extResult,
  };

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
