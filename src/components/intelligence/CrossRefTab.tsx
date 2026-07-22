import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Search, Loader2, Download, GitCompare } from 'lucide-react';
import { toast } from 'sonner';
import { SectionFrame } from '@/components/intel/SectionFrame';
import { DataGrid } from '@/components/intel/DataGrid';
import { MetricMono } from '@/components/intel/MetricMono';
import { IntelBadge } from '@/components/intel/IntelBadge';
import { IntelSkeleton } from '@/components/intel/IntelSkeleton';
import { IntelErrorState } from '@/components/intel/IntelErrorState';
import { IntelEmptyState } from '@/components/intel/IntelEmptyState';
import { TemporalHeatmap } from '@/components/intel/TemporalHeatmap';
import { CommonEventsTimeline } from '@/components/intel/CommonEventsTimeline';
import { useCrossReference } from '@/hooks/useCrossReference';
import { queryExternalData } from '@/lib/externalData';
import { downloadCsv } from '@/lib/intelExport';
import { intelExportUniversal, type IntelExportFormat } from '@/lib/intelExportUniversal';
import { ExportFormatMenu } from '@/components/intel/ExportFormatMenu';
import { jaccardIndex } from '@/lib/jaccard';
import { CrossRefInsightsPanel } from '@/components/intel/CrossRefInsightsPanel';
import { buildCrossRefInsights } from '@/lib/crossRefInsights';
import { format } from 'date-fns';

const SHARED_INTERACTIONS_COLUMNS = [
  {
    key: 'occurred_at', label: 'TIMESTAMP', mono: true, width: '140px',
    render: (r: Record<string, unknown>) => format(new Date(String(r.occurred_at)), 'dd/MM/yy HH:mm'),
  },
  { key: 'channel', label: 'CHANNEL', mono: true, width: '100px' },
  { key: 'type', label: 'TYPE', mono: true },
] as const;

const SHARED_DEALS_COLUMNS = [
  { key: 'title', label: 'TITLE' },
  { key: 'stage', label: 'STAGE', mono: true, width: '120px' },
  {
    key: 'value', label: 'VALUE', mono: true, width: '120px',
    render: (r: Record<string, unknown>) => `R$ ${Number(r.value).toLocaleString('pt-BR')}`,
  },
] as const;

interface MetaRow {
  id: string;
  name: string;
  metadata: Record<string, unknown>;
}

const COMPARE_FIELDS = [
  { key: 'created_at', label: 'CRIADO_EM', format: (v: unknown) => v ? format(new Date(String(v)), 'dd/MM/yyyy') : '—' },
  { key: 'updated_at', label: 'ATUALIZADO', format: (v: unknown) => v ? format(new Date(String(v)), 'dd/MM/yyyy') : '—' },
  { key: 'relationship_score', label: 'SCORE', format: (v: unknown) => v != null ? String(v) : '—' },
  { key: 'industry', label: 'INDUSTRY', format: (v: unknown) => v ? String(v) : '—' },
  { key: 'role', label: 'ROLE', format: (v: unknown) => v ? String(v) : '—' },
  { key: 'email', label: 'EMAIL', format: (v: unknown) => v ? String(v) : '—' },
  { key: 'phone', label: 'PHONE', format: (v: unknown) => v ? String(v) : '—' },
];

interface Picked { id: string; name: string; }

export const CrossRefTab = () => {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const [type, setType] = useState<'contact' | 'company'>('contact');
  const [picked, setPicked] = useState<Picked[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Picked[]>([]);
  const [searching, setSearching] = useState(false);
  const [metaRows, setMetaRows] = useState<MetaRow[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);

  // Aceita ?pivot=type:id (vindo de Shift+click no Entity 360)
  useEffect(() => {
    const pivot = params.get('pivot');
    if (!pivot) return;
    const controller = new AbortController();
    const [pType, pId] = pivot.split(':');
    if ((pType === 'contact' || pType === 'company') && pId) {
      setType(pType);
      (async () => {
        try {
          const table = pType === 'contact' ? 'contacts' : 'companies';
          const nameCol = pType === 'contact' ? 'full_name' : 'name';
          const { data: rows } = await queryExternalData<Record<string, unknown>>({
            table,
            select: `id, ${nameCol}`,
            filters: [{ type: 'eq', column: 'id', value: pId }, { type: 'eq', column: 'user_id', value: user?.id ?? '' }],
            range: { from: 0, to: 0 },
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          const name = rows?.[0]?.[nameCol] ? String(rows[0][nameCol]) : pId.slice(0, 8);
          setPicked((prev) =>
            // eslint-disable-next-line sonarjs/no-nested-functions
            prev.some((p) => p.id === pId) ? prev : [...prev, { id: pId, name }].slice(0, 3)
          );
        } catch (e) {
          if (e instanceof Error && e.name === 'AbortError') return;
          if (controller.signal.aborted) return;
          setPicked((prev) =>
            // eslint-disable-next-line sonarjs/no-nested-functions
            prev.some((p) => p.id === pId) ? prev : [...prev, { id: pId, name: pId.slice(0, 8) }].slice(0, 3)
          );
        }
      })();
    }
    const next = new URLSearchParams(params);
    next.delete('pivot');
    setParams(next, { replace: true });
    return () => { controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [params, setParams]);

  const { data, isLoading, error, refetch } = useCrossReference({
    entityIds: picked.map((p) => p.id),
    entityType: type,
  });

  const peakDay = useMemo(() => {
    if (!data?.temporalOverlap?.length) return null;
    return [...data.temporalOverlap].sort((a, b) => b.count - a.count)[0];
  }, [data]);

  const overlap = useMemo(() => {
    if (!data?.interactionsWithMatches?.length || picked.length < 2) {
      return { index: 0, intersection: 0, union: 0 };
    }
    const groups: string[][] = picked.map((p) =>
      data.interactionsWithMatches
        .filter((i) => i.matchedIds.includes(p.id))
        .map((i) => i.id)
    );
    return jaccardIndex(groups);
  }, [data, picked]);

  const insights = useMemo(() => {
    if (picked.length < 2 || !data) return [];
    return buildCrossRefInsights({
      interactions: data.interactionsWithMatches || [],
      temporalOverlap: data.temporalOverlap || [],
      totalEntities: picked.length,
      sharedDealsCount: data.sharedDeals?.length || 0,
      overlapIndex: overlap.index,
    });
  }, [data, picked, overlap.index]);

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      if (picked.length < 2) { setMetaRows([]); return; }
      setLoadingMeta(true);
      try {
        const table = type === 'contact' ? 'contacts' : 'companies';
        const rows = await Promise.all(
          picked.map(async (p) => {
            const { data: r } = await queryExternalData<Record<string, unknown>>({
              table,
              select: '*',
              filters: [{ type: 'eq', column: 'id', value: p.id }, { type: 'eq', column: 'user_id', value: user?.id ?? '' }],
              range: { from: 0, to: 0 },
              signal: controller.signal,
            });
            return { id: p.id, name: p.name, metadata: r?.[0] || {} };
          })
        );
        if (!controller.signal.aborted) setMetaRows(rows);
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        if (!controller.signal.aborted) setMetaRows([]);
      } finally {
        if (!controller.signal.aborted) setLoadingMeta(false);
      }
    };
    run();
    return () => { controller.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps estáveis (storage keys/user id/refs) — adicionar causaria re-execução desnecessária ou loop
  }, [picked, type]);

  const compareFields = useMemo(() => {
    if (metaRows.length < 2) return [];
    return COMPARE_FIELDS.filter((f) =>
      metaRows.some((m) => m.metadata[f.key] !== undefined && m.metadata[f.key] !== null && m.metadata[f.key] !== '')
    );
  }, [metaRows]);

  const doSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const table = type === 'contact' ? 'contacts' : 'companies';
      const nameCol = type === 'contact' ? 'full_name' : 'name';
      const { data: rows } = await queryExternalData<Record<string, unknown>>({
        table,
        select: `id, ${nameCol}`,
        filters: [{ type: 'eq', column: 'user_id', value: user?.id ?? '' }],
        search: { term: search, columns: [nameCol] },
        range: { from: 0, to: 9 },
      });
      setResults((rows || []).map((r) => ({ id: String(r.id), name: String(r[nameCol] || 'Sem nome') })));
    } catch {
      toast.error('Falha na busca.');
    } finally {
      setSearching(false);
    }
  };

  const add = (p: Picked) => {
    if (picked.length >= 3 || picked.some((x) => x.id === p.id)) return;
    setPicked([...picked, p]);
    setResults([]);
    setSearch('');
  };

  const exportShared = (fmt: IntelExportFormat) => {
    if (!data?.sharedInteractions.length) {
      toast.error('Nada para exportar.');
      return;
    }
    const ok = intelExportUniversal(
      data.sharedInteractions.map((i) => ({ ...i })),
      `crossref-interacoes-${Date.now()}`,
      fmt,
    );
    if (ok) toast.success(`Exportado em ${fmt.toUpperCase()}.`);
  };

  const exportBundle = () => {
    if (!data) return;
    const ts = Date.now();
    const meta = picked.map((p) => `${p.id}:${p.name}`).join(' | ');

    const sharedRows = data.sharedInteractions.map((i) => ({
      _entities: meta,
      ...i,
    }));
    const commonRows = (data.interactionsWithMatches || [])
      .filter((i) => i.matchedIds.length >= picked.length)
      .map((i) => ({
        _entities: meta,
        id: i.id,
        occurred_at: i.occurred_at,
        type: i.type,
        channel: i.channel,
        matched_count: i.matchedIds.length,
        matched_ids: i.matchedIds.join(';'),
      }));

    if (sharedRows.length === 0 && commonRows.length === 0) {
      toast.error('Nada para exportar no bundle.');
      return;
    }
    if (sharedRows.length > 0) downloadCsv(sharedRows, `crossref-comparison-${ts}`);
    if (commonRows.length > 0) downloadCsv(commonRows, `crossref-common-events-${ts}`);
    toast.success(`Bundle exportado (${sharedRows.length} + ${commonRows.length} linhas).`);
  };

  return (
    <div className="space-y-3">
      <SectionFrame title="CROSS_REFERENCE_BUILDER" meta={`${picked.length}/3 SELECTED`}>
        <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Tipo de entidade">
          {(['contact', 'company'] as const).map((t) => (
            <Button
              key={t}
              size="sm"
              variant={type === t ? 'default' : 'outline'}
              onClick={() => { setType(t); setPicked([]); }}
              className="intel-mono text-[10px] uppercase h-8"
              aria-pressed={type === t}
            >
              {t}
            </Button>
          ))}
        </div>

        {picked.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {picked.map((p) => (
              <span key={p.id} className="intel-card px-2 py-1 text-xs flex items-center gap-1.5">
                <IntelBadge severity="info">{type.toUpperCase()}</IntelBadge>
                <span className="text-foreground">{p.name}</span>
                <button
                  onClick={() => setPicked(picked.filter((x) => x.id !== p.id))}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${p.name}`}
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              </span>
            ))}
          </div>
        )}

        {picked.length < 3 && (
          <div className="flex gap-2">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()}
              placeholder={`Adicionar ${type}…`}
              className="intel-mono text-xs h-8"
              aria-label="Buscar entidade"
            />
            <Button size="sm" onClick={doSearch} disabled={searching} className="h-8" aria-label="Buscar">
              {searching ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : <Search className="h-3 w-3" aria-hidden />}
            </Button>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-2 space-y-1">
            {results.map((r) => (
              <button
                key={r.id}
                onClick={() => add(r)}
                className="w-full text-left intel-card intel-card-hover px-2 py-1.5 text-xs flex items-center justify-between"
                aria-label={`Adicionar ${r.name}`}
              >
                <span className="text-foreground">{r.name}</span>
                <Plus className="h-3 w-3 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </SectionFrame>

      {picked.length >= 2 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="intel-card px-3 py-2">
              <MetricMono label="SHARED_INT" value={isLoading ? '…' : (data?.sharedInteractions.length ?? '—')} />
            </div>
            <div className="intel-card px-3 py-2">
              <MetricMono label="SHARED_DEALS" value={isLoading ? '…' : (data?.sharedDeals.length ?? '—')} />
            </div>
            <div className="intel-card px-3 py-2">
              <MetricMono label="OVERLAP_DAYS" value={isLoading ? '…' : (data?.temporalOverlap.length ?? '—')} />
            </div>
            <div
              className="intel-card px-3 py-2"
              title={`Jaccard = |A∩B| / |A∪B| · ${overlap.intersection}/${overlap.union}`}
            >
              <MetricMono
                label="OVERLAP_IDX"
                value={isLoading ? '…' : `${Math.round(overlap.index * 100)}%`}
              />
            </div>
          </div>

          {error && <IntelErrorState onRetry={() => refetch()} />}

          <SectionFrame title="METADATA_COMPARISON" meta={loadingMeta ? 'LOADING…' : `${compareFields.length} FIELDS`}>
            {loadingMeta ? (
              <IntelSkeleton lines={4} label="LOADING_META" />
            ) : compareFields.length === 0 ? (
              <IntelEmptyState title="NO_COMPARABLE_FIELDS" description="Não há campos comuns preenchidos entre as entidades selecionadas." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs intel-mono border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="intel-eyebrow text-left py-1.5 pr-2 w-32">CAMPO</th>
                      {metaRows.map((m) => (
                        <th key={m.id} className="text-left py-1.5 px-2 text-foreground truncate max-w-[180px]" title={m.name}>
                          {m.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {compareFields.map((f) => {
                      const values = metaRows.map((m) => f.format(m.metadata[f.key]));
                      const allEqual = values.every((v) => v === values[0]);
                      return (
                        <tr key={f.key} className="border-b border-border/30">
                          <td className="intel-eyebrow py-1 pr-2">{f.label}</td>
                          {values.map((v, i) => (
                            <td
                              key={`${f.key}-${i}`}
                              className={`py-1 px-2 truncate max-w-[180px] ${allEqual ? 'text-muted-foreground' : 'text-[hsl(var(--intel-accent))]'}`}
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="intel-mono text-[10px] text-muted-foreground mt-2">
                  Valores em <span className="text-[hsl(var(--intel-accent))]">cyan</span> indicam diferenças entre as entidades.
                </p>
              </div>
            )}
          </SectionFrame>

          <SectionFrame
            title="TEMPORAL_OVERLAP"
            meta="30D"
            actions={
              <ExportFormatMenu
                onExport={exportShared}
                disabled={!data?.sharedInteractions.length}
                label="EXPORT"
              />
            }
          >
            {isLoading ? (
              <IntelSkeleton lines={4} label="COMPUTING_OVERLAP" />
            ) : (
              <>
                <TemporalHeatmap data={data?.temporalOverlap || []} days={30} />
                {peakDay && (
                  <p className="intel-mono text-[11px] text-muted-foreground mt-3">
                    PICO: <span className="text-[hsl(var(--intel-accent))]">{format(new Date(peakDay.date), 'dd/MM/yyyy')}</span> com {peakDay.count} interaç{peakDay.count === 1 ? 'ão' : 'ões'} compartilhada{peakDay.count === 1 ? '' : 's'}.
                  </p>
                )}
              </>
            )}
          </SectionFrame>

          {insights.length > 0 && <CrossRefInsightsPanel insights={insights} />}

          {!isLoading && (
            <CommonEventsTimeline
              interactions={data?.interactionsWithMatches || []}
              totalEntities={picked.length}
            />
          )}

          <SectionFrame
            title="SHARED_INTERACTIONS"
            count={data?.sharedInteractions.length}
            meta={isLoading ? 'LOADING…' : 'OK'}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={exportBundle}
                disabled={!data || (!data.sharedInteractions.length && !data.interactionsWithMatches?.length)}
                className="h-7 intel-mono text-[10px] gap-1.5"
                aria-label="Exportar bundle CSV"
                title="Exporta comparison + common-events em 2 CSVs"
              >
                <Download className="h-3 w-3" aria-hidden /> BUNDLE
              </Button>
            }
          >
            {isLoading ? (
              <IntelSkeleton lines={5} />
            ) : (
              <DataGrid
                columns={[...SHARED_INTERACTIONS_COLUMNS] as never}
                rows={(data?.sharedInteractions || []) as unknown as Array<Record<string, unknown>>}
                getRowKey={(r) => String(r.id)}
                emptyMessage="NO_SHARED_INTERACTIONS"
              />
            )}
          </SectionFrame>

          <SectionFrame title="SHARED_DEALS" count={data?.sharedDeals.length}>
            {isLoading ? (
              <IntelSkeleton lines={4} />
            ) : (
              <DataGrid
                columns={[...SHARED_DEALS_COLUMNS] as never}
                rows={(data?.sharedDeals || []) as unknown as Array<Record<string, unknown>>}
                getRowKey={(r) => String(r.id)}
                emptyMessage="NO_SHARED_DEALS"
              />
            )}
          </SectionFrame>
        </>
      )}

      {picked.length < 2 && (
        <IntelEmptyState
          icon={GitCompare}
          title="SELECT_AT_LEAST_2_ENTITIES"
          description="Adicione 2 ou 3 entidades acima para cruzar interações, deals compartilhados e comparar metadata lado a lado."
        />
      )}
    </div>
  );
};
