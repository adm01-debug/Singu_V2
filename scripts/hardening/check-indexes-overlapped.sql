-- check-indexes-overlapped.sql — Auditoria hardening 26/11.
-- Detecta índices SOBREPOSTOS: um índice btree cujas colunas-chave são prefixo exato de outro
-- btree da mesma tabela (mesma ordem, opclass, collation e ASC/DESC, mesmo predicado WHERE).
-- O índice maior atende às mesmas buscas; o menor só custa escrita e espaço.
-- NÃO é sobreposição (e a versão antiga acusava): o índice menor é UNIQUE/PK ou sustenta
-- constraint (ele garante unicidade, o maior não); predicados diferentes (parcial x cheio);
-- índice com expressão ou com colunas INCLUDE; métodos diferentes de btree.
-- Definições idênticas são tratadas no check-indexes-duplicated.sql.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-indexes-overlapped.sql
-- Saída: tabela com os achados; termina com "OK check-indexes-overlapped." (código 0) ou "FATAL: check-indexes-overlapped: ..." no
--   stderr (código 3). Somente leitura.
-- Parâmetros (psql -v): ignorar_schemas='a,b' troca a lista de schemas da plataforma Supabase
--   ignorados por padrão (use '' para auditar tudo); ignorar='schema.objeto,...' aceita exceções
--   já conhecidas. Em `ignorar`, use schema.nome_do_indice. Objetos que pertencem a extensões nunca contam.
\echo '== check-indexes-overlapped =='
\pset pager off
\set ON_ERROR_STOP on
\if :{?ignorar_schemas}
\else
  \set ignorar_schemas 'auth,storage,realtime,_realtime,extensions,graphql,graphql_public,net,pgsodium,pgsodium_masks,vault,supabase_functions,supabase_migrations,cron,pgbouncer,pgmq,pgtle,repack,_analytics,_supavisor'
\endif
\if :{?ignorar}
\else
  \set ignorar ''
\endif

WITH idx AS (
  SELECT pi.indexrelid, pi.indrelid, c.relam, am.amname AS metodo, pi.indnkeyatts, pi.indnatts,
         pi.indisunique, pi.indexprs IS NOT NULL AS tem_expressao,
         string_to_array(pi.indkey::text, ' ')       AS colunas,
         string_to_array(pi.indclass::text, ' ')     AS classes,
         string_to_array(pi.indcollation::text, ' ') AS collations,
         string_to_array(pi.indoption::text, ' ')    AS opcoes,
         COALESCE(pg_catalog.pg_get_expr(pi.indexprs, pi.indrelid), '') AS expressoes,
         COALESCE(pg_catalog.pg_get_expr(pi.indpred, pi.indrelid), '')  AS predicado,
         EXISTS (SELECT 1 FROM pg_catalog.pg_constraint k WHERE k.conindid = pi.indexrelid) AS de_constraint,
         n.nspname AS schema, t.relname AS tabela, c.relname AS indice
    FROM pg_catalog.pg_index pi
    JOIN pg_catalog.pg_class c ON c.oid = pi.indexrelid
    JOIN pg_catalog.pg_class t ON t.oid = pi.indrelid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_catalog.pg_am am ON am.oid = c.relam
   WHERE pi.indisvalid AND pi.indisready
     AND n.nspname NOT IN ('pg_catalog', 'information_schema')
     AND n.nspname !~ '^pg_(toast|temp)'
     AND n.nspname <> ALL (regexp_split_to_array(btrim(:'ignorar_schemas'), '\s*,\s*'))
     AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                    WHERE d.classid = 'pg_catalog.pg_class'::regclass AND d.objid = t.oid AND d.deptype = 'e')
     AND (n.nspname || '.' || c.relname) <> ALL (regexp_split_to_array(btrim(:'ignorar'), '\s*,\s*'))
)
SELECT a.schema || '.' || a.tabela AS tabela,
       a.indice AS indice_redundante,
       b.indice AS coberto_por
  FROM idx a
  JOIN idx b ON a.indrelid = b.indrelid AND a.indexrelid <> b.indexrelid
 WHERE a.metodo = 'btree' AND b.metodo = 'btree'
   AND NOT a.indisunique AND NOT a.de_constraint
   AND NOT a.tem_expressao AND a.indnatts = a.indnkeyatts
   AND a.indnkeyatts < b.indnkeyatts
   AND a.predicado = b.predicado
   AND '0' <> ALL (b.colunas[1:a.indnkeyatts])
   AND b.colunas[1:a.indnkeyatts]    = a.colunas[1:a.indnkeyatts]
   AND b.classes[1:a.indnkeyatts]    = a.classes[1:a.indnkeyatts]
   AND b.collations[1:a.indnkeyatts] = a.collations[1:a.indnkeyatts]
   AND b.opcoes[1:a.indnkeyatts]     = a.opcoes[1:a.indnkeyatts]
 ORDER BY 1, 2, 3;

SELECT :ROW_COUNT AS achados \gset
SELECT :achados = 0 AS limpo \gset
\if :limpo
  \echo 'OK check-indexes-overlapped.'
\else
  \warn 'FATAL: check-indexes-overlapped:' :achados 'par(es) de indices SOBREPOSTOS por prefixo (lista acima).'
  DO $$ BEGIN RAISE EXCEPTION 'check-indexes-overlapped reprovado'; END $$;
\endif
