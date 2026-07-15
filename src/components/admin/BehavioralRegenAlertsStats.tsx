import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, AlertTriangle, FlaskConical, ShieldAlert, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { computeAlertStats, formatMtta, type AlertRowLike } from "@/lib/behavioralAlertStats";

interface Props {
  hideSimulations?: boolean;
}

/** SLA alvo para MTTA crítico (minutos). Acima disso, sinaliza breach visual. */
const MTTA_CRITICAL_SLA_MIN = 30;

export function BehavioralRegenAlertsStats({ hideSimulations = false }: Props = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["behavioral-regen-alerts-stats-30d", hideSimulations],
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      let q = supabase
        .from("system_alerts")
        .select("is_simulated, severity, created_at, acknowledged_at")
        .in("alert_type", ["behavioral_regen_error_rate", "behavioral_regen_cron_stale"])
        .gte("created_at", since)
        .limit(5000);
      if (hideSimulations) q = q.eq("is_simulated", false);
      const { data, error } = await q;
      if (error) throw error;
      return computeAlertStats((data ?? []) as AlertRowLike[]);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-xs text-destructive">
        Falha ao carregar estatísticas: {(error as Error).message}
      </p>
    );
  }

  const stats =
    data ?? {
      realTotal: 0,
      realCritical: 0,
      realWarning: 0,
      simulated: 0,
      mttaMinutes: null,
      mttaP95Minutes: null,
      mttaCriticalMinutes: null,
      mttaWarningMinutes: null,
    };

  const items = [
    {
      label: "Alertas reais (30d)",
      value: String(stats.realTotal),
      hint:
        stats.realTotal > 0
          ? `${stats.realCritical} críticos · ${stats.realWarning} warnings`
          : undefined,
      icon: Activity,
      tone: "text-foreground",
    },
    {
      label: "Críticos reais (30d)",
      value: String(stats.realCritical),
      icon: ShieldAlert,
      tone: stats.realCritical > 0 ? "text-destructive" : "text-foreground",
    },
    {
      label: "MTTA (30d)",
      value: formatMtta(stats.mttaMinutes),
      hint:
        [
          stats.mttaP95Minutes !== null ? `p95: ${formatMtta(stats.mttaP95Minutes)}` : null,
          stats.mttaCriticalMinutes !== null
            ? `crít: ${formatMtta(stats.mttaCriticalMinutes)}`
            : null,
          stats.mttaWarningMinutes !== null
            ? `warn: ${formatMtta(stats.mttaWarningMinutes)}`
            : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
      icon:
        stats.mttaCriticalMinutes !== null && stats.mttaCriticalMinutes > MTTA_CRITICAL_SLA_MIN
          ? AlertTriangle
          : Timer,
      tone:
        stats.mttaCriticalMinutes !== null && stats.mttaCriticalMinutes > MTTA_CRITICAL_SLA_MIN
          ? "text-destructive"
          : stats.mttaMinutes !== null && stats.mttaMinutes > 60
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground",
      breach:
        stats.mttaCriticalMinutes !== null && stats.mttaCriticalMinutes > MTTA_CRITICAL_SLA_MIN
          ? `SLA ${MTTA_CRITICAL_SLA_MIN}min excedido`
          : undefined,
    },
    {
      label: "Simulações (30d)",
      value: String(stats.simulated),
      icon: FlaskConical,
      tone: "text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <Card key={it.label}>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <it.icon className="w-3.5 h-3.5" /> {it.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-semibold tabular-nums ${it.tone}`}>{it.value}</p>
            {it.hint && (
              <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">{it.hint}</p>
            )}
            {"breach" in it && it.breach && (
              <p className="text-[10px] text-destructive mt-1 font-medium">⚠ {it.breach}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}