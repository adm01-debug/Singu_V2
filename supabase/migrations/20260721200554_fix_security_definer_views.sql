-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200554
-- nome:   fix_security_definer_views

-- Migration: fix_security_definer_views (Wave 142)
-- Fixes advisor ERROR: security_definer_view on mv_daily_kpis and mv_daily_stats.
--
-- Sets security_invoker = on so views run in the caller's security context,
-- not the owner's. Grants reporting schema access to authenticated so callers
-- can resolve the underlying materialized views.

DO $migration$
DECLARE
  view_name text;
BEGIN
  IF to_regnamespace('reporting') IS NOT NULL THEN
    GRANT USAGE ON SCHEMA reporting TO authenticated;
  END IF;

  FOREACH view_name IN ARRAY ARRAY['mv_daily_kpis', 'mv_daily_stats']
  LOOP
    IF to_regclass(format('reporting.%I', view_name)) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT ON reporting.%I TO authenticated', view_name);
    END IF;

    IF EXISTS (
      SELECT 1
      FROM pg_class
      WHERE oid = to_regclass(format('public.%I', view_name))
        AND relkind = 'v'
    ) THEN
      EXECUTE format(
        'ALTER VIEW public.%I SET (security_invoker = on)',
        view_name
      );
    END IF;
  END LOOP;
END;
$migration$;
