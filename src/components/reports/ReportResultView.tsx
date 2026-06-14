import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ENTITIES, getValue, type ReportResult, type ReportConfig } from '@/lib/reports/reportEngine';

interface Props {
  config: ReportConfig;
  result: ReportResult | null;
  loading: boolean;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'Sim' : 'Não';
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleString('pt-BR');
  }
  if (typeof v === 'number') return v.toLocaleString('pt-BR');
  return String(v);
}

export function ReportResultView({ config, result, loading }: Props) {
  if (loading) {
    return <div className="text-center py-8 text-sm text-muted-foreground">Executando relatório…</div>;
  }
  if (!result) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Configure os campos à esquerda e clique em "Executar" para gerar o relatório.
        </CardContent>
      </Card>
    );
  }

  const def = ENTITIES[config.entity];
  const fieldDefs = config.fields.map(k => def.fields.find(f => f.key === k)).filter(Boolean) as Array<NonNullable<ReturnType<typeof def.fields.find>>>;

  return (
    <div className="space-y-3">
      {/* Totals */}
      {Object.keys(result.totals).length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Totais</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(result.totals).map(([k, v]) => (
                <Badge key={k} variant="secondary" className="text-xs">
                  {k}: <strong className="ml-1">{typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : v}</strong>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grouped */}
      {result.groups ? (
        <div className="space-y-3">
          {result.groups.map(g => (
            <Card key={g.key}>
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-sm">{g.key} <span className="text-xs text-muted-foreground">({g.rows.length})</span></CardTitle>
                <div className="flex gap-1.5">
                  {Object.entries(g.aggregations).map(([k, v]) => (
                    <Badge key={k} variant="outline" className="text-[10px]">
                      {k}: {typeof v === 'number' ? v.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) : v}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <DataTable rows={g.rows} fieldDefs={fieldDefs} />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{result.rows.length} registros</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable rows={result.rows} fieldDefs={fieldDefs} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DataTable({ rows, fieldDefs }: { rows: Record<string, unknown>[]; fieldDefs: Array<{ key: string; label: string }> }) {
  if (rows.length === 0) return <p className="text-xs text-muted-foreground py-4 text-center">Nenhum registro encontrado.</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {fieldDefs.map(f => <TableHead key={f.key} className="text-xs">{f.label}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.slice(0, 200).map((row, i) => (
            <TableRow key={i}>
              {fieldDefs.map(f => (
                <TableCell key={f.key} className="text-xs">{formatCell(getValue(row, f.key))}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {rows.length > 200 && (
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Exibindo 200 de {rows.length} registros. Exporte CSV para ver todos.
        </p>
      )}
    </div>
  );
}
