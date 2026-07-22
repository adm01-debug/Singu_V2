-- bgwriter-efficiency-audit.sql — Rodada 21/10
\echo '== bgwriter-efficiency-audit =='
SELECT checkpoints_timed, checkpoints_req,
       ROUND(100.0 * checkpoints_req / NULLIF(checkpoints_timed + checkpoints_req, 0), 2) AS pct_forced,
       checkpoint_write_time, checkpoint_sync_time,
       buffers_checkpoint, buffers_clean, buffers_backend,
       maxwritten_clean, stats_reset
  FROM pg_stat_bgwriter;
\echo 'REC: pct_forced > 5% = checkpoint_timeout curto. maxwritten_clean > 0 = bgwriter LRU insuficiente.'