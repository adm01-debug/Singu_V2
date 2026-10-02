-- Migration: fix_default_privileges (Wave 150)
-- ROOT CAUSE FIX: Default privileges for the postgres role in public and
-- _dormant schemas automatically grant broad access to anon (and authenticated)
-- on every new object created in those schemas. This means all our REVOKE
-- operations on existing objects must be repeated for each future object,
-- unless we fix the default privilege templates.
--
-- Current default privileges (postgres grantor):
--   public FUNCTION:  {postgres=X, anon=X, authenticated=X, service_role=X}
--   public SEQUENCE:  {postgres=rwU, anon=rwU, authenticated=rwU, service_role=rwU}
--   public TABLE:     {postgres=arwdDxtm, anon=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm}
--   _dormant TABLE:   {anon=r, authenticated=r}
--
-- After this migration, new objects created by postgres will default to:
--   public FUNCTION:  {postgres=X, authenticated=X, service_role=X}  (no anon)
--   public SEQUENCE:  {postgres=rwU, authenticated=rwU, service_role=rwU}  (no anon)
--   public TABLE:     {postgres=arwdDxtm, authenticated=arwdDxtm, service_role=arwdDxtm}  (no anon)
--   _dormant TABLE:   {} (no default grants — service_role uses rolbypassrls)
--
-- Note: supabase_admin also sets default privileges which we cannot override.
-- These changes only affect objects subsequently created by the postgres role.

-- Public schema: revoke anon from all future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- _dormant schema: revoke all from anon and authenticated
-- (service_role uses BYPASSRLS, so no policies or default grants needed)
DO $migration$
BEGIN
  IF to_regnamespace('_dormant') IS NOT NULL THEN
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA _dormant
      REVOKE ALL ON TABLES FROM anon;

    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA _dormant
      REVOKE ALL ON TABLES FROM authenticated;
  END IF;
END;
$migration$;
