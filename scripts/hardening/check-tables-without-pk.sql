-- check-tables-without-pk.sql — Auditoria hardening 26/11.
-- Detecta tabelas sem PRIMARY KEY. Sem PK não há garantia de unicidade de linha,
-- replica lógica fica sem REPLICA IDENTITY adequada e ferramentas de CDC sofrem.
-- Na produção auditada só restaram tabelas de sistema/utilitário sem PK (net.*,
-- ops_backup.acl_snapshot) — nenhuma publicada em realtime, risco de replicação baixo.
-- Conta tabelas comuns e particionadas (a partição filha herda a PK da mãe e não é listada);
-- tabelas temporárias de outras sessões e tabelas de extensões (ex.: net.*) ficam de fora.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-tables-without-pk.sql
-- Saída: tabela com os achados; termina com "OK check-tables-without-pk." (código 0) ou "FATAL: check-tables-without-pk: ..." no
--   stderr (código 3). Somente leitura.
-- Parâmetros (psql -v): ignorar_schemas='a,b' troca a lista de schemas da plataforma Supabase
--   ignorados por padrão (use '' para auditar tudo); ignorar='schema.objeto,...' aceita exceções
--   já conhecidas. Objetos que pertencem a extensões nunca contam.
\echo '== check-tables-without-pk =='
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

SELECT n.nspname AS schema, c.relname AS tabela,
       CASE c.relkind WHEN 'p' THEN 'particionada' ELSE 'comum' END AS tipo,
       c.reltuples::bigint AS linhas_estimadas
  FROM pg_catalog.pg_class c
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
 WHERE c.relkind IN ('r', 'p') AND NOT c.relispartition
   AND n.nspname NOT IN ('pg_catalog', 'information_schema')
   AND n.nspname !~ '^pg_(toast|temp)'
   AND n.nspname <> ALL (regexp_split_to_array(btrim(:'ignorar_schemas'), '\s*,\s*'))
   AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                    WHERE d.classid = 'pg_catalog.pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e')
   AND (n.nspname || '.' || c.relname) <> ALL (regexp_split_to_array(btrim(:'ignorar'), '\s*,\s*'))
   AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_index i
                    WHERE i.indrelid = c.oid AND i.indisprimary)
 ORDER BY n.nspname, c.relname;

SELECT :ROW_COUNT AS achados \gset
SELECT :achados = 0 AS limpo \gset
\if :limpo
  \echo 'OK check-tables-without-pk.'
\else
  \warn 'FATAL: check-tables-without-pk:' :achados 'tabela(s) sem PRIMARY KEY (lista acima).'
  DO $$ BEGIN RAISE EXCEPTION 'check-tables-without-pk reprovado'; END $$;
\endif
