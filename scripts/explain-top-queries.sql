-- Script para análise de performance das top queries
-- Requer pg_stat_statements habilitado

SELECT 
    substring(query, 1, 100) AS short_query,
    round(total_exec_time::numeric, 2) AS total_time,
    calls,
    round(mean_exec_time::numeric, 2) AS mean_time,
    round((100 * total_exec_time / sum(total_exec_time) OVER ())::numeric, 2) AS percentage_of_load
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 20;

-- Sugestão: rodar EXPLAIN ANALYZE nas queries identificadas
