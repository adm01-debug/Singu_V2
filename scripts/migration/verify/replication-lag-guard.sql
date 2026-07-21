-- replication-lag-guard.sql — Detecta réplicas de leitura stale.
-- Falha se qualquer replica com replay_lag > 30s ou write_lag > 10s.
-- Uso: psql "$PRIMARY_DB_URL" -v ON_ERROR_STOP=1 -f verify/replication-lag-guard.sql
\set ON_ERROR_STOP on
\pset pager off

SELECT application_name, client_addr, state, sync_state,
       COALESCE(EXTRACT(EPOCH FROM write_lag), 0)  AS write_lag_s,
       COALESCE(EXTRACT(EPOCH FROM flush_lag), 0)  AS flush_lag_s,
       COALESCE(EXTRACT(EPOCH FROM replay_lag), 0) AS replay_lag_s
  FROM pg_stat_replication
 ORDER BY replay_lag DESC NULLS LAST;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_stat_replication
   WHERE COALESCE(EXTRACT(EPOCH FROM replay_lag), 0) > 30
      OR COALESCE(EXTRACT(EPOCH FROM write_lag),  0) > 10;
  IF v_bad > 0 THEN
    RAISE EXCEPTION '🚨 REPLICATION LAG: % réplica(s) fora do SLO (replay>30s ou write>10s)', v_bad;
  END IF;
  RAISE NOTICE '✔ Todas réplicas dentro do SLO de lag';
END
$BODY$;