\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'COL|' || column_name || '|' || data_type || '|' || is_generated || '|' || COALESCE(generation_expression,'') 
FROM information_schema.columns 
WHERE table_schema='public' AND table_name='contacts' AND (column_name LIKE '%name%' OR is_generated='ALWAYS')
ORDER BY column_name;
SELECT 'SIG|' || proname || '|' || pg_get_function_identity_arguments(oid) || ' -> ' || pg_get_function_result(oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('get_company_health_score','get_company_workflow_state','calculate_engagement_score','calculate_priority_score')
ORDER BY proname;
