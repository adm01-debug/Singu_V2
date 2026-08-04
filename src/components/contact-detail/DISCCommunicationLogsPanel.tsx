import { MessageSquare, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useDISCCommunicationLogs } from '@/hooks/useDISCCommunicationLogs';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
}

const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  positive: { label: 'Positivo', color: 'text-success' },
  neutral: { label: 'Neutro', color: 'text-muted-foreground' },
  negative: { label: 'Negativo', color: 'text-destructive' },
};

export function DISCCommunicationLogsPanel({ contactId }: Props) {
  const { logs, loading, avgEffectiveness, adaptationRate } = useDISCCommunicationLogs(contactId);

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4 text-primary" />
          Logs de Comunicação DISC ({logs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length > 0 ? (
          <div className="space-y-3">
            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border p-2 text-center">
                <p className="text-lg font-bold text-foreground">{avgEffectiveness || '—'}</p>
                <p className="text-[10px] text-muted-foreground">Efetividade Média</p>
              </div>
              <div className="rounded-lg border p-2 text-center">
                <p className="text-lg font-bold text-foreground">{adaptationRate}%</p>
                <p className="text-[10px] text-muted-foreground">Taxa de Adaptação</p>
              </div>
            </div>

            {/* Recent logs */}
            <div className="space-y-1.5">
              {logs.slice(0, 5).map(log => {
                const outcome = OUTCOME_LABELS[log.communication_outcome || 'neutral'];
                return (
                  <div key={log.id} className="rounded-lg border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{log.contact_disc_profile}</Badge>
                        {log.approach_adapted && <CheckCircle className="h-3 w-3 text-success" />}
                      </div>
                      <span className={cn('text-xs', outcome?.color)}>{outcome?.label}</span>
                    </div>
                    {log.effectiveness_rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={log.effectiveness_rating * 10} className="h-1.5 flex-1" />
                        <span className="text-[10px] text-muted-foreground">{log.effectiveness_rating}/10</span>
                      </div>
                    )}
                    {log.outcome_notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{log.outcome_notes}</p>}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {format(new Date(log.created_at), "dd/MM HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">Nenhum log de comunicação DISC</p>
        )}
      </CardContent>
    </Card>
  );
}
