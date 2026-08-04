import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNPS } from "@/hooks/useCustomerSuccess";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Smile, Meh, Frown } from "lucide-react";

export function NPSDistributionChart({ accountId }: { accountId?: string }) {
  const { data: responses = [], isLoading } = useNPS(accountId);

  const stats = useMemo(() => {
    const total = responses.length;
    const promoters = responses.filter(r => r.category === "promoter").length;
    const passives = responses.filter(r => r.category === "passive").length;
    const detractors = responses.filter(r => r.category === "detractor").length;
    const npsScore = total > 0 ? Math.round(((promoters - detractors) / total) * 100) : 0;
    const avgScore = total > 0 ? (responses.reduce((s, r) => s + r.score, 0) / total).toFixed(1) : "0.0";
    return { total, promoters, passives, detractors, npsScore, avgScore, pPct: total ? (promoters / total) * 100 : 0, paPct: total ? (passives / total) * 100 : 0, dPct: total ? (detractors / total) * 100 : 0 };
  }, [responses]);

  if (isLoading) return <Skeleton className="h-64" />;

  const npsColor = stats.npsScore >= 50 ? "text-success" : stats.npsScore >= 0 ? "text-warning" : "text-destructive";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">NPS — Net Promoter Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-4xl font-bold tabular-nums ${npsColor}`}>{stats.npsScore}</p>
            <p className="text-xs text-muted-foreground">{stats.total} respostas · média {stats.avgScore}/10</p>
          </div>
        </div>

        {stats.total > 0 && (
          <>
            <div className="flex h-3 rounded-full overflow-hidden bg-muted">
              <div className="bg-success" style={{ width: `${stats.pPct}%` }} />
              <div className="bg-warning" style={{ width: `${stats.paPct}%` }} />
              <div className="bg-destructive" style={{ width: `${stats.dPct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded bg-success/5"><Smile className="h-4 w-4 text-success mx-auto mb-1" /><p className="font-bold text-success tabular-nums">{stats.promoters}</p><p className="text-muted-foreground">Promotores</p></div>
              <div className="p-2 rounded bg-warning/5"><Meh className="h-4 w-4 text-warning mx-auto mb-1" /><p className="font-bold text-warning tabular-nums">{stats.passives}</p><p className="text-muted-foreground">Neutros</p></div>
              <div className="p-2 rounded bg-destructive/5"><Frown className="h-4 w-4 text-destructive mx-auto mb-1" /><p className="font-bold text-destructive tabular-nums">{stats.detractors}</p><p className="text-muted-foreground">Detratores</p></div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
