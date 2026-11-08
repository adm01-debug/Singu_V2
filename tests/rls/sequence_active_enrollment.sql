BEGIN;
SELECT set_config('rls.sequence_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.sequence_owner'), true);
INSERT INTO public.contacts(user_id, first_name)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato de sequência ativa')
RETURNING set_config('rls.sequence_contact', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato de status da inscrição', 'paused')
RETURNING set_config('rls.sequence_id', id::text, true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  sid uuid := current_setting('rls.sequence_id')::uuid;
  cid uuid := current_setting('rls.sequence_contact')::uuid;
  denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.enroll_sequence_contact(sid, cid);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied OR EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE sequence_id = sid)
    OR (SELECT total_enrolled FROM public.sequences WHERE id = sid) <> 0 THEN
    RAISE EXCEPTION 'Sequência pausada permitiu inscrição ou alterou o contador';
  END IF;
  UPDATE public.sequences SET status = 'active' WHERE id = sid;
  IF public.enroll_sequence_contact(sid, cid)->>'created' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Sequência ativada não permitiu inscrição';
  END IF;
  IF public.enroll_sequence_contact(sid, cid)->>'created' IS DISTINCT FROM 'false' THEN
    RAISE EXCEPTION 'Retry da sequência ativa perdeu idempotência';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'sequence_active_enrollment: OK' AS result;
ROLLBACK;
