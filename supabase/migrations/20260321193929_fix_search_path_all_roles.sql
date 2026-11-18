-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260321193929
-- nome:   fix_search_path_all_roles

-- Configurar search_path em TODOS os roles que acessam o banco
ALTER ROLE postgres SET search_path TO public, _dormant, extensions;
ALTER ROLE anon SET search_path TO public, _dormant, extensions;
ALTER ROLE authenticated SET search_path TO public, _dormant, extensions;
ALTER ROLE service_role SET search_path TO public, _dormant, extensions;
ALTER ROLE authenticator SET search_path TO public, _dormant, extensions;
