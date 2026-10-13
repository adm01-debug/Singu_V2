BEGIN;
SELECT set_config('rls.legacy_owner', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1), true);
INSERT INTO public.contacts(user_id, first_name, last_name, email)
VALUES (current_setting('rls.legacy_owner')::uuid, 'Contrato', 'Legado', 'legado@example.invalid')
RETURNING set_config('rls.legacy_contact', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.legacy_owner')::uuid, 'Contrato legado', 'active')
RETURNING set_config('rls.legacy_sequence', id::text, true);
INSERT INTO public.sequence_steps(user_id, sequence_id, step_order, step_number, channel)
VALUES (current_setting('rls.legacy_owner')::uuid, current_setting('rls.legacy_sequence')::uuid, 1, 1, 'email')
RETURNING set_config('rls.legacy_step', id::text, true);
INSERT INTO public.sequence_enrollments(user_id, sequence_id, contact_id, status, current_step, paused_at, paused_reason)
VALUES (current_setting('rls.legacy_owner')::uuid, current_setting('rls.legacy_sequence')::uuid,
  current_setting('rls.legacy_contact')::uuid, 'paused', 0, now(),
  'Envio não confirmado; revise a integração antes de retomar')
RETURNING set_config('rls.legacy_enrollment', id::text, true);
INSERT INTO public.sequence_send_log(user_id, sequence_id, contact_id, enrollment_id, step_id, step_order, channel, status)
VALUES (current_setting('rls.legacy_owner')::uuid, current_setting('rls.legacy_sequence')::uuid,
  current_setting('rls.legacy_contact')::uuid, current_setting('rls.legacy_enrollment')::uuid,
  current_setting('rls.legacy_step')::uuid, 1, 'email', 'sent')
RETURNING set_config('rls.legacy_log', id::text, true);
INSERT INTO public.sequence_events(user_id, sequence_id, contact_id, enrollment_id, step_order, event_type, metadata)
VALUES (current_setting('rls.legacy_owner')::uuid, current_setting('rls.legacy_sequence')::uuid,
  current_setting('rls.legacy_contact')::uuid, current_setting('rls.legacy_enrollment')::uuid,
  1, 'sent', '{"historico":"preservado"}');
SELECT set_config('request.jwt.claim.sub', current_setting('rls.legacy_owner'), true);
SET LOCAL ROLE authenticated;
SELECT public.resume_sequence_email(current_setting('rls.legacy_enrollment')::uuid, 0, now());
RESET ROLE;
SELECT set_config('rls.legacy_fail', 'on', true);
CREATE FUNCTION pg_temp.reject_legacy_receipt() RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.enrollment_id = current_setting('rls.legacy_enrollment')::uuid
    AND current_setting('rls.legacy_fail') = 'on' THEN
    RAISE EXCEPTION 'Recibo indisponível' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER test_legacy_receipt BEFORE INSERT ON public.sequence_send_log
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_legacy_receipt();
SET LOCAL ROLE service_role;
DO $test$
DECLARE
  eid uuid := current_setting('rls.legacy_enrollment')::uuid;
  uid uuid := current_setting('rls.legacy_owner')::uuid;
  sid uuid := current_setting('rls.legacy_step')::uuid;
  original_metadata jsonb;
  failed boolean;
BEGIN
  SELECT metadata INTO original_metadata FROM public.sequence_enrollments WHERE id = eid;
  UPDATE public.sequence_enrollments SET metadata = jsonb_build_object('retry_unconfirmed_email',
    jsonb_build_object('receipt_id', gen_random_uuid(), 'step_order', 1)) WHERE id = eid;
  failed := false;
  BEGIN
    PERFORM public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-real', 'rastreamento-real', NULL, NULL);
  EXCEPTION WHEN object_not_in_prerequisite_state THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Marcador sem recibo autorizou envio legado'; END IF;
  UPDATE public.sequence_enrollments SET metadata = original_metadata WHERE id = eid;
  failed := false;
  BEGIN
    PERFORM public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-real', 'rastreamento-real', NULL, NULL);
  EXCEPTION WHEN check_violation THEN failed := true;
  END;
  IF NOT failed OR (SELECT status FROM public.sequence_send_log WHERE id = current_setting('rls.legacy_log')::uuid) <> 'sent'
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 0
    OR (SELECT metadata FROM public.sequence_enrollments WHERE id = eid) IS DISTINCT FROM original_metadata THEN
    RAISE EXCEPTION 'Falha de confirmação deixou arquivamento ou avanço parcial';
  END IF;
  PERFORM set_config('rls.legacy_fail', 'off', true);
  IF public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-real', 'rastreamento-real', NULL, NULL) <> eid THEN
    RAISE EXCEPTION 'Confirmação legada sem recibo final';
  END IF;
  IF (SELECT status FROM public.sequence_send_log WHERE id = current_setting('rls.legacy_log')::uuid) <> 'failed'
    OR (SELECT count(*) FROM public.sequence_send_log WHERE enrollment_id = eid AND status = 'sent' AND message_id = 'provedor-real') <> 1
    OR (SELECT count(*) FROM public.sequence_events WHERE enrollment_id = eid AND event_type = 'sent') <> 1
    OR NOT EXISTS (SELECT 1 FROM public.sequence_events WHERE enrollment_id = eid AND event_type = 'sent'
      AND metadata->>'message_id' = 'provedor-real' AND metadata->>'historico' = 'preservado')
    OR (SELECT metadata ? 'retry_unconfirmed_email' FROM public.sequence_enrollments WHERE id = eid)
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 1 THEN
    RAISE EXCEPTION 'Confirmação legada perdeu histórico, autorização ou duplicou envio';
  END IF;
  IF public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-real', 'rastreamento-real', NULL, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Retry após avanço consumiu etapa novamente';
  END IF;
END;
$test$;
ROLLBACK;
