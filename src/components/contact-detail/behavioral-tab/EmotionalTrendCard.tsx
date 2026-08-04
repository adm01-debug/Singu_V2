import { Heart, TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, AlertTriangle, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalDataCard } from '@/components/ui/external-data-card';
import { useEmotionalTrend } from '@/hooks/useEmotionalTrend';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
}

const EMOTION_ICONS: Record<string, typeof Smile> = { positive: Smile, negative: Frown, neutral: Meh };

export function EmotionalTrendCard({ contactId }: Props) {
  const { data, isLoading, error, refetch } = useEmotionalTrend(contactId);
  const icon = <Heart className="h-4 w-4 text-accent" />;

  return (
    <ExternalDataCard title="Tendência Emocional" icon={icon} isLoading={isLoading} error={error} hasData={!!data} emptyMessage="Sem dados de tendência emocional" onRetry={refetch}>
      {data && (() => {
        const TrendIcon = data.trend_direction === 'up' ? TrendingUp : data.trend_direction === 'down' ? TrendingDown : Minus;
        const EmotionIcon = EMOTION_ICONS[data.dominant_emotion || ''] || Meh;

        return (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">{icon} Tendência Emocional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <EmotionIcon className={cn('h-10 w-10', data.dominant_emotion === 'positive' ? 'text-success' : data.dominant_emotion === 'negative' ? 'text-destructive' : 'text-muted-foreground')} />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground capitalize">{data.dominant_emotion || 'Neutro'}</span>
                    <TrendIcon className={cn('h-4 w-4', data.trend_direction === 'up' ? 'text-success' : data.trend_direction === 'down' ? 'text-destructive' : 'text-muted-foreground')} />
                    {data.trend_strength != null && <span className="text-xs text-muted-foreground">({data.trend_strength}%)</span>}
                  </div>
                  {data.trend_status && <Badge variant="outline" className="text-[10px] mt-0.5">{data.trend_status}</Badge>}
                </div>
              </div>

              {data.total_interactions != null && data.total_interactions > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded border p-1.5"><p className="text-success font-semibold">{data.positive_interactions || 0}</p><p className="text-muted-foreground">Positivas</p></div>
                  <div className="rounded border p-1.5"><p className="text-muted-foreground font-semibold">{data.neutral_interactions || 0}</p><p className="text-muted-foreground">Neutras</p></div>
                  <div className="rounded border p-1.5"><p className="text-destructive font-semibold">{data.negative_interactions || 0}</p><p className="text-muted-foreground">Negativas</p></div>
                </div>
              )}

              {data.patterns_identified && data.patterns_identified.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Padrões Identificados</p>
                  <div className="flex flex-wrap gap-1">{data.patterns_identified.map((p, i) => <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>)}</div>
                </div>
              )}

              {data.triggers_positive && data.triggers_positive.length > 0 && (
                <div><p className="text-xs font-medium text-success mb-1">Gatilhos Positivos</p><ul className="space-y-0.5">{data.triggers_positive.slice(0, 3).map((t, i) => <li key={i} className="text-xs text-foreground">✓ {t}</li>)}</ul></div>
              )}

              {data.triggers_negative && data.triggers_negative.length > 0 && (
                <div><p className="text-xs font-medium text-destructive mb-1">Gatilhos Negativos</p><ul className="space-y-0.5">{data.triggers_negative.slice(0, 3).map((t, i) => <li key={i} className="text-xs text-muted-foreground">⚠ {t}</li>)}</ul></div>
              )}

              {data.alert_message && (
                <div className="flex items-start gap-1.5 bg-warning/10 rounded-md p-2">
                  <AlertTriangle className="h-3 w-3 mt-0.5 text-warning flex-shrink-0" />
                  <p className="text-xs text-foreground">{data.alert_message}</p>
                </div>
              )}

              {data.recommended_actions && data.recommended_actions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 mb-1"><Lightbulb className="h-3 w-3" /> Ações Recomendadas</p>
                  <ul className="space-y-0.5">{data.recommended_actions.slice(0, 3).map((a, i) => <li key={i} className="text-xs text-foreground">• {a}</li>)}</ul>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}
    </ExternalDataCard>
  );
}
