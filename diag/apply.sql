\set ON_ERROR_STOP 1
BEGIN;
SET LOCAL lock_timeout = '5s';
SELECT count(*) AS ja_registrada FROM supabase_migrations.schema_migrations WHERE version = '20261005230000';
\i diag/fix.sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
SELECT '20261005230000', 'fix_contacts_companies_write_triggers'
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261005230000');
COMMIT;
SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' AND ((table_name IN ('contacts','companies') AND column_name='version') OR (table_name='competitors' AND column_name='updated_at')) ORDER BY 1;
SELECT version, name FROM supabase_migrations.schema_migrations WHERE version = '20261005230000';
