import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQBRs } from "@/hooks/useCustomerSuccess";
import { CalendarDays, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_ICON = { scheduled: Clock, completed: CheckCircle2, cancelled: XCircle, no_show: XCircle };
const STATUS_COLOR: Record<string, string> = {
  scheduled: "text-primary",
  completed: "text-success",
  cancelled: "text-muted-foreground",
  no_show: "text-destructive",
};

export function QBRTimeline({ accountId }: { accountId?: string }) {
  const { data: qbrs = [], isLoading } = useQBRs(accountId);

  if (isLoading) return <Skeleton className="h-64" />;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="h-4 w-4" />Quarterly Business Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {qbrs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum QBR agendado</p>
        ) : qbrs.map((q) => {
          const Icon = STATUS_ICON[q.status];
          const color = STATUS_COLOR[q.status];
          return (
            <div key={q.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Icon className={`h-4 w-4 mt-0.5 ${color}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium truncate">{q.title}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{q.status.replace("_", " ")}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(new Date(q.scheduled_at), "dd MMM yyyy HH:mm", { locale: ptBR })}
                </p>
                {Array.isArray(q.outcomes) && q.outcomes.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{q.outcomes.length} outcomes registrados</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
