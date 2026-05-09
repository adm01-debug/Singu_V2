import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { AnimatePresence } from 'framer-motion';
import { CheckSquare, Clock, AlertTriangle, Filter, CheckCircle2, ArrowUpDown, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAllTasks, useOverdueTasks, useCompleteTask, useReopenTask, Task } from '@/hooks/useTasks';
import { useActionToast } from '@/hooks/useActionToast';
import { TaskCard } from './tarefas/TaskCard';
import { CreateTaskDialog } from './tarefas/CreateTaskDialog';
import { TaskDetailDrawer } from './tarefas/TaskDetailDrawer';

export default function Tarefas() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'created_at'>('due_date');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: allTasks, isLoading } = useAllTasks();
  const { data: overdueTasks } = useOverdueTasks();
  const completeTask = useCompleteTask();
  const reopenTask = useReopenTask();
  const { destructive } = useActionToast();

  const handleComplete = (id: string, title?: string) => {
    completeTask.mutate(id);
    destructive({
      message: '✅ Tarefa concluída',
      description: title,
      onUndo: () => reopenTask.mutate(id),
    });
  };

  const categorizedTasks = useMemo(() => {
    const tasks = allTasks || [];
    return {
      pending: tasks.filter(t => t.status !== 'completed' && t.status !== 'done'),
      completed: tasks.filter(t => t.status === 'completed' || t.status === 'done'),
      overdue: overdueTasks || [],
    };
  }, [allTasks, overdueTasks]);

  const filteredTasks = useMemo(() => {
    let tasks: Task[];
    switch (activeTab) {
      case 'overdue': tasks = categorizedTasks.overdue; break;
      case 'completed': tasks = categorizedTasks.completed; break;
      default: tasks = categorizedTasks.pending;
    }
    if (searchTerm.length >= 2) {
      const term = searchTerm.toLowerCase();
      tasks = tasks.filter(t => t.title?.toLowerCase().includes(term) || t.description?.toLowerCase().includes(term) || t.contact_name?.toLowerCase().includes(term) || t.company_name?.toLowerCase().includes(term));
    }
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2) - (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2);
      if (sortBy === 'due_date') return (a.due_date || '9999').localeCompare(b.due_date || '9999');
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }, [activeTab, categorizedTasks, searchTerm, sortBy]);

  const stats = { pending: categorizedTasks.pending.length, overdue: categorizedTasks.overdue.length, completed: categorizedTasks.completed.length, total: (allTasks || []).length };

  return (
    <>
      <Helmet><title>Tarefas & Lembretes | SINGU CRM</title><meta name="description" content="Gerencie suas tarefas, follow-ups e lembretes de contatos" /></Helmet>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CheckSquare className="h-6 w-6 text-primary" />Tarefas & Lembretes</h1>
            <p className="text-sm text-muted-foreground mt-1">Gerencie suas atividades pendentes e acompanhe seus follow-ups</p>
          </div>
          <CreateTaskDialog />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Pendentes', value: stats.pending, icon: Clock, color: 'border-l-warning', iconColor: 'text-warning/30' },
            { label: 'Atrasadas', value: stats.overdue, icon: AlertTriangle, color: 'border-l-destructive', iconColor: 'text-destructive/30' },
            { label: 'Concluídas', value: stats.completed, icon: CheckCircle2, color: 'border-l-success', iconColor: 'text-success/30' },
            { label: 'Total', value: stats.total, icon: CheckSquare, color: 'border-l-primary', iconColor: 'text-primary/30' },
          ].map(s => (
            <Card key={s.label} className={`border-l-4 ${s.color}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-[11px] text-muted-foreground uppercase tracking-wide">{s.label}</p><p className="text-2xl font-bold text-foreground">{isLoading ? '-' : s.value}</p></div>
                  <s.icon className={`h-8 w-8 ${s.iconColor}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar tarefas..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <Select value={sortBy} onValueChange={v => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[170px]"><ArrowUpDown className="h-3.5 w-3.5 mr-1.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Data limite</SelectItem>
              <SelectItem value="priority">Prioridade</SelectItem>
              <SelectItem value="created_at">Mais recentes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5"><Clock className="h-3.5 w-3.5" />Pendentes{stats.pending > 0 && <Badge variant="secondary" className="text-[10px] ml-1">{stats.pending}</Badge>}</TabsTrigger>
            <TabsTrigger value="overdue" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" />Atrasadas{stats.overdue > 0 && <Badge variant="destructive" className="text-[10px] ml-1">{stats.overdue}</Badge>}</TabsTrigger>
            <TabsTrigger value="completed" className="gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" />Concluídas</TabsTrigger>
          </TabsList>

          {['pending', 'overdue', 'completed'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4">
              {isLoading ? (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
              ) : filteredTasks.length === 0 ? (
                <Card><CardContent className="py-12 text-center"><CheckSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">{searchTerm ? 'Nenhuma tarefa encontrada com esse termo' : tab === 'completed' ? 'Nenhuma tarefa concluída' : tab === 'overdue' ? 'Nenhuma tarefa atrasada! 🎉' : 'Nenhuma tarefa pendente'}</p></CardContent></Card>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">{filteredTasks.map(task => <TaskCard key={task.id} task={task} onComplete={(id) => handleComplete(id, task.title)} onEdit={setEditingTask} />)}</div>
                </AnimatePresence>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
