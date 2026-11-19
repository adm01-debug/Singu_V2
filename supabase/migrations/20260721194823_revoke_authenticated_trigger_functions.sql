-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721194823
-- nome:   revoke_authenticated_trigger_functions

DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='audit_companies_trigger') THEN
    REVOKE EXECUTE ON FUNCTION public.audit_companies_trigger() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='audit_trigger_fn') THEN
    REVOKE EXECUTE ON FUNCTION public.audit_trigger_fn() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='audit_trigger_func') THEN
    REVOKE EXECUTE ON FUNCTION public.audit_trigger_func() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='auto_calculate_lead_score') THEN
    REVOKE EXECUTE ON FUNCTION public.auto_calculate_lead_score() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='companies_search_vector_update') THEN
    REVOKE EXECUTE ON FUNCTION public.companies_search_vector_update() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='handle_new_singu_profile') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_singu_profile() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='handle_new_user') THEN
    REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='log_deal_status_change') THEN
    REVOKE EXECUTE ON FUNCTION public.log_deal_status_change() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='mark_customer_on_deal_won') THEN
    REVOKE EXECUTE ON FUNCTION public.mark_customer_on_deal_won() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='set_updated_at') THEN
    REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;
  END IF;
END;
$fncheck$;
DO $fncheck$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname='singu_audit_trigger_fn') THEN
    REVOKE EXECUTE ON FUNCTION public.singu_audit_trigger_fn() FROM authenticated;
  END IF;
END;
$fncheck$;
