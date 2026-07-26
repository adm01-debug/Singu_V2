---
name: RPC Plan Snapshots
description: Auto-EXPLAIN de RPCs degradadas em rpc_plan_snapshots, cron 15min, card no /admin/error-budget e runbook rpc-plan-regression
type: feature
---
Rodada 63/10.
- Tabela `rpc_plan_snapshots` (RLS admin-read, service_role write, retenção 30d).
- `capture_rpc_plan(rpc, reason)` SECURITY DEFINER com allowlist rígida (5 RPCs); tenta
  EXPLAIN ANALYZE e cai para EXPLAIN estimado (`reason` recebe sufixo `+estimated`).
- `capture_degraded_rpc_plans()` percorre `get_slow_rpc_trend` (is_degraded), cron `*/15`.
- Leitura: `get_rpc_plan_snapshots(rpc, limit)` SECURITY INVOKER + `plan_changed` via lag(hash).
- UI: `RpcPlanSnapshotsCard.tsx` + hook `useRpcPlanSnapshots.ts` em `/admin/error-budget`.
