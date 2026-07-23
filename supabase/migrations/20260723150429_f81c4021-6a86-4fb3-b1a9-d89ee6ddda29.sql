
-- Rodada 46/10 — Least Privilege para o papel `authenticated`.
-- Etapa 1: Sweep global — remove TRUNCATE/REFERENCES/TRIGGER/MAINTAIN de authenticated em toda public.*
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON TABLE public.%I FROM authenticated', r.relname);
  END LOOP;
END $$;

-- Etapa 2: Service-role-only — REVOKE ALL de authenticated em tabelas de infraestrutura.
-- Essas tabelas só devem ser escritas/lidas via edge functions com service_role.
DO $$
DECLARE
  t TEXT;
  service_only TEXT[] := ARRAY[
    -- Segredos e configuração crítica
    'cron_secrets',
    -- Auditoria e logs (append-only por triggers ou edge functions)
    'audit_log',
    'audit_log_default',
    'audit_log_2026_07','audit_log_2026_08','audit_log_2026_09',
    'audit_log_2026_10','audit_log_2026_11','audit_log_2026_12',
    'access_blocked_log',
    'access_security_settings',
    'ai_recommendation_audit_logs',
    'ai_recommendation_audit_logs_v2',
    'ai_recommendation_logs',
    'automation_logs',
    'contact_cadence_audit',
    'contact_preferences_audit',
    'contact_relatives_audit',
    'contact_time_analysis_audit',
    'crm_automation_logs',
    'crm_consent_audit_logs',
    'crm_relationship_audit_logs',
    'disc_analysis_history_audit',
    'error_logs',
    'interactions_audit',
    'life_events_history',
    'notification_logs',
    'playbook_usage_log',
    'psychographic_audit_log',
    'redistribution_log',
    'reframing_analysis_audit',
    'secret_rotation_log',
    'social_consent_audit',
    -- Filas internas e reprocessamento (só backend processa)
    'behavioral_profile_regen_queue',
    'crm_automation_reprocess_queue',
    'lead_score_recompute_queue',
    'social_sync_queue',
    'validation_queue',
    -- Webhooks e ingestão (edge functions)
    'incoming_webhook_logs',
    'incoming_webhook_dlq',
    'incoming_webhooks',
    'whatsapp_ingestion_logs',
    -- Segurança de sessão / auth
    'login_attempts',
    'device_login_notifications',
    'user_known_devices',
    'webauthn_credentials',
    'password_reset_requests',
    -- Snapshots e telemetria de sistema
    'system_alerts',
    'system_config',
    'system_health_snapshots',
    'schema_drift_alerts',
    'query_telemetry',
    'connection_test_logs',
    'connection_anomalies',
    -- Histórico calculado por backend
    'lead_score_history',
    'lead_score_threshold_log',
    'score_history',
    'rfm_history',
    'life_events_history',
    'forecast_categories_history',
    'pipeline_stage_transitions',
    -- Envios automatizados
    'sequence_send_log',
    'sequence_events',
    'nurturing_executions',
    'attribution_touchpoints',
    'attribution_models_cache'
  ];
BEGIN
  FOREACH t IN ARRAY service_only LOOP
    IF EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = t AND c.relkind = 'r'
    ) THEN
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', t);
    END IF;
  END LOOP;
END $$;

-- Etapa 3: Garantir que service_role mantém acesso total (defesa em profundidade).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname='public' AND c.relkind='r'
  LOOP
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role', r.relname);
  END LOOP;
END $$;
