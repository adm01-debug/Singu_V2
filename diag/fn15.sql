\pset pager off
SELECT t, to_regclass('public.'||t) IS NOT NULL AS existe FROM unnest(ARRAY['attribution_models_cache','connection_test_logs','system_alerts','behavioral_profile_regen_queue','revops_kpi_snapshots']) t;
SELECT table_name, string_agg(column_name||':'||data_type, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND is_nullable='NO' AND column_default IS NULL AND table_name IN ('deals','nurturing_workflows','cs_accounts','forms','form_submissions','contacts') GROUP BY 1;
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid IN ('public.deals'::regclass,'public.nurturing_workflows'::regclass,'public.form_submissions'::regclass) AND contype IN ('c','f');
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE NOT tgisinternal AND tgrelid IN ('public.deals'::regclass,'public.nurturing_executions'::regclass,'public.nurturing_workflows'::regclass);
