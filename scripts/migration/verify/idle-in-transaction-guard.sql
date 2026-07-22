-- idle-in-transaction-guard.sql — Rodada 18/10
-- Sessoes 'idle in transaction' retem locks e bloqueiam DDL/VACUUM.
\echo '== idle-in-transaction-guard =='
SELECT pid, usename, application_name, client_addr,
       state, now() - xact_start AS xact_age,
       now() - state_change AS state_age,
       LEFT(query, 120) AS last_query
  FROM pg_stat_activity
 WHERE state IN ('idle in transaction','idle in transaction (aborted)')
   AND xact_start < now() - interval '5 minutes'
 ORDER BY xact_start;
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_stat_activity
   WHERE state LIKE 'idle in transaction%'
     AND xact_start < now() - interval '30 minutes';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % sessoes idle in transaction >30min. pg_terminate_backend urgente.', v_count;
  END IF;
END $$;
\echo 'REC: SET idle_in_transaction_session_timeout = ''10min'' por role.'