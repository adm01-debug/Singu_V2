import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRpcPlanDiff } from '@/hooks/useRpcPlanDiff';
import {
  diffPlans,
  summarizeDiff,
  hasScanRegression,
  type PlanDiffRow,
  type PlanNode,
} from '@/lib/rpcPlanDiff';

interface RpcPlanDiffDialogProps {
  rpcName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_LABEL: Record<PlanDiffRow['status'], string> = {
  unchanged: 'igual',
  changed: 'alterado',
  added: 'novo',
  removed: 'removido',
};

function NodeCell({ node, highlight }: { node: PlanNode | null; highlight: boolean }) {
  if (!node) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className={cn('text-xs', highlight && 'text-destructive font-medium')}>
      <span style={{ paddingLeft: `${node.depth * 10}px` }}>{node.nodeType}</span>
      {node.relation && <span className="text-muted-foreground"> · {node.relation}</span>}
      {node.totalCost !== null && (
        <span className="text-muted-foreground"> · custo {Math.round(node.totalCost)}</span>
      )}
    </div>
  );
}

function DiffRow({ row }: { row: PlanDiffRow }) {
  const highlight = row.status !== 'unchanged';
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 items-center py-1.5 border-b last:border-b-0',
        highlight && 'bg-muted/40',
      )}
    >
      <NodeCell node={row.previous} highlight={row.status === 'removed'} />
      <NodeCell node={row.current} highlight={row.status === 'changed' || row.status === 'added'} />
      <Badge variant={highlight ? 'destructive' : 'outline'} className="justify-self-start">
        {STATUS_LABEL[row.status]}
      </Badge>
    </div>
  );
}

/**
 * Rodada 64/10 — diff visual lado a lado dos dois últimos planos capturados,
 * destacando nós que mudaram de estratégia (ex.: Index Scan → Seq Scan).
 */
export function RpcPlanDiffDialog({ rpcName, open, onOpenChange }: RpcPlanDiffDialogProps) {
  const { data, isLoading, error } = useRpcPlanDiff(open ? rpcName : null);

  const rows = useMemo<PlanDiffRow[]>(() => {
    if (!data?.current) return [];
    return diffPlans(data.current.plan, data.previous?.plan ?? null);
  }, [data]);

  const summary = useMemo(() => summarizeDiff(rows), [rows]);
  const regression = useMemo(() => hasScanRegression(rows), [rows]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Diff de plano · {rpcName ?? '—'}</DialogTitle>
          <DialogDescription>
            Comparação entre os dois últimos planos capturados. Coluna esquerda = anterior, direita
            = atual.
          </DialogDescription>
        </DialogHeader>

        {isLoading && <Skeleton className="h-40" />}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Falha ao carregar o diff</AlertTitle>
            <AlertDescription>{String((error as Error).message)}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && !data?.previous && (
          <p className="text-sm text-muted-foreground">
            Só existe um snapshot para esta RPC — não há plano anterior para comparar.
          </p>
        )}

        {!isLoading && !error && data?.current && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{summary.unchanged} iguais</Badge>
              <Badge variant={summary.changed > 0 ? 'destructive' : 'outline'}>
                {summary.changed} alterados
              </Badge>
              <Badge variant="outline">{summary.added} novos</Badge>
              <Badge variant="outline">{summary.removed} removidos</Badge>
            </div>

            {regression && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Regressão de varredura detectada</AlertTitle>
                <AlertDescription>
                  Um nó que antes usava índice passou a fazer Seq Scan. Rode <code>ANALYZE</code> na
                  tabela e verifique índices ausentes.
                </AlertDescription>
              </Alert>
            )}

            <ScrollArea className="h-[45vh] pr-3">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 pb-1 text-xs font-medium text-muted-foreground border-b">
                <span>Anterior ({data.previous?.plan_hash.slice(0, 8) ?? '—'})</span>
                <span>Atual ({data.current.plan_hash.slice(0, 8)})</span>
                <span>Status</span>
              </div>
              {rows.map((row) => <DiffRow key={`${row.path}-${row.status}`} row={row} />)}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
