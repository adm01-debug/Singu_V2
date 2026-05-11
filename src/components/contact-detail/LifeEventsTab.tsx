import { useState } from 'react';
import { Gift, Calendar, Plus, Trash2, RefreshCw, Bell, History, CheckSquare, BarChart3 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { LifeEventsGapChecklist } from './life-events/LifeEventsGapChecklist';
import { LifeEventsAuditTrail } from './life-events/LifeEventsAuditTrail';
import { LifeEventsTimeline } from './life-events/LifeEventsTimeline';

 import { LifeEventsVisualSummary } from './life-events/LifeEventsVisualSummary';
 
interface LifeEventsTabProps {
  contactId: string;
}

export function LifeEventsTab({ contactId }: LifeEventsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<TablesInsert<'life_events'>> & { reason?: string }>({
    event_type: 'birthday',
    event_date: new Date().toISOString().split('T')[0],
    recurring: true,
    reminder_days_before: 7,
    reason: 'Interação manual via painel'
  });

  const { data: lifeEvents = [], isLoading } = useQuery({
    queryKey: ['life-events', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('life_events')
        .select('*')
        .eq('contact_id', contactId)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as Tables<'life_events'>[];
    },
    enabled: !!contactId,
  });

  const createEventMutation = useMutation({
    mutationFn: async (event: TablesInsert<'life_events'>) => {
      const { data, error } = await supabase.from('life_events').insert(event).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events', contactId] });
      toast({ title: "Evento criado", description: "O marco de vida foi registrado com sucesso." });
      setIsDialogOpen(false);
      setNewEvent({
        event_type: 'birthday',
        event_date: new Date().toISOString().split('T')[0],
        recurring: true,
        reminder_days_before: 7
      });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('life_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events', contactId] });
      toast({ title: "Evento removido" });
    }
  });

  const handleCreateEvent = () => {
    if (!user || !newEvent.title || !newEvent.event_date) return;
    
    const { reason, ...eventData } = newEvent;
    
    createEventMutation.mutate({
      ...eventData as TablesInsert<'life_events'>,
      contact_id: contactId,
      user_id: user.id,
      metadata: { reason: reason || 'Interação manual' }
    });
  };

  const eventTypeLabels: Record<string, string> = {
    birthday: 'Aniversário',
    anniversary: 'Bodas/Aniversário Rel.',
    promotion: 'Promoção',
    travel: 'Viagem',
    family: 'Família',
    achievement: 'Conquista',
    other: 'Outro'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Gift className="h-5 w-5 text-success" />
            Eventos de Vida & Marcos (Módulo 2.4)
          </h3>
          <p className="text-sm text-muted-foreground">Rastreie momentos importantes para fortalecer o rapport</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Novo Marco</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Título do Evento</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Aniversário de 10 anos de empresa" 
                  value={newEvent.title || ''}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select 
                    value={newEvent.event_type} 
                    onValueChange={(val: any) => setNewEvent({...newEvent, event_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeLabels).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Data</Label>
                  <Input 
                    id="date" 
                    type="date" 
                    value={newEvent.event_date?.split('T')[0]}
                    onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="desc">Notas/Observações</Label>
                <Textarea 
                  id="desc" 
                  placeholder="Detalhes sobre o evento..." 
                  value={newEvent.description || ''}
                  onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Motivo/Origem da Informação</Label>
                <Input 
                  id="reason" 
                  placeholder="Ex: Comentado em reunião, Post no LinkedIn..." 
                  value={newEvent.reason || ''}
                  onChange={(e) => setNewEvent({...newEvent, reason: e.target.value})}
                />
              </div>
              <div className="flex items-center space-x-4 pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="recurring" 
                    checked={newEvent.recurring} 
                    onCheckedChange={(checked) => setNewEvent({...newEvent, recurring: !!checked})}
                  />
                  <Label htmlFor="recurring" className="text-sm cursor-pointer">Recorrente anual</Label>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-sm">Lembrete:</Label>
                  <Input 
                    type="number" 
                    className="w-16 h-8 text-xs" 
                    value={newEvent.reminder_days_before || 0}
                    onChange={(e) => setNewEvent({...newEvent, reminder_days_before: parseInt(e.target.value)})}
                  />
                  <span className="text-xs text-muted-foreground">dias antes</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateEvent} disabled={createEventMutation.isPending}>Salvar Evento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="list" className="gap-2">
            <Gift className="h-4 w-4" /> Marcos
          </TabsTrigger>
          <TabsTrigger value="analysis" className="gap-2">
            <CheckSquare className="h-4 w-4" /> Gaps & Análise
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <History className="h-4 w-4" /> Auditoria
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          <LifeEventsTimeline lifeEvents={lifeEvents} />
          
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map(i => <Card key={i} className="h-32 animate-pulse bg-muted" />)}
            </div>
          ) : lifeEvents.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lifeEvents.map((event) => (
                <Card key={event.id} className="relative group overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                    <div className="space-y-1">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.event_date), "dd 'de' MMMM", { locale: ptBR })}
                        {event.recurring && <RefreshCw className="h-2.5 w-2.5 ml-1" />}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[9px] h-5">
                      {eventTypeLabels[event.event_type] || event.event_type}
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 italic">
                        "{event.description}"
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {event.reminder_days_before != null && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Bell className="h-3 w-3" />
                          Aviso {event.reminder_days_before}d antes
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed flex flex-col items-center justify-center p-12 text-center">
              <Gift className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <CardTitle className="text-muted-foreground">Nenhum evento registrado</CardTitle>
              <CardDescription>Eventos de vida ajudam a humanizar o relacionamento e criar aberturas genuínas para contato.</CardDescription>
              <Button variant="outline" className="mt-6 gap-2" onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar Primeiro Evento
              </Button>
            </Card>
          )}
        </TabsContent>

         <TabsContent value="analysis" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-md flex items-center gap-2">
                     <BarChart3 className="h-5 w-5 text-primary" />
                     Resumo Visual de Marcos
                   </CardTitle>
                   <CardDescription>Visualização analítica da distribuição e histórico de eventos.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <LifeEventsVisualSummary lifeEvents={lifeEvents} />
                 </CardContent>
               </Card>
             </div>
             
             <div className="space-y-6">
               <Card>
                 <CardHeader>
                   <CardTitle className="text-md flex items-center gap-2">
                     <CheckSquare className="h-5 w-5 text-primary" />
                     Checklist de Cobertura
                   </CardTitle>
                   <CardDescription>Identificação de lacunas de dados.</CardDescription>
                 </CardHeader>
                 <CardContent>
                   <LifeEventsGapChecklist lifeEvents={lifeEvents} />
                 </CardContent>
               </Card>
             </div>
           </div>
         </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Governança
              </CardTitle>
              <CardDescription>Rastreabilidade total de alterações em marcos de vida.</CardDescription>
            </CardHeader>
            <CardContent>
              <LifeEventsAuditTrail contactId={contactId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
