import { useState } from 'react';
 import { Sparkles, Copy, RefreshCw, CheckCircle2, Mail, MessageCircle, Phone, Linkedin, Calendar, ChevronDown, ChevronUp, AlarmClock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const { nextAction, isLoading, isGenerating, generate } = useNextBestAction(contactId);
  const createTask = useCreateTask();
  const [scriptOpen, setScriptOpen] = useState(false);

  const handleCopyScript = async () => {
    if (!nextAction?.suggested_script) return;
    try {
      await navigator.clipboard.writeText(nextAction.suggested_script);
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
          <CardTitle className="flex items-center gap-2">
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
        <div>
          <p className="text-base font-semibold leading-snug">{nextAction.action}</p>
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{nextAction.reason}</p>
        </div>

        {nextAction.suggested_script && (
          <Collapsible open={scriptOpen} onOpenChange={setScriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between -ml-2">
                <span className="text-xs font-medium">Script sugerido</span>
                {scriptOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="bg-muted/40 border border-border/50 rounded-md p-3 mt-1">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{nextAction.suggested_script}</p>
                <Button variant="ghost" size="sm" onClick={handleCopyScript} className="mt-2 -ml-2">
                  <Copy className="w-3 h-3" />
                  Copiar script
                </Button>
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
               <Button onClick={() => handleCreateTask()} variant="default" size="sm" disabled={createTask.isPending}>
                 <CheckCircle2 className="w-3 h-3" />
                 Criar tarefa
               </Button>
               <Button 
                 onClick={() => {
                   const tomorrow = new Date();
                   tomorrow.setDate(tomorrow.getDate() + 1);
                   tomorrow.setHours(9, 0, 0, 0);
                   handleCreateTask(tomorrow);
                 }} 
                 variant="outline" 
                 size="sm" 
                 disabled={createTask.isPending}
                 title="Agendar para amanhã"
               >
                 <AlarmClock className="w-3 h-3" />
               </Button>
             </div>
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
