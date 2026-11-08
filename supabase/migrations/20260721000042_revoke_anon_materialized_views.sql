-- Migration: revoke_anon_materialized_views (Wave 128)
-- Addresses materialized_view_in_api advisor warnings for mv_daily_kpis and
-- mv_daily_stats. Materialized views cannot have RLS policies, so access
-- control must be applied via GRANT/REVOKE.
--
-- Both views aggregate sensitive business intelligence (revenue totals, customer
-- counts, deal pipeline values). Unauthenticated callers must not be able to
-- read this data via the REST API. Authenticated dashboard users retain access.

DO $migration$
DECLARE
  view_name text;
BEGIN
  FOREACH view_name IN ARRAY ARRAY['mv_daily_kpis', 'mv_daily_stats']
  LOOP
    IF to_regclass(format('public.%I', view_name)) IS NOT NULL THEN
      EXECUTE format('REVOKE SELECT ON public.%I FROM anon', view_name);
      EXECUTE format('GRANT SELECT ON public.%I TO authenticated', view_name);
    END IF;
  END LOOP;
END;
$migration$;
