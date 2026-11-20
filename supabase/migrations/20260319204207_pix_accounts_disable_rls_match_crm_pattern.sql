-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260319204207
-- nome:   pix_accounts_disable_rls_match_crm_pattern

-- Desabilitar RLS para manter consistência com o padrão do CRM
-- (companies, suppliers, carriers, company_social_media — nenhuma tem RLS)
ALTER TABLE public.pix_accounts DISABLE ROW LEVEL SECURITY;
