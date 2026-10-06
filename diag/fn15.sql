\pset pager off
SELECT table_name, string_agg(column_name||':'||data_type, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('deal_forecasts','audit_log','forecast_periods','mql_classifications','nurturing_executions','lead_magnets','attribution_touchpoints','revops_alerts') GROUP BY 1;
SELECT count(*) FILTER (WHERE company_id IS NULL) AS deals_sem_empresa, count(*) FROM public.deals;
SELECT extname FROM pg_extension WHERE extname ~ 'plpgsql_check';
SELECT name FROM pg_available_extensions WHERE name ~ 'plpgsql_check';
