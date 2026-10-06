\pset pager off
SELECT p.proname, p.prosecdef FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('cleanup_behavioral_regen_queue','track_changes');
SELECT count(*) AS admins FROM public.user_roles WHERE role='admin';
SELECT left(pg_get_functiondef('public.track_changes()'::regprocedure), 1500);
SELECT action, entity_type, table_name, count(*), max(created_at) FROM public.audit_log WHERE coalesce(table_name, entity_type)='deals' GROUP BY 1,2,3;
SELECT jobname, schedule, active, left(command,200) FROM cron.job ORDER BY 1;
