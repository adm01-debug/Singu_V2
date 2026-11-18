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

GRANT USAGE ON SCHEMA reporting TO authenticated;
GRANT SELECT ON reporting.mv_daily_kpis  TO authenticated;
GRANT SELECT ON reporting.mv_daily_stats TO authenticated;

ALTER VIEW public.mv_daily_kpis  SET (security_invoker = on);
ALTER VIEW public.mv_daily_stats SET (security_invoker = on);
