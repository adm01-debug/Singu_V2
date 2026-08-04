---
name: RevOps Dashboard
description: Dashboard de Revenue Operations com funil ponta-a-ponta, KPIs comparativos, benchmarks e alertas automáticos. Tabelas revops_snapshots, revops_benchmarks, revops_alerts. RPC compute_revops_kpis. Edge function revops-snapshot-builder (cron diário 04:00 UTC). UI /revops com tabs KPIs/Funil/Benchmarks.
type: feature
---

## Schema
- `revops_snapshots` — period (date), funnel_stage (visitor/lead/mql/sql/opportunity/customer), count, conversion_rate, avg_velocity_days, total_value. Unique(user_id, period, funnel_stage)
- `revops_benchmarks` — metric_key, target_value, warning_threshold, critical_threshold. Unique(user_id, metric_key)
- `revops_alerts` — metric_key, severity (info/warning/critical), message, current/expected_value, dismissed
- RPC `compute_revops_kpis(_user_id, _period_start, _period_end)` — retorna jsonb com mql/sql/opp/won counts, win_rate, pipeline_coverage, mql_to_sql_rate, sql_to_won_rate, quota_attainment
- RPC `dismiss_revops_alert(_alert_id)`

## Edge Function
- `revops-snapshot-builder` (cron 04:00 UTC diário): para cada usuário ativo (com mql_classifications ou deal_forecasts), consolida contagens por estágio nos últimos 30d, upsert em revops_snapshots, compara conversion_rate vs 7d anteriores e gera alertas warning (-15%) ou critical (-30%)

## Hooks
`src/hooks/useRevOps.ts` — useRevOpsSnapshots, useRevOpsKPIs, useRevOpsBenchmarks, useUpsertBenchmark, useRevOpsAlerts, useDismissAlert, useTriggerRevOpsSnapshot

## UI
- `/revops` — RevOpsAlertList no topo + tabs (KPIs com KPIComparisonGrid, Funil com RevenueFunnelChart, Benchmarks com BenchmarkConfigForm)
- Componentes em `src/components/revops/`: RevenueFunnelChart, KPIComparisonGrid, BenchmarkConfigForm, RevOpsAlertList, RevOpsPeriodSelector

## Navegação
Sidebar "RevOps" (ícone Activity) abaixo de Forecasting
