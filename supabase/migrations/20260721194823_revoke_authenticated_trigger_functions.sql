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

REVOKE EXECUTE ON FUNCTION public.audit_companies_trigger()         FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_fn()               FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_trigger_func()             FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_calculate_lead_score()      FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.companies_search_vector_update() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_singu_profile()       FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_deal_status_change()         FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_customer_on_deal_won()      FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at()                 FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.singu_audit_trigger_fn()         FROM authenticated;
