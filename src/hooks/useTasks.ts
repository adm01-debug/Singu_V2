import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { callExternalRpc, queryExternalData } from '@/lib/externalData';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type TaskListSnapshot = { queryKey: readonly unknown[]; data: Task[] | undefined }[];

export interface Task {
  id: string;
  contact_id?: string;
  contact_name?: string;
  company_id?: string;
  company_name?: string;
  title: string;
  description?: string;
  status?: string;
  priority?: string;
  due_date?: string;
  completed_at?: string;
  assigned_to?: string;
  task_type?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  [key: string]: unknown;
}

export function usePendingTasks() {
  return useQuery({
    queryKey: ['tasks', 'pending'],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Task[]>('get_pending_tasks', {});
        if (error) {
          logger.warn('[Tasks] get_pending_tasks RPC failed, falling back to table query:', error);
          // Fallback: query tasks table directly
          const result = await queryExternalData<Task>({
            table: 'tasks',
            filters: [
              { type: 'neq', column: 'status', value: 'completed' },
              { type: 'neq', column: 'status', value: 'done' },
            ],
            order: { column: 'due_date', ascending: true },
            range: { from: 0, to: 99 },
          });
          if (result.error) throw result.error;
          return result.data || [];
        }
        return (Array.isArray(data) ? data : []) as Task[];
      } catch (e) {
        logger.warn('[Tasks] Fetch pending failed:', e);
        return [] as Task[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useOverdueTasks() {
  return useQuery({
    queryKey: ['tasks', 'overdue'],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Task[]>('get_overdue_tasks', {});
        if (error) {
          logger.warn('[Tasks] get_overdue_tasks RPC failed:', error);
          return [] as Task[];
        }
        return (Array.isArray(data) ? data : []) as Task[];
      } catch (e) {
        logger.warn('[Tasks] Fetch overdue failed:', e);
        return [] as Task[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllTasks(statusFilter?: string) {
  return useQuery({
    queryKey: ['tasks', 'all', statusFilter],
    queryFn: async () => {
      try {
        const { data, error } = await callExternalRpc<Task[]>('get_all_tasks', {});
        if (error) {
          logger.warn('[Tasks] get_all_tasks RPC failed, falling back:', error);
          const filters: Array<{ type: 'eq' | 'neq'; column: string; value: unknown }> = [];
          if (statusFilter && statusFilter !== 'all') {
            filters.push({ type: 'eq', column: 'status', value: statusFilter });
          }
          const result = await queryExternalData<Task>({
            table: 'tasks',
            filters,
            order: { column: 'due_date', ascending: true },
            range: { from: 0, to: 199 },
          });
          if (result.error) throw result.error;
          return result.data || [];
        }
        const tasks = (Array.isArray(data) ? data : []) as Task[];
        if (statusFilter && statusFilter !== 'all') {
          return tasks.filter(t => t.status === statusFilter);
        }
        return tasks;
      } catch (e) {
        logger.warn('[Tasks] Fetch all failed:', e);
        return [] as Task[];
      }
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (task: Partial<Task>) => {
      const { data, error } = await callExternalRpc<Task>('create_task', task);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('✅ Tarefa criada com sucesso');
    },
    onError: (err) => {
      logger.error('[Tasks] Create failed:', err);
      toast.error('Erro ao criar tarefa');
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      const { updateExternalData } = await import('@/lib/externalData');
      const { data, error } = await updateExternalData<Task>('tasks', taskId, updates);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('✅ Tarefa atualizada');
    },
    onError: (err) => {
      logger.error('[Tasks] Update failed:', err);
      toast.error('Erro ao atualizar tarefa');
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { deleteExternalData } = await import('@/lib/externalData');
      const { success, error } = await deleteExternalData('tasks', taskId);
      if (error) throw error;
      return success;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('✅ Tarefa excluída');
    },
    onError: (err) => {
      logger.error('[Tasks] Delete failed:', err);
      toast.error('Erro ao excluir tarefa');
    },
  });
}

export function useCompleteTask() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, string, { snapshot: TaskListSnapshot }>({
    mutationFn: async (taskId: string) => {
      const { data, error } = await callExternalRpc('complete_task', { p_task_id: taskId });
      if (error) throw error;
      return data;
    },
    // Optimistic update: marca como concluída em todas as queries de tasks instantaneamente
    onMutate: async (taskId) => {
      await qc.cancelQueries({ queryKey: ['tasks'] });
      const queries = qc.getQueriesData<Task[]>({ queryKey: ['tasks'] });
      const snapshot: TaskListSnapshot = queries.map(([key, data]) => ({ queryKey: key, data }));
      const nowIso = new Date().toISOString();
      for (const [key, data] of queries) {
        if (!Array.isArray(data)) continue;
        qc.setQueryData<Task[]>(
          key,
          data.map((t) => (t.id === taskId ? { ...t, status: 'completed', completed_at: nowIso } : t)),
        );
      }
      return { snapshot };
    },
    onError: (err, _taskId, context) => {
      logger.error('[Tasks] Complete failed:', err);
      // Rollback
      if (context?.snapshot) {
        for (const { queryKey, data } of context.snapshot) qc.setQueryData(queryKey, data);
      }
      toast.error('Erro ao concluir tarefa');
    },
    // sucesso silencioso — caller decide o feedback (ver useActionToast.destructive em Tarefas/Inbox)

    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Reabre uma tarefa concluída (usado pelo Undo do toast destrutivo).
 */
export function useReopenTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const { data, error } = await callExternalRpc('reopen_task', { p_task_id: taskId });
      if (error) {
        // Fallback: update direto na tabela
        const { updateExternalData } = await import('@/lib/externalData');
        const res = await updateExternalData('tasks', taskId, { status: 'pending', completed_at: null });
        if (res.error) throw res.error;
        return res.data;
      }
      return data;
    },
    onSuccess: () => toast.success('Tarefa reaberta'),
    onError: () => toast.error('Erro ao reabrir tarefa'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useSnoozeReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reminderId, hours }: { reminderId: string; hours: number }) => {
      const { data, error } = await callExternalRpc('snooze_reminder', {
        p_reminder_id: reminderId,
        p_snooze_hours: hours,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('⏰ Lembrete adiado');
    },
    onError: (err) => {
      logger.error('[Tasks] Snooze failed:', err);
      toast.error('Erro ao adiar lembrete');
    },
  });
}
