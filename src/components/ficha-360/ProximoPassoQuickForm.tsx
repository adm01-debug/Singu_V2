import { memo, useMemo, useState } from 'react';
import { Loader2, Calendar as CalIcon, Clock, Sparkles, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useCreateTask } from '@/hooks/useTasks';
import {
  computePassoDefaults,
  priorityToTaskPriority,
  type BestTimeHint,
} from '@/lib/proximoPassoDefaults';
import type {
  ProximoPasso,
  ProximoPassoChannel,
  ProximoPassoPriority,
} from '@/domain/nextStepLogic';

interface Props {
  passo: ProximoPasso;
  bestTime?: BestTimeHint | null;
  contactId: string;
  onCreated: () => void;
  onCancel: () => void;
}

const CHANNEL_OPTIONS: Array<{ value: ProximoPassoChannel; label: string }> = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'E-mail' },
  { value: 'call', label: 'Ligação' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'linkedin', label: 'LinkedIn' },
];

const PRIORITY_OPTIONS: Array<{ value: ProximoPassoPriority; label: string }> = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' },
];

function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

function ProximoPassoQuickFormComponent({ passo, bestTime, contactId, onCreated, onCancel }: Props) {
  const createTask = useCreateTask();
  const defaults = useMemo(() => computePassoDefaults(passo, bestTime), [passo, bestTime]);

  const [date, setDate] = useState<string>(defaults.date);
  const [time, setTime] = useState<string>(defaults.time);
  const [channel, setChannel] = useState<ProximoPassoChannel>(defaults.channel);
  const [priority, setPriority] = useState<ProximoPassoPriority>(defaults.priority);

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const dueDateIso = useMemo(() => {
    const [y, m, d] = date.split('-').map((x) => parseInt(x, 10));
    const [hh, mm] = time.split(':').map((x) => parseInt(x, 10));
    const dt = new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0, 0, 0);
    return dt.toISOString();
  }, [date, time]);

  const hint = useMemo(() => {
    const channelLabel = CHANNEL_OPTIONS.find((c) => c.value === defaults.channel)?.label ?? defaults.channel;
    const parts = [`Sugerido: ${channelLabel} em ${formatDateBr(defaults.date)} às ${defaults.time}`];
    if (defaults.bestTimeApplied) parts.push('baseado no melhor horário do contato');
    else if (defaults.bestDayApplied) parts.push('ajustado para o melhor dia');
    return parts.join(' • ');
  }, [defaults]);

  const conflicts = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!date) errors.push('Data não informada.');
    if (!time) errors.push('Hora não informada.');
    if (!priority) errors.push('Prioridade ausente — selecione alta, média ou baixa.');
    if (!channel) errors.push('Canal ausente — selecione um canal de contato.');

    if (date && time) {
      const due = new Date(dueDateIso);
      const now = new Date();
      if (Number.isNaN(due.getTime())) {
        errors.push('Data/hora inválida.');
      } else if (due.getTime() < now.getTime() - 60_000) {
        errors.push(`Data/hora no passado (${formatDateBr(date)} às ${time}).`);
      }

      const [hh] = time.split(':').map((x) => parseInt(x, 10));
      if ((channel === 'call' || channel === 'meeting') && (hh < 8 || hh >= 19)) {
        warnings.push(`${channel === 'call' ? 'Ligações' : 'Reuniões'} fora do horário comercial (08h–19h) costumam ter baixa resposta.`);
      }

      const dow = due.getDay();
      if ((dow === 0 || dow === 6) && (channel === 'email' || channel === 'linkedin' || channel === 'call' || channel === 'meeting')) {
        warnings.push('Data cai em fim de semana — considere mover para dia útil.');
      }
    }

    if (passo.id === 'agendar-reuniao' && channel !== 'meeting') {
      warnings.push('Este passo é "Agendar reunião" mas o canal selecionado não é Reunião.');
    }
    if (passo.id === 'whatsapp-followup' && channel !== 'whatsapp') {
      warnings.push('Este passo é um follow-up de WhatsApp mas o canal selecionado é diferente.');
    }
    if (passo.id === 'aniversario' && channel === 'email') {
      warnings.push('Mensagens de aniversário costumam ter melhor recepção via WhatsApp.');
    }

    if (priority === 'alta' && date && time) {
      const due = new Date(dueDateIso);
      const diffDays = Math.floor((due.getTime() - Date.now()) / 86_400_000);
      if (diffDays > 2) {
        warnings.push(`Prioridade Alta agendada para ${diffDays} dias — considere antecipar ou reduzir prioridade.`);
      }
    }

    return { errors, warnings };
  }, [date, time, channel, priority, dueDateIso, passo.id]);

  const hasErrors = conflicts.errors.length > 0;

  const handleSubmit = () => {
    if (hasErrors) {
      toast.error(conflicts.errors[0]);
      return;
    }
    if (!date || !time) {
      toast.error('Informe data e hora');
      return;
    }
    createTask.mutate(
      {
        title: passo.title,
        description: `${passo.reason}\n\n${passo.detail}`,
        contact_id: contactId,
        priority: priorityToTaskPriority(priority),
        task_type: channel,
        due_date: dueDateIso,
        status: 'pending',
      },
      {
        onSuccess: () => {
          toast.success(`Tarefa criada para ${formatDateBr(date)} às ${time}`);
          onCreated();
        },
      },
    );
  };

  return (
    <div className="mt-3 rounded-md border border-border bg-muted/20 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`pp-date-${passo.id}`} className="text-xs flex items-center gap-1.5">
            <CalIcon className="h-3 w-3" /> Data
          </Label>
          <Input
            id={`pp-date-${passo.id}`}
            type="date"
            min={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pp-time-${passo.id}`} className="text-xs flex items-center gap-1.5">
            <Clock className="h-3 w-3" /> Hora
          </Label>
          <Input
            id={`pp-time-${passo.id}`}
            type="time"
            step={900}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Canal</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as ProximoPassoChannel)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Prioridade</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as ProximoPassoPriority)}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
        <Sparkles className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
        <span>{hint}</span>
      </p>

      {conflicts.errors.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong className="block mb-1">Conflito{conflicts.errors.length > 1 ? 's' : ''} impedindo confirmação:</strong>
            <ul className="list-disc pl-4 space-y-0.5">
              {conflicts.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {conflicts.errors.length === 0 && conflicts.warnings.length > 0 && (
        <Alert className="py-2 border-warning/50 bg-warning/10 [&>svg]:text-warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong className="block mb-1">Atenção antes de confirmar:</strong>
            <ul className="list-disc pl-4 space-y-0.5">
              {conflicts.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={createTask.isPending}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={createTask.isPending || hasErrors}
          title={hasErrors ? 'Resolva os conflitos para confirmar' : undefined}
        >
          {createTask.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Confirmar
        </Button>
      </div>
    </div>
  );
}

export const ProximoPassoQuickForm = memo(ProximoPassoQuickFormComponent);
