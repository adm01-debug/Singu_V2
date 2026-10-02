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

DO $policies$
DECLARE
  table_definition record;
BEGIN
  FOR table_definition IN
    SELECT *
    FROM (VALUES
      ('churn_predictions', 'read_only_auth'),
      ('deal_velocity_analysis', 'read_only_auth'),
      ('search_products_cache', 'authenticated_read'),
      ('semantic_search_cache', 'authenticated_read')
    ) AS tables(table_name, old_policy)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_definition.table_name))
        AND attname = 'user_id'
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        table_definition.old_policy,
        table_definition.table_name
      );
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON public.%I',
        table_definition.table_name || '_select',
        table_definition.table_name
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()))',
        table_definition.table_name || '_select',
        table_definition.table_name
      );
    END IF;
  END LOOP;
END;
$policies$;

-- ── PART B: user_id indexes for Wave 171 policy tables ───────────────────────
-- 23 tables received ownership-scoped RLS policies in Wave 171 but lacked
-- user_id indexes, causing seq scans on every authenticated REST query.
-- connector_log excluded — references user_id via join, not a direct column.

DO $indexes$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'activity_feed',
    'cadence_enrollments',
    'commissions',
    'company_cadences',
    'company_stakeholder_map',
    'interaction_templates',
    'query_telemetry',
    'relationship_score_history',
    'rfm_history',
    'sales_goals',
    'schema_drift_alerts',
    'score_history',
    'sla_violations',
    'social_behavior_analysis',
    'social_life_events',
    'social_profiles',
    'social_scraping_schedule',
    'stakeholder_alerts',
    'trigger_ab_tests',
    'trigger_bundles',
    'trigger_usage_history',
    'weekly_reports',
    'whatsapp_kpis'
  ]
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_attribute
      WHERE attrelid = to_regclass(format('public.%I', table_name))
        AND attname = 'user_id'
        AND NOT attisdropped
    ) THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (user_id)',
        'idx_' || table_name || '_user_id',
        table_name
      );
    END IF;
  END LOOP;
END;
$indexes$;

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
