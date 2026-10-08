\set ON_ERROR_STOP 1
\pset format unaligned
\pset tuples_only on
SELECT 'CHK|' || t.relname || '|' || conname || '|' || pg_get_constraintdef(c.oid)
FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='public' AND t.relname IN ('tasks','interactions','contacts','companies','follow_up_approvals','territories','ai_gateway_recommendation_log','ai_gateway_recommendation_logs','recommendation_logs') AND c.contype='c'
ORDER BY t.relname, conname;
SELECT 'COL|' || table_name || '|' || column_name || '|' || data_type FROM information_schema.columns
WHERE table_schema='public' AND table_name IN ('follow_up_approvals','territories','ai_gateway_recommendation_log','ai_gateway_recommendation_logs','recommendation_logs','ai_recommendation_logs')
ORDER BY table_name, ordinal_position;
