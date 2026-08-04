import { Brain, TrendingUp, TrendingDown, Minus, CheckCircle, XCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useEqEvolution } from '@/hooks/useEqEvolution';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string }> = {
  growing: { icon: TrendingUp, color: 'text-success' },
  stable: { icon: Minus, color: 'text-muted-foreground' },
  declining: { icon: TrendingDown, color: 'text-destructive' },
  improving: { icon: TrendingUp, color: 'text-success' },
  needs_work: { icon: AlertCircle, color: 'text-warning' },
  strong: { icon: CheckCircle, color: 'text-success' },
};

const PILLAR_LABELS: Record<string, string> = {
  sa: 'Autoconsciência', sm: 'Autogestão', soa: 'Consciência Social', rm: 'Gestão de Relacionamentos',
};

export function EqEvolutionCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useEqEvolution(contactId);
  const icon = <Brain className="h-4 w-4 text-primary" />;

  return (
    <ExternalDataCard title="Evolução de Inteligência Emocional" icon={icon} isLoading={isLoading} error={error} hasData={!!data} emptyMessage="Sem dados de EQ" onRetry={refetch} skeletonHeight="h-48">
      {data && (() => {
        const pillars = [
          { key: 'sa', score: data.self_awareness_score, status: data.sa_status },
          { key: 'sm', score: data.self_management_score, status: data.sm_status },
          { key: 'soa', score: data.social_awareness_score, status: data.soa_status },
          { key: 'rm', score: data.relationship_management_score, status: data.rm_status },
        ];

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">{icon} Evolução de Inteligência Emocional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary/20">
                  <span className="text-xl font-bold text-primary">{data.current_eq_score ?? '—'}</span>
                </div>
                <div>
                  {data.current_eq_level && <Badge variant="outline" className="text-xs">{data.current_eq_level}</Badge>}
                  {data.confidence_level != null && <p className="text-xs text-muted-foreground mt-0.5">Confiança: {data.confidence_level}%</p>}
                  {data.preferred_approach && <p className="text-xs text-muted-foreground">Abordagem: {data.preferred_approach}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Pilares de EQ</p>
                {pillars.map(({ key, score, status }) => {
                  if (score == null) return null;
                  const cfg = STATUS_CONFIG[status || ''] || STATUS_CONFIG.stable;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{PILLAR_LABELS[key]}</span>
                        <div className="flex items-center gap-1"><StatusIcon className={cn('h-3 w-3', cfg.color)} /><span className="font-medium">{score}%</span></div>
                      </div>
                      <Progress value={score} className="h-1.5" />
                    </div>
                  );
                })}
              </div>

              {data.recommended_techniques && data.recommended_techniques.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><Lightbulb className="h-3 w-3" /> Técnicas Recomendadas</p>
                  <div className="flex flex-wrap gap-1">{data.recommended_techniques.slice(0, 4).map((t, i) => <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
                </div>
              )}

              {data.avoid_techniques && data.avoid_techniques.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-destructive flex items-center gap-1 mb-1"><XCircle className="h-3 w-3" /> Evitar</p>
                  <div className="flex flex-wrap gap-1">{data.avoid_techniques.slice(0, 3).map((t, i) => <Badge key={i} variant="outline" className="text-[10px] text-destructive border-destructive/30">{t}</Badge>)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </ExternalDataCard>
  );
}
