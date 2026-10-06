\pset pager off
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid='public.interactions'::regclass AND contype='c';
SELECT t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) FROM pg_trigger t WHERE NOT t.tgisinternal AND t.tgrelid='public.deals'::regclass;
\pset format unaligned
\pset tuples_only on
SELECT '#### '||p.oid::regprocedure||E'\n'||pg_get_functiondef(p.oid) FROM pg_trigger t JOIN pg_proc p ON p.oid=t.tgfoid WHERE NOT t.tgisinternal AND t.tgrelid='public.deals'::regclass AND t.tgname IN ('trg_log_deal_activity','trg_deal_status_change','trg_mark_customer','trg_notify_deal_changes');
\pset format aligned
\pset tuples_only off
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='contacts' AND column_name ~ '(score|lead)' ORDER BY 1;
SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ~ 'lead_scor' ORDER BY 1;
SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='lead_scores' ORDER BY ordinal_position;
SELECT max(updated_at) AS ultima_edicao_deal, count(*) FROM public.deals;
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='public' AND table_name='deals' ORDER BY ordinal_position;
SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='mql_criteria' ORDER BY ordinal_position;
