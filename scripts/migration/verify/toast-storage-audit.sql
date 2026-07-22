-- toast-storage-audit.sql — Rodada 18/10
-- Colunas TEXT/JSONB/BYTEA com storage PLAIN/MAIN nao usam TOAST e causam bloat silencioso.
\echo '== toast-storage-audit =='
SELECT n.nspname AS schema, c.relname AS table, a.attname AS column,
       format_type(a.atttypid, a.atttypmod) AS type,
       CASE a.attstorage
         WHEN 'p' THEN 'PLAIN'    -- inline, sem toast, sem compressao
         WHEN 'e' THEN 'EXTERNAL' -- toast sem compressao
         WHEN 'm' THEN 'MAIN'     -- compressao inline
         WHEN 'x' THEN 'EXTENDED' -- toast + compressao (default)
       END AS storage
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
 WHERE n.nspname = 'public'
   AND c.relkind = 'r'
   AND a.attnum > 0
   AND NOT a.attisdropped
   AND t.typlen = -1   -- variable-length
   AND a.attstorage IN ('p','m')
 ORDER BY n.nspname, c.relname, a.attnum;
\echo 'REC: ALTER TABLE ... ALTER COLUMN ... SET STORAGE EXTENDED em colunas grandes.'