import { Clock, AlertTriangle, Calendar, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePendingFollowups } from '@/hooks/usePendingFollowups';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  high: { color: 'border-destructive/50 bg-destructive/5', label: 'Alta' },
  medium: { color: 'border-warning/50 bg-warning/5', label: 'Média' },
  low: { color: 'border-muted bg-muted/30', label: 'Baixa' },
};

export function PendingFollowupsWidget() {
  const { data: followups = [], isLoading } = usePendingFollowups(10);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-3"><div className="h-4 w-36 bg-muted rounded" /></CardHeader>
        <CardContent><div className="h-40 bg-muted rounded" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-warning" />
            Follow-ups Pendentes
          </div>
          {followups.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{followups.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {followups.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Nenhum follow-up pendente 🎉</p>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2">
              {followups.map((f) => {
                const prio = PRIORITY_CONFIG[f.priority || 'low'] || PRIORITY_CONFIG.low;
                const isOverdue = (f.days_overdue ?? 0) > 0;

                return (
                  <div key={f.interaction_id} className={cn('rounded-lg border p-2.5 text-sm', prio.color)}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium text-xs truncate">{f.contact_name}</span>
                          {f.contact_disc && (
                            <Badge variant="outline" className="text-[9px] px-1">{f.contact_disc}</Badge>
                          )}
                        </div>
                        {f.interaction_title && (
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{f.interaction_title}</p>
                        )}
                        {f.company_name && (
                          <p className="text-[10px] text-muted-foreground truncate">{f.company_name}</p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        {f.follow_up_date && (
                          <p className="text-[10px] text-muted-foreground">
                            <Calendar className="h-2.5 w-2.5 inline mr-0.5" />
                            {format(parseISO(f.follow_up_date), 'dd/MM')}
                          </p>
                        )}
                        {isOverdue && (
                          <Badge variant="destructive" className="text-[9px] mt-0.5">
                            <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
                            {f.days_overdue}d atraso
                          </Badge>
                        )}
                      </div>
                    </div>
                    {f.closing_score != null && (
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                        <ChevronRight className="h-2.5 w-2.5" />
                        Closing Score: <span className="font-medium">{f.closing_score}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
