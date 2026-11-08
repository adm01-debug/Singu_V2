-- Correção: t202 revogou "FROM anon, authenticated" nas 36 funções internas/IDOR
-- (etapa 12) mas não "FROM public". Como toda function tem EXECUTE grant a PUBLIC
-- por padrão na criação, anon/authenticated continuavam executando via PUBLIC.
-- Confirmado via get_advisors: contagem anon não caiu para as 34 funções relevantes
-- (2 das 36 são auth-only e já estavam corretas via t201/t202).
-- Esta migration fecha o gap revogando FROM public nas mesmas funções.

REVOKE EXECUTE ON FUNCTION public.aggregate_nlp_to_company(p_company_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.auto_ack_stale_mtta_sla_breaches() FROM public;
REVOKE EXECUTE ON FUNCTION public.check_behavioral_regen_cron_staleness() FROM public;
REVOKE EXECUTE ON FUNCTION public.check_mtta_auto_ack_heartbeat() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_behavioral_regen_queue(_retention_days integer, _max_attempts integer, _dead_letter_backoff_days integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_health_snapshots() FROM public;
REVOKE EXECUTE ON FUNCTION public.cleanup_simulated_alerts() FROM public;
REVOKE EXECUTE ON FUNCTION public.compute_account_health(_account_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.compute_attribution(_deal_id text, _model text, _deal_value numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.compute_revops_kpis(_user_id uuid, _period_start date, _period_end date) FROM public;
REVOKE EXECUTE ON FUNCTION public.cs_renewal_pipeline(_user_id uuid, _days_ahead integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.dismiss_revops_alert(_alert_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.enqueue_smart_notification(_event_type text, _title text, _body text, _entity_type text, _entity_id text, _urgency text, _bundle_key text, _action_url text, _payload jsonb) FROM public;
REVOKE EXECUTE ON FUNCTION public.enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.ensure_audit_log_partition(target_date date) FROM public;
REVOKE EXECUTE ON FUNCTION public.evaluate_mql(_contact_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_behavioral_regen_cron_health() FROM public;
REVOKE EXECUTE ON FUNCTION public.get_connection_metrics(_connection_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_instant_kpis(p_user_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_score_explicability(p_contact_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.get_system_config_num(_key text, _default numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.increment_webhook_quota(_webhook_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.move_deal(p_deal_id uuid, p_new_stage_id uuid, p_new_probability numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability numeric) FROM public;
REVOKE EXECUTE ON FUNCTION public.publish_mtta_sla_breach_alert(_mtta_minutes integer, _sla_minutes integer) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_conversation_topics(_user_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_deal_room(_user_id uuid, _deal_id text, _deal_name text, _company_id uuid, _title text) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_forecast_period(_user_id uuid, _type text) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_lead_score_defaults(_user_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_playbook_defaults(_user_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.seed_win_loss_defaults(_user_id uuid) FROM public;
REVOKE EXECUTE ON FUNCTION public.simulate_behavioral_regen_alert(_alert_type text, _severity text) FROM public;
REVOKE EXECUTE ON FUNCTION public.update_deal_amount(p_deal_id uuid, p_new_value numeric) FROM public;
