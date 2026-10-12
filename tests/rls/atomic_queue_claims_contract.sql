BEGIN;
SELECT set_config('rls.queue_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.queue_owner')::uuid, 'Contrato', 'Fila atômica')
RETURNING set_config('rls.queue_contact', id::text, true);
SET LOCAL ROLE service_role;
DO $test$
DECLARE
  owner_id uuid := current_setting('rls.queue_owner')::uuid;
  fixture_contact_id uuid := current_setting('rls.queue_contact')::uuid;
  item_id uuid := gen_random_uuid();
  first_claim public.validation_queue;
  next_claim public.validation_queue;
  regen_claim public.behavioral_profile_regen_queue;
  affected integer;
  invalid_size integer;
BEGIN
  IF has_function_privilege('anon', 'public.claim_validation_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_validation_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.claim_regen_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_regen_batch(integer,integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Claim de fila exposto a um usuário público';
  END IF;

  FOREACH invalid_size IN ARRAY ARRAY[-1, 0, 101, NULL] LOOP
    BEGIN
      PERFORM public.claim_validation_batch(invalid_size, 3);
      RAISE EXCEPTION 'Lote inválido aceito pela fila de validação';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
    BEGIN
      PERFORM public.claim_regen_batch(invalid_size, 15);
      RAISE EXCEPTION 'Lote inválido aceito pela fila de perfis';
    EXCEPTION WHEN invalid_parameter_value THEN NULL;
    END;
  END LOOP;
  BEGIN
    PERFORM public.claim_validation_batch(1, NULL);
    RAISE EXCEPTION 'Limite de tentativas nulo aceito';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  BEGIN
    PERFORM public.claim_regen_batch(1, 61);
    RAISE EXCEPTION 'Lease excessivo aceito';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;

  INSERT INTO public.validation_queue(id, user_id, contact_id, kind, value, created_at)
  VALUES (item_id, owner_id, fixture_contact_id, 'email', 'fila@example.invalid', '0001-01-01');
  SELECT * INTO first_claim FROM public.claim_validation_batch(1, 3) WHERE id = item_id;
  IF first_claim.claim_token IS NULL OR first_claim.attempts <> 1
    OR first_claim.status <> 'processing' OR first_claim.lease_expires_at <= now() THEN
    RAISE EXCEPTION 'Primeiro claim não reservou o item';
  END IF;
  IF EXISTS (SELECT 1 FROM public.claim_validation_batch(1, 3) WHERE id = item_id) THEN
    RAISE EXCEPTION 'Item reservado foi processado duas vezes';
  END IF;

  UPDATE public.validation_queue SET lease_expires_at = now() - interval '1 minute' WHERE id = item_id;
  SELECT * INTO next_claim FROM public.claim_validation_batch(1, 3) WHERE id = item_id;
  IF next_claim.claim_token IS NULL OR next_claim.claim_token = first_claim.claim_token OR next_claim.attempts <> 2 THEN
    RAISE EXCEPTION 'Lease expirado não recebeu uma nova tentativa';
  END IF;
  UPDATE public.validation_queue SET status = 'done' WHERE id = item_id AND claim_token = first_claim.claim_token;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Tentativa antiga sobrescreveu a nova'; END IF;

  UPDATE public.validation_queue SET attempts = 3, lease_expires_at = now() - interval '1 minute' WHERE id = item_id;
  PERFORM public.claim_validation_batch(1, 3);
  IF NOT EXISTS (SELECT 1 FROM public.validation_queue WHERE id = item_id
    AND status = 'error' AND claim_token IS NULL AND lease_expires_at IS NULL AND processed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Tentativas esgotadas não encerraram o item';
  END IF;

  INSERT INTO public.behavioral_profile_regen_queue(contact_id, user_id, next_run_at)
  VALUES (fixture_contact_id, owner_id, '-infinity')
  ON CONFLICT (contact_id) DO UPDATE SET next_run_at = '-infinity', attempts = 0;
  SELECT * INTO regen_claim FROM public.claim_regen_batch(1, 15) AS claimed WHERE claimed.contact_id = fixture_contact_id;
  IF regen_claim.claim_token IS NULL OR regen_claim.attempts <> 1 OR regen_claim.next_run_at <= now() THEN
    RAISE EXCEPTION 'Perfil não recebeu reserva e tentativa únicas';
  END IF;
  IF EXISTS (SELECT 1 FROM public.claim_regen_batch(1, 15) WHERE contact_id = current_setting('rls.queue_contact')::uuid) THEN
    RAISE EXCEPTION 'Perfil reservado foi processado duas vezes';
  END IF;
  UPDATE public.behavioral_profile_regen_queue SET next_run_at = '-infinity', attempts = 0
  WHERE contact_id = current_setting('rls.queue_contact')::uuid;
  DELETE FROM public.behavioral_profile_regen_queue WHERE contact_id = current_setting('rls.queue_contact')::uuid
    AND claim_token = regen_claim.claim_token;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Worker antigo apagou uma regeneração nova'; END IF;
  UPDATE public.behavioral_profile_regen_queue SET last_error = 'tentativa antiga'
  WHERE contact_id = current_setting('rls.queue_contact')::uuid AND claim_token = regen_claim.claim_token;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Worker antigo sobrescreveu a regeneração nova'; END IF;
END;
$test$;
SET LOCAL ROLE authenticated;
DO $denied$
BEGIN
  BEGIN
    PERFORM public.claim_validation_batch(1, 3);
    RAISE EXCEPTION 'Usuário conseguiu reservar validações';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.claim_regen_batch(1, 15);
    RAISE EXCEPTION 'Usuário conseguiu reservar perfis';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$denied$;
SET LOCAL ROLE anon;
DO $denied$
BEGIN
  BEGIN
    PERFORM public.claim_validation_batch(1, 3);
    RAISE EXCEPTION 'Anônimo conseguiu reservar validações';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    PERFORM public.claim_regen_batch(1, 15);
    RAISE EXCEPTION 'Anônimo conseguiu reservar perfis';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$denied$;
RESET ROLE;
ROLLBACK;
