import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { type PipelineDeal } from '@/hooks/usePipeline';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, DollarSign, Trash2, Trophy, Frown } from 'lucide-react';
import { updateExternalData, deleteExternalData } from '@/lib/externalData';
import { useQueryClient } from '@tanstack/react-query';

const STAGES = [
  { id: 'lead', name: 'Novo Lead', probability: 10 },
  { id: 'primeiro_contato', name: '1º Contato', probability: 20 },
  { id: 'qualificacao', name: 'Qualificação', probability: 30 },
  { id: 'proposta', name: 'Proposta', probability: 50 },
  { id: 'negociacao', name: 'Negociação', probability: 70 },
  { id: 'fechamento', name: 'Fechamento', probability: 90 },
];

const dealSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  valor: z.string().or(z.number()).transform(v => Number(v) || 0),
  pipeline_stage: z.string(),
  probabilidade: z.string().or(z.number()).transform(v => Number(v) || 0),
  company_id: z.string().uuid('Selecione uma empresa'),
  contact_id: z.string().uuid('Selecione um contato').optional().nullable(),
  previsao_fechamento: z.date().optional().nullable(),
});

type DealFormValues = z.infer<typeof dealSchema>;

interface Props {
  deal: PipelineDeal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DealDetailDrawer({ deal, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [, setContacts] = useState<{ value: string; label: string }[]>([]);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      titulo: '',
      valor: 0,
      pipeline_stage: 'lead',
      probabilidade: 10,
      company_id: '',
      contact_id: null,
      previsao_fechamento: null,
    },
  });

  useEffect(() => {
    if (deal) {
      form.reset({
        titulo: deal.titulo,
        valor: deal.valor,
        pipeline_stage: deal.pipeline_stage,
        probabilidade: deal.probabilidade,
        company_id: deal.company_id,
        contact_id: deal.contact_id,
        previsao_fechamento: deal.previsao_fechamento ? new Date(deal.previsao_fechamento) : null,
      });
    }
  }, [deal, form]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const fetchEntities = async () => {
      try {
        const [compRes, contRes] = await Promise.all([
          supabase.from('companies').select('id, name').eq('user_id', user?.id ?? '').limit(100),
          supabase.from('contacts').select('id, first_name, last_name').eq('user_id', user?.id ?? '').limit(100),
        ]);
        if (cancelled) return;
        if (compRes.data) setCompanies(compRes.data.map(c => ({ value: c.id, label: c.name })));
        if (contRes.data) setContacts(contRes.data.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name || ''}`.trim() })));
      } catch {
        // non-critical — dropdowns remain empty; user can still submit with IDs already on the deal
      }
    };
    fetchEntities();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [open]);

  const onSubmit = async (values: DealFormValues) => {
    if (!deal) return;
    setIsSaving(true);
    try {
      const { error } = await updateExternalData('deals', deal.id, {
        ...values,
        previsao_fechamento: values.previsao_fechamento?.toISOString(),
      });
      if (error) throw error;
      
      toast.success('Deal atualizado!');
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      onOpenChange(false);
    } catch {
      toast.error('Erro ao atualizar deal');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deal || !window.confirm('Excluir este deal?')) return;
    setIsDeleting(true);
    try {
      const { error } = await deleteExternalData('deals', deal.id);
      if (error) throw error;
      toast.success('Deal excluído');
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      onOpenChange(false);
    } catch {
      toast.error('Erro ao excluir deal');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: 'won' | 'lost') => {
    if (!deal) return;
    setIsSaving(true);
    try {
      const { error } = await updateExternalData('deals', deal.id, { 
        status: status === 'won' ? 'ganho' : 'perdido',
        closed_at: new Date().toISOString(),
        pipeline_stage: status === 'won' ? 'fechamento' : deal.pipeline_stage,
        probabilidade: status === 'won' ? 100 : 0
      });
      if (error) throw error;
      toast.success(status === 'won' ? 'Parabéns! Deal Ganho! 🏆' : 'Deal marcado como perdido.');
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      onOpenChange(false);
    } catch {
      toast.error('Erro ao atualizar status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Deal</SheetTitle>
          <SheetDescription>Altere as informações desta oportunidade.</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-6">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pipeline_stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estágio</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={companies.map(c => c.label)}
                        value={selectedLabel}
                        onValueChange={(label) => {
                          const comp = companies.find(c => c.label === label);
                          if (comp) field.onChange(comp.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="flex gap-2 pt-2 border-t mt-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 text-success border-success/20 hover:bg-success/10"
                onClick={() => handleStatusChange('won')}
                disabled={isSaving}
              >
                <Trophy className="mr-2 h-4 w-4" /> Ganho
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => handleStatusChange('lost')}
                disabled={isSaving}
              >
                <Frown className="mr-2 h-4 w-4" /> Perdido
              </Button>
            </div>

            <div className="flex justify-between items-center pt-6 border-t">
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" aria-label="Remover" 
                className="text-destructive"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
