-- Revoga execução pública e garante apenas para autenticados
DO $$
DECLARE
    f RECORD;
    functions_to_restrict TEXT[] := ARRAY[
        'has_role', 'reset_daily_lead_counts', 'audit_trigger_fn', 'notify_webhook_errors',
        'search_contacts_unaccent', 'compute_account_health', 'handle_new_user',
        'search_companies_unaccent', 'cs_renewal_pipeline', 'increment_playbook_usage',
        'seed_playbook_defaults', 'enqueue_contact_validation', 'seed_lead_score_defaults',
        'sequence_pause_on_interaction_reply', 'detect_contact_intel_changes',
        'trigger_lead_score_recompute', 'seed_forecast_period', 'search_interactions_unaccent',
        'increment_magnet_view', 'log_deal_forecast_category_change', 'seed_conversation_topics',
        'seed_win_loss_defaults', 'seed_deal_room', 'evaluate_mql', 'track_magnet_download',
        'compute_attribution', 'sequence_event_to_intent_signal', '_connection_encryption_key',
        'encrypt_connection_config', 'dismiss_revops_alert', 'decrypt_connection_config',
        'enroll_contact_in_workflow', 'search_interactions_semantic', 'search_companies_semantic',
        'notify_connection_failures', 'get_connection_metrics', 'audit_connection_changes',
        'compute_revops_kpis', 'cleanup_old_health_snapshots', 'increment_webhook_quota',
        'notify_critical_next_action', 'execute_readonly_query', 'search_products_semantic',
        'enqueue_smart_notification', 'increment_version_column', 'connection_configs_encrypt_trigger',
        'search_contacts_semantic', 'log_contact_tag_changes'
    ];
    func_name TEXT;
BEGIN
    FOREACH func_name IN ARRAY functions_to_restrict LOOP
        EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I FROM public', func_name);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO authenticated', func_name);
        EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I TO service_role', func_name);
    END LOOP;
END $$;