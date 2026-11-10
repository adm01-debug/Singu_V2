-- lock-wait-duration-guard.sql — Rodada 22/10
-- Proposito: sessoes esperando lock por muito tempo indicam contencao (DDL travado, hot rows).
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : sessao em wait_event_type=Lock ha mais de :max_seg segundos (default 30).
-- Variaveis: -v max_seg=30 (aceita decimal)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_seg}
\else
  \set max_seg 30
\endif
SELECT set_config('guard.max_seg', :'max_seg', false) AS _cfg \gset
\echo '== lock-wait-duration-guard =='
SELECT bl.pid AS blocked_pid, bl.usename AS blocked_user,
       bl.wait_event_type, bl.wait_event,
       now() - bl.query_start AS wait_duration,
       LEFT(bl.query, 100) AS blocked_query,
       kb.pid AS blocking_pid,
       LEFT(kb.query, 100) AS blocking_query
  FROM pg_stat_activity bl
  CROSS JOIN LATERAL unnest(pg_blocking_pids(bl.pid)) AS bp(pid)
  JOIN pg_stat_activity kb ON kb.pid = bp.pid
 WHERE bl.wait_event_type = 'Lock'
   AND (now() - bl.query_start) > current_setting('guard.max_seg')::numeric * interval '1 second'
 ORDER BY wait_duration DESC;
DO $$
DECLARE
  v_count int;
  v_seg numeric := current_setting('guard.max_seg')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_stat_activity
   WHERE wait_event_type = 'Lock'
     AND (now() - query_start) > v_seg * interval '1 second';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'WARN: % sessao(oes) esperando lock ha mais de %s. Reduzir hot rows ou usar SELECT ... FOR UPDATE SKIP LOCKED.', v_count, v_seg;
  END IF;
END $$;
\echo 'OK sem esperas de lock longas.'
