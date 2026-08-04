-- checksum-failures-guard.sql — Rodada 22/10
-- Rodada 23/10 (F3): falha explicitamente quando data_checksums=off, evitando
-- falso-negativo silencioso em clusters sem checksums habilitados.
\echo '== checksum-failures-guard =='
DO $$
DECLARE v_on text;
BEGIN
  SELECT setting INTO v_on FROM pg_settings WHERE name='data_checksums';
  IF v_on <> 'on' THEN
    RAISE EXCEPTION 'FATAL: data_checksums=%. Habilitar via initdb --data-checksums ou pg_checksums.', v_on;
  END IF;
END $$;
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