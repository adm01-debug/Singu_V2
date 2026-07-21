-- duplicate-indexes.sql — Rodada 17/10
-- Detecta indices redundantes: mesma tabela + mesmas colunas na mesma ordem.
-- Duplicidade dobra custo de escrita e nao acelera leitura.
\echo '== duplicate-indexes =='
SELECT n.nspname AS schemaname,
       c.relname AS table_name,
       array_agg(i.relname ORDER BY i.relname) AS indexes,
       pg_get_indexdef(idx.indexrelid) AS definition
  FROM pg_index idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_class c ON c.oid = idx.indrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
 GROUP BY n.nspname, c.relname,
          idx.indrelid, idx.indkey::text,
          pg_get_indexdef(idx.indexrelid)
HAVING COUNT(*) > 1
 ORDER BY n.nspname, c.relname;
\echo 'INFO: manter apenas o mais canonico (com constraint ou nome padrao).'