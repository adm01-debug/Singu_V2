import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LeadGradeBadge } from './LeadGradeBadge';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { LeadScoreRow } from '@/hooks/useLeadScoring';

interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role_title?: string;
}

type Row = LeadScoreRow & { contact: Contact | null };

interface Props {
  rows: Row[];
}

function TopLeadsTableInner({ rows }: Props) {
  if (rows.length === 0) {
    return <div className="text-sm text-muted-foreground py-6 text-center">Nenhum lead pontuado ainda. Recalcule para começar.</div>;
  }
  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contato</TableHead>
            <TableHead className="hidden md:table-cell">Cargo</TableHead>
            <TableHead className="text-right">Score</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead className="text-right hidden sm:table-cell">Δ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => {
            const c = r.contact;
            const name = c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.email || '—' : '—';
            const change = Number(r.score_change ?? 0);
            const Trend = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;
            const trendColor = change > 0 ? 'text-emerald-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground';
            return (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {c ? <Link to={`/contatos/${c.id}`} className="hover:underline">{name}</Link> : name}
                </TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{c?.role_title ?? '—'}</TableCell>
                <TableCell className="text-right font-mono">{Math.round(Number(r.total_score))}</TableCell>
                <TableCell><LeadGradeBadge grade={r.grade} size="sm" /></TableCell>
                <TableCell className={`text-right hidden sm:table-cell ${trendColor}`}>
                  <span className="inline-flex items-center gap-1 text-xs font-mono">
                    <Trend className="h-3 w-3" />
                    {change > 0 ? '+' : ''}{Math.round(change)}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export const TopLeadsTable = memo(TopLeadsTableInner);
