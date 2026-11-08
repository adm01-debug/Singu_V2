-- Otimizar user_roles_auth_select — envolver auth.uid() em SELECT para cache do planner
DROP POLICY IF EXISTS user_roles_auth_select ON public.user_roles;
CREATE POLICY user_roles_auth_select ON public.user_roles
FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR has_role((SELECT auth.uid()), 'admin'::app_role));
