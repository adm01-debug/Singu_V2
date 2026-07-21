-- replication-slots-guard.sql — Detecta slots orfaos que retem WAL indefinidamente.
-- Slot inativo com retained_bytes > 10GB = risco de encher disco.
\set ON_ERROR_STOP on
\pset pager off

SELECT slot_name, plugin, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
  FROM pg_replication_slots
 ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC NULLS LAST;

DO $BODY$
DECLARE v_bad int;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_replication_slots
   WHERE NOT active
     AND pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) > 10 * 1024^3;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'ORPHAN SLOT: % slot(s) inativo(s) retendo > 10GB WAL', v_bad;
  END IF;
  RAISE NOTICE 'OK Nenhum slot orfao critico';
END
$BODY$;