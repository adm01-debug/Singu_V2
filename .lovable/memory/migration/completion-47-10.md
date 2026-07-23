---
name: Rodada 47/10 — Least Privilege para FUNCTIONS
description: Revoga EXECUTE de 4 trigger functions e 6 utilitários de infra do papel authenticated/anon; mantém apenas service_role.
type: feature
---

## Contexto
Após Rodada 46/10 (least privilege em tabelas para authenticated), auditoria via
`has_function_privilege` mostrou 43 funções de `public.*` executáveis por
`authenticated`. Dentre elas, 4 eram trigger functions (chamadas apenas pelo
próprio Postgres em triggers) e 6 eram utilitários administrativos
(cleanup/queue/reset/attribution) que só deveriam rodar via edge functions com
service_role ou pg_cron.

## Ações
- REVOKE EXECUTE de `tg_set_updated_at`, `touch_system_config`,
  `update_bpr_queue_updated_at`, `validate_entity_relationship` para
  anon/authenticated/PUBLIC. Triggers continuam funcionando (owner do trigger).
- REVOKE EXECUTE de `cleanup_behavioral_regen_queue`, `execute_readonly_query`,
  `increment_webhook_quota`, `publish_mtta_sla_breach_alert`,
  `reset_daily_lead_counts`, `compute_attribution` para anon/authenticated.
- GRANT EXECUTE ... TO service_role reafirmado em todas (defesa em profundidade).
- Novo teste `tests/rls/functions_least_privilege.sql` valida o invariante.

## Verificação
- Baseline do backend linter mantido em **12 WARN** (piso arquitetural).
- Query de validação retorna 0 funções expostas indevidamente.

## Débito remanescente
- 33 funções ainda expostas a `authenticated` (search_*, get_contact_*_gaps,
  compute_*, has_role, etc.) são usos legítimos do frontend — não devem ser
  revogadas. Rastreado no baseline do linter.
- Endpoints públicos (buyer_*, submit_public_form, track_magnet_download,
  increment_*) permanecem callable por anon — comportamento intencional dos
  Deal Rooms / Landing Pages.