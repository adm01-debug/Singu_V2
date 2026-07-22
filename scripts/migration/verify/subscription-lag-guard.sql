-- subscription-lag-guard.sql — Rodada 21/10
\echo '== subscription-lag-guard =='
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_subscription;
  IF v_count = 0 THEN
    RAISE NOTICE 'sem subscriptions logicas; skip.';
    RETURN;
  END IF;
END $$;
SELECT subname, pid, received_lsn, latest_end_lsn,
       pg_wal_lsn_diff(latest_end_lsn, received_lsn) AS lag_bytes,
       last_msg_send_time, last_msg_receipt_time,
       latest_end_time
  FROM pg_stat_subscription;
\echo 'REC: lag_bytes > 100MB sustentado indica subscriber lento ou conflito de replay.'