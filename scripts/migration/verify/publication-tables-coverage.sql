-- publication-tables-coverage.sql — Rodada 17/10
-- Detecta tabelas public fora da publicacao logica de CDC.
\echo '== publication-tables-coverage =='
WITH pub AS (
  SELECT schemaname, tablename FROM pg_publication_tables
   WHERE pubname IN (SELECT pubname FROM pg_publication WHERE puballtables = false)
),
public_tables AS (
  SELECT n.nspname AS schemaname, c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.relkind = 'r' AND n.nspname = 'public'
)
SELECT t.schemaname, t.tablename
  FROM public_tables t
  LEFT JOIN pub p USING (schemaname, tablename)
 WHERE p.tablename IS NULL
   AND EXISTS (SELECT 1 FROM pg_publication WHERE puballtables = false)
 ORDER BY t.tablename;
\echo 'WARN: adicionar ALTER PUBLICATION ... ADD TABLE para as listadas.'