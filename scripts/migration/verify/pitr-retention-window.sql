-- pitr-retention-window.sql — Rodada 25/10 (WARN)
-- Janela de PITR curta (< 7d) reduz margem para recovery de incidentes tardios.
\echo '== pitr-retention-window =='
SELECT last_archived_time, last_failed_time, failed_count,
       now() - last_archived_time AS since_last_archive
  FROM pg_stat_archiver;
DO $$
DECLARE v_age interval; v_min_age interval;
BEGIN
  SELECT min((pg_stat_file('pg_wal/'||name)).modification) INTO v_min_age
    FROM pg_ls_waldir();
  IF v_min_age IS NULL THEN
    RAISE WARNING 'pg_wal vazio ou inacessivel; PITR window indeterminada.';
    RETURN;
  END IF;
  v_age := now() - v_min_age;
  RAISE NOTICE 'Janela PITR aproximada (pg_wal mais antigo): %', v_age;
  IF v_age < interval '7 days' THEN
    RAISE WARNING 'Janela PITR = % < 7d. Considerar aumentar wal_keep_size / retention no archive.', v_age;
  END IF;
END $$;
\echo 'OK PITR window auditado.'