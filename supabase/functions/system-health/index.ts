import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5 });

interface ComponentCheck {
  status: "up" | "degraded" | "down" | "not_configured";
  latency_ms?: number;
  error?: string;
  last_activity?: string;
  details?: string;
}

async function checkLocalDb(): Promise<ComponentCheck> {
  try {
    const start = Date.now();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { error } = await supabase.from("profiles").select("id").limit(1);
    return {
      status: error ? "degraded" : "up",
      latency_ms: Date.now() - start,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkExternalDb(): Promise<ComponentCheck> {
  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!extUrl || !extKey) return { status: "not_configured" };
  try {
    const start = Date.now();
    const extClient = createClient(extUrl, extKey);
    const { error } = await extClient.from("companies").select("id").limit(1);
    return {
      status: error ? "degraded" : "up",
      latency_ms: Date.now() - start,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkWhatsApp(): Promise<ComponentCheck> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const res = await fetch(`${url}/instance/fetchInstances`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(10_000),
    });
    return {
      status: res.ok ? "up" : "degraded",
      latency_ms: Date.now() - start,
      ...(!res.ok && { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkEmailPipeline(): Promise<ComponentCheck> {
  const extUrl = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const extKey = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!extUrl || !extKey) return { status: "not_configured" };
  try {
    const start = Date.now();
    const extClient = createClient(extUrl, extKey);
    const { data, error } = await extClient
      .from("email_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return { status: "degraded", latency_ms: Date.now() - start, error: error.message };
    const lastEmail = data?.[0]?.created_at;
    if (!lastEmail) return { status: "degraded", details: "Sem emails registrados" };
    const hoursSince = (Date.now() - new Date(lastEmail).getTime()) / (1000 * 60 * 60);
    return {
      status: hoursSince < 1 ? "up" : hoursSince < 24 ? "degraded" : "down",
      latency_ms: Date.now() - start,
      last_activity: lastEmail,
      details: `Último email há ${Math.round(hoursSince)}h`,
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkVoiceAI(): Promise<ComponentCheck> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const res = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(10_000),
    });
    return {
      status: res.ok ? "up" : "degraded",
      latency_ms: Date.now() - start,
      ...(!res.ok && { error: `HTTP ${res.status}` }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function getActiveAlerts(): Promise<number> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("dismissed", false);
    return count ?? 0;
  } catch {
    return 0;
  }
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const rl = limiter.check(authResult, req);
  if (rl) return rl;

  const startTime = Date.now();

  // Run all checks in parallel
  const [database_local, database_external, whatsapp, email_pipeline, voice_ai, alerts_count] =
    await Promise.all([
      checkLocalDb(),
      checkExternalDb(),
      checkWhatsApp(),
      checkEmailPipeline(),
      checkVoiceAI(),
      getActiveAlerts(),
    ]);

  const components = { database_local, database_external, whatsapp, email_pipeline, voice_ai };

  // Determine overall status
  const statuses = Object.values(components).filter(c => c.status !== "not_configured");
  const hasDown = statuses.some(c => c.status === "down");
  const hasDegraded = statuses.some(c => c.status === "degraded");
  const overallStatus = hasDown ? "unhealthy" : hasDegraded ? "degraded" : "healthy";

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    total_latency_ms: Date.now() - startTime,
    components,
    alerts_count,
    version: "2.0.0",
  };

  // Persistir snapshot (best-effort) para alimentar /admin/error-budget
  createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  ).from("system_health_snapshots").insert({
    status: overallStatus,
    total_latency_ms: response.total_latency_ms,
    components,
  }).catch(() => { /* best-effort — não bloqueia resposta */ });

  return new Response(JSON.stringify(response), {
    status: overallStatus === "unhealthy" ? 503 : 200,
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
