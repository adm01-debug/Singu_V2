import { useState } from 'react';
import { Star, Plus, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCSATSurveys } from '@/hooks/useCSATSurveys';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SCORE_LABELS = ['', '😡 Péssimo', '😞 Ruim', '😐 Neutro', '😊 Bom', '🤩 Excelente'];
const SCORE_COLORS = ['', 'text-red-500', 'text-orange-500', 'text-yellow-500', 'text-green-500', 'text-emerald-500'];

interface Props {
  contactId: string;
  interactionId?: string;
}

export function CSATPanel({ contactId, interactionId }: Props) {
  const { surveys, send, answer, stats } = useCSATSurveys(contactId);
  const [pendingScore, setPendingScore] = useState<Record<string, number>>({});
  const [pendingFeedback] = useState<Record<string, string>>({});

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" />
            Satisfação (CSAT)
          </span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => send.mutate({ contactId, interactionId })}
            disabled={send.isPending}
          >
            <Plus className="h-3 w-3 mr-1" /> Criar Pesquisa
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{stats.avgScore.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Score Médio</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{stats.responseRate}%</p>
            <p className="text-[10px] text-muted-foreground">Taxa Resposta</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-muted/30">
            <p className="text-lg font-bold">{stats.answered}/{stats.total}</p>
            <p className="text-[10px] text-muted-foreground">Respondidas</p>
          </div>
        </div>

        {/* Survey list */}
        {surveys.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">Nenhuma pesquisa criada.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {surveys.slice(0, 10).map(survey => (
              <div key={survey.id} className="border rounded-md p-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant={survey.status === 'answered' ? 'default' : survey.status === 'sent' ? 'secondary' : 'outline'} className="text-[10px] h-4">
                    {survey.status === 'answered' ? 'Respondida' : survey.status === 'sent' ? 'Enviada' : survey.status === 'expired' ? 'Expirada' : 'Pendente'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(survey.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>

                {survey.score ? (
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= survey.score! ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${SCORE_COLORS[survey.score]}`}>
                      {SCORE_LABELS[survey.score]}
                    </span>
                  </div>
                ) : survey.status === 'pending' || survey.status === 'sent' ? (
                  <div className="space-y-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button
                          key={s}

                          onClick={() => setPendingScore(prev => ({ ...prev, [survey.id]: s }))}
                          className="p-0.5"
                          aria-label={`Nota ${s} ${s === 1 ? 'estrela' : 'estrelas'}`}
                        >
                          <Star className={`h-4 w-4 transition-colors ${s <= (pendingScore[survey.id] || 0) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30 hover:text-yellow-500/50'}`} />
                        </button>
                      ))}
                    </div>
                    {pendingScore[survey.id] && (
                      <Button
                        size="sm"
                        className="h-6 text-[10px]"
                        disabled={answer.isPending}
                        onClick={() => {
                          answer.mutate({ id: survey.id, score: pendingScore[survey.id], feedback: pendingFeedback[survey.id] }, {
                            onSuccess: () => setPendingScore(prev => { const n = { ...prev }; delete n[survey.id]; return n; }),
                          });
                        }}
                      >
                        Registrar Resposta
                      </Button>
                    )}
                  </div>
                ) : null}

                {survey.feedback && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <MessageSquare className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground">{survey.feedback}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
