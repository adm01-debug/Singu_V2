 import { useQuery } from '@tanstack/react-query';
 import { supabase } from '@/integrations/supabase/client';
 import { StepForward, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Sparkles, Copy, RefreshCw, CheckCircle2, Mail, MessageCircle, Phone, Linkedin, Calendar, ChevronDown, ChevronUp, AlarmClock, Edit3, Save, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useNextBestAction } from '@/hooks/useNextBestAction';
import { useCreateTask } from '@/hooks/useTasks';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  contactId: string;
  contactName: string;
}

const channelMeta: Record<string, { label: string; Icon: typeof Mail }> = {
  email: { label: 'Email', Icon: Mail },
  whatsapp: { label: 'WhatsApp', Icon: MessageCircle },
  call: { label: 'Ligação', Icon: Phone },
  linkedin: { label: 'LinkedIn', Icon: Linkedin },
  meeting: { label: 'Reunião', Icon: Calendar },
};

const urgencyMeta: Record<string, { label: string; variant: 'default' | 'destructive' | 'secondary' }> = {
  high: { label: 'Alta urgência', variant: 'destructive' },
  medium: { label: 'Urgência média', variant: 'default' },
  low: { label: 'Baixa urgência', variant: 'secondary' },
};

 export function NextBestActionCard({ contactId, contactName }: Props) {
     const { nextAction, isLoading, isGenerating, isCompleting, generate, complete, updateScript } = useNextBestAction(contactId);
    const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
    const [completionNotes, setCompletionNotes] = useState('');
    const [completionDate, setCompletionDate] = useState(new Date().toISOString().split('T')[0]);
 
   // Fetch current deal stage and recent context
   const { data: contactContext } = useQuery({
     queryKey: ['contact-nba-context', contactId],
     queryFn: async () => {
       const { data: contact } = await supabase
         .from('contacts')
          .select('relationship_stage, last_interaction_at')
         .eq('id', contactId)
          .maybeSingle();
       return contact;
     },
     enabled: !!contactId
   });
  const createTask = useCreateTask();
   const [scriptOpen, setScriptOpen] = useState(false);
    const [isEditingScript, setIsEditingScript] = useState(false);
    const [editedScript, setEditedScript] = useState(nextAction?.edited_script || nextAction?.suggested_script || '');
 
   const handleSmartSchedule = () => {
     if (!nextAction) return;
     // Logic for smart date: if urgent, tomorrow; otherwise 3 days from now
     const suggestedDate = new Date();
     const daysToAdd = nextAction.urgency === 'high' ? 1 : nextAction.urgency === 'medium' ? 3 : 7;
     suggestedDate.setDate(suggestedDate.getDate() + daysToAdd);
     suggestedDate.setHours(10, 0, 0, 0);
     
     handleCreateTask(suggestedDate);
     toast.success(`Tarefa agendada para ${formatDistanceToNow(suggestedDate, { addSuffix: true, locale: ptBR })}`);
   };
 
    const displayScript = editedScript || nextAction?.edited_script || nextAction?.suggested_script || '';

   const handleCopyScript = async () => {
     if (!displayScript) return;
     try {
       await navigator.clipboard.writeText(displayScript);
      toast.success('Script copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

   const handleCreateTask = (suggestedDate?: Date) => {
     if (!nextAction) return;
     createTask.mutate({
       title: nextAction.action,
       description: nextAction.reason,
       contact_id: contactId,
       priority: nextAction.urgency === 'high' ? 'high' : nextAction.urgency === 'low' ? 'low' : 'medium',
       task_type: nextAction.channel,
       due_date: suggestedDate?.toISOString(),
       nba_id: nextAction.id,
       script_context: nextAction.suggested_script
     });
   };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="h-24 animate-pulse bg-muted/40 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!nextAction) {
    return (
      <Card variant="outlined">
        <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Próxima Melhor Ação</p>
              <p className="text-xs text-muted-foreground">
                Gere uma sugestão de IA do próximo passo ideal com {contactName.split(' ')[0]}
              </p>
            </div>
          </div>
          <LoadingButton
            isLoading={isGenerating}
            loadingText="Gerando..."
            onClick={() => generate()}
            variant="gradient"
            size="sm"
          >
            <Sparkles className="w-4 h-4" />
            Gerar sugestão IA
          </LoadingButton>
        </CardContent>
      </Card>
    );
  }

  const channel = channelMeta[nextAction.channel] ?? { label: nextAction.channel, Icon: Mail };
  const urgency = urgencyMeta[nextAction.urgency] ?? urgencyMeta.medium;
  const ChannelIcon = channel.Icon;

  return (
    <Card variant="outlined">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
           <CardTitle className="flex items-center gap-2 text-primary font-bold">
            <Sparkles className="w-4 h-4 text-primary" />
            Próxima Melhor Ação
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={urgency.variant}>{urgency.label}</Badge>
            <Badge variant="outline" className="gap-1">
              <ChannelIcon className="w-3 h-3" />
              {channel.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
         <div className="space-y-3">
           {contactContext?.relationship_stage && (
             <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-md border border-primary/10">
               <MapPin className="w-3.5 h-3.5 text-primary" />
               <span className="text-xs font-medium">Estágio Atual: <span className="capitalize">{contactContext.relationship_stage.replace('_', ' ')}</span></span>
             </div>
           )}
           
           <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
             <div className="flex items-center gap-2 mb-1">
               <StepForward className="w-3.5 h-3.5 text-primary" />
               <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estratégia de Abordagem</span>
             </div>
             <p className="text-base font-bold leading-snug text-foreground">{nextAction.action}</p>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed italic border-l-2 border-primary/20 pl-3">"{nextAction.reason}"</p>
            </div>
          </div>
        {nextAction && (
          <Collapsible open={scriptOpen} onOpenChange={setScriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between -ml-2">
                <span className="text-xs font-medium">Script sugerido</span>
                {scriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/40 border border-border/50 rounded-md p-3 mt-1">
                {isEditingScript ? (
                  <Textarea 
                    value={editedScript} 
                    onChange={(e) => setEditedScript(e.target.value)}
                    className="text-sm min-h-[120px] mb-2"
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{displayScript}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyScript} className="-ml-2">
                    <Copy className="w-3 h-3 mr-2" />
                    Copiar
                  </Button>
                   <Button 
                     variant="ghost" 
                     size="sm" 
                     onClick={() => {
                       if (isEditingScript && nextAction) {
                         updateScript({ id: nextAction.id, script: editedScript });
                       }
                       setIsEditingScript(!isEditingScript);
                     }}
                   >
                     {isEditingScript ? (
                       <><Save className="w-3 h-3 mr-2" /> Salvar</>
                     ) : (
                       <><Edit3 className="w-3 h-3 mr-2" /> Editar</>
                     )}
                   </Button>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {nextAction.expected_outcome && (
          <div className="text-xs text-muted-foreground border-t border-border/50 pt-2">
            <span className="font-medium text-foreground">Resultado esperado:</span> {nextAction.expected_outcome}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
          <span className="text-[10px] text-muted-foreground">
            Gerado {formatDistanceToNow(new Date(nextAction.generated_at), { addSuffix: true, locale: ptBR })}
          </span>
           <div className="flex items-center gap-2">
             <LoadingButton
               isLoading={isGenerating}
               loadingText="Gerando..."
               onClick={() => generate()}
               variant="ghost"
               size="sm"
             >
               <RefreshCw className="w-3 h-3" />
               Regenerar
             </LoadingButton>
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setCompleteDialogOpen(true)}
                  variant="default"
                  size="sm"
                  className="bg-success hover:bg-success/90"
                >
                  <Check className="w-3 h-3" />
                  Concluir
                </Button>
      <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Concluir Ação: {nextAction.action}</DialogTitle>
            <DialogDescription>
              Registre os detalhes da conclusão para melhorar as futuras recomendações.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Conclusão</label>
              <input 
                type="date" 
                value={completionDate} 
                onChange={(e) => setCompletionDate(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Observações e Resultado</label>
              <Textarea 
                placeholder="Como foi o contato? Algum insight importante?" 
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCompleteDialogOpen(false)}>Cancelar</Button>
            <LoadingButton 
              isLoading={isCompleting}
              onClick={() => {
                complete({ 
                  id: nextAction.id, 
                  notes: completionNotes,
                  completed_at: completionDate
                });
                setCompleteDialogOpen(false);
              }}
            >
              Confirmar Conclusão
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
                <Button onClick={() => handleCreateTask()} variant="outline" size="sm" disabled={createTask.isPending}>
                  <CheckCircle2 className="w-3 h-3" />
                  Criar tarefa
                </Button>
                 <Button 
                   onClick={handleSmartSchedule}
                   variant="ghost" 
                   size="sm" 
                   disabled={createTask.isPending}
                   className="gap-2"
                 >
                   <AlarmClock className="w-3 h-3" />
                   Agendar
                 </Button>
              </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
