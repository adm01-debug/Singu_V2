-- cache-hit-ratio-audit.sql — Rodada 22/10
-- Proposito: taxa de acerto de cache (heap e indices) por database.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
\set ON_ERROR_STOP on
\pset pager off
\echo '== cache-hit-ratio-audit =='
SELECT datname,
       ROUND(100.0 * blks_hit / NULLIF(blks_hit + blks_read, 0), 2) AS heap_hit_pct,
       blks_hit, blks_read
  FROM pg_stat_database
 WHERE datname NOT IN ('template0','template1')
 ORDER BY heap_hit_pct;
SELECT ROUND(100.0 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit + idx_blks_read),0), 2) AS index_hit_pct
  FROM pg_statio_user_indexes;
\echo 'REC: heap/index hit < 99% em OLTP indica shared_buffers pequeno ou working set > RAM.'