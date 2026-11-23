import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History } from "lucide-react";
import { useRevOpsSnapshots, type FunnelStage } from "@/hooks/useRevOps";

const STAGE_LABEL: Record<FunnelStage, string> = {
  visitor: "Visitante",
  lead: "Lead",
  mql: "MQL",
  sql: "SQL",
  opportunity: "Oportunidade",
  customer: "Cliente",
};

interface Props {
  periodStart: string;
  periodEnd: string;
}

export function RevOpsSnapshotHistory({ periodStart, periodEnd }: Props) {
  const { data = [], isLoading } = useRevOpsSnapshots(periodStart, periodEnd);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Snapshots capturados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : data.length === 0 ? (
          <EmptyState
            icon={History}
            title="Nenhum snapshot no período"
            description="Use o botão Atualizar Snapshot para registrar a fotografia do funil agora."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Período</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-right">Contagem</TableHead>
                <TableHead className="text-right">Conversão</TableHead>
                <TableHead className="text-right">Velocidade</TableHead>
                <TableHead>Capturado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map(s => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.period).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell><Badge variant="outline">{STAGE_LABEL[s.funnel_stage] ?? s.funnel_stage}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{s.count.toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.conversion_rate === null ? "—" : `${Number(s.conversion_rate).toFixed(1)}%`}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.avg_velocity_days === null ? "—" : `${Number(s.avg_velocity_days).toFixed(1)} d`}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.captured_at).toLocaleString("pt-BR")}
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