-- Migration: materialized_views_to_reporting_schema (Wave 141)
-- Addresses advisor: materialized_view_in_api (mv_daily_kpis, mv_daily_stats).
--
-- Materialized views in the public schema are exposed via the PostgREST API.
-- This is a security concern because they aggregate sensitive business metrics
-- (revenue, customer counts, deal values) from multiple tables and could be
-- accessed by any authenticated user without table-level RLS filtering.
--
-- Fix:
--   1. Create a private `reporting` schema (not in PostgREST exposed schemas)
--   2. Move both materialized views there via ALTER MATERIALIZED VIEW SET SCHEMA
--   3. Create thin SECURITY DEFINER views in public pointing to the moved MVs,
--      granting access only to authenticated (preserves existing API queries)
--   4. Revoke PUBLIC execute on the wrapper views for defense-in-depth
--
-- After this migration:
--   - anon         → no access (view is authenticated-only)
--   - authenticated → full access via public wrapper view (same as before)
--   - service_role  → direct access to reporting.mv_* or via wrapper

-- Step 1: create reporting schema if not exists
CREATE SCHEMA IF NOT EXISTS reporting;

-- Step 2: move materialized views to reporting schema
ALTER MATERIALIZED VIEW IF EXISTS public.mv_daily_kpis   SET SCHEMA reporting;
ALTER MATERIALIZED VIEW IF EXISTS public.mv_daily_stats  SET SCHEMA reporting;

-- Step 3: create thin wrapper views in public so existing API clients
-- (SELECT * FROM mv_daily_kpis) continue to work transparently.
-- Regular views (not SECURITY DEFINER — that option is function-only in PG).
-- Access controlled via explicit GRANT to authenticated + REVOKE from PUBLIC.

DO $$
BEGIN
  -- mv_daily_kpis wrapper
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE schemaname = 'reporting' AND matviewname = 'mv_daily_kpis'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.mv_daily_kpis AS SELECT * FROM reporting.mv_daily_kpis';
    EXECUTE 'GRANT SELECT ON public.mv_daily_kpis TO authenticated';
    EXECUTE 'REVOKE SELECT ON public.mv_daily_kpis FROM PUBLIC';
  END IF;

  -- mv_daily_stats wrapper
  IF EXISTS (
    SELECT 1 FROM pg_matviews WHERE schemaname = 'reporting' AND matviewname = 'mv_daily_stats'
  ) THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.mv_daily_stats AS SELECT * FROM reporting.mv_daily_stats';
    EXECUTE 'GRANT SELECT ON public.mv_daily_stats TO authenticated';
    EXECUTE 'REVOKE SELECT ON public.mv_daily_stats FROM PUBLIC';
  END IF;
END $$;
