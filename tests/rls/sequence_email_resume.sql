BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
SELECT set_config('rls.resume_owner', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1), true);
SELECT set_config('rls.resume_other', (SELECT id::text FROM auth.users ORDER BY created_at, id OFFSET 1 LIMIT 1), true);
DO $test$
BEGIN
  IF NULLIF(current_setting('rls.resume_other'), '') IS NULL THEN
    RAISE EXCEPTION 'O contrato exige dois usuários cadastrados';
  END IF;
END;
$test$;
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.resume_owner')::uuid, 'Contrato', 'Retomada email')
RETURNING set_config('rls.resume_contact', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.resume_owner')::uuid, 'Contrato retomada', 'active')
RETURNING set_config('rls.resume_sequence', id::text, true);
INSERT INTO public.sequence_steps(sequence_id, user_id, step_number, step_order, channel)
VALUES (current_setting('rls.resume_sequence')::uuid, current_setting('rls.resume_owner')::uuid, 1, 1, 'email')
RETURNING set_config('rls.resume_step', id::text, true);
INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id, current_step, status, paused_at, paused_reason, metadata)
VALUES (current_setting('rls.resume_sequence')::uuid, current_setting('rls.resume_contact')::uuid,
  current_setting('rls.resume_owner')::uuid, 0, 'paused', now(),
  'Envio não confirmado; revise a integração antes de retomar', '{"preservar":"sim"}')
RETURNING set_config('rls.resume_enrollment', id::text, true);
SELECT set_config('rls.resume_stamp', now()::text, true);
SELECT set_config('rls.resume_fail_event', 'on', true);
CREATE FUNCTION pg_temp.reject_resume_event() RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.enrollment_id = current_setting('rls.resume_enrollment')::uuid
    AND current_setting('rls.resume_fail_event') = 'on' THEN
    RAISE EXCEPTION 'Recibo indisponível' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER test_resume_event BEFORE INSERT ON public.sequence_events
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_resume_event();
SELECT set_config('request.jwt.claim.sub', current_setting('rls.resume_owner'), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  eid uuid := current_setting('rls.resume_enrollment')::uuid;
  stamp timestamptz := current_setting('rls.resume_stamp')::timestamptz;
  result jsonb;
  retried jsonb;
  failed boolean;
BEGIN
  IF has_function_privilege('anon', 'public.resume_sequence_email(uuid,integer,timestamptz)', 'EXECUTE')
    OR has_function_privilege('service_role', 'public.resume_sequence_email(uuid,integer,timestamptz)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Retomada exposta sem sessão do proprietário';
  END IF;
  failed := false;
  BEGIN
    PERFORM public.resume_sequence_email(eid, 0, stamp);
  EXCEPTION WHEN check_violation THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.sequence_events WHERE enrollment_id = eid)
    OR (SELECT status FROM public.sequence_enrollments WHERE id = eid) <> 'paused' THEN
    RAISE EXCEPTION 'Falha do recibo deixou retomada parcial';
  END IF;
  PERFORM set_config('rls.resume_fail_event', 'off', true);
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.resume_other'), true);
  failed := false;
  BEGIN
    PERFORM public.resume_sequence_email(eid, 0, stamp);
  EXCEPTION WHEN insufficient_privilege THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Outro usuário retomou a inscrição'; END IF;
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.resume_owner'), true);
  failed := false;
  BEGIN
    PERFORM public.resume_sequence_email(eid, 0, stamp + interval '1 second');
  EXCEPTION WHEN object_not_in_prerequisite_state THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Pausa divergente foi retomada'; END IF;
  failed := false;
  BEGIN
    PERFORM public.resume_sequence_email(eid, 1, stamp);
  EXCEPTION WHEN object_not_in_prerequisite_state THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Progresso divergente foi aceito'; END IF;
  UPDATE public.sequences SET status = 'paused' WHERE id = current_setting('rls.resume_sequence')::uuid;
  failed := false;
  BEGIN
    PERFORM public.resume_sequence_email(eid, 0, stamp);
  EXCEPTION WHEN object_not_in_prerequisite_state THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Sequência inativa foi retomada'; END IF;
  UPDATE public.sequences SET status = 'active' WHERE id = current_setting('rls.resume_sequence')::uuid;
  UPDATE public.sequence_steps SET channel = 'call' WHERE id = current_setting('rls.resume_step')::uuid;
  failed := false;
  BEGIN
    PERFORM public.resume_sequence_email(eid, 0, stamp);
  EXCEPTION WHEN object_not_in_prerequisite_state THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Etapa manual foi retomada como email'; END IF;
  UPDATE public.sequence_steps SET channel = 'email' WHERE id = current_setting('rls.resume_step')::uuid;
  result := public.resume_sequence_email(eid, 0, stamp);
  retried := public.resume_sequence_email(eid, 0, stamp);
  IF result->>'status' <> 'active' OR retried->>'already_resumed' <> 'true'
    OR result->>'receipt_id' IS DISTINCT FROM retried->>'receipt_id'
    OR (SELECT count(*) FROM public.sequence_events WHERE enrollment_id = eid) <> 1
    OR EXISTS (SELECT 1 FROM public.sequence_send_log WHERE enrollment_id = eid)
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 0
    OR (SELECT next_action_at FROM public.sequence_enrollments WHERE id = eid) <> now()
    OR (SELECT paused_at FROM public.sequence_enrollments WHERE id = eid) IS NOT NULL
    OR (SELECT metadata->>'preservar' FROM public.sequence_enrollments WHERE id = eid) <> 'sim' THEN
    RAISE EXCEPTION 'Retomada alterou progresso, duplicou recibo ou inventou envio';
  END IF;
  UPDATE public.sequence_enrollments SET status = 'paused', paused_at = stamp + interval '1 second',
    paused_reason = 'Envio não confirmado; revise a integração antes de retomar'
  WHERE id = eid;
  retried := public.resume_sequence_email(eid, 0, stamp);
  IF retried->>'already_resumed' <> 'true' OR retried->>'status' <> 'paused'
    OR (SELECT paused_at FROM public.sequence_enrollments WHERE id = eid) <> stamp + interval '1 second'
    OR (SELECT count(*) FROM public.sequence_events WHERE enrollment_id = eid) <> 1 THEN
    RAISE EXCEPTION 'Retry antigo consumiu uma pausa posterior';
  END IF;
END;
$test$;
ROLLBACK;
