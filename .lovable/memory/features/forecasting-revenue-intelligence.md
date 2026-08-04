---
name: Forecasting & Revenue Intelligence
description: Sistema de previsão de receita com IA, categorização commit/best_case/pipeline, health score, snapshots históricos e narrativa executiva. Tabelas forecast_periods, deal_forecasts, forecast_snapshots, forecast_categories_history, forecast_quota_settings. Edge functions forecast-analyzer (IA categorization), forecast-snapshot-cron (snapshots diários), forecast-narrative (executive summary). UI em /forecasting com KPIs, waterfall chart, kanban por categoria, trending, risk table e setup em /forecasting/setup.
type: feature
---

## Schema
- `forecast_periods` — período (month/quarter), quota_amount, actual_won_amount, status
- `deal_forecasts` — categoria (commit/best_case/pipeline/omitted), confidence_score, health_score, risk_factors, ai_rationale. Unique(deal_id, period_id)
- `forecast_snapshots` — snapshots diários (commit/best/pipeline/weighted totals)
- `forecast_categories_history` — log automático de mudanças via trigger
- `forecast_quota_settings` — quotas padrão + pesos do health score (activity/stage_age/engagement/relationship)
- RPC `seed_forecast_period(_user_id, _type)` cria período current
- Audit em deal_forecasts

## Edge Functions
- `forecast-analyzer` — recebe deals, calcula health_score local, IA (gemini-3-flash-preview com tool calling) sugere categoria + confidence + riscos, upsert
- `forecast-snapshot-cron` — protegido por CRON_SECRET, gera snapshots diários
- `forecast-narrative` — narrativa executiva via IA

## UI
- `/forecasting` — KPIs (commit/best/attainment/gap), waterfall, kanban categorias, trending, risk table, narrativa IA
- `/forecasting/setup` — quotas + pesos health + thresholds
- Componentes em `src/components/forecasting/`: CategoryBadge, HealthScoreIndicator, QuotaProgressBar, ForecastWaterfall, AccuracyChart, RiskDealsTable, ForecastNarrativeCard, PeriodSelector, CategoryColumn

## Hooks
`src/hooks/useForecasting.ts` — useForecastPeriods, useCurrentPeriod, useCreatePeriod, useClosePeriod, useDealForecasts, useUpdateDealForecast, useAnalyzeForecast, useForecastSnapshots, useForecastSummary, useForecastNarrative, useQuotaSettings, useUpsertQuotaSettings

## Navegação
Sidebar "Forecasting" (ícone LineChart) abaixo de Conversation Intel
