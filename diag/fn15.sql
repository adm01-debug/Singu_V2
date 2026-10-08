\pset format unaligned
\pset tuples_only on
SELECT 'FN|' || p.proname || '|' || pg_get_function_arguments(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN
 ('get_all_tasks','get_tasks_by_contact','reopen_task','update_territory',
  'approve_follow_up','reject_follow_up','get_ai_recommendation_logs')
ORDER BY p.proname;
