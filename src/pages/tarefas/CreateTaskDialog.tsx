import { useMemo, useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

/**
 * Validações do formulário rápido:
 * - título obrigatório (3–140 chars).
 * - descrição opcional (≤2000 chars).
 * - data limite opcional, mas se informada deve ser hoje ou no futuro.
 * - se hora informada exige data; data+hora juntas não podem estar no passado
 *   (com tolerância de 1 minuto para evitar corrida de relógio).
 */
const PAST_TOLERANCE_MS = 60_000;

const taskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, { message: 'Informe um título com pelo menos 3 caracteres.' })
      .max(140, { message: 'Título muito longo (máx. 140).' }),
    description: z
      .string()
      .trim()
      .max(2000, { message: 'Descrição muito longa (máx. 2000).' })
      .optional()
      .or(z.literal('')),
    priority: z.enum(['urgent', 'high', 'medium', 'low']),
    dueDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida.' })
      .optional()
      .or(z.literal('')),
    dueTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, { message: 'Hora inválida.' })
      .optional()
      .or(z.literal('')),
    taskType: z.string().optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    const date = val.dueDate?.trim();
    const time = val.dueTime?.trim();

    if (time && !date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dueDate'],
        message: 'Defina a data ao informar a hora.',
      });
      return;
    }

    if (!date) return;

    const composed = time ? `${date}T${time}:00` : `${date}T23:59:59`;
    const ts = new Date(composed).getTime();
    if (Number.isNaN(ts)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dueDate'],
        message: 'Data/hora inválida.',
      });
      return;
    }

    if (ts < Date.now() - PAST_TOLERANCE_MS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: time ? ['dueTime'] : ['dueDate'],
        message: time
          ? 'Data/hora não podem estar no passado.'
          : 'A data limite não pode estar no passado.',
      });
    }
  });

type FormErrors = Partial<Record<'title' | 'description' | 'dueDate' | 'dueTime', string>>;

const todayIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const addDaysIso = (days: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const DUE_WINDOWS: Array<{ days: number; label: string }> = [
  { days: 0, label: 'Hoje' },
  { days: 1, label: 'Amanhã' },
  { days: 2, label: 'Em 2 dias' },
  { days: 3, label: 'Em 3 dias' },
  { days: 7, label: 'Em 1 semana' },
  { days: 14, label: 'Em 2 semanas' },
];

const CHANNEL_NOTE_MAX = 200;
const CHANNEL_NOTE_SUGGESTIONS = [
  'Tom amigável',
  'Cliente apressado',
  'Confirmar antes de ligar',
  'Mencionar última reunião',
  'Evitar pressão de venda',
];

/** Compõe a descrição final unindo a nota do canal, sem perder o que o usuário digitou. */
function composeDescription(description: string, note: string): string | undefined {
  const desc = description.trim();
  const n = note.trim();
  if (!desc && !n) return undefined;
  if (!n) return desc;
  if (!desc) return `📝 Nota do canal: ${n}`;
  return `${desc}\n\n📝 Nota do canal: ${n}`;
}

export function CreateTaskDialog() {
  const createTask = useCreateTask();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'urgent' | 'high' | 'medium' | 'low'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [taskType, setTaskType] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [contactId, setContactId] = useState('');
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);
  const [channelNote, setChannelNote] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const minDate = useMemo(todayIso, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchEntities = async () => {
      const [compRes, contRes] = await Promise.all([
        supabase.from('companies').select('id, name').limit(100),
        supabase.from('contacts').select('id, first_name, last_name').limit(100),
      ]);
      if (cancelled) return;
      if (compRes.data) setCompanies(compRes.data.map(c => ({ value: c.id, label: c.name })));
      if (contRes.data) setContacts(contRes.data.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name || ''}`.trim() })));
    };
    fetchEntities();
    return () => { cancelled = true; };
  }, [open]);

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setDueTime('');
    setTaskType('');
    setCompanyId('');
    setContactId('');
    setChannelNote('');
    setErrors({});
    setSubmitAttempted(false);
  };

  const validate = (): { ok: boolean; data?: z.infer<typeof taskSchema> } => {
    const parsed = taskSchema.safeParse({
      title,
      description,
      priority,
      dueDate,
      dueTime,
      taskType,
    });
    if (parsed.success) {
      setErrors({});
      return { ok: true, data: parsed.data };
    }
    const next: FormErrors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof FormErrors | undefined;
      if (key && !next[key]) next[key] = issue.message;
    }
    setErrors(next);
    return { ok: false };
  };

  const handleBlur = () => {
    if (submitAttempted) validate();
  };

  const handleSubmit = () => {
    setSubmitAttempted(true);
    const { ok, data } = validate();
    if (!ok || !data) return;

    const dueIso = data.dueDate
      ? new Date(`${data.dueDate}T${data.dueTime || '23:59'}:00`).toISOString()
      : undefined;

    createTask.mutate(
      {
        title: data.title,
        description: composeDescription(data.description ?? '', channelNote),
        priority: data.priority,
        due_date: dueIso,
        task_type: data.taskType || undefined,
        company_id: companyId || undefined,
        contact_id: contactId || undefined,
        status: 'pending',
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-2">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleBlur}
              placeholder="Ex: Ligar para cliente X"
              maxLength={140}
              className={cn(errors.title && 'border-destructive focus-visible:ring-destructive')}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="task-desc">Descrição</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleBlur}
              placeholder="Detalhes opcionais..."
              rows={3}
              maxLength={2000}
              className={cn(
                errors.description && 'border-destructive focus-visible:ring-destructive',
              )}
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">🔴 Urgente</SelectItem>
                  <SelectItem value="high">🟠 Alta</SelectItem>
                  <SelectItem value="medium">🟡 Média</SelectItem>
                  <SelectItem value="low">🟢 Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-due">Data Limite</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                min={minDate}
                onChange={(e) => setDueDate(e.target.value)}
                onBlur={handleBlur}
                className={cn(
                  errors.dueDate && 'border-destructive focus-visible:ring-destructive',
                )}
              />
              {errors.dueDate && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.dueDate}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Janela rápida</Label>
            <div className="flex flex-wrap gap-1.5">
              {DUE_WINDOWS.map((w) => {
                const iso = addDaysIso(w.days);
                const active = dueDate === iso;
                return (
                  <Button
                    key={w.days}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="xs"
                    onClick={() => {
                      setDueDate(iso);
                      setErrors((prev) => ({ ...prev, dueDate: undefined, dueTime: undefined }));
                    }}
                  >
                    {w.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task-time">Hora (opcional)</Label>
              <Input
                id="task-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                onBlur={handleBlur}
                disabled={!dueDate}
                className={cn(
                  errors.dueTime && 'border-destructive focus-visible:ring-destructive',
                )}
              />
              {errors.dueTime && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.dueTime}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={taskType} onValueChange={setTaskType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">📞 Ligação</SelectItem>
                  <SelectItem value="email">📧 E-mail</SelectItem>
                  <SelectItem value="meeting">📅 Reunião</SelectItem>
                  <SelectItem value="follow_up">🔄 Follow-up</SelectItem>
                  <SelectItem value="proposal">📝 Proposta</SelectItem>
                  <SelectItem value="other">📌 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Empresa Relacionada</Label>
              <SearchableSelect
                options={companies.map(c => c.label)}
                value={companies.find(c => c.value === companyId)?.label || ''}
                onValueChange={(label) => {
                  const comp = companies.find(c => c.label === label);
                  if (comp) setCompanyId(comp.value);
                }}
                placeholder="Buscar empresa..."
              />
            </div>
            <div className="space-y-2">
              <Label>Contato Relacionado</Label>
              <SearchableSelect
                options={contacts.map(c => c.label)}
                value={contacts.find(c => c.value === contactId)?.label || ''}
                onValueChange={(label) => {
                  const cont = contacts.find(c => c.label === label);
                  if (cont) setContactId(cont.value);
                }}
                placeholder="Buscar contato..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="task-channel-note" className="text-sm">
                Nota do canal <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {channelNote.length}/{CHANNEL_NOTE_MAX}
              </span>
            </div>
            <Input
              id="task-channel-note"
              value={channelNote}
              maxLength={CHANNEL_NOTE_MAX}
              placeholder="Ex.: tom amigável, ponto a abordar…"
              onChange={(e) => setChannelNote(e.target.value.slice(0, CHANNEL_NOTE_MAX))}
            />
            <div className="flex flex-wrap gap-1.5">
              {CHANNEL_NOTE_SUGGESTIONS.map((s) => {
                const active = channelNote.trim() === s;
                return (
                  <Button
                    key={s}
                    type="button"
                    variant={active ? 'default' : 'outline'}
                    size="xs"
                    onClick={() =>
                      setChannelNote((prev) => (prev.trim() === s ? '' : s))
                    }
                  >
                    {s}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || createTask.isPending}
          >
            {createTask.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Criar Tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
