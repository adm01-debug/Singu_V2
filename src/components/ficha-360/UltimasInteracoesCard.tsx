import { memo, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageSquare, Phone, Mail, Calendar, FileText, ArrowRight, X, Clock, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useFicha360Filters } from '@/hooks/useFicha360Filters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { InlineEmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useInfiniteList } from '@/hooks/useInfiniteList';
import { useReportInfiniteScrollProgress } from '@/hooks/useReportInfiniteScrollProgress';
import { InfiniteScrollSentinel, CompactItemSkeleton } from '@/components/interactions/InfiniteScrollSentinel';
import { IncrementalLoadStickyBar } from '@/components/interactions/IncrementalLoadStickyBar';
import type { ExternalInteraction } from '@/hooks/useExternalInteractions';

interface Props {
  interactions: ExternalInteraction[];
  contactId: string;
  headerExtra?: React.ReactNode;
  filtersActive?: boolean;
  isLoading?: boolean;
  days?: number;
  channels?: string[];
  q?: string;
}

// Hash simples e estável (djb2) para chave de paginação por termo de busca.
function hashString(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

const channelIcon = (channel: string | null) => {
  switch ((channel || '').toLowerCase()) {
    case 'whatsapp':
    case 'sms':
      return MessageSquare;
    case 'call':
    case 'phone':
      return Phone;
    case 'email':
      return Mail;
    case 'meeting':
      return Calendar;
    default:
      return FileText;
  }
};

const sentimentColor = (s: string | null | undefined): string => {
  const v = (s || '').toLowerCase();
  if (v.includes('pos')) return 'bg-success';
  if (v.includes('neg')) return 'bg-destructive';
  if (v.includes('neu')) return 'bg-muted-foreground';
  return 'bg-border';
};

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const UltimasInteracoesCard = memo(({ interactions, contactId, headerExtra, filtersActive, isLoading, days, channels, q }: Props) => {
  const { setQ, setChannels } = useFicha360Filters();
  const [localSearch, setLocalSearch] = useState(q || '');
  
  useEffect(() => {
    setLocalSearch(q || '');
  }, [q]);

  const items = Array.isArray(interactions) ? interactions : [];
  const channelsKey = Array.isArray(channels) ? [...channels].map((c) => c.toLowerCase()).sort().join(',') : '';
  const qKey = q ? hashString(q.trim().toLowerCase()) : 'noq';
  const filterKey = `${days ?? 'all'}-${channelsKey || 'all'}-${qKey}`;

  // Deep-link: ?focus=<interactionId> rola até o item e aplica destaque temporário.
  const [searchParams, setSearchParams] = useSearchParams();
  const focusId = searchParams.get('focus');
  const focusIndex = focusId ? items.findIndex((it) => it.id === focusId) : -1;
  const initialBatch = focusIndex >= 0 ? Math.max(15, focusIndex + 5) : 15;

  const { visible, hasMore, sentinelRef, loadMore } = useInfiniteList(
    items,
    initialBatch,
    [items, contactId, filterKey],
    { persistKey: contactId ? `ficha-ultimas-${contactId}-${filterKey}` : undefined }
  );

  const [highlightId, setHighlightId] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!focusId || focusedRef.current === focusId) return;
    if (!items.some((it) => it.id === focusId)) return;
    focusedRef.current = focusId;
    // Aguarda render do item visível antes de rolar.
    const timer = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-interaction-id="${focusId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightId(focusId);
        window.setTimeout(() => setHighlightId(null), 2400);
      }
      // Limpa o param da URL para não re-disparar em remounts/voltar.
      const next = new URLSearchParams(searchParams);
      next.delete('focus');
      setSearchParams(next, { replace: true });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusId, items, searchParams, setSearchParams]);

  // Publica progresso para overlays globais (ex.: tooltip do botão "Voltar ao topo").
  useReportInfiniteScrollProgress(
    `ficha-ultimas-${contactId}`,
    visible.length,
    items.length,
    hasMore,
    'interações',
  );

  const clearSearch = () => {
    setQ('');
  };

  return (
    <Card>
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Atividades & Rapport
            </CardTitle>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-xs font-normal tabular-nums">
                {items.length}
              </Badge>
            )}
          </div>
          <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Link to={`/interacoes?contact=${contactId}`}>
              Ver todas <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar em mensagens e transcrições..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setQ(e.target.value);
              }}
              className="pl-9 h-9 text-sm bg-muted/30 border-none"
            />
            {localSearch && (
              <button 
                onClick={() => { setLocalSearch(''); setQ(''); }}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
              { id: 'call', label: 'Ligações', icon: Phone },
              { id: 'email', label: 'E-mail', icon: Mail },
              { id: 'meeting', label: 'Reuniões', icon: Calendar },
              { id: 'audio', label: 'Áudio', icon: Clock },
              { id: 'transcription', label: 'Transcrição', icon: FileText },
            ].map((ch) => {
              const isType = ['whatsapp', 'call', 'email', 'meeting'].includes(ch.id);
              const isActive = channels?.includes(ch.id);
              
              return (
                <Button
                  key={ch.id}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const next = isActive 
                      ? channels?.filter(c => c !== ch.id) 
                      : [...(channels || []), ch.id];
                    setChannels(next || []);
                  }}
                  className={cn(
                    "h-7 px-2 text-[10px] gap-1.5 shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground border-muted-foreground/20"
                  )}
                >
                  <ch.icon className="h-3 w-3" />
                  {ch.label}
                </Button>
              );
            })}
          </div>
        </div>

        {headerExtra}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2 py-1" aria-busy="true" aria-live="polite">
            {Array.from({ length: 5 }).map((_, i) => (
              <CompactItemSkeleton
                key={i}
                titleMaxWidth={i % 2 === 0 ? 'max-w-[60%]' : 'max-w-[45%]'}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <InlineEmptyState
            icon={MessageSquare}
            title={filtersActive ? 'Nenhuma interação nos filtros' : 'Sem interações recentes'}
            description={
              filtersActive
                ? 'Ajuste o período ou os canais selecionados acima.'
                : 'As últimas conversas, ligações e e-mails aparecerão aqui.'
            }
          />
        ) : (
          <>
            <IncrementalLoadStickyBar
              hasMore={hasMore}
              totalLoaded={visible.length}
              total={items.length}
            />
            <ul className="space-y-1">

              {visible.map((it) => {
                const Icon = channelIcon(it.channel);
                const isHighlighted = highlightId === it.id;
                return (
                  <li
                    key={it.id}
                    data-interaction-id={it.id}
                    className={cn(
                      'rounded-md transition-shadow',
                      isHighlighted &&
                        'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-md',
                    )}
                  >
                    <Link
                      to={`/interacoes?contact=${contactId}&open=${it.id}`}
                      className={cn(
                        'flex items-start gap-3 px-2 py-2 rounded-md transition-colors',
                        isHighlighted ? 'bg-primary/10' : 'hover:bg-muted/40',
                      )}
                    >
                      <div className="mt-0.5 h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {it.assunto || it.resumo?.slice(0, 60) || 'Interação'}
                          </p>
                          <span
                            className={cn('h-1.5 w-1.5 rounded-full shrink-0', sentimentColor(it.status))}
                            title={it.status ?? ''}
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span className="capitalize">{it.channel ?? 'outro'}</span>
                          {it.direction && <span>· {it.direction}</span>}
                          <span>· {formatDate(it.data_interacao || it.created_at)}</span>
                          {it.transcription && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 ml-auto border-primary/20 bg-primary/5 text-primary">
                              TXT
                            </Badge>
                          )}
                          {it.audio_url && (
                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-blue-200 bg-blue-50 text-blue-600">
                              AUDIO
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <InfiniteScrollSentinel
              sentinelRef={sentinelRef}
              hasMore={hasMore}
              totalLoaded={visible.length}
              total={items.length}
              density="compact"
              onLoadMore={loadMore}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
});
UltimasInteracoesCard.displayName = 'UltimasInteracoesCard';
