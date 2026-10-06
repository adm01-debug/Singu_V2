\set ON_ERROR_STOP 1
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20261006130000';
\i supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
SELECT '20261006130000', 'frontend_rpcs_authenticated'
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261006130000')
RETURNING version, name;
COMMIT;
SELECT version, name FROM supabase_migrations.schema_migrations WHERE version >= '20261006120000' ORDER BY 1;
SELECT p.proname, has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth, has_function_privilege('anon', p.oid, 'EXECUTE') AS anon
  FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace AND p.proname IN ('move_deal_atomic','compute_revops_kpis','evaluate_mql','seed_forecast_period') ORDER BY 1;
