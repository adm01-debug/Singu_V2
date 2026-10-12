import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useSequencePausedEmails } from '@/hooks/useSequences';

export function SequencePausedEmails({ sequenceId, active }: { sequenceId: string; active: boolean }) {
  const { data: rows = [], isLoading, error, refetch, resume, resuming } = useSequencePausedEmails(sequenceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rows.find(row => row.enrollmentId === selectedId);

  async function confirmResume() {
    if (!selected?.pausedAt) return;
    try {
      await resume({ enrollmentId: selected.enrollmentId, currentStep: selected.currentStep, pausedAt: selected.pausedAt });
      setSelectedId(null);
    } catch {
      // A pausa permanece visível e o hook apresenta o erro.
    }
  }

  return (
    <section aria-label="Emails pausados" className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Emails pausados</h4>
      <p className="text-xs text-muted-foreground">Revise a integração antes de retomar. O processamento tentará confirmar o envio existente ou usar a mesma chave de envio; esta ação não confirma uma entrega.</p>
      {!active && <p className="text-xs text-muted-foreground">Ative a sequência para retomar as inscrições.</p>}
      {isLoading ? <p role="status" className="text-xs">Carregando pausas…</p> : error ? (
        <div role="alert" className="text-xs text-destructive">
          Não foi possível consultar os emails pausados.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      ) : rows.length === 0 ? <p className="text-xs text-muted-foreground">Nenhum email aguarda retomada.</p> : (
        <ul className="space-y-2">
          {rows.map(row => (
            <li key={row.enrollmentId} className="rounded-md border p-3 space-y-2 text-xs">
              <Link to={`/contatos/${row.contactId}`} className="font-medium underline">{row.contactName}</Link>
              {row.email && <p className="text-muted-foreground">{row.email}</p>}
              <p>Etapa {row.currentStep + 1} · {row.reason}</p>
              {!row.valid && <p role="alert" className="text-destructive">Contato, etapa ou pausa alterados. Revise a inscrição.</p>}
              <Button size="sm" variant="outline" disabled={!active || !row.valid || resuming}
                onClick={() => setSelectedId(row.enrollmentId)}>Retomar email</Button>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={!!selected} onOpenChange={value => { if (!value && !resuming) setSelectedId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retomar processamento de email</AlertDialogTitle>
            <AlertDialogDescription>
              Você revisou a integração e o endereço de {selected?.contactName}?
              A inscrição voltará ao processamento. Se o provedor continuar indisponível, será pausada novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resuming}>Cancelar</AlertDialogCancel>
            <Button onClick={() => void confirmResume()} disabled={resuming || !active || !selected?.valid}>
              {resuming ? 'Registrando…' : 'Revisei — retomar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
