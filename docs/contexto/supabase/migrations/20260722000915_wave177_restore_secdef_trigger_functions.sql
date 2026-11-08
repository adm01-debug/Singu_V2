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
