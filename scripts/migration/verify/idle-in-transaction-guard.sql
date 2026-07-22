-- idle-in-transaction-guard.sql — Rodada 19/10
-- Sessoes 'idle in transaction' > 30min retem locks, bloqueiam VACUUM e DDL.
\echo '== idle-in-transaction-guard =='
SELECT pid, usename, application_name, state,
       now() - xact_start AS xact_age,
       LEFT(query, 120) AS last_query
  FROM pg_stat_activity
 WHERE state = 'idle in transaction'
   AND xact_start IS NOT NULL
 ORDER BY xact_start;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_stat_activity
   WHERE state = 'idle in transaction'
     AND xact_start < now() - interval '30 minutes';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % sessoes idle-in-transaction > 30min. pg_terminate_backend(pid) urgente.', v_count;
  END IF;
END $$;
\echo 'OK sem idle-in-transaction longos.'