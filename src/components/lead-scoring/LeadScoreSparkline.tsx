import { memo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { LeadScoreHistoryRow } from '@/hooks/useLeadScoring';

interface Props {
  history: LeadScoreHistoryRow[];
  height?: number;
}

function LeadScoreSparklineInner({ history, height = 80 }: Props) {
  if (!history.length) {
    return <div className="text-xs text-muted-foreground py-3 text-center">Sem histórico ainda</div>;
  }
  const data = history.map(h => ({
    t: new Date(h.recorded_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    score: Number(h.total_score),
  }));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis dataKey="t" tick={{ fontSize: 9 }} interval="preserveStartEnd" />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', fontSize: 11 }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
        />
        <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export const LeadScoreSparkline = memo(LeadScoreSparklineInner);
