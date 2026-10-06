\pset pager off
\echo ### views_anon
SELECT c.relname||'|'||c.relkind::text||'|'||coalesce(array_to_string(c.reloptions,';'),'') FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relkind IN ('v','m') AND has_table_privilege('anon',c.oid,'SELECT') ORDER BY 1;
\echo ### anon_funcs
SELECT p.oid::regprocedure::text||'|'||p.prosecdef::text FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.prokind='f' AND has_function_privilege('anon',p.oid,'EXECUTE') ORDER BY 1;
\echo ### default_acl
SELECT pg_get_userbyid(defaclrole)||'|'||defaclobjtype::text||'|'||array_to_string(defaclacl,',') FROM pg_default_acl WHERE defaclnamespace IN (0,'public'::regnamespace);
\echo ### authenticator
SELECT rolname||'|'||coalesce(array_to_string(rolconfig,';'),'') FROM pg_roles WHERE rolname IN ('authenticator','anon','authenticated');
\echo ### lps_defaults
SELECT column_name||'|'||coalesce(column_default,'') FROM information_schema.columns WHERE table_schema='public' AND table_name='landing_page_submissions' AND column_default IS NOT NULL;
\echo ### deals
SELECT to_regclass('public.deals')::text, (SELECT count(*) FROM public.deals), (SELECT max(updated_at) FROM public.deals);
\echo ### defs
SELECT '>>>'||p.oid::regprocedure::text||E'\n'||pg_get_functiondef(p.oid) FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('move_deal_atomic','compute_account_health','compute_revops_kpis','cs_renewal_pipeline','dismiss_revops_alert','enroll_contact_in_workflow','evaluate_mql','get_connection_metrics','get_marketing_funnel_stats','get_score_explicability','seed_conversation_topics','seed_forecast_period','publish_mtta_sla_breach_alert','compute_attribution','cleanup_behavioral_regen_queue') ORDER BY 1;
