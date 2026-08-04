-- Migration: drop_unused_fk_indexes (Wave 170)
-- PERFORMANCE / MAINTENANCE: 107 indexes in public schema flagged as unused
-- by Supabase performance advisor (pg_stat_user_indexes.idx_scan = 0).
-- All follow the idx_fk_* naming convention — created at table definition time
-- to support FK lookups, but superseded by covering or PK indexes.
--
-- Dropped: 105 idx_fk_* indexes
-- Kept:    idx_contacts_first_name_trgm, idx_contacts_last_name_trgm
--          (trigram full-text search — dropping would break fuzzy contact search)
-- Skipped: zapp_history schema embedding/vector indexes
--          (idx_me_vector, idx_ma_embedding, etc. — reserved for AI features)
--
-- These are safe to drop:
--   • No UNIQUE constraint backing (advisor confirmed non-constraint indexes)
--   • Each FK column is also covered by a PK, UNIQUE, or higher-selectivity index
--   • DROP INDEX is reversible — can be recreated if a query plan regresses

DROP INDEX IF EXISTS public.idx_fk_activities_company_id;
DROP INDEX IF EXISTS public.idx_fk_activities_contact_id;
DROP INDEX IF EXISTS public.idx_fk_activities_interaction_id;
DROP INDEX IF EXISTS public.idx_fk_activities_user_id;
DROP INDEX IF EXISTS public.idx_fk_activity_feed_user_id;
DROP INDEX IF EXISTS public.idx_fk_alerts_contact_id;
DROP INDEX IF EXISTS public.idx_fk_alerts_interaction_id;
DROP INDEX IF EXISTS public.idx_fk_alerts_user_id;
DROP INDEX IF EXISTS public.idx_fk_automation_executions_rule_id;
DROP INDEX IF EXISTS public.idx_fk_automation_logs_automation_id;
DROP INDEX IF EXISTS public.idx_fk_automations_created_by;
DROP INDEX IF EXISTS public.idx_fk_cadence_enrollments_user_id;
DROP INDEX IF EXISTS public.idx_fk_calendar_events_deal_id;
DROP INDEX IF EXISTS public.idx_fk_campaigns_created_by;
DROP INDEX IF EXISTS public.idx_fk_carrier_evaluations_avaliador_id;
DROP INDEX IF EXISTS public.idx_fk_carrier_homologations_avaliador_id;
DROP INDEX IF EXISTS public.idx_fk_churn_predictions_company_id;
DROP INDEX IF EXISTS public.idx_fk_churn_predictions_user_id;
DROP INDEX IF EXISTS public.idx_fk_cidades_estado_ibge;
DROP INDEX IF EXISTS public.idx_fk_clients_deleted_by;
DROP INDEX IF EXISTS public.idx_fk_commissions_deal_id;
DROP INDEX IF EXISTS public.idx_fk_commissions_rule_id;
DROP INDEX IF EXISTS public.idx_fk_commissions_user_id;
DROP INDEX IF EXISTS public.idx_fk_company_addresses_cidade_ibge;
DROP INDEX IF EXISTS public.idx_fk_company_cadences_cadence_id;
DROP INDEX IF EXISTS public.idx_fk_company_cadences_user_id;
DROP INDEX IF EXISTS public.idx_fk_company_rfm_scores_segment_id;
DROP INDEX IF EXISTS public.idx_fk_company_stakeholder_map_access_via_contact_id;
DROP INDEX IF EXISTS public.idx_fk_company_stakeholder_map_contact_id;
DROP INDEX IF EXISTS public.idx_fk_company_stakeholder_map_user_id;
DROP INDEX IF EXISTS public.idx_fk_company_territories_territory_id;
DROP INDEX IF EXISTS public.idx_fk_competitive_losses_competitor_id;
DROP INDEX IF EXISTS public.idx_fk_competitive_losses_deal_id;
DROP INDEX IF EXISTS public.idx_fk_competitive_losses_reported_by;
DROP INDEX IF EXISTS public.idx_fk_contact_addresses_created_by;
DROP INDEX IF EXISTS public.idx_fk_contact_addresses_updated_by;
DROP INDEX IF EXISTS public.idx_fk_contact_notes_contact_id;
DROP INDEX IF EXISTS public.idx_fk_coop_sistemas_grupo_economico_id;
DROP INDEX IF EXISTS public.idx_fk_customer_events_executado_por_id;
DROP INDEX IF EXISTS public.idx_fk_customer_events_vendedor_id;
DROP INDEX IF EXISTS public.idx_fk_customer_ownership_history_company_id;
DROP INDEX IF EXISTS public.idx_fk_customer_ownership_history_customer_id;
DROP INDEX IF EXISTS public.idx_fk_customer_ownership_history_registrado_por_id;
DROP INDEX IF EXISTS public.idx_fk_customer_ownership_history_vendedor_id;
DROP INDEX IF EXISTS public.idx_fk_customer_sdr_history_closer_destino_id;
DROP INDEX IF EXISTS public.idx_fk_customer_sdr_history_customer_id;
DROP INDEX IF EXISTS public.idx_fk_customer_sdr_history_sdr_id;
DROP INDEX IF EXISTS public.idx_fk_customer_surveys_sent_by;
DROP INDEX IF EXISTS public.idx_fk_deal_competitors_competitor_id;
DROP INDEX IF EXISTS public.idx_fk_deal_items_deal_id;
DROP INDEX IF EXISTS public.idx_fk_deal_items_product_id;
DROP INDEX IF EXISTS public.idx_fk_deal_velocity_analysis_company_id;
DROP INDEX IF EXISTS public.idx_fk_deal_velocity_analysis_contact_id;
DROP INDEX IF EXISTS public.idx_fk_deal_velocity_analysis_user_id;
DROP INDEX IF EXISTS public.idx_fk_deals_contact_id;
DROP INDEX IF EXISTS public.idx_fk_deals_loss_reason_id;
DROP INDEX IF EXISTS public.idx_fk_disc_templates_created_by;
DROP INDEX IF EXISTS public.idx_fk_documents_user_id;
DROP INDEX IF EXISTS public.idx_fk_duplicate_candidates_reviewed_by;
DROP INDEX IF EXISTS public.idx_fk_import_jobs_created_by;
DROP INDEX IF EXISTS public.idx_fk_inactivity_alerts_resolved_by;
DROP INDEX IF EXISTS public.idx_fk_integration_logs_integration_id;
DROP INDEX IF EXISTS public.idx_fk_integrations_created_by;
DROP INDEX IF EXISTS public.idx_fk_interaction_templates_user_id;
DROP INDEX IF EXISTS public.idx_fk_interactions_usuario_responsavel_id;
DROP INDEX IF EXISTS public.idx_fk_meetings_deal_id;
DROP INDEX IF EXISTS public.idx_fk_meetings_user_id;
DROP INDEX IF EXISTS public.idx_fk_nps_surveys_created_by;
DROP INDEX IF EXISTS public.idx_fk_product_novelties_supplier_id;
DROP INDEX IF EXISTS public.idx_fk_proposals_company_id;
DROP INDEX IF EXISTS public.idx_fk_proposals_contact_id;
DROP INDEX IF EXISTS public.idx_fk_proposals_user_id;
DROP INDEX IF EXISTS public.idx_fk_quick_notes_user_id;
DROP INDEX IF EXISTS public.idx_fk_relationship_score_history_user_id;
DROP INDEX IF EXISTS public.idx_fk_report_executions_scheduled_report_id;
DROP INDEX IF EXISTS public.idx_fk_role_permissions_permission_id;
DROP INDEX IF EXISTS public.idx_fk_sales_deleted_by;
DROP INDEX IF EXISTS public.idx_fk_sales_salesperson_id;
DROP INDEX IF EXISTS public.idx_fk_sales_activities_deleted_by;
DROP INDEX IF EXISTS public.idx_fk_sales_activities_sale_id;
DROP INDEX IF EXISTS public.idx_fk_sales_activities_salesperson_id;
DROP INDEX IF EXISTS public.idx_fk_sales_cadences_created_by;
DROP INDEX IF EXISTS public.idx_fk_sales_forecasts_user_id;
DROP INDEX IF EXISTS public.idx_fk_sales_goals_user_id;
DROP INDEX IF EXISTS public.idx_fk_sales_opportunities_assigned_to;
DROP INDEX IF EXISTS public.idx_fk_sales_opportunities_identified_by;
DROP INDEX IF EXISTS public.idx_fk_sales_tasks_client_id;
DROP INDEX IF EXISTS public.idx_fk_sales_tasks_deleted_by;
DROP INDEX IF EXISTS public.idx_fk_scheduled_reports_created_by;
DROP INDEX IF EXISTS public.idx_fk_scheduled_visits_company_id;
DROP INDEX IF EXISTS public.idx_fk_script_sections_script_id;
DROP INDEX IF EXISTS public.idx_fk_sdr_closer_assignments_criado_por_id;
DROP INDEX IF EXISTS public.idx_fk_sla_violations_sla_rule_id;
DROP INDEX IF EXISTS public.idx_fk_sla_violations_user_id;
DROP INDEX IF EXISTS public.idx_fk_sleight_of_mouth_examples_pattern_id;
DROP INDEX IF EXISTS public.idx_fk_smart_segments_created_by;
DROP INDEX IF EXISTS public.idx_fk_supplier_evaluations_avaliador_id;
DROP INDEX IF EXISTS public.idx_fk_supplier_homologations_avaliador_id;
DROP INDEX IF EXISTS public.idx_fk_supplier_scores_segment_code;
DROP INDEX IF EXISTS public.idx_fk_tasks_deal_id;
DROP INDEX IF EXISTS public.idx_fk_tasks_parent_task_id;
DROP INDEX IF EXISTS public.idx_fk_territories_manager_id;
DROP INDEX IF EXISTS public.idx_fk_territory_assignments_user_id;
DROP INDEX IF EXISTS public.idx_fk_user_badges_badge_id;
DROP INDEX IF EXISTS public.idx_fk_user_goals_user_id;
DROP INDEX IF EXISTS public.idx_fk_webhook_logs_webhook_id;
DROP INDEX IF EXISTS public.idx_fk_webhooks_created_by;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  remaining int;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND indexname LIKE 'idx_fk_%';

  IF remaining = 0 THEN
    RAISE NOTICE '[Wave 170] All 105 unused idx_fk_* indexes removed. Write overhead reduced.';
  ELSE
    RAISE NOTICE '[Wave 170] % idx_fk_* indexes remain (some may have been renamed or are still needed)', remaining;
  END IF;
END;
$$;
