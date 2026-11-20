-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194745
-- nome:   revoke_anon_materialized_views

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
