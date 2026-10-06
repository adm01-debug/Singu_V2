\pset pager off
SELECT table_name, string_agg(column_name||':'||data_type, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('deals','nurturing_workflows','nurturing_executions','pipeline_stage_transitions','conversation_topics_catalog','forecast_periods','interactions','marketing_forms','form_submissions','audit_log') GROUP BY 1;
SELECT tablename, policyname, cmd, roles, left(coalesce(qual,'')||' | '||coalesce(with_check,''),200) FROM pg_policies WHERE schemaname='public' AND tablename IN ('deals','nurturing_workflows','nurturing_executions','contacts','interactions','conversation_topics_catalog','forecast_periods','pipeline_stage_transitions') ORDER BY 1,2;
SELECT c.relname, c.relrowsecurity FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relname IN ('deals','pipeline_stage_transitions','nurturing_workflows');
SELECT count(*) AS deals, count(user_id) AS with_user FROM public.deals;
SELECT * FROM public.pipeline_stage_transitions LIMIT 5;
