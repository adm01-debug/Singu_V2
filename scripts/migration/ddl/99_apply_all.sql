-- ============================================================================
-- APPLY ALL — ordem obrigatória de aplicação no destino.
-- Uso: psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f 99_apply_all.sql
-- ============================================================================
\echo '── 00 extensions'
\i 00_extensions.sql
\echo '── 01 schemas + enums'
\i 01_schemas_and_enums.sql
\echo '── 02 tables (sem FKs)'
\i 02_tables.sql
\echo '── 11 partitions'
\i 11_partitions.sql
\echo '── 03 indexes'
\i 03_indexes.sql
\echo '── 04 foreign keys'
\i 04_foreign_keys.sql
\echo '── 05 grants'
\i 05_grants.sql
\echo ''
\echo '⏸ PONTO DE PAUSA RECOMENDADO PARA MIGRAÇÃO DE DADOS'
\echo '   Se o destino for receber dados via scripts/migration/import-data.sh:'
\echo '     1. deixe rodar até 08_functions.sql (policies dependem)'
\echo '     2. INTERROMPA antes de 06_rls_enable.sql'
\echo '     3. rode export-data.sh na origem e import-data.sh no destino'
\echo '     4. rode 06/07/09/10 manualmente'
\echo '     5. bash scripts/migration/compare-counts.sh'
\echo '   Ver docs/MIGRATION_DATA.md.'
\echo ''
\echo '── 08 functions (antes das policies: policies chamam has_role e afins)'
\i 08_functions.sql
\echo '── 06 RLS enable'
\i 06_rls_enable.sql
\echo '── 07 policies'
\i 07_policies.sql
\echo '── 09 triggers'
\i 09_triggers.sql
\echo '── 10 views'
\i 10_views.sql
\echo ''
\echo '⚠ 12_cron_jobs.sql deve ser aplicado SEPARADAMENTE, após:'
\echo '   (1) edge functions publicadas no destino'
\echo '   (2) extensão pg_cron habilitada'
\echo '   psql "$TARGET_DB_URL" -f 12_cron_jobs.sql'