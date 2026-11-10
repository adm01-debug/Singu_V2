-- access-exclusive-locks-guard.sql — Rodada 20/10
-- Proposito: falha se houver AccessExclusiveLock concedido dentro de uma transacao
--            aberta ha mais de N minutos (DDL travado bloqueia leitura e escrita).
-- Classe   : GUARD FATAL
-- Limiar   : transacao dona do lock aberta ha mais de :max_min minutos.
-- Variaveis: -v max_min=5 (default 5; aceita decimal)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_min}
\else
  \set max_min 5
\endif
SELECT set_config('guard.max_min', :'max_min', false) AS _cfg \gset
\echo '== access-exclusive-locks-guard =='
SELECT l.pid, l.mode, l.relation::regclass AS relation,
       a.usename, a.application_name,
       now() - a.xact_start AS xact_age,
       LEFT(a.query, 120) AS query
  FROM pg_locks l
  JOIN pg_stat_activity a ON a.pid = l.pid
 WHERE l.mode = 'AccessExclusiveLock'
   AND l.granted = true
   AND a.xact_start < now() - current_setting('guard.max_min')::numeric * interval '1 minute'
 ORDER BY xact_age DESC;
DO $$
DECLARE
  v_count int;
  v_min numeric := current_setting('guard.max_min')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count
    FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid
   WHERE l.mode='AccessExclusiveLock' AND l.granted=true
     AND a.xact_start < now() - v_min * interval '1 minute';
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % AccessExclusive locks > %min.', v_count, v_min;
  END IF;
END $$;
\echo 'OK sem AccessExclusive orfaos.'
