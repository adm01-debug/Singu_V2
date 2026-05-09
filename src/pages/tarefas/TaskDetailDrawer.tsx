import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter,
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useUpdateTask, useDeleteTask, type Task } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Trash2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  status: z.string(),
  due_date: z.date().optional().nullable(),
  task_type: z.string().optional(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDrawer({ task, open, onOpenChange }: Props) {
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'pending',
      due_date: null,
      task_type: 'other',
      company_id: null,
      contact_id: null,
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: (task.priority as any) || 'medium',
        status: task.status || 'pending',
        due_date: task.due_date ? parseISO(task.due_date) : null,
        task_type: task.task_type || 'other',
        company_id: task.company_id || null,
        contact_id: task.contact_id || null,
      });
    }
  }, [task, form]);

  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open]);

  const fetchEntities = async () => {
    const [compRes, contRes] = await Promise.all([
      supabase.from('companies').select('id, name').limit(100),
      supabase.from('contacts').select('id, first_name, last_name').limit(100),
    ]);
    if (compRes.data) setCompanies(compRes.data.map(c => ({ value: c.id, label: c.name })));
    if (contRes.data) setContacts(contRes.data.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name || ''}`.trim() })));
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        taskId: task.id,
        updates: {
          ...values,
          due_date: values.due_date?.toISOString(),
        },
      });
      onOpenChange(false);
    } catch (error) {
      // toast handled in hook
    }
  };

  const handleDelete = async () => {
    if (!task || !window.confirm('Excluir esta tarefa?')) return;
    try {
      await deleteTask.mutateAsync(task.id);
      onOpenChange(false);
    } catch (error) {
      // toast handled in hook
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Tarefa</SheetTitle>
          <SheetDescription>Altere as informações desta tarefa ou lembrete.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="urgent">🔴 Urgente</SelectItem>
                        <SelectItem value="high">🟠 Alta</SelectItem>
                        <SelectItem value="medium">🟡 Média</SelectItem>
                        <SelectItem value="low">🟢 Baixa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="task_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="call">📞 Ligação</SelectItem>
                        <SelectItem value="email">📧 E-mail</SelectItem>
                        <SelectItem value="meeting">📅 Reunião</SelectItem>
                        <SelectItem value="follow_up">🔄 Follow-up</SelectItem>
                        <SelectItem value="other">📌 Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Andamento</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-1.5">Data Limite</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="company_id"
              render={({ field }) => {
                const selectedLabel = companies.find(c => c.value === field.value)?.label || '';
                return (
                  <FormItem>
                    <FormLabel>Empresa Relacionada</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={companies.map(c => c.label)}
                        value={selectedLabel}
                        onValueChange={(label) => {
                          const comp = companies.find(c => c.label === label);
                          if (comp) field.onChange(comp.value);
                        }}
                        placeholder="Buscar empresa..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="contact_id"
              render={({ field }) => {
                const selectedLabel = contacts.find(c => c.value === field.value)?.label || '';
                return (
                  <FormItem>
                    <FormLabel>Contato Relacionado</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={contacts.map(c => c.label)}
                        value={selectedLabel}
                        onValueChange={(label) => {
                          const cont = contacts.find(c => c.label === label);
                          if (cont) field.onChange(cont.value);
                        }}
                        placeholder="Buscar contato..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex justify-between items-center pt-6 border-t">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="text-destructive"
                onClick={handleDelete}
                disabled={deleteTask.isPending}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={updateTask.isPending}>
                  {updateTask.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
