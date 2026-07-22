-- replication-slot-idle-guard.sql — Rodada 24/10 (F/gap 21)
-- Slots ativos porem inativos ha > 24h retem WAL indefinidamente ate encher disco.
\echo '== replication-slot-idle-guard =='
SELECT slot_name, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained,
       now() - COALESCE(active_pid::text::timestamptz, now()) AS pid_age
  FROM pg_replication_slots
 ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC NULLS LAST;
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