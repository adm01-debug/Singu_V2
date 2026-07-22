-- archive-command-health.sql — Rodada 21/10
\echo '== archive-command-health =='
SELECT archived_count, last_archived_wal, last_archived_time,
       failed_count, last_failed_wal, last_failed_time,
       stats_reset
  FROM pg_stat_archiver;
DO $$
DECLARE v_failed bigint; v_ratio numeric;
BEGIN
  SELECT failed_count INTO v_failed FROM pg_stat_archiver;
  SELECT ROUND(100.0 * failed_count / NULLIF(archived_count + failed_count, 0), 2)
    INTO v_ratio FROM pg_stat_archiver;
  IF COALESCE(v_ratio, 0) > 5 THEN
    RAISE EXCEPTION 'FATAL: archive failure ratio %%%%.', v_ratio;
  END IF;
END $$;
\echo 'OK archive_command saudavel.'