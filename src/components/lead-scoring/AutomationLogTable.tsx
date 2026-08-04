import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { AutomationLogRow } from '@/hooks/useScoreAutomations';

interface Props {
  rows: AutomationLogRow[];
}

export function AutomationLogTable({ rows }: Props) {
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Nenhum disparo registrado.</div>;
  }
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Transição</TableHead>
            <TableHead>Resultado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="text-xs whitespace-nowrap">
                {format(new Date(r.fired_at), "dd/MM HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="text-xs font-mono truncate max-w-[140px]">{r.contact_id.slice(0, 8)}…</TableCell>
              <TableCell className="text-xs">
                {r.from_grade ?? '-'} ({Math.round(r.from_score ?? 0)}) → {r.to_grade ?? '-'} ({Math.round(r.to_score ?? 0)})
              </TableCell>
              <TableCell>
                <Badge variant={r.success ? 'secondary' : 'destructive'} className="text-[10px]">
                  {r.success ? 'OK' : 'Falha'}
                </Badge>
                <span className="ml-2 text-[10px] text-muted-foreground">
                  {(r.action_result?.kind as string) || (r.action_result?.error as string) || ''}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
