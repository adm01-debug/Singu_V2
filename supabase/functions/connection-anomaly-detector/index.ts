import { createClient } from "npm:@supabase/supabase-js@2";
import { scopedCorsHeaders, jsonError, jsonOk, withAuth } from "../_shared/auth.ts";
import { extractTraceId, tracedLogger } from "../_shared/tracing.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 5, message: "Muitas análises de anomalia. Aguarde antes de tentar novamente." });

interface DailyAgg {
  date: string;
  total: number;
  errors: number;
  avg_latency: number;
  p95_latency: number;
}

const SYSTEM = `Você é um detector de anomalias em logs de webhooks. Receberá uma série temporal diária (últimos 7 dias) com totais, erros, latência média e p95 por webhook.

Identifique padrões anômalos:
- error_spike: aumento brusco de erros vs baseline
- latency_degradation: piora gradual ou abrupta de p95
- volume_drop: queda forte de volume (possível falha silenciosa de origem)
- volume_spike: pico anormal (possível ataque ou loop)
- suspicious_window: janela curta com comportamento atípico

Retorne APENAS JSON:
{
  "anomalies": [
    {
      "type": "error_spike|latency_degradation|volume_drop|volume_spike|suspicious_window",
      "severity": "low|medium|high|critical",
      "explanation": "texto curto em português explicando ao admin",
      "confidence": 0.0-1.0
    }
  ]
}

Se não houver anomalias, retorne {"anomalies": []}.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: scopedCorsHeaders(req) });

  const traceId = extractTraceId(req);
  const log = tracedLogger(traceId, "connection-anomaly-detector");

  // Aceita POST com header secreto (cron) ou admin autenticado via JWT
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  const isCron = !!expectedSecret && cronSecret === expectedSecret;

  let userId: string | undefined;
  if (!isCron) {
    // Fall back to JWT auth for non-cron callers (admin dashboard)
    const authResult = await withAuth(req);
    if (authResult instanceof Response) return authResult;
    userId = authResult;
    const limited = limiter.check(userId, req);
    if (limited) return limited;
  }

  log.info("request_received", { method: req.method, isCron });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY missing", 500, req);

    // Buscar webhooks ativos — scope by user when called via JWT (not cron)
    let webhookQuery = supabase
      .from("incoming_webhooks")
      .select("id, name")
      .eq("is_active", true);
    if (!isCron && userId) webhookQuery = webhookQuery.eq("user_id", userId);
    const { data: webhooks, error: whErr } = await webhookQuery;
    if (whErr) throw whErr;
    if (!webhooks?.length) return jsonOk({ message: "Nenhum webhook ativo", inserted: 0 }, req);

    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const windowEnd = new Date().toISOString();
    let totalInserted = 0;

    for (const wh of webhooks) {
      const { data: logs } = await supabase
        .from("incoming_webhook_logs")
        .select("status, http_status, latency_ms, created_at")
        .eq("webhook_id", wh.id)
        .gte("created_at", since)
        .order("created_at", { ascending: true })
        .limit(2000);

      if (!logs || logs.length < 10) continue;

      const series = aggregateDaily(logs);
      const aiInput = `Webhook: ${wh.name}\nSérie diária (últimos 7d):\n${JSON.stringify(series, null, 2)}`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: SYSTEM },
            { role: "user", content: aiInput },
          ],
          temperature: 0.1,
          max_tokens: 800,
        }),
      });

      let anomalies: Array<{ type: string; severity: string; explanation: string; confidence: number }> = [];
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        const content = aiData.choices?.[0]?.message?.content ?? "";
        // eslint-disable-next-line sonarjs/slow-regex -- regex verified non-catastrophic (no nested ambiguous quantifiers / bounded)
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
          try { anomalies = JSON.parse(m[0]).anomalies ?? []; } catch { anomalies = []; }
        }
      } else {
        // Fallback determinístico
        anomalies = deterministicAnomalies(series);
      }

      for (const a of anomalies) {
        const validTypes = ["error_spike", "latency_degradation", "volume_drop", "volume_spike", "suspicious_window", "schema_drift"];
        const validSev = ["low", "medium", "high", "critical"];
        if (!validTypes.includes(a.type) || !validSev.includes(a.severity)) continue;
        await supabase.from("connection_anomalies").insert({
          webhook_id: wh.id,
          anomaly_type: a.type,
          severity: a.severity,
          explanation: a.explanation.slice(0, 500),
          metrics: { series } as never,
          window_start: since,
          window_end: windowEnd,
          model_used: aiRes.ok ? "google/gemini-2.5-flash" : "deterministic",
          confidence: typeof a.confidence === "number" ? Math.min(1, Math.max(0, a.confidence)) : 0.5,
        });
        totalInserted++;
      }
    }

    return jsonOk({ inserted: totalInserted, scanned: webhooks.length, isCron }, req);
  } catch (e) {
    log.error("anomaly-detector uncaught error", { error: e instanceof Error ? e.message : String(e) });
    return jsonError(e instanceof Error ? e.message : "Erro desconhecido", 500, req);
  }
});

function aggregateDaily(logs: Array<{ status: string; http_status: number | null; latency_ms: number | null; created_at: string }>): DailyAgg[] {
  const buckets = new Map<string, { total: number; errors: number; latencies: number[] }>();
  for (const l of logs) {
    const date = l.created_at.slice(0, 10);
    const b = buckets.get(date) ?? { total: 0, errors: 0, latencies: [] };
    b.total++;
    if (l.status === "error" || (l.http_status && l.http_status >= 400)) b.errors++;
    if (l.latency_ms) b.latencies.push(l.latency_ms);
    buckets.set(date, b);
  }
  return Array.from(buckets.entries()).map(([date, b]) => {
    const sorted = [...b.latencies].sort((x, y) => x - y);
    const avg = sorted.length ? Math.round(sorted.reduce((a, c) => a + c, 0) / sorted.length) : 0;
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] ?? avg : 0;
    return { date, total: b.total, errors: b.errors, avg_latency: avg, p95_latency: p95 };
  });
}

function deterministicAnomalies(series: DailyAgg[]) {
  const out: Array<{ type: string; severity: string; explanation: string; confidence: number }> = [];
  if (series.length < 3) return out;
  const last = series[series.length - 1];
  const prev = series.slice(0, -1);
  const avgErrors = prev.reduce((a, c) => a + c.errors, 0) / prev.length;
  const avgLatency = prev.reduce((a, c) => a + c.p95_latency, 0) / prev.length;
  if (last.errors > avgErrors * 3 && last.errors > 5) {
    out.push({ type: "error_spike", severity: "high", explanation: `Erros hoje (${last.errors}) 3× acima da média da semana (${avgErrors.toFixed(1)}).`, confidence: 0.85 });
  }
  if (last.p95_latency > avgLatency * 2 && last.p95_latency > 1000) {
    out.push({ type: "latency_degradation", severity: "medium", explanation: `P95 hoje (${last.p95_latency}ms) 2× pior que a média (${avgLatency.toFixed(0)}ms).`, confidence: 0.8 });
  }
  return out;
}
