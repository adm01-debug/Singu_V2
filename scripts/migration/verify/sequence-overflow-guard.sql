-- sequence-overflow-guard.sql — Rodada 21/10
-- Proposito: sequences serial/smallserial proximas do teto causam falha de INSERT.
-- Classe   : GUARD FATAL
-- Limiar   : last_value acima de :max_pct % do max_value (default 90); lista a partir de :warn_pct (50).
-- Variaveis: -v max_pct=90 -v warn_pct=50
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Nota     : pg_sequences so mostra sequences visiveis ao papel e ja usadas (last_value nao nulo).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_pct}
\else
  \set max_pct 90
\endif
\if :{?warn_pct}
\else
  \set warn_pct 50
\endif
SELECT set_config('guard.max_pct', :'max_pct', false) AS _cfg \gset
\echo '== sequence-overflow-guard =='
SELECT schemaname, sequencename, last_value, max_value,
       ROUND(100.0 * last_value / NULLIF(max_value,0), 2) AS pct_used
  FROM pg_sequences
 WHERE last_value IS NOT NULL
   AND (100.0 * last_value / NULLIF(max_value,0)) > (:'warn_pct')::numeric
 ORDER BY pct_used DESC;
DO $$
DECLARE
  v_count int;
  v_pct numeric := current_setting('guard.max_pct')::numeric;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_sequences
   WHERE last_value IS NOT NULL
     AND (100.0 * last_value / NULLIF(max_value,0)) > v_pct;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'FATAL: % sequences > % pct do teto. Migrar para bigint urgente.', v_count, v_pct;
  END IF;
END $$;
\echo 'OK sequences abaixo do limiar.'
