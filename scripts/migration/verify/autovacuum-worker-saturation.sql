-- autovacuum-worker-saturation.sql — Rodada 20/10
\echo '== autovacuum-worker-saturation =='
SELECT setting::int AS max_workers
  FROM pg_settings WHERE name='autovacuum_max_workers';
SELECT pid, datname, usename, state, query_start,
       LEFT(query, 120) AS query
  FROM pg_stat_activity
 WHERE backend_type = 'autovacuum worker'
 ORDER BY query_start;
SELECT COUNT(*) AS active_workers
  FROM pg_stat_activity WHERE backend_type='autovacuum worker';
\echo 'REC: se active == max_workers sustentado, aumentar autovacuum_max_workers ou tunar cost_limit.'