-- pitr-retention-window.sql — Rodada 25/10 (WARN)
-- Proposito: janela de PITR curta reduz margem para recovery de incidentes tardios.
-- Classe   : AUDIT (RAISE WARNING no achado; nunca falha)
-- Limiar   : segmento mais antigo em pg_wal com menos de :min_dias dias (default 7)
--            — aproximacao local; a retencao real fica no storage do archive.
-- Variaveis: -v min_dias=7 (aceita decimal)
-- Saida    : 0 (inclusive SKIP).
-- Requer   : EXECUTE em pg_ls_waldir() (superuser ou pg_monitor). Sem privilegio: SKIP com NOTICE.
\set ON_ERROR_STOP on
\pset pager off
\if :{?min_dias}
\else
  \set min_dias 7
\endif
SELECT set_config('guard.min_dias', :'min_dias', false) AS _cfg \gset
\echo '== pitr-retention-window =='
SELECT last_archived_time, last_failed_time, failed_count,
       now() - last_archived_time AS since_last_archive
  FROM pg_stat_archiver;
DO $$
DECLARE
  v_age interval;
  v_oldest timestamptz;
  v_dias numeric := current_setting('guard.min_dias')::numeric;
BEGIN
  BEGIN
    -- pg_ls_waldir() ja devolve a data de modificacao; nao precisa de pg_stat_file().
    SELECT min(modification) INTO v_oldest FROM pg_ls_waldir();
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'SKIP: sem privilegio para pg_ls_waldir() (requer pg_monitor).';
    RETURN;
  END;
  IF v_oldest IS NULL THEN
    RAISE WARNING 'pg_wal vazio ou inacessivel; PITR window indeterminada.';
    RETURN;
  END IF;
  v_age := now() - v_oldest;
  RAISE NOTICE 'Janela PITR aproximada (pg_wal mais antigo): %', v_age;
  IF v_age < v_dias * interval '1 day' THEN
    RAISE WARNING 'Janela PITR = % < %d. Considerar aumentar wal_keep_size / retention no archive.', v_age, v_dias;
  END IF;
END $$;
\echo 'OK PITR window auditado.'
