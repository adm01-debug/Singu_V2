import { useState } from 'react';
import { Gift, Calendar, Plus, Trash2, RefreshCw, Bell, History, CheckSquare, BarChart3, Edit2, Briefcase, Plane, Users, Trophy, Star } from 'lucide-react';
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
import type { LucideIcon } from 'lucide-react';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

type SuggestedLifeEvent = Tables<'suggested_life_events'>;
type LifeEventMetadata = { reason?: string; source?: string; suggestion_id?: string };
type RelativeSuggestionData = {
  name: string;
  relationship_type: string;
  occupation?: string | null;
  company?: string | null;
  is_decision_influencer?: boolean | null;
  notes?: string | null;
};
type SuggestionMetadata = {
  type?: string;
  relative_data?: RelativeSuggestionData;
};
import { LifeEventsGapChecklist } from './life-events/LifeEventsGapChecklist';
import { LifeEventsAuditTrail } from './life-events/LifeEventsAuditTrail';
 import { LifeEventsTimeline } from './life-events/LifeEventsTimeline';
 import { Sparkles, Check, X } from 'lucide-react';

 import { LifeEventsVisualSummary } from './life-events/LifeEventsVisualSummary';
 
interface LifeEventsTabProps {
  contactId: string;
}

export function LifeEventsTab({ contactId }: LifeEventsTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const { data: suggestions = [], refetch: refetchSuggestions } = useQuery({
    queryKey: ['suggested-life-events', contactId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suggested_life_events')
        .select('*')
        .eq('contact_id', contactId)
        .eq('status', 'pending')
        .order('confidence', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!contactId,
  });

  const handleAcceptSuggestion = async (suggestion: SuggestedLifeEvent) => {
    const meta = (suggestion.metadata ?? {}) as SuggestionMetadata;
    const isRelative = meta.type === 'relative_suggestion';
    
    if (isRelative && meta.relative_data) {
      const relData = meta.relative_data;
      const { error } = await supabase.from('contact_relatives').insert({
        contact_id: contactId,
        user_id: user?.id,
        name: relData.name,
        relationship_type: relData.relationship_type,
        occupation: relData.occupation,
        company: relData.company,
        is_decision_influencer: relData.is_decision_influencer,
        notes: relData.notes
      });

      if (!error) {
        await supabase.from('suggested_life_events').update({ status: 'accepted' }).eq('id', suggestion.id);
        queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
        refetchSuggestions();
        toast({ title: "Relacionado adicionado", description: `${relData.name} foi adicionado aos contatos relacionados.` });
      } else {
        toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
      }
      return;
    }

    const { error } = await supabase.from('life_events').insert({
      contact_id: contactId,
      user_id: user?.id,
      event_type: suggestion.event_type,
      title: suggestion.title,
      description: suggestion.description,
      event_date: suggestion.event_date || new Date().toISOString(),
      recurring: suggestion.event_type === 'birthday' || suggestion.event_type === 'anniversary',
      metadata: { source: suggestion.source_type, suggestion_id: suggestion.id }
    });

    if (!error) {
      await supabase.from('suggested_life_events').update({ status: 'accepted' }).eq('id', suggestion.id);
      queryClient.invalidateQueries({ queryKey: ['life-events', contactId] });
      refetchSuggestions();
      toast({ title: "Sugestão aceita", description: "O marco foi adicionado à linha do tempo." });
    } else {
      toast({ title: "Erro ao aceitar", description: error.message, variant: "destructive" });
    }
  };

  const handleRejectSuggestion = async (id: string) => {
    const { error } = await supabase.from('suggested_life_events').update({ status: 'rejected' }).eq('id', id);
    if (error) {
      toast({ title: "Erro ao rejeitar", description: error.message, variant: "destructive" });
    } else {
      refetchSuggestions();
    }
  };

  const createEventMutation = useMutation({
    mutationFn: async (event: TablesInsert<'life_events'>) => {
      const { data, error } = await supabase.from('life_events').insert(event).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events', contactId] });
      toast({ title: "Evento criado", description: "O marco de vida foi registrado com sucesso." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Erro ao criar evento", description: error.message, variant: "destructive" });
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...event }: Partial<Tables<'life_events'>> & { id: string }) => {
      const { data, error } = await supabase.from('life_events').update(event).eq('id', id).select().maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['life-events', contactId] });
      toast({ title: "Evento atualizado", description: "As alterações foram salvas." });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
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
    },
    onError: (e: Error) => toast({ title: "Erro ao remover evento", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setNewEvent({
      event_type: 'birthday',
      event_date: new Date().toISOString().split('T')[0],
      recurring: true,
      reminder_days_before: 7,
      reason: 'Interação manual via painel'
    });
    setEditingId(null);
  };

  const handleSaveEvent = () => {
    if (!user || !newEvent.title || !newEvent.event_date) return;
    
    const { reason, ...eventData } = newEvent;
    const metadata = { reason: reason || (editingId ? 'Atualização manual' : 'Interação manual') };
    
    if (editingId) {
      updateEventMutation.mutate({
        id: editingId,
        ...eventData,
        metadata
      });
    } else {
      createEventMutation.mutate({
        ...eventData as TablesInsert<'life_events'>,
        contact_id: contactId,
        user_id: user.id,
        metadata
      });
    }
  };

  const startEditing = (event: Tables<'life_events'>) => {
    setNewEvent({
      title: event.title,
      event_type: event.event_type,
      event_date: event.event_date.split('T')[0],
      description: event.description,
      recurring: event.recurring,
      reminder_days_before: event.reminder_days_before,
      reason: (event.metadata as LifeEventMetadata | null)?.reason || ''
    });
    setEditingId(event.id);
    setIsDialogOpen(true);
  };

  const eventTypeConfigs: Record<string, { label: string; icon: LucideIcon; color: string }> = {
    birthday: { label: 'Aniversário', icon: Gift, color: 'text-pink-500' },
    anniversary: { label: 'Bodas/Relacionamento', icon: Calendar, color: 'text-red-500' },
    promotion: { label: 'Promoção', icon: Briefcase, color: 'text-blue-500' },
    travel: { label: 'Viagem', icon: Plane, color: 'text-teal-500' },
    family: { label: 'Família', icon: Users, color: 'text-purple-500' },
    achievement: { label: 'Conquista', icon: Trophy, color: 'text-yellow-500' },
    other: { label: 'Outro', icon: Star, color: 'text-gray-500' }
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
            <Button size="sm" className="gap-2" onClick={() => resetForm()}>
              <Plus className="h-4 w-4" /> Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Editar Marco de Vida' : 'Registrar Novo Marco'}</DialogTitle>
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
                    onValueChange={(val: string) => setNewEvent({...newEvent, event_type: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(eventTypeConfigs).map(([val, config]) => (
                        <SelectItem key={val} value={val}>
                          <div className="flex items-center gap-2">
                            <config.icon className={`h-4 w-4 ${config.color}`} />
                            {config.label}
                          </div>
                        </SelectItem>
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
                    onChange={(e) => setNewEvent({...newEvent, reminder_days_before: parseInt(e.target.value) || 0})}
                  />
                  <span className="text-xs text-muted-foreground">dias antes</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSaveEvent} disabled={createEventMutation.isPending || updateEventMutation.isPending}>
                {editingId ? 'Salvar Alterações' : 'Salvar Evento'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

       {suggestions.length > 0 && (
         <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4">
           <h4 className="text-sm font-semibold flex items-center gap-2 text-primary">
             <Sparkles className="h-4 w-4" /> Sugestões Detectadas pela IA
           </h4>
           <div className="grid gap-4 sm:grid-cols-2">
             {suggestions.map((sug) => (
               <Card key={sug.id} className="border-primary/20 bg-primary/5 shadow-sm">
                 <CardContent className="p-4">
                   <div className="flex justify-between items-start mb-2">
                     <Badge variant="outline" className="bg-background text-[10px] h-5">
                       {sug.source_type === 'conversation' ? 'Da Conversa' : 'Social'}
                     </Badge>
                     <Badge variant="secondary" className="text-[10px] h-5">
                       {Math.round((sug.confidence || 0) * 100)}% Confiança
                     </Badge>
                   </div>
                   <h5 className="font-bold text-sm mb-1">{sug.title}</h5>
                   <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{sug.description}</p>
                   <div className="flex gap-2">
                     <Button 
                       size="sm" 
                       className="h-7 px-3 text-[11px] gap-1" 
                       onClick={() => handleAcceptSuggestion(sug)}
                     >
                       <Check className="h-3 w-3" /> Confirmar
                     </Button>
                     <Button 
                       size="sm" 
                       variant="ghost" 
                       className="h-7 px-2 text-[11px] gap-1 text-muted-foreground" 
                       onClick={() => handleRejectSuggestion(sug.id)}
                     >
                       <X className="h-3 w-3" /> Ignorar
                     </Button>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       )}

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
                        {(() => {
                          const Icon = eventTypeConfigs[event.event_type]?.icon || Gift;
                          return <Icon className={`h-4 w-4 ${eventTypeConfigs[event.event_type]?.color || 'text-primary'}`} />;
                        })()}
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(event.event_date), "dd 'de' MMMM", { locale: ptBR })}
                        {event.recurring && <RefreshCw className="h-2.5 w-2.5 ml-1" />}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-[9px] h-5">
                      {eventTypeConfigs[event.event_type]?.label || event.event_type}
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
                      <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" aria-label="Editar" 
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => startEditing(event)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
    <Button 
                          variant="ghost" 
                          size="icon" aria-label="Remover" 
                          className="h-7 w-7 text-destructive"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>           </Button>
                      </div>
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
                  <LifeEventsGapChecklist 
                    lifeEvents={lifeEvents} 
                    onAddGap={(type) => {
                      resetForm();
                       setNewEvent(prev => ({ ...prev, event_type: type }));
                      setIsDialogOpen(true);
                    }} 
                  />
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
