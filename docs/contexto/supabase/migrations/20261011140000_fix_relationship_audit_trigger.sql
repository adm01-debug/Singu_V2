-- O histórico é gravado pelo gatilho; clientes continuam sem INSERT direto.
ALTER FUNCTION public.log_contact_relationship_changes() SECURITY DEFINER;
ALTER FUNCTION public.log_contact_relationship_changes() SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.log_contact_relationship_changes() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_contact_relationship_changes() TO service_role;

-- DOWN MIGRATION (Rollback)
-- BEGIN;
-- ALTER FUNCTION public.log_contact_relationship_changes() SECURITY INVOKER;
-- ALTER FUNCTION public.log_contact_relationship_changes() SET search_path = public;
-- COMMIT;
