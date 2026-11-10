-- datfrozenxid-age-guard.sql — Rodada 20/10
-- Proposito: falha antes do xid wraparound (shutdown forcado perto de 2B).
-- Classe   : GUARD FATAL
-- Limiar   : age(datfrozenxid) de qualquer database > :max_age (default 1B).
-- Variaveis: -v max_age=1000000000
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_age}
\else
  \set max_age 1000000000
\endif
SELECT set_config('guard.max_age', :'max_age', false) AS _cfg \gset
\echo '== datfrozenxid-age-guard =='
SELECT datname, age(datfrozenxid) AS xid_age
  FROM pg_database
 ORDER BY xid_age DESC;
DO $$
DECLARE
  v_max bigint;
  v_lim bigint := current_setting('guard.max_age')::bigint;
BEGIN
  SELECT COALESCE(MAX(age(datfrozenxid)),0) INTO v_max FROM pg_database;
  IF v_max > v_lim THEN
    RAISE EXCEPTION 'FATAL: datfrozenxid age=% > %. VACUUM FREEZE global urgente.', v_max, v_lim;
  END IF;
END $$;
\echo 'OK datfrozenxid saudavel.'
