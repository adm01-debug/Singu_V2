import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
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
import { useCreateDeal, type PipelineDeal } from '@/hooks/usePipeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStage?: string;
}

export function DealDialog({ open, onOpenChange, initialStage = 'lead' }: Props) {
  const createDeal = useCreateDeal();
  const [companies, setCompanies] = useState<{ value: string; label: string }[]>([]);
  const [contacts, setContacts] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingEntities, setIsLoadingEntities] = useState(false);

  const form = useForm<DealFormValues>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      titulo: '',
      valor: 0,
      pipeline_stage: initialStage,
      probabilidade: STAGES.find(s => s.id === initialStage)?.probability || 10,
      company_id: '',
      contact_id: null,
      previsao_fechamento: null,
    },
  });

  // Watch stage to update default probability
  const currentStage = form.watch('pipeline_stage');
  useEffect(() => {
    const stage = STAGES.find(s => s.id === currentStage);
    if (stage) {
      form.setValue('probabilidade', stage.probability);
    }
  }, [currentStage, form]);

  useEffect(() => {
    if (open) {
      fetchEntities();
    }
  }, [open]);

  const fetchEntities = async () => {
    setIsLoadingEntities(true);
    try {
      const [compRes, contRes] = await Promise.all([
        supabase.from('companies').select('id, name').limit(100),
        supabase.from('contacts').select('id, first_name, last_name').limit(100),
      ]);

      if (compRes.data) {
        setCompanies(compRes.data.map(c => ({ value: c.id, label: c.name })));
      }
      if (contRes.data) {
        setContacts(contRes.data.map(c => ({ value: c.id, label: `${c.first_name} ${c.last_name || ''}`.trim() })));
      }
    } finally {
      setIsLoadingEntities(false);
    }
  };

  const onSubmit = async (values: DealFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      await createDeal.mutateAsync({
        ...values,
        user_id: user.id,
        previsao_fechamento: values.previsao_fechamento?.toISOString(),
      });
      
      toast.success('Deal criado com sucesso!');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error creating deal:', error);
      toast.error('Erro ao criar deal. Verifique os campos e tente novamente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Deal</DialogTitle>
          <DialogDescription>
            Insira os detalhes da nova oportunidade de negócio.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título do Deal</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Venda de Licenças Lovable" {...field} />
                  </FormControl>
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
                        <Input type="number" className="pl-9" placeholder="0,00" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o estágio" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGES.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
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
                        placeholder="Buscar empresa..."
                        emptyMessage="Nenhuma empresa encontrada."
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
                    <FormLabel>Contato (Opcional)</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        options={contacts.map(c => c.label)}
                        value={selectedLabel}
                        onValueChange={(label) => {
                          const cont = contacts.find(c => c.label === label);
                          if (cont) field.onChange(cont.value);
                        }}
                        placeholder="Buscar contato..."
                        emptyMessage="Nenhum contato encontrado."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="probabilidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Probabilidade (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previsao_fechamento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-1.5">Previsão de Fechamento</FormLabel>
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
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0,0,0,0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
                ) : (
                  'Criar Deal'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
