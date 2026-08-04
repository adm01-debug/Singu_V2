-- Migration: wave173_idx_and_final_isnull_fix (Wave 173)
-- Combines two fixes:
--
-- PART A — SECURITY: Fix 4 remaining IS NOT NULL SELECT policies on tables with
--   uuid user_id columns. These are backend-computed tables (churn_predictions,
--   deal_velocity_analysis) and per-user caches (search_products_cache,
--   semantic_search_cache). Users should only read their own rows.
--
-- PART B — PERFORMANCE: Add user_id indexes to 23 tables that received
--   ownership-scoped policies in Wave 171 but had no user_id index.
--   Without indexes, RLS USING (user_id = ...) causes full table scans.

-- ── PART A: Final IS NOT NULL SELECT policy fixes ────────────────────────────

-- 1. churn_predictions — drop IS NOT NULL read_only_auth, add user-scoped SELECT
DROP POLICY IF EXISTS "read_only_auth" ON public.churn_predictions;
CREATE POLICY "churn_predictions_select" ON public.churn_predictions
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 2. deal_velocity_analysis — same fix
DROP POLICY IF EXISTS "read_only_auth" ON public.deal_velocity_analysis;
CREATE POLICY "deal_velocity_analysis_select" ON public.deal_velocity_analysis
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 3. search_products_cache — per-user cache read
DROP POLICY IF EXISTS "authenticated_read" ON public.search_products_cache;
CREATE POLICY "search_products_cache_select" ON public.search_products_cache
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- 4. semantic_search_cache — per-user cache read
DROP POLICY IF EXISTS "authenticated_read" ON public.semantic_search_cache;
CREATE POLICY "semantic_search_cache_select" ON public.semantic_search_cache
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- ── PART B: user_id indexes for Wave 171 policy tables ───────────────────────
-- 23 tables received ownership-scoped RLS policies in Wave 171 but lacked
-- user_id indexes, causing seq scans on every authenticated REST query.
-- connector_log excluded — references user_id via join, not a direct column.

CREATE INDEX IF NOT EXISTS idx_activity_feed_user_id
  ON public.activity_feed (user_id);

CREATE INDEX IF NOT EXISTS idx_cadence_enrollments_user_id
  ON public.cadence_enrollments (user_id);

CREATE INDEX IF NOT EXISTS idx_commissions_user_id
  ON public.commissions (user_id);

CREATE INDEX IF NOT EXISTS idx_company_cadences_user_id
  ON public.company_cadences (user_id);

CREATE INDEX IF NOT EXISTS idx_company_stakeholder_map_user_id
  ON public.company_stakeholder_map (user_id);

CREATE INDEX IF NOT EXISTS idx_interaction_templates_user_id
  ON public.interaction_templates (user_id);

CREATE INDEX IF NOT EXISTS idx_query_telemetry_user_id
  ON public.query_telemetry (user_id);

CREATE INDEX IF NOT EXISTS idx_relationship_score_history_user_id
  ON public.relationship_score_history (user_id);

CREATE INDEX IF NOT EXISTS idx_rfm_history_user_id
  ON public.rfm_history (user_id);

CREATE INDEX IF NOT EXISTS idx_sales_goals_user_id
  ON public.sales_goals (user_id);

CREATE INDEX IF NOT EXISTS idx_schema_drift_alerts_user_id
  ON public.schema_drift_alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_score_history_user_id
  ON public.score_history (user_id);

CREATE INDEX IF NOT EXISTS idx_sla_violations_user_id
  ON public.sla_violations (user_id);

CREATE INDEX IF NOT EXISTS idx_social_behavior_analysis_user_id
  ON public.social_behavior_analysis (user_id);

CREATE INDEX IF NOT EXISTS idx_social_life_events_user_id
  ON public.social_life_events (user_id);

CREATE INDEX IF NOT EXISTS idx_social_profiles_user_id
  ON public.social_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_social_scraping_schedule_user_id
  ON public.social_scraping_schedule (user_id);

CREATE INDEX IF NOT EXISTS idx_stakeholder_alerts_user_id
  ON public.stakeholder_alerts (user_id);

CREATE INDEX IF NOT EXISTS idx_trigger_ab_tests_user_id
  ON public.trigger_ab_tests (user_id);

CREATE INDEX IF NOT EXISTS idx_trigger_bundles_user_id
  ON public.trigger_bundles (user_id);

CREATE INDEX IF NOT EXISTS idx_trigger_usage_history_user_id
  ON public.trigger_usage_history (user_id);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_user_id
  ON public.weekly_reports (user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_kpis_user_id
  ON public.whatsapp_kpis (user_id);

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  isnull_user_id_count int;
  missing_idx_count    int;
BEGIN
  -- Check remaining IS NOT NULL on user_id tables
  WITH isnull_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    WHERE pg_get_expr(pol.polqual, pol.polrelid) LIKE '%IS NOT NULL%'
       OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%IS NOT NULL%'
  ),
  user_id_tables AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_attribute a
    JOIN pg_class t ON t.oid = a.attrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    WHERE a.attname = 'user_id' AND a.attnum > 0 AND NOT a.attisdropped
  )
  SELECT COUNT(*) INTO isnull_user_id_count
  FROM isnull_tables i JOIN user_id_tables u ON u.tablename = i.tablename;

  IF isnull_user_id_count = 0 THEN
    RAISE NOTICE '[Wave 173] Zero IS NOT NULL policies remain on user_id tables. Security clean.';
  ELSE
    RAISE WARNING '[Wave 173] % tables still have IS NOT NULL policies with user_id', isnull_user_id_count;
  END IF;

  -- Check remaining user_id policy tables without indexes (excluding connector_log)
  WITH rls_tables AS (
    SELECT DISTINCT cl.relname AS tablename
    FROM pg_policy pol
    JOIN pg_class cl ON pol.polrelid = cl.oid
    JOIN pg_namespace ns ON ns.oid = cl.relnamespace AND ns.nspname = 'public'
    WHERE (pg_get_expr(pol.polqual, pol.polrelid) LIKE '%user_id%'
        OR pg_get_expr(pol.polwithcheck, pol.polrelid) LIKE '%user_id%')
      AND cl.relname <> 'connector_log'
  ),
  indexed AS (
    SELECT DISTINCT t.relname AS tablename
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE a.attname = 'user_id'
  )
  SELECT COUNT(*) INTO missing_idx_count
  FROM rls_tables rt LEFT JOIN indexed i ON i.tablename = rt.tablename
  WHERE i.tablename IS NULL;

  IF missing_idx_count = 0 THEN
    RAISE NOTICE '[Wave 173] All RLS user_id-filtered tables have user_id indexes. Performance clean.';
  ELSE
    RAISE WARNING '[Wave 173] % tables still missing user_id index', missing_idx_count;
  END IF;
END;
$$;
