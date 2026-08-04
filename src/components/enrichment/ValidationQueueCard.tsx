import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Play, ListChecks } from "lucide-react";
import { useValidationQueueStats, useTriggerQueueWorker } from "@/hooks/useValidationQueue";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function ValidationQueueCard() {
  const { data: stats, isLoading } = useValidationQueueStats();
  const trigger = useTriggerQueueWorker();
  const { isAdmin } = useIsAdmin();

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          Fila de validação (24h)
        </CardTitle>
        {isAdmin && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => trigger.mutate()}
            disabled={trigger.isPending}
          >
            {trigger.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            <span className="ml-1.5">Processar agora</span>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando…</p>
        ) : !stats || stats.total === 0 ? (
          <p className="text-xs text-muted-foreground">
            Nenhuma validação enfileirada nas últimas 24h. Edite ou crie um contato com email/telefone para disparar.
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            <StatBlock label="Pendentes" value={stats.pending} variant="secondary" />
            <StatBlock label="Processando" value={stats.processing} variant="default" />
            <StatBlock label="Concluídos" value={stats.done} variant="success" />
            <StatBlock label="Erros" value={stats.error} variant="destructive" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatBlock({ label, value, variant }: { label: string; value: number; variant: "default" | "secondary" | "success" | "destructive" }) {
  const cls =
    variant === "success" ? "bg-success/10 text-success border-success/20"
    : variant === "destructive" ? "bg-destructive/10 text-destructive border-destructive/20"
    : variant === "default" ? "bg-primary/10 text-primary border-primary/20"
    : "bg-muted text-muted-foreground border-border";
  return (
    <div className={`rounded-md border px-2 py-1.5 ${cls}`}>
      <p className="text-[10px] uppercase tracking-wide opacity-80">{label}</p>
      <p className="text-lg font-semibold leading-tight">{value}</p>
    </div>
  );
}
