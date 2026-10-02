import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, withAuth } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 3, message: "Muitas verificações de saúde. Aguarde antes de tentar novamente." });

interface Check {
  status: "up" | "degraded" | "down" | "not_configured";
  latency_ms?: number;
  error?: string;
  details?: string;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

async function checkLocalDb(): Promise<Check> {
  try {
    const start = Date.now();
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
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

async function checkExternalDb(): Promise<Check> {
  const url = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const key = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const ext = createClient(url, key);
    const { error } = await ext.from("companies").select("id").limit(1);
    return {
      status: error ? "degraded" : "up",
      latency_ms: Date.now() - start,
      ...(error && { error: error.message }),
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkWhatsApp(): Promise<Check> {
  const url = Deno.env.get("EVOLUTION_API_URL");
  const key = Deno.env.get("EVOLUTION_API_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const res = await fetch(`${url}/instance/fetchInstances`, {
      headers: { apikey: key },
      signal: AbortSignal.timeout(8_000),
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

async function checkVoiceAI(): Promise<Check> {
  const key = Deno.env.get("ELEVENLABS_API_KEY");
  if (!key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const res = await fetch("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": key },
      signal: AbortSignal.timeout(8_000),
    });
    return {
      status: res.ok ? "up" : "degraded",
      latency_ms: Date.now() - start,
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function checkEmailPipeline(): Promise<Check> {
  const url = Deno.env.get("EXTERNAL_SUPABASE_URL");
  const key = Deno.env.get("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return { status: "not_configured" };
  try {
    const start = Date.now();
    const ext = createClient(url, key);
    const { data, error } = await ext
      .from("email_logs")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) return { status: "degraded", latency_ms: Date.now() - start, error: error.message };
    const last = data?.[0]?.created_at;
    if (!last) return { status: "degraded", details: "Sem emails registrados" };
    const hoursSince = (Date.now() - new Date(last).getTime()) / 3_600_000;
    return {
      status: hoursSince < 1 ? "up" : hoursSince < 24 ? "degraded" : "down",
      latency_ms: Date.now() - start,
      details: `Último email há ${Math.round(hoursSince)}h`,
    };
  } catch (e) {
    return { status: "down", error: String(e) };
  }
}

async function getActiveAlerts(): Promise<number | null> {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const { count } = await supabase
      .from("alerts")
      .select("*", { count: "exact", head: true })
      .eq("dismissed", false);
    return count ?? 0;
  } catch {
    return null;
  }
}

interface ConnectionsHealth {
  status: "up" | "degraded" | "down" | "not_configured";
  total: number;
  active: number;
  test_failures_24h: number;
  webhook_errors_24h: number;
  details?: string;
}

async function checkConnectionsModule(): Promise<ConnectionsHealth> {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
    const since = new Date(Date.now() - 24 * 3_600_000).toISOString();

    const [{ count: total }, { count: active }, { count: failures }, { count: whErrors }] = await Promise.all([
      supabase.from("connection_configs").select("*", { count: "exact", head: true }),
      supabase.from("connection_configs").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("connection_test_logs").select("*", { count: "exact", head: true }).eq("status", "error").gte("created_at", since),
      supabase.from("incoming_webhook_logs").select("*", { count: "exact", head: true }).eq("status", "error").gte("created_at", since),
    ]);

    const totalCount = total ?? 0;
    if (totalCount === 0) {
      return { status: "not_configured", total: 0, active: 0, test_failures_24h: 0, webhook_errors_24h: 0 };
    }

    const status: ConnectionsHealth["status"] =
      (failures ?? 0) > 10 || (whErrors ?? 0) > 20 ? "degraded" : "up";

    return {
      status,
      total: totalCount,
      active: active ?? 0,
      test_failures_24h: failures ?? 0,
      webhook_errors_24h: whErrors ?? 0,
      details: `${active ?? 0}/${totalCount} ativas · ${failures ?? 0} falhas teste · ${whErrors ?? 0} erros webhook (24h)`,
    };
  } catch (e) {
    return { status: "down", total: 0, active: 0, test_failures_24h: 0, webhook_errors_24h: 0, details: String(e) };
  }
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;

  const limited = limiter.check(authResult, req);
  if (limited) return limited;

  const start = Date.now();
  const [database_local, database_external, whatsapp, voice_ai, email_pipeline, connections, alerts_count] =
    await Promise.all([
      checkLocalDb(),
      checkExternalDb(),
      checkWhatsApp(),
      checkVoiceAI(),
      checkEmailPipeline(),
      checkConnectionsModule(),
      getActiveAlerts(),
    ]);

  const components = { database_local, database_external, whatsapp, email_pipeline, voice_ai, connections };
  const considered = Object.values(components);
  const hasDown = considered.some((c) => c.status === "down");
  const hasDegraded = considered.some((c) => c.status === "degraded");
  const hasUnavailable = considered.some((c) => c.status === "not_configured");
  const overall = hasDown
    ? "unhealthy"
    : hasUnavailable
      ? "unavailable"
      : hasDegraded
        ? "degraded"
        : "healthy";

  return new Response(
    JSON.stringify({
      status: overall,
      timestamp: new Date().toISOString(),
      total_latency_ms: Date.now() - start,
      components,
      alerts_count,
      version: "3.1.0",
    }),
    {
      status: overall === "healthy" ? 200 : 503,
      headers: { ...cors, "Content-Type": "application/json" },
    },
  );
});
