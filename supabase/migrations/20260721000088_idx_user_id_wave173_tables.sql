-- Migration: idx_user_id_wave173_tables (Wave 174)
-- PERFORMANCE FIX: 3 tables received ownership-scoped RLS policies in Wave 173
-- (Part A — IS NOT NULL fix) but still lacked user_id indexes. Without indexes,
-- every authenticated REST query against these tables causes a sequential scan.
--
-- Tables fixed:
--   churn_predictions      — SELECT policy added in Wave 173 Part A
--   deal_velocity_analysis — SELECT policy added in Wave 173 Part A
--   search_products_cache  — SELECT policy added in Wave 173 Part A
-- (semantic_search_cache already had an index from Wave 168)

CREATE INDEX IF NOT EXISTS idx_churn_predictions_user_id
  ON public.churn_predictions (user_id);

CREATE INDEX IF NOT EXISTS idx_deal_velocity_analysis_user_id
  ON public.deal_velocity_analysis (user_id);

CREATE INDEX IF NOT EXISTS idx_search_products_cache_user_id
  ON public.search_products_cache (user_id);

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  missing_count int;
BEGIN
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
  SELECT COUNT(*) INTO missing_count
  FROM rls_tables rt LEFT JOIN indexed i ON i.tablename = rt.tablename
  WHERE i.tablename IS NULL;

  IF missing_count = 0 THEN
    RAISE NOTICE '[Wave 174] All RLS user_id-filtered tables now have user_id indexes. Performance fully clean.';
  ELSE
    RAISE WARNING '[Wave 174] % tables still missing user_id index', missing_count;
  END IF;
END;
$$;
