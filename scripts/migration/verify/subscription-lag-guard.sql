-- subscription-lag-guard.sql — Rodada 21/10
-- Proposito: subscriber logico parado ou atrasado = destino divergindo da origem.
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : subscription habilitada sem apply worker (pid nulo); ou
--            lag (latest_end_lsn - received_lsn) > :max_lag_mb MB (default 100).
-- Variaveis: -v max_lag_mb=100
-- Saida    : 0 = ok ou SKIP; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Sem subscriptions: SKIP com NOTICE (passa).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_lag_mb}
\else
  \set max_lag_mb 100
\endif
SELECT set_config('guard.max_lag_mb', :'max_lag_mb', false) AS _cfg \gset
\echo '== subscription-lag-guard =='
SELECT s.subname, s.subenabled, st.pid, st.received_lsn, st.latest_end_lsn,
       pg_wal_lsn_diff(st.latest_end_lsn, st.received_lsn) AS lag_bytes,
       st.last_msg_send_time, st.last_msg_receipt_time,
       st.latest_end_time
  FROM pg_subscription s
  LEFT JOIN pg_stat_subscription st ON st.subid = s.oid AND st.relid IS NULL
 ORDER BY s.subname;
DO $$
DECLARE
  v_count int; v_sem_worker int; v_lag int;
  v_mb numeric := current_setting('guard.max_lag_mb')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_subscription;
  IF v_count = 0 THEN
    RAISE NOTICE 'SKIP: sem subscriptions logicas.';
    RETURN;
  END IF;
  SELECT COUNT(*) FILTER (WHERE s.subenabled AND st.pid IS NULL),
         COUNT(*) FILTER (WHERE pg_wal_lsn_diff(st.latest_end_lsn, st.received_lsn) > v_mb * 1024 * 1024)
    INTO v_sem_worker, v_lag
    FROM pg_subscription s
    LEFT JOIN pg_stat_subscription st ON st.subid = s.oid AND st.relid IS NULL;
  IF v_sem_worker > 0 OR v_lag > 0 THEN
    RAISE EXCEPTION 'WARN: % subscription(s) habilitada(s) sem apply worker; % com lag > % MB.', v_sem_worker, v_lag, v_mb;
  END IF;
END $$;
\echo 'OK subscriptions logicas em dia (ou nenhuma — ver NOTICE).'
