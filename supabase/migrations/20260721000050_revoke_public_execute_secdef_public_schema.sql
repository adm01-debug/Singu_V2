-- Migration: revoke_public_execute_secdef_public_schema (Wave 136)
-- Removes the automatic PUBLIC EXECUTE grant from all SECURITY DEFINER
-- functions in the public schema.
--
-- PostgreSQL grants EXECUTE to PUBLIC by default when a function is created.
-- This means the `anon` role (and any other role) can call any function
-- through role inheritance — even without an explicit grant.
--
-- Revoking FROM PUBLIC closes this ambient access vector. Existing EXPLICIT
-- grants (authenticated=X, service_role=X) in proacl are unaffected, so
-- legitimate application RPCs continue to work normally.
--
-- After this migration:
--   anon         → no execute (neither via PUBLIC nor explicit)
--   authenticated → execute only via explicit grant (preserved)
--   service_role  → execute only via explicit grant (preserved)
--
-- This also means newly-created SECURITY DEFINER functions won't inherit
-- PUBLIC execute automatically — developers must GRANT explicitly, which
-- is the secure-by-default behavior we want.

DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proacl IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM aclexplode(p.proacl) ace
        WHERE ace.grantee = 0  -- OID 0 = PUBLIC
          AND ace.privilege_type = 'EXECUTE'
      )
    ORDER BY p.proname
  LOOP
    BEGIN
      EXECUTE format(
        'REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC',
        f.func_name, f.args
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not revoke PUBLIC execute on public.%(%): %',
        f.func_name, f.args, SQLERRM;
    END;
  END LOOP;
END $$;
