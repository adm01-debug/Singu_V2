import { useState } from 'react';
import type { CsatSurvey } from '@/hooks/useNpsSurveys';
import { useNpsSurveys } from '@/hooks/useNpsSurveys';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Props { survey: CsatSurvey | null; onOpenChange: (o: boolean) => void; }

export function AnswerSurveyDialog({ survey, onOpenChange }: Props) {
  const { answerSurvey } = useNpsSurveys();
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');

  if (!survey) return null;

  const handleSubmit = async () => {
    if (score == null) return;
    await answerSurvey({ id: survey.id, score, feedback });
    onOpenChange(false);
    setScore(null);
    setFeedback('');
  };

  return (
    <Dialog open={!!survey} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Resposta NPS</DialogTitle>
          <DialogDescription>De 0 a 10, qual a probabilidade de recomendar?</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs mb-2 block">Nota (0-10)</Label>
            <div className="grid grid-cols-11 gap-1">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setScore(i)}
                  className={cn(
                    'h-10 rounded text-sm font-semibold border transition',
                    score === i ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted',
                    i <= 6 && score !== i && 'text-destructive',
                    i >= 9 && score !== i && 'text-success',
                  )}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Detratores (0-6)</span><span>Neutros (7-8)</span><span>Promotores (9-10)</span>
            </div>
          </div>
          <div>
            <Label className="text-xs">Comentário (opcional)</Label>
            <Textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Por que essa nota?" className="text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={score == null}>Salvar Resposta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
