-- idle-in-transaction-guard.sql — Rodada 19/10
-- Proposito: falha se ha sessoes 'idle in transaction' antigas (retem locks, bloqueiam VACUUM e DDL).
-- Rodada 23/10 (F1): passa a cobrir 'idle in transaction (aborted)' que
-- tambem retem locks.
-- Classe   : GUARD FATAL
-- Limiar   : sessao idle-in-transaction com transacao aberta ha mais de :max_min minutos.
--            Numa transacao ABORTADA o Postgres zera xact_start; ai a idade e contada a
--            partir de state_change (quando a sessao ficou ociosa).
-- Variaveis: -v max_min=30 (default 30; aceita decimal)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Nota     : sem pg_read_all_stats o papel so enxerga o estado das proprias sessoes.
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_min}
\else
  \set max_min 30
\endif
SELECT set_config('guard.max_min', :'max_min', false) AS _cfg \gset
\echo '== idle-in-transaction-guard =='
SELECT pid, usename, application_name, state,
       now() - COALESCE(xact_start, state_change) AS xact_age,
       LEFT(query, 120) AS last_query
  FROM pg_stat_activity
 WHERE state LIKE 'idle in transaction%'
 ORDER BY COALESCE(xact_start, state_change);
DO $$
DECLARE
  v_count int;
  v_min numeric := current_setting('guard.max_min')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_stat_activity
   WHERE state LIKE 'idle in transaction%'
     AND COALESCE(xact_start, state_change) < now() - v_min * interval '1 minute';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % sessoes idle-in-transaction > %min. pg_terminate_backend(pid) urgente.', v_count, v_min;
  END IF;
END $$;
\echo 'OK sem idle-in-transaction longos.'
