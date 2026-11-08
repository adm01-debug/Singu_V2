-- Migration: fix_security_definer_views (Wave 142)
-- Fixes advisor ERROR: security_definer_view on mv_daily_kpis and mv_daily_stats.
--
-- Sets security_invoker = on so views run in the caller's security context,
-- not the owner's. Grants reporting schema access to authenticated so callers
-- can resolve the underlying materialized views.

GRANT USAGE ON SCHEMA reporting TO authenticated;
GRANT SELECT ON reporting.mv_daily_kpis  TO authenticated;
GRANT SELECT ON reporting.mv_daily_stats TO authenticated;

ALTER VIEW public.mv_daily_kpis  SET (security_invoker = on);
ALTER VIEW public.mv_daily_stats SET (security_invoker = on);
