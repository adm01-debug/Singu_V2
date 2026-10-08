\set ON_ERROR_STOP 1
SELECT t.typname, e.enumlabel FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid
 WHERE t.typname IN ('company_status','email_type','phone_type') ORDER BY 1, e.enumsortorder;
SELECT DISTINCT status FROM alerts;
SELECT p.proname, p.prosecdef FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public' AND p.proname IN ('calculate_engagement_score','calculate_priority_score',
'get_company_health_score','get_company_workflow_state','assert_self_user_id','assert_company_access',
'assert_task_access','assert_contact_access','assert_interaction_access','move_deal_atomic') ORDER BY 1;
