import React, { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Building2, User, MessageSquare, Phone, Mail, Users as UsersIcon,
  Video, FileText, Clock, MoreVertical, Edit, Trash2,
  ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const eventIcons: Record<string, typeof MessageSquare> = {
  whatsapp: MessageSquare, call: Phone, email: Mail, meeting: UsersIcon, video_call: Video, note: FileText,
};
const eventColors: Record<string, string> = {
  whatsapp: 'bg-success/10 text-success border-success/20',
  call: 'bg-info/10 text-info border-info/20',
  email: 'bg-primary/10 text-primary border-primary/20',
  meeting: 'bg-warning/10 text-warning border-warning/20',
  video_call: 'bg-secondary/10 text-secondary border-secondary/20',
  note: 'bg-muted text-muted-foreground border-border',
};
const eventLabels: Record<string, string> = {
  whatsapp: 'WhatsApp', call: 'Ligação', email: 'Email', meeting: 'Reunião', video_call: 'Vídeo', note: 'Nota',
};

/**
 * Shape mínimo aceito tanto por `TimelineGroup` (hook) quanto por
 * `LocalTimelineGroup` (groupInteractions) — evita acoplamento.
 */
interface MinimalEvent {
   id: string;
   type: string;
   title: string;
   content: string | null;
   created_at: string;
   transcription?: string | null;
}
interface MinimalGroup {
  entity_id: string;
  entity_name: string;
  entity_type: 'contact' | 'company';
  events: MinimalEvent[];
  last_event_at: string;
  /** Pontuação acumulada de relevância (apenas no sort 'relevance'). */
  relevance_total?: number;
}

interface Props {
  group: MinimalGroup;
  defaultOpen?: boolean;
  /**
   * Quando true (default), inicia mostrando apenas o último evento do grupo
   * com um botão "Ver todos" para expandir. Quando false, mostra todos.
   */
  collapsedByDefault?: boolean;
  /** Quando fornecido, exibe botão "Editar" por evento. Recebe o id da interação. */
  onEditEvent?: (eventId: string) => void;
  /** Quando fornecido, exibe botão "Excluir" por evento. Recebe o id da interação. */
  onDeleteEvent?: (eventId: string) => void;
  /**
   * Sort ativo. Quando 'relevance', exibe um indicador visual de pontuação
   * no header do grupo (badge "Sparkles" + barra horizontal).
   */
  sort?: string;
  /** Maior pontuação entre os grupos visíveis — usado para normalizar 0..1. */
  maxRelevance?: number;
}

export const TimelineGroupCard = React.memo(function TimelineGroupCard({
  group, defaultOpen = false, collapsedByDefault = true, onEditEvent, onDeleteEvent,
  sort, maxRelevance = 0,
}: Props) {
  const EntityIcon = group.entity_type === 'company' ? Building2 : User;
  const hasActions = !!onEditEvent || !!onDeleteEvent;

  // Eventos vêm em ordem cronológica do agrupador. O "último" = mais recente.
  const sortedEvents = React.useMemo(
    () => [...group.events].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
    [group.events],
  );
  const hasMultiple = sortedEvents.length > 1;
  const [showAll, setShowAll] = useState(!collapsedByDefault);
  const visibleEvents = showAll || !hasMultiple ? sortedEvents : sortedEvents.slice(0, 1);
  const hiddenCount = sortedEvents.length - visibleEvents.length;

  // Indicador de relevância: visível apenas no sort 'relevance' e quando o grupo
  // tem pontuação real. A intensidade é normalizada pelo maior score visível em
  // 3 níveis (alta ≥0.66, média ≥0.33, baixa) para criar ranking visual sem
  // depender de números absolutos.
  const showRelevance = sort === 'relevance'
    && typeof group.relevance_total === 'number'
    && group.relevance_total > 0
    && maxRelevance > 0;
  const relevanceRatio = showRelevance ? Math.min(1, group.relevance_total! / maxRelevance) : 0;
  const relevanceTier: 'high' | 'mid' | 'low' = relevanceRatio >= 0.66
    ? 'high' : relevanceRatio >= 0.33 ? 'mid' : 'low';
  const relevanceBadgeClass = relevanceTier === 'high'
    ? 'bg-primary/15 text-primary border-primary/30'
    : relevanceTier === 'mid'
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'bg-muted text-muted-foreground border-border';
  const relevanceLabel = relevanceTier === 'high'
    ? 'Alta correspondência' : relevanceTier === 'mid' ? 'Média correspondência' : 'Baixa correspondência';

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? group.entity_id : undefined}
      className="border border-border/60 rounded-lg bg-card overflow-hidden"
    >
      {/* Barra fina de relevância no topo do card — fora do trigger para não
          interferir com a área de clique do Accordion. Largura proporcional
          ao score normalizado (0..1), com mínimo de 8% para visibilidade. */}
      {showRelevance && (
        <div className="h-0.5 w-full" aria-hidden="true">
          <div
            className={
              relevanceTier === 'high' ? 'h-full bg-primary'
              : relevanceTier === 'mid' ? 'h-full bg-primary/60'
              : 'h-full bg-primary/30'
            }
            style={{ width: `${Math.max(8, Math.round(relevanceRatio * 100))}%` }}
          />
        </div>
      )}
      <AccordionItem value={group.entity_id} className="border-0">
        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <EntityIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="font-medium text-sm text-foreground truncate">{group.entity_name}</p>
              <p className="text-xs text-muted-foreground">
                Última atividade {formatDistanceToNow(new Date(group.last_event_at), { locale: ptBR, addSuffix: true })}
              </p>
            </div>
            {showRelevance && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 gap-1 ${relevanceBadgeClass}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {Math.round(relevanceRatio * 100)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    {relevanceLabel} · score {group.relevance_total} (relativo ao topo {maxRelevance})
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Badge variant="outline" className="text-[10px] shrink-0">{group.events.length}</Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="relative pl-4">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
            {visibleEvents.map(event => {
              const Icon = eventIcons[event.type] || FileText;
              const colorClass = eventColors[event.type] || eventColors.note;
              return (
                <div key={event.id} className="relative flex gap-3 py-2.5 group/event">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 border ${colorClass} -ml-[3px]`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className="text-[9px] shrink-0">
                          {eventLabels[event.type] || event.type}
                        </Badge>
                        <p className="text-sm font-medium truncate">{event.title}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(event.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </span>
                        {hasActions && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Ações da interação"
                                className="h-6 w-6 opacity-0 group-hover/event:opacity-100 focus-visible:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                }}
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {onEditEvent && (
                                <DropdownMenuItem
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    onEditEvent(event.id);
                                  }}
                                >
                                  <Edit className="w-3.5 h-3.5 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {onDeleteEvent && (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onSelect={(e) => {
                                    e.preventDefault();
                                    onDeleteEvent(event.id);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                     {event.transcription && (
                       <div className="mt-1.5 p-2 bg-primary/5 rounded border border-primary/10">
                         <p className="text-[10px] font-bold text-primary uppercase flex items-center gap-1 mb-1">
                           <Sparkles className="w-3 h-3" /> Transcrição IA
                         </p>
                         <p className="text-xs text-muted-foreground line-clamp-3 italic">
                           "{event.transcription}"
                         </p>
                       </div>
                     )}
                     {event.content && !event.transcription && (
                       <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.content}</p>
                     )}
                  </div>
                </div>
              );
            })}

            {hasMultiple && (
              <div className="pt-2 pl-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAll(v => !v)}
                  aria-expanded={showAll}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Mostrar apenas o último
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Ver todos os {sortedEvents.length} eventos
                      {hiddenCount > 0 && (
                        <span className="ml-1 text-[10px] opacity-70">(+{hiddenCount})</span>
                      )}
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
});
