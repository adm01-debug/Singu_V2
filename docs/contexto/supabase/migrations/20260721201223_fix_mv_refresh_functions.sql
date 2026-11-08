-- Migration: fix_mv_refresh_functions (Wave 147)
-- CRITICAL: Wave 141 moved MVs to reporting schema but refresh functions
-- still pointed to public. Fixes REFRESH MATERIALIZED VIEW resolution failure.

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
