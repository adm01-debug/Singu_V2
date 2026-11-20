-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409235851
-- nome:   zapp_audit_m19_dashboard_v13_audit_fields

-- View de monitoramento da auditoria: expõe todos os novos detectores
CREATE OR REPLACE VIEW zapp_history.v_audit_intelligence AS
SELECT
  m.id,
  m.created_at,
  m.contact_id,
  m.direction,
  m.content,
  m.lead_score,
  m.primary_intent,
  m.funnel_stage,
  m.priority_quadrant,
  m.quarantined,
  m.bant_score->>'classification' AS bant_class,
  (m.bant_score->>'bant_total')::INT AS bant_total,
  m.bant_score->'signals' AS bant_signals,
  m.bant_score->>'override_reason' AS override_reason,
  m.credibility->>'level' AS credibility_level,
  m.company_size->>'size' AS company_size,
  m.relationship_status->>'status' AS relationship_status,
  m.technical_interest->>'has_technical_interest' AS has_technical,
  m.delivery_preference->>'urgency' AS urgency,
  m.referral_source->>'source' AS referral,
  m.language_info->>'lang' AS lang,
  m.nlp_structured_order->>'product' AS product,
  (m.nlp_structured_order->>'quantity') AS quantity,
  m.budget_detected,
  (m.nlp_structured_order ? 'cnpj') AS has_cnpj
FROM zapp_history.messages m
ORDER BY m.created_at DESC;

GRANT SELECT ON zapp_history.v_audit_intelligence TO service_role, authenticated;

-- Dashboard master v13: retorna estatísticas globais + breakdown por BANT
CREATE OR REPLACE FUNCTION zapp_history.audit_dashboard_v13()
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = 'zapp_history','public','pg_temp'
AS $fn$
DECLARE v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'overall_status', 'GREEN',
    'inventory', jsonb_build_object(
      'tables', (SELECT COUNT(*) FROM pg_tables WHERE schemaname='zapp_history'),
      'views', (SELECT COUNT(*) FROM pg_views WHERE schemaname='zapp_history'),
      'functions', (SELECT COUNT(*) FROM pg_proc WHERE pronamespace='zapp_history'::regnamespace),
      'triggers', (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid WHERE c.relnamespace='zapp_history'::regnamespace AND NOT t.tgisinternal),
      'indexes', (SELECT COUNT(*) FROM pg_indexes WHERE schemaname='zapp_history'),
      'cron_jobs', (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE 'zapp%' AND active),
      'check_constraints', (SELECT COUNT(*) FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid WHERE t.relnamespace='zapp_history'::regnamespace AND c.contype='c'),
      'rls_policies', (SELECT COUNT(*) FROM pg_policies WHERE schemaname='zapp_history')
    ),
    'security', jsonb_build_object(
      'insecure_definer_functions', (SELECT COUNT(*) FROM pg_proc WHERE pronamespace='zapp_history'::regnamespace AND prosecdef AND (proconfig IS NULL OR NOT array_to_string(proconfig,',') LIKE '%search_path%')),
      'grants_to_anon', (SELECT COUNT(*) FROM information_schema.role_table_grants WHERE table_schema='zapp_history' AND grantee IN ('anon','PUBLIC')),
      'webhook_secret_enforce', COALESCE((SELECT value FROM zapp_history.runtime_config WHERE key='WEBHOOK_SECRET_ENFORCE'),'false'),
      'has_webhook_secret', (SELECT value IS NOT NULL FROM zapp_history.runtime_config WHERE key='WEBHOOK_SHARED_SECRET')
    ),
    'data_health', jsonb_build_object(
      'total_messages', (SELECT COUNT(*) FROM zapp_history.messages),
      'zombies_pipeline', (SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_processed_at IS NULL),
      'quarantined', (SELECT COUNT(*) FROM zapp_history.messages WHERE quarantined = TRUE),
      'phone_contacts', (SELECT COUNT(*) FROM zapp_history.phone_to_contact),
      'connector_log_pending', (SELECT COUNT(*) FROM public.connector_log WHERE processed = FALSE)
    ),
    'cron_health', jsonb_build_object(
      'failures_last_hour', (SELECT COUNT(*) FROM cron.job_run_details WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'zapp%') AND status='failed' AND start_time > NOW() - INTERVAL '1 hour'),
      'successful_last_hour', (SELECT COUNT(*) FROM cron.job_run_details WHERE jobid IN (SELECT jobid FROM cron.job WHERE jobname LIKE 'zapp%') AND status='succeeded' AND start_time > NOW() - INTERVAL '1 hour')
    ),
    'bant_breakdown', COALESCE(
      (SELECT jsonb_object_agg(bant_class, cnt)
       FROM (SELECT bant_score->>'classification' AS bant_class, COUNT(*) AS cnt
             FROM zapp_history.messages
             WHERE nlp_processed_at IS NOT NULL
             GROUP BY bant_score->>'classification') x),
      '{}'::jsonb
    ),
    'detection_coverage', jsonb_build_object(
      'with_product', (SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_structured_order ? 'product'),
      'with_quantity', (SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_structured_order ? 'quantity'),
      'with_budget', (SELECT COUNT(*) FROM zapp_history.messages WHERE budget_detected IS NOT NULL),
      'with_cnpj', (SELECT COUNT(*) FROM zapp_history.messages WHERE nlp_structured_order ? 'cnpj'),
      'with_technical_interest', (SELECT COUNT(*) FROM zapp_history.messages WHERE (technical_interest->>'has_technical_interest')::BOOLEAN = TRUE)
    ),
    'edge_functions', jsonb_build_object(
      'v6_template_ready', (SELECT COUNT(*) > 0 FROM zapp_history.edge_function_templates WHERE slug='evolution-bitrix-connector' AND version='v6'),
      'blocker_status', 'awaiting_deploy_by_user'
    )
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;
