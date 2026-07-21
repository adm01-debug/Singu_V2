-- Extensions parity — versão exata origem × destino.
-- Rode em AMBOS e faça diff:
--   psql "$SRC_DB_URL"  -f verify/extensions-parity.sql > src-ext.txt
--   psql "$DEST_DB_URL" -f verify/extensions-parity.sql > dest-ext.txt
--   diff src-ext.txt dest-ext.txt   # deve ser vazio
\pset format unaligned
\pset tuples_only on
SELECT extname || '=' || extversion
  FROM pg_extension
 WHERE extname IN ('vector','pgvector','pg_cron','pgcrypto','pg_trgm','uuid-ossp','pg_net','pg_stat_statements','unaccent','supabase_vault')
 ORDER BY extname;