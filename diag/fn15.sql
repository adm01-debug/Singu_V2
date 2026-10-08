\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'DEF|' || proname || '|' || pg_get_function_identity_arguments(p.oid) || '|defaults=' || p.pronargdefaults
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND proname IN ('get_seasonality_analysis','export_contacts_csv','export_companies_csv','complete_task','get_pending_tasks','get_best_contact_times','get_daily_summary','create_reminder','advanced_company_search','get_overdue_tasks','get_pending_followups','create_quick_interaction','create_contact','create_company','update_territory','get_ai_recommendation_logs','search_contacts_fuzzy','fuzzy_search_companies','autocomplete_companies','find_contacts_by_role','get_incomplete_companies','get_company_timeline','get_interaction_history','get_channel_analysis','get_conversion_funnel','upsert_contact_email','create_quick_interaction')
ORDER BY proname;
