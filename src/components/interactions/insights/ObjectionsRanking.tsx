import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ObjectionAggregate } from "@/hooks/useInteractionsInsights";

interface Props {
  objections: ObjectionAggregate[];
}

function ObjectionsRankingImpl({ objections }: Props) {
  if (!objections.length) {
    return <p className="text-sm text-muted-foreground text-center py-8">Nenhuma objeção identificada no período.</p>;
  }
  return (
    <ul className="space-y-2">
      {objections.map((o) => {
        const handledPct = o.count ? Math.round((o.handled / o.count) * 100) : 0;
        return (
          <li key={o.objection} className="rounded-md border border-border/60 bg-card p-3 space-y-2">
            <div className="flex items-start gap-2">
              {o.unhandled > 0 ? (
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{o.objection}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{o.category}</Badge>
                  <span className="text-[11px] text-muted-foreground">{o.count}× mencionada</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-destructive/30 overflow-hidden">
                <div className="h-full bg-success" style={{ width: `${handledPct}%` }} />
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums">{handledPct}% tratada</span>
            </div>

            {o.suggestedResponse && o.unhandled > 0 && (
              <p className="text-[11px] text-muted-foreground border-l-2 border-warning pl-2 italic">
                💡 {o.suggestedResponse}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export const ObjectionsRanking = memo(ObjectionsRankingImpl);
