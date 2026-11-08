BEGIN;
SELECT set_config('rls.email_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('rls.email_other', (
  SELECT u.id::text FROM auth.users u
  WHERE u.id::text <> current_setting('rls.email_owner')
    AND NOT EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = u.id AND r.role = 'admin')
  ORDER BY u.created_at LIMIT 1
), true);
DO $identities$
BEGIN
  IF nullif(current_setting('rls.email_owner'), '') IS NULL
    OR nullif(current_setting('rls.email_other'), '') IS NULL THEN
    RAISE EXCEPTION 'São necessárias duas contas cadastradas, uma delas sem papel administrativo';
  END IF;
END;
$identities$;
SELECT set_config('rls.email_company', gen_random_uuid()::text, true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.email_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.email_owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  cid uuid := current_setting('rls.email_company')::uuid;
  initial_id uuid;
  repeated_id uuid;
  denied boolean := false;
BEGIN
  PERFORM public.persist_company_composite(cid, '{"nome_crm":"Contrato de email"}', true);
  initial_id := public.upsert_company_email(cid, 'case@example.test', NULL, false, 'Teste RLS', 'Inicial');
  repeated_id := public.upsert_company_email(cid, 'CASE@EXAMPLE.TEST', NULL, true, 'Teste RLS', 'Atualizado');
  IF initial_id IS DISTINCT FROM repeated_id
    OR (SELECT count(*) FROM public.company_emails WHERE company_id = cid) <> 1
    OR NOT EXISTS (SELECT 1 FROM public.company_emails WHERE id = initial_id
      AND is_primary AND observacao = 'Atualizado') THEN
    RAISE EXCEPTION 'Nova tentativa duplicou o email ou não atualizou seus metadados';
  END IF;
  BEGIN
    INSERT INTO public.company_emails(company_id, email) VALUES (cid, 'Case@example.test');
  EXCEPTION WHEN unique_violation THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Escrita direta aceitou email duplicado'; END IF;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', current_setting('rls.email_other'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.email_other'), 'role', 'authenticated')::text, true);
DO $tenant$
DECLARE
  cid uuid := current_setting('rls.email_company')::uuid;
  denied boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM public.company_emails WHERE company_id = cid) THEN
    RAISE EXCEPTION 'Outro usuário leu o email';
  END IF;
  BEGIN
    PERFORM public.upsert_company_email(cid, 'CASE@EXAMPLE.TEST', NULL, false, 'Outro dono', 'Não deve alterar');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Outro usuário alterou o email'; END IF;
END;
$tenant$;
RESET ROLE;
SELECT 'company_email_upsert_contract: OK' AS result;
ROLLBACK;
