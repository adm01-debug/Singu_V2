-- Migration: revoke_anon_materialized_views (Wave 128)
-- Addresses materialized_view_in_api advisor warnings for mv_daily_kpis and
-- mv_daily_stats. Materialized views cannot have RLS policies, so access
-- control must be applied via GRANT/REVOKE.
--
-- Both views aggregate sensitive business intelligence (revenue totals, customer
-- counts, deal pipeline values). Unauthenticated callers must not be able to
-- read this data via the REST API. Authenticated dashboard users retain access.

REVOKE SELECT ON public.mv_daily_kpis  FROM anon;
REVOKE SELECT ON public.mv_daily_stats FROM anon;

-- Ensure authenticated role retains SELECT (these are dashboard KPI views)
GRANT  SELECT ON public.mv_daily_kpis  TO authenticated;
GRANT  SELECT ON public.mv_daily_stats TO authenticated;
