-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260722000915
-- nome:   wave177_restore_secdef_trigger_functions

-- Wave 177: Restore SECURITY DEFINER for auth-chain trigger functions
-- handle_new_user fires on auth.users INSERT (cross-schema trigger — auth.uid() is NULL in that
-- context, so SECURITY INVOKER breaks profile creation for every new signup).
-- handle_new_singu_profile fires on public.profiles INSERT that handle_new_user initiates.
-- Both must remain SECURITY DEFINER so they run as postgres (owner) and bypass RLS.

ALTER FUNCTION public.handle_new_user() SECURITY DEFINER;
ALTER FUNCTION public.handle_new_singu_profile() SECURITY DEFINER;

-- Harden the search_path so these SECURITY DEFINER functions cannot be tricked via
-- a malicious public-schema object shadowing pg_catalog or auth functions.
ALTER FUNCTION public.handle_new_user() SET search_path = public, auth, extensions;
ALTER FUNCTION public.handle_new_singu_profile() SET search_path = public, auth, extensions;
