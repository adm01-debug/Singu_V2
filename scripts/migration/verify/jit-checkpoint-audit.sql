-- jit-checkpoint-audit.sql — Rodada 17/10
-- JIT mal configurado adiciona 50-200ms em OLTP; checkpoint curto = IO storm.
\echo '== jit-checkpoint-audit =='
SELECT name, setting, unit, source, boot_val
  FROM pg_settings
 WHERE name IN (
   'jit', 'jit_above_cost', 'jit_inline_above_cost', 'jit_optimize_above_cost',
   'checkpoint_timeout', 'checkpoint_completion_target', 'max_wal_size', 'min_wal_size',
   'wal_compression'
 )
 ORDER BY name;
\echo 'REC: jit_above_cost >= 500000 em OLTP; checkpoint_timeout 15min; completion_target 0.9.'