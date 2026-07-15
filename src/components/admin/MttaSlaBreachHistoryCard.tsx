import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlarmClock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BreachRow {
  id: string;
  created_at: string;
  acknowledged_at: string | null;
  severity: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
}

const ALERT_TYPE = "mtta_critical_sla_breach";

/**
 * Histórico de breaches de SLA MTTA crítico nos últimos 30 dias.
 * Auto-ack ocorre server-side após 24h via cron `mtta-sla-breach-auto-ack-hourly`.
 */
export function MttaSlaBreachHistoryCard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["mtta-sla-breach-history-30d"],
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<BreachRow[]> => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();
      const { data, error } = await supabase
        .from("system_alerts")
        .select("id, created_at, acknowledged_at, severity, message, metadata")
        .eq("alert_type", ALERT_TYPE)
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as BreachRow[];
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlarmClock className="w-4 h-4" /> Breaches de SLA MTTA (30d)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <p className="text-xs text-destructive">
            Falha ao carregar histórico: {(error as Error).message}
          </p>
        ) : !data || data.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            Nenhum breach de SLA MTTA nos últimos 30 dias. ✓
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((b) => {
              const meta = (b.metadata ?? {}) as {
                mtta_minutes?: number;
                sla_minutes?: number;
                auto_ack_reason?: string;
              };
              const acked = Boolean(b.acknowledged_at);
              return (
                <li key={b.id} className="py-2 flex items-start gap-2 text-sm">
                  <Badge
                    variant={acked ? "outline" : "secondary"}
                    className="shrink-0 mt-0.5"
                  >
                    {acked ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : null}
                    {acked ? "ack" : "aberto"}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="truncate">
                      MTTA {meta.mtta_minutes ?? "?"}min &gt; SLA {meta.sla_minutes ?? 30}min
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(b.created_at).toLocaleString("pt-BR")}
                      {acked && b.acknowledged_at
                        ? ` · ack ${new Date(b.acknowledged_at).toLocaleString("pt-BR")}`
                        : ""}
                      {meta.auto_ack_reason ? ` · ${meta.auto_ack_reason}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}