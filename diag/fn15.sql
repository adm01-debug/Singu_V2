\pset pager off
SELECT n.nspname, c.relname, c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relname ILIKE '%ai_gateway%' OR c.relname ILIKE 'system_alerts%' ORDER BY 1,2;
SELECT p.oid::regprocedure FROM pg_proc p WHERE p.proname ILIKE '%ai_gateway%' OR p.proname ILIKE '%system_alert%';
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='system_alerts' ORDER BY ordinal_position;
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_partman','pg_cron','pg_net','plpgsql_check');
SELECT count(*) FROM supabase_migrations.schema_migrations WHERE version BETWEEN '20260723152549' AND '20260723155033';
SELECT max(version), count(*) FROM supabase_migrations.schema_migrations;
