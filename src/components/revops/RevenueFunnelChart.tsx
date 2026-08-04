import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RevOpsKPIs } from "@/hooks/useRevOps";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "lead", label: "Leads", color: "bg-muted" },
  { key: "mql", label: "MQL", color: "bg-primary/30" },
  { key: "sql", label: "SQL", color: "bg-primary/60" },
  { key: "opp", label: "Oportunidades", color: "bg-primary/80" },
  { key: "won", label: "Clientes", color: "bg-success" },
] as const;

export function RevenueFunnelChart({ kpis }: { kpis: RevOpsKPIs }) {
  const counts: Record<string, number> = {
    lead: Math.max(kpis.mql_count, kpis.sql_count, kpis.opp_count, kpis.won_count, 1),
    mql: kpis.mql_count,
    sql: kpis.sql_count,
    opp: kpis.opp_count,
    won: kpis.won_count,
  };
  const max = Math.max(...Object.values(counts), 1);

  const conversions = [
    null,
    kpis.mql_to_sql_rate,
    kpis.sql_to_opp_rate,
    null,
    kpis.sql_to_won_rate,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funil de Receita</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {STAGES.map((s, i) => {
          const count = counts[s.key];
          const widthPct = Math.max(8, (count / max) * 100);
          const conv = conversions[i];
          const dropoff = conv != null && conv < 30;
          return (
            <div key={s.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">{count.toLocaleString("pt-BR")}</span>
                  {conv != null && (
                    <Badge variant={dropoff ? "destructive" : "secondary"} className="text-[10px]">
                      {conv.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </div>
              <div className="relative h-8 w-full rounded-md bg-muted/30 overflow-hidden">
                <div
                  className={cn("h-full transition-all", s.color, dropoff && "bg-destructive/40")}
                  style={{ width: `${widthPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
