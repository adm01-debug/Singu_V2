-- unused-indexes.sql — Rodada 17/10
-- Detecta indices que nunca foram usados (idx_scan=0) e ocupam >10MB.
-- Cada index desnecessario onera INSERT/UPDATE/DELETE e autovacuum.
-- Rodar apos >=7 dias de trafego real. Falso positivo em indices UNIQUE
-- ou de constraint (que ainda sao necessarios mesmo com idx_scan=0).
\echo '== unused-indexes =='
WITH candidates AS (
  SELECT s.schemaname, s.relname AS table_name, s.indexrelname AS index_name,
         s.idx_scan, pg_relation_size(s.indexrelid) AS bytes,
         ix.indisunique, ix.indisprimary,
         (SELECT COUNT(*) FROM pg_constraint c WHERE c.conindid = s.indexrelid) AS constraint_refs
  FROM pg_stat_user_indexes s
  JOIN pg_index ix ON ix.indexrelid = s.indexrelid
  WHERE s.schemaname NOT IN ('pg_catalog','information_schema','pg_toast')
)
SELECT schemaname, table_name, index_name,
       pg_size_pretty(bytes) AS size, idx_scan
  FROM candidates
 WHERE idx_scan = 0
   AND NOT indisprimary
   AND NOT indisunique
   AND constraint_refs = 0
   AND bytes > 10 * 1024 * 1024
 ORDER BY bytes DESC
 LIMIT 50;
\echo 'INFO: revise resultados; DROP INDEX CONCURRENTLY nos confirmados.'