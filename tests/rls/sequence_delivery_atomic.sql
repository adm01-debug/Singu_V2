BEGIN;
SET LOCAL lock_timeout = '3s';
SET LOCAL statement_timeout = '15s';
SELECT set_config('rls.sequence_owner', :'user_a', true);
SELECT set_config('rls.sequence_event_failure', 'on', true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato', 'Entrega atômica')
RETURNING set_config('rls.sequence_contact', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato de entrega', 'active')
RETURNING set_config('rls.sequence_id', id::text, true);
INSERT INTO public.sequence_steps(sequence_id, user_id, step_number, step_order, channel)
VALUES (current_setting('rls.sequence_id')::uuid, current_setting('rls.sequence_owner')::uuid, 1, 1, 'email')
RETURNING set_config('rls.sequence_step', id::text, true);
INSERT INTO public.sequence_enrollments(sequence_id, contact_id, user_id, current_step)
VALUES (current_setting('rls.sequence_id')::uuid, current_setting('rls.sequence_contact')::uuid,
  current_setting('rls.sequence_owner')::uuid, 0)
RETURNING set_config('rls.sequence_enrollment', id::text, true);
CREATE FUNCTION pg_temp.reject_sequence_delivery_event() RETURNS trigger LANGUAGE plpgsql AS $trigger$
BEGIN
  IF NEW.enrollment_id = current_setting('rls.sequence_enrollment')::uuid
    AND current_setting('rls.sequence_event_failure') = 'on' THEN
    RAISE EXCEPTION 'Evento indisponível' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$trigger$;
CREATE TRIGGER test_sequence_delivery_event BEFORE INSERT ON public.sequence_events
FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_sequence_delivery_event();
SET LOCAL ROLE service_role;
DO $test$
DECLARE
  eid uuid := current_setting('rls.sequence_enrollment')::uuid;
  uid uuid := current_setting('rls.sequence_owner')::uuid;
  sid uuid := current_setting('rls.sequence_step')::uuid;
  token text := replace(gen_random_uuid()::text, '-', '');
  failed boolean := false;
  saved uuid;
BEGIN
  BEGIN
    PERFORM public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-teste', token, NULL, 'Assunto');
  EXCEPTION WHEN check_violation THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.sequence_send_log WHERE enrollment_id = eid)
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 0 THEN
    RAISE EXCEPTION 'Falha do evento deixou confirmação parcial';
  END IF;

  PERFORM set_config('rls.sequence_event_failure', 'off', true);
  saved := public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-teste', token, NULL, 'Assunto');
  IF saved IS DISTINCT FROM eid
    OR (SELECT status FROM public.sequence_enrollments WHERE id = eid) <> 'completed'
    OR (SELECT current_step FROM public.sequence_enrollments WHERE id = eid) <> 1 THEN
    RAISE EXCEPTION 'Confirmação não concluiu o passo';
  END IF;
  IF public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-teste', token, NULL, 'Assunto') IS NOT NULL THEN
    RAISE EXCEPTION 'Worker antigo avançou o mesmo passo novamente';
  END IF;

  UPDATE public.sequence_enrollments SET status = 'active', current_step = 0, completed_at = NULL WHERE id = eid;
  DELETE FROM public.sequence_events WHERE enrollment_id = eid AND event_type = 'sent';
  saved := public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-teste', 'token-novo', NULL, NULL);
  IF saved IS DISTINCT FROM eid
    OR (SELECT count(*) FROM public.sequence_send_log WHERE enrollment_id = eid AND status = 'sent') <> 1
    OR (SELECT count(*) FROM public.sequence_events WHERE enrollment_id = eid AND event_type = 'sent') <> 1
    OR (SELECT metadata->>'tracking_token' FROM public.sequence_events WHERE enrollment_id = eid AND event_type = 'sent') <> token THEN
    RAISE EXCEPTION 'Retomada não reconciliou o evento com a confirmação original';
  END IF;

  failed := false;
  BEGIN
    PERFORM public.complete_sequence_email_delivery(eid, gen_random_uuid(), sid, 0, 'provedor-teste', token, NULL, NULL);
  EXCEPTION WHEN insufficient_privilege THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Usuário divergente aceito'; END IF;
  UPDATE public.sequence_enrollments SET status = 'paused', current_step = 0,
    paused_at = now(), paused_reason = 'Revisão necessária' WHERE id = eid;
  IF public.complete_sequence_email_delivery(eid, uid, sid, 0, 'provedor-teste', token, NULL, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Inscrição pausada foi avançada';
  END IF;
  IF has_function_privilege('anon', 'public.complete_sequence_email_delivery(uuid,uuid,uuid,integer,text,text,timestamptz,text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.complete_sequence_email_delivery(uuid,uuid,uuid,integer,text,text,timestamptz,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Confirmação exposta fora do serviço';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'sequence_delivery_atomic: OK' AS result;
ROLLBACK;
