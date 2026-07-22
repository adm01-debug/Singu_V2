-- deadlock-frequency-monitor.sql — Rodada 21/10
\echo '== deadlock-frequency-monitor =='
SELECT datname, deadlocks, stats_reset,
       ROUND(deadlocks::numeric / GREATEST(EXTRACT(EPOCH FROM (now() - stats_reset))/3600, 1), 2) AS per_hour
  FROM pg_stat_database
 WHERE datname NOT IN ('template0','template1')
 ORDER BY deadlocks DESC;
\echo 'REC: > 1 deadlock/hora indica ordenacao inconsistente de locks no app.'