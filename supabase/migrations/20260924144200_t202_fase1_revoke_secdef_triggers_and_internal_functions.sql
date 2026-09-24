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

-- 13: funcoes trigger (nunca deveriam ser chamaveis via API/RPC)
REVOKE EXECUTE ON FUNCTION public.audit_connection_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.audit_life_events() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_interaction_response_time() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.calculate_next_contact_due() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.connection_configs_encrypt_trigger() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.detect_contact_intel_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_behavioral_profile_regen() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.enqueue_contact_validation() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_playbook_usage() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.increment_version_column() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_behavioral_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_contact_tag_changes() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.log_deal_forecast_category_change() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_critical_behavioral_alert() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_connection_failures() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_critical_next_action() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_webhook_errors() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_contact_cadence_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_contact_preferences_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_contact_relatives_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_contact_time_analysis_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_disc_analysis_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_interactions_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.process_reframing_audit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.record_family_history() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sequence_event_to_intent_signal() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sequence_pause_on_interaction_reply() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_contact_last_interaction() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.sync_nlp_to_contact() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trigger_aggregate_nlp_to_company() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.trigger_lead_score_recompute() FROM anon, authenticated, public;

-- 12: funcoes internas/cron/IDOR-risco sem checagem de posse visivel na assinatura
REVOKE EXECUTE ON FUNCTION public.aggregate_nlp_to_company(p_company_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_ack_stale_mtta_sla_breaches() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_behavioral_regen_cron_staleness() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_mtta_auto_ack_heartbeat() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_behavioral_regen_queue(_retention_days integer, _max_attempts integer, _dead_letter_backoff_days integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_health_snapshots() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_simulated_alerts() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_account_health(_account_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_attribution(_deal_id text, _model text, _deal_value numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.compute_revops_kpis(_user_id uuid, _period_start date, _period_end date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cs_renewal_pipeline(_user_id uuid, _days_ahead integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dismiss_revops_alert(_alert_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_smart_notification(_event_type text, _title text, _body text, _entity_type text, _entity_id text, _urgency text, _bundle_key text, _action_url text, _payload jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enroll_contact_in_workflow(_workflow_id uuid, _contact_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_audit_log_partition(target_date date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.evaluate_mql(_contact_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_behavioral_regen_cron_health() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_connection_metrics(_connection_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_instant_kpis(p_user_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_marketing_funnel_stats(_user_id uuid, _start_date date, _end_date date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_score_explicability(p_contact_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_system_config_num(_key text, _default numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_webhook_quota(_webhook_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_deal(p_deal_id uuid, p_new_stage_id uuid, p_new_probability numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_deal_atomic(p_deal_id uuid, p_new_stage text, p_new_probability integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.publish_mtta_sla_breach_alert(_mtta_minutes integer, _sla_minutes integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.reset_daily_lead_counts() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_conversation_topics(_user_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_deal_room(_user_id uuid, _deal_id text, _deal_name text, _company_id uuid, _title text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_forecast_period(_user_id uuid, _type text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_lead_score_defaults(_user_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_playbook_defaults(_user_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.seed_win_loss_defaults(_user_id uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.simulate_behavioral_regen_alert(_alert_type text, _severity text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_deal_amount(p_deal_id uuid, p_new_value numeric) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_team_member_ids(_manager_user_id uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.decrypt_connection_config(p_encrypted bytea) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.encrypt_connection_config(p_config jsonb) FROM authenticated;
