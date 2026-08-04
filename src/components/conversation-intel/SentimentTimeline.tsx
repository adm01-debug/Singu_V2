import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  timeline: Array<{ position_pct: number; sentiment: string; note?: string }>;
}

const sentimentToValue = (s: string) => s === "positive" ? 1 : s === "negative" ? -1 : 0;

export function SentimentTimeline({ timeline }: Props) {
  if (!timeline?.length) {
    return <p className="text-xs text-muted-foreground">Sem timeline disponível.</p>;
  }
  const data = timeline
    .slice()
    .sort((a, b) => a.position_pct - b.position_pct)
    .map((p) => ({ pos: Math.round(p.position_pct), value: sentimentToValue(p.sentiment), note: p.note ?? p.sentiment }));

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.6} />
              <stop offset="50%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.2} />
              <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <XAxis dataKey="pos" tickFormatter={(v) => `${v}%`} fontSize={10} stroke="hsl(var(--muted-foreground))" />
          <YAxis domain={[-1.2, 1.2]} ticks={[-1, 0, 1]} fontSize={10} stroke="hsl(var(--muted-foreground))"
            tickFormatter={(v) => v === 1 ? "+" : v === -1 ? "−" : "·"} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
            formatter={(value: number, _: string, p) => [p.payload.note, `Pos ${p.payload.pos}%`]}
            labelFormatter={() => ""}
          />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#sentGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
