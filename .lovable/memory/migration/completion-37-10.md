---
name: Rodada 37/10 — Onda G Bucket B (lote 5)
description: Conversão DEFINER→INVOKER de dismiss_revops_alert, compute_attribution, enroll_contact_in_workflow e get_connection_metrics; baseline linter 33→29 WARN.
type: feature
---
## Escopo
- `dismiss_revops_alert(uuid)` — INVOKER; RLS de `revops_alerts` (owner-only) aplica no caller.
- `compute_attribution(text, text, numeric)` — INVOKER; leituras/gravações em `attribution_touchpoints` e `attribution_models_cache` filtradas por `auth.uid()`; RLS owner-only nas duas tabelas.
- `enroll_contact_in_workflow(uuid, uuid)` — INVOKER + novo guard `auth.uid() IS NOT NULL`; RLS de `nurturing_executions` e `nurturing_workflows` valida ownership do workflow no UPDATE de `enrolled_count`.
- `get_connection_metrics(uuid)` — INVOKER; check `has_role(auth.uid(), 'admin')` preservado; `connection_test_logs` restrito a admin via RLS.

## Impacto
- Baseline backend linter: **33 → 29 WARN**.
- `scripts/check-backend-linter-baseline.mjs` atualizado (`BASELINE = 29`).
- Zero alteração de schema, contratos ou comportamento visível.

## Riscos mitigados
- Defesa em profundidade: além dos guards de `auth.uid()`/`has_role`, agora a RLS das tabelas envolvidas é avaliada na sessão do caller, eliminando qualquer bypass acidental via DEFINER.