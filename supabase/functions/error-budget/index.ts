// Edge function: error-budget — agrega janela de 30d de system_health_snapshots,
// retorna série temporal diária e dispara alertas em 50/75/100% do consumo.
import { createClient } from "npm:@supabase/supabase-js@2";
import { withAuth, scopedCorsHeaders } from "../_shared/auth.ts";
import { rateLimit } from "../_shared/rate-limit.ts";

const limiter = rateLimit({ windowMs: 60_000, max: 10, message: "Rate limit exceeded for error-budget." });

const SLO_TARGET = 99.5; // %
const WINDOW_HOURS = 720; // 30 dias
const SAMPLE_INTERVAL_MIN = 5; // cron snapshot a cada 5 min

interface Snapshot {
  timestamp: string;
  status: "healthy" | "degraded" | "unhealthy";
}

interface DailyPoint {
  date: string; // YYYY-MM-DD
  uptime_pct: number;
  samples: number;
}

interface ActiveAlert {
  id: string;
  severity: "warning" | "high" | "critical";
  threshold_pct: number;
  consumed_pct: number;
  message: string;
  created_at: string;
}

const ALERT_THRESHOLDS: Array<{ pct: number; severity: "warning" | "high" | "critical"; type: string }> = [
  { pct: 50, severity: "warning", type: "error_budget_50" },
  { pct: 75, severity: "high", type: "error_budget_75" },
  { pct: 100, severity: "critical", type: "error_budget_100" },
];

function computeDailySeries(snapshots: Snapshot[]): DailyPoint[] {
  const buckets = new Map<string, { down: number; degraded: number; total: number }>();
  for (const s of snapshots) {
    const date = s.timestamp.slice(0, 10);
    const b = buckets.get(date) ?? { down: 0, degraded: 0, total: 0 };
    b.total += 1;
    if (s.status === "unhealthy") b.down += 1;
    else if (s.status === "degraded") b.degraded += 1;
    buckets.set(date, b);
  }
  // Garantir 30 pontos contíguos (preencher dias sem amostra com 100%)
  const days: DailyPoint[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    const b = buckets.get(key);
    if (!b || b.total === 0) {
      days.push({ date: key, uptime_pct: 100, samples: 0 });
    } else {
      const minutesInDay = 24 * 60;
      const downtime = b.down * SAMPLE_INTERVAL_MIN + b.degraded * SAMPLE_INTERVAL_MIN * 0.5;
      const uptime = Math.max(0, 100 - (downtime / minutesInDay) * 100);
      days.push({ date: key, uptime_pct: Number(uptime.toFixed(3)), samples: b.total });
    }
  }
  return days;
}

async function maybeFireAlerts(
  supabase: ReturnType<typeof createClient>,
  budgetConsumedPct: number,
  uptimePct: number,
  downtimeMinutes: number,
): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  for (const t of ALERT_THRESHOLDS) {
    if (budgetConsumedPct < t.pct) continue;
    const { data: existing } = await supabase
      .from("system_alerts")
      .select("id")
      .eq("alert_type", t.type)
      .gte("created_at", cutoff)
      .limit(1);
    if (existing && existing.length > 0) continue;
    await supabase.from("system_alerts").insert({
      alert_type: t.type,
      severity: t.severity,
      threshold_pct: t.pct,
      consumed_pct: Number(budgetConsumedPct.toFixed(2)),
      message: `Error budget atingiu ${t.pct}% do orçamento mensal (consumo atual ${budgetConsumedPct.toFixed(1)}%, uptime ${uptimePct.toFixed(2)}%, ${downtimeMinutes.toFixed(0)} min de indisponibilidade nos últimos 30d).`,
      metadata: {
        slo_target_pct: SLO_TARGET,
        window_hours: WINDOW_HOURS,
        downtime_minutes: Number(downtimeMinutes.toFixed(1)),
        uptime_pct: Number(uptimePct.toFixed(3)),
      },
    });
  }
}

Deno.serve(async (req) => {
  const cors = scopedCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const authResult = await withAuth(req);
  if (authResult instanceof Response) return authResult;
  const userId = authResult;

  const limited = limiter.check(userId, req);
  if (limited) return limited;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const cutoff = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("system_health_snapshots")
      .select("timestamp,status")
      .gte("timestamp", cutoff)
      .order("timestamp", { ascending: true })
      .limit(10000);

    if (error) {
      console.error("error-budget query error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const snapshots = (data ?? []) as Snapshot[];
    const totalSamples = snapshots.length;
    const downSamples = snapshots.filter((s) => s.status === "unhealthy").length;
    const degradedSamples = snapshots.filter((s) => s.status === "degraded").length;

    const downtimeMinutes = downSamples * SAMPLE_INTERVAL_MIN + degradedSamples * SAMPLE_INTERVAL_MIN * 0.5;
    const totalMinutes = WINDOW_HOURS * 60;
    const uptimePct = totalSamples === 0 ? 100 : Math.max(0, 100 - (downtimeMinutes / totalMinutes) * 100);

    const budgetMinutesTotal = totalMinutes * ((100 - SLO_TARGET) / 100);
    const budgetConsumedPct = budgetMinutesTotal === 0 ? 0 : Math.min(150, (downtimeMinutes / budgetMinutesTotal) * 100);
    const freezeActive = budgetConsumedPct >= 100;
    const freezeWarning = budgetConsumedPct >= 50 && budgetConsumedPct < 100;

    const dailyUptime = computeDailySeries(snapshots);

    // Disparar alertas idempotentes (best-effort, não bloqueia resposta)
    try {
      await maybeFireAlerts(supabase, budgetConsumedPct, uptimePct, downtimeMinutes);
    } catch (alertErr) {
      console.error("alert insert failed", alertErr);
    }

    // Buscar alertas ativos (não reconhecidos) das últimas 30d
    const { data: alertsData } = await supabase
      .from("system_alerts")
      .select("id,severity,threshold_pct,consumed_pct,message,created_at")
      .is("acknowledged_at", null)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(20);

    const activeAlerts: ActiveAlert[] = (alertsData ?? []) as ActiveAlert[];

    const response = {
      slo_target_pct: SLO_TARGET,
      window_hours: WINDOW_HOURS,
      uptime_pct: Number(uptimePct.toFixed(3)),
      downtime_minutes: Number(downtimeMinutes.toFixed(1)),
      budget_total_minutes: Number(budgetMinutesTotal.toFixed(1)),
      budget_consumed_pct: Number(budgetConsumedPct.toFixed(1)),
      freeze_active: freezeActive,
      freeze_warning: freezeWarning,
      total_samples: totalSamples,
      down_samples: downSamples,
      degraded_samples: degradedSamples,
      sample_interval_minutes: SAMPLE_INTERVAL_MIN,
      computed_at: new Date().toISOString(),
      daily_uptime: dailyUptime,
      active_alerts: activeAlerts,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
