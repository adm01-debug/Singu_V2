import { useCadenceEnrollments } from '@/hooks/useCadenceEnrollments';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Workflow, Play, Pause, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

const statusIcons: Record<string, React.ReactNode> = {
  active: <Play className="h-3 w-3 text-green-500" />,
  paused: <Pause className="h-3 w-3 text-amber-500" />,
  completed: <CheckCircle2 className="h-3 w-3 text-blue-500" />,
};

export function CadenceEnrollmentsCard({ contactId }: Props) {
  const { data: enrollments, isLoading, error, refetch } = useCadenceEnrollments(contactId);

  return (
    <ExternalDataCard title="Cadências Ativas" icon={<Workflow className="h-4 w-4" />} isLoading={isLoading} error={error} onRetry={refetch} hasData={!!enrollments?.length} emptyMessage="Não inscrito em cadências">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><Workflow className="h-4 w-4" /> Cadências</span>
            <Badge variant="outline" className="text-[10px]">{enrollments?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {enrollments?.map(e => (
              <div key={e.id} className="flex items-center gap-2 p-2 rounded-md border border-border/50 hover:bg-muted/30 transition-colors">
                {statusIcons[e.status || ''] || <Workflow className="h-3 w-3 text-muted-foreground" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{e.cadence_name || 'Cadência'}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {e.current_step != null && e.total_steps != null && <span className="text-[10px] text-muted-foreground">Etapa {e.current_step}/{e.total_steps}</span>}
                    {e.next_action_at && <span className="text-[10px] text-muted-foreground">Próx: {format(new Date(e.next_action_at), 'dd/MM/yy')}</span>}
                  </div>
                </div>
                {e.status && <Badge variant="outline" className="text-[9px]">{e.status}</Badge>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
