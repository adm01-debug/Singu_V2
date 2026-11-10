-- wal-sender-timeout-guard.sql — Rodada 24/10 (gap 25)
-- Proposito: wal_sender_timeout=0 (infinito) permite senders zumbi que retem slots.
-- Classe   : GUARD WARN (sai != 0; no full-audit conta como WARN)
-- Limiar   : wal_sender_timeout = 0 ou acima de :max_ms milissegundos (default 300000 = 5min).
-- Variaveis: -v max_ms=300000
-- Saida    : 0 = ok; 3 = condicao ruim (RAISE EXCEPTION sob ON_ERROR_STOP).
-- Nota     : avalia o valor efetivo da sessao (cluster + ALTER DATABASE/ROLE ... SET).
\set ON_ERROR_STOP on
\pset pager off
\if :{?max_ms}
\else
  \set max_ms 300000
\endif
SELECT set_config('guard.max_ms', :'max_ms', false) AS _cfg \gset
\echo '== wal-sender-timeout-guard =='
SELECT name, setting, unit FROM pg_settings
 WHERE name IN ('wal_sender_timeout','wal_receiver_timeout');
DO $$
DECLARE
  v_ws int;
  v_max int := current_setting('guard.max_ms')::int;
BEGIN
  SELECT setting::int INTO v_ws FROM pg_settings WHERE name='wal_sender_timeout';
  IF v_ws = 0 OR v_ws > v_max THEN
    RAISE EXCEPTION 'WARN: wal_sender_timeout=%ms fora do range recomendado (1..%ms).', v_ws, v_max;
  END IF;
END $$;
\echo 'OK wal_sender_timeout saudavel.'
