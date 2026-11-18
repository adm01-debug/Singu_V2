-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721201259
-- nome:   revoke_net_schema_public_execute

-- Migration: revoke_net_schema_public_execute (Wave 148)
-- CRITICAL SECURITY FIX: Revokes PUBLIC/anon/authenticated EXECUTE on all
-- net schema functions to close SSRF vector via pg_net.
-- service_role retains access; SECURITY DEFINER functions that call
-- net.http_* internally continue to work (run as function owner).

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM anon;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA net FROM authenticated;
