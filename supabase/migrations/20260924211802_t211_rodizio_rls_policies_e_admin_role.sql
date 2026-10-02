-- Fix do gap que deixava o /rodizio (PR #51) sem dados: 4 tabelas com RLS ligada e zero policies,
-- views security_invoker. Escrita segue exclusiva do service_role (RPCs sem grant p/ authenticated).
-- has_role() exigia user_roles populada (estava com 0 linhas) — entra o primeiro admin: adm01.

INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role FROM auth.users au
WHERE au.email = 'adm01@promobrindes.com.br'
  AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = au.id AND ur.role = 'admin'::app_role);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['customer_purchases','customer_rotation_state','rodizio_distribuicao_staging','rodizio_execucoes'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('DROP POLICY IF EXISTS admin_select ON public.%I', t);
      EXECUTE format('CREATE POLICY admin_select ON public.%I FOR SELECT TO authenticated USING (has_role(auth.uid(), ''admin''::app_role))', t);
    END IF;
  END LOOP;
END $$;
