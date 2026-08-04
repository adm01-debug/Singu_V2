-- dead-tuple-ratio-guard.sql — Rodada 22/10
\echo '== dead-tuple-ratio-guard =='
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       ROUND(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_pct,
       last_autovacuum, last_vacuum
  FROM pg_stat_user_tables
 WHERE (n_live_tup + n_dead_tup) > 10000
   AND (100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0)) > 20
 ORDER BY dead_pct DESC
 LIMIT 30;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_stat_user_tables
   WHERE (n_live_tup + n_dead_tup) > 100000
     AND (100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0)) > 40;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % tabelas grandes com > 40%% dead tuples. VACUUM urgente.', v_count;
  END IF;
END $$;
\echo 'OK dead tuple ratio saudavel.'