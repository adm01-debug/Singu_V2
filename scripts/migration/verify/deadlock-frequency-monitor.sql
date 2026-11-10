-- deadlock-frequency-monitor.sql — Rodada 21/10
-- Proposito: deadlocks por hora desde o ultimo stats_reset, por database.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
\set ON_ERROR_STOP on
\pset pager off
\echo '== deadlock-frequency-monitor =='
SELECT datname, deadlocks, stats_reset,
       ROUND(deadlocks::numeric / GREATEST(EXTRACT(EPOCH FROM (now() - stats_reset))/3600, 1), 2) AS per_hour
  FROM pg_stat_database
 WHERE datname NOT IN ('template0','template1')
 ORDER BY deadlocks DESC;
\echo 'REC: > 1 deadlock/hora indica ordenacao inconsistente de locks no app.'