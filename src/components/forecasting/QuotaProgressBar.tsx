import { Card, CardContent } from "@/components/ui/card";

export function QuotaProgressBar({ commit, won, quota }: { commit: number; won: number; quota: number }) {
  const pct = quota > 0 ? Math.min(100, ((commit + won) / quota) * 100) : 0;
  const wonPct = quota > 0 ? (won / quota) * 100 : 0;
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium">Quota Attainment</span>
          <span className="text-2xl font-bold">{Math.round(pct)}%</span>
        </div>
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-success" style={{ width: `${wonPct}%` }} />
          <div className="absolute inset-y-0 bg-primary" style={{ left: `${wonPct}%`, width: `${pct - wonPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Won: R$ {won.toLocaleString("pt-BR")}</span>
          <span>Commit: R$ {commit.toLocaleString("pt-BR")}</span>
          <span>Quota: R$ {quota.toLocaleString("pt-BR")}</span>
        </div>
      </CardContent>
    </Card>
  );
}
