import { useState } from 'react';
import { Sparkles, CheckCircle2, Circle, Users, Target, ArrowRight, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMeetingSummary } from '@/hooks/useMeetingSummary';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  interactionId: string;
  hasContent: boolean;
}

export function MeetingSummaryCard({ interactionId, hasContent }: Props) {
  const { summary, loading, generate, generating } = useMeetingSummary(interactionId);
  const [showFull, setShowFull] = useState(false);

  if (loading) {
    return <Skeleton className="h-24 w-full" />;
  }

  if (!summary && !hasContent) return null;

  if (!summary) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => { generate(interactionId).catch(() => {}); }}
        disabled={generating}
        className="gap-1.5 text-xs"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {generating ? 'Gerando resumo...' : 'Gerar Resumo com IA'}
      </Button>
    );
  }

  const sentimentColor = summary.sentiment_overview?.startsWith('positivo')
    ? 'text-success' : summary.sentiment_overview?.startsWith('negativo')
    ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Resumo IA
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon" aria-label="Atualizar"
              className="h-6 w-6"
              onClick={() => { generate(interactionId).catch(() => {}); }}
              disabled={generating}
              title="Regenerar"
            >
              <RefreshCw className={cn("h-3 w-3", generating && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        {/* Summary */}
        <p className={cn("text-xs text-foreground leading-relaxed", !showFull && "line-clamp-3")}>
          {summary.summary}
        </p>
        {summary.summary.length > 200 && (
          <button onClick={() => setShowFull(!showFull)} className="text-xs text-primary hover:underline">
            {showFull ? 'Ver menos' : 'Ver mais'}
          </button>
        )}

        {/* Topics */}
        {summary.topics.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {summary.topics.map((t, i) => (
              <Badge key={`${t}-${i}`} variant="secondary" className="text-[10px]">{t}</Badge>
            ))}
          </div>
        )}

        {/* Key Decisions */}
        {summary.key_decisions.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <Target className="h-3 w-3" /> Decisões
            </p>
            <ul className="space-y-0.5">
              {summary.key_decisions.map((d, i) => (
                <li key={`${d}-${i}`} className="text-xs text-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {summary.action_items.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <Circle className="h-3 w-3" /> Action Items
            </p>
            <ul className="space-y-1">
              {summary.action_items.map((item, i) => (
                <li key={`${item.task}-${i}`} className="text-xs flex items-start gap-1.5 bg-background/50 rounded p-1.5">
                  <Circle className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-foreground">{item.task}</span>
                    {item.responsible && item.responsible !== 'indefinido' && (
                      <span className="text-muted-foreground"> → {item.responsible}</span>
                    )}
                    {item.deadline && (
                      <span className="text-muted-foreground flex items-center gap-0.5 mt-0.5">
                        <Clock className="h-2.5 w-2.5" /> {item.deadline}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Next Steps */}
        {summary.next_steps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <ArrowRight className="h-3 w-3" /> Próximos Passos
            </p>
            <ul className="space-y-0.5">
              {summary.next_steps.map((s, i) => (
                <li key={`${s}-${i}`} className="text-xs text-foreground flex items-start gap-1.5">
                  <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1 border-t">
          {summary.participants.length > 0 && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {summary.participants.join(', ')}
            </span>
          )}
          <span className={cn("text-[10px]", sentimentColor)}>
            {summary.sentiment_overview}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
