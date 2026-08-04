-- Migration: fix_mv_refresh_functions (Wave 147)
-- CRITICAL BUG FIX: Wave 141 moved mv_daily_kpis and mv_daily_stats from
-- public to reporting schema, but the refresh functions (refresh_daily_kpis,
-- refresh_daily_stats) still use SET search_path TO 'public' and reference
-- the MVs without a schema prefix. This causes:
--   ERROR: relation "mv_daily_kpis" does not exist
-- because REFRESH MATERIALIZED VIEW resolves names against search_path, which
-- no longer contains the reporting schema, and public.mv_daily_kpis is now a
-- regular VIEW (not a materialized view).
--
-- Fix: update both functions to set search_path including reporting schema
-- and fully-qualify the MV references.

CREATE OR REPLACE FUNCTION public.refresh_daily_kpis()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'reporting', 'public', 'pg_catalog'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY reporting.mv_daily_kpis;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_daily_stats()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'reporting', 'public', 'pg_catalog'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY reporting.mv_daily_stats;
END;
$$;
