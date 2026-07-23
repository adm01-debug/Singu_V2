---
name: Rodada 38/10 — Onda G Bucket B (lote 6)
description: DEFINER→INVOKER em increment_webhook_quota, move_deal_atomic (2 overloads), publish_mtta_sla_breach_alert, reset_daily_lead_counts; baseline linter 29→24 WARN.
type: feature
---
## Escopo
- `increment_webhook_quota(uuid)` — chamado por `incoming-webhook` com service_role; INVOKER + RLS de `connection_quotas` (admin ou owner do webhook).
- `move_deal_atomic(uuid, text, integer|numeric)` — chamado por `usePipeline`; RLS owner-only em `deals`.
- `publish_mtta_sla_breach_alert(int, int)` — admin-only; adicionada policy `Admins can insert system alerts` em `system_alerts`.
- `reset_daily_lead_counts()` — chamado por `lead-routing` (cron) com service_role.

## Impacto
- Baseline backend linter: **29 → 24 WARN**.
- `scripts/check-backend-linter-baseline.mjs` atualizado (`BASELINE = 24`).
- Nova policy em `system_alerts` (INSERT admin) — pré-requisito para INVOKER.

## Riscos mitigados
- RLS de `deals`, `connection_quotas`, `sales_team_members` e `system_alerts` agora vale na sessão do caller. Bypass DEFINER eliminado.