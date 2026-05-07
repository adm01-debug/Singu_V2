import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRevOpsBenchmarks, useUpsertBenchmark } from "@/hooks/useRevOps";
import { Skeleton } from "@/components/ui/skeleton";

const METRICS = [
  { key: "win_rate", label: "Win Rate (%)", default: 30 },
  { key: "pipeline_coverage", label: "Pipeline Coverage (x quota)", default: 3 },
  { key: "mql_to_sql_rate", label: "Conversão MQL → SQL (%)", default: 40 },
  { key: "sql_to_won_rate", label: "Conversão SQL → Won (%)", default: 25 },
  { key: "quota_attainment", label: "Atingimento de Quota (%)", default: 100 },
  { key: "avg_cycle_days", label: "Ciclo Médio (dias)", default: 45 },
];

export function BenchmarkConfigForm() {
  const { data: benchmarks, isLoading } = useRevOpsBenchmarks();
  const upsert = useUpsertBenchmark();
  const [edits, setEdits] = useState<Record<string, { target: string; warn: string; crit: string }>>({});

  const getValue = (key: string, field: "target" | "warn" | "crit") => {
    if (edits[key]?.[field] != null) return edits[key][field];
    const b = benchmarks?.find(x => x.metric_key === key);
    if (!b) {
      const m = METRICS.find(m => m.key === key);
      return field === "target" ? String(m?.default ?? 0) : field === "warn" ? "90" : "75";
    }
    return field === "target" ? String(b.target_value) : field === "warn" ? String(b.warning_threshold) : String(b.critical_threshold);
  };

  const setVal = (key: string, field: "target" | "warn" | "crit", v: string) => {
    setEdits(prev => {
      const current = prev[key] || {
        target: getValue(key, "target"),
        warn: getValue(key, "warn"),
        crit: getValue(key, "crit"),
      };
      return {
        ...prev,
        [key]: { ...current, [field]: v },
      };
    });
  };

  const save = (key: string) => {
    upsert.mutate({
      metric_key: key,
      target_value: parseFloat(getValue(key, "target")) || 0,
      warning_threshold: parseFloat(getValue(key, "warn")) || 90,
      critical_threshold: parseFloat(getValue(key, "crit")) || 75,
    });
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Benchmarks de Métricas</CardTitle>
        <CardDescription>Defina metas, limite de aviso (warning) e limite crítico para cada KPI.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {METRICS.map(m => (
          <div key={m.key} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end p-3 rounded-lg border border-border">
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">{m.label}</Label>
              <p className="text-xs text-muted-foreground/70 mt-1">Métrica: <code>{m.key}</code></p>
            </div>
            <div>
              <Label className="text-[10px] uppercase">Meta</Label>
              <Input type="number" step="0.01" value={getValue(m.key, "target")} onChange={e => setVal(m.key, "target", e.target.value)} />
            </div>
            <div>
              <Label className="text-[10px] uppercase">Warning %</Label>
              <Input type="number" step="0.01" value={getValue(m.key, "warn")} onChange={e => setVal(m.key, "warn", e.target.value)} />
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-[10px] uppercase">Crítico %</Label>
                <Input type="number" step="0.01" value={getValue(m.key, "crit")} onChange={e => setVal(m.key, "crit", e.target.value)} />
              </div>
              <Button size="sm" onClick={() => save(m.key)} disabled={upsert.isPending}>Salvar</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
