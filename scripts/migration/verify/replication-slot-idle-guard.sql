-- replication-slot-idle-guard.sql â€” Rodada 24/10 (F/gap 21)
-- Slots ativos porem inativos ha > 24h retem WAL indefinidamente ate encher disco.
\echo '== replication-slot-idle-guard =='
SELECT s.slot_name, s.slot_type, s.active, s.restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), s.restart_lsn)) AS retained,
       now() - a.backend_start AS pid_age
  FROM pg_replication_slots s
  LEFT JOIN pg_stat_activity a ON a.pid = s.active_pid
 ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), s.restart_lsn) DESC NULLS LAST;
DO $$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_replication_slots s
   WHERE s.active = false
     AND pg_wal_lsn_diff(pg_current_wal_lsn(), s.restart_lsn) > (16::bigint * 1024 * 1024 * 1024); -- 16GB retido
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'FATAL: % slot(s) inativos retendo > 16GB de WAL. pg_drop_replication_slot() ou reativar.', v_bad;
  END IF;
END $$;
\echo 'OK sem slots inativos retendo WAL excessivo.'