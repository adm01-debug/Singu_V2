import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HealthScoreIndicator } from "./HealthScoreIndicator";
import { CategoryBadge } from "./CategoryBadge";
import { Badge } from "@/components/ui/badge";
import type { DealForecast } from "@/hooks/useForecasting";

export function RiskDealsTable({ deals }: { deals: DealForecast[] }) {
  const atRisk = deals.filter(d => d.health_score < 50 || (d.risk_factors?.length ?? 0) > 0)
    .sort((a, b) => a.health_score - b.health_score).slice(0, 20);

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Deals em Risco</CardTitle></CardHeader>
      <CardContent>
        {atRisk.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum deal em risco identificado 🎉</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Riscos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {atRisk.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.deal_name ?? d.deal_id}</TableCell>
                  <TableCell><CategoryBadge category={d.category} /></TableCell>
                  <TableCell>R$ {Number(d.forecasted_amount).toLocaleString("pt-BR")}</TableCell>
                  <TableCell><HealthScoreIndicator score={d.health_score} /></TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(d.risk_factors ?? []).slice(0, 3).map((r, i) => (
                        <Badge key={i} variant="outline" className="text-xs border-warning/40 text-warning">{r}</Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
