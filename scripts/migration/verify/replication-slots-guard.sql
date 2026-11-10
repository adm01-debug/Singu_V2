-- replication-slots-guard.sql — Detecta slots orfaos que retem WAL indefinidamente.
-- Classe   : GUARD FATAL
-- Limiar   : slot inativo retendo mais de :max_retido_mb MB de WAL (default 10240 = 10GB)
--            = risco de encher disco.
-- Variaveis: -v max_retido_mb=10240
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_retido_mb}
\else
  \set max_retido_mb 10240
\endif
SELECT set_config('guard.max_retido_mb', :'max_retido_mb', false) AS _cfg \gset

SELECT slot_name, plugin, slot_type, active, restart_lsn,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained
  FROM pg_replication_slots
 ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC NULLS LAST;

DO $BODY$
DECLARE
  v_bad int;
  v_mb numeric := current_setting('guard.max_retido_mb')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_bad
    FROM pg_replication_slots
   WHERE NOT active
     AND pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) > v_mb * 1024 * 1024;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'ORPHAN SLOT: % slot(s) inativo(s) retendo > % MB WAL', v_bad, v_mb;
  END IF;
  RAISE NOTICE 'OK Nenhum slot orfao critico';
END
$BODY$;
