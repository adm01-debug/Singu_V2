import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { HeartPulse, AlertTriangle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeartbeatRow {
  timestamp: string;
  components: Record<string, unknown> | null;
}

const STALE_WARN_MIN = 90;   // cron roda de hora em hora — 90min = 1 miss + margem
const STALE_CRIT_MIN = 150;  // 2h30 = 2 misses consecutivos

/**
 * Heartbeat do cron `mtta-sla-breach-auto-ack-hourly`. Grava snapshot em
 * system_health_snapshots a cada execução; ausência prolongada = cron travado.
 */
export function MttaAutoAckHeartbeatCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["mtta-auto-ack-heartbeat"],
    refetchInterval: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<HeartbeatRow | null> => {
      const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("system_health_snapshots")
        .select("timestamp, components")
        .contains("components", { source: "cron_mtta_auto_ack" })
        .gte("timestamp", since)
        .order("timestamp", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as HeartbeatRow | null;
    },
  });

  const ageMin = data ? Math.round((Date.now() - new Date(data.timestamp).getTime()) / 60000) : null;
  const status =
    ageMin === null
      ? "unknown"
      : ageMin > STALE_CRIT_MIN
      ? "critical"
      : ageMin > STALE_WARN_MIN
      ? "warning"
      : "healthy";
  const ackedCount =
    data?.components && typeof (data.components as { acked_count?: unknown }).acked_count === "number"
      ? ((data.components as { acked_count: number }).acked_count)
      : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <HeartPulse className="w-4 h-4" /> Heartbeat cron auto-ack MTTA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-14 w-full" />
        ) : error ? (
          <p className="text-xs text-destructive">
            Falha ao carregar heartbeat: {(error as Error).message}
          </p>
        ) : (
          <div className="flex items-start gap-3">
            {status === "healthy" ? (
              <Badge variant="outline" className="shrink-0">
                <CheckCircle2 className="w-3 h-3 mr-1" /> saudável
              </Badge>
            ) : status === "warning" ? (
              <Badge variant="secondary" className="shrink-0 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-3 h-3 mr-1" /> atrasado
              </Badge>
            ) : status === "critical" ? (
              <Badge variant="destructive" className="shrink-0">
                <AlertTriangle className="w-3 h-3 mr-1" /> travado
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0">sem sinal 24h</Badge>
            )}
            <div className="flex-1 min-w-0 text-sm">
              {ageMin !== null ? (
                <>
                  <p className="tabular-nums">
                    Última execução há <strong>{ageMin} min</strong>
                    {ackedCount !== null && (
                      <span className="text-muted-foreground"> · {ackedCount} ack(s)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(data!.timestamp).toLocaleString("pt-BR")} · SLA: warn &gt;{STALE_WARN_MIN}min,
                    crit &gt;{STALE_CRIT_MIN}min
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">
                  Nenhum heartbeat nas últimas 24h — investigar cron{" "}
                  <code>mtta-sla-breach-auto-ack-hourly</code>.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}