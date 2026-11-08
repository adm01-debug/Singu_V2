-- ============================================================
-- FIX: Conceder acesso SOMENTE LEITURA em _dormant
-- para que functions SECURITY INVOKER resolvam nomes de tabelas
-- Tabelas são 100% vazias — sem risco de exposição de dados
-- ============================================================

-- USAGE: permite resolver nomes de tabelas no schema
GRANT USAGE ON SCHEMA _dormant TO anon;
GRANT USAGE ON SCHEMA _dormant TO authenticated;

-- SELECT apenas (sem INSERT/UPDATE/DELETE)
GRANT SELECT ON ALL TABLES IN SCHEMA _dormant TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA _dormant TO authenticated;

-- Garantir que futuras tabelas movidas para _dormant herdem o mesmo grant
ALTER DEFAULT PRIVILEGES IN SCHEMA _dormant GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA _dormant GRANT SELECT ON TABLES TO authenticated;
