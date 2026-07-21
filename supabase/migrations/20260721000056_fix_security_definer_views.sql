-- Migration: fix_security_definer_views (Wave 142)
-- Fixes advisor ERROR: security_definer_view on mv_daily_kpis and mv_daily_stats.
--
-- PostgreSQL views by default run with the view owner's permissions (implicit
-- SECURITY DEFINER behavior): the caller only needs SELECT on the view, not on
-- the underlying tables. This allows the view to bypass RLS on base tables.
--
-- PostgreSQL 15+ introduced the security_invoker view option, which makes the
-- view run with the CALLER's permissions instead of the owner's. This is the
-- secure-by-default behavior.
--
-- Fix:
--   1. Grant USAGE on reporting schema and SELECT on both MVs to authenticated,
--      so the caller has the necessary permissions when security_invoker is on.
--   2. Set security_invoker = on on both wrapper views.
--
-- After this migration:
--   - The views run in the caller's security context (not the owner's)
--   - authenticated can still query them (via explicit GRANT)
--   - anon has no access (no GRANT on reporting schema or views)
--   - advisor security_definer_view is cleared

GRANT USAGE ON SCHEMA reporting TO authenticated;
GRANT SELECT ON reporting.mv_daily_kpis  TO authenticated;
GRANT SELECT ON reporting.mv_daily_stats TO authenticated;

ALTER VIEW public.mv_daily_kpis  SET (security_invoker = on);
ALTER VIEW public.mv_daily_stats SET (security_invoker = on);
