import { useState } from 'react';
import { CheckSquare, Plus, Check, RotateCcw, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useContactTasks,
  useCreateTask,
  useCompleteTask,
  useReopenTask,
  useDeleteTask,
  type Task,
} from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

const PRIORITY_LABEL: Record<string, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const PRIORITY_CLASS: Record<string, string> = {
  urgent: 'bg-destructive/10 text-destructive border-destructive/30',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
  medium: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
  low: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
};

function isDone(task: Task) {
  return task.status === 'completed' || task.status === 'done' || !!task.completed_at;
}

function dueLabel(task: Task): { text: string; late: boolean } | null {
  if (!task.due_date) return null;
  const due = new Date(task.due_date);
  if (Number.isNaN(due.getTime())) return null;
  const late = !isDone(task) && due.getTime() < Date.now();
  return { text: format(due, "dd 'de' MMM, HH:mm", { locale: ptBR }), late };
}

interface ContactTasksPanelProps {
  contactId: string;
}

export function ContactTasksPanel({ contactId }: ContactTasksPanelProps) {
  const { data: tasks = [], isLoading } = useContactTasks(contactId);
  const createTask = useCreateTask();
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const deleteTask = useDeleteTask();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [touched, setTouched] = useState(false);

  const titleError = touched && title.trim().length < 3
    ? 'Informe um título com pelo menos 3 caracteres.'
    : null;

  const reset = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setTouched(false);
  };

  const handleSubmit = () => {
    setTouched(true);
    if (title.trim().length < 3) return;

    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        contact_id: contactId,
        task_type: 'todo',
        status: 'pending',
      },
      {
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
      },
    );
  };

  const pending = tasks.filter(t => !isDone(t));
  const done = tasks.filter(isDone);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-primary" />
            Tarefas deste contato
          </CardTitle>
          <Button
            size="sm"
            variant={showForm ? 'outline' : 'default'}
            onClick={() => { setShowForm(v => !v); if (showForm) reset(); }}
          >
            <Plus className="h-4 w-4 mr-1" />
            {showForm ? 'Cancelar' : 'Nova tarefa'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <div className="space-y-3 rounded-lg border p-3 bg-muted/30">
              <div className="space-y-1.5">
                <Label htmlFor="contact-task-title">Título *</Label>
                <Input
                  id="contact-task-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="Ex: Ligar para confirmar proposta"
                  maxLength={140}
                  className={cn(titleError && 'border-destructive focus-visible:ring-destructive')}
                />
                {titleError && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {titleError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="contact-task-desc">Descrição</Label>
                <Textarea
                  id="contact-task-desc"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  placeholder="Detalhes opcionais"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Prioridade</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgente</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="low">Baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact-task-due">Data limite</Label>
                  <Input
                    id="contact-task-due"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={createTask.isPending || title.trim().length < 3}
                >
                  {createTask.isPending ? 'Salvando...' : 'Criar tarefa'}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhuma tarefa para este contato.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <TaskGroup
                label={`Em aberto (${pending.length})`}
                tasks={pending}
                onComplete={id => completeTask.mutate(id)}
                onDelete={id => deleteTask.mutate(id)}
              />
              {done.length > 0 && (
                <TaskGroup
                  label={`Concluídas (${done.length})`}
                  tasks={done}
                  onReopen={id => reopenTask.mutate(id)}
                  onDelete={id => deleteTask.mutate(id)}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TaskGroupProps {
  label: string;
  tasks: Task[];
  onComplete?: (id: string) => void;
  onReopen?: (id: string) => void;
  onDelete: (id: string) => void;
}

function TaskGroup({ label, tasks, onComplete, onReopen, onDelete }: TaskGroupProps) {
  if (tasks.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <ul className="space-y-2">
        {tasks.map(task => {
          const due = dueLabel(task);
          return (
            <li
              key={task.id}
              className="flex items-start gap-3 rounded-lg border p-2.5 bg-card"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <p className={cn('text-sm font-medium truncate', isDone(task) && 'line-through text-muted-foreground')}>
                  {task.title}
                </p>
                {task.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {task.priority && (
                    <Badge variant="outline" className={cn('text-[10px]', PRIORITY_CLASS[task.priority])}>
                      {PRIORITY_LABEL[task.priority] ?? task.priority}
                    </Badge>
                  )}
                  {due && (
                    <span className={cn('text-[11px]', due.late ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                      {due.late ? 'Atrasada · ' : ''}{due.text}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {onComplete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Concluir tarefa ${task.title}`}
                    onClick={() => onComplete(task.id)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                )}
                {onReopen && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label={`Reabrir tarefa ${task.title}`}
                    onClick={() => onReopen(task.id)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  aria-label={`Excluir tarefa ${task.title}`}
                  onClick={() => onDelete(task.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}