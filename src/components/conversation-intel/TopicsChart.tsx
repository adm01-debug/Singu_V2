import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CATEGORY_COLORS: Record<string, string> = {
  pricing: "hsl(38, 92%, 50%)",
  product: "hsl(199, 89%, 48%)",
  competition: "hsl(0, 84%, 60%)",
  objection: "hsl(25, 95%, 53%)",
  closing: "hsl(142, 76%, 36%)",
  discovery: "hsl(262, 83%, 58%)",
  other: "hsl(215, 16%, 47%)",
};

export function TopicsChart({ topics }: { topics: Array<{ label: string; category: string; mentions: number }> }) {
  if (!topics?.length) return <p className="text-xs text-muted-foreground">Nenhum tópico detectado.</p>;
  const byCategory = topics.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.mentions;
    return acc;
  }, {});
  const data = Object.entries(byCategory).map(([name, value]) => ({ name, value }));
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={2}>
            {data.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name] ?? CATEGORY_COLORS.other} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
