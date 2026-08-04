import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { BarChart3, TrendingUp, Database } from "lucide-react";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  severity: string;
  created_at: string;
}

interface TelemetryChartsProps {
  rows: TelemetryRow[];
  timeFilter: string;
}

function getBucketMs(timeFilter: string): number {
  switch (timeFilter) {
    case "1h": return 5 * 60 * 1000;      // 5 min
    case "6h": return 30 * 60 * 1000;     // 30 min
    case "24h": return 60 * 60 * 1000;    // 1 hora
    default: return 6 * 60 * 60 * 1000;   // 6 horas (7d)
  }
}

function formatBucketTime(ts: number, timeFilter: string): string {
  const d = new Date(ts);
  if (timeFilter === "7d" || timeFilter === "custom") {
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  // ── Chart 1: Alertas ao Longo do Tempo (AreaChart empilhado) ──
  const timelineData = useMemo(() => {
    if (!rows.length) return [];
    const bucketMs = getBucketMs(timeFilter);
    const buckets = new Map<number, { ts: number; muitoLentas: number; lentas: number; erros: number }>();

    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      const key = Math.floor(t / bucketMs) * bucketMs;
      if (!buckets.has(key)) buckets.set(key, { ts: key, muitoLentas: 0, lentas: 0, erros: 0 });
      const b = buckets.get(key)!;
      if (r.severity === "very_slow") b.muitoLentas++;
      else if (r.severity === "slow") b.lentas++;
      else if (r.severity === "error") b.erros++;
    }

    return [...buckets.values()].sort((a, b) => a.ts - b.ts);
  }, [rows, timeFilter]);

  // ── Chart 2: Duração Média / Máxima (AreaChart) ──
  const durationData = useMemo(() => {
    if (!rows.length) return [];
    const bucketMs = getBucketMs(timeFilter);
    const buckets = new Map<number, { ts: number; totalMs: number; maxMs: number; count: number }>();

    for (const r of rows) {
      const t = new Date(r.created_at).getTime();
      const key = Math.floor(t / bucketMs) * bucketMs;
      if (!buckets.has(key)) buckets.set(key, { ts: key, totalMs: 0, maxMs: 0, count: 0 });
      const b = buckets.get(key)!;
      b.totalMs += r.duration_ms;
      b.maxMs = Math.max(b.maxMs, r.duration_ms);
      b.count++;
    }

    return [...buckets.values()]
      .sort((a, b) => a.ts - b.ts)
      .map(b => ({
        ts: b.ts,
        mediaMs: Math.round(b.totalMs / b.count),
        maxMs: b.maxMs,
      }));
  }, [rows, timeFilter]);

  // ── Chart 3: Alertas por Tabela (BarChart horizontal) ──
  const tableData = useMemo(() => {
    if (!rows.length) return [];
    const counts = new Map<string, number>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));
  }, [rows]);

  if (!rows.length) return null;

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 12,
  };

  const BAR_COLORS = [
    "hsl(var(--destructive))",
    "hsl(var(--primary))",
    "hsl(45 93% 47%)",
    "hsl(var(--muted-foreground))",
    "hsl(200 80% 50%)",
    "hsl(280 60% 55%)",
    "hsl(160 60% 45%)",
    "hsl(20 80% 55%)",
  ];

  return (
    <div className="space-y-4">
      {/* Row 1: Alertas ao Longo do Tempo + Duração Média/Máxima */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Alertas ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v) => formatBucketTime(v, timeFilter)}
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                />
                <YAxis tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => formatBucketTime(v as number, timeFilter)}
                  contentStyle={tooltipStyle}
                />
                <Area type="monotone" dataKey="muitoLentas" name="Muito Lentas" stackId="1"
                  fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="lentas" name="Lentas" stackId="1"
                  fill="hsl(45 93% 47%)" stroke="hsl(45 93% 47%)" fillOpacity={0.6} />
                <Area type="monotone" dataKey="erros" name="Erros" stackId="1"
                  fill="hsl(0 84% 60%)" stroke="hsl(0 84% 60%)" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Duração Média / Máxima
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={durationData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis
                  dataKey="ts"
                  tickFormatter={(v) => formatBucketTime(v, timeFilter)}
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  className="fill-muted-foreground"
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}s` : `${v}ms`}
                />
                <Tooltip
                  labelFormatter={(v) => formatBucketTime(v as number, timeFilter)}
                  formatter={(value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}s` : `${value}ms`}
                  contentStyle={tooltipStyle}
                />
                <Area type="monotone" dataKey="maxMs" name="Máxima"
                  fill="hsl(var(--destructive))" stroke="hsl(var(--destructive))" fillOpacity={0.2} />
                <Area type="monotone" dataKey="mediaMs" name="Média"
                  fill="hsl(var(--primary))" stroke="hsl(var(--primary))" fillOpacity={0.4} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Alertas por Tabela */}
      {tableData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Alertas por Tabela/RPC
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={Math.max(160, tableData.length * 32)}>
              <BarChart data={tableData} layout="vertical" margin={{ left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                <XAxis type="number" tick={{ fontSize: 10 }} className="fill-muted-foreground" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  width={75}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Alertas" radius={[0, 4, 4, 0]}>
                  {tableData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
