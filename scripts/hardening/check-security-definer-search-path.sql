-- check-security-definer-search-path.sql — Auditoria hardening 26/11.
-- Funções SECURITY DEFINER precisam de search_path FIXO começando em pg_catalog.
-- Search_path aberto permite hijack: usuário cria objeto em schema anterior de
-- busca e a função (rodando como owner/role) executa código não intencional
-- (privilege escalation clássico).
-- Na produção auditada, 172/175 funções SECURITY DEFINER usam search_path que
-- começa em 'public' ou variável — candidatas a fix. As 3 seguras seguem o padrão
-- 'search_path=pg_catalog, public'.
-- Aceito: search_path vazio (`SET search_path = ''`, o mais restrito — a versão antiga o
-- acusava) ou lista cujo PRIMEIRO schema é pg_catalog e que não contém "$user".
-- Limite conhecido: não exige pg_temp no fim da lista (boa prática adicional do PostgreSQL).
-- A função pgbouncer.get_auth (schema pgbouncer) é interna do Supabase e fora do
-- nosso controle — pgbouncer está na lista padrão de schemas ignorados.
-- Uso:   psql "$SUPABASE_DB_URL" -X -f scripts/hardening/check-security-definer-search-path.sql
-- Saída: tabela com os achados; termina com "OK check-security-definer-search-path." (código 0) ou "FATAL: check-security-definer-search-path: ..." no
--   stderr (código 3). Somente leitura.
-- Parâmetros (psql -v): ignorar_schemas='a,b' troca a lista de schemas da plataforma Supabase
--   ignorados por padrão (use '' para auditar tudo); ignorar='schema.objeto,...' aceita exceções
--   já conhecidas. Em `ignorar`, use schema.nome_da_funcao. Objetos que pertencem a extensões nunca contam.
\echo '== check-security-definer-search-path =='
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

WITH f AS (
  SELECT p.oid, n.nspname, p.proname,
         (SELECT substring(cfg FROM '^search_path=(.*)$')
            FROM unnest(p.proconfig) AS cfg WHERE cfg LIKE 'search_path=%') AS caminho
    FROM pg_catalog.pg_proc p
    JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
   WHERE p.prosecdef
     AND n.nspname NOT IN ('pg_catalog', 'information_schema')
     AND n.nspname !~ '^pg_(toast|temp)'
     AND n.nspname <> ALL (regexp_split_to_array(btrim(:'ignorar_schemas'), '\s*,\s*'))
     AND NOT EXISTS (SELECT 1 FROM pg_catalog.pg_depend d
                    WHERE d.classid = 'pg_catalog.pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')
     AND (n.nspname || '.' || p.proname) <> ALL (regexp_split_to_array(btrim(:'ignorar'), '\s*,\s*'))
)
SELECT nspname || '.' || proname AS func,
       pg_catalog.pg_get_function_identity_arguments(oid) AS args,
       COALESCE(caminho, '(nao definido: herda o da sessao)') AS search_path
  FROM f
 WHERE caminho IS NULL
    OR caminho ~ '\$user'
    OR NOT (btrim(caminho) IN ('', '""')
            OR btrim(split_part(caminho, ',', 1), ' "') = 'pg_catalog')
 ORDER BY 1, 2;

SELECT :ROW_COUNT AS achados \gset
SELECT :achados = 0 AS limpo \gset
\if :limpo
  \echo 'OK check-security-definer-search-path.'
\else
  \warn 'FATAL: check-security-definer-search-path:' :achados 'funcao(oes) SECURITY DEFINER sem search_path fixo comecando em pg_catalog (lista acima).'
  DO $$ BEGIN RAISE EXCEPTION 'check-security-definer-search-path reprovado'; END $$;
\endif
