-- lock-wait-duration-guard.sql — Rodada 22/10
\echo '== lock-wait-duration-guard =='
SELECT bl.pid AS blocked_pid, bl.usename AS blocked_user,
       bl.wait_event_type, bl.wait_event,
       now() - bl.query_start AS wait_duration,
       LEFT(bl.query, 100) AS blocked_query,
       kb.pid AS blocking_pid,
       LEFT(kb.query, 100) AS blocking_query
  FROM pg_stat_activity bl
  JOIN LATERAL pg_blocking_pids(bl.pid) bp(pid) ON true
  JOIN pg_stat_activity kb ON kb.pid = bp.pid
 WHERE bl.wait_event_type = 'Lock'
   AND (now() - bl.query_start) > interval '30 seconds'
 ORDER BY wait_duration DESC;
\echo 'REC: waits > 30s indicam contencao. Reduzir hot rows ou usar SELECT ... FOR UPDATE SKIP LOCKED.'