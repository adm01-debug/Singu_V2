import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OutcomeBadge } from './OutcomeBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { useWinLossRecords, useWinLossReasons, useCompetitors } from '@/hooks/useWinLoss';
import type { WinLossOutcome } from '@/hooks/useWinLoss';
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
