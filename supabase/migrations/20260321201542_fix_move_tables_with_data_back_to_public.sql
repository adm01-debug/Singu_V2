-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321201542
-- nome:   fix_move_tables_with_data_back_to_public

-- ============================================================
-- FIX: 6 tabelas com dados movidas por engano para _dormant
-- Causa: pg_class.reltuples desatualizado (mostrava 0)
-- ============================================================

ALTER TABLE _dormant.sales_activities SET SCHEMA public;        -- 18 rows
ALTER TABLE _dormant.company_stakeholder_map SET SCHEMA public; -- 12 rows
ALTER TABLE _dormant.weekly_challenges SET SCHEMA public;       -- 5 rows
ALTER TABLE _dormant.data_quality_audits SET SCHEMA public;     -- 4 rows
ALTER TABLE _dormant.portfolio_settings SET SCHEMA public;      -- 3 rows
ALTER TABLE _dormant.oauth_tokens SET SCHEMA public;            -- 1 row
