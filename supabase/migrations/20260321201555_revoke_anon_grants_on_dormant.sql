-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321201555
-- nome:   revoke_anon_grants_on_dormant

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
