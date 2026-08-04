import { memo, useEffect, useState } from 'react';
import { Check, MessageSquareReply, MessageSquare, VolumeX, PhoneOff, SkipForward, Loader2, ArrowLeft, History, Inbox, Mail, Phone, CalendarDays, MessageCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { parseApiError } from '@/lib/errorMessages';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  useRegisterPassoFeedback,
  useProximoPassoFeedbacks,
  type PassoOutcome,
} from '@/hooks/useProximoPassoFeedback';

interface Props {
  passoId: string;
  contactId: string;
  channelHint?: string | null;
}

interface OutcomeOption {
  value: PassoOutcome;
  label: string;
  icon: typeof Check;
  className: string;
}

const OPTIONS: OutcomeOption[] = [
  {
    value: 'respondeu_positivo',
    label: 'Respondeu — positivo',
    icon: MessageSquareReply,
    className: 'text-success',
  },
  {
    value: 'respondeu_neutro',
    label: 'Respondeu — neutro',
    icon: MessageSquare,
    className: 'text-info',
  },
  {
    value: 'nao_respondeu',
    label: 'Não respondeu',
    icon: VolumeX,
    className: 'text-warning',
  },
  {
    value: 'nao_atendeu',
    label: 'Não atendeu',
    icon: PhoneOff,
    className: 'text-warning',
  },
  {
    value: 'pulou',
    label: 'Pular por 7 dias',
    icon: SkipForward,
    className: 'text-muted-foreground',
  },
];

const TOAST_LABEL: Record<PassoOutcome, string> = {
  respondeu_positivo: 'Ótimo! Marcado como resposta positiva.',
  respondeu_neutro: 'Resposta neutra registrada.',
  nao_respondeu: 'Sem resposta registrada — vamos rebaixar a prioridade.',
  nao_atendeu: 'Sem retorno registrado.',
  pulou: 'Passo silenciado por 7 dias.',
};

const CONFIRM_DESCRIPTION: Record<PassoOutcome, string> = {
  respondeu_positivo: 'Vamos registrar como interação positiva e manter o ritmo.',
  respondeu_neutro: 'Vamos registrar como conversa morna, sem sinais fortes.',
  nao_respondeu: 'Vamos marcar que não houve resposta e rebaixar a prioridade.',
  nao_atendeu: 'Vamos registrar tentativa sem retorno na ligação.',
  pulou: 'Este passo ficará silenciado pelos próximos 7 dias.',
};

type ChannelKey = 'whatsapp' | 'email' | 'call' | 'meeting';

const CHANNELS: { value: ChannelKey; label: string; icon: typeof Mail }[] = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'E-mail', icon: Mail },
  { value: 'call', label: 'Ligação', icon: Phone },
  { value: 'meeting', label: 'Reunião', icon: CalendarDays },
];

function normalizeChannel(hint?: string | null): ChannelKey | null {
  if (!hint) return null;
  const v = hint.toLowerCase();
  if (v.includes('whats')) return 'whatsapp';
  if (v.includes('mail') || v === 'email' || v === 'e-mail') return 'email';
  if (v.includes('call') || v.includes('lig') || v.includes('phone') || v.includes('tel')) return 'call';
  if (v.includes('meet') || v.includes('reuni')) return 'meeting';
  return null;
}

function PassoFeedbackMenuComponent({ passoId, contactId, channelHint }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'form' | 'history'>('form');
  const [notes, setNotes] = useState('');
  const [pendingOutcome, setPendingOutcome] = useState<PassoOutcome | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<ChannelKey | null>(() => normalizeChannel(channelHint));

  // Sincroniza com mudança do hint enquanto popover está fechado
  useEffect(() => {
    if (!open) setSelectedChannel(normalizeChannel(channelHint));
  }, [channelHint, open]);
  const { mutate, isPending } = useRegisterPassoFeedback();
  const { data: allFeedbacks = [], isLoading: isLoadingHistory } = useProximoPassoFeedbacks(
    open ? contactId : undefined,
  );
  const history = allFeedbacks.filter((f) => f.passo_id === passoId);

  // Anti-ruído: bloqueia "nao_respondeu" se já houve um nas últimas 24h para este passo
  const NAO_RESPONDEU_COOLDOWN_HOURS = 24;
  const lastNaoRespondeu = history.find((f) => f.outcome === 'nao_respondeu');
  const naoRespondeuLockedUntil = lastNaoRespondeu
    ? new Date(new Date(lastNaoRespondeu.executed_at).getTime() + NAO_RESPONDEU_COOLDOWN_HOURS * 3600_000)
    : null;
  const naoRespondeuLocked = !!naoRespondeuLockedUntil && naoRespondeuLockedUntil.getTime() > Date.now();
  const hoursLeft = naoRespondeuLockedUntil
    ? Math.max(1, Math.ceil((naoRespondeuLockedUntil.getTime() - Date.now()) / 3600_000))
    : 0;

  const resetAndClose = () => {
    setNotes('');
    setPendingOutcome(null);
    setView('form');
    setOpen(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPendingOutcome(null);
      setNotes('');
      setView('form');
    }
    setOpen(next);
  };

  const handleConfirm = () => {
    if (!pendingOutcome) return;
    const outcome = pendingOutcome;
    if (outcome === 'nao_respondeu' && naoRespondeuLocked) {
      toast.error('Aguarde antes de repetir', {
        description: `Você já marcou "Não respondeu" para este passo nas últimas ${NAO_RESPONDEU_COOLDOWN_HOURS}h. Tente novamente em ~${hoursLeft}h.`,
      });
      return;
    }
    mutate(
      {
        contactId,
        passoId,
        outcome,
        channelUsed: selectedChannel ?? channelHint ?? null,
        notes: notes || null,
      },
      {
        onSuccess: () => {
          toast.success('Feedback registrado', { description: TOAST_LABEL[outcome] });
          resetAndClose();
        },
        onError: (err) => {
          toast.error('Não foi possível registrar', {
            description: parseApiError(err, 'Tente novamente.'),
          });
        },
      },
    );
  };

  const pendingOption = pendingOutcome ? OPTIONS.find((o) => o.value === pendingOutcome) : null;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button size="xs" variant="outline">
          <Check className="h-3 w-3" />
          Feito
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-3">
        <div className="flex items-center gap-1 mb-2 border-b pb-2">
          <Button
            size="xs"
            variant={view === 'form' ? 'secondary' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => setView('form')}
          >
            <Check className="h-3 w-3" />
            Registrar
          </Button>
          <Button
            size="xs"
            variant={view === 'history' ? 'secondary' : 'ghost'}
            className="h-7 text-xs"
            onClick={() => {
              setPendingOutcome(null);
              setView('history');
            }}
          >
            <History className="h-3 w-3" />
            Histórico
            {history.length > 0 ? (
              <span className="ml-1 rounded-full bg-muted px-1.5 text-[10px] leading-4">
                {history.length}
              </span>
            ) : null}
          </Button>
        </div>

        {view === 'history' ? (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Tentativas anteriores</p>
              <p className="text-xs text-muted-foreground">
                Últimos 30 dias deste passo.
              </p>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <Inbox className="h-5 w-5 mb-1" />
                <p className="text-xs">Nenhuma tentativa registrada ainda.</p>
              </div>
            ) : (
              <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {history.map((item) => {
                  const opt = OPTIONS.find((o) => o.value === item.outcome);
                  const Icon = opt?.icon ?? Check;
                  const executedDate = new Date(item.executed_at);
                  return (
                    <li
                      key={item.id}
                      className="rounded-md border bg-muted/30 p-2 space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Icon
                            className={`h-3.5 w-3.5 shrink-0 ${opt?.className ?? 'text-muted-foreground'}`}
                          />
                          <span className="text-xs font-medium truncate">
                            {opt?.label ?? item.outcome}
                          </span>
                        </div>
                        <span
                          className="text-[10px] text-muted-foreground shrink-0"
                          title={format(executedDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        >
                          {formatDistanceToNow(executedDate, { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span>
                          Canal:{' '}
                          <span className="font-medium text-foreground">
                            {item.channel_used ?? '—'}
                          </span>
                        </span>
                        <span>{format(executedDate, 'dd/MM HH:mm', { locale: ptBR })}</span>
                      </div>
                      {item.notes ? (
                        <p className="text-[11px] text-muted-foreground border-t pt-1">
                          {item.notes}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : pendingOption ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium">Confirmar registro?</p>
              <p className="text-xs text-muted-foreground">
                Revise antes de salvar — a ação é registrada no histórico.
              </p>
            </div>

            <div className="rounded-md border bg-muted/40 p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <pendingOption.icon className={`h-4 w-4 ${pendingOption.className}`} />
                <span className="text-sm font-medium">{pendingOption.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {CONFIRM_DESCRIPTION[pendingOption.value]}
              </p>
              <p className="text-[11px] text-muted-foreground border-t pt-1.5 mt-1.5">
                <span className="font-medium">Canal:</span>{' '}
                {selectedChannel
                  ? CHANNELS.find((c) => c.value === selectedChannel)?.label
                  : 'não informado'}
              </p>
              {notes ? (
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium">Observação:</span> {notes}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => setPendingOutcome(null)}
                disabled={isPending}
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar
              </Button>
              <Button size="xs" onClick={handleConfirm} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Check className="h-3 w-3" />
                )}
                Confirmar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div>
              <p className="text-sm font-medium">Como foi?</p>
              <p className="text-xs text-muted-foreground">
                Seu feedback melhora as próximas recomendações.
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">Canal usado</p>
              <div className="grid grid-cols-4 gap-1">
                {CHANNELS.map((ch) => {
                  const ChIcon = ch.icon;
                  const active = selectedChannel === ch.value;
                  return (
                    <Button
                      key={ch.value}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="xs"
                      className="h-8 flex-col gap-0.5 px-1 text-[10px]"
                      disabled={isPending}
                      onClick={() => setSelectedChannel(active ? null : ch.value)}
                      title={ch.label}
                      aria-pressed={active}
                    >
                      <ChIcon className="h-3 w-3" />
                      <span className="leading-none">{ch.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              {OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isLocked = opt.value === 'nao_respondeu' && naoRespondeuLocked;
                return (
                  <Button
                    key={opt.value}
                    variant="outline"
                    size="sm"
                    className="justify-start h-auto py-2"
                    disabled={isPending || isLocked}
                    onClick={() => setPendingOutcome(opt.value)}
                    title={
                      isLocked
                        ? `Você já marcou "Não respondeu" recentemente. Aguarde ~${hoursLeft}h para evitar duplicidade.`
                        : undefined
                    }
                  >
                    <Icon className={`h-3.5 w-3.5 ${opt.className}`} />
                    <span className="text-xs">{opt.label}</span>
                    {isLocked ? (
                      <span className="ml-auto text-[10px] text-muted-foreground">
                        em ~{hoursLeft}h
                      </span>
                    ) : null}
                  </Button>
                );
              })}
            </div>
            {naoRespondeuLocked ? (
              <p className="text-[10px] text-muted-foreground">
                Para evitar ruído, "Não respondeu" só pode ser registrado a cada {NAO_RESPONDEU_COOLDOWN_HOURS}h por passo.
              </p>
            ) : null}

            <div className="space-y-1">
              <label htmlFor={`notes-${passoId}`} className="text-xs text-muted-foreground">
                Observação (opcional)
              </label>
              <Input
                id={`notes-${passoId}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                placeholder="Ex.: pediu para retomar em 15 dias"
                maxLength={200}
                className="h-8 text-xs"
                disabled={isPending}
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                size="xs"
                variant="ghost"
                onClick={() => {
                  setNotes('');
                  setOpen(false);
                }}
                disabled={isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export const PassoFeedbackMenu = memo(PassoFeedbackMenuComponent);
