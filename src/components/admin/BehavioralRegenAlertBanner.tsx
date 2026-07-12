import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AlertRow {
  id: string;
  severity: string;
  threshold_pct: number;
  consumed_pct: number;
  message: string;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function BehavioralRegenAlertBanner() {
  const qc = useQueryClient();

  const { data: activeAlert, isLoading } = useQuery({
    queryKey: ["behavioral-regen-active-alert"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<AlertRow | null> => {
      const { data, error } = await supabase
        .from("system_alerts")
        .select("id, severity, threshold_pct, consumed_pct, message, created_at, metadata")
        .eq("alert_type", "behavioral_regen_error_rate")
        .is("acknowledged_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as AlertRow | null) ?? null;
    },
  });

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
      qc.invalidateQueries({ queryKey: ["behavioral-regen-active-alert"] });
    },
    onError: (err: Error) => {
      toast.error("Falha ao reconhecer alerta", { description: err.message });
    },
  });

  if (isLoading || !activeAlert) return null;

  const isCritical = activeAlert.severity === "critical";
  const meta = (activeAlert.metadata ?? {}) as Record<string, unknown>;
  const failed = typeof meta.failed_runs === "number" ? meta.failed_runs : null;
  const total = typeof meta.total_runs === "number" ? meta.total_runs : null;

  return (
    <Alert
      variant={isCritical ? "destructive" : "default"}
      className={cn(
        !isCritical && "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200",
      )}
    >
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="flex items-center justify-between gap-4">
        <span>
          Taxa de erro do cron acima do limite ({Number(activeAlert.consumed_pct).toFixed(1)}% ›{" "}
          {Number(activeAlert.threshold_pct).toFixed(0)}%)
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ack.mutate(activeAlert.id)}
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
        {activeAlert.message}
        {failed !== null && total !== null && (
          <span className="ml-1 opacity-80">
            · Detectado em {new Date(activeAlert.created_at).toLocaleString("pt-BR")}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
}