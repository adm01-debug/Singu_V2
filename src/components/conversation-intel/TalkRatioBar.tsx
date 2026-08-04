import { cn } from "@/lib/utils";

export function TalkRatioBar({ rep, customer, className }: { rep: number | null; customer: number | null; className?: string }) {
  const r = Math.max(0, Math.min(100, Number(rep ?? 50)));
  const c = Math.max(0, Math.min(100, Number(customer ?? 50)));
  const ideal = r >= 35 && r <= 55;
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Vendedor <span className="font-semibold text-foreground tabular-nums">{r.toFixed(0)}%</span></span>
        <span className="text-muted-foreground">Cliente <span className="font-semibold text-foreground tabular-nums">{c.toFixed(0)}%</span></span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("transition-all", ideal ? "bg-success" : r > 65 ? "bg-destructive" : "bg-primary")} style={{ width: `${r}%` }} />
        <div className="bg-accent transition-all" style={{ width: `${c}%` }} />
      </div>
      {!ideal && (
        <p className="text-[10px] text-warning">
          {r > 65 ? "Vendedor falou demais — reduza monólogos" : "Cliente dominou a conversa — faça mais perguntas direcionadas"}
        </p>
      )}
    </div>
  );
}
