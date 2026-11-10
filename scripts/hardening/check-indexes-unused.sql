-- check-indexes-unused.sql — Auditoria hardening 26/11.
-- Detecta índices com idx_scan = 0 desde o último reset de estatísticas,
-- em tabelas com >= 1000 linhas estimadas. Índice não usado ainda custa escrita em
-- todo INSERT/UPDATE/DELETE e ocupa espaço (observe storage.objects: ~24 MB em
-- 6 índices sem scan).
-- Índices UNIQUE/PK e os que sustentam constraint NÃO contam: mesmo sem leitura eles garantem
-- a regra de unicidade/exclusão e não podem ser removidos (a versão antiga os acusava).
-- Risco de falso positivo: idx_scan zera em REINDEX/reset e índices usados só em
-- manutenção/relatórios sazonais passam despercebidos. Decisão de DROP é humana — confira a
-- data do último reset impressa abaixo antes de concluir.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-indexes-unused.sql
-- Saída: tabela com os achados; termina com "OK check-indexes-unused." (código 0) ou "FATAL: check-indexes-unused: ..." no
--   stderr (código 3). Somente leitura.
-- Parâmetros (psql -v): ignorar_schemas='a,b' troca a lista de schemas da plataforma Supabase
--   ignorados por padrão (use '' para auditar tudo); ignorar='schema.objeto,...' aceita exceções
--   já conhecidas. min_linhas=N muda o corte de 1000 linhas. Em `ignorar`, use schema.nome_do_indice. Objetos que pertencem a extensões nunca contam.
\echo '== check-indexes-unused =='
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
\if :{?min_linhas}
\else
  \set min_linhas 1000
\endif

SELECT COALESCE(stats_reset::text, 'nunca (desde a criacao do banco)') AS estatisticas_zeradas_em
  FROM pg_catalog.pg_stat_database WHERE datname = current_database();

SELECT s.schemaname AS schema, s.relname AS tabela, s.indexrelname AS indice,
       s.idx_scan, pg_catalog.pg_relation_size(s.indexrelid) AS bytes,
       c.reltuples::bigint AS linhas_estimadas
  FROM pg_catalog.pg_stat_user_indexes s
  JOIN pg_catalog.pg_class c ON c.oid = s.relid
  JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_catalog.pg_index pi ON pi.indexrelid = s.indexrelid
 WHERE s.idx_scan = 0 AND c.reltuples >= :min_linhas
   AND c.relkind = 'r' AND pi.indisvalid
   AND NOT pi.indisunique AND NOT pi.indisprimary
   AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_constraint k WHERE k.conindid = s.indexrelid)
   AND n.nspname NOT IN ('pg_catalog', 'information_schema')
   AND n.nspname !~ '^pg_(toast|temp)'
   AND n.nspname <> ALL (regexp_split_to_array(btrim(:'ignorar_schemas'), '\s*,\s*'))
   AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                    WHERE d.classid = 'pg_catalog.pg_class'::regclass AND d.objid = c.oid AND d.deptype = 'e')
   AND (s.schemaname || '.' || s.indexrelname) <> ALL (regexp_split_to_array(btrim(:'ignorar'), '\s*,\s*'))
 ORDER BY pg_catalog.pg_relation_size(s.indexrelid) DESC, s.schemaname, s.indexrelname;

SELECT :ROW_COUNT AS achados \gset
SELECT :achados = 0 AS limpo \gset
\if :limpo
  \echo 'OK check-indexes-unused.'
\else
  \warn 'FATAL: check-indexes-unused:' :achados 'indice(s) sem uso em tabelas grandes (lista acima).'
  DO $$ BEGIN RAISE EXCEPTION 'check-indexes-unused reprovado'; END $$;
\endif
