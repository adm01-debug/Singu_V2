-- plan-cache-bloat.sql — Rodada 25/10 (WARN)
-- Alta taxa de replan (plans/calls) indica invalidacao de plan cache ou
-- prepared statements mal parametrizados; custa CPU e latencia.
\echo '== plan-cache-bloat =='
DO $$
DECLARE v_ext bool;
BEGIN
  SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') INTO v_ext;
  IF NOT v_ext THEN
    RAISE NOTICE 'pg_stat_statements ausente; skip.';
    RETURN;
  END IF;
END $$;
SELECT queryid, calls, plans,
       ROUND((plans::numeric / NULLIF(calls,0)) * 100, 2) AS replan_pct,
       ROUND(mean_exec_time::numeric, 2) AS mean_ms,
       LEFT(regexp_replace(query,'\s+',' ','g'), 100) AS q
  FROM pg_stat_statements
 WHERE calls >= 100
   AND plans::numeric / NULLIF(calls,0) > 0.5
 ORDER BY plans DESC
 LIMIT 20;
DO $$
DECLARE v_bad int;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_stat_statements') THEN RETURN; END IF;
  SELECT count(*) INTO v_bad FROM pg_stat_statements
   WHERE calls >= 100 AND plans::numeric / NULLIF(calls,0) > 0.5;
  IF v_bad > 0 THEN
    RAISE WARNING '% queries com replan rate > 50%%. Revisar prepared statements.', v_bad;
  END IF;
END $$;
\echo 'OK plan cache auditado.'