import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CheckCircle2, Clock, Loader2, Pause, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CronHealthRow {
  jobname: string;
  schedule: string;
  active: boolean;
  last_run_at: string | null;
  last_status: string | null;
  last_duration_ms: number | null;
  runs_24h: number;
  failures_24h: number;
  success_rate_pct: number | null;
}

function minutesSince(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
}

function formatAgo(mins: number | null): string {
  if (mins === null) return "nunca";
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min atrás`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function BehavioralRegenCronHealth() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["behavioral-regen-cron-health"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<CronHealthRow[]> => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
      ) => Promise<{ data: CronHealthRow[] | null; error: Error | null }>)(
        "get_behavioral_regen_cron_health",
      );
      if (error) throw error;
      return (data ?? []) as CronHealthRow[];
    },
  });

  const simulate = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc as unknown as (
        fn: string,
        args: Record<string, unknown>,
      ) => Promise<{ data: string | null; error: Error | null }>)(
        "simulate_behavioral_regen_alert",
        { _alert_type: "behavioral_regen_cron_stale", _severity: "critical" },
      );
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Alerta simulado disparado", {
        description: "Verifique o banner e o sino de notificações.",
      });
      qc.invalidateQueries({ queryKey: ["behavioral-regen-active-alerts"] });
    },
    onError: (err: Error) => {
      toast.error("Falha ao simular alerta", { description: err.message });
    },
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Saúde dos jobs agendados
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (window.confirm("Disparar alerta crítico simulado para testar o fluxo?")) {
                simulate.mutate();
              }
            }}
            disabled={simulate.isPending}
          >
            {simulate.isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Zap className="mr-1 h-3 w-3" />
            )}
            Testar alerta
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : error ? (
          <p className="text-xs text-destructive">Falha ao carregar: {(error as Error).message}</p>
        ) : !data?.length ? (
          <p className="text-xs text-muted-foreground">Nenhum job agendado encontrado.</p>
        ) : (
          data.map((row) => {
            const mins = minutesSince(row.last_run_at);
            const expectedMax = row.jobname.includes("5min") ? 15 : 60 * 26;
            const stale = mins !== null && mins > expectedMax;
            const failing = row.success_rate_pct !== null && row.success_rate_pct < 80;
            const critical = !row.active || stale || failing;

            return (
              <div
                key={row.jobname}
                className={cn(
                  "rounded-md border p-3 space-y-1.5",
                  critical ? "border-destructive/50 bg-destructive/5" : "border-border/60",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {!row.active ? (
                      <Pause className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    ) : critical ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    )}
                    <span className="text-xs font-medium truncate">{row.jobname}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {row.schedule}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                  <span>Última: {formatAgo(mins)}</span>
                  {row.last_status && (
                    <span className={cn(row.last_status !== "succeeded" && "text-destructive")}>
                      {row.last_status}
                    </span>
                  )}
                  {row.last_duration_ms !== null && <span>{row.last_duration_ms}ms</span>}
                  <span>
                    24h: {row.runs_24h} runs · {row.failures_24h} falhas
                  </span>
                  {row.success_rate_pct !== null && (
                    <span className={cn(failing && "text-destructive font-medium")}>
                      {row.success_rate_pct}% sucesso
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}