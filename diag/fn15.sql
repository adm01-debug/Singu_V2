\pset pager off
\pset format unaligned
\pset tuples_only on
SELECT '#### '||p.oid::regprocedure||' definer='||p.prosecdef||' auth_exec='||has_function_privilege('authenticated',p.oid,'EXECUTE')||' cfg='||coalesce(array_to_string(p.proconfig,','),'')||E'\n'||pg_get_functiondef(p.oid)
FROM pg_proc p WHERE p.pronamespace='public'::regnamespace AND p.proname IN ('cleanup_behavioral_regen_queue','compute_account_health','compute_attribution','compute_revops_kpis','cs_renewal_pipeline','dismiss_revops_alert','enroll_contact_in_workflow','evaluate_mql','get_connection_metrics','get_marketing_funnel_stats','get_score_explicability','move_deal_atomic','publish_mtta_sla_breach_alert','seed_conversation_topics','seed_forecast_period','has_role') ORDER BY 1;
