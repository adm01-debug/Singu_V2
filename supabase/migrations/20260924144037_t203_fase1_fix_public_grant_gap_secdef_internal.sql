-- Correcao: t202 revogou "FROM anon, authenticated" nas 36 funcoes internas/IDOR
-- (etapa 12) mas nao "FROM public". Toda function ganha EXECUTE a PUBLIC por
-- default na criacao, entao anon/authenticated continuavam executando via PUBLIC
-- mesmo com a revogacao direta. Confirmado via get_advisors antes/depois desta
-- migration: anon_security_definer_function_executable caiu de 44 para 9
-- (os 9 restantes sao funcoes buyer-portal/form publico gated por token,
-- intencionalmente publicas -- fora do escopo da etapa 12).

DO $migration$
DECLARE
  function_signature text;
BEGIN
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
    'public.move_deal_atomic(uuid,text,integer)',
    'public.move_deal_atomic(uuid,text,numeric)',
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
        'REVOKE EXECUTE ON FUNCTION %s FROM public',
        function_signature
      );
    END IF;
  END LOOP;
END;
$migration$;
