-- access-exclusive-locks-guard.sql — Rodada 20/10
\echo '== access-exclusive-locks-guard =='
SELECT l.pid, l.mode, l.relation::regclass AS relation,
       a.usename, a.application_name,
       now() - a.xact_start AS xact_age,
       LEFT(a.query, 120) AS query
  FROM pg_locks l
  JOIN pg_stat_activity a ON a.pid = l.pid
 WHERE l.mode = 'AccessExclusiveLock'
   AND l.granted = true
   AND a.xact_start < now() - interval '5 minutes'
 ORDER BY xact_age DESC;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid
   WHERE l.mode='AccessExclusiveLock' AND l.granted=true
     AND a.xact_start < now() - interval '5 minutes';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % AccessExclusive locks > 5min.', v_count;
  END IF;
END $$;
\echo 'OK sem AccessExclusive orfaos.'