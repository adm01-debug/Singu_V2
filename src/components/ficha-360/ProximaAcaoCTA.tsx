import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Clock,
  RefreshCw,
  CheckCircle2,
  Zap,
  Mail,
  MessageCircle,
  Phone,
  Linkedin,
  Calendar,
  Copy,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNextBestAction } from '@/hooks/useNextBestAction';
import { useBestContactTime } from '@/hooks/useBestContactTime';
import { useCreateContactQuickInteraction } from '@/hooks/useInteractionsRpc';
import { useCreateTask } from '@/hooks/useTasks';
import { toast } from 'sonner';

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

const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const interactionTypes = [
  { value: 'call', label: 'Ligação' },
  { value: 'email', label: 'E-mail' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'note', label: 'Nota' },
];

const channelToTipo = (channel: string): string => {
  if (channel === 'linkedin') return 'note';
  if (interactionTypes.some((t) => t.value === channel)) return channel;
  return 'note';
};

export const ProximaAcaoCTA = React.memo(function ProximaAcaoCTA(props: Props) {
  return <ContactProximaAcaoCTA key={props.contactId} {...props} />;
});

function ContactProximaAcaoCTA({ contactId, contactName }: Props) {
  const { nextAction, isLoading, isGenerating, generate } = useNextBestAction(contactId);
  const { data: bestTime } = useBestContactTime(contactId);
  const createInteraction = useCreateContactQuickInteraction();
  const registerPending = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  const createTask = useCreateTask();

  const [scriptOpen, setScriptOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [resumo, setResumo] = useState('');
  const [tipo, setTipo] = useState('call');

  const bestTimeText = useMemo(() => {
    if (!bestTime) return null;
    const dow = typeof bestTime.day_of_week === 'number' ? bestTime.day_of_week : null;
    const hour = typeof bestTime.hour_of_day === 'number' ? bestTime.hour_of_day : null;
    if (dow === null || hour === null) return null;
    return `${dayLabels[dow] ?? '—'} às ${String(hour).padStart(2, '0')}h`;
  }, [bestTime]);

  const handleOpenRegister = () => {
    if (!nextAction) return;
    setResumo(nextAction.action);
    setTipo(channelToTipo(nextAction.channel));
    setRegisterOpen(true);
  };

  const handleConfirmRegister = async () => {
    if (registerPending.current) return;
    if (!resumo.trim()) {
      toast.warning('Informe um resumo');
      return;
    }
    registerPending.current = true;
    try {
      await createInteraction.mutateAsync({
        p_contact_id: contactId,
        p_tipo: tipo,
        p_resumo: resumo.trim(),
      });
      if (!active.current) return;
      toast.success('Interação registrada!');
      setRegisterOpen(false);
      setResumo('');
      generate();
    } catch {
      toast.error('Erro ao registrar interação');
    } finally {
      registerPending.current = false;
    }
  };

  const handleCopyScript = async () => {
    if (!nextAction?.suggested_script) return;
    try {
      await navigator.clipboard.writeText(nextAction.suggested_script);
      toast.success('Script copiado');
    } catch {
      toast.error('Não foi possível copiar');
    }
  };

  const handleCreateTask = () => {
    if (!nextAction) return;
    createTask.mutate({
      title: nextAction.action,
      description: nextAction.reason,
      contact_id: contactId,
      priority: nextAction.urgency === 'high' ? 'high' : nextAction.urgency === 'low' ? 'low' : 'medium',
      task_type: nextAction.channel,
    });
  };

  if (isLoading) {
    return (
      <Card variant="outlined">
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
              <p className="font-medium text-sm">Próxima ação sugerida</p>
              <p className="text-xs text-muted-foreground">
                Gere uma sugestão de IA combinando canal ideal e melhor horário com {contactName.split(' ')[0]}
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
            Gerar sugestão
          </LoadingButton>
        </CardContent>
      </Card>
    );
  }

  const channel = channelMeta[nextAction.channel] ?? { label: nextAction.channel, Icon: Mail };
  const urgency = urgencyMeta[nextAction.urgency] ?? urgencyMeta.medium;
  const ChannelIcon = channel.Icon;
  const suggestedChannel = bestTime?.suggested_channel;
  const channelMismatch =
    suggestedChannel && suggestedChannel !== nextAction.channel
      ? channelMeta[suggestedChannel]?.label ?? suggestedChannel
      : null;

  return (
    <Card variant="outlined">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Próxima ação sugerida
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

        {bestTimeText && (
          <div className="bg-muted/40 border border-border/50 rounded-md p-3 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Melhor horário: {bestTimeText}</p>
              {typeof bestTime?.success_rate === 'number' && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Taxa de resposta histórica: {Math.round(bestTime.success_rate)}%
                </p>
              )}
              {channelMismatch && (
                <p className="text-xs text-warning mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Canal sugerido pelo histórico: {channelMismatch}
                </p>
              )}
            </div>
          </div>
        )}

        {nextAction.suggested_script && (
          <Collapsible open={scriptOpen} onOpenChange={setScriptOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between -ml-2">
                <span className="text-xs font-medium">Ver script sugerido</span>
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

        {registerOpen && (
          <div className="bg-muted/30 border border-border/50 rounded-md p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium">Registrar interação no CRM</p>
              <Button variant="ghost" size="icon-sm" aria-label="Fechar" onClick={() => setRegisterOpen(false)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="w-32 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interactionTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={resumo}
                onChange={(e) => setResumo(e.target.value)}
                placeholder="Resumo da interação..."
                className="h-9 text-xs flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmRegister()}
              />
              <LoadingButton
                isLoading={createInteraction.isPending}
                loadingText=""
                onClick={handleConfirmRegister}
                size="sm"
                className="h-9"
              >
                Confirmar
              </LoadingButton>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 flex-wrap pt-1">
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
          <Button onClick={handleCreateTask} variant="outline" size="sm" disabled={createTask.isPending}>
            <CheckCircle2 className="w-3 h-3" />
            Criar tarefa
          </Button>
          <Button onClick={handleOpenRegister} variant="default" size="sm" disabled={registerOpen}>
            <Zap className="w-3 h-3" />
            Registrar interação
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProximaAcaoCTA;
