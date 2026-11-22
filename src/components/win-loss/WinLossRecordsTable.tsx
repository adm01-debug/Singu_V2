import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OutcomeBadge } from './OutcomeBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useWinLossRecords, useWinLossReasons, useCompetitors, useDeleteWinLossRecord } from '@/hooks/useWinLoss';
import type { WinLossOutcome, WinLossRecord } from '@/hooks/useWinLoss';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';

interface Props {
  outcomeFilter?: WinLossOutcome;
  competitorFilter?: string;
  fromDate?: string;
}

export function WinLossRecordsTable({ outcomeFilter, competitorFilter, fromDate }: Props) {
  const { data: records, isLoading } = useWinLossRecords({
    outcome: outcomeFilter,
    competitor_id: competitorFilter,
    fromDate,
  });
  const { data: reasons } = useWinLossReasons();
  const { data: competitors } = useCompetitors();
  const del = useDeleteWinLossRecord();
  const [pendingDelete, setPendingDelete] = useState<WinLossRecord | null>(null);

  const reasonMap = useMemo(() => new Map((reasons ?? []).map(r => [r.id, r.label])), [reasons]);
  const compMap = useMemo(() => new Map((competitors ?? []).map(c => [c.id, c.name])), [competitors]);

  if (isLoading) {
    return <div className="space-y-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  const rows = records ?? [];
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Nenhum registro encontrado.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Deal</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Concorrente</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="text-right">Ciclo (d)</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.id}>
              <TableCell className="font-mono text-xs">{r.deal_id.slice(0, 12)}</TableCell>
              <TableCell><OutcomeBadge outcome={r.outcome} /></TableCell>
              <TableCell className="text-sm">{r.primary_reason_id ? reasonMap.get(r.primary_reason_id) ?? '—' : '—'}</TableCell>
              <TableCell className="text-sm">{r.competitor_id ? compMap.get(r.competitor_id) ?? '—' : '—'}</TableCell>
              <TableCell className="text-right text-sm">
                {r.deal_value != null ? `R$ ${Number(r.deal_value).toLocaleString('pt-BR')}` : '—'}
              </TableCell>
              <TableCell className="text-right text-sm">{r.sales_cycle_days ?? '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(r.recorded_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Excluir registro"
                  onClick={() => setPendingDelete(r)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro de Win/Loss?</AlertDialogTitle>
            <AlertDialogDescription>
              O registro do deal {pendingDelete?.deal_id.slice(0, 12)} será removido permanentemente e as métricas serão recalculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) del.mutate(pendingDelete.id, { onSuccess: () => setPendingDelete(null) });
              }}
              disabled={del.isPending}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
