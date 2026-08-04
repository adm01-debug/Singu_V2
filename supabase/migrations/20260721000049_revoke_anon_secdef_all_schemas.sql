-- Migration: revoke_anon_secdef_all_schemas (Wave 135)
-- Revokes EXECUTE from `anon` on all SECURITY DEFINER functions in
-- public and zapp_history schemas.
--
-- The `anon` role represents unauthenticated callers hitting the REST API.
-- SECURITY DEFINER functions run with the function owner's privileges
-- (typically postgres/superuser), bypassing RLS. Allowing anonymous callers
-- to invoke them is a critical security gap.
--
-- This DO block dynamically revokes anon EXECUTE from every SECURITY DEFINER
-- function in the target schemas where anon currently has that privilege,
-- making it self-correcting for any future additions.
--
-- Public schema (7 functions at time of writing):
--   create_deal, fn_cf_collect_sm_legacy_dispatch, fn_cf_collect_sm_legacy_harvest,
--   fn_ingest_asia_hg_batch, fn_set_novelty_updated_at, fn_sm_promote_images_to_gold,
--   fn_sync_novelty_to_product
--
-- zapp_history schema (47 functions at time of writing):
--   activate_v6_enforcement, alert_churn_critical, alert_urgent_order_via_bitrix,
--   audit_dashboard_v13, auto_enrich_contact, auto_tag_contact_from_nlp,
--   calculate_bant_score, calculate_conversion_probability, calculate_lead_score,
--   connector_log_search, dashboard_summary, detect_relationship_status,
--   gc_zombie_messages, get_config, get_conversation_intelligence,
--   get_full_intelligence_report, get_playbook_for_message, health_check,
--   ingest_evolution_event, master_dashboard, parse_connector_log_to_messages,
--   reconcile_nlp_responses, reprocess_connector_log, request_classify,
--   request_embedding, request_nlp, request_transcription,
--   resolve_company_from_cnpj, rollback_v6_enforcement,
--   search_messages_hybrid_v2, smart_routing, sync_message_nlp_to_interaction,
--   trg_auto_enqueue_transcription, trg_auto_request_embedding,
--   trg_calculate_lead_score, trg_connector_log_dedup,
--   trg_connector_log_rate_limit, trg_connector_log_validate_secret,
--   trg_detect_content_flood, trg_periodic_reconcile,
--   trg_set_priority_quadrant, trg_set_response_window,
--   trg_set_technical_interest, trg_short_message_auto_process,
--   trg_spam_quarantine, trg_supplement_urgency, trg_update_response_time,
--   webhook_log_message

-- anon inherits EXECUTE from PUBLIC (=X in proacl). Revoking from anon alone
-- does not remove the PUBLIC inheritance. The correct fix is to REVOKE FROM PUBLIC,
-- which leaves the explicit authenticated/service_role grants untouched while
-- stripping the unauthenticated (anon) access path.
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'zapp_history')
      AND p.prosecdef = true
      AND has_function_privilege('anon', p.oid, 'execute')
    ORDER BY n.nspname, p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC',
        f.schema_name, f.func_name, f.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not revoke public execute on %.%(%): %',
        f.schema_name, f.func_name, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
