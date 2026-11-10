-- duplicate-indexes.sql — Rodada 17/10
-- Proposito: detecta indices redundantes — mesma tabela, mesmo metodo, mesmas colunas/
--            expressoes na mesma ordem, mesmas opclasses/collations/ordenacao e mesmo
--            predicado. Duplicidade dobra custo de escrita e nao acelera leitura.
-- Classe   : AUDIT (informativo; nunca falha por achado)
-- Variaveis: nenhuma
-- Saida    : 0.
-- Nota     : nao da para agrupar por pg_get_indexdef() — a definicao contem o NOME do
--            indice, entao dois indices identicos nunca cairiam no mesmo grupo.
\set ON_ERROR_STOP on
\pset pager off
\echo '== duplicate-indexes =='
SELECT n.nspname AS schemaname,
       c.relname AS table_name,
       array_agg(i.relname ORDER BY i.relname) AS indexes,
       pg_size_pretty(SUM(pg_relation_size(idx.indexrelid))) AS total_size,
       (array_agg(pg_get_indexdef(idx.indexrelid) ORDER BY i.relname))[1] AS definition
  FROM pg_index idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_class c ON c.oid = idx.indrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname NOT IN ('pg_catalog','information_schema','pg_toast')
 GROUP BY n.nspname, c.relname,
          idx.indrelid, i.relam, idx.indnkeyatts,
          idx.indkey::text, idx.indclass::text, idx.indoption::text, idx.indcollation::text,
          COALESCE(pg_get_expr(idx.indexprs, idx.indrelid), ''),
          COALESCE(pg_get_expr(idx.indpred, idx.indrelid), '')
HAVING COUNT(*) > 1
 ORDER BY n.nspname, c.relname;
\echo 'INFO: manter apenas o mais canonico (com constraint ou nome padrao).'
