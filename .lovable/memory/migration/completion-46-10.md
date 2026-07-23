---
name: Rodada 46/10 — Least Privilege for authenticated
description: Sweep de REVOKE em authenticated retirando TRUNCATE/REFERENCES/TRIGGER/MAINTAIN globalmente e CRUD em 50+ tabelas service-role-only (cron_secrets, logs de auditoria, filas internas, webhooks, sessão/auth, snapshots).
type: feature
---

## Contexto
Após a Rodada 45/10 (anon reduzido a 12 tabelas), auditoria via `pg_class.relacl`
mostrou que `authenticated` mantinha `DELETE,INSERT,MAINTAIN,REFERENCES,SELECT,
TRIGGER,TRUNCATE,UPDATE` em TODAS as 250+ tabelas de `public.*`, herdado do
template Supabase. RLS bloqueava o acesso efetivo em tabelas sensíveis, mas
privilégios como `TRUNCATE` e `REFERENCES` são bypassáveis via `ON DELETE CASCADE`
ou operações administrativas — superfície inaceitável para produção.

## Ações
- **Sweep global**: `REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE
  public.<t> FROM authenticated` para toda tabela de `public.*`.
- **Service-role-only** (50+ tabelas): `REVOKE ALL FROM authenticated` em:
  - Segredos: `cron_secrets`.
  - Auditoria e logs: `audit_log` + partições, `access_blocked_log`,
    `ai_recommendation_*`, `crm_*_audit_logs`, `error_logs`, `*_audit`,
    `notification_logs`, `psychographic_audit_log`, `secret_rotation_log`,
    `social_consent_audit`.
  - Filas: `behavioral_profile_regen_queue`, `crm_automation_reprocess_queue`,
    `lead_score_recompute_queue`, `social_sync_queue`, `validation_queue`.
  - Webhooks: `incoming_webhook_logs`, `incoming_webhook_dlq`,
    `incoming_webhooks`, `whatsapp_ingestion_logs`.
  - Sessão/auth: `login_attempts`, `device_login_notifications`,
    `user_known_devices`, `webauthn_credentials`, `password_reset_requests`.
  - Sistema: `system_alerts`, `system_config`, `system_health_snapshots`,
    `schema_drift_alerts`, `query_telemetry`, `connection_test_logs`,
    `connection_anomalies`.
  - Histórico backend: `lead_score_history`, `lead_score_threshold_log`,
    `score_history`, `rfm_history`, `life_events_history`,
    `forecast_categories_history`, `pipeline_stage_transitions`.
  - Envios: `sequence_send_log`, `sequence_events`, `nurturing_executions`,
    `attribution_touchpoints`, `attribution_models_cache`.
- `GRANT ALL ... TO service_role` reafirmado em toda `public.*` (defesa em
  profundidade — garante que edge functions com service_role não quebrem).

## Verificação
- Novo teste automatizado: `tests/rls/authenticated_least_privilege.sql`.
- Baseline do backend linter mantém-se em **12 WARN** (piso arquitetural).

## Débito remanescente
- Herança do template: novas tabelas ainda nascem com grants amplos para
  `authenticated` (mesma raiz do débito de anon na Rodada 45/10). O teste
  automatizado detecta drift e falha no CI.
- Migração runbook para `ALTER DEFAULT PRIVILEGES ... IN SCHEMA public REVOKE
  ALL ON TABLES FROM authenticated` (requer `supabase_admin`).