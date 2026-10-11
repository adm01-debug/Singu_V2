BEGIN;
SELECT set_config('rls.company_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.company_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.company_owner'), 'role', 'authenticated')::text, true);
SELECT set_config('rls.company_id', gen_random_uuid()::text, true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  cid uuid := current_setting('rls.company_id')::uuid;
  bad_id uuid := gen_random_uuid();
  saved jsonb;
  retried jsonb;
  version_before integer;
  phone_id uuid;
  failed boolean;
BEGIN
  saved := public.persist_company_composite(cid, '{"nome_crm":"Contrato atômico"}', true, NULL,
    '[{"numero":"5511999999999","is_primary":true}]',
    '[{"email":"atomic@example.test","is_primary":true}]', '[{"cidade":"Campinas","estado":"SP"}]');
  version_before := (saved->>'version')::integer;
  phone_id := (saved->'company_phones'->0->>'id')::uuid;
  IF jsonb_array_length(saved->'company_phones') <> 1
    OR jsonb_array_length(saved->'company_emails') <> 1
    OR jsonb_array_length(saved->'company_addresses') <> 1 THEN
    RAISE EXCEPTION 'Relações incompletas na criação';
  END IF;
  retried := public.persist_company_composite(cid, '{"nome_crm":"Contrato atômico"}', true, NULL,
    '[{"numero":"5511999999999"}]', '[{"email":"atomic@example.test"}]');
  IF retried->>'_creation_recovered' IS DISTINCT FROM 'true'
    OR jsonb_array_length(retried->'company_phones') <> 1
    OR jsonb_array_length(retried->'company_emails') <> 1 THEN
    RAISE EXCEPTION 'Nova tentativa duplicou as relações';
  END IF;
  failed := false;
  BEGIN
    PERFORM public.persist_company_composite(bad_id, '{"nome_crm":"Não deve persistir"}', true, NULL,
      '[{"numero":"inválido"}]');
  EXCEPTION WHEN OTHERS THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.companies WHERE id = bad_id) THEN
    RAISE EXCEPTION 'Criação parcial persistida';
  END IF;
  failed := false;
  BEGIN
    PERFORM public.persist_company_composite(cid, '{"nome_crm":"Alteração parcial"}', false, version_before,
      jsonb_build_array(jsonb_build_object('id', phone_id, 'numero', 'inválido')));
  EXCEPTION WHEN OTHERS THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.companies WHERE id = cid AND
    (nome_crm <> 'Contrato atômico' OR version <> version_before)) THEN
    RAISE EXCEPTION 'Edição parcial persistida';
  END IF;
  saved := public.persist_company_composite(cid, '{"notes":"Salvo"}', false, version_before,
    jsonb_build_array(jsonb_build_object('id', phone_id, 'numero', '1188888888')));
  IF (saved->>'version')::integer <= version_before OR saved->>'notes' <> 'Salvo' THEN
    RAISE EXCEPTION 'Versão e edição não persistidas';
  END IF;
  failed := false;
  BEGIN
    PERFORM public.persist_company_composite(cid, '{"notes":"Sobrescrita"}', false, version_before);
  EXCEPTION WHEN serialization_failure THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Versão obsoleta aceita'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.company_phones WHERE company_id = cid) THEN
    RAISE EXCEPTION 'Dono não lê telefone criado';
  END IF;
  IF has_function_privilege('anon', 'public.persist_company_composite(uuid,jsonb,boolean,integer,jsonb,jsonb,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Anônimo executa gravação composta';
  END IF;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated')::text, true);
DO $tenant$
DECLARE cid uuid := current_setting('rls.company_id')::uuid; denied boolean := false;
BEGIN
  IF EXISTS (SELECT 1 FROM public.company_phones WHERE company_id = cid)
    OR EXISTS (SELECT 1 FROM public.company_emails WHERE company_id = cid)
    OR EXISTS (SELECT 1 FROM public.company_addresses WHERE company_id = cid) THEN
    RAISE EXCEPTION 'Relações expostas a outro usuário';
  END IF;
  BEGIN
    PERFORM public.persist_company_composite(cid, '{"nome_crm":"Outro dono"}', true);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Outro usuário recuperou a criação'; END IF;
  denied := false;
  BEGIN
    INSERT INTO public.company_emails(company_id, email) VALUES(cid, 'intruso@example.test');
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Outro usuário alterou relações'; END IF;
END;
$tenant$;
RESET ROLE;
SELECT 'company_composite_contract: OK' AS result;
ROLLBACK;
