import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IntentScoreBadge } from "./IntentScoreBadge";
import { Badge } from "@/components/ui/badge";
import type { IntentScore } from "@/hooks/useIntent";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SIGNAL_TYPE_LABELS } from "@/hooks/useIntent";

interface Props {
  scores: IntentScore[];
  loading?: boolean;
}

export function HotAccountsTable({ scores, loading }: Props) {
  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando contas hot…</div>;
  }
  if (scores.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Nenhuma conta com intent registrada ainda. Instale o pixel ou registre sinais manualmente.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Conta / ID externo</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Sinais 30d</TableHead>
          <TableHead>Top sinal</TableHead>
          <TableHead>Última atualização</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scores.map((s) => {
          const top = Array.isArray(s.top_signals) ? s.top_signals[0] : null;
          return (
            <TableRow key={s.id}>
              <TableCell className="font-mono text-xs">{s.scope_id}</TableCell>
              <TableCell><IntentScoreBadge score={s.intent_score} trend={s.score_trend} /></TableCell>
              <TableCell>{s.signal_count_30d}</TableCell>
              <TableCell>
                {top ? (
                  <Badge variant="secondary" className="text-xs">
                    {SIGNAL_TYPE_LABELS[top.type] ?? top.type}
                  </Badge>
                ) : <span className="text-muted-foreground text-xs">—</span>}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(s.computed_at), { addSuffix: true, locale: ptBR })}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
