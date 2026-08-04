import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ForecastSnapshot } from "@/hooks/useForecasting";

export function AccuracyChart({ snapshots }: { snapshots: ForecastSnapshot[] }) {
  const data = snapshots.map(s => ({
    date: new Date(s.snapshot_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    Commit: Number(s.commit_total),
    "Best Case": Number(s.best_case_total),
    Weighted: Number(s.weighted_total),
  }));

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Trending — Evolução do Forecast</CardTitle></CardHeader>
      <CardContent className="h-72">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem snapshots ainda — gerados diariamente</div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Commit" stroke="hsl(var(--primary))" strokeWidth={2} />
              <Line type="monotone" dataKey="Best Case" stroke="hsl(var(--info))" strokeWidth={2} />
              <Line type="monotone" dataKey="Weighted" stroke="hsl(var(--success))" strokeWidth={2} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
