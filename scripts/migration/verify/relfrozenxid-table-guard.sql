-- relfrozenxid-table-guard.sql — Rodada 22/10
-- Proposito: falha se alguma tabela/MV/toast do database corrente esta perto do xid wraparound.
-- Classe   : GUARD FATAL
-- Limiar   : age(relfrozenxid) > :max_age (default 1.5B); lista informativa a partir de :warn_age (500M).
-- Variaveis: -v max_age=1500000000 -v warn_age=500000000
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_age}
\else
  \set max_age 1500000000
\endif
\if :{?warn_age}
\else
  \set warn_age 500000000
\endif
SELECT set_config('guard.max_age', :'max_age', false) AS _cfg \gset
\echo '== relfrozenxid-table-guard =='
SELECT n.nspname, c.relname,
       age(c.relfrozenxid) AS xid_age,
       pg_size_pretty(pg_relation_size(c.oid)) AS size
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind IN ('r','m','t')
   AND age(c.relfrozenxid) > (:'warn_age')::bigint
 ORDER BY age(c.relfrozenxid) DESC
 LIMIT 30;
DO $$
DECLARE
  v_max bigint;
  v_lim bigint := current_setting('guard.max_age')::bigint;
BEGIN
  SELECT COALESCE(MAX(age(relfrozenxid)),0) INTO v_max
    FROM pg_class WHERE relkind IN ('r','m','t');
  IF v_max > v_lim THEN
    RAISE EXCEPTION 'FATAL: relfrozenxid age max=% > %. VACUUM FREEZE por tabela.', v_max, v_lim;
  END IF;
END $$;
\echo 'OK relfrozenxid saudavel.'
