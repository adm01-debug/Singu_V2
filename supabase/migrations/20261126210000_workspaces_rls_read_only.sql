-- workspace_accounts guarda o diretório sincronizado do Google Workspace, mas as quatro
-- policies usavam `id = auth.uid()`. `id` é o UUID da conta de workspace, não o do usuário
-- logado, então nenhuma linha casava: as 29 contas (22 usuários + 7 grupos) ficavam
-- invisíveis para todo mundo, inclusive para admin, e vw_workspace_overview (security_invoker)
-- herdava o mesmo bloqueio, zerando a tela de contas do Workspace.
--
-- A leitura passa a ser do admin; a escrita continua restrita ao service_role (sync do Google).
DO $$
BEGIN
  IF to_regclass('public.workspace_accounts') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'DROP POLICY IF EXISTS workspace_accounts_select ON public.workspace_accounts';
  EXECUTE 'DROP POLICY IF EXISTS workspace_accounts_insert ON public.workspace_accounts';
  EXECUTE 'DROP POLICY IF EXISTS workspace_accounts_update ON public.workspace_accounts';
  EXECUTE 'DROP POLICY IF EXISTS workspace_accounts_delete ON public.workspace_accounts';

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'workspace_accounts'
      AND policyname = 'workspace_accounts_select_admin'
  ) THEN
    EXECUTE $p$CREATE POLICY workspace_accounts_select_admin ON public.workspace_accounts
      FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'::public.app_role))$p$;
  END IF;
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.workspace_accounts FROM authenticated, anon;
GRANT SELECT ON public.workspace_accounts TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.vw_workspace_overview') IS NOT NULL THEN
    EXECUTE 'REVOKE INSERT, UPDATE, DELETE ON public.vw_workspace_overview FROM authenticated, anon';
    EXECUTE 'GRANT SELECT ON public.vw_workspace_overview TO authenticated';
  END IF;
END $$;