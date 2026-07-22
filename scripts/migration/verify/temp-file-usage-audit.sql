-- temp-file-usage-audit.sql — Rodada 21/10
\echo '== temp-file-usage-audit =='
SELECT datname, temp_files, pg_size_pretty(temp_bytes) AS temp_size, stats_reset
  FROM pg_stat_database
 WHERE temp_bytes > 0
 ORDER BY temp_bytes DESC;
SELECT name, setting FROM pg_settings
 WHERE name IN ('work_mem','maintenance_work_mem','log_temp_files','temp_file_limit');
\echo 'REC: temp_bytes alto = queries derramando p/ disco. Aumentar work_mem ou tunar query.'