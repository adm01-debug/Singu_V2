import { useState, useMemo, useEffect, useRef, lazy, Suspense, startTransition } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare, Phone, Mail, Users, Edit, Search, Calendar, MoreVertical,
  Trash2, Video, FileText, Clock, AlertCircle, Plus, X,
} from 'lucide-react';
import { InteractionsListSkeleton } from '@/components/skeletons/PageSkeletons';
import { EmptyState, SearchEmptyState } from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { SentimentIndicator } from '@/components/ui/sentiment-indicator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AdvancedFilters, type FilterConfig, type SortOption } from '@/components/filters/AdvancedFilters';
import { MorphingNumber } from '@/components/micro-interactions/MorphingNumber';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { sortArray } from '@/lib/sorting-utils';
import { sortInteractions } from '@/lib/sortInteractions';
import type { Interaction } from '@/hooks/useInteractions';
import type { SentimentType } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AdvancedSearchBar } from '@/components/interactions/AdvancedSearchBar';
import { ActiveFiltersBar } from '@/components/interactions/ActiveFiltersBar';
import { SavedViewsMenu } from '@/components/interactions/SavedViewsMenu';
import { ChannelShortcutsHelpOverlay } from '@/components/interactions/ChannelShortcutsHelpOverlay';
import { PaginationBar } from '@/components/interactions/PaginationBar';
import { useNextPagePrefetch } from '@/hooks/useNextPagePrefetch';
import { useScopedShortcut } from '@/lib/keyboardShortcutRegistry';
import { VALID_PER_PAGE } from '@/hooks/useInteractionsAdvancedFilter';
import { toast } from 'sonner';
import { ViewPrefsSummary } from '@/components/interactions/ViewPrefsSummary';
import { SentimentQuickFilter } from '@/components/interactions/SentimentQuickFilter';
import { useInteractionsAdvancedFilter } from '@/hooks/useInteractionsAdvancedFilter';
import { useCompanies } from '@/hooks/useCompanies';
import { getChannelCountsCached } from '@/lib/channelCountsCache';
import { computeIsolatedFilterCounts } from '@/lib/computeIsolatedFilterCounts';
import { preserveScroll } from '@/lib/preserveScroll';
import { groupInteractions } from '@/lib/groupInteractions';
import { IncrementalLoadStickyBar } from '@/components/interactions/IncrementalLoadStickyBar';
import { InfiniteScrollSentinel } from '@/components/interactions/InfiniteScrollSentinel';

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const ActivityHeatmapChart = lazy(() => import('@/components/interactions/ActivityHeatmapChart'));

const interactionIcons: Record<string, typeof MessageSquare> = { whatsapp: MessageSquare, call: Phone, email: Mail, meeting: Users, video_call: Video, note: FileText, social: MessageSquare };
const interactionColors: Record<string, string> = { whatsapp: 'bg-success/10 text-success', call: 'bg-info/10 text-info', email: 'bg-primary/10 text-primary', meeting: 'bg-warning/10 text-warning', video_call: 'bg-secondary/10 text-secondary', note: 'bg-muted text-muted-foreground', social: 'bg-accent/10 text-accent' };
const interactionLabels: Record<string, string> = { whatsapp: 'WhatsApp', call: 'Ligação', email: 'Email', meeting: 'Reunião', video_call: 'Videochamada', note: 'Nota', social: 'Social' };

interface Props {
  interactions: Interaction[];
  loading: boolean;
  contactMap: Map<string, { id: string; first_name: string; last_name: string; avatar_url: string | null; role_title: string | null }>;
  stats: { total: number; followUp: number; thisWeek: number };
  onSetIsFormOpen: (open: boolean) => void;
  onSetEditingInteraction: (interaction: Interaction | null) => void;
  onSetDeletingInteraction: (interaction: Interaction | null) => void;
  filterConfigs: FilterConfig[];
  sortOptions: SortOption[];
  hasMore?: boolean;
  loadMore?: () => void;
  isFetchingNextPage?: boolean;
}

export function InteracoesContent({ interactions, loading, contactMap, stats, onSetIsFormOpen, onSetEditingInteraction, onSetDeletingInteraction, filterConfigs, sortOptions, hasMore, loadMore, isFetchingNextPage }: Props) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { filters: adv, debouncedQ, setFilter, clear, activeCount, applyAll, applyDateRange, clearDateRange, resetViewPreferences, isViewPrefsAtDefault } = useInteractionsAdvancedFilter();
  const { companies } = useCompanies();

  const contactOptions = useMemo(
    () => Array.from(contactMap.values()).map(c => ({ id: c.id, label: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Sem nome' })),
    [contactMap]
  );
  const companyOptions = useMemo(
    () => (Array.isArray(companies) ? companies : []).map(c => ({ id: c.id, label: c.name ?? 'Sem nome' })),
    [companies]
  );

  // Aplica os filtros não-canal e não-sentimento — base reutilizada pelos
  // contadores e filtros derivados (ignoramos o próprio filtro ao calcular
  // o "potencial" de cada bucket).
  const baseWithoutCanaisAndSentimento = useMemo(() => {
    if (!Array.isArray(interactions)) return [];
    const q = debouncedQ ? normalize(debouncedQ) : '';
    const deTs = adv.de ? new Date(adv.de).setHours(0, 0, 0, 0) : null;
    const ateTs = adv.ate ? new Date(adv.ate).setHours(23, 59, 59, 999) : null;
    return interactions.filter(i => {
      if (adv.contact && i.contact_id !== adv.contact) return false;
      if (adv.company && i.company_id !== adv.company) return false;
      if (adv.direcao === 'inbound' && i.initiated_by !== 'them') return false;
      if (adv.direcao === 'outbound' && i.initiated_by !== 'us') return false;
      const ts = new Date(i.created_at).getTime();
      if (deTs !== null && ts < deTs) return false;
      if (ateTs !== null && ts > ateTs) return false;
      if (q) {
        const hay = normalize(`${i.title ?? ''} ${i.content ?? ''} ${(i.tags ?? []).join(' ')}`);
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [interactions, adv.contact, adv.company, adv.direcao, adv.de, adv.ate, debouncedQ]);

  // Aplica TODOS os filtros não-canal (inclui sentimento) — usado como base
  // para os contadores por canal e para o dataset filtrado.
  const advancedFilteredWithoutCanais = useMemo(() => {
    if (!adv.sentimento) return baseWithoutCanaisAndSentimento;
    return baseWithoutCanaisAndSentimento.filter(i => i.sentiment === adv.sentimento);
  }, [baseWithoutCanaisAndSentimento, adv.sentimento]);

  // Cache LRU: chave estável pelos filtros não-canal evita recomputar quando
  // o usuário alterna rapidamente entre chips e revisita combinações.
  const channelCounts = useMemo(
    () => getChannelCountsCached(
      {
        datasetSize: Array.isArray(interactions) ? interactions.length : 0,
        q: debouncedQ ?? '',
        contact: adv.contact ?? '',
        company: adv.company ?? '',
        direcao: adv.direcao ?? 'all',
        de: adv.de ? new Date(adv.de).toISOString() : null,
        ate: adv.ate ? new Date(adv.ate).toISOString() : null,
        sentimento: adv.sentimento ?? null,
      },
      () => advancedFilteredWithoutCanais.map(i => ({ type: i.type })),
    ),
    [
      advancedFilteredWithoutCanais,
      interactions,
      debouncedQ,
      adv.contact,
      adv.company,
      adv.direcao,
      adv.de,
      adv.ate,
      adv.sentimento,
    ],
  );

  // Apply advanced filters (URL-driven) — agora derivado, aplicando o filtro de canais
  // sobre o dataset que já inclui sentimento e demais critérios não-canal.
  const advancedFiltered = useMemo(() => {
    return adv.canais.length === 0
      ? advancedFilteredWithoutCanais
      : advancedFilteredWithoutCanais.filter(i => adv.canais.includes(i.type));
  }, [advancedFilteredWithoutCanais, adv.canais]);

  // Contagem por bucket de sentimento (ignora o próprio filtro de sentimento;
  // respeita o filtro de canal para refletir o escopo visível).
  const sentimentCounts = useMemo(() => {
    const base = adv.canais.length === 0
      ? baseWithoutCanaisAndSentimento
      : baseWithoutCanaisAndSentimento.filter(i => adv.canais.includes(i.type));
    const acc: Record<'positive' | 'neutral' | 'negative' | 'mixed', number> = {
      positive: 0, neutral: 0, negative: 0, mixed: 0,
    };
    for (const i of base) {
      const s = i.sentiment as keyof typeof acc | null | undefined;
      if (s && s in acc) acc[s] += 1;
    }
    return acc;
  }, [baseWithoutCanaisAndSentimento, adv.canais]);

  const filteredAndSorted = useMemo(() => {
    const result = advancedFiltered.filter(interaction => {
      for (const [key, values] of Object.entries(activeFilters)) {
        if (values.length === 0) continue;
        const val = interaction[key as keyof Interaction];
        if (key === 'follow_up_required') { if (!values.includes(String(val))) return false; continue; }
        if (val === null || val === undefined) return false;
        if (!values.includes(String(val))) return false;
      }
      return true;
    });
    return sortArray(result, sortBy as keyof Interaction, sortOrder, { dateFields: ['created_at', 'follow_up_date'], numericFields: ['duration', 'response_time'] });
  }, [advancedFiltered, activeFilters, sortBy, sortOrder]);

  const companyMap = useMemo(() => {
    const m = new Map<string, string>();
    (Array.isArray(companies) ? companies : []).forEach(c => {
      if (c?.id) m.set(c.id, c.name ?? '');
    });
    return m;
  }, [companies]);

  // Map id -> Interaction usado pelos handlers de Editar/Excluir do modo agrupado
  // (TimelineGroupCard só carrega o id do evento — aqui resolvemos para o objeto completo).
  const interactionById = useMemo(() => {
    const m = new Map<string, Interaction>();
    if (Array.isArray(interactions)) {
      for (const i of interactions) m.set(i.id, i);
    }
    return m;
  }, [interactions]);

  // Mapa contato->company_id pra inferir empresa quando interaction.company_id estiver vazio.
  const contactToCompany = useMemo(() => {
    const m = new Map<string, string | null>();
    contactMap.forEach((c) => {
      const anyC = c as unknown as { company_id?: string | null };
      m.set(c.id, anyC.company_id ?? null);
    });
    return m;
  }, [contactMap]);

  const sortedForView = useMemo(() => {
    const mapped = filteredAndSorted.map(i => {
      const c = contactMap.get(i.contact_id);
      const inferredCompanyId = i.company_id || contactToCompany.get(i.contact_id) || null;
      return {
        ...i,
        date: i.created_at,
        contact_name: c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : null,
        company_id: inferredCompanyId,
        company_name: inferredCompanyId ? (companyMap.get(inferredCompanyId) ?? null) : null,
      };
    });
    return sortInteractions(mapped, adv.sort, debouncedQ, channelCounts);
  }, [filteredAndSorted, contactMap, companyMap, contactToCompany, adv.sort, debouncedQ, channelCounts]);

  // Modo agrupado (URL-driven). Quando ativo, paginação opera em grupos.
  const isGrouped = adv.view !== 'list';
  const groups = useMemo(
    () => isGrouped
      ? groupInteractions(
          sortedForView,
          adv.view === 'by-contact' ? 'by-contact' : 'by-company',
          adv.sort,
          debouncedQ,
        )
      : [],
    [sortedForView, isGrouped, adv.view, adv.sort, debouncedQ],
  );

  // Paginação derivada (URL-driven). Defaults: page=1, perPage=25.
  const total = isGrouped ? groups.length : (props.totalCount || sortedForView.length);
  const totalPages = Math.max(1, Math.ceil(total / adv.perPage));
  const safePage = Math.min(adv.page, totalPages);
  const start = (safePage - 1) * adv.perPage;
  const visibleInteractions = useMemo(
    () => isGrouped ? [] : sortedForView.slice(start, start + adv.perPage),
    [sortedForView, start, adv.perPage, isGrouped],
  );
  const visibleGroups = useMemo(
    () => isGrouped ? groups.slice(start, start + adv.perPage) : [],
    [groups, start, adv.perPage, isGrouped],
  );
  const visibleEventsCount = useMemo(
    () => isGrouped
      ? visibleGroups.reduce((acc, g) => acc + g.events.length, 0)
      : visibleInteractions.length,
    [isGrouped, visibleGroups, visibleInteractions],
  );

  // Pré-aquece o slice da próxima página em idle time + sob demanda no hover/focus.
  const nextDataset: readonly unknown[] = isGrouped ? groups : sortedForView;
  const { warmNext } = useNextPagePrefetch<unknown>({
    items: nextDataset,
    page: safePage,
    perPage: adv.perPage,
    totalPages,
  });

  // Atalhos: Shift+1/2/3/4 alternam perPage entre 10/25/50/100 (Shift evita colisão
  // com atalhos de canal por dígito e ignora automaticamente foco em inputs).
  useScopedShortcut({
    scope: 'interacoes',
    keys: '1',
    shift: true,
    description: 'Mostrar 10 por página',
    handler: () => {
      setFilter('perPage', VALID_PER_PAGE[0]);
      toast.success(`Exibindo ${VALID_PER_PAGE[0]} por página`);
    },
  });
  useScopedShortcut({
    scope: 'interacoes',
    keys: '2',
    shift: true,
    description: 'Mostrar 25 por página',
    handler: () => {
      setFilter('perPage', VALID_PER_PAGE[1]);
      toast.success(`Exibindo ${VALID_PER_PAGE[1]} por página`);
    },
  });
  useScopedShortcut({
    scope: 'interacoes',
    keys: '3',
    shift: true,
    description: 'Mostrar 50 por página',
    handler: () => {
      setFilter('perPage', VALID_PER_PAGE[2]);
      toast.success(`Exibindo ${VALID_PER_PAGE[2]} por página`);
    },
  });
  useScopedShortcut({
    scope: 'interacoes',
    keys: '4',
    shift: true,
    description: 'Mostrar 100 por página',
    handler: () => {
      setFilter('perPage', VALID_PER_PAGE[3]);
      toast.success(`Exibindo ${VALID_PER_PAGE[3]} por página`);
    },
  });

  // Atalho: Alt+D limpa filtros de data (de/ate) — paridade com botão "Limpar datas".
  useScopedShortcut({
    scope: 'interacoes',
    keys: 'd',
    alt: true,
    description: 'Limpar filtros de data',
    handler: () => {
      // Usa a função atômica do hook (single setSearchParams) em vez de
      // applyDateRange(undefined, undefined) — intenção semântica explícita
      // e zero risco de divergência entre `de` e `ate`.
      const removed = clearDateRange();
      if (removed) toast.success('Filtros de data removidos');
    },
  });


  useEffect(() => {
    if (total > 0 && adv.page > totalPages) setFilter('page', totalPages);
  }, [total, totalPages, adv.page, setFilter]);

  // Scroll suave ao trocar de página (não no mount).
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [safePage]);

  // Atalhos PageUp / PageDown (ignora se foco em input/textarea).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'PageDown' && safePage < totalPages) { e.preventDefault(); setFilter('page', safePage + 1); }
      if (e.key === 'PageUp' && safePage > 1) { e.preventDefault(); setFilter('page', safePage - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [safePage, totalPages, setFilter]);

  // Auto-scroll para o topo da tabela quando um preset é aplicado.
  // O foco no input de busca é tratado por outro evento e preservado aqui
  // (scrollIntoView usa block:'start' apenas no container, não move o caret).
  const listTopRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = () => {
      const el = listTopRef.current;
      if (!el) return;
      try {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {
        el.scrollIntoView();
      }
    };
    window.addEventListener('scroll-interactions-top', handler);
    return () => window.removeEventListener('scroll-interactions-top', handler);
  }, []);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isFetchingNextPage || !sentinelRef.current) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore?.();
    }, { rootMargin: '400px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [hasMore, isFetchingNextPage, loadMore]);

  return (
    <div className="p-6 space-y-6">
      <ChannelShortcutsHelpOverlay appliedCanais={adv.canais} channelCounts={channelCounts} />
      <SmartBreadcrumbs />
      <div className="grid grid-cols-3 gap-4 max-w-lg">
        <Card className="border-border/50"><CardContent className="p-4 text-center"><MorphingNumber value={stats.total} className="text-2xl font-bold text-foreground" /><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><MorphingNumber value={stats.followUp} className="text-2xl font-bold text-warning" /><p className="text-xs text-muted-foreground">Follow-ups</p></CardContent></Card>
        <Card className="border-border/50"><CardContent className="p-4 text-center"><MorphingNumber value={stats.thisWeek} className="text-2xl font-bold text-primary" /><p className="text-xs text-muted-foreground">Esta semana</p></CardContent></Card>
      </div>

      <Suspense fallback={<Card className="border-border/50"><CardContent className="p-4"><div className="h-48 animate-pulse bg-muted/30 rounded-lg" /></CardContent></Card>}><ActivityHeatmapChart /></Suspense>

      <div className="flex items-center justify-end">
        <SavedViewsMenu scope="interacoes" />
      </div>

      <AdvancedSearchBar
        filters={adv}
        setFilter={setFilter}
        clear={clear}
        activeCount={activeCount}
        contacts={contactOptions}
        companies={companyOptions}
        resultsCount={filteredAndSorted.length}
        totalCount={interactions.length}
        applyAll={applyAll}
        applyDateRange={applyDateRange}
        clearDateRange={clearDateRange}
        channelCounts={channelCounts}
      />

      <ActiveFiltersBar
        filters={adv}
        setFilter={setFilter}
        clear={clear}
        clearDateRange={clearDateRange}
        activeCount={activeCount}
        totalCount={interactions.length}
        visibleCount={visibleEventsCount}
        contactLabel={contactOptions.find(c => c.id === adv.contact)?.label}
        companyLabel={companyOptions.find(c => c.id === adv.company)?.label}
        isolatedFilterCounts={computeIsolatedFilterCounts(
          interactions,
          adv,
          debouncedQ,
          contactOptions.find(c => c.id === adv.contact)?.label,
          companyOptions.find(c => c.id === adv.company)?.label,
        )}
        groupedMode={isGrouped}
        groupCount={visibleGroups.length}
        groupLabelSingular={adv.view === 'by-contact' ? 'pessoa' : 'empresa'}
        groupLabelPlural={adv.view === 'by-contact' ? 'pessoas' : 'empresas'}
        onAfterRemove={() => {
          // Devolve o foco ao input de busca após o re-render disparado pelo setFilter,
          // sem reposicionar a página (preventScroll) e preservando o cursor.
          //
          // Como capturamos a posição do cursor (em ordem de prioridade):
          //  1. Input atualmente focado: lê `selectionStart` direto — cobre
          //     o caso (raro) em que o usuário acionou o chip via teclado/Tab
          //     com o foco ainda no input.
          //  2. Atributo `data-last-caret` no input: o `AdvancedSearchBar`
          //     mantém esse atributo atualizado a cada keyup/click/select/
          //     input/focus. Cobre o caso COMUM: usuário digita no meio da
          //     string, clica no "X" do chip (o mousedown já tirou o foco do
          //     input antes do `onAfterRemove` rodar) e ainda assim queremos
          //     restaurar exatamente onde ele estava digitando.
          //  3. `null` (fim do texto): fallback seguro quando não há nenhuma
          //     posição registrada — primeira interação com a página.
          //
          // A captura ocorre AGORA (síncrono): após o `setFilter` o React
          // re-renderiza e o `document.activeElement` já não aponta para o
          // input — perderíamos a posição se esperássemos.
          const active = document.activeElement as HTMLInputElement | null;
          const searchEl = document.querySelector<HTMLInputElement>('[data-interacoes-search]');
          let caret: number | null = null;
          if (active && active === searchEl && typeof active.selectionStart === 'number') {
            caret = active.selectionStart;
          } else if (searchEl?.dataset.lastCaret) {
            const parsed = Number.parseInt(searchEl.dataset.lastCaret, 10);
            caret = Number.isFinite(parsed) ? parsed : null;
          }

          // Preserva a posição de scroll: remover um chip pode encolher a lista
          // e fazer o navegador clampar `scrollY` para baixo da posição atual,
          // gerando um "salto" visual em páginas longas. `preserveScroll`
          // captura `scrollY` agora e re-aplica em dois rAFs, depois que o
          // novo `scrollHeight` já reflete a lista filtrada.
          preserveScroll();

          requestAnimationFrame(() => {
            window.dispatchEvent(
              new CustomEvent('focus-interactions-search-caret-end', { detail: { caret } }),
            );
          });
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <ViewPrefsSummary
          density={adv.density}
          perPage={adv.perPage}
          perPageOptions={VALID_PER_PAGE}
          total={total}
          densityEnabled={adv.view === 'list'}
          onDensityChange={(d) => setFilter('density', d)}
          onPerPageChange={(pp) => setFilter('perPage', pp)}
        />
        <Button
          variant="ghost"
          size="xs"
          type="button"
          disabled={isViewPrefsAtDefault}
          onClick={() => {
            const changed = resetViewPreferences();
            if (changed) {
              toast.success('Preferências de visualização restauradas', {
                description: 'Densidade, lote, modo e ordenação voltaram ao padrão.',
              });
            } else {
              toast.info('Já está no padrão.');
            }
          }}
          aria-label="Restaurar preferências de visualização para o padrão"
          title="Restaurar densidade, lote, modo e ordenação para o padrão (filtros preservados)"
          className="h-7 gap-1.5"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          <span className="hidden sm:inline">Restaurar visualização</span>
        </Button>
      </div>

      <SentimentQuickFilter
        value={adv.sentimento}
        onChange={(v) => setFilter('sentimento', v)}
        counts={sentimentCounts}
      />

      <AdvancedFilters filters={filterConfigs} sortOptions={sortOptions} activeFilters={activeFilters} onFiltersChange={setActiveFilters} sortBy={sortBy} sortOrder={sortOrder} onSortChange={(sb, so) => { setSortBy(sb); setSortOrder(so); }} />

      {/* Âncora para auto-scroll após aplicar preset */}
      <div ref={listTopRef} aria-hidden="true" className="scroll-mt-24" />

      <IncrementalLoadStickyBar 
        hasMore={!!hasMore} 
        totalLoaded={interactions.length} 
        total={props.totalCount || interactions.length} 
        className="top-24"
      />

      {loading && interactions.length === 0 ? <InteractionsListSkeleton /> : (
        <>
          {isGrouped ? (
            <div className="space-y-3">
              {(() => {
                // Maior pontuação entre os grupos visíveis — usado pelos cards
                // para normalizar o indicador de relevância (0..100). Calculado
                // inline para evitar acoplamento de estado e por ser O(n) em N pequeno.
                const maxRelevance = visibleGroups.reduce(
                  (m, g) => Math.max(m, g.relevance_total ?? 0),
                  0,
                );
                return visibleGroups.map((g, idx) => (
                  <TimelineGroupCard
                    key={g.entity_id}
                    group={g}
                    defaultOpen={idx < 3}
                    sort={adv.sort}
                    maxRelevance={maxRelevance}
                    onEditEvent={(id) => {
                      const it = interactionById.get(id);
                      if (it) onSetEditingInteraction(it);
                    }}
                    onDeleteEvent={(id) => {
                      const it = interactionById.get(id);
                      if (it) onSetDeletingInteraction(it);
                    }}
                  />
                ));
              })()}
            </div>
          ) : (() => {
            const isCompact = adv.density === 'compact';
            return (
            <div className="relative">
              <div className={`absolute ${isCompact ? 'left-[19px]' : 'left-[27px]'} top-0 bottom-0 w-0.5 bg-border`} />
              <div className={isCompact ? 'space-y-2' : 'space-y-4'}>
                {visibleInteractions.map((interaction, index) => {
                  const contact = contactMap.get(interaction.contact_id);
                  const Icon = interactionIcons[interaction.type] || MessageSquare;
                  const tags = interaction.tags ?? [];
                  const visibleTags = isCompact ? tags.slice(0, 3) : tags;
                  const extraTags = isCompact ? Math.max(0, tags.length - 3) : 0;
                  const delayCap = isCompact ? 0.15 : 0.3;
                  const delayStep = isCompact ? 0.015 : 0.03;
                  return (
                    <motion.div key={interaction.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2, delay: Math.min(index * delayStep, delayCap) }} className={`relative ${isCompact ? 'pl-12' : 'pl-16'} group`}>
                      <div className={`absolute ${isCompact ? 'left-3 top-3 w-7 h-7' : 'left-2 top-4 w-10 h-10'} rounded-full flex items-center justify-center ${interactionColors[interaction.type]} border-4 border-background z-10`}><Icon className={isCompact ? 'w-3 h-3' : 'w-4 h-4'} /></div>
                      <Card className="card-hover"><CardContent className={isCompact ? 'p-2.5' : 'p-4'}>
                        <div className={`flex items-start justify-between ${isCompact ? 'mb-1.5' : 'mb-3'}`}>
                          <div className="flex-1">
                            <div className={`flex items-center gap-2 ${isCompact ? 'mb-0.5' : 'mb-1'} flex-wrap`}>
                              {!isCompact && <Badge variant="outline" className={`text-xs ${interactionColors[interaction.type].replace('bg-', 'border-').replace('/10', '/50')}`}>{interactionLabels[interaction.type]}</Badge>}
                              <SentimentIndicator sentiment={(interaction.sentiment as SentimentType) || 'neutral'} size="sm" />
                              {interaction.follow_up_required && <Badge variant="outline" className="text-xs text-warning border-warning bg-warning/10"><AlertCircle className="w-3 h-3 mr-1" />Follow-up</Badge>}
                              {interaction.initiated_by === 'them' && <Badge variant="secondary" className="text-xs">Recebido</Badge>}
                            </div>
                            <h3 className="font-semibold text-foreground">{interaction.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right text-xs text-muted-foreground">
                              {!isCompact && <div className="flex items-center gap-1 justify-end"><Calendar className="w-3 h-3" />{format(new Date(interaction.created_at), "d MMM 'às' HH:mm", { locale: ptBR })}</div>}
                              <div>{formatDistanceToNow(new Date(interaction.created_at), { locale: ptBR, addSuffix: true })}</div>
                            </div>
                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => onSetEditingInteraction(interaction)}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem><DropdownMenuItem onClick={() => onSetDeletingInteraction(interaction)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                          </div>
                        </div>
                        {interaction.content && <p className={`text-sm text-muted-foreground ${isCompact ? 'mb-1.5 line-clamp-1' : 'mb-4 line-clamp-2'}`}>{interaction.content}</p>}
                        {interaction.duration && <div className={`flex items-center gap-1 text-xs text-muted-foreground ${isCompact ? 'mb-1.5' : 'mb-3'}`}><Clock className="w-3 h-3" />Duração: {Math.floor(interaction.duration / 60)} min</div>}
                        {tags.length > 0 && (
                          <div className={`flex flex-wrap gap-1.5 ${isCompact ? 'mb-1.5' : 'mb-4'}`}>
                            {visibleTags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                            {extraTags > 0 && <Badge variant="secondary" className="text-xs">+{extraTags}</Badge>}
                          </div>
                        )}
                        {contact && (
                          isCompact
                            ? <div className="pt-2 border-t border-border"><p className="text-xs text-muted-foreground">{contact.first_name} {contact.last_name}</p></div>
                            : <div className="flex items-center gap-3 pt-3 border-t border-border"><OptimizedAvatar src={contact.avatar_url} alt={`${contact.first_name} ${contact.last_name}`} fallback={`${(contact.first_name || '?')[0]}${(contact.last_name || '?')[0]}`} size="sm" /><div><p className="text-sm font-medium text-foreground">{contact.first_name} {contact.last_name}</p><p className="text-xs text-muted-foreground">{contact.role_title}</p></div></div>
                        )}
                      </CardContent></Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            );
          })()}

          {hasMore && (
            <InfiniteScrollSentinel 
              sentinelRef={sentinelRef}
              hasMore={hasMore}
              totalLoaded={interactions.length}
              total={props.totalCount || interactions.length}
              onLoadMore={loadMore}
              density={adv.density}
            />
          )}

          <PaginationBar
            page={safePage}
            perPage={adv.perPage}
            total={total}
            onPageChange={(p) => startTransition(() => setFilter('page', p))}
            onPerPageChange={(pp) => setFilter('perPage', pp)}
            onPrefetchNext={warmNext}
          />
          {filteredAndSorted.length === 0 && !loading && (
            activeCount > 0 || Object.keys(activeFilters).length > 0
              ? <SearchEmptyState searchTerm={adv.q || 'filtros ativos'} onClearSearch={() => { clear(); setActiveFilters({}); }} entityName="interações" />
              : <EmptyState illustration="interactions" title="Documente suas conversas" description="Registre ligações, emails, reuniões e mensagens."
                  actions={[{ label: 'Registrar Interação', onClick: () => onSetIsFormOpen(true), icon: Plus }]}
                  tips={['Selecione o tipo correto para melhor categorização', 'Marque follow-ups para nunca perder um compromisso', 'Use tags para vincular a projetos']} />
          )}
        </>
      )}
    </div>
  );
}

