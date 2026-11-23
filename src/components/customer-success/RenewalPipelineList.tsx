import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRenewals, type Renewal } from "@/hooks/useCustomerSuccess";
import { RenewalEditDialog } from "@/components/customer-success/RenewalEditDialog";
import { CalendarClock, AlertTriangle, DollarSign, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

const RISK_STYLES: Record<string, string> = {
  low: "bg-success/10 text-success border-success/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  high: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  critical: "bg-destructive/10 text-destructive border-destructive/30",
};

export function RenewalPipelineList({ daysAhead = 90 }: { daysAhead?: number }) {
  const { data, isLoading } = useRenewals(daysAhead);
  const [editing, setEditing] = useState<Pick<Renewal, "id" | "status" | "risk_level" | "forecasted_arr"> | null>(null);

  if (isLoading) return <Skeleton className="h-64" />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2"><CalendarClock className="h-4 w-4" />Renovações próximas ({daysAhead}d)</span>
          {data.at_risk_count > 0 && (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
              <AlertTriangle className="h-3 w-3 mr-1" />{data.at_risk_count} em risco
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground pt-1">
          <span><DollarSign className="h-3 w-3 inline" /> ARR previsto: <span className="font-semibold text-foreground tabular-nums">R$ {(data.total_arr / 1000).toFixed(0)}k</span></span>
          <span>Em risco: <span className="font-semibold text-destructive tabular-nums">R$ {(data.at_risk_arr / 1000).toFixed(0)}k</span></span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {data.renewals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma renovação próxima</p>
        ) : data.renewals.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
            <Link to={`/customer-success/account/${r.account_id}`} className="flex-1 min-w-0">
              <p className="font-medium truncate">{r.account_name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <span className="capitalize">{r.tier}</span>
                <span>•</span>
                <span>Health {r.health_score}</span>
                <span>•</span>
                <span>{r.days_until > 0 ? `${r.days_until}d` : "vencido"}</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 text-right">
              <div>
                <p className="font-semibold tabular-nums text-sm">R$ {(r.forecasted_arr / 1000).toFixed(0)}k</p>
                <Badge variant="outline" className={cn("text-[10px] capitalize mt-1", RISK_STYLES[r.risk_level])}>{r.risk_level}</Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Atualizar renovação de ${r.account_name}`}
                onClick={() => setEditing({ id: r.id, status: r.status, risk_level: r.risk_level, forecasted_arr: r.forecasted_arr })}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {editing && (
        <RenewalEditDialog renewal={editing} open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }} />
      )}
    </Card>
  );
}
