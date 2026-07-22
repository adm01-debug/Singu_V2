-- seq-scan-large-tables-audit.sql — Rodada 22/10
\echo '== seq-scan-large-tables-audit =='
SELECT schemaname, relname,
       seq_scan, idx_scan,
       ROUND(100.0 * seq_scan / NULLIF(seq_scan + idx_scan, 0), 2) AS seq_pct,
       n_live_tup,
       pg_size_pretty(pg_relation_size(relid)) AS size
  FROM pg_stat_user_tables
 WHERE n_live_tup > 100000
   AND seq_scan > COALESCE(idx_scan,0) * 2
 ORDER BY seq_scan DESC
 LIMIT 20;
\echo 'REC: tabelas grandes com seq_scan >> idx_scan sao candidatas a novo indice.'