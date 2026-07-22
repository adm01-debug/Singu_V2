-- hot-standby-feedback-audit.sql — Rodada 20/10
\echo '== hot-standby-feedback-audit =='
SELECT name, setting, context
  FROM pg_settings
 WHERE name IN ('hot_standby_feedback','max_standby_streaming_delay','max_standby_archive_delay');
SELECT application_name, client_addr, state, sync_state,
       write_lag, flush_lag, replay_lag
  FROM pg_stat_replication;
\echo 'REC: hot_standby_feedback=on nas replicas para evitar query cancels.'