\set ON_ERROR_STOP 1
BEGIN;
SET LOCAL statement_timeout = '600s';
\i supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql
INSERT INTO supabase_migrations.schema_migrations (version, name)
VALUES ('20261008120000', 'fix_frontend_rpcs_canonical')
ON CONFLICT (version) DO NOTHING;
COMMIT;
CREATE EXTENSION IF NOT EXISTS plpgsql_check;
\pset format unaligned
\pset tuples_only on
SELECT 'MISSING|' || proname FROM (VALUES
  ('get_all_tasks'),('get_tasks_by_contact'),('reopen_task'),('update_territory'),
  ('approve_follow_up'),('reject_follow_up'),('get_ai_recommendation_logs')) v(proname)
WHERE to_regprocedure('public.' || proname) IS NULL;
SELECT 'ERR|' || p.proname || '|' || e.lineno || '|' || e.sqlstate || '|' || e.message
FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
JOIN pg_language l ON l.oid=p.prolang AND l.lanname='plpgsql'
CROSS JOIN LATERAL plpgsql_check_function_tb(p.oid, fatal_errors => false, other_warnings => false, extra_warnings => false, performance_warnings => false) e
WHERE n.nspname='public' AND e.level='error' AND p.proname IN (
  'get_daily_summary','get_conversion_funnel','create_contact','update_contact','upsert_contact_email',
  'check_relationship_consistency','find_contacts_by_role','get_contacts_by_role','search_contacts_fuzzy',
  'export_contacts_csv','create_company','advanced_company_search','autocomplete_companies',
  'fuzzy_search_companies','get_company_360_view','get_company_timeline','export_companies_csv',
  'get_incomplete_companies','create_quick_interaction','get_interaction_history','get_pending_followups',
  'complete_followup','get_channel_analysis','get_best_contact_times','complete_task','create_reminder',
  'get_overdue_tasks','get_pending_tasks','get_seasonality_analysis','assign_territory',
  'get_all_tasks','get_tasks_by_contact','reopen_task','update_territory','approve_follow_up',
  'reject_follow_up','get_ai_recommendation_logs')
ORDER BY p.proname;
SELECT 'LEDGER|' || version || '|' || name FROM supabase_migrations.schema_migrations WHERE version='20261008120000';
