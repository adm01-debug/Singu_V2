-- RBAC: /admin/roles precisa listar os perfis para atribuir/revogar papéis.
-- Antes, só o próprio perfil era visível (`singu_profiles_select`), o que obrigava a
-- conceder papel por SQL manual. A escrita em `user_roles` já é liberada por
-- "Admins can insert roles"/"Admins can delete roles" (has_role(auth.uid(),'admin')).
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));