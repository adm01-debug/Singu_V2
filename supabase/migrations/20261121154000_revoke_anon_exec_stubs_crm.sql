-- As migrations 20260110000001/0002 (baseline compat) recriam stubs de CRM/search
-- via DROP FUNCTION + CREATE, o que concede EXECUTE ao role PUBLIC (incluindo anon)
-- por default do PostgreSQL. O gate de segurança (tests/rls/functions_authenticated_allowlist.sql)
-- falha porque anon então executa rotinas fora da allowlist pública:
--   ERROR: anon executa função(ões) fora da allowlist pública: ativar_cliente(...), ...
-- Correção: revoga PUBLIC/anon (preserva o invariante) e concede a authenticated
-- (rotinas chamadas por usuários autenticados; não são SECURITY DEFINER, rodam sob RLS).
BEGIN;

REVOKE EXECUTE ON FUNCTION public.ativar_cliente(uuid, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.inativar_cliente(uuid, text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.transferir_cliente(uuid, integer, text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.registrar_compra(uuid, numeric, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sdr_qualificar_cliente(uuid, integer, integer, text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_companies(text, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.search_contacts(text, integer) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.ativar_cliente(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inativar_cliente(uuid, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transferir_cliente(uuid, integer, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_compra(uuid, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sdr_qualificar_cliente(uuid, integer, integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_companies(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_contacts(text, integer) TO authenticated;

COMMIT;