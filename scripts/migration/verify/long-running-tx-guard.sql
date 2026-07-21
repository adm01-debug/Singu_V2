-- long-running-tx-guard.sql — Detecta transacoes longas que bloqueiam VACUUM.
\set ON_ERROR_STOP on
\pset pager off

SELECT pid, usename, application_name, state,
       now() - xact_start AS xact_age,
       now() - query_start AS query_age,
       LEFT(regexp_replace(query, '\s+', ' ', 'g'), 120) AS query_preview
  FROM pg_stat_activity
 WHERE xact_start IS NOT NULL
   AND now() - xact_start > interval '10 minutes'
 ORDER BY xact_start ASC;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad FROM pg_stat_activity
   WHERE xact_start IS NOT NULL AND now() - xact_start > interval '1 hour';
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'LONG TX: % transacao(oes) > 1h - risco xid wraparound', v_bad;
  END IF;
  RAISE NOTICE 'OK Nenhuma tx longa critica';
END
$BODY$;