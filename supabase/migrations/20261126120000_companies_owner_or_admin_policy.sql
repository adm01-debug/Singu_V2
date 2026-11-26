-- companies: 53.868 de 57.475 linhas tem user_id nulo (carga herdada do Bitrix) e as
-- unicas policies da tabela eram auth.uid() = user_id. Nao existia policy de admin,
-- entao o admin do sistema via 0 empresas: a lista de Empresas, a tela de Grupos
-- Economicos e todo agregado por empresa (dashboards) retornavam zero.
-- Nenhuma coluna aponta o responsavel comercial (created_by_id esta 100% nulo, nao ha
-- owner_id/vendedor), portanto a carteira nao pode ser reconstruida a partir dos dados.
-- Padrao aplicado: o mesmo owner_or_admin de contact_phones/import_jobs.
-- Efeito: admin passa a ler/editar toda a base; cada usuario segue vendo so a carteira dele.

drop policy if exists companies_owner_or_admin on public.companies;

create policy companies_owner_or_admin on public.companies
  for all
  to authenticated
  using (
    (select auth.uid()) = user_id
    or (select public.has_role((select auth.uid()), 'admin'::public.app_role))
  )
  with check (
    (select auth.uid()) = user_id
    or (select public.has_role((select auth.uid()), 'admin'::public.app_role))
  );