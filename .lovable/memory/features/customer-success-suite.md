---
name: Customer Success Suite
description: Módulo de gestão pós-venda com health score, NPS, QBRs e pipeline de renovações. Hub /customer-success + detalhe por account.
type: feature
---
Suite completa de Customer Success para gestão pós-venda do CRM.

**Tabelas:**
- `cs_accounts` — contas com tier (strategic/enterprise/mid/smb), ARR, contract_start, renewal_date, lifecycle_stage, health_score (0-100), health_trend
- `cs_health_signals` — sinais ponderados (usage/support/engagement/sentiment/payment/nps) com decay temporal
- `cs_nps_responses` — respostas NPS classificadas (promoter/passive/detractor) — também gera health_signal automaticamente
- `cs_qbrs` — Quarterly Business Reviews com agenda/outcomes/next_steps em jsonb
- `cs_renewals` — pipeline de renovações com status (upcoming/in_negotiation/renewed/churned/downgraded/expanded) e risk_level

**RPCs:**
- `compute_account_health(_account_id)` — agrega signals dos últimos 90d com decay exponencial (meia-vida ~31d), atualiza health_score e auto-promove para 'at_risk' se score < 40
- `cs_renewal_pipeline(_user_id, _days_ahead)` — retorna renovações próximas com totais e at_risk count

**Edge Function:**
- `cs-health-recalc` (cron 05:00 UTC) — recalcula todas as contas, gera alerts em queda >20pts ou score <40

**Hooks:** `useCSAccounts`, `useCSAccount`, `useUpsertCSAccount`, `useRecalcAccountHealth`, `useHealthSignals`, `useRecordSignal`, `useNPS`, `useSubmitNPS`, `useQBRs`, `useUpsertQBR`, `useRenewals`, `useUpdateRenewal` em `src/hooks/useCustomerSuccess.ts`

**Páginas:** `/customer-success` (hub com tabs Portfolio/Renovações/NPS/QBRs) e `/customer-success/account/:id` (detalhe com gauge, signals timeline, QBRs e NPS por conta)

**Componentes** em `src/components/customer-success/`: `HealthScoreGauge` (SVG ring), `AccountPortfolioCard`, `RenewalPipelineList`, `NPSDistributionChart`, `NPSResponseDialog`, `QBRTimeline`, `HealthSignalTimeline`, `CreateAccountDialog`

**Sidebar:** "Customer Success" (ícone Heart) abaixo de RevOps em "Operacional".

**Não duplicado:** churn-risk-detection, csat_surveys (módulo NPS/CSAT pré-existente em /nps), help desk — CS Suite consome desses como signals.
