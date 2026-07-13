import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, FlaskConical, ShieldAlert, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  is_simulated: boolean;
  severity: string;
  created_at: string;
  acknowledged_at: string | null;
}

export function BehavioralRegenAlertsStats() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["behavioral-regen-alerts-stats-30d"],
    refetchInterval: 5 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("system_alerts")
        .select("is_simulated, severity, created_at, acknowledged_at")
        .in("alert_type", ["behavioral_regen_error_rate", "behavioral_regen_cron_stale"])
        .gte("created_at", since)
        .limit(5000);
      if (error) throw error;
      const rows = (data ?? []) as Row[];
      const real = rows.filter((r) => !r.is_simulated);
      const sim = rows.filter((r) => r.is_simulated);
      const acked = real.filter((r) => r.acknowledged_at);
      const mttaMs = acked.length
        ? acked.reduce(
            (sum, r) =>
              sum +
              (new Date(r.acknowledged_at as string).getTime() -
                new Date(r.created_at).getTime()),
            0,
          ) / acked.length
        : null;
      return {
        realTotal: real.length,
        realCritical: real.filter((r) => r.severity === "critical").length,
        simulated: sim.length,
        mttaMinutes: mttaMs !== null ? Math.round(mttaMs / 60_000) : null,
      };
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

  const stats = data ?? { realTotal: 0, realCritical: 0, simulated: 0, mttaMinutes: null };

  const fmtMtta = (m: number | null): string => {
    if (m === null) return "—";
    if (m < 1) return "<1 min";
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ${m % 60}min`;
    return `${Math.floor(h / 24)}d ${h % 24}h`;
  };

  const items = [
    {
      label: "Alertas reais (30d)",
      value: String(stats.realTotal),
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
      value: fmtMtta(stats.mttaMinutes),
      icon: Timer,
      tone:
        stats.mttaMinutes !== null && stats.mttaMinutes > 60
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground",
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
          </CardContent>
        </Card>
      ))}
    </div>
  );
}