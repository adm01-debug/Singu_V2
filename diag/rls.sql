\pset pager off
BEGIN;
\i supabase/migrations/20261006120000_least_privilege_canonical.sql
\i supabase/migrations/20261006120100_storage_buckets_singu.sql
\echo ### definers
SELECT p.proname||'('||pg_get_function_identity_arguments(p.oid)||')|anon='||has_function_privilege('anon',p.oid,'EXECUTE')::text||'|auth='||has_function_privilege('authenticated',p.oid,'EXECUTE')::text||'|uid='||(p.prosrc ILIKE '%auth.uid()%')::text AS x FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prosecdef ORDER BY 1;
ROLLBACK;
