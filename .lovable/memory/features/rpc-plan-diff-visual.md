---
name: RPC Plan Diff Visual
description: Diff lado a lado dos dois últimos planos de execução por RPC em /admin/error-budget + alerta RpcPlanRegression
type: feature
---
Rodada 64/10.
- RPC `get_rpc_plan_diff(_rpc_name)` (SECURITY INVOKER) devolve slots `current`/`previous` com o `plan` jsonb.
- `src/lib/rpcPlanDiff.ts`: flatten da árvore EXPLAIN por caminho ("0.1"), diff por assinatura
  `NodeType::Relation`, `hasScanRegression()` sinaliza Index Scan → Seq Scan. Coberto por Vitest.
- UI: `RpcPlanDiffDialog.tsx` aberto ao clicar numa linha do `RpcPlanSnapshotsCard`.
- Alerta Prometheus `RpcPlanRegression` + runbook `#rpc-plan-regression-diff`.
