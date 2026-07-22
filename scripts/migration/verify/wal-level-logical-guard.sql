-- wal-level-logical-guard.sql — Rodada 20/10
\echo '== wal-level-logical-guard =='
SELECT name, setting
  FROM pg_settings
 WHERE name IN ('wal_level','max_replication_slots','max_wal_senders')
 ORDER BY name;
DO $$
DECLARE
  v_level text; v_slots int; v_senders int;
  v_used_slots int; v_used_senders int;
BEGIN
  SELECT setting INTO v_level FROM pg_settings WHERE name='wal_level';
  SELECT setting::int INTO v_slots FROM pg_settings WHERE name='max_replication_slots';
  SELECT setting::int INTO v_senders FROM pg_settings WHERE name='max_wal_senders';
  SELECT COUNT(*) INTO v_used_slots FROM pg_replication_slots;
  SELECT COUNT(*) INTO v_used_senders FROM pg_stat_replication;
  IF v_level <> 'logical' THEN
    RAISE EXCEPTION 'FATAL: wal_level=% (esperado logical).', v_level;
  END IF;
  IF v_used_slots >= v_slots THEN
    RAISE EXCEPTION 'FATAL: replication slots saturados (%/%).', v_used_slots, v_slots;
  END IF;
  IF v_used_senders >= v_senders THEN
    RAISE EXCEPTION 'FATAL: wal senders saturados (%/%).', v_used_senders, v_senders;
  END IF;
END $$;
\echo 'OK wal_level=logical com folga.'