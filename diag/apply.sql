\set ON_ERROR_STOP 1
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
SELECT version FROM supabase_migrations.schema_migrations WHERE version IN ('20261006120000','20261006120100');
\i supabase/migrations/20261006120000_least_privilege_canonical.sql
\i supabase/migrations/20261006120100_storage_buckets_singu.sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
SELECT v, n FROM (VALUES ('20261006120000','least_privilege_canonical'),('20261006120100','storage_buckets_singu')) t(v,n)
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations s WHERE s.version = t.v)
RETURNING version, name;
COMMIT;
SELECT version, name FROM supabase_migrations.schema_migrations WHERE version >= '20261006120000' ORDER BY 1;
