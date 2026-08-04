import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useHealthSignals } from "@/hooks/useCustomerSuccess";
import { Activity, MessageCircle, LifeBuoy, Heart, CreditCard, Star } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const TYPE_ICON = { usage: Activity, support: LifeBuoy, engagement: MessageCircle, sentiment: Heart, payment: CreditCard, nps: Star };

export function HealthSignalTimeline({ accountId }: { accountId: string }) {
  const { data: signals = [], isLoading } = useHealthSignals(accountId);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Timeline de Sinais (90d)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {signals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum sinal registrado</p>
        ) : signals.slice(0, 50).map((s) => {
          const Icon = TYPE_ICON[s.signal_type as keyof typeof TYPE_ICON] || Activity;
          const scoreColor = s.score >= 70 ? "text-success" : s.score >= 40 ? "text-warning" : "text-destructive";
          return (
            <div key={s.id} className="flex items-center gap-3 py-2 px-3 rounded border bg-card">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] capitalize">{s.signal_type}</Badge>
                  <span className="text-xs text-muted-foreground">peso {s.weight}</span>
                  {s.source && <span className="text-xs text-muted-foreground truncate">· {s.source}</span>}
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {format(new Date(s.captured_at), "dd MMM HH:mm", { locale: ptBR })}
                </p>
              </div>
              <span className={cn("font-bold tabular-nums text-sm", scoreColor)}>{Math.round(Number(s.score))}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
