import { StatCard, StatsRow } from "@/components/ui/stat-card";
import { Activity, Target, TrendingUp, Gauge, Percent, Trophy } from "lucide-react";
import type { RevOpsKPIs } from "@/hooks/useRevOps";

export function KPIComparisonGrid({ kpis, prev }: { kpis: RevOpsKPIs; prev?: RevOpsKPIs }) {
  const delta = (cur: number, p?: number) => {
    if (p == null || p === 0) return undefined;
    const d = ((cur - p) / p) * 100;
    return { change: `${d >= 0 ? "+" : ""}${d.toFixed(1)}% vs anterior`, type: d >= 0 ? "positive" as const : "negative" as const };
  };

  const winD = delta(kpis.win_rate, prev?.win_rate);
  const covD = delta(kpis.pipeline_coverage, prev?.pipeline_coverage);
  const mqlD = delta(kpis.mql_to_sql_rate, prev?.mql_to_sql_rate);
  const sqlD = delta(kpis.sql_to_won_rate, prev?.sql_to_won_rate);
  const attD = delta(kpis.quota_attainment, prev?.quota_attainment);

  return (
    <StatsRow className="lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Pipeline Coverage"
        value={`${kpis.pipeline_coverage.toFixed(2)}x`}
        icon={Gauge}
        gradientTone={kpis.pipeline_coverage >= 3 ? "success" : "warning"}
        change={covD?.change}
        changeType={covD?.type ?? "neutral"}
        subtitle="Meta: 3x quota"
        animate={false}
      />
      <StatCard
        title="Win Rate"
        value={`${kpis.win_rate.toFixed(1)}%`}
        icon={Trophy}
        gradientTone="primary"
        change={winD?.change}
        changeType={winD?.type ?? "neutral"}
        animate={false}
      />
      <StatCard
        title="Quota Attainment"
        value={`${kpis.quota_attainment.toFixed(1)}%`}
        icon={Target}
        gradientTone={kpis.quota_attainment >= 100 ? "success" : "warning"}
        change={attD?.change}
        changeType={attD?.type ?? "neutral"}
        animate={false}
      />
      <StatCard
        title="MQL → SQL"
        value={`${kpis.mql_to_sql_rate.toFixed(1)}%`}
        icon={Percent}
        gradientTone="primary"
        change={mqlD?.change}
        changeType={mqlD?.type ?? "neutral"}
        animate={false}
      />
      <StatCard
        title="SQL → Won"
        value={`${kpis.sql_to_won_rate.toFixed(1)}%`}
        icon={TrendingUp}
        gradientTone="primary"
        change={sqlD?.change}
        changeType={sqlD?.type ?? "neutral"}
        animate={false}
      />
      <StatCard
        title="Open Pipeline"
        value={`R$ ${(kpis.open_pipeline / 1000).toFixed(1)}k`}
        icon={Activity}
        gradientTone="primary"
        subtitle={`Quota: R$ ${(kpis.quota / 1000).toFixed(1)}k`}
        animate={false}
      />
    </StatsRow>
  );
}
