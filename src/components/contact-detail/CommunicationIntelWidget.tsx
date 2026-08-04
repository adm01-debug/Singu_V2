import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useCommunicationIntel } from '@/hooks/useCommunicationIntelView';
import { Radio, Clock, TrendingUp, MessageSquare } from 'lucide-react';

const DAY_LABELS: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
};

export const CommunicationIntelWidget = React.memo(function CommunicationIntelWidget({ contactId }: { contactId: string }) {
  const { data, isLoading } = useCommunicationIntel(contactId);

  if (isLoading) return <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Intel de Comunicação</CardTitle></CardHeader><CardContent><Skeleton className="h-32" /></CardContent></Card>;
  if (!data) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2"><Radio className="h-4 w-4 text-primary" />Intel de Comunicação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {data.preferred_channel && (
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <MessageSquare className="h-4 w-4 mx-auto mb-1 text-primary" />
              <p className="text-xs font-semibold capitalize">{data.preferred_channel}</p>
              <p className="text-[10px] text-muted-foreground">Canal Preferido</p>
            </div>
          )}
          {data.best_day && (
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <Clock className="h-4 w-4 mx-auto mb-1 text-info" />
              <p className="text-xs font-semibold">{DAY_LABELS[data.best_day.toLowerCase()] || data.best_day}{data.best_time ? ` ${data.best_time}` : ''}</p>
              <p className="text-[10px] text-muted-foreground">Melhor Momento</p>
            </div>
          )}
          {data.avg_response_time_minutes != null && (
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <TrendingUp className="h-4 w-4 mx-auto mb-1 text-success" />
              <p className="text-xs font-semibold">{Math.round(data.avg_response_time_minutes)}min</p>
              <p className="text-[10px] text-muted-foreground">Tempo Resposta</p>
            </div>
          )}
          {data.success_rate != null && (
            <div className="rounded-lg bg-muted/30 p-2.5 text-center">
              <p className="text-sm font-bold text-primary">{(data.success_rate * 100).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">Taxa de Sucesso</p>
            </div>
          )}
        </div>
        {data.channel_breakdown && Object.keys(data.channel_breakdown).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground uppercase">Canais</p>
            {Object.entries(data.channel_breakdown).map(([ch, cnt]) => (
              <div key={ch} className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground capitalize w-16 truncate">{ch}</span>
                <Progress value={Math.min(100, ((cnt as number) / (data.total_interactions || 1)) * 100)} className="h-1.5 flex-1" />
                <span className="text-[10px] tabular-nums text-foreground">{cnt as number}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default CommunicationIntelWidget;
