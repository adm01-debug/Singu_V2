-- checksum-failures-guard.sql — Rodada 22/10
\echo '== checksum-failures-guard =='
SELECT datname, checksum_failures, checksum_last_failure
  FROM pg_stat_database
 WHERE checksum_failures > 0;
DO $$
DECLARE v_total bigint;
BEGIN
  SELECT COALESCE(SUM(checksum_failures),0) INTO v_total FROM pg_stat_database;
  IF v_total > 0 THEN
    RAISE EXCEPTION 'FATAL: % checksum failures detectados. Corrupcao fisica.', v_total;
  END IF;
END $$;
\echo 'OK zero checksum failures.'