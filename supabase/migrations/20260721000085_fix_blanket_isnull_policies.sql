-- Migration: fix_blanket_isnull_policies (Wave 171)
-- SECURITY FIX: 36 tables have IS NOT NULL RLS policies on tables that contain
-- user_id columns. USING ((SELECT auth.uid()) IS NOT NULL) only checks "is the
-- caller authenticated?" — any authenticated user can read and write every other
-- user's rows. This is a critical cross-tenant data leak.
--
-- Strategy:
--   Group A (27 tables) — blanket cmd:* policy (policy_name_all / _write):
--     Drop the single *_all policy, create 4 per-operation ownership policies.
--   Group B (5 tables)  — already split per-operation but with IS NOT NULL:
--     Drop and recreate each per-operation policy with user_id ownership check.
--
-- Read-only tables with IS NOT NULL and no DML exposure (read_only_auth SELECT
-- only, search/semantic cache) are intentionally left unchanged — they are
-- backend-written computed/cache rows with acceptable read-all semantics.

-- ── GROUP A: Blanket *_all / *_write policies ─────────────────────────────────

-- 1. activity_feed
DROP POLICY IF EXISTS "activity_feed_all" ON public.activity_feed;
CREATE POLICY "activity_feed_select" ON public.activity_feed
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_feed_insert" ON public.activity_feed
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_feed_update" ON public.activity_feed
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "activity_feed_delete" ON public.activity_feed
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 2. cadence_enrollments
DROP POLICY IF EXISTS "cadence_enrollments_all" ON public.cadence_enrollments;
CREATE POLICY "cadence_enrollments_select" ON public.cadence_enrollments
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "cadence_enrollments_insert" ON public.cadence_enrollments
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "cadence_enrollments_update" ON public.cadence_enrollments
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "cadence_enrollments_delete" ON public.cadence_enrollments
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 3. commissions
DROP POLICY IF EXISTS "commissions_all" ON public.commissions;
CREATE POLICY "commissions_select" ON public.commissions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "commissions_insert" ON public.commissions
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "commissions_update" ON public.commissions
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "commissions_delete" ON public.commissions
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 4. company_cadences
DROP POLICY IF EXISTS "company_cadences_all" ON public.company_cadences;
CREATE POLICY "company_cadences_select" ON public.company_cadences
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "company_cadences_insert" ON public.company_cadences
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_cadences_update" ON public.company_cadences
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_cadences_delete" ON public.company_cadences
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 5. favorites
DROP POLICY IF EXISTS "favorites_all" ON public.favorites;
CREATE POLICY "favorites_select" ON public.favorites
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "favorites_insert" ON public.favorites
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "favorites_update" ON public.favorites
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "favorites_delete" ON public.favorites
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 6. interaction_templates
DROP POLICY IF EXISTS "interaction_templates_all" ON public.interaction_templates;
CREATE POLICY "interaction_templates_select" ON public.interaction_templates
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "interaction_templates_insert" ON public.interaction_templates
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "interaction_templates_update" ON public.interaction_templates
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "interaction_templates_delete" ON public.interaction_templates
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 7. query_telemetry
DROP POLICY IF EXISTS "query_telemetry_all" ON public.query_telemetry;
CREATE POLICY "query_telemetry_select" ON public.query_telemetry
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "query_telemetry_insert" ON public.query_telemetry
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "query_telemetry_update" ON public.query_telemetry
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "query_telemetry_delete" ON public.query_telemetry
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 8. rfm_history
DROP POLICY IF EXISTS "rfm_history_all" ON public.rfm_history;
CREATE POLICY "rfm_history_select" ON public.rfm_history
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_history_insert" ON public.rfm_history
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_history_update" ON public.rfm_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_history_delete" ON public.rfm_history
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 9. rfm_metrics
DROP POLICY IF EXISTS "rfm_metrics_all" ON public.rfm_metrics;
CREATE POLICY "rfm_metrics_select" ON public.rfm_metrics
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_metrics_insert" ON public.rfm_metrics
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_metrics_update" ON public.rfm_metrics
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_metrics_delete" ON public.rfm_metrics
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 10. sales_goals
DROP POLICY IF EXISTS "sales_goals_all" ON public.sales_goals;
CREATE POLICY "sales_goals_select" ON public.sales_goals
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "sales_goals_insert" ON public.sales_goals
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sales_goals_update" ON public.sales_goals
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sales_goals_delete" ON public.sales_goals
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 11. scheduled_visits
DROP POLICY IF EXISTS "scheduled_visits_all" ON public.scheduled_visits;
CREATE POLICY "scheduled_visits_select" ON public.scheduled_visits
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "scheduled_visits_insert" ON public.scheduled_visits
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "scheduled_visits_update" ON public.scheduled_visits
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "scheduled_visits_delete" ON public.scheduled_visits
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 12. schema_drift_alerts
DROP POLICY IF EXISTS "schema_drift_all" ON public.schema_drift_alerts;
CREATE POLICY "schema_drift_alerts_select" ON public.schema_drift_alerts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "schema_drift_alerts_insert" ON public.schema_drift_alerts
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "schema_drift_alerts_update" ON public.schema_drift_alerts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "schema_drift_alerts_delete" ON public.schema_drift_alerts
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 13. score_history
DROP POLICY IF EXISTS "score_history_all" ON public.score_history;
CREATE POLICY "score_history_select" ON public.score_history
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "score_history_insert" ON public.score_history
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "score_history_update" ON public.score_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "score_history_delete" ON public.score_history
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 14. sla_violations
DROP POLICY IF EXISTS "sla_violations_all" ON public.sla_violations;
CREATE POLICY "sla_violations_select" ON public.sla_violations
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "sla_violations_insert" ON public.sla_violations
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sla_violations_update" ON public.sla_violations
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "sla_violations_delete" ON public.sla_violations
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 15. social_behavior_analysis
DROP POLICY IF EXISTS "social_behavior_all" ON public.social_behavior_analysis;
CREATE POLICY "social_behavior_analysis_select" ON public.social_behavior_analysis
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "social_behavior_analysis_insert" ON public.social_behavior_analysis
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_behavior_analysis_update" ON public.social_behavior_analysis
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_behavior_analysis_delete" ON public.social_behavior_analysis
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 16. social_life_events
DROP POLICY IF EXISTS "social_life_events_all" ON public.social_life_events;
CREATE POLICY "social_life_events_select" ON public.social_life_events
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "social_life_events_insert" ON public.social_life_events
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_life_events_update" ON public.social_life_events
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_life_events_delete" ON public.social_life_events
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 17. social_profiles
DROP POLICY IF EXISTS "social_profiles_all" ON public.social_profiles;
CREATE POLICY "social_profiles_select" ON public.social_profiles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "social_profiles_insert" ON public.social_profiles
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_profiles_update" ON public.social_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_profiles_delete" ON public.social_profiles
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 18. social_scraping_schedule
DROP POLICY IF EXISTS "social_scraping_all" ON public.social_scraping_schedule;
CREATE POLICY "social_scraping_schedule_select" ON public.social_scraping_schedule
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "social_scraping_schedule_insert" ON public.social_scraping_schedule
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_scraping_schedule_update" ON public.social_scraping_schedule
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "social_scraping_schedule_delete" ON public.social_scraping_schedule
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 19. stakeholder_alerts
DROP POLICY IF EXISTS "stakeholder_alerts_all" ON public.stakeholder_alerts;
CREATE POLICY "stakeholder_alerts_select" ON public.stakeholder_alerts
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "stakeholder_alerts_insert" ON public.stakeholder_alerts
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "stakeholder_alerts_update" ON public.stakeholder_alerts
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "stakeholder_alerts_delete" ON public.stakeholder_alerts
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 20. territory_assignments
DROP POLICY IF EXISTS "territory_assignments_all" ON public.territory_assignments;
CREATE POLICY "territory_assignments_select" ON public.territory_assignments
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "territory_assignments_insert" ON public.territory_assignments
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "territory_assignments_update" ON public.territory_assignments
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "territory_assignments_delete" ON public.territory_assignments
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 21. trigger_ab_tests
DROP POLICY IF EXISTS "trigger_ab_tests_all" ON public.trigger_ab_tests;
CREATE POLICY "trigger_ab_tests_select" ON public.trigger_ab_tests
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_ab_tests_insert" ON public.trigger_ab_tests
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_ab_tests_update" ON public.trigger_ab_tests
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_ab_tests_delete" ON public.trigger_ab_tests
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 22. trigger_channel_effectiveness
DROP POLICY IF EXISTS "trigger_channel_all" ON public.trigger_channel_effectiveness;
CREATE POLICY "trigger_channel_effectiveness_select" ON public.trigger_channel_effectiveness
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_channel_effectiveness_insert" ON public.trigger_channel_effectiveness
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_channel_effectiveness_update" ON public.trigger_channel_effectiveness
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_channel_effectiveness_delete" ON public.trigger_channel_effectiveness
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 23. trigger_usage_history
DROP POLICY IF EXISTS "trigger_usage_all" ON public.trigger_usage_history;
CREATE POLICY "trigger_usage_history_select" ON public.trigger_usage_history
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_usage_history_insert" ON public.trigger_usage_history
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_usage_history_update" ON public.trigger_usage_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_usage_history_delete" ON public.trigger_usage_history
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 24. weekly_report_settings
DROP POLICY IF EXISTS "weekly_report_settings_all" ON public.weekly_report_settings;
CREATE POLICY "weekly_report_settings_select" ON public.weekly_report_settings
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_report_settings_insert" ON public.weekly_report_settings
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_report_settings_update" ON public.weekly_report_settings
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_report_settings_delete" ON public.weekly_report_settings
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 25. weekly_reports
DROP POLICY IF EXISTS "weekly_reports_all" ON public.weekly_reports;
CREATE POLICY "weekly_reports_select" ON public.weekly_reports
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_reports_insert" ON public.weekly_reports
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_reports_update" ON public.weekly_reports
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "weekly_reports_delete" ON public.weekly_reports
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 26. whatsapp_kpis
DROP POLICY IF EXISTS "whatsapp_kpis_all" ON public.whatsapp_kpis;
CREATE POLICY "whatsapp_kpis_select" ON public.whatsapp_kpis
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "whatsapp_kpis_insert" ON public.whatsapp_kpis
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "whatsapp_kpis_update" ON public.whatsapp_kpis
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "whatsapp_kpis_delete" ON public.whatsapp_kpis
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 27. workspace_accounts
-- NOTE: workspace_accounts.user_id is INTEGER (Google Workspace numeric ID),
-- not UUID. The auth identity is stored in the `id` column (uuid primary key).
-- Ownership is expressed as id = auth.uid().
DROP POLICY IF EXISTS "workspace_accounts_write" ON public.workspace_accounts;
CREATE POLICY "workspace_accounts_select" ON public.workspace_accounts
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
CREATE POLICY "workspace_accounts_insert" ON public.workspace_accounts
  FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "workspace_accounts_update" ON public.workspace_accounts
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid())) WITH CHECK (id = (SELECT auth.uid()));
CREATE POLICY "workspace_accounts_delete" ON public.workspace_accounts
  FOR DELETE TO authenticated USING (id = (SELECT auth.uid()));

-- ── GROUP B: Per-operation policies with IS NOT NULL + user_id column ─────────
-- These tables already have individual SELECT/INSERT/UPDATE/DELETE policies but
-- all use IS NOT NULL instead of user_id ownership checks.

-- 28. company_rfm_scores
DROP POLICY IF EXISTS "company_rfm_scores_select" ON public.company_rfm_scores;
DROP POLICY IF EXISTS "company_rfm_scores_insert" ON public.company_rfm_scores;
DROP POLICY IF EXISTS "company_rfm_scores_update" ON public.company_rfm_scores;
DROP POLICY IF EXISTS "company_rfm_scores_delete" ON public.company_rfm_scores;
CREATE POLICY "company_rfm_scores_select" ON public.company_rfm_scores
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "company_rfm_scores_insert" ON public.company_rfm_scores
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_rfm_scores_update" ON public.company_rfm_scores
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_rfm_scores_delete" ON public.company_rfm_scores
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 29. company_stakeholder_map
DROP POLICY IF EXISTS "company_stakeholder_map_select" ON public.company_stakeholder_map;
DROP POLICY IF EXISTS "company_stakeholder_map_insert" ON public.company_stakeholder_map;
DROP POLICY IF EXISTS "company_stakeholder_map_update" ON public.company_stakeholder_map;
DROP POLICY IF EXISTS "company_stakeholder_map_delete" ON public.company_stakeholder_map;
CREATE POLICY "company_stakeholder_map_select" ON public.company_stakeholder_map
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "company_stakeholder_map_insert" ON public.company_stakeholder_map
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_stakeholder_map_update" ON public.company_stakeholder_map
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "company_stakeholder_map_delete" ON public.company_stakeholder_map
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 30. relationship_score_history
DROP POLICY IF EXISTS "relationship_score_history_select" ON public.relationship_score_history;
DROP POLICY IF EXISTS "relationship_score_history_insert" ON public.relationship_score_history;
DROP POLICY IF EXISTS "relationship_score_history_update" ON public.relationship_score_history;
DROP POLICY IF EXISTS "relationship_score_history_delete" ON public.relationship_score_history;
CREATE POLICY "relationship_score_history_select" ON public.relationship_score_history
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "relationship_score_history_insert" ON public.relationship_score_history
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "relationship_score_history_update" ON public.relationship_score_history
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "relationship_score_history_delete" ON public.relationship_score_history
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 31. rfm_segment_config
DROP POLICY IF EXISTS "rfm_segment_config_select" ON public.rfm_segment_config;
DROP POLICY IF EXISTS "rfm_segment_config_insert" ON public.rfm_segment_config;
DROP POLICY IF EXISTS "rfm_segment_config_update" ON public.rfm_segment_config;
DROP POLICY IF EXISTS "rfm_segment_config_delete" ON public.rfm_segment_config;
CREATE POLICY "rfm_segment_config_select" ON public.rfm_segment_config
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_segment_config_insert" ON public.rfm_segment_config
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_segment_config_update" ON public.rfm_segment_config
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "rfm_segment_config_delete" ON public.rfm_segment_config
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- 32. trigger_bundles
DROP POLICY IF EXISTS "trigger_bundles_select" ON public.trigger_bundles;
DROP POLICY IF EXISTS "trigger_bundles_insert" ON public.trigger_bundles;
DROP POLICY IF EXISTS "trigger_bundles_update" ON public.trigger_bundles;
DROP POLICY IF EXISTS "trigger_bundles_delete" ON public.trigger_bundles;
CREATE POLICY "trigger_bundles_select" ON public.trigger_bundles
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_bundles_insert" ON public.trigger_bundles
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_bundles_update" ON public.trigger_bundles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "trigger_bundles_delete" ON public.trigger_bundles
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  remaining_isnull_with_userid int;
  tables_fixed int;
BEGIN
  -- Count IS NOT NULL policies that remain on tables WITH user_id columns
  WITH isnull_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    WHERE (
      pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NOT NULL%'
      OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%IS NOT NULL%'
    )
  ),
  user_id_tables AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_attribute a
    JOIN pg_class t ON t.oid = a.attrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    WHERE a.attname = 'user_id' AND a.attnum > 0 AND NOT a.attisdropped
  )
  SELECT COUNT(*) INTO remaining_isnull_with_userid
  FROM isnull_tables i
  JOIN user_id_tables u ON u.tablename = i.tablename;

  IF remaining_isnull_with_userid = 0 THEN
    RAISE NOTICE '[Wave 171] All IS NOT NULL policies on user_id tables replaced with ownership checks. Cross-tenant data leak closed.';
  ELSE
    RAISE WARNING '[Wave 171] % tables still have IS NOT NULL policies with a user_id column', remaining_isnull_with_userid;
  END IF;
END;
$$;
