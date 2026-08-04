-- bloat-monitor.sql — Estima bloat via pg_stat_user_tables.
-- Sinaliza tabelas > 100MB com dead_ratio > 20%.
\pset pager off

SELECT
  n.nspname || '.' || c.relname AS table_name,
  pg_size_pretty(pg_total_relation_size(c.oid)) AS total_size,
  s.n_live_tup, s.n_dead_tup,
  CASE WHEN s.n_live_tup > 0
       THEN ROUND(100.0 * s.n_dead_tup / (s.n_live_tup + s.n_dead_tup), 2)
       ELSE 0 END AS dead_ratio_pct,
  s.last_autovacuum, s.last_autoanalyze
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
WHERE n.nspname = 'public' AND c.relkind = 'r'
  AND pg_total_relation_size(c.oid) > 100 * 1024 * 1024
  AND s.n_live_tup > 0
  AND (100.0 * s.n_dead_tup / NULLIF(s.n_live_tup + s.n_dead_tup, 0)) > 20
ORDER BY pg_total_relation_size(c.oid) DESC;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_stat_user_tables s ON s.relid = c.oid
   WHERE n.nspname = 'public' AND c.relkind = 'r'
     AND pg_total_relation_size(c.oid) > 100 * 1024 * 1024
     AND s.n_live_tup > 0
     AND (100.0 * s.n_dead_tup / NULLIF(s.n_live_tup + s.n_dead_tup, 0)) > 20;
  IF v_bad > 0 THEN
    RAISE WARNING '% tabela(s) >100MB com bloat >20 pct', v_bad;
  ELSE
    RAISE NOTICE 'OK Sem bloat significativo';
  END IF;
END
$BODY$;