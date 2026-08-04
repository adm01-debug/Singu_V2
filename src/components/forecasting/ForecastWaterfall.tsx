import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ForecastWaterfall({ commit, bestCase, pipeline, won, quota }: { commit: number; bestCase: number; pipeline: number; won: number; quota: number }) {
  const data = [
    { name: "Won", value: won, fill: "hsl(var(--success))" },
    { name: "Commit", value: commit, fill: "hsl(var(--primary))" },
    { name: "Best Case", value: bestCase, fill: "hsl(var(--info))" },
    { name: "Pipeline", value: pipeline, fill: "hsl(var(--muted-foreground))" },
  ];
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Waterfall — Composição vs Quota</CardTitle></CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
            />
            {quota > 0 && <ReferenceLine y={quota} stroke="hsl(var(--destructive))" strokeDasharray="4 4" label={{ value: "Quota", fill: "hsl(var(--destructive))", fontSize: 11 }} />}
            <Bar dataKey="value" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
