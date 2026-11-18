-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417104948
-- nome:   qa_fix_user_roles_policy_optimize

-- Otimizar user_roles_auth_select — envolver auth.uid() em SELECT para cache do planner
DROP POLICY IF EXISTS user_roles_auth_select ON public.user_roles;
CREATE POLICY user_roles_auth_select ON public.user_roles
FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role));
