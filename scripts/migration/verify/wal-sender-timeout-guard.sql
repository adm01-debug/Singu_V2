-- wal-sender-timeout-guard.sql — Rodada 24/10 (gap 25)
-- wal_sender_timeout=0 (infinito) permite senders zumbi que retem slots.
\echo '== wal-sender-timeout-guard =='
SELECT name, setting, unit FROM pg_settings
 WHERE name IN ('wal_sender_timeout','wal_receiver_timeout');
DO $$
DECLARE v_ws int;
BEGIN
  SELECT setting::int INTO v_ws FROM pg_settings WHERE name='wal_sender_timeout';
  IF v_ws = 0 OR v_ws > 300000 THEN
    RAISE WARNING 'wal_sender_timeout=%ms fora do range recomendado (30s..5min).', v_ws;
  END IF;
END $$;
\echo 'OK wal_sender_timeout saudavel.'