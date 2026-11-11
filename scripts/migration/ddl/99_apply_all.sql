-- ============================================================================
-- APPLY ALL — ordem obrigatória de aplicação no destino.
-- Uso: psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f 99_apply_all.sql
--      (pode ser chamado de qualquer diretório: os \ir são relativos a este arquivo)
--
-- NÃO É IDEMPOTENTE: os arquivos 01–11 são dump (CREATE TYPE/TABLE/POLICY sem
-- IF NOT EXISTS) para um projeto Supabase NOVO E VAZIO. Rodar duas vezes no mesmo
-- banco para no primeiro "already exists" — recrie o projeto destino antes de repetir.
--
-- Ordem: 00 → 01 → 02 → 11 → 10 → 08 → 03 → 04 → 05 → 06 → 07 → 09
--   10 antes de 08: search_contacts_by_nlp() RETURNS SETOF vw_contacts_nlp (tipo da view);
--                   as views só usam tabelas e funções nativas.
--   08 antes de 03: 4 índices GIN usam public.immutable_unaccent().
--   08 antes de 07: policies chamam public.has_role() e afins.
--   08 antes de 05: 05_grants.sql termina com REVOKE/GRANT EXECUTE de cada função de public
--                   (sem isso toda SECURITY DEFINER fica executável por PUBLIC/anon).
--   check_function_bodies=off em 08 (como o pg_dump faz): há função SQL que referencia
--   objeto criado depois / fora do search_path dela; o corpo é validado só na chamada.
-- ============================================================================
\echo '── 00 extensions'
\ir 00_extensions.sql
\echo '── 01 schemas + enums'
\ir 01_schemas_and_enums.sql
\echo '── 02 tables (sem FKs)'
\ir 02_tables.sql
\echo '── 11 partitions'
\ir 11_partitions.sql
\echo '── 10 views (antes das functions: há função que retorna SETOF de view)'
\ir 10_views.sql
\echo '── 08 functions (antes de índices e policies: ambos chamam funções de public)'
SET check_function_bodies = off;
\ir 08_functions.sql
RESET check_function_bodies;
\echo '── 03 indexes'
\ir 03_indexes.sql
\echo '── 04 foreign keys'
\ir 04_foreign_keys.sql
\echo '── 05 grants'
\ir 05_grants.sql
\echo ''
\echo '⏸ PONTO DE PAUSA RECOMENDADO PARA MIGRAÇÃO DE DADOS'
\echo '   Se o destino for receber dados via scripts/migration/import-data.sh:'
\echo '     1. deixe rodar até 05_grants.sql (functions e views já foram criadas acima)'
\echo '     2. INTERROMPA antes de 06_rls_enable.sql'
\echo '     3. rode export-data.sh na origem e import-data.sh no destino'
\echo '     4. rode 06/07/09 manualmente'
\echo '     5. bash scripts/migration/compare-counts.sh'
\echo '   Ver docs/MIGRATION_DATA.md.'
\echo ''
\echo '── 06 RLS enable'
\ir 06_rls_enable.sql
\echo '── 07 policies'
\ir 07_policies.sql
\echo '── 09 triggers'
\ir 09_triggers.sql
\echo ''
\echo '⚠ 12_cron_jobs.sql deve ser aplicado SEPARADAMENTE, após:'
\echo '   (1) edge functions publicadas no destino'
\echo '   (2) extensão pg_cron habilitada'
\echo '   psql "$TARGET_DB_URL" -f 12_cron_jobs.sql'
