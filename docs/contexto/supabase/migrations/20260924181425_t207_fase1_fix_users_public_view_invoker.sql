-- Corrige t206: com security_invoker=on a view herda a RLS de users, e acabamos de remover
-- a policy de SELECT para authenticated -> view retornava 0 linhas. View deve rodar como dono (padrão),
-- não como invoker, para expor as colunas seguras sem precisar reabrir RLS de users para authenticated.
CREATE OR REPLACE VIEW public.users_public
WITH (security_invoker = off) AS
SELECT id, name, email, departamento, is_active, is_vendedor
FROM public.users;

GRANT SELECT ON public.users_public TO authenticated;
