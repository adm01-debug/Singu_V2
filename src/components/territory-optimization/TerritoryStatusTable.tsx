import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TerritoryStatusRow } from '@/hooks/useTerritoryOptimization';

interface Props {
  rows: TerritoryStatusRow[];
}

const STATUS_LABEL: Record<TerritoryStatusRow['status'], string> = {
  healthy: 'Saudável',
  underserved: 'Sub-atendido',
  overserved: 'Sobre-atendido',
  unassigned: 'Sem responsável',
};

const STATUS_VARIANT: Record<
  TerritoryStatusRow['status'],
  'default' | 'destructive' | 'secondary' | 'outline'
> = {
  healthy: 'secondary',
  underserved: 'destructive',
  overserved: 'outline',
  unassigned: 'destructive',
};

export function TerritoryStatusTable({ rows }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Status dos Territórios</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Território</TableHead>
                <TableHead className="hidden md:table-cell">UF</TableHead>
                <TableHead className="hidden lg:table-cell">Responsável</TableHead>
                <TableHead className="text-right">Empresas</TableHead>
                <TableHead className="text-right hidden sm:table-cell">Deals</TableHead>
                <TableHead className="text-right hidden md:table-cell">Conv.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum território cadastrado.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {r.state ?? '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {r.assigned_to_name ?? <span className="italic">não atribuído</span>}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.company_count}</TableCell>
                    <TableCell className="text-right tabular-nums hidden sm:table-cell">
                      {r.deal_count}
                    </TableCell>
                    <TableCell className="text-right tabular-nums hidden md:table-cell">
                      {(r.conversion_rate * 100).toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.status]} className="text-[10px]">
                        {STATUS_LABEL[r.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
