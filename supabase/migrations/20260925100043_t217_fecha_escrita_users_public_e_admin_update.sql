-- Achado na auditoria de 2026-09-25: a view users_public (criada no t206/t207) roda com
-- security_invoker=off, ou seja, como o dono (postgres, BYPASSRLS). O GRANT SELECT do t206
-- não removeu os privilégios default que o Supabase concede a `authenticated` em objetos
-- novos do schema public, então `authenticated` ficou com INSERT/UPDATE/DELETE/TRUNCATE
-- numa view updatable sobre public.users => bypass de RLS para ESCRITA: qualquer usuário
-- logado podia alterar email/is_active/is_vendedor de qualquer pessoa. A RLS da tabela
-- segurava escrita direta (só admin_select + service_full), mas não alcança a view.
-- Zero consumidores da view hoje (grep em src/ e supabase/functions/), risco de quebra nulo.
REVOKE ALL ON public.users_public FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.users_public TO authenticated;

-- Consequência não prevista do t212: users ficou só com admin_select (SELECT) + service_full,
-- sem nenhuma policy de UPDATE. A tela de gestão de equipe do rodízio (SalesTeamTab ->
-- useUpdateRodizioMembro) faz UPDATE direto em users (participa_rodizio_*, ordem_rodizio,
-- capacidade_max, afastado_ate) e está quebrada para todo mundo desde ontem.
CREATE POLICY admin_update ON public.users FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
