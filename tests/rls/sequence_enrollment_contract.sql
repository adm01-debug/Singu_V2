BEGIN;
SELECT set_config('rls.sequence_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.sequence_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.sequence_owner'), 'role', 'authenticated')::text, true);
SELECT set_config('rls.fail_counter', 'on', true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato', 'Sequência')
RETURNING set_config('rls.sequence_contact', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato de inscrição', 'active')
RETURNING set_config('rls.sequence_id', id::text, true);
CREATE FUNCTION pg_temp.reject_sequence_counter() RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.id = current_setting('rls.sequence_id')::uuid AND current_setting('rls.fail_counter') = 'on' THEN
    RAISE EXCEPTION 'Contador indisponível' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER test_sequence_counter BEFORE UPDATE OF total_enrolled ON public.sequences
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_sequence_counter();
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  sid uuid := current_setting('rls.sequence_id')::uuid;
  cid uuid := current_setting('rls.sequence_contact')::uuid;
  saved jsonb;
  retried jsonb;
  failed boolean := false;
BEGIN
  BEGIN
    PERFORM public.enroll_sequence_contact(sid, cid);
  EXCEPTION WHEN check_violation THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE sequence_id = sid) THEN
    RAISE EXCEPTION 'Falha do contador deixou inscrição persistida';
  END IF;
  PERFORM set_config('rls.fail_counter', 'off', true);
  saved := public.enroll_sequence_contact(sid, cid);
  retried := public.enroll_sequence_contact(sid, cid);
  IF saved->>'created' IS DISTINCT FROM 'true' OR retried->>'created' IS DISTINCT FROM 'false'
    OR saved->>'id' IS DISTINCT FROM retried->>'id'
    OR (SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = sid) <> 1
    OR (SELECT total_enrolled FROM public.sequences WHERE id = sid) <> 1 THEN
    RAISE EXCEPTION 'Retry duplicou a inscrição ou o contador';
  END IF;
  IF has_function_privilege('anon', 'public.enroll_sequence_contact(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Inscrição exposta a anônimos';
  END IF;
END;
$test$;
SELECT set_config('request.jwt.claim.sub', gen_random_uuid()::text, true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('request.jwt.claim.sub'), 'role', 'authenticated')::text, true);
DO $tenant$
DECLARE sid uuid := current_setting('rls.sequence_id')::uuid;
  cid uuid := current_setting('rls.sequence_contact')::uuid;
  denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.enroll_sequence_contact(sid, cid);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Outro usuário inscreveu o contato'; END IF;
  denied := false;
  BEGIN
    INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id)
    VALUES(sid, cid, auth.uid());
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Outro usuário burlou a RPC pela tabela'; END IF;
END;
$tenant$;
RESET ROLE;
SELECT 'sequence_enrollment_contract: OK' AS result;
ROLLBACK;
