import { Radio, Clock, Zap, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useCommunicationDashboard } from '@/hooks/useCommunicationDashboard';

interface Props {
  contactId: string;
}

export function CommunicationDashboardCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useCommunicationDashboard(contactId);
  const icon = <Radio className="h-4 w-4 text-info" />;

  return (
    <ExternalDataCard title="Dashboard de Comunicação" icon={icon} isLoading={isLoading} error={error} hasData={!!data} emptyMessage="Sem dados de comunicação" onRetry={refetch}>
      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">{icon} Dashboard de Comunicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              {data.disc_type && <div className="rounded border p-1.5"><p className="text-muted-foreground">DISC</p><p className="font-semibold text-foreground">{data.disc_type}</p></div>}
              {data.vak_type && <div className="rounded border p-1.5"><p className="text-muted-foreground">VAK</p><p className="font-semibold text-foreground">{data.vak_type}</p></div>}
              {data.eq_level && <div className="rounded border p-1.5"><p className="text-muted-foreground">EQ</p><p className="font-semibold text-foreground">{data.eq_level}</p></div>}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {data.pace && <div className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Ritmo:</span><span className="font-medium text-foreground">{data.pace}</span></div>}
              {data.tone && <div className="flex items-center gap-1.5"><MessageSquare className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Tom:</span><span className="font-medium text-foreground">{data.tone}</span></div>}
              {data.decision_style && <div className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-muted-foreground" /><span className="text-muted-foreground">Decisão:</span><span className="font-medium text-foreground">{data.decision_style}</span></div>}
              {data.rapport_score != null && <div className="flex items-center gap-1.5"><span className="text-muted-foreground">Rapport:</span><span className="font-medium text-foreground">{data.rapport_score}</span>{data.rapport_level && <Badge variant="outline" className="text-[10px]">{data.rapport_level}</Badge>}</div>}
            </div>

            {data.approach_summary && <p className="text-xs text-foreground bg-muted/50 rounded-md p-2">{data.approach_summary}</p>}
            {data.communication_action && <div className="text-xs text-primary bg-primary/5 rounded-md p-2 font-medium">💡 {data.communication_action}</div>}
          </CardContent>
        </Card>
      )}
    </ExternalDataCard>
  );
}
