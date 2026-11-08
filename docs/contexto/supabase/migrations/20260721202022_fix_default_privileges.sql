-- Migration: fix_default_privileges (Wave 150)
-- ROOT CAUSE FIX: Changes default privilege templates so future objects
-- created by postgres in public and _dormant schemas do not auto-grant
-- access to anon. Current defaults give anon=arwdDxtm on tables,
-- anon=rwU on sequences, anon=X on functions — all incorrect.

-- Public schema: revoke anon from all future objects
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- _dormant schema: revoke all from anon and authenticated
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA _dormant
  REVOKE ALL ON TABLES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA _dormant
  REVOKE ALL ON TABLES FROM authenticated;
