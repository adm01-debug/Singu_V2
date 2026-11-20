-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260416223405
-- nome:   singu_extend_app_role_enum

-- Extender app_role com os valores do origem (moderator, user)
-- Preserva os valores existentes (admin, manager, salesperson) que são do CRM
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';

COMMENT ON TYPE public.app_role IS 'SINGU + CRM: Roles de aplicação. Valores CRM: admin, manager, salesperson. Valores SINGU: admin, moderator, user. admin é compartilhado.';
