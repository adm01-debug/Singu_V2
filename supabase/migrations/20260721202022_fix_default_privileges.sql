-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721202022
-- nome:   fix_default_privileges

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
