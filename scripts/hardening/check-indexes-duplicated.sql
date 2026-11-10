-- check-indexes-duplicated.sql — Auditoria hardening 26/11.
-- Detecta índices DUPLICADOS: mesma tabela e definição idêntica (mesmo access method, mesmas
-- colunas/expressões na mesma ordem, mesma opclass, collation, ASC/DESC, colunas INCLUDE e
-- mesmo predicado WHERE) — só o nome muda. Cada cópia dobra o custo de escrita e ocupa espaço
-- sem benefício de leitura.
-- NÃO é duplicata (e a versão antiga acusava): índice parcial x índice cheio nas mesmas colunas,
-- expressões diferentes, opclass/ordem diferentes. Um UNIQUE e um não-único idênticos contam:
-- o não-único é dispensável. A coluna `manter` indica qual dos dois sustenta constraint.
-- Overlap parcial (prefixo) é tratado no check-indexes-overlapped.sql.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-indexes-duplicated.sql
-- Saída: tabela com os achados; termina com "OK check-indexes-duplicated." (código 0) ou "FATAL: check-indexes-duplicated: ..." no
--   stderr (código 3). Somente leitura.
-- Parâmetros (psql -v): ignorar_schemas='a,b' troca a lista de schemas da plataforma Supabase
--   ignorados por padrão (use '' para auditar tudo); ignorar='schema.objeto,...' aceita exceções
--   já conhecidas. Em `ignorar`, use schema.nome_do_indice. Objetos que pertencem a extensões nunca contam.
\echo '== check-indexes-duplicated =='
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
       a.metodo || ':' || a.indice AS indice_a,
       b.metodo || ':' || b.indice AS indice_b,
       CASE WHEN a.de_constraint AND b.de_constraint THEN 'ambos sustentam constraint'
            WHEN a.de_constraint OR (a.indisunique AND NOT b.indisunique) THEN a.indice
            WHEN b.de_constraint OR (b.indisunique AND NOT a.indisunique) THEN b.indice
            ELSE 'qualquer um' END AS manter
  FROM idx a
  JOIN idx b ON a.indrelid = b.indrelid AND a.indexrelid < b.indexrelid
 WHERE a.relam = b.relam AND a.indnkeyatts = b.indnkeyatts AND a.colunas = b.colunas
   AND a.classes = b.classes AND a.collations = b.collations AND a.opcoes = b.opcoes
   AND a.expressoes = b.expressoes AND a.predicado = b.predicado
 ORDER BY 1, 2, 3;

SELECT :ROW_COUNT AS achados \gset
SELECT :achados = 0 AS limpo \gset
\if :limpo
  \echo 'OK check-indexes-duplicated.'
\else
  \warn 'FATAL: check-indexes-duplicated:' :achados 'par(es) de indices DUPLICADOS (lista acima).'
  DO $$ BEGIN RAISE EXCEPTION 'check-indexes-duplicated reprovado'; END $$;
\endif
