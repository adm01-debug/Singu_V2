import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SIGNAL_TYPE_LABELS, type IntentSignal } from "@/hooks/useIntent";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity } from "lucide-react";

export function IntentSignalsTimeline({ signals }: { signals: IntentSignal[] }) {
  if (signals.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Nenhum sinal de intenção no período.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {signals.map((s) => {
        const url = (s.signal_value as { url?: string })?.url;
        return (
          <Card key={s.id} variant="outlined">
            <CardContent className="p-3 flex items-start gap-3">
              <Activity className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">
                    {SIGNAL_TYPE_LABELS[s.signal_type] ?? s.signal_type}
                  </span>
                  <Badge variant="secondary" className="text-xs">peso {s.weight}</Badge>
                  {s.signal_source && (
                    <span className="text-xs text-muted-foreground truncate">{s.signal_source}</span>
                  )}
                </div>
                {url && (
                  <p className="text-xs text-muted-foreground truncate mt-1">{url}</p>
                )}
              </div>
              <span className="text-xs text-muted-foreground shrink-0">
                {formatDistanceToNow(new Date(s.occurred_at), { addSuffix: true, locale: ptBR })}
              </span>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
