-- replication-lag-guard.sql — Detecta replicas de leitura stale.
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : qualquer walsender com replay_lag > :max_replay_s (default 30s)
--            ou write_lag > :max_write_s (default 10s). Sem replicas conectadas: passa.
-- Variaveis: -v max_replay_s=30 -v max_write_s=10 (aceitam decimal)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_replay_s}
\else
  \set max_replay_s 30
\endif
\if :{?max_write_s}
\else
  \set max_write_s 10
\endif
SELECT set_config('guard.max_replay_s', :'max_replay_s', false) AS _cfg1,
       set_config('guard.max_write_s', :'max_write_s', false) AS _cfg2 \gset

SELECT application_name, client_addr, state, sync_state,
       COALESCE(EXTRACT(EPOCH FROM write_lag), 0)  AS write_lag_s,
       COALESCE(EXTRACT(EPOCH FROM flush_lag), 0)  AS flush_lag_s,
       COALESCE(EXTRACT(EPOCH FROM replay_lag), 0) AS replay_lag_s
  FROM pg_stat_replication
 ORDER BY replay_lag DESC NULLS LAST;

DO $BODY$
DECLARE
  v_bad int;
  v_replay numeric := current_setting('guard.max_replay_s')::numeric;
  v_write  numeric := current_setting('guard.max_write_s')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_stat_replication
   WHERE COALESCE(EXTRACT(EPOCH FROM replay_lag), 0) > v_replay
      OR COALESCE(EXTRACT(EPOCH FROM write_lag),  0) > v_write;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'REPLICATION LAG: % replica(s) fora do SLO (replay > %s ou write > %s)', v_bad, v_replay, v_write;
  END IF;
  RAISE NOTICE 'OK Todas replicas dentro do SLO de lag';
END
$BODY$;
