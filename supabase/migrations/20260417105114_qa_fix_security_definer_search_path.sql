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

-- Corrigir as 4 funções SECURITY DEFINER sem search_path.
-- audit_companies_trigger/auto_calculate_lead_score/mark_customer_on_deal_won
-- nunca existiram em producao (nao estao no dump nem em mig alguma); log_deal_status_change existe.
-- IF EXISTS para nao quebrar replay local.
DO $fnc$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='audit_companies_trigger') THEN
    ALTER FUNCTION public.audit_companies_trigger() SET search_path = public, pg_temp;
  END IF;
END;
$fnc$;
DO $fnc$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='auto_calculate_lead_score') THEN
    ALTER FUNCTION public.auto_calculate_lead_score() SET search_path = public, pg_temp;
  END IF;
END;
$fnc$;
DO $fnc$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='log_deal_status_change') THEN
    ALTER FUNCTION public.log_deal_status_change() SET search_path = public, pg_temp;
  END IF;
END;
$fnc$;
DO $fnc$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='mark_customer_on_deal_won') THEN
    ALTER FUNCTION public.mark_customer_on_deal_won() SET search_path = public, pg_temp;
  END IF;
END;
$fnc$;