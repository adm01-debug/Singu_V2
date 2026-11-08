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
