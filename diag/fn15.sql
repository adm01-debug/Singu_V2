\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'SIG|' || proname || '|' || pg_get_function_identity_arguments(p.oid)
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('complete_task','reopen_task','get_tasks_by_contact','get_all_tasks','get_pending_tasks','get_overdue_tasks','approve_follow_up','reject_follow_up','get_ai_recommendation_logs','get_best_contact_times','get_conversion_funnel','get_daily_summary','get_channel_analysis','get_seasonality_analysis','get_interaction_history','get_incomplete_companies','autocomplete_companies','fuzzy_search_companies','search_contacts_fuzzy','find_contacts_by_role','export_contacts_csv','export_companies_csv','update_territory','assign_territory','create_reminder','create_company','create_contact','update_contact','create_quick_interaction','complete_followup','get_pending_followups','get_company_360_view','get_company_timeline','advanced_company_search','check_relationship_consistency','get_contacts_by_role','upsert_contact_email','approve_follow_up')
ORDER BY proname, 2;
