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

REVOKE SELECT ON public.mv_daily_kpis  FROM anon;
REVOKE SELECT ON public.mv_daily_stats FROM anon;
GRANT  SELECT ON public.mv_daily_kpis  TO authenticated;
GRANT  SELECT ON public.mv_daily_stats TO authenticated;
