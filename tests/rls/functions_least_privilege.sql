-- Rodada 47/10 — Least Privilege para FUNCTIONS em public.*
-- Invariante: triggers internos e utilitários de infra não são callable por anon/authenticated.
\set ON_ERROR_STOP on

DO $$
DECLARE
  offenders TEXT := '';
  fn TEXT;
  service_only TEXT[] := ARRAY[
    'tg_set_updated_at','touch_system_config','update_bpr_queue_updated_at',
    'validate_entity_relationship',
    'execute_readonly_query','increment_webhook_quota',
    'reset_daily_lead_counts',
    'ensure_ai_gateway_metrics_partition','drop_old_ai_gateway_metrics_partitions',
    'record_rpc_perf_sample','cleanup_rpc_perf_samples',
    'evaluate_ai_gateway_alerts','auto_resolve_ai_gateway_alerts',
    'set_rpc_plan_changed','capture_rpc_plan','capture_degraded_rpc_plans',
    'rpc_plan_structure'
  ];
  -- cleanup_behavioral_regen_queue, publish_mtta_sla_breach_alert e compute_attribution
  -- são chamadas pelo frontend e checam admin/dono internamente; o contrato delas está
  -- em frontend_rpcs_authenticated.sql.
BEGIN
  FOREACH fn IN ARRAY service_only LOOP
    IF EXISTS (
      SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
       WHERE n.nspname='public' AND p.proname=fn
         AND (has_function_privilege('anon', p.oid, 'EXECUTE')
           OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
    ) THEN
      offenders := offenders || fn || ' ';
    END IF;
  END LOOP;
  IF length(offenders) > 0 THEN
    RAISE EXCEPTION '❌ Funções ainda executáveis por anon/authenticated: %', offenders;
  END IF;
  RAISE NOTICE '✅ Funções service-role-only bloqueadas para anon/authenticated';
END $$;