import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useSequenceManualSteps } from '@/hooks/useSequences';

const CHANNEL_LABELS: Record<string, string> = {
  call: 'Ligação', phone: 'Ligação', whatsapp: 'WhatsApp', linkedin: 'LinkedIn', sms: 'SMS', task: 'Tarefa',
};

export function SequenceManualSteps({ sequenceId, active }: { sequenceId: string; active: boolean }) {
  const { data: tasks = [], isLoading, error, refetch, confirm, confirming } = useSequenceManualSteps(sequenceId);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const selected = tasks.find(task => task.enrollmentId === selectedId);

  async function confirmExecution() {
    if (!selected) return;
    try {
      await confirm({ enrollmentId: selected.enrollmentId, stepId: selected.stepId, note });
      setSelectedId(null);
      setNote('');
    } catch {
      // O hook mantém a tarefa pendente e apresenta o erro.
    }
  }

  return (
    <section aria-label="Etapas manuais pendentes" className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Etapas manuais pendentes</h4>
      <p className="text-xs text-muted-foreground">Execute a ação fora do Singu e confirme aqui. A confirmação registra sua execução e retoma a sequência; não dispara um envio automático.</p>
      {!active && <p className="text-xs text-muted-foreground">Ative a sequência para confirmar as etapas pendentes.</p>}
      {isLoading ? <p role="status" className="text-xs">Carregando etapas…</p> : error ? (
        <div role="alert" className="text-xs text-destructive">
          Não foi possível consultar as etapas pendentes.
          <Button variant="outline" size="sm" onClick={() => void refetch()}>Tentar novamente</Button>
        </div>
      ) : tasks.length === 0 ? <p className="text-xs text-muted-foreground">Nenhuma etapa manual pendente.</p> : (
        <ul className="space-y-2">
          {tasks.map(task => (
            <li key={task.enrollmentId} className="rounded-md border p-3 space-y-2 text-xs">
              <Link to={`/contatos/${task.contactId}`} className="font-medium underline">{task.contactName}</Link>
              {task.email && <p className="text-muted-foreground">{task.email}</p>}
              <p>Etapa {task.stepOrder} · {CHANNEL_LABELS[task.channel] ?? task.channel}</p>
              {task.instructions && <p className="whitespace-pre-wrap break-words">{task.instructions}</p>}
              {!task.valid && <p role="alert" className="text-destructive">Contato ou etapa alterados. Revise a inscrição antes de confirmar.</p>}
              <Button size="sm" variant="outline" disabled={!active || !task.valid || confirming}
                onClick={() => { setSelectedId(task.enrollmentId); setNote(''); }}>
                Confirmar execução
              </Button>
            </li>
          ))}
        </ul>
      )}
      <AlertDialog open={!!selected} onOpenChange={value => { if (!value && !confirming) setSelectedId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar execução manual</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme somente se você já executou a etapa {selected?.stepOrder} para {selected?.contactName}.
              Esta ação avança a inscrição e registra você como responsável.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <label htmlFor="manual-step-note" className="text-sm">Observação (opcional)</label>
          <Textarea id="manual-step-note" maxLength={2000} value={note} onChange={event => setNote(event.target.value)} disabled={confirming} />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={confirming}>Cancelar</AlertDialogCancel>
            <Button onClick={() => void confirmExecution()} disabled={confirming || !active || !selected?.valid}>
              {confirming ? 'Confirmando…' : 'Já executei — confirmar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
