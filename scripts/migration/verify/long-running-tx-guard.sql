-- long-running-tx-guard.sql — Detecta transacoes longas que bloqueiam VACUUM.
-- Classe   : GUARD FATAL
-- Limiar   : transacao de client backend aberta ha mais de :max_min minutos (default 60);
--            a listagem informativa comeca em :list_min minutos (default 10).
--            Autovacuum/walsender ficam de fora (um VACUUM longo nao e transacao de app).
-- Variaveis: -v max_min=60 -v list_min=10 (aceitam decimal)
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_min}
\else
  \set max_min 60
\endif
\if :{?list_min}
\else
  \set list_min 10
\endif
SELECT set_config('guard.max_min', :'max_min', false) AS _cfg \gset

SELECT pid, usename, application_name, state,
       now() - xact_start AS xact_age,
       now() - query_start AS query_age,
       LEFT(regexp_replace(query, '\s+', ' ', 'g'), 120) AS query_preview
  FROM pg_stat_activity
 WHERE xact_start IS NOT NULL
   AND now() - xact_start > (:'list_min')::numeric * interval '1 minute'
 ORDER BY xact_start ASC;

DO $BODY$
DECLARE
  v_bad int;
  v_min numeric := current_setting('guard.max_min')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_bad FROM pg_stat_activity
   WHERE xact_start IS NOT NULL
     AND backend_type = 'client backend'
     AND now() - xact_start > v_min * interval '1 minute';
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'LONG TX: % transacao(oes) > %min - risco xid wraparound', v_bad, v_min;
  END IF;
  RAISE NOTICE 'OK Nenhuma tx longa critica';
END
$BODY$;
