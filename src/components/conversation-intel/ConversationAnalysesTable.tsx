import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { CoachingScoreBadge } from "./CoachingScoreBadge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Row {
  id: string;
  interaction_id: string;
  coaching_score: number | null;
  sentiment_overall: string | null;
  talk_ratio_rep: number | null;
  analyzed_at: string;
  topics: Array<{ label: string }>;
  interactions?: { title?: string; type?: string } | null;
}

const sentimentVariant = (s: string | null) =>
  s === "positive" ? "bg-success/15 text-success border-success/30"
    : s === "negative" ? "bg-destructive/15 text-destructive border-destructive/30"
    : s === "mixed" ? "bg-warning/15 text-warning border-warning/30"
    : "bg-muted text-muted-foreground";

export function ConversationAnalysesTable({ rows }: { rows: Row[] }) {
  const nav = useNavigate();
  if (!rows.length) return <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma análise no período.</p>;
  return (
    <div className="rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Conversa</TableHead>
            <TableHead>Sentimento</TableHead>
            <TableHead>Talk Ratio</TableHead>
            <TableHead>Tópicos</TableHead>
            <TableHead>Coaching</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => nav(`/interacoes/${r.interaction_id}`)}>
              <TableCell className="font-medium text-sm max-w-[240px] truncate">
                {r.interactions?.title ?? "Conversa"}
                {r.interactions?.type && <span className="ml-2 text-[10px] text-muted-foreground uppercase">{r.interactions.type}</span>}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={sentimentVariant(r.sentiment_overall)}>
                  {r.sentiment_overall ?? "—"}
                </Badge>
              </TableCell>
              <TableCell className="tabular-nums text-xs">
                {r.talk_ratio_rep != null ? `${Number(r.talk_ratio_rep).toFixed(0)}% rep` : "—"}
              </TableCell>
              <TableCell className="max-w-[200px]">
                <div className="flex flex-wrap gap-1">
                  {(r.topics ?? []).slice(0, 3).map((t, i) => (
                    <Badge key={i} variant="secondary" className="text-[10px]">{t.label}</Badge>
                  ))}
                  {(r.topics?.length ?? 0) > 3 && <span className="text-[10px] text-muted-foreground">+{(r.topics?.length ?? 0) - 3}</span>}
                </div>
              </TableCell>
              <TableCell><CoachingScoreBadge score={r.coaching_score} /></TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {format(new Date(r.analyzed_at), "dd/MM HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" aria-label="Visualizar" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
