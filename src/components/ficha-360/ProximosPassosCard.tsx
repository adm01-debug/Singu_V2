import { memo, useEffect, useState } from 'react';
import {
  ListChecks,
  Sparkles,
  Mail,
  MessageCircle,
  Phone,
  Linkedin,
  Calendar,
  Plus,
  Loader2,
  Check,
  ChevronDown,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNextBestAction } from '@/hooks/useNextBestAction';
import type { ProximoPasso, ProximoPassoChannel, ProximoPassoPriority } from '@/domain/nextStepLogic';
import type { BestTimeHint } from '@/lib/proximoPassoDefaults';
import { ProximoPassoQuickForm } from './ProximoPassoQuickForm';
import { AgendarReuniaoForm } from './AgendarReuniaoForm';
import { CopyScriptMenu } from './CopyScriptMenu';
import { PassoFeedbackMenu } from './PassoFeedbackMenu';
import {
  useProximoPassoFeedbacks,
  getLastOutcome,
  getRecentSkipUntil,
  type PassoOutcome,
} from '@/hooks/useProximoPassoFeedback';
import type { SentimentTone } from '@/lib/scriptGenerator';
import { useProximosPassosFilters, type NbaPriority } from '@/hooks/useProximosPassosFilters';
import { filterAndSortPassos } from '@/lib/filterProximosPassos';
import { ProximosPassosFiltersBar } from './ProximosPassosFiltersBar';
import { ProximosPassosPresets } from './ProximosPassosPresets';
import { useFicha360PreferencesSync } from '@/hooks/useFicha360PreferencesSync';
import type { FilterPreset } from '@/hooks/useFicha360FilterPresets';
import { useSearchParams } from 'react-router-dom';

interface Props {
  contactId: string;
  contactName: string;
  passos: ProximoPasso[];
  bestTime?: BestTimeHint | null;
  firstName?: string;
  sentiment?: SentimentTone;
  companyId?: string | null;
  preferredChannel?: string | null;
}

const channelIcon: Record<ProximoPassoChannel, typeof Mail> = {
  whatsapp: MessageCircle,
  email: Mail,
  call: Phone,
  meeting: Calendar,
  linkedin: Linkedin,
};

const priorityMeta: Record<ProximoPassoPriority, { label: string; className: string }> = {
  alta: {
    label: 'Alta',
    className: 'bg-destructive/10 text-destructive border-destructive/30',
  },
  media: {
    label: 'Média',
    className: 'bg-warning/10 text-warning border-warning/30',
  },
  baixa: {
    label: 'Baixa',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

const urgencyToClass = (u?: string) => {
  const v = (u || '').toLowerCase();
  if (v === 'high') return 'bg-destructive/10 text-destructive border-destructive/30';
  if (v === 'low') return 'bg-muted text-muted-foreground border-border';
  return 'bg-warning/10 text-warning border-warning/30';
};

const outcomeMeta: Record<PassoOutcome, { label: string; className: string }> = {
  respondeu_positivo: { label: '✅ Respondeu', className: 'bg-success/10 text-success border-success/30' },
  respondeu_neutro: { label: '💬 Neutro', className: 'bg-info/10 text-info border-info/30' },
  nao_respondeu: { label: '🔇 Sem resposta', className: 'bg-warning/10 text-warning border-warning/30' },
  nao_atendeu: { label: '📵 Sem atender', className: 'bg-warning/10 text-warning border-warning/30' },
  pulou: { label: '⏭️ Pulado', className: 'bg-muted text-muted-foreground border-border' },
};

function relativeDays(daysAgo: number): string {
  if (daysAgo <= 0) return 'hoje';
  if (daysAgo === 1) return 'há 1d';
  return `há ${daysAgo}d`;
}

function ProximosPassosCardComponent({ contactId, contactName, passos, bestTime, firstName, sentiment, companyId, preferredChannel }: Props) {
  const { nextAction, isGenerating, generate } = useNextBestAction(contactId);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createdIds, setCreatedIds] = useState<Set<string>>(new Set());
  const { data: feedbacks = [] } = useProximoPassoFeedbacks(contactId);
  const {
    priorities,
    channels,
    sort,
    setPriorities,
    setChannels,
    setSort,
    clear: clearFilters,
    activeCount,
  } = useProximosPassosFilters();

  // Persistência por usuário (cross-device) das preferências de filtros
  const [urlParams] = useSearchParams();
  const hasUrlOverride =
    urlParams.has('nbaPrio') || urlParams.has('nbaCanal') || urlParams.has('nbaSort');
  useFicha360PreferencesSync({
    current: { priorities, channels, sort },
    hasUrlOverride,
    hydrate: (prefs) => {
      setPriorities(prefs.priorities);
      setChannels(prefs.channels);
      setSort(prefs.sort);
    },
  });

  const togglePriority = (p: NbaPriority) => {
    if (priorities.includes(p)) setPriorities(priorities.filter((x) => x !== p));
    else setPriorities([...priorities, p]);
  };
  const toggleChannel = (c: string) => {
    if (channels.includes(c)) setChannels(channels.filter((x) => x !== c));
    else setChannels([...channels, c]);
  };

  const applyPreset = (preset: FilterPreset) => {
    setPriorities(preset.priorities);
    setChannels(preset.channels);
    setSort(preset.sort);
  };

  // Limpa badges "criada" após 4s
  useEffect(() => {
    if (createdIds.size === 0) return;
    const timer = setTimeout(() => setCreatedIds(new Set()), 4000);
    return () => clearTimeout(timer);
  }, [createdIds]);

  const resolvedFirstName = (firstName || contactName.split(' ')[0] || 'contato').trim();
  const bestTimeStr = bestTime?.hour_of_day != null
    ? `${String(bestTime.hour_of_day).padStart(2, '0')}:00`
    : null;

  const handleCreated = (passoId: string) => {
    setExpandedId(null);
    setCreatedIds((prev) => {
      const next = new Set(prev);
      next.add(passoId);
      return next;
    });
  };

  const visiblePassos = passos.filter((p) => !getRecentSkipUntil(feedbacks, p.id));
  const displayPassos = filterAndSortPassos(visiblePassos, {
    priorities,
    channels,
    sort,
    preferredChannel,
    feedbacks,
  });

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            Próximos Passos
            {passos.length > 0 && (
              <Badge variant="outline" className="text-xs font-normal">
                {passos.length}
              </Badge>
            )}
          </CardTitle>
        </div>
        {visiblePassos.length >= 2 && (
          <>
            <ProximosPassosPresets
              current={{ priorities, channels, sort }}
              hasActiveFilters={activeCount > 0}
              onApply={applyPreset}
            />
            <ProximosPassosFiltersBar
              priorities={priorities}
              channels={channels}
              sort={sort}
              shownCount={displayPassos.length}
              totalCount={visiblePassos.length}
              activeCount={activeCount}
              onTogglePriority={togglePriority}
              onToggleChannel={toggleChannel}
              onChangeSort={setSort}
              onClear={clearFilters}
            />
          </>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Bloco IA */}
        <div className="rounded-md border border-border bg-muted/30 p-3">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="rounded-full bg-primary/10 p-1.5 mt-0.5 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                {nextAction ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-medium text-sm">{nextAction.action}</p>
                      <Badge variant="outline" className={cn('text-[10px] capitalize', urgencyToClass(nextAction.urgency))}>
                        {nextAction.urgency}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{nextAction.reason}</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-sm">Sugestão de IA</p>
                    <p className="text-xs text-muted-foreground">
                      Gere uma próxima ação personalizada para {contactName.split(' ')[0]}.
                    </p>
                  </>
                )}
              </div>
            </div>
            {!nextAction && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => generate()}
                disabled={isGenerating}
                className="shrink-0"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                Gerar com IA
              </Button>
            )}
          </div>
        </div>

        {/* Lista local */}
        {visiblePassos.length === 0 ? (
          <div className="text-center py-6 text-sm text-muted-foreground">
            Sem ações sugeridas no momento. Registre uma interação para gerar novas recomendações.
          </div>
        ) : displayPassos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
            Nenhuma sugestão com esses filtros.
            <div className="mt-2">
              <Button variant="outline" size="xs" onClick={clearFilters}>
                <X className="h-3 w-3" /> Limpar filtros
              </Button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {displayPassos.map((p) => {
              const Icon = channelIcon[p.channel] ?? ListChecks;
              const pm = priorityMeta[p.priority];
              const isExpanded = expandedId === p.id;
              const wasCreated = createdIds.has(p.id);
              const last = getLastOutcome(feedbacks, p.id);
              return (
                <li
                  key={p.id}
                  className="rounded-md border border-border bg-card p-3 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-md bg-muted p-1.5 mt-0.5 shrink-0">
                      <Icon className="h-3.5 w-3.5 text-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="font-medium text-sm">{p.title}</p>
                        <Badge variant="outline" className={cn('text-[10px]', pm.className)}>
                          {pm.label}
                        </Badge>
                        {wasCreated && (
                          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/30">
                            <Check className="h-2.5 w-2.5 mr-0.5" />
                            {p.id === 'agendar-reuniao' ? 'Reunião agendada' : 'Tarefa criada'}
                          </Badge>
                        )}
                        {last && (
                          <Badge variant="outline" className={cn('text-[10px]', outcomeMeta[last.outcome].className)}>
                            {outcomeMeta[last.outcome].label} · {relativeDays(last.daysAgo)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{p.detail}</p>
                      <p className="text-xs text-muted-foreground/80 mt-1 italic">{p.reason}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <Button
                          size="xs"
                          variant={isExpanded ? 'default' : 'outline'}
                          onClick={() => setExpandedId(isExpanded ? null : p.id)}
                          aria-expanded={isExpanded}
                        >
                          {p.id === 'agendar-reuniao' ? (
                            <Calendar className="h-3 w-3" />
                          ) : (
                            <Plus className="h-3 w-3" />
                          )}
                          {p.id === 'agendar-reuniao' ? 'Agendar reunião' : 'Criar tarefa'}
                          <ChevronDown
                            className={cn('h-3 w-3 transition-transform', isExpanded && 'rotate-180')}
                            aria-hidden="true"
                          />
                        </Button>
                        <PassoFeedbackMenu
                          passoId={p.id}
                          contactId={contactId}
                          channelHint={p.channel}
                        />
                        <CopyScriptMenu
                          passoId={p.id}
                          firstName={resolvedFirstName}
                          sentiment={sentiment ?? null}
                          bestTime={bestTimeStr}
                          fallbackScript={p.scriptHint}
                        />
                      </div>

                      {isExpanded && (
                        p.id === 'agendar-reuniao' ? (
                          <AgendarReuniaoForm
                            passo={p}
                            contactId={contactId}
                            companyId={companyId ?? null}
                            firstName={resolvedFirstName}
                            sentiment={sentiment}
                            bestTime={bestTime}
                            onCreated={() => handleCreated(p.id)}
                            onCancel={() => setExpandedId(null)}
                          />
                        ) : (
                          <ProximoPassoQuickForm
                            passo={p}
                            bestTime={bestTime}
                            contactId={contactId}
                            onCreated={() => handleCreated(p.id)}
                            onCancel={() => setExpandedId(null)}
                          />
                        )
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export const ProximosPassosCard = memo(ProximosPassosCardComponent);
