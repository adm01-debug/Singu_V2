---
name: lead-score-threshold-automations
description: Automações reativas a mudanças de grade/score do Lead Scoring (notify, create_task, enroll_sequence, webhook, tag) com cooldown, log de disparos, wizard 3 passos, templates prontos e ponte sequence_events→intent_signals.
type: feature
---
# Lead Score Threshold Automations + Behavioral Bridge

## Schema
- `lead_score_threshold_automations` — `name, description, trigger_type ('grade_reached'|'grade_dropped'|'score_above'|'score_below'), grade_target, score_target, action_type ('notify'|'create_task'|'enroll_sequence'|'webhook'|'tag'), action_config jsonb, cooldown_hours, active, last_fired_at, fired_count`. RLS por user_id, audit trigger.
- `lead_score_threshold_log` — auditoria + base de cooldown (`from/to_grade`, `from/to_score`, `action_result`, `success`).
- `seed_lead_score_defaults` estendido com regras de engagement vindas de sequência: `email_open=2/14d`, `email_click=5/14d`, `email_reply=12/30d`, `sequence_completed=8/30d`.
- Trigger `tg_sequence_events_to_intent` (AFTER INSERT em sequence_events) → mapeia event_type para intent_signal correspondente, peso por tipo (reply=3, click=2, completed=2, open=1). Fail-safe: nunca quebra a inserção do evento.

## Edge Function
- `lead-score-threshold-runner` (POST, accepts user JWT or service role) — payload `{user_id, contact_id, from_grade, to_grade, from_score, to_score}`. Avalia automações ativas, respeita cooldown, executa ação e grava log.
  - `notify`/`create_task` → insere em `alerts` (type=lead_score_threshold/task)
  - `enroll_sequence` → insere em `sequence_enrollments` (skip se já ativo)
  - `webhook` → POST com timeout 5s, header opcional `X-Webhook-Secret`
  - `tag` → adiciona ao array tags do contato (skip se já existe)
- `lead-scorer` (estendido) — após upsert do score, se grade mudou OU `floor(score/10)` cruzou, invoca o runner.

## Hooks `src/hooks/useScoreAutomations.ts`
useScoreAutomations, useUpsertAutomation, useToggleAutomation, useDeleteAutomation, useAutomationLog(automationId?, days).

## UI
- `/lead-scoring/automations` — Tabs Ativas/Todas/Templates/Histórico.
- Componentes em `src/components/lead-scoring/`: AutomationCard (toggle/edit/delete), AutomationWizard (3 passos: gatilho → ação → cooldown+nome), AutomationTemplatesGrid (4 templates: A→notify, drop A→task, score≥80→sequência VIP, score≥70→tag hot), AutomationLogTable, automation-templates.ts.
- Botão "Automações" adicionado no header de `/lead-scoring`.

## Navegação
Rota `/lead-scoring/automations` em App.tsx. Voltar para `/lead-scoring` no header.

## Coexistência
Trigger `tg_intent_signals_enqueue_score` permanece ativo. Eventos de sequência agora também alimentam intent_signals automaticamente, recalculando score sem código aplicativo extra.
