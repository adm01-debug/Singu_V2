BEGIN;
SELECT set_config('rls.queue_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.queue_owner')::uuid, 'Contrato', 'Fila atômica')
RETURNING set_config('rls.queue_contact', id::text, true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.queue_owner')::uuid, 'Contrato', 'Reanálise manual')
RETURNING set_config('rls.retry_contact', id::text, true);
INSERT INTO public.user_roles(user_id, role)
VALUES (current_setting('rls.queue_owner')::uuid, 'admin') ON CONFLICT DO NOTHING;
CREATE TEMP TABLE queue_enqueue_fixture(contact_id uuid) ON COMMIT DROP;
CREATE TRIGGER queue_enqueue_fixture_insert AFTER INSERT ON queue_enqueue_fixture
FOR EACH ROW EXECUTE FUNCTION public.enqueue_behavioral_profile_regen();
GRANT ALL ON queue_enqueue_fixture TO service_role;
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
  current_claim uuid;
  saved_profile jsonb;
BEGIN
  IF has_function_privilege('anon', 'public.claim_validation_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_validation_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.claim_regen_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_regen_batch(integer,integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.claim_behavioral_profile_retry(uuid,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_behavioral_profile_retry(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Claim de fila exposto a um usuário público';
  END IF;
  IF has_column_privilege('authenticated', 'public.validation_queue', 'claim_token', 'UPDATE')
    OR has_column_privilege('authenticated', 'public.validation_queue', 'lease_expires_at', 'UPDATE')
    OR has_column_privilege('authenticated', 'public.behavioral_profile_regen_queue', 'claim_token', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.validation_queue', 'UPDATE')
    OR has_table_privilege('authenticated', 'public.behavioral_profile_regen_queue', 'UPDATE') THEN
    RAISE EXCEPTION 'Usuário pode interferir na reserva de uma fila';
  END IF;
  IF has_function_privilege('anon', 'public.save_behavioral_profile_if_fresh(uuid,uuid,jsonb,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Persistência de perfil exposta anonimamente';
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
  SELECT claim_token INTO current_claim FROM public.behavioral_profile_regen_queue
  WHERE contact_id = fixture_contact_id;
  saved_profile := public.save_behavioral_profile_if_fresh(
    fixture_contact_id, current_claim, '{"summary":"perfil recente"}'::jsonb,
    now() - interval '1 hour', 'auto'
  );
  IF saved_profile->>'summary' IS DISTINCT FROM 'perfil recente' THEN
    RAISE EXCEPTION 'Perfil e versão não foram salvos com reserva atual';
  END IF;
  IF EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue WHERE contact_id = fixture_contact_id)
    OR EXISTS (SELECT 1 FROM public.claim_regen_batch(1, 15) WHERE contact_id = fixture_contact_id) THEN
    RAISE EXCEPTION 'Perfil persistido sem concluir a reserva na mesma transação';
  END IF;
  IF public.save_behavioral_profile_if_fresh(
    fixture_contact_id, current_claim, '{"summary":"perfil obsoleto"}'::jsonb,
    now(), 'auto'
  ) IS NOT NULL
    OR (SELECT summary FROM public.contact_analytical_profiles WHERE contact_id = fixture_contact_id) IS DISTINCT FROM 'perfil recente'
    OR (SELECT count(*) FROM public.contact_analytical_profile_versions WHERE contact_id = fixture_contact_id) <> 1 THEN
    RAISE EXCEPTION 'Reserva antiga sobrescreveu o perfil ou criou histórico';
  END IF;
  INSERT INTO public.behavioral_profile_regen_queue(contact_id, user_id, next_run_at)
  VALUES (fixture_contact_id, owner_id, '-infinity');
  SELECT claim_token INTO current_claim FROM public.claim_regen_batch(1, 15)
  WHERE contact_id = fixture_contact_id;
  IF current_claim IS NULL OR current_claim = regen_claim.claim_token THEN
    RAISE EXCEPTION 'Nova solicitação não criou uma reserva independente';
  END IF;
  saved_profile := public.save_behavioral_profile_if_fresh(
    fixture_contact_id, current_claim, '{"summary":"perfil superado"}'::jsonb,
    now() - interval '2 hours', 'auto'
  );
  IF saved_profile IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue WHERE contact_id = fixture_contact_id)
    OR EXISTS (SELECT 1 FROM public.claim_regen_batch(1, 15) WHERE contact_id = fixture_contact_id)
    OR (SELECT summary FROM public.contact_analytical_profiles WHERE contact_id = fixture_contact_id) IS DISTINCT FROM 'perfil recente'
    OR (SELECT count(*) FROM public.contact_analytical_profile_versions WHERE contact_id = fixture_contact_id) <> 1 THEN
    RAISE EXCEPTION 'Perfil superado deixou reserva ativa ou alterou o perfil vencedor';
  END IF;
  INSERT INTO public.behavioral_profile_regen_queue(contact_id, user_id, next_run_at)
  VALUES (fixture_contact_id, owner_id, '-infinity');
  SELECT claim_token INTO current_claim FROM public.claim_regen_batch(1, 15)
  WHERE contact_id = fixture_contact_id;
  IF public.save_behavioral_profile_if_fresh(
    fixture_contact_id, current_claim, '{"summary":"perfil atualizado"}'::jsonb,
    now(), 'auto'
  )->>'summary' IS DISTINCT FROM 'perfil atualizado' THEN
    RAISE EXCEPTION 'Nova reserva não substituiu o perfil anterior';
  END IF;
  IF (SELECT count(*) FROM public.contact_analytical_profile_versions WHERE contact_id = fixture_contact_id) <> 2 THEN
    RAISE EXCEPTION 'Versões do perfil não foram gravadas junto com a atualização';
  END IF;
  IF public.save_behavioral_profile_if_fresh(
    fixture_contact_id, NULL, '{"summary":"manual antigo"}'::jsonb,
    now() - interval '1 hour', 'manual'
  ) IS NOT NULL THEN
    RAISE EXCEPTION 'Geração manual antiga sobrescreveu um perfil recente';
  END IF;
  INSERT INTO public.behavioral_profile_regen_queue(contact_id, user_id, next_run_at)
  VALUES (fixture_contact_id, owner_id, now());
  UPDATE public.behavioral_profile_regen_queue
  SET attempts = 5, next_run_at = now() - interval '1 day', last_error = 'Limite de tentativas'
  WHERE contact_id = fixture_contact_id;
  IF EXISTS (
    SELECT 1 FROM public.claim_regen_batch(100, 1) WHERE contact_id = fixture_contact_id
  ) OR (SELECT last_error FROM public.behavioral_profile_regen_queue WHERE contact_id = fixture_contact_id)
    IS DISTINCT FROM 'Limite de tentativas' THEN
    RAISE EXCEPTION 'Regeneração esgotada foi executada ou perdeu o erro';
  END IF;
  UPDATE public.behavioral_profile_regen_queue
  SET last_error = NULL WHERE contact_id = fixture_contact_id;
  SELECT count(*) INTO affected
  FROM public.claim_regen_batch(100, 1) WHERE contact_id = fixture_contact_id;
  IF affected <> 0
    OR (SELECT last_error FROM public.behavioral_profile_regen_queue WHERE contact_id = fixture_contact_id)
    IS DISTINCT FROM 'Limite de tentativas após expiração da reserva' THEN
    RAISE EXCEPTION 'Reserva esgotada sem confirmação ficou sem indicação de falha';
  END IF;
  UPDATE public.behavioral_profile_regen_queue
  SET attempts = 0, next_run_at = now(), last_error = NULL
  WHERE contact_id = fixture_contact_id;
  IF NOT EXISTS (
    SELECT 1 FROM public.claim_regen_batch(100, 1)
    WHERE contact_id = fixture_contact_id AND attempts = 1
  ) THEN
    RAISE EXCEPTION 'Nova solicitação não reabriu a regeneração';
  END IF;
END;
$test$;
DO $manual_pending$
DECLARE
  fixture_contact_id uuid := current_setting('rls.queue_contact')::uuid;
  started_at timestamptz;
  enqueued_at timestamptz;
  pending_claim uuid;
  saved jsonb;
BEGIN
  UPDATE public.behavioral_profile_regen_queue q
  SET enqueued_at = clock_timestamp() - interval '1 hour',
      next_run_at = clock_timestamp() + interval '5 minutes', attempts = 0
  WHERE q.contact_id = fixture_contact_id;
  started_at := clock_timestamp();
  saved := public.save_behavioral_profile_if_fresh(
    fixture_contact_id, NULL, '{"summary":"geração manual"}'::jsonb, started_at, 'manual'
  );
  IF saved->>'summary' IS DISTINCT FROM 'geração manual'
    OR EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue q WHERE q.contact_id = fixture_contact_id) THEN
    RAISE EXCEPTION 'Geração manual não concluiu a pendência anterior';
  END IF;

  INSERT INTO queue_enqueue_fixture VALUES (fixture_contact_id);
  SELECT q.enqueued_at INTO enqueued_at FROM public.behavioral_profile_regen_queue q
  WHERE q.contact_id = fixture_contact_id;
  started_at := clock_timestamp();
  INSERT INTO queue_enqueue_fixture VALUES (fixture_contact_id);
  IF (SELECT q.enqueued_at FROM public.behavioral_profile_regen_queue q WHERE q.contact_id = fixture_contact_id) <= enqueued_at THEN
    RAISE EXCEPTION 'Novo histórico não atualizou a data do enqueue existente';
  END IF;
  SELECT q.claim_token INTO pending_claim FROM public.behavioral_profile_regen_queue q
  WHERE q.contact_id = fixture_contact_id;
  saved := public.save_behavioral_profile_if_fresh(
    fixture_contact_id, NULL, '{"summary":"histórico anterior"}'::jsonb, started_at, 'manual'
  );
  IF saved->>'summary' IS DISTINCT FROM 'histórico anterior'
    OR NOT EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue q
      WHERE q.contact_id = fixture_contact_id AND q.claim_token = pending_claim) THEN
    RAISE EXCEPTION 'Geração manual apagou a solicitação de histórico posterior';
  END IF;
  saved := public.save_behavioral_profile_if_fresh(
    fixture_contact_id, NULL, '{"summary":"manual obsoleto"}'::jsonb, started_at - interval '1 hour', 'manual'
  );
  IF saved IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue q
      WHERE q.contact_id = fixture_contact_id AND q.claim_token = pending_claim) THEN
    RAISE EXCEPTION 'Geração obsoleta alterou uma solicitação nova';
  END IF;
END;
$manual_pending$;
DO $enqueue_fence$
DECLARE
  fixture_contact_id uuid := current_setting('rls.queue_contact')::uuid;
  started_at timestamptz := clock_timestamp();
  old_claim uuid := gen_random_uuid();
  new_claim uuid;
  saved jsonb;
  affected integer;
BEGIN
  UPDATE public.behavioral_profile_regen_queue q
  SET claim_token = old_claim, attempts = 1, last_processed_at = started_at,
      next_run_at = started_at + interval '15 minutes'
  WHERE q.contact_id = fixture_contact_id;
  INSERT INTO queue_enqueue_fixture VALUES (fixture_contact_id);
  SELECT q.claim_token INTO new_claim FROM public.behavioral_profile_regen_queue q
  WHERE q.contact_id = fixture_contact_id;
  IF new_claim IS NULL OR new_claim = old_claim
    OR (SELECT q.last_processed_at FROM public.behavioral_profile_regen_queue q WHERE q.contact_id = fixture_contact_id) IS NOT NULL
    OR (SELECT q.next_run_at FROM public.behavioral_profile_regen_queue q WHERE q.contact_id = fixture_contact_id) >= started_at + interval '6 minutes' THEN
    RAISE EXCEPTION 'Histórico novo não invalidou a reserva anterior e sua espera';
  END IF;
  saved := public.save_behavioral_profile_if_fresh(
    fixture_contact_id, old_claim, '{"summary":"worker antigo"}'::jsonb, started_at, 'auto'
  );
  IF saved IS NOT NULL OR NOT EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue q
      WHERE q.contact_id = fixture_contact_id AND q.claim_token = new_claim AND q.attempts = 0) THEN
    RAISE EXCEPTION 'Worker antigo concluiu o pedido de histórico posterior';
  END IF;
  UPDATE public.behavioral_profile_regen_queue q SET last_error = 'worker antigo'
  WHERE q.contact_id = fixture_contact_id AND q.claim_token = old_claim;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Erro do worker antigo alterou o pedido novo'; END IF;
  BEGIN
    PERFORM public.save_behavioral_profile_if_fresh(
      fixture_contact_id, NULL, jsonb_build_object('user_id', gen_random_uuid()), clock_timestamp(), 'manual'
    );
    RAISE EXCEPTION 'Perfil de outro proprietário foi aceito' USING ERRCODE = 'XX000';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
END;
$enqueue_fence$;
DO $manual$
DECLARE
  contact_id uuid := current_setting('rls.retry_contact')::uuid;
  actor_id uuid := current_setting('rls.queue_owner')::uuid;
  first_claim public.behavioral_profile_regen_queue;
  next_claim public.behavioral_profile_regen_queue;
  affected integer;
  saved jsonb;
BEGIN
  BEGIN
    PERFORM public.claim_behavioral_profile_retry(contact_id, gen_random_uuid());
    RAISE EXCEPTION 'Reanálise aceitou operador sem papel administrativo';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  first_claim := public.claim_behavioral_profile_retry(contact_id, actor_id);
  IF first_claim.user_id <> actor_id OR first_claim.attempts <> 1 OR first_claim.claim_token IS NULL THEN
    RAISE EXCEPTION 'Reserva manual não confirmou dono, tentativa ou token';
  END IF;
  BEGIN
    PERFORM public.claim_behavioral_profile_retry(contact_id, actor_id);
    RAISE EXCEPTION 'Reanálise substituiu uma reserva vigente' USING ERRCODE = 'XX000';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue q
    WHERE q.contact_id = first_claim.contact_id AND q.claim_token = first_claim.claim_token AND q.attempts = 1) THEN
    RAISE EXCEPTION 'Repetição manual alterou uma reserva vigente';
  END IF;
  UPDATE public.behavioral_profile_regen_queue q
  SET next_run_at = clock_timestamp() - interval '1 second',
      last_processed_at = clock_timestamp() - interval '6 minutes'
  WHERE q.contact_id = first_claim.contact_id;
  next_claim := public.claim_behavioral_profile_retry(contact_id, actor_id);
  IF next_claim.attempts <> 2 OR next_claim.claim_token = first_claim.claim_token THEN
    RAISE EXCEPTION 'Nova reserva manual zerou tentativas ou reutilizou token';
  END IF;
  DELETE FROM public.behavioral_profile_regen_queue q
  WHERE q.contact_id = first_claim.contact_id AND q.claim_token = first_claim.claim_token;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Operador antigo removeu a reserva nova'; END IF;
  saved := public.save_behavioral_profile_if_fresh(contact_id, next_claim.claim_token,
    jsonb_build_object('summary', 'Confirmação manual'), clock_timestamp(), 'manual');
  IF saved IS NULL THEN RAISE EXCEPTION 'Perfil manual não foi confirmado'; END IF;
  IF EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue q WHERE q.contact_id = next_claim.contact_id)
    OR EXISTS (SELECT 1 FROM public.claim_regen_batch(1, 15) q WHERE q.contact_id = next_claim.contact_id) THEN
    RAISE EXCEPTION 'Confirmação manual deixou reserva ativa após gravar o perfil';
  END IF;
  DELETE FROM public.behavioral_profile_regen_queue q
  WHERE q.contact_id = next_claim.contact_id AND q.claim_token = next_claim.claim_token;
  BEGIN
    PERFORM public.claim_behavioral_profile_retry(contact_id, actor_id);
    RAISE EXCEPTION 'Conclusão manual perdeu a pausa de cinco minutos' USING ERRCODE = 'XX000';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
END;
$manual$;
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
  BEGIN
    UPDATE public.validation_queue SET claim_token = gen_random_uuid()
    WHERE contact_id = current_setting('rls.queue_contact')::uuid;
    RAISE EXCEPTION 'Usuário conseguiu editar o token da validação';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.behavioral_profile_regen_queue SET next_run_at = now()
    WHERE contact_id = current_setting('rls.queue_contact')::uuid;
    RAISE EXCEPTION 'Usuário conseguiu editar a reserva do perfil';
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
