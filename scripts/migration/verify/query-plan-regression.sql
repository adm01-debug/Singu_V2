-- query-plan-regression.sql — Baseline das top-30 queries por total_time.
-- Diff pre x pos migracao detecta regressao de plano imediatamente.
\pset pager off
\pset format unaligned
\pset tuples_only on

SELECT jsonb_build_object(
  'queryid', queryid,
  'calls', calls,
  'mean_ms', ROUND(mean_exec_time::numeric, 2),
  'query_prefix', LEFT(regexp_replace(query, '\s+', ' ', 'g'), 120)
)::text
FROM pg_stat_statements
WHERE query NOT ILIKE '%pg_stat_statements%'
  AND query NOT ILIKE '%EXPLAIN%'
  AND calls >= 10
ORDER BY total_exec_time DESC
LIMIT 30;