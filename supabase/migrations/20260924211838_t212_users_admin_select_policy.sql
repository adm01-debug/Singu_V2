-- t206/t207 (etapa 24) trancou users para authenticated; as views do rodizio (security_invoker)
-- leem users e zeraram para o front. Admin volta a ler a tabela completa; demais seguem na users_public.
DROP POLICY IF EXISTS admin_select ON public.users;
CREATE POLICY admin_select ON public.users
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
