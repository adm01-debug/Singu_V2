-- prepared-xacts-guard.sql — Rodada 17/10
-- Proposito: falha se ha two-phase commits abandonados (retem WAL e bloqueiam VACUUM ate wraparound).
-- Classe   : GUARD FATAL
-- Limiar   : prepared transaction mais antiga que :max_min minutos (default 60).
-- Variaveis: -v max_min=60 (aceita decimal)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Nota     : com max_prepared_transactions=0 nunca ha 2PC — o guard passa.
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_min}
\else
  \set max_min 60
\endif
SELECT set_config('guard.max_min', :'max_min', false) AS _cfg \gset
\echo '== prepared-xacts-guard =='
SELECT gid, prepared, owner, database, now() - prepared AS age
  FROM pg_prepared_xacts ORDER BY prepared;
DO $$
DECLARE
  v_count int;
  v_min numeric := current_setting('guard.max_min')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_prepared_xacts
   WHERE prepared < now() - v_min * interval '1 minute';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % prepared transactions orfaos (>%min). ROLLBACK PREPARED urgente.', v_count, v_min;
  END IF;
END $$;
\echo 'OK sem 2PC orfaos.'
