-- ============================================================
-- SEGURANÇA: Revogar acesso do anon a tabelas em _dormant
-- Apenas service_role e postgres podem acessar
-- ============================================================

REVOKE ALL ON ALL TABLES IN SCHEMA _dormant FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA _dormant FROM authenticated;
REVOKE USAGE ON SCHEMA _dormant FROM anon;
REVOKE USAGE ON SCHEMA _dormant FROM authenticated;

-- Apenas postgres e service_role mantêm acesso
GRANT USAGE ON SCHEMA _dormant TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA _dormant TO service_role;
