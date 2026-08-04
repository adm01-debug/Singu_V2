import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { cn } from '@/lib/utils';
import type { EvidenceKind } from './EvidenceDrillDownSheet';
import {
  useInsightFeedback,
  useRemoveInsightFeedback,
  useSubmitInsightFeedback,
  type InsightVote,
} from '@/hooks/useInsightFeedback';

interface Props {
  contactId: string;
  kind: EvidenceKind;
  label: string;
}

export function InsightFeedbackControls({ contactId, kind, label }: Props) {
  const { data: existing, isLoading } = useInsightFeedback(contactId, kind, label);
  const submit = useSubmitInsightFeedback();
  const remove = useRemoveInsightFeedback();

  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setNote(existing?.note ?? '');
    setShowNote(false);
  }, [existing?.id, existing?.note, contactId, kind, label]);

  const currentVote = existing?.vote ?? null;

  async function handleVote(vote: InsightVote) {
    // Toggle off
    if (currentVote === vote) {
      try {
        await remove.mutateAsync({ contactId, kind, label });
        toast.success('Feedback removido');
        setShowNote(false);
      } catch (e) {
        toast.error('Erro ao remover feedback', { description: parseApiError(e) });
      }
      return;
    }
    try {
      await submit.mutateAsync({ contactId, kind, label, vote, note: note.trim() || null });
      toast.success(vote === 1 ? 'Insight marcado como útil' : 'Feedback registrado — a análise será refinada');
      if (vote === -1) setShowNote(true);
    } catch (e) {
      toast.error('Erro ao enviar feedback', { description: parseApiError(e) });
    }
  }

  async function handleSaveNote() {
    if (!currentVote) return;
    try {
      await submit.mutateAsync({ contactId, kind, label, vote: currentVote, note: note.trim() || null });
      toast.success('Observação salva');
      setShowNote(false);
    } catch (e) {
      toast.error('Erro ao salvar observação', { description: parseApiError(e) });
    }
  }

  const busy = submit.isPending || remove.isPending || isLoading;

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Este insight é preciso?</p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={currentVote === 1 ? 'default' : 'outline'}
            className={cn('h-8 gap-1.5 px-2', currentVote === 1 && 'bg-emerald-600 hover:bg-emerald-700')}
            disabled={busy}
            onClick={() => handleVote(1)}
            aria-pressed={currentVote === 1}
            aria-label="Marcar insight como útil"
          >
            {submit.isPending && submit.variables?.vote === 1 ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ThumbsUp className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">Útil</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant={currentVote === -1 ? 'default' : 'outline'}
            className={cn('h-8 gap-1.5 px-2', currentVote === -1 && 'bg-destructive hover:bg-destructive/90')}
            disabled={busy}
            onClick={() => handleVote(-1)}
            aria-pressed={currentVote === -1}
            aria-label="Marcar insight como impreciso"
          >
            {submit.isPending && submit.variables?.vote === -1 ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ThumbsDown className="h-3.5 w-3.5" />
            )}
            <span className="text-xs">Impreciso</span>
          </Button>
        </div>
      </div>

      {currentVote && !showNote && (
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-600" />
            Feedback registrado{existing?.note ? ' com observação' : ''}.
          </span>
          <button
            type="button"
            className="text-primary underline-offset-2 hover:underline"
            onClick={() => setShowNote(true)}
          >
            {existing?.note ? 'Editar observação' : 'Adicionar observação'}
          </button>
        </div>
      )}

      {showNote && currentVote && (
        <div className="mt-2 space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 1000))}
            placeholder={
              currentVote === -1
                ? 'Por que este insight está impreciso? (opcional, ajuda a refinar futuras análises)'
                : 'Comentário opcional...'
            }
            rows={3}
            className="text-sm"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7"
              onClick={() => {
                setNote(existing?.note ?? '');
                setShowNote(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7"
              disabled={submit.isPending}
              onClick={handleSaveNote}
            >
              {submit.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}