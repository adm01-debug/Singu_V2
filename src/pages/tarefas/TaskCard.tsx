import { motion } from 'framer-motion';
import { Circle, CheckCircle2, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday, isTomorrow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Task } from '@/hooks/useTasks';

const priorityConfig: Record<string, { label: string; color: string; badgeClass: string }> = {
  urgent: { label: 'Urgente', color: 'text-destructive', badgeClass: 'bg-destructive/10 text-destructive border-destructive/30' },
  high: { label: 'Alta', color: 'text-red-500', badgeClass: 'bg-red-500/10 text-red-500 border-red-500/30' },
  medium: { label: 'Média', color: 'text-warning', badgeClass: 'bg-warning/10 text-warning border-warning/30' },
  low: { label: 'Baixa', color: 'text-success', badgeClass: 'bg-success/10 text-success border-success/30' },
};

function getDueDateLabel(dateStr?: string): { label: string; className: string } | null {
  if (!dateStr) return null;
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return { label: 'Hoje', className: 'text-warning font-medium' };
    if (isTomorrow(date)) return { label: 'Amanhã', className: 'text-info' };
    if (isPast(date)) return { label: `Atrasada (${format(date, 'dd/MM')})`, className: 'text-destructive font-medium' };
    return { label: format(date, "dd/MM/yy", { locale: ptBR }), className: 'text-muted-foreground' };
  } catch { return null; }
}

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

export function TaskCard({ task, onComplete, onEdit }: TaskCardProps) {
  const navigate = useNavigate();
  const priority = priorityConfig[task.priority || 'medium'] || priorityConfig.medium;
  const dueInfo = getDueDateLabel(task.due_date);
  const isCompleted = task.status === 'completed' || task.status === 'done';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} layout>
      <Card className={cn(
        'transition-all hover:shadow-md border-l-4',
        isCompleted ? 'opacity-60 border-l-success/50' : 'border-l-transparent',
        task.priority === 'urgent' && !isCompleted && 'border-l-destructive',
        task.priority === 'high' && !isCompleted && 'border-l-red-500',
        task.priority === 'medium' && !isCompleted && 'border-l-warning',
        task.priority === 'low' && !isCompleted && 'border-l-success',
      )}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <button onClick={() => !isCompleted && onComplete(task.id)} disabled={isCompleted} className="mt-0.5 shrink-0">
              {isCompleted ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className={cn('h-5 w-5 hover:text-success transition-colors', priority.color)} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className={cn('text-sm font-medium', isCompleted && 'line-through text-muted-foreground')}>{task.title}</h4>
                <Badge variant="outline" className={cn('text-[10px] shrink-0', priority.badgeClass)}>{priority.label}</Badge>
              </div>
              {task.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {dueInfo && <span className={cn('text-[11px] flex items-center gap-1', dueInfo.className)}><Calendar className="h-3 w-3" />{dueInfo.label}</span>}
                {task.task_type && <Badge variant="outline" className="text-[10px]">{task.task_type}</Badge>}
                {task.contact_name && <button onClick={() => task.contact_id && navigate(`/contatos/${task.contact_id}`)} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">{task.contact_name}<ChevronRight className="h-3 w-3" /></button>}
                {task.company_name && <button onClick={() => task.company_id && navigate(`/empresas/${task.company_id}`)} className="text-[11px] text-primary hover:underline flex items-center gap-0.5">{task.company_name}<ChevronRight className="h-3 w-3" /></button>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
