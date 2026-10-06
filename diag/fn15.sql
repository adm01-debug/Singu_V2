\pset pager off
BEGIN;
\i supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql
CREATE EXTENSION IF NOT EXISTS plpgsql_check;
SELECT p.proname, r.* FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace,
  LATERAL plpgsql_check_function_tb(p.oid, fatal_errors => false) r
 WHERE n.nspname='public' AND p.proname IN ('cleanup_behavioral_regen_queue','compute_account_health','compute_attribution','compute_revops_kpis','cs_renewal_pipeline','dismiss_revops_alert','enroll_contact_in_workflow','evaluate_mql','get_connection_metrics','get_marketing_funnel_stats','get_score_explicability','move_deal_atomic','publish_mtta_sla_breach_alert','seed_conversation_topics','seed_forecast_period');
SELECT r.* FROM plpgsql_check_function_tb('public.log_deal_status_change()'::regprocedure, 'public.deals'::regclass, fatal_errors => false) r;
SELECT r.* FROM plpgsql_check_function_tb('public.trigger_log_deal_activity()'::regprocedure, 'public.deals'::regclass, fatal_errors => false) r;
ROLLBACK;
