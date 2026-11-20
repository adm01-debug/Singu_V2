-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200213
-- nome:   materialized_views_to_reporting_schema

-- Migration: materialized_views_to_reporting_schema (Wave 141)
-- Moves mv_daily_kpis and mv_daily_stats from public (API-exposed) to reporting
-- schema (private). Creates thin wrapper views in public for backward compat.
-- Fixes advisor: materialized_view_in_api.

-- Step 1: create reporting schema if not exists
CREATE SCHEMA IF NOT EXISTS reporting;

-- Step 2: move materialized views to reporting schema
ALTER MATERIALIZED VIEW IF EXISTS public.mv_daily_kpis   SET SCHEMA reporting;
ALTER MATERIALIZED VIEW IF EXISTS public.mv_daily_stats  SET SCHEMA reporting;

-- Step 3: create thin wrapper views in public so existing API clients
-- (SELECT * FROM mv_daily_kpis) continue to work transparently.
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
