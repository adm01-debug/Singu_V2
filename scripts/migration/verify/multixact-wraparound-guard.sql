-- multixact-wraparound-guard.sql — Rodada 20/10
-- Proposito: falha antes do MultiXact wraparound (que forca shutdown do cluster).
-- Classe   : GUARD FATAL
-- Limiar   : mxid_age(datminmxid) de qualquer database > :max_age (default 200M).
-- Variaveis: -v max_age=200000000
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_age}
\else
  \set max_age 200000000
\endif
SELECT set_config('guard.max_age', :'max_age', false) AS _cfg \gset
\echo '== multixact-wraparound-guard =='
SELECT datname, mxid_age(datminmxid) AS mxid_age
  FROM pg_database
 ORDER BY mxid_age DESC;
DO $$
DECLARE
  v_max bigint;
  v_lim bigint := current_setting('guard.max_age')::bigint;
BEGIN
  SELECT COALESCE(MAX(mxid_age(datminmxid)),0) INTO v_max FROM pg_database;
  IF v_max > v_lim THEN
    RAISE EXCEPTION 'FATAL: mxid_age=% > %. VACUUM (FREEZE) urgente.', v_max, v_lim;
  END IF;
END $$;
\echo 'OK MultiXact age saudavel.'
