-- Fase 1 (plano banco-unico Singu) -- etapas 12+13: classificacao e revogacao em massa
-- das SECURITY DEFINER expostas a anon/authenticated que sobraram depois da 1a rodada (t201).
-- Checado antes: nenhuma das funcoes abaixo e usada em RLS policy (pg_policies.qual/with_check)
-- nem chamada pelo corpo de outra funcao publica (pg_proc.prosrc), exceto aggregate_nlp_to_company,
-- que e chamada por trigger_aggregate_nlp_to_company (SECURITY DEFINER) -- chamada interna roda com
-- privilegio do dono da funcao chamadora, nao e afetada pela revogacao de EXECUTE do caller externo.
--
-- NOTA (ver t203): esta migration revoga "FROM anon, authenticated" na secao 12 mas nao
-- "FROM public" -- por default toda function ganha EXECUTE a PUBLIC na criacao, entao a secao
-- 12 sozinha NAO fechou o acesso. t203 corrige isso. Mantido aqui como registro historico
-- exato do que foi aplicado.

DO $migration$
DECLARE
  function_name text;
  function_signature text;
  function_oid regprocedure;
BEGIN
  FOREACH function_name IN ARRAY ARRAY[
    'audit_connection_changes',
    'audit_life_events',
    'calculate_interaction_response_time',
    'calculate_next_contact_due',
    'connection_configs_encrypt_trigger',
    'detect_contact_intel_changes',
    'enqueue_behavioral_profile_regen',
    'enqueue_contact_validation',
    'increment_playbook_usage',
    'increment_version_column',
    'log_behavioral_change',
    'log_contact_tag_changes',
    'log_deal_forecast_category_change',
    'notify_admins_on_critical_behavioral_alert',
    'notify_connection_failures',
    'notify_critical_next_action',
    'notify_webhook_errors',
    'process_contact_cadence_audit',
    'process_contact_preferences_audit',
    'process_contact_relatives_audit',
    'process_contact_time_analysis_audit',
    'process_disc_analysis_audit',
    'process_interactions_audit',
    'process_reframing_audit',
    'record_family_history',
    'sequence_event_to_intent_signal',
    'sequence_pause_on_interaction_reply',
    'sync_contact_last_interaction',
    'sync_nlp_to_contact',
    'trigger_aggregate_nlp_to_company',
    'trigger_lead_score_recompute'
  ]
  LOOP
    FOR function_oid IN
      SELECT p.oid::regprocedure
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = function_name
    LOOP
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated, public',
        function_oid
      );
    END LOOP;
  END LOOP;

  FOREACH function_signature IN ARRAY ARRAY[
    'public.aggregate_nlp_to_company(uuid)',
    'public.auto_ack_stale_mtta_sla_breaches()',
    'public.check_behavioral_regen_cron_staleness()',
    'public.check_mtta_auto_ack_heartbeat()',
    'public.cleanup_behavioral_regen_queue(integer,integer,integer)',
    'public.cleanup_old_health_snapshots()',
    'public.cleanup_simulated_alerts()',
    'public.compute_account_health(uuid)',
    'public.compute_attribution(text,text,numeric)',
    'public.compute_revops_kpis(uuid,date,date)',
    'public.cs_renewal_pipeline(uuid,integer)',
    'public.dismiss_revops_alert(uuid)',
    'public.enqueue_smart_notification(text,text,text,text,text,text,text,text,jsonb)',
    'public.enroll_contact_in_workflow(uuid,uuid)',
    'public.ensure_audit_log_partition(date)',
    'public.evaluate_mql(uuid)',
    'public.get_behavioral_regen_cron_health()',
    'public.get_connection_metrics(uuid)',
    'public.get_instant_kpis(uuid)',
    'public.get_marketing_funnel_stats(uuid,date,date)',
    'public.get_score_explicability(uuid)',
    'public.get_system_config_num(text,numeric)',
    'public.increment_webhook_quota(uuid)',
    'public.move_deal(uuid,uuid,numeric)',
    'public.move_deal_atomic(uuid,text,numeric)',
    'public.move_deal_atomic(uuid,text,integer)',
    'public.publish_mtta_sla_breach_alert(integer,integer)',
    'public.seed_conversation_topics(uuid)',
    'public.seed_deal_room(uuid,text,text,uuid,text)',
    'public.seed_forecast_period(uuid,text)',
    'public.seed_lead_score_defaults(uuid)',
    'public.seed_playbook_defaults(uuid)',
    'public.seed_win_loss_defaults(uuid)',
    'public.simulate_behavioral_regen_alert(text,text)',
    'public.update_deal_amount(uuid,numeric)'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %s FROM anon, authenticated',
        function_signature
      );
    END IF;
  END LOOP;

  FOREACH function_signature IN ARRAY ARRAY[
    'public.reset_daily_lead_counts()',
    'public.get_team_member_ids(uuid)',
    'public.decrypt_connection_config(bytea)',
    'public.encrypt_connection_config(jsonb)'
  ]
  LOOP
    IF to_regprocedure(function_signature) IS NOT NULL THEN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %s FROM authenticated',
        function_signature
      );
    END IF;
  END LOOP;
END;
$migration$;
