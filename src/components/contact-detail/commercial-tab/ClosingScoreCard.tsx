import { Trophy, Eye, Ear, Hand } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useClosingScoreView } from '@/hooks/useClosingScoreView';

interface Props {
  contactId: string;
}

export function ClosingScoreCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useClosingScoreView(contactId);

  const icon = <Trophy className="h-4 w-4 text-warning" />;

  return (
    <ExternalDataCard
      title="Score de Fechamento"
      icon={icon}
      isLoading={isLoading}
      error={error}
      hasData={!!data}
      emptyMessage="Sem dados de score de fechamento"
      onRetry={refetch}
    >
      {data && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              {icon}
              Score de Fechamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-warning/30">
                <span className="text-xl font-bold text-warning">{data.closing_score ?? '—'}</span>
              </div>
              <div className="flex-1">
                {data.ranking_geral && (
                  <p className="text-xs text-muted-foreground">
                    Ranking geral: <span className="font-semibold text-foreground">#{data.ranking_geral}</span>
                  </p>
                )}
                {data.ranking_segmento && (
                  <p className="text-xs text-muted-foreground">
                    No segmento: <span className="font-semibold text-foreground">#{data.ranking_segmento}</span>
                  </p>
                )}
                {data.disc_type && (
                  <Badge variant="outline" className="text-[10px] mt-1">DISC: {data.disc_type}</Badge>
                )}
              </div>
            </div>

            {(data.visual_score != null || data.auditory_score != null || data.kinesthetic_score != null) && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Perfil VAK</p>
                {[
                  { label: 'Visual', score: data.visual_score, icon: Eye },
                  { label: 'Auditivo', score: data.auditory_score, icon: Ear },
                  { label: 'Cinestésico', score: data.kinesthetic_score, icon: Hand },
                ].map(({ label, score, icon: Icon }) => score != null && (
                  <div key={label} className="flex items-center gap-2">
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="w-20 text-xs text-muted-foreground">{label}</span>
                    <Progress value={score} className="h-1.5 flex-1" />
                    <span className="w-8 text-right text-xs">{score}%</span>
                  </div>
                ))}
              </div>
            )}

            {data.interactions_30d != null && (
              <p className="text-xs text-muted-foreground">
                {data.interactions_30d} interações nos últimos 30 dias
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </ExternalDataCard>
  );
}
