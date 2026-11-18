-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721201223
-- nome:   fix_mv_refresh_functions

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
