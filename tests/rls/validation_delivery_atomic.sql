BEGIN;
SELECT set_config('rls.validation_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('rls.validation_other', (SELECT id::text FROM auth.users
  WHERE id <> current_setting('rls.validation_owner')::uuid ORDER BY created_at LIMIT 1), true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.validation_owner')::uuid, 'Contrato', 'Recibo de validação')
RETURNING set_config('rls.validation_contact', id::text, true);
SELECT set_config('rls.validation_queue', gen_random_uuid()::text, true);
SELECT set_config('rls.validation_fail', 'off', true);
CREATE FUNCTION pg_temp.fail_validation_completion() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.id = current_setting('rls.validation_queue')::uuid
    AND NEW.status = 'done' AND current_setting('rls.validation_fail') = 'on' THEN
    RAISE EXCEPTION 'Falha simulada na conclusão da tarefa';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER fail_validation_completion_fixture BEFORE UPDATE ON public.validation_queue
FOR EACH ROW EXECUTE FUNCTION pg_temp.fail_validation_completion();
SET LOCAL ROLE service_role;
DO $contract$
<<validation_fixture>>
DECLARE
  owner_id uuid := current_setting('rls.validation_owner')::uuid;
  other_id uuid := nullif(current_setting('rls.validation_other'), '')::uuid;
  contact_id uuid := current_setting('rls.validation_contact')::uuid;
  queue_id uuid := current_setting('rls.validation_queue')::uuid;
  claim uuid := gen_random_uuid();
  phone_result jsonb := '{"status":"valid","phone_e164":"+5511999999999","line_type":"mobile","country":"BR","country_code":"+55","reasons":[]}'::jsonb;
  email_result jsonb := '{"status":"valid","score":95,"mx_found":true,"smtp_check":false,"disposable":false,"role_account":false,"free_provider":true,"reasons":[]}'::jsonb;
  receipt uuid;
BEGIN
  IF other_id IS NULL THEN RAISE EXCEPTION 'Prepare dois usuários cadastrados antes do contrato'; END IF;
  IF has_function_privilege('anon', 'public.complete_validation_queue_item(uuid,uuid,uuid,uuid,text,text,jsonb)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.complete_validation_queue_item(uuid,uuid,uuid,uuid,text,text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Confirmação da fila foi liberada a usuários ou anônimos';
  END IF;
  INSERT INTO public.validation_queue(id, user_id, contact_id, kind, value, status, attempts, claim_token, lease_expires_at)
  VALUES (queue_id, owner_id, contact_id, 'phone', '+5511999999999', 'processing', 1, claim, now() + interval '5 minutes');
  IF public.complete_validation_queue_item(queue_id, gen_random_uuid(), owner_id, contact_id, 'phone', '+5511999999999', phone_result) IS NOT NULL THEN
    RAISE EXCEPTION 'Worker substituído conseguiu confirmar a validação';
  END IF;
  BEGIN
    PERFORM public.complete_validation_queue_item(queue_id, claim, other_id, contact_id, 'phone', '+5511999999999', phone_result);
    RAISE EXCEPTION 'Proprietário divergente foi aceito' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.complete_validation_queue_item(queue_id, claim, owner_id, contact_id, 'phone', '+5511888888888', phone_result);
    RAISE EXCEPTION 'Telefone divergente foi aceito' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  PERFORM set_config('rls.validation_fail', 'on', true);
  BEGIN
    PERFORM public.complete_validation_queue_item(queue_id, claim, owner_id, contact_id, 'phone', '+5511999999999', phone_result);
    RAISE EXCEPTION 'Conclusão não acionou a falha simulada' USING ERRCODE = 'XX000';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  IF EXISTS (SELECT 1 FROM public.phone_validations v WHERE v.id = queue_id)
    OR NOT EXISTS (SELECT 1 FROM public.validation_queue q WHERE q.id = queue_id AND q.status = 'processing' AND q.claim_token = claim) THEN
    RAISE EXCEPTION 'Falha da fila deixou validação gravada ou avanço parcial';
  END IF;
  PERFORM set_config('rls.validation_fail', 'off', true);
  receipt := public.complete_validation_queue_item(queue_id, claim, owner_id, contact_id, 'phone', '+5511999999999', phone_result);
  IF receipt IS DISTINCT FROM queue_id
    OR NOT EXISTS (SELECT 1 FROM public.validation_queue q WHERE q.id = queue_id AND q.status = 'done' AND q.lease_expires_at IS NULL AND q.processed_at IS NOT NULL)
    OR NOT EXISTS (SELECT 1 FROM public.phone_validations v WHERE v.id = queue_id AND v.user_id = owner_id AND v.contact_id = validation_fixture.contact_id) THEN
    RAISE EXCEPTION 'Recibo e tarefa não foram confirmados juntos';
  END IF;
  receipt := public.complete_validation_queue_item(queue_id, claim, owner_id, contact_id, 'phone', '+5511999999999', phone_result || '{"status":"invalid"}'::jsonb);
  IF receipt IS DISTINCT FROM queue_id OR (SELECT count(*) FROM public.phone_validations v WHERE v.id = queue_id) <> 1
    OR (SELECT status FROM public.phone_validations v WHERE v.id = queue_id) <> 'valid' THEN
    RAISE EXCEPTION 'Retry duplicou ou sobrescreveu o recibo confirmado';
  END IF;

  queue_id := gen_random_uuid();
  claim := gen_random_uuid();
  INSERT INTO public.validation_queue(id, user_id, contact_id, kind, value, status, attempts, claim_token, lease_expires_at)
  VALUES (queue_id, owner_id, contact_id, 'email', 'teste@example.invalid', 'processing', 1, claim, now() + interval '5 minutes');
  receipt := public.complete_validation_queue_item(queue_id, claim, owner_id, contact_id, 'email', 'teste@example.invalid', email_result);
  receipt := public.complete_validation_queue_item(queue_id, claim, owner_id, contact_id, 'email', 'teste@example.invalid', email_result);
  IF receipt IS DISTINCT FROM queue_id OR (SELECT count(*) FROM public.email_verifications v WHERE v.id = queue_id) <> 1
    OR NOT EXISTS (SELECT 1 FROM public.validation_queue q WHERE q.id = queue_id AND q.status = 'done') THEN
    RAISE EXCEPTION 'Email não confirmou a tarefa idempotentemente';
  END IF;
END;
$contract$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', current_setting('rls.validation_other'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.validation_other'), 'role', 'authenticated')::text, true);
DO $isolation$
BEGIN
  IF EXISTS (SELECT 1 FROM public.phone_validations
    WHERE id = current_setting('rls.validation_queue')::uuid) THEN
    RAISE EXCEPTION 'Outro usuário conseguiu consultar o recibo';
  END IF;
  BEGIN
    PERFORM public.complete_validation_queue_item(
      current_setting('rls.validation_queue')::uuid, gen_random_uuid(),
      current_setting('rls.validation_owner')::uuid, current_setting('rls.validation_contact')::uuid,
      'phone', '+5511999999999', '{"status":"valid"}'::jsonb
    );
    RAISE EXCEPTION 'Usuário conseguiu concluir a reserva' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$isolation$;
RESET ROLE;
ROLLBACK;
