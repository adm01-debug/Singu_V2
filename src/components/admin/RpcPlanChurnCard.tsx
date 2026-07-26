import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Activity, Shuffle } from 'lucide-react';
import { useRpcPlanChurn, type RpcPlanChurnRow } from '@/hooks/useRpcPlanChurn';
import { useRpcPerfStats } from '@/hooks/useRpcPerfStats';
import { RpcPlanDiffDialog } from '@/components/admin/RpcPlanDiffDialog';
import { RpcPlanChurnTimelineChart } from '@/components/admin/RpcPlanChurnTimelineChart';

const ALL_RPCS = '__all__';

/** Janelas suportadas para a timeline/churn (horas). */
const WINDOW_OPTIONS = [
  { value: '6', label: '6h' },
  { value: '24', label: '24h' },
  { value: '168', label: '7d' },
] as const;

const DEFAULT_WINDOW = '24';
const VALID_WINDOWS = new Set(WINDOW_OPTIONS.map((o) => o.value));

/** Janela de agregação do churn (contagem de trocas) — fixa em 6h por alinhamento com os alertas. */
const CHURN_WINDOW_HOURS = 6;

function severity(changes: number): { label: string; variant: 'destructive' | 'secondary' | 'outline' } {
  if (changes >= 3) return { label: 'instável', variant: 'destructive' };
  if (changes === 2) return { label: 'atenção', variant: 'secondary' };
  return { label: 'ok', variant: 'outline' };
}

interface ChurnItem extends RpcPlanChurnRow {
  p95Ms: number | null;
}

function ChurnRow({ item, onSelect }: { item: ChurnItem; onSelect: (rpc: string) => void }) {
  const sev = severity(item.changes);
  const degraded = item.p95Ms !== null && item.p95Ms >= 800;
  return (
    <button
      type="button"
      onClick={() => onSelect(item.rpc_name)}
      aria-label={`Ver diff de plano da RPC ${item.rpc_name}`}
      className="w-full text-left flex items-center justify-between gap-3 py-2 border-b last:border-b-0 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
    >
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{item.rpc_name}</p>
        <p className="text-xs text-muted-foreground">
          última troca: {new Date(item.last_change).toLocaleString('pt-BR')}
          {item.p95Ms !== null ? ` • p95 24h: ${Math.round(item.p95Ms)}ms` : ' • sem amostras de p95'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {degraded && (
          <Badge variant="destructive" className="gap-1">
            <Activity className="w-3 h-3" /> p95 alto
          </Badge>
        )}
        <Badge variant={sev.variant}>
          {item.changes}× · {sev.label}
        </Badge>
      </div>
    </button>
  );
}

/**
 * Rodada 66/10 — churn de planos de execução (trocas por RPC em 6h),
 * correlacionado visualmente com o p95 das últimas 24h.
 */
export function RpcPlanChurnCard() {
  const churn = useRpcPlanChurn(CHURN_WINDOW_HOURS);
  const perf = useRpcPerfStats(24);
  const [selectedRpc, setSelectedRpc] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const timelineRpc = searchParams.get('churnRpc') ?? ALL_RPCS;
  const rawWindow = searchParams.get('churnWindow') ?? DEFAULT_WINDOW;
  const timelineWindow = VALID_WINDOWS.has(rawWindow) ? rawWindow : DEFAULT_WINDOW;

  const updateParam = useCallback(
    (key: string, value: string, defaultValue: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === defaultValue) next.delete(key);
          else next.set(key, value);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const items = useMemo<ChurnItem[]>(() => {
    const rows = Array.isArray(churn.data) ? churn.data : [];
    const stats = Array.isArray(perf.data?.stats) ? perf.data.stats : [];
    const p95ByRpc = new Map(stats.map((s) => [s.rpc_name, s.p95_ms]));
    return rows
      .map((r) => ({ ...r, p95Ms: p95ByRpc.get(r.rpc_name) ?? null }))
      .sort((a, b) => b.changes - a.changes);
  }, [churn.data, perf.data]);

  const unstable = items.filter((i) => i.changes >= 3).length;
  const rpcOptions = useMemo(
    () => Array.from(new Set(items.map((i) => i.rpc_name))).sort((a, b) => a.localeCompare(b)),
    [items],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shuffle className="w-4 h-4" /> Churn de plano ({CHURN_WINDOW_HOURS}h)
          {unstable > 0 && <Badge variant="destructive">{unstable} instável(is)</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
            <p className="text-xs text-muted-foreground">
              Barras: trocas de plano · linha: p95 (ms)
            </p>
            <div className="flex items-center gap-2">
            <Select
              value={timelineRpc}
              onValueChange={(v) => updateParam('churnRpc', v, ALL_RPCS)}
            >
              <SelectTrigger className="h-8 w-full md:w-[220px] text-xs" aria-label="Filtrar timeline por RPC">
                <SelectValue placeholder="Todas as RPCs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_RPCS}>Todas as RPCs</SelectItem>
                {rpcOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={timelineWindow}
              onValueChange={(v) => updateParam('churnWindow', v, DEFAULT_WINDOW)}
            >
              <SelectTrigger className="h-8 w-[90px] text-xs" aria-label="Janela da timeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WINDOW_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            </div>
          </div>
          <RpcPlanChurnTimelineChart
            rpcName={timelineRpc === ALL_RPCS ? null : timelineRpc}
            hours={Number(timelineWindow)}
          />
        </div>
        {churn.isLoading ? (
          <Skeleton className="h-20" />
        ) : churn.error ? (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Falha ao carregar churn de plano</AlertTitle>
            <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
          </Alert>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma troca de plano nas últimas {CHURN_WINDOW_HOURS} horas — planos estáveis.
          </p>
        ) : (
          <div>
            {items.map((item) => (
              <ChurnRow key={item.rpc_name} item={item} onSelect={setSelectedRpc} />
            ))}
          </div>
        )}
      </CardContent>
      <RpcPlanDiffDialog
        rpcName={selectedRpc}
        open={selectedRpc !== null}
        onOpenChange={(open) => !open && setSelectedRpc(null)}
      />
    </Card>
  );
}
