-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321202851
-- nome:   fix_grant_readonly_dormant_for_anon

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
