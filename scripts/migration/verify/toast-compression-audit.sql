-- toast-compression-audit.sql — Rodada 19/10
-- Detecta colunas TEXT/JSONB/BYTEA com storage PLAIN/MAIN (sem TOAST-out),
-- causando bloat silencioso e degradacao de VACUUM em tabelas quentes.
\echo '== toast-compression-audit =='
SELECT n.nspname AS schema,
       c.relname AS table,
       a.attname AS column,
       t.typname AS type,
       CASE a.attstorage
         WHEN 'p' THEN 'PLAIN'
         WHEN 'e' THEN 'EXTERNAL'
         WHEN 'm' THEN 'MAIN'
         WHEN 'x' THEN 'EXTENDED'
       END AS storage
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_type t ON t.oid = a.atttypid
 WHERE n.nspname = 'public'
   AND a.attnum > 0 AND NOT a.attisdropped
   AND c.relkind = 'r'
   AND t.typname IN ('text','jsonb','json','bytea','varchar')
   AND a.attstorage IN ('p','m')
 ORDER BY 1,2,3;
\echo 'REC: ALTER TABLE ... ALTER COLUMN ... SET STORAGE EXTENDED em colunas variable-length.'