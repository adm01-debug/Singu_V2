-- check-publication-without-pk.sql — Auditoria hardening 26/11.
-- Verifica se alguma tabela SEM identidade de réplica utilizável está em publicação
-- lógica/realtime que replica UPDATE ou DELETE. Sem PK (REPLICA IDENTITY DEFAULT), com
-- REPLICA IDENTITY NOTHING, ou com USING INDEX cujo índice sumiu, o UPDATE/DELETE na
-- tabela publicada FALHA na origem ("cannot update table ... because it does not have a
-- replica identity") — risco direto para Supabase Realtime/base de replicação.
-- REPLICA IDENTITY FULL é aceito (funciona sem PK); publicação só de INSERT não é risco.
-- Produção auditada: nenhuma tabela nessa situação.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-publication-without-pk.sql
-- Saída: tabela com os achados; termina com "OK check-publication-without-pk." (código 0) ou "FATAL: check-publication-without-pk: ..." no
--   stderr (código 3). Somente leitura.
-- Parâmetros (psql -v): ignorar_schemas='a,b' troca a lista de schemas da plataforma Supabase
--   ignorados por padrão (use '' para auditar tudo); ignorar='schema.objeto,...' aceita exceções
--   já conhecidas. Objetos que pertencem a extensões nunca contam.
\echo '== check-publication-without-pk =='
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

SELECT pt.pubname AS publicacao,
       pt.schemaname || '.' || pt.tablename AS tabela,
       CASE c.relreplident WHEN 'd' THEN 'DEFAULT (sem PK)' WHEN 'n' THEN 'NOTHING'
                           WHEN 'i' THEN 'USING INDEX (indice ausente)' END AS replica_identity
  FROM pg_catalog.pg_publication_tables pt
  JOIN pg_catalog.pg_publication p ON p.pubname = pt.pubname
  JOIN pg_catalog.pg_namespace n ON n.nspname = pt.schemaname
  JOIN pg_catalog.pg_class c ON c.relnamespace = n.oid AND c.relname = pt.tablename
 WHERE (p.pubupdate OR p.pubdelete)
   AND n.nspname NOT IN ('pg_catalog', 'information_schema')
   AND n.nspname !~ '^pg_(toast|temp)'
   AND n.nspname <> ALL (regexp_split_to_array(btrim(:'ignorar_schemas'), '\s*,\s*'))
   AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                    WHERE d.classid = 'pg_catalog.pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e')
   AND (pt.schemaname || '.' || pt.tablename) <> ALL (regexp_split_to_array(btrim(:'ignorar'), '\s*,\s*'))
   AND CASE c.relreplident
         WHEN 'f' THEN false
         WHEN 'n' THEN true
         WHEN 'i' THEN NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i
                                    WHERE i.indrelid = c.oid AND i.indisreplident AND i.indisvalid)
         ELSE NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i
                           WHERE i.indrelid = c.oid AND i.indisprimary)
       END
 ORDER BY pt.pubname, pt.schemaname, pt.tablename;

SELECT :ROW_COUNT AS achados \gset
SELECT :achados = 0 AS limpo \gset
\if :limpo
  \echo 'OK check-publication-without-pk.'
\else
  \warn 'FATAL: check-publication-without-pk:' :achados 'tabela(s) publicada(s) sem identidade de replica (lista acima).'
  DO $$ BEGIN RAISE EXCEPTION 'check-publication-without-pk reprovado'; END $$;
\endif
