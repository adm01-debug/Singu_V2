import { useState, useCallback, useEffect, useImperativeHandle, forwardRef, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Search, Loader2, ArrowLeft, ArrowRight, Copy, ExternalLink, User, Star, GitCompare, StickyNote, GitMerge, CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { EntityCard } from '@/components/intel/EntityCard';
import { DataGrid } from '@/components/intel/DataGrid';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelSkeleton } from '@/components/intel/IntelSkeleton';
import { IntelErrorState } from '@/components/intel/IntelErrorState';
import { IntelEmptyState } from '@/components/intel/IntelEmptyState';
import { MetadataDiffPanel } from '@/components/intel/MetadataDiffPanel';
import { MultiDiffPanel, type MultiDiffEntity } from '@/components/intel/MultiDiffPanel';
import { EntityNotesPanel } from '@/components/intel/EntityNotesPanel';
import { EntityMonthlyTimeline } from '@/components/intel/EntityMonthlyTimeline';
import { useEntity360, type Entity360Type } from '@/hooks/useEntity360';
import { useEntityHistory, type HistoryEntry } from '@/hooks/useEntityHistory';
import { useEntityBookmarks } from '@/hooks/useEntityBookmarks';
import { queryExternalData } from '@/lib/externalData';
import { format } from 'date-fns';

const CRM_PATH: Record<Entity360Type, string> = {
  contact: '/contatos',
  company: '/empresas',
  deal: '/pipeline',
};

export interface Entity360Handle {
  open: (entry: HistoryEntry) => void;
  getCurrent: () => HistoryEntry | null;
}

export const Entity360Tab = forwardRef<Entity360Handle>((_props, ref) => {
  const [type, setType] = useState<Entity360Type>('contact');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string }>>([]);
  const [searching, setSearching] = useState(false);

  const searchAbortRef = useRef<AbortController | null>(null);

  const { user } = useAuth();
  const { current, push, back, forward, canBack, canForward, stack, cursor } = useEntityHistory();
  const { isPinned, toggle: togglePin } = useEntityBookmarks();
  const { data, isLoading, error, refetch } = useEntity360(current?.type ?? null, current?.id ?? null);

  const open = useCallback((c: HistoryEntry) => {
    push(c);
    setResults([]);
  }, [push]);

  useImperativeHandle(ref, () => ({ open, getCurrent: () => current }), [open, current]);

  const [showDiff, setShowDiff] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showMultiDiff, setShowMultiDiff] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [, setSearchParams] = useSearchParams();
  const previousEntry = stack.length >= 2 && cursor > 0 ? stack[cursor - 1] : null;
  const { data: previousData } = useEntity360(
    showDiff || showMultiDiff ? previousEntry?.type ?? null : null,
    showDiff || showMultiDiff ? previousEntry?.id ?? null : null,
  );
  const beforePreviousEntry =
    stack.length >= 3 && cursor >= 2 ? stack[cursor - 2] : null;
  const { data: beforePreviousData } = useEntity360(
    showMultiDiff ? beforePreviousEntry?.type ?? null : null,
    showMultiDiff ? beforePreviousEntry?.id ?? null : null,
  );

  // Quick-pivot: Shift+click em qualquer evento da timeline envia para o CrossRef
  const pivotToCrossRef = useCallback((e: React.MouseEvent, entry: HistoryEntry) => {
    if (!e.shiftKey) return;
    e.preventDefault();
    const np = new URLSearchParams(window.location.search);
    np.set('tab', 'crossref');
    np.set('pivot', `${entry.type}:${entry.id}`);
    setSearchParams(np, { replace: true });
    toast.success(`Pivot para Cross-Ref: ${entry.name}`);
  }, [setSearchParams]);

  const doSearch = useCallback(async () => {
    if (!search.trim()) return;
    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;
    setSearching(true);
    try {
      const table = type === 'contact' ? 'contacts' : type === 'company' ? 'companies' : 'deals';
      const nameCol = type === 'contact' ? 'full_name' : type === 'company' ? 'name' : 'title';
      const { data: rows } = await queryExternalData<Record<string, unknown>>({
        table,
        select: `id, ${nameCol}`,
        filters: [{ type: 'eq', column: 'user_id', value: user?.id ?? '' }],
        search: { term: search, columns: [nameCol] },
        range: { from: 0, to: 9 },
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      const mapped = (rows || []).map((r) => ({
        id: String(r.id),
        name: String(r[nameCol] || 'Sem nome'),
      }));
      setResults(mapped);
      if (mapped.length === 0) toast.info('Nenhum resultado para a busca.');
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      toast.error('Falha ao buscar entidades.');
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }, [search, type]);

  useEffect(() => {
    if (type !== (current?.type ?? type)) {
      // muda de tipo apenas limpa busca; histórico preserva
      setResults([]);
    }
  }, [type, current?.type]);

  return (
    <div className="space-y-3">
      <SectionFrame title="ENTITY_LOOKUP" meta="QUERY">
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-1" role="group" aria-label="Tipo de entidade">
            {(['contact', 'company', 'deal'] as Entity360Type[]).map((t) => (
              <Button
                key={t}
                size="sm"
                variant={type === t ? 'default' : 'outline'}
                onClick={() => { setType(t); setResults([]); }}
                className="intel-mono text-[10px] uppercase h-8"
                aria-pressed={type === t}
              >
                {t}
              </Button>
            ))}
          </div>
          <div className="flex-1 min-w-[200px] flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder="Buscar por nome…"
              className="intel-mono text-xs h-8"
              aria-label="Termo de busca"
            />
            <Button size="sm" onClick={doSearch} disabled={searching} className="h-8" aria-label="Buscar">
              {searching ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Search className="h-3 w-3" aria-hidden />}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {results.map((r) => (
              <EntityCard
                key={r.id}
                type={type.toUpperCase()}
                id={r.id}
                title={r.name}
                onClick={() => open({ type, id: r.id, name: r.name })}
              />
            ))}
          </div>
        )}

        {stack.length > 0 && (
          <nav aria-label="Histórico de navegação" className="mt-3 flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="ghost"
              onClick={back}
              disabled={!canBack}
              className="h-7 intel-mono text-[10px]"
              aria-label="Voltar (Alt+←)"
              title="Voltar (Alt+←)"
            >
              <ArrowLeft className="h-3 w-3 mr-1" aria-hidden /> BACK
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={forward}
              disabled={!canForward}
              className="h-7 intel-mono text-[10px]"
              aria-label="Avançar (Alt+→)"
              title="Avançar (Alt+→)"
            >
              FWD <ArrowRight className="h-3 w-3 ml-1" aria-hidden />
            </Button>
            <span className="intel-mono text-[10px] text-muted-foreground ml-2">
              [{cursor + 1}/{stack.length}]
            </span>
            {current && (
              <span className="intel-mono text-[10px] text-foreground truncate max-w-[260px]">
                {current.type.toUpperCase()}/{current.name}
              </span>
            )}
          </nav>
        )}
      </SectionFrame>

      {!current && results.length === 0 && (
        <IntelEmptyState
          icon={User}
          title="ENTITY_360"
          description="Busque um contato, empresa ou deal acima para ver metadata, timeline e relações em uma única tela."
        />
      )}

      {current && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <SectionFrame
            title="METADATA"
            meta={isLoading ? 'LOADING…' : error ? 'ERROR' : 'OK'}
            className="lg:col-span-1"
            actions={
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    togglePin({ type: current.type, id: current.id, name: current.name });
                    toast.success(
                      isPinned(current.type, current.id) ? 'Removido dos bookmarks.' : 'Bookmark adicionado.'
                    );
                  }}
                  className={`intel-mono text-[10px] inline-flex items-center gap-1 ${
                    isPinned(current.type, current.id)
                      ? 'text-[hsl(var(--intel-accent))]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label={isPinned(current.type, current.id) ? 'Remover bookmark' : 'Adicionar bookmark'}
                  title="Bookmark"
                  aria-pressed={isPinned(current.type, current.id)}
                >
                  <Star
                    className="h-3 w-3"
                    aria-hidden
                    fill={isPinned(current.type, current.id) ? 'currentColor' : 'none'}
                  />
                  PIN
                </button>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(current.id)
                      .then(() => toast.success('ID copiado.'))
                      .catch(() => toast.error('Não foi possível copiar'));
                  }}
                  className="intel-mono text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  aria-label="Copiar ID"
                  title="Copiar ID"
                >
                  <Copy className="h-3 w-3" aria-hidden /> ID
                </button>
                <button
                  type="button"
                  onClick={() => setShowNotes((v) => !v)}
                  className={`intel-mono text-[10px] inline-flex items-center gap-1 ${
                    showNotes
                      ? 'text-[hsl(var(--intel-accent))]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label="Anotações"
                  aria-pressed={showNotes}
                  title="Anotações da entidade"
                >
                  <StickyNote className="h-3 w-3" aria-hidden /> NOTE
                </button>
                <button
                  type="button"
                  onClick={() => setShowTimeline((v) => !v)}
                  className={`intel-mono text-[10px] inline-flex items-center gap-1 ${
                    showTimeline
                      ? 'text-[hsl(var(--intel-accent))]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-label="Timeline mensal"
                  aria-pressed={showTimeline}
                  title="Timeline temporal agrupada por mês"
                >
                  <CalendarDays className="h-3 w-3" aria-hidden /> TIMELINE
                </button>
                {previousEntry && (
                  <button
                    type="button"
                    onClick={() => setShowDiff((v) => !v)}
                    className={`intel-mono text-[10px] inline-flex items-center gap-1 ${
                      showDiff
                        ? 'text-[hsl(var(--intel-accent))]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label={`Comparar com ${previousEntry.name}`}
                    aria-pressed={showDiff}
                    title={`Diff vs ${previousEntry.name}`}
                  >
                    <GitCompare className="h-3 w-3" aria-hidden /> DIFF
                  </button>
                )}
                {beforePreviousEntry && (
                  <button
                    type="button"
                    onClick={() => setShowMultiDiff((v) => !v)}
                    className={`intel-mono text-[10px] inline-flex items-center gap-1 ${
                      showMultiDiff
                        ? 'text-[hsl(var(--intel-accent))]'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    aria-label="Comparar 3 entidades"
                    aria-pressed={showMultiDiff}
                    title="Comparar últimas 3 entidades"
                  >
                    <GitMerge className="h-3 w-3" aria-hidden /> 3DIFF
                  </button>
                )}
                <Link
                  to={`${CRM_PATH[current.type]}/${current.id}`}
                  className="intel-mono text-[10px] text-muted-foreground hover:text-[hsl(var(--intel-accent))] inline-flex items-center gap-1"
                  aria-label="Abrir no CRM"
                  title="Abrir no CRM"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden /> CRM
                </Link>
              </div>
            }
          >
            {isLoading && <IntelSkeleton lines={6} label="FETCHING_META" />}
            {!isLoading && error && <IntelErrorState onRetry={() => refetch()} />}
            {!isLoading && !error && (
              <dl className="space-y-1.5 text-xs">
                {Object.entries(data?.metadata || {}).slice(0, 18).map(([k, v]) => (
                  <div key={k} className="flex gap-2 border-b border-border/30 pb-1">
                    <dt className="intel-eyebrow shrink-0 w-28 truncate">{k}</dt>
                    <dd className="intel-mono text-foreground truncate flex-1">
                      {v === null || v === undefined || v === '' ? '—' : String(v).slice(0, 50)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </SectionFrame>

          <SectionFrame
            title="TIMELINE"
            meta={`${data?.timeline.length || 0} EVENTS`}
            count={data?.timeline.length}
            className="lg:col-span-1"
          >
            {isLoading ? (
              <IntelSkeleton lines={5} label="FETCHING_EVENTS" />
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto">
                {(data?.timeline || []).map((ev) => (
                  <div key={ev.id} className="flex gap-2 text-xs border-l-2 border-[hsl(var(--intel-accent))] pl-2 py-1">
                    <span className="intel-mono text-muted-foreground w-20 shrink-0">
                      {format(new Date(ev.occurred_at), 'dd/MM HH:mm')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <IntelBadge severity="info">{ev.kind}</IntelBadge>
                        <span className="text-foreground truncate">{ev.title}</span>
                      </div>
                      {ev.detail && <p className="text-muted-foreground truncate mt-0.5">{ev.detail}</p>}
                    </div>
                  </div>
                ))}
                {(!data?.timeline || data.timeline.length === 0) && (
                  <IntelEmptyState title="NO_EVENTS" description="Esta entidade ainda não tem eventos registrados." />
                )}
              </div>
            )}
          </SectionFrame>

          <SectionFrame title="RELATED_ENTITIES" count={data?.related.length}>
            {isLoading ? (
              <IntelSkeleton lines={4} label="FETCHING_RELATIONS" />
            ) : (
              <DataGrid
                columns={[
                  { key: 'type', label: 'TYPE', mono: true, width: '80px' },
                  { key: 'name', label: 'NAME' },
                  { key: 'meta', label: 'META', mono: true },
                ]}
                rows={(data?.related || []) as unknown as Array<Record<string, unknown>>}
                getRowKey={(r) => `${r.type}-${r.id}`}
                onRowClick={(r, e) => {
                  const t = String(r.type).toLowerCase();
                  if (t !== 'contact' && t !== 'company' && t !== 'deal') return;
                  const entry: HistoryEntry = { type: t as Entity360Type, id: String(r.id), name: String(r.name) };
                  if (e?.shiftKey) { pivotToCrossRef(e, entry); return; }
                  open(entry);
                }}
                emptyMessage="NO_RELATIONS"
              />
            )}
          </SectionFrame>
        </div>
      )}

      {current && showTimeline && (
        <EntityMonthlyTimeline
          events={data?.timeline || []}
          onClose={() => setShowTimeline(false)}
        />
      )}

      {current && showNotes && (
        <EntityNotesPanel
          entityKey={`${current.type}:${current.id}`}
          entityName={current.name}
          onClose={() => setShowNotes(false)}
        />
      )}

      {current && showDiff && previousEntry && (
        <MetadataDiffPanel
          beforeName={previousEntry.name}
          afterName={current.name}
          before={(previousData?.metadata || {}) as Record<string, unknown>}
          after={(data?.metadata || {}) as Record<string, unknown>}
          onClose={() => setShowDiff(false)}
        />
      )}

      {current && showMultiDiff && previousEntry && beforePreviousEntry && (
        <MultiDiffPanel
          entities={[
            {
              id: beforePreviousEntry.id,
              name: beforePreviousEntry.name,
              metadata: (beforePreviousData?.metadata || {}) as Record<string, unknown>,
            },
            {
              id: previousEntry.id,
              name: previousEntry.name,
              metadata: (previousData?.metadata || {}) as Record<string, unknown>,
            },
            {
              id: current.id,
              name: current.name,
              metadata: (data?.metadata || {}) as Record<string, unknown>,
            },
          ] as MultiDiffEntity[]}
          onClose={() => setShowMultiDiff(false)}
        />
      )}
    </div>
  );
});

Entity360Tab.displayName = 'Entity360Tab';
