import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlertRow {
  id: string;
  alert_type: string;
  severity: string;
  threshold_pct: number;
  consumed_pct: number;
  message: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function BehavioralRegenAlertBanner() {
  const qc = useQueryClient();
  const [showSimulated, setShowSimulated] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("brab:show-simulated") === "1";
  });

  const { data: allAlerts, isLoading } = useQuery({
    queryKey: ["behavioral-regen-active-alerts"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<AlertRow[]> => {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("id, alert_type, severity, threshold_pct, consumed_pct, message, created_at, metadata")
        .in("alert_type", ["behavioral_regen_error_rate", "behavioral_regen_cron_stale"])
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data as AlertRow[] | null) ?? [];
    },
  });

  const isSimulated = (a: AlertRow): boolean =>
    (a.metadata as Record<string, unknown> | null)?.simulated === true;

  const simulatedCount = useMemo(
    () => (allAlerts ?? []).filter(isSimulated).length,
    [allAlerts],
  );

  const alerts = useMemo(() => {
    const list = allAlerts ?? [];
    return showSimulated ? list.slice(0, 10) : list.filter((a) => !isSimulated(a)).slice(0, 10);
  }, [allAlerts, showSimulated]);

  const toggleSimulated = () => {
    const next = !showSimulated;
    setShowSimulated(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("brab:show-simulated", next ? "1" : "0");
    }
  };

  const ack = useMutation({
    mutationFn: async (alertId: string) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("system_alerts")
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: userRes?.user?.id ?? null,
        })
        .eq("id", alertId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Alerta reconhecido");
      qc.invalidateQueries({ queryKey: ["behavioral-regen-active-alerts"] });
    },
    onError: (err: Error) => {
      toast.error("Falha ao reconhecer alerta", { description: err.message });
    },
  });

  if (isLoading) return null;
  if (!alerts.length && simulatedCount === 0) return null;

  const titleFor = (a: AlertRow): string => {
    if (a.alert_type === "behavioral_regen_cron_stale") {
      const job = (a.metadata as Record<string, unknown> | null)?.jobname;
      const suffix = job ? `: ${String(job)}` : "";
      return `Cron travado${suffix}`;
    }
    return `Taxa de erro do cron acima do limite (${Number(a.consumed_pct).toFixed(1)}% › ${Number(a.threshold_pct).toFixed(0)}%)`;
  };

  return (
    <div className="space-y-2">
      {simulatedCount > 0 && (
        <div className="flex items-center justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleSimulated}
            className="h-7 gap-1 text-xs text-muted-foreground"
            aria-pressed={showSimulated}
          >
            {showSimulated ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {showSimulated
              ? `Ocultar simulações (${simulatedCount})`
              : `Mostrar simulações (${simulatedCount})`}
          </Button>
        </div>
      )}
      {alerts.map((a) => {
        const isCritical = a.severity === "critical";
        const simulated = isSimulated(a);
        return (
          <Alert
            key={a.id}
            variant={isCritical ? "destructive" : "default"}
            className={cn(
              !isCritical && "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200",
              simulated && "opacity-80",
            )}
          >
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2">
                {titleFor(a)}
                {simulated && (
                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                    Simulação
                  </Badge>
                )}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => ack.mutate(a.id)}
                disabled={ack.isPending}
              >
                {ack.isPending ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                Reconhecer
              </Button>
            </AlertTitle>
            <AlertDescription className="mt-1 text-sm">
              {a.message}
              <span className="ml-1 opacity-80">
                · Detectado em {new Date(a.created_at).toLocaleString("pt-BR")}
              </span>
            </AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
}