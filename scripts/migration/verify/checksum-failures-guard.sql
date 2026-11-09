-- checksum-failures-guard.sql — Rodada 22/10
-- Proposito: falha se o cluster nao tem data_checksums ou se ja registrou falha de checksum.
-- Rodada 23/10 (F3): falha explicitamente quando data_checksums=off, evitando
-- falso-negativo silencioso em clusters sem checksums habilitados.
-- Classe   : GUARD FATAL
-- Limiar   : data_checksums <> on; ou qualquer checksum_failures > 0.
-- Variaveis: nenhuma
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Requer   : config de cluster (initdb --data-checksums) — lado "ok" so em sandbox Docker.
\set ON_ERROR_STOP on
\pset pager off
\echo '== checksum-failures-guard =='
DO $$
DECLARE v_on text;
BEGIN
  SELECT setting INTO v_on FROM pg_settings WHERE name='data_checksums';
  IF v_on IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'FATAL: data_checksums=%. Habilitar via initdb --data-checksums ou pg_checksums.', COALESCE(v_on, '<desconhecido>');
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
