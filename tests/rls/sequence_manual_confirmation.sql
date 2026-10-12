BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
SELECT set_config('rls.manual_owner', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1), true);
SELECT set_config('rls.manual_other', (SELECT id::text FROM auth.users ORDER BY created_at, id OFFSET 1 LIMIT 1), true);
DO $test$
BEGIN
  IF NULLIF(current_setting('rls.manual_other'), '') IS NULL THEN
    RAISE EXCEPTION 'O contrato exige dois usuários cadastrados';
  END IF;
END;
$test$;
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.manual_owner')::uuid, 'Contrato', 'Etapa manual')
RETURNING set_config('rls.manual_contact', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.manual_owner')::uuid, 'Contrato manual', 'active')
RETURNING set_config('rls.manual_sequence', id::text, true);
INSERT INTO public.sequence_steps(sequence_id, user_id, step_number, step_order, channel)
VALUES (current_setting('rls.manual_sequence')::uuid, current_setting('rls.manual_owner')::uuid, 1, 1, 'call')
RETURNING set_config('rls.manual_step', id::text, true);
INSERT INTO public.sequence_steps(sequence_id, user_id, step_number, step_order, channel, delay_days, delay_hours)
VALUES (current_setting('rls.manual_sequence')::uuid, current_setting('rls.manual_owner')::uuid, 2, 2, 'email', 0, 3)
RETURNING set_config('rls.manual_email_step', id::text, true);
INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id, current_step, status, metadata)
VALUES (current_setting('rls.manual_sequence')::uuid, current_setting('rls.manual_contact')::uuid,
  current_setting('rls.manual_owner')::uuid, 0, 'paused', jsonb_build_object('preservar', 'sim',
    'pending_manual_step', jsonb_build_object('step_id', current_setting('rls.manual_step'),
      'step_order', 1, 'channel', 'call')))
RETURNING set_config('rls.manual_enrollment', id::text, true);
SELECT set_config('rls.manual_fail_event', 'on', true);
CREATE FUNCTION pg_temp.reject_manual_event() RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.enrollment_id = current_setting('rls.manual_enrollment')::uuid
    AND current_setting('rls.manual_fail_event') = 'on' THEN
    RAISE EXCEPTION 'Evento indisponível' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER test_manual_event BEFORE INSERT ON public.sequence_events
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_manual_event();
SELECT set_config('request.jwt.claim.sub', current_setting('rls.manual_owner'), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  eid uuid := current_setting('rls.manual_enrollment')::uuid;
  sid uuid := current_setting('rls.manual_step')::uuid;
  result jsonb;
  failed boolean := false;
BEGIN
  IF has_function_privilege('anon', 'public.confirm_sequence_manual_step(uuid,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Confirmação manual exposta sem login';
  END IF;
  BEGIN
    PERFORM public.confirm_sequence_manual_step(eid, sid, 'Executada');
  EXCEPTION WHEN check_violation THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.sequence_events WHERE enrollment_id = eid)
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 0
    OR (SELECT status FROM public.sequence_enrollments WHERE id = eid) <> 'paused' THEN
    RAISE EXCEPTION 'Falha do evento deixou confirmação parcial';
  END IF;
  PERFORM set_config('rls.manual_fail_event', 'off', true);
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.manual_other'), true);
  failed := false;
  BEGIN
    PERFORM public.confirm_sequence_manual_step(eid, sid);
  EXCEPTION WHEN insufficient_privilege THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Outro usuário confirmou a execução'; END IF;
  PERFORM set_config('request.jwt.claim.sub', current_setting('rls.manual_owner'), true);
  failed := false;
  BEGIN
    PERFORM public.confirm_sequence_manual_step(eid, current_setting('rls.manual_email_step')::uuid);
  EXCEPTION WHEN insufficient_privilege THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Email foi confirmado como etapa manual'; END IF;
  UPDATE public.sequences SET status = 'paused' WHERE id = current_setting('rls.manual_sequence')::uuid;
  failed := false;
  BEGIN
    PERFORM public.confirm_sequence_manual_step(eid, sid);
  EXCEPTION WHEN object_not_in_prerequisite_state THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Sequência pausada foi retomada'; END IF;
  UPDATE public.sequences SET status = 'active' WHERE id = current_setting('rls.manual_sequence')::uuid;
  result := public.confirm_sequence_manual_step(eid, sid, 'Liguei e confirmei');
  IF result->>'status' <> 'active' OR result->>'already_confirmed' <> 'false'
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 1
    OR (SELECT next_action_at FROM public.sequence_enrollments WHERE id = eid) <> now() + interval '3 hours'
    OR (SELECT metadata->>'preservar' FROM public.sequence_enrollments WHERE id = eid) <> 'sim'
    OR (SELECT metadata ? 'pending_manual_step' FROM public.sequence_enrollments WHERE id = eid) THEN
    RAISE EXCEPTION 'Confirmação não retomou a próxima etapa corretamente';
  END IF;
  result := public.confirm_sequence_manual_step(eid, sid, 'Retry');
  IF result->>'already_confirmed' <> 'true'
    OR (SELECT count(*) FROM public.sequence_events WHERE enrollment_id = eid) <> 1
    OR EXISTS (SELECT 1 FROM public.sequence_send_log WHERE enrollment_id = eid)
    OR EXISTS (SELECT 1 FROM public.sequence_events WHERE enrollment_id = eid AND event_type = 'sent')
    OR NOT EXISTS (SELECT 1 FROM public.sequence_events WHERE enrollment_id = eid
      AND event_type = 'manual_completed' AND metadata->>'confirmed_by' = current_setting('rls.manual_owner')
      AND metadata->>'note' = 'Liguei e confirmei') THEN
    RAISE EXCEPTION 'Retry duplicou evento ou inventou uma entrega';
  END IF;
END;
$test$;
RESET ROLE;
UPDATE public.sequence_steps SET channel = 'call'
WHERE id = current_setting('rls.manual_email_step')::uuid;
UPDATE public.sequence_enrollments SET status = 'paused',
  metadata = jsonb_build_object('pending_manual_step', jsonb_build_object(
    'step_id', current_setting('rls.manual_email_step'), 'step_order', 2, 'channel', 'call'))
WHERE id = current_setting('rls.manual_enrollment')::uuid;
SET LOCAL ROLE authenticated;
DO $test$
DECLARE result jsonb;
BEGIN
  result := public.confirm_sequence_manual_step(current_setting('rls.manual_enrollment')::uuid,
    current_setting('rls.manual_email_step')::uuid);
  IF result->>'status' <> 'completed'
    OR NOT EXISTS (SELECT 1 FROM public.sequence_enrollments
      WHERE id = current_setting('rls.manual_enrollment')::uuid
        AND current_step = 2 AND completed_at IS NOT NULL AND next_action_at IS NULL) THEN
    RAISE EXCEPTION 'Última etapa manual não concluiu a inscrição';
  END IF;
END;
$test$;
RESET ROLE;
ROLLBACK;
