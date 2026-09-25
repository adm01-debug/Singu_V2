-- Fase 1 (plano banco-único Singu) — contenção de segurança urgente
-- etapas 9,10,11,14,15,16 do plano; 0 chamadas a exec_sql/execute_readonly_query nas últimas 24h (checado via query_logs antes de revogar)
-- Aplicada em produção via MCP em 2026-09-24. Este arquivo é o registro versionado (etapa 26).

-- 9: exec_sql executa SQL arbitrário como dono do banco, hoje exposto a anon+authenticated
REVOKE EXECUTE ON FUNCTION public.exec_sql(text) FROM anon, authenticated, public;

-- 10: execute_readonly_query hoje exposto a authenticated (anon já não tinha)
REVOKE EXECUTE ON FUNCTION public.execute_readonly_query(text) FROM authenticated, public;

-- 11: funções de criptografia de config de conexão expostas ao anon
REVOKE EXECUTE ON FUNCTION public.decrypt_connection_config(bytea) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.encrypt_connection_config(jsonb) FROM anon, public;

-- 14: abm_account_plans sem RLS (já tinha 3 policies escritas, só faltava ligar)
ALTER TABLE public.abm_account_plans ENABLE ROW LEVEL SECURITY;

-- 15: view rodava com privilégio do dono -> passa a respeitar RLS de quem chama
ALTER VIEW public.vw_singu_data_health SET (security_invoker = on);

-- 16: search_path mutável nessas 3 funções (não são SECURITY DEFINER, mas trava por boa prática)
ALTER FUNCTION public.normalizar_cnpj(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.title_case_pt(text) SET search_path = public, pg_temp;
ALTER FUNCTION public.title_case_pt_aux(text) SET search_path = public, pg_temp;
