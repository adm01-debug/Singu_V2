import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useScoreHistory } from '@/hooks/useScoreHistory';
import { format } from 'date-fns';

interface Props {
  contactId: string;
}

const SCORE_TYPE_LABELS: Record<string, string> = {
  relationship: 'Relacionamento',
  health: 'Saúde',
  closing: 'Fechamento',
  compatibility: 'Compatibilidade',
  rfm: 'RFM',
  neuro: 'NeuroScore',
};

export function ScoreHistoryPanel({ contactId }: Props) {
  const { history, loading } = useScoreHistory(contactId);

  if (!loading && history.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-primary" />
          Histórico de Scores ({history.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5 max-h-64 overflow-y-auto">
          {history.map(entry => {
            const diff = entry.previous_value != null
              ? Number(entry.score_value) - Number(entry.previous_value)
              : null;
            const TrendIcon = diff != null ? (diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus) : null;

            return (
              <div key={entry.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {SCORE_TYPE_LABELS[entry.score_type] || entry.score_type}
                  </Badge>
                  <span className="font-semibold text-foreground">{Number(entry.score_value)}</span>
                  {diff != null && TrendIcon && (
                    <span className={cn('flex items-center gap-0.5',
                      diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground'
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {format(new Date(entry.calculated_at), 'dd/MM HH:mm')}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
