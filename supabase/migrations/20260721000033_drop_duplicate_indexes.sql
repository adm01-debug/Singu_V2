-- Migration: drop_duplicate_indexes (Wave 119)
-- 62 exact-duplicate indexes identified via pg_index indkey + indpred + indexprs comparison.
-- For each pair the redundant copy is dropped; unique constraints backed by pg_constraint are
-- never touched — only plain indexes are removed here.
-- Verified with pg_indexes.indexdef before inclusion.

-- ── activities ───────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_activities_created_at;

-- ── alert_rules ──────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_alert_rules_code;

-- ── canned_responses ─────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_canned_responses_user;

-- ── carriers ─────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_carriers_company;

-- ── client_values ────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_client_values_contact;

-- ── cnpj_cache ───────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_cnpj_cache_cnpj;

-- ── cognitive_bias_history ───────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_cognitive_bias_history_contact_id;
DROP INDEX IF EXISTS public.idx_cognitive_bias_history_user_id;

-- ── communication_preferences ────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_communication_preferences_contact;

-- ── companies ────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_companies_bitrix_id;
-- Both _gin variants are identical GIN gin_trgm_ops on the same column; _trgm kept (descriptive name)
DROP INDEX IF EXISTS public.idx_companies_nome_fantasia_gin;
DROP INDEX IF EXISTS public.idx_companies_razao_social_gin;
-- Both search_vector GIN indexes are identical; shorter name kept
DROP INDEX IF EXISTS public.idx_companies_search_vector;

-- ── connector_log ────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_connector_log_created_at;

-- ── contact_relatives ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_contact_relatives_contact_id;
DROP INDEX IF EXISTS public.idx_contact_relatives_user_id;

-- ── contact_time_analysis ────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_contact_time_analysis_contact;

-- ── customer_health_scores ───────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_customer_health_company;

-- ── customers ────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_customers_company_id;

-- ── decision_criteria ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_decision_criteria_contact;

-- ── disc_analysis_history ────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_disc_analysis_history_contact;
DROP INDEX IF EXISTS public.idx_disc_analysis_history_user;

-- ── disc_communication_logs ──────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_disc_communication_logs_contact;

-- ── disc_conversion_metrics ──────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_disc_conversion_metrics_user;

-- ── document_signatures ──────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_document_signatures_token;

-- ── emotional_anchors ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_emotional_anchors_contact;

-- ── emotional_states_history ─────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_emotional_states_contact;

-- ── eq_analysis_history ──────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_eq_analysis_history_contact_id;
DROP INDEX IF EXISTS public.idx_eq_analysis_history_user_id;

-- ── favorite_templates ───────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_favorite_templates_user_id;

-- ── hidden_objections ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_hidden_objections_contact;

-- ── insights ─────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_insights_contact_id;
DROP INDEX IF EXISTS public.idx_insights_user_id;

-- ── interactions ─────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_interactions_company_id;
-- Identical btree (company_id, created_at DESC); _created kept, _date dropped
DROP INDEX IF EXISTS public.idx_interactions_company_date;
DROP INDEX IF EXISTS public.idx_interactions_contact_id;
DROP INDEX IF EXISTS public.idx_interactions_data_interacao;

-- ── lead_score_config ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_lead_score_config_user;

-- ── lead_score_history ───────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_lead_score_history_company;

-- ── metaprogram_analysis ─────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_metaprogram_analysis_contact;
DROP INDEX IF EXISTS public.idx_metaprogram_analysis_user;

-- ── offer_suggestions ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_offer_suggestions_contact;

-- ── product_novelties ────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_pn_product_id_unique;

-- ── products ─────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_products_sku;

-- ── query_telemetry ──────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_query_telemetry_created_at;

-- ── score_history ────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_score_history_score_type;

-- ── search_products_cache ────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_search_products_cache_hash;

-- ── seller_daily_metrics ─────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_seller_metrics_user;

-- ── sequence_steps ───────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_sequence_steps_seq;

-- ── sms_campaign_recipients ──────────────────────────────────────────────────
-- Identical btree (campaign_id, status); longer name dropped
DROP INDEX IF EXISTS public.idx_sms_recipients_campaign;

-- ── social_behavior_analysis ─────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_social_behavior_analysis_contact;

-- ── suppliers ────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_suppliers_company;

-- ── tasks ────────────────────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_tasks_due_date;

-- ── trigger_usage_history ────────────────────────────────────────────────────
DROP INDEX IF EXISTS public.idx_trigger_usage_history_contact_id;
DROP INDEX IF EXISTS public.idx_trigger_usage_history_user_id;

DO $migration$
DECLARE
  index_name text;
  index_oid regclass;
BEGIN
  FOREACH index_name IN ARRAY ARRAY[
    'compatibility_settings_user_id_key',
    'favorite_templates_user_id_template_id_key',
    'unique_user_health_settings',
    'nurturing_enrollments_workflow_id_contact_id_key',
    'sequence_enrollments_sequence_id_contact_id_key',
    'sms_opt_outs_user_id_phone_key',
    'unique_user_report_settings'
  ]
  LOOP
    index_oid := to_regclass(format('public.%I', index_name));

    IF index_oid IS NOT NULL AND NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conindid = index_oid
    ) THEN
      EXECUTE format('DROP INDEX public.%I', index_name);
    END IF;
  END LOOP;
END;
$migration$;
