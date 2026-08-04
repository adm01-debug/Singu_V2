---
name: Error Budget Dashboard
description: Painel admin /admin/error-budget com SLO 99.5%, sparkline diário 30d, alertas automáticos em 50/75/100% (system_alerts), cron de snapshot 5min e cleanup semanal >60d
type: feature
---
- Edge function `error-budget`: agrega `system_health_snapshots` da janela de 720h, retorna uptime%, downtime min, budget consumido%, série diária `daily_uptime[30]` e `active_alerts[]`
- Snapshot cron `system-health-snapshot-5min` (*/5 * * * *) grava em `system_health_snapshots` (admin-only RLS)
- Cleanup cron `system-health-snapshots-cleanup` (0 3 * * 0) chama `cleanup_old_health_snapshots()` → deleta snapshots >60d e alertas reconhecidos >90d
- Tabela `system_alerts` (admin-only): edge function insere idempotentemente em 50%/75%/100% do budget, dedup 24h por `alert_type`
- Severidades: 50% → warning, 75% → high, 100% → critical
- Página `src/pages/admin/ErrorBudget.tsx`: 4 stat cards + banner de alertas ativos + `UptimeSparkline` (Recharts AreaChart com linha SLO) + guia
- Componente `src/components/admin/UptimeSparkline.tsx` envolto em `AccessibleChart` (sr-only table)
- Hook `useErrorBudget` (refetch 5min) tipos: `DailyUptimePoint`, `ActiveErrorBudgetAlert`, `ErrorBudgetData`
- Rota: `/admin/error-budget` com `<Admin>` guard, item no `AdminSidebar` com ícone `Gauge`
- Documentado em `docs/RUNBOOK.md` v2.2.0 §Error Budget Policy (subseções "Alertas automáticos" e "Retenção e cleanup")
