\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'SIG|' || proname || '|' || pg_get_function_identity_arguments(p.oid) || ' -> ' || pg_get_function_result(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('get_company_health_score','get_company_workflow_state','calculate_engagement_score','calculate_priority_score')
ORDER BY proname;
