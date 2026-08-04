import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";

interface Row {
  created_at: string;
  is_simulated: boolean;
}

interface DayPoint {
  day: string;
  real: number;
  simulados: number;
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

interface Props {
  hideSimulations?: boolean;
}

export function BehavioralRegenAlertsTrend({ hideSimulations = false }: Props = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["behavioral-regen-alerts-trend-30d", hideSimulations],
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<DayPoint[]> => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);
      let q = supabase
        .from("system_alerts")
        .select("created_at, is_simulated")
        .in("alert_type", ["behavioral_regen_error_rate", "behavioral_regen_cron_stale"])
        .gte("created_at", since.toISOString())
        .limit(5000);
      if (hideSimulations) q = q.eq("is_simulated", false);
      const { data, error } = await q;
      if (error) throw error;

      const buckets = new Map<string, DayPoint>();
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60_000);
        const k = d.toISOString().slice(0, 10);
        buckets.set(k, { day: k.slice(5), real: 0, simulados: 0 });
      }
      for (const r of (data ?? []) as Row[]) {
        const k = dayKey(r.created_at);
        const short = k.slice(5);
        const b = buckets.get(k);
        if (!b) continue;
        if (r.is_simulated) b.simulados += 1;
        else b.real += 1;
        b.day = short;
      }
      return Array.from(buckets.values());
    },
  });

  const empty = useMemo(
    () => (data ?? []).every((d) => d.real === 0 && d.simulados === 0),
    [data],
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Tendência de alertas (30d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : error ? (
          <p className="text-xs text-destructive">
            Falha ao carregar tendência: {(error as Error).message}
          </p>
        ) : empty ? (
          <p className="text-xs text-muted-foreground py-12 text-center">
            Sem alertas nos últimos 30 dias.
          </p>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data ?? []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="simGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={30} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="real"
                  name="Reais"
                  stroke="hsl(var(--destructive))"
                  fill="url(#realGrad)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="simulados"
                  name="Simulações"
                  stroke="hsl(var(--muted-foreground))"
                  fill="url(#simGrad)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}