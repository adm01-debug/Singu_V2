import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radar } from "lucide-react";
import { useIntentScore, SIGNAL_TYPE_LABELS, type IntentScope } from "@/hooks/useIntent";
import { IntentScoreBadge } from "./IntentScoreBadge";

interface Props {
  scope: IntentScope;
  scopeId: string | undefined;
  title?: string;
}

export function IntentSignalCard({ scope, scopeId, title = "Intent Data" }: Props) {
  const { data: score, isLoading } = useIntentScore(scope, scopeId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Radar className="h-4 w-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Calculando…</p>
        ) : !score ? (
          <p className="text-sm text-muted-foreground">Sem sinais de intenção registrados.</p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <IntentScoreBadge score={score.intent_score} trend={score.score_trend} />
              <span className="text-xs text-muted-foreground">{score.signal_count_30d} sinais · 30d</span>
            </div>
            {Array.isArray(score.top_signals) && score.top_signals.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top sinais</p>
                <div className="flex flex-wrap gap-1.5">
                  {score.top_signals.map((s) => (
                    <Badge key={s.type} variant="secondary" className="text-xs">
                      {SIGNAL_TYPE_LABELS[s.type] ?? s.type} · {s.weight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
