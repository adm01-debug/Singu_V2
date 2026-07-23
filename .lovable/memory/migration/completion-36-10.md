---
name: Rodada 36/10 — Onda G Bucket B (lote 4)
description: Conversão DEFINER→INVOKER de compute_revops_kpis, compute_account_health e evaluate_mql; baseline linter 36→33 WARN.
type: feature
---
## Escopo
- `compute_revops_kpis(uuid, date, date)` — INVOKER + guard `auth.uid() = _user_id` mantido.
- `compute_account_health(uuid)` — INVOKER + guard `auth.uid() = _account.user_id` mantido.
- `evaluate_mql(uuid)` — INVOKER; adicionado guard explícito `auth.uid() IS NOT NULL`; leituras/gravações já usavam `auth.uid()`.

## Impacto
- Baseline backend linter: **36 → 33 WARN**.
- `scripts/check-backend-linter-baseline.mjs` atualizado (`BASELINE = 33`).
- Zero alteração de schema, contratos ou comportamento visível.

## Riscos mitigados
- RLS de `mql_classifications`, `deal_forecasts`, `forecast_periods`, `audit_log`, `cs_accounts`, `cs_health_signals`, `contacts`, `mql_criteria` passa a valer na sessão do caller — defesa em profundidade além dos guards de `auth.uid()` já existentes.
