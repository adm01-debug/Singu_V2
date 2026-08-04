import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Activity, AlertTriangle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { SectionFrame } from './SectionFrame';
import {
  inspectIntelStorage,
  resetIntelState,
  formatBytes,
  type IntelStorageStat,
} from '@/lib/intelHealth';
import { toast } from 'sonner';

const HOOKS_TRACKED = [
  { key: 'cross-reference', label: 'useCrossReference' },
  { key: 'entity360', label: 'useEntity360' },
  { key: 'ask-crm', label: 'useAskCrm' },
  { key: 'instant-kpis', label: 'useInstantKpis' },
];

const SCHEMA_VERSION = 'intel-hub-v5';

interface HookStatus {
  label: string;
  count: number;
  lastUpdated: number;
  hasError: boolean;
  isFetching: boolean;
}

/**
 * Painel diagnóstico do Intelligence Hub — acessível via ?diag=1.
 * Mostra status de hooks críticos, contagem de itens em localStorage, schema version
 * e botão para resetar o estado completo intel-*.
 */
export const IntelHealthPanel = () => {
  const qc = useQueryClient();
  const [refreshTick, setRefreshTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stats: IntelStorageStat[] = useMemo(() => inspectIntelStorage(), [refreshTick]);

  const hooks: HookStatus[] = useMemo(() => {
    return HOOKS_TRACKED.map((h) => {
      const queries = qc
        .getQueryCache()
        .getAll()
        .filter((q) => {
          try {
            const k = JSON.stringify(q.queryKey);
            return k.includes(h.key);
          } catch {
            return false;
          }
        });
      const lastUpdated = queries.reduce((m, q) => Math.max(m, q.state.dataUpdatedAt || 0), 0);
      const hasError = queries.some((q) => q.state.status === 'error');
      const isFetching = queries.some((q) => q.state.fetchStatus === 'fetching');
      return {
        label: h.label,
        count: queries.length,
        lastUpdated,
        hasError,
        isFetching,
      };
    });
    // refreshTick força recomputo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qc, refreshTick]);

  const totalSize = stats.reduce((acc, s) => acc + s.size, 0);
  const totalItems = stats.reduce((acc, s) => acc + s.itemCount, 0);

  const handleReset = () => {
    if (!window.confirm('Apagar TODO o estado local do Intelligence Hub (bookmarks, notas, snapshots, etc.)?')) {
      return;
    }
    const removed = resetIntelState();
    setRefreshTick((t) => t + 1);
    toast.success(`Estado limpo (${removed} chaves removidas).`);
  };

  return (
    <SectionFrame
      title="INTEL_HEALTH_CHECK"
      meta={`SCHEMA: ${SCHEMA_VERSION}`}
      cornerFrame
      actions={
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            className="intel-mono text-[10px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            aria-label="Recalcular health"
            title="Recalcular"
          >
            <RotateCcw className="h-3 w-3" aria-hidden /> REFRESH
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="intel-mono text-[10px] text-destructive hover:underline inline-flex items-center gap-1"
            aria-label="Resetar estado intel"
          >
            <AlertTriangle className="h-3 w-3" aria-hidden /> RESET_INTEL_STATE
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <p className="intel-eyebrow mb-1.5 inline-flex items-center gap-1">
            <Activity className="h-3 w-3" aria-hidden /> HOOKS
          </p>
          <ul className="space-y-1">
            {hooks.map((h) => (
              <li
                key={h.label}
                className="flex items-center justify-between text-[11px] intel-mono py-1 border-b border-border/30"
              >
                <span className="inline-flex items-center gap-1.5 text-foreground">
                  {h.hasError ? (
                    <AlertTriangle className="h-3 w-3 text-destructive" aria-hidden />
                  ) : h.count > 0 ? (
                    <CheckCircle2 className="h-3 w-3 text-[hsl(var(--sev-ok))]" aria-hidden />
                  ) : (
                    <span className="h-3 w-3 inline-block" aria-hidden />
                  )}
                  {h.label}
                </span>
                <span className="text-muted-foreground">
                  {h.count > 0 ? `${h.count}q` : 'idle'}
                  {h.isFetching ? ' · ⟳' : ''}
                  {h.lastUpdated > 0
                    ? ` · ${Math.max(0, Math.floor((Date.now() - h.lastUpdated) / 1000))}s`
                    : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="intel-eyebrow mb-1.5">STORAGE · {formatBytes(totalSize)} · {totalItems} ITENS</p>
          <ul className="space-y-1 max-h-[200px] overflow-y-auto">
            {stats.map((s) => (
              <li
                key={s.key}
                className="flex items-center justify-between text-[11px] intel-mono py-1 border-b border-border/30"
              >
                <span className="text-foreground truncate" title={s.key}>{s.key}</span>
                <span className="text-muted-foreground shrink-0 ml-2">
                  {s.itemCount} · {formatBytes(s.size)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="intel-mono text-[10px] text-muted-foreground mt-3">
        ── ACTIVE_DIAG · ?diag=1 ──
      </p>
    </SectionFrame>
  );
};
