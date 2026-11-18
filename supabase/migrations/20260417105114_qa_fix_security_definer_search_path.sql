-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417105114
-- nome:   qa_fix_security_definer_search_path

-- Corrigir as 4 funções SECURITY DEFINER sem search_path
ALTER FUNCTION public.audit_companies_trigger() SET search_path = public, pg_temp;
ALTER FUNCTION public.auto_calculate_lead_score() SET search_path = public, pg_temp;
ALTER FUNCTION public.log_deal_status_change() SET search_path = public, pg_temp;
ALTER FUNCTION public.mark_customer_on_deal_won() SET search_path = public, pg_temp;
