-- replication-slot-idle-guard.sql — Rodada 24/10 (F/gap 21)
-- Proposito: falha se ha slot de replicacao INATIVO retendo WAL demais (enche o disco).
-- Classe   : GUARD FATAL
-- Limiar   : slot com active=false retendo mais de :max_retido_mb MB de WAL (default 16384 = 16GB).
--            Slot sem restart_lsn (nunca reservou WAL) nao retem nada e e ignorado.
-- Variaveis: -v max_retido_mb=16384
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_retido_mb}
\else
  \set max_retido_mb 16384
\endif
SELECT set_config('guard.max_retido_mb', :'max_retido_mb', false) AS _cfg \gset
\echo '== replication-slot-idle-guard =='
SELECT s.slot_name, s.slot_type, s.active, s.restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), s.restart_lsn)) AS retained,
       now() - a.backend_start AS pid_age
  FROM pg_replication_slots s
  LEFT JOIN pg_stat_activity a ON a.pid = s.active_pid
 ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), s.restart_lsn) DESC NULLS LAST;
DO $$
DECLARE
  v_bad int;
  v_mb numeric := current_setting('guard.max_retido_mb')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_replication_slots s
   WHERE s.active = false
     AND pg_wal_lsn_diff(pg_current_wal_lsn(), s.restart_lsn) > v_mb * 1024 * 1024;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'FATAL: % slot(s) inativos retendo > % MB de WAL. pg_drop_replication_slot() ou reativar.', v_bad, v_mb;
  END IF;
END $$;
\echo 'OK sem slots inativos retendo WAL excessivo.'
