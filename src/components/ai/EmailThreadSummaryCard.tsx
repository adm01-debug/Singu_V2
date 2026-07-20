import { Sparkles, RefreshCw, CheckCircle2, ArrowRight, ListChecks, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEmailThreadSummary } from '@/hooks/useEmailThreadSummary';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
  subject: string;
  /** Se passado, usa interaction_id no payload em vez de (contact_id, subject) */
  interactionId?: string;
  /** Quantidade aproximada de mensagens na thread (mostrada no header) */
  threadCount?: number;
}

export function EmailThreadSummaryCard({ contactId, subject, interactionId, threadCount }: Props) {
  const { summary, loading, generate, generating } = useEmailThreadSummary({ contactId, subject });

  const handleGenerate = () =>
    generate(interactionId ? { interaction_id: interactionId } : { contact_id: contactId, subject });

  if (loading) return <Skeleton className="h-24 w-full" />;

  const threadCountSuffix = threadCount ? ` (${threadCount} msgs)` : '';

  if (!summary) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleGenerate}
        disabled={generating}
        className="gap-1.5"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {generating ? 'Resumindo thread…' : `Resumir thread${threadCountSuffix} com IA`}
      </Button>
    );
  }

  const sentimentColor = summary.sentiment?.startsWith('positivo')
    ? 'text-success'
    : summary.sentiment?.startsWith('negativo')
    ? 'text-destructive'
    : 'text-muted-foreground';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
            <Mail className="h-4 w-4 text-primary" />
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Resumo da Thread
            <Badge variant="secondary" className="text-[10px] ml-1">
              {summary.interaction_ids.length} msgs
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(summary.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            <Button
              variant="ghost"
              size="icon" aria-label="Regenerar"
              className="h-6 w-6"
              onClick={handleGenerate}
              disabled={generating}
              title="Regenerar"
            >
              <RefreshCw className={cn('h-3 w-3', generating && 'animate-spin')} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-3">
        <p className="text-xs text-foreground leading-relaxed">{summary.summary}</p>

        {summary.key_points.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <CheckCircle2 className="h-3 w-3" /> Pontos-chave
            </p>
            <ul className="space-y-0.5">
              {summary.key_points.map((p, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success mt-0.5 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.action_items.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <ListChecks className="h-3 w-3" /> Action Items
            </p>
            <ul className="space-y-1">
              {summary.action_items.map((item, i) => (
                <li key={i} className="text-xs flex items-start gap-1.5 bg-background/60 rounded p-1.5">
                  <ListChecks className="h-3 w-3 text-warning mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-foreground">{item.task}</span>
                    {item.responsible && item.responsible !== 'indefinido' && (
                      <span className="text-muted-foreground"> → {item.responsible}</span>
                    )}
                    {item.deadline && (
                      <span className="block text-muted-foreground text-[10px] mt-0.5">📅 {item.deadline}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.next_steps.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1">
              <ArrowRight className="h-3 w-3" /> Próximos Passos
            </p>
            <ul className="space-y-0.5">
              {summary.next_steps.map((s, i) => (
                <li key={i} className="text-xs text-foreground flex items-start gap-1.5">
                  <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.sentiment && (
          <div className="flex items-center justify-end pt-1 border-t">
            <span className={cn('text-[10px]', sentimentColor)}>{summary.sentiment}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
