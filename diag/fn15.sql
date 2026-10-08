\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
\echo '=== COLS ==='
SELECT table_name||'|'||column_name||'|'||data_type FROM information_schema.columns
 WHERE table_schema='public' ORDER BY table_name, ordinal_position;
\echo '=== DEFS ==='
SELECT 'DEF|'||p.oid::regprocedure::text||E'\n'||pg_get_functiondef(p.oid)||E'\nENDDEF'
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN (
'advanced_company_search','assign_territory','autocomplete_companies',
'check_relationship_consistency','complete_followup','complete_task',
'create_company','create_contact','create_quick_interaction','create_reminder',
'export_companies_csv','export_contacts_csv','find_contacts_by_role',
'fuzzy_search_companies','get_best_contact_times','get_channel_analysis',
'get_company_360_view','get_company_timeline','get_contacts_by_role',
'get_conversion_funnel','get_daily_summary','get_incomplete_companies',
'get_interaction_history','get_overdue_tasks','get_pending_followups',
'get_pending_tasks','get_seasonality_analysis','search_contacts_fuzzy',
'update_contact','upsert_contact_email',
'approve_follow_up','get_ai_recommendation_logs','get_all_tasks',
'get_tasks_by_contact','reject_follow_up','reopen_task','update_territory',
'reminders','tasks','followups','interactions')
ORDER BY p.proname;
