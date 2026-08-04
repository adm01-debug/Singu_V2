---
name: RPC Plan Snapshots
description: Auto-EXPLAIN de RPCs degradadas em rpc_plan_snapshots, plan_changed materializado, cron 15min, diff visual em /admin/error-budget, exporter Prometheus e runbooks
type: feature
---
Rodadas 63–65/10.
- Tabela `rpc_plan_snapshots` (RLS admin-read, service_role write, retenção 30d).
- `capture_rpc_plan(rpc, reason)` SECURITY DEFINER com allowlist rígida (5 RPCs);
  EXPLAIN ANALYZE com fallback para EXPLAIN estimado (`reason` recebe `+estimated`).
- `capture_degraded_rpc_plans()` percorre `get_slow_rpc_trend` (is_degraded), cron `*/15`.
- Rodada 65: coluna `plan_changed` MATERIALIZADA via trigger BEFORE INSERT
  `set_rpc_plan_changed()` (compara com o hash anterior da mesma RPC) + backfill +
  índice parcial `idx_rpc_plan_snapshots_changed`. `get_rpc_plan_snapshots` deixou de
  usar `lag()` em runtime.
- `get_rpc_plan_change_counts(_hours)` agrega mudanças por RPC (exporter/monitoramento).
- Leitura/diff: `get_rpc_plan_diff(rpc)` + `src/lib/rpcPlanDiff.ts` + `RpcPlanDiffDialog`.
- Prometheus: `scripts/monitoring/rpc-plan-exporter.sh` (`rpc_plan_changed`,
  `rpc_plan_change_age_seconds`, `rpc_plan_snapshots_total`, `rpc_plan_window_hours`)
  e alertas `RpcPlanRegression`, `RpcPlanExporterMissing`, `RpcPlanChurn`.
- Runbooks: `rpc-plan-regression`, `rpc-plan-regression-diff`, `rpc-plan-exporter-missing`,
  `rpc-plan-churn`.
