---
name: lead-scoring-server-side
description: Lead Scoring server-side com decay temporal exponencial, regras configuráveis por dimensão/sinal, thresholds A/B/C/D, fila de recálculo automática via trigger em intent_signals, edge functions lead-scorer (single+batch) e lead-score-cron, hub /lead-scoring + config /lead-scoring/config.
type: feature
---
# Lead Scoring Server-Side

## Schema
- `lead_scores` estendida com `computed_at`, `decay_applied_at`; aceita grades A/B/C/D além das antigas (cold/warm/hot/on_fire) durante coexistência.
- `lead_score_history` ganhou `breakdown JSONB` para snapshots ricos.
- `lead_score_rules` (NOVA): pesos+decay_days por dimensão (fit/engagement/intent/relationship) e signal_key.
- `lead_score_thresholds` (NOVA): grades A≥80, B≥60, C≥40, D≥0 por usuário (configurável).
- `lead_score_recompute_queue` (NOVA): fila alimentada por trigger.
- Função `seed_lead_score_defaults(_user_id)`: cria regras+thresholds default.
- Trigger `tg_intent_signals_enqueue_score` em `intent_signals` AFTER INSERT.

## Edge Functions
- `lead-scorer` — modo single `{ contact_id }` ou batch `{ batch: true, limit }`. Decay exponencial (half-life = decay_days). Snapshot histórico quando muda grade ou ±10pts. Service role + JWT validation + rate limit 60/min.
- `lead-score-cron` — varre interactions últimos 60d e enfileira (header x-cron-secret).

## Hooks (`src/hooks/useLeadScoring.ts`)
useLeadScore, useTopLeads(grade?), useLeadScoreDistribution, useLeadScoreHistory, useRecomputeLead, useRecomputeAllLeads, useScoreRules, useUpdateRule, useScoreThresholds, useUpdateThreshold.

## UI
- `/lead-scoring`: 4 KPIs + tabs grade + TopLeadsTable + ScoreDistributionChart (pie).
- `/lead-scoring/config`: ScoreRulesEditor (peso/decay/ativa por sinal) + ThresholdsEditor.
- Componentes em `src/components/lead-scoring/`: LeadGradeBadge, LeadScoreBreakdown (radar), LeadScoreSparkline, TopLeadsTable, ScoreDistributionChart, ScoreRulesEditor, ThresholdsEditor, LeadScoreCard (widget para ContatoDetalhe).

## Navegação
Sidebar: "Lead Scoring" (ícone Gauge) abaixo de Intent Data em Operacional.

## Coexistência
Hook client-side antigo (`useLeadScore`) e LeadScoreCard antigo permanecem como fallback offline. Novo sistema lê grades A/B/C/D; check constraint aceita ambos schemes.
