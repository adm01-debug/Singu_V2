-- bgwriter-efficiency-audit.sql — Rodada 21/10
-- Proposito: mostra a proporcao de checkpoints forcados e a pressao sobre o bgwriter.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
-- Compat.  : PG15/16 leem tudo de pg_stat_bgwriter; no PG17 os contadores de checkpoint
--            foram para pg_stat_checkpointer (e buffers_backend para pg_stat_io).
\set ON_ERROR_STOP on
\pset pager off
\echo '== bgwriter-efficiency-audit =='
SELECT current_setting('server_version_num')::int >= 170000 AS pg17 \gset
\if :pg17
SELECT c.num_timed AS checkpoints_timed, c.num_requested AS checkpoints_req,
       ROUND(100.0 * c.num_requested / NULLIF(c.num_timed + c.num_requested, 0), 2) AS pct_forced,
       c.write_time AS checkpoint_write_time, c.sync_time AS checkpoint_sync_time,
       c.buffers_written AS buffers_checkpoint, b.buffers_clean,
       b.maxwritten_clean, b.stats_reset
  FROM pg_stat_checkpointer c CROSS JOIN pg_stat_bgwriter b;
\else
SELECT checkpoints_timed, checkpoints_req,
       ROUND(100.0 * checkpoints_req / NULLIF(checkpoints_timed + checkpoints_req, 0), 2) AS pct_forced,
       checkpoint_write_time, checkpoint_sync_time,
       buffers_checkpoint, buffers_clean, buffers_backend,
       maxwritten_clean, stats_reset
  FROM pg_stat_bgwriter;
\endif
\echo 'REC: pct_forced > 5% = checkpoint_timeout curto. maxwritten_clean > 0 = bgwriter LRU insuficiente.'
