
-- Rodada 32/10 — Onda F: Backend linter baseline reduction
-- Revoga privilégios de EXECUTE em funções SECURITY DEFINER que não devem ser chamadas por anon/authenticated.

-- ============ 1. REVOKE FROM anon (7 funções internas) ============
REVOKE EXECUTE ON FUNCTION public.check_behavioral_regen_cron_staleness() FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_behavioral_regen_queue(integer, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cleanup_simulated_alerts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enqueue_behavioral_profile_regen() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_behavioral_regen_cron_health() FROM anon;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_critical_behavioral_alert() FROM anon;
REVOKE EXECUTE ON FUNCTION public.simulate_behavioral_regen_alert(text, text) FROM anon;

-- ============ 2. REVOKE FROM authenticated — funções trigger (33) ============
-- Triggers disparam via table owner, não precisam de grant público.
REVOKE EXECUTE ON FUNCTION public.audit_life_events() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_fn() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_connection_changes() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_interaction_response_time() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.calculate_next_contact_due() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.connection_configs_encrypt_trigger() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.detect_contact_intel_changes() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_behavioral_profile_regen() FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_contact_validation() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_playbook_usage() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_version_column() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_behavioral_change() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_contact_tag_changes() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_deal_forecast_category_change() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_admins_on_critical_behavioral_alert() FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_connection_failures() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_critical_next_action() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_webhook_errors() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_contact_cadence_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_contact_preferences_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_contact_relatives_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_contact_time_analysis_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_disc_analysis_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_interactions_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_reframing_audit() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_family_history() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sequence_event_to_intent_signal() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sequence_pause_on_interaction_reply() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_contact_last_interaction() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_nlp_to_contact() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_aggregate_nlp_to_company() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_lead_score_recompute() FROM authenticated, anon, PUBLIC;

-- ============ 3. REVOKE FROM authenticated — funções internas RPC (23) ============
-- Chamadas somente por edge functions (service_role) ou cron.
REVOKE EXECUTE ON FUNCTION public._connection_encryption_key() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.aggregate_nlp_to_company(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_ack_stale_mtta_sla_breaches() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_behavioral_regen_cron_staleness() FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_health_snapshots() FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_simulated_alerts() FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_connection_config(bytea) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.encrypt_connection_config(jsonb) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_smart_notification(text, text, text, text, text, text, text, text, jsonb) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ensure_audit_log_partition(date) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_behavioral_regen_cron_health() FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_system_config_num(text, numeric) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_team_member_ids(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_deal(uuid, uuid, numeric) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_companies_semantic(uuid, text, integer, real) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_contacts_by_nlp(uuid, text, text, text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_contacts_semantic(uuid, text, integer, real) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.search_interactions_semantic(uuid, text, integer, real) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_deal_room(uuid, text, text, uuid, text) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_playbook_defaults(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.seed_win_loss_defaults(uuid) FROM authenticated, anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.simulate_behavioral_regen_alert(text, text) FROM authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_deal_amount(uuid, numeric) FROM authenticated, anon, PUBLIC;
