import { useContactNpsSurveys } from '@/hooks/useContactNpsSurveys';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { format } from 'date-fns';

interface Props { contactId: string; }

function NpsGauge({ score }: { score: number }) {
  const color = score >= 9 ? 'text-green-500' : score >= 7 ? 'text-amber-500' : 'text-red-500';
  const label = score >= 9 ? 'Promotor' : score >= 7 ? 'Neutro' : 'Detrator';
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold ${color}`}>{score}</span>
      <Badge variant="outline" className={`text-[9px] ${color}`}>{label}</Badge>
    </div>
  );
}

export function NpsCard({ contactId }: Props) {
  const { data: surveys, isLoading, error, refetch } = useContactNpsSurveys(contactId);
  const latestScore = surveys?.[0]?.score;

  return (
    <ExternalDataCard title="NPS" icon={<BarChart3 className="h-4 w-4" />} isLoading={isLoading} error={error} onRetry={refetch} hasData={!!surveys?.length} emptyMessage="Nenhuma pesquisa NPS">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> NPS</span>
            <Badge variant="outline" className="text-[10px]">{surveys?.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {latestScore != null && (
            <div className="p-2 rounded-lg bg-muted/50 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Último NPS</span>
              <NpsGauge score={latestScore} />
            </div>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {surveys?.map(s => (
              <div key={s.id} className="p-2 rounded-md border border-border/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">Score: {s.score ?? '—'}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {s.responded_at ? format(new Date(s.responded_at), 'dd/MM/yy') : format(new Date(s.created_at), 'dd/MM/yy')}
                  </span>
                </div>
                {s.feedback && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{s.feedback}</p>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </ExternalDataCard>
  );
}
