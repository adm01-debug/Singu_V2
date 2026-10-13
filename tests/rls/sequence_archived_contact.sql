BEGIN;
SELECT set_config('rls.sequence_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.sequence_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.sequence_owner'), 'role', 'authenticated')::text, true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Inscrição', 'Contato vivo')
RETURNING set_config('rls.sequence_contact', id::text, true);
INSERT INTO public.contacts(user_id, first_name, last_name, deleted_at)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Inscrição', 'Contato arquivado', now())
RETURNING set_config('rls.sequence_archived', id::text, true);
INSERT INTO public.sequences(user_id, name, status)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato de contato vivo', 'active')
RETURNING set_config('rls.sequence_id', id::text, true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  sid uuid := current_setting('rls.sequence_id')::uuid;
  cid uuid := current_setting('rls.sequence_contact')::uuid;
  archived uuid := current_setting('rls.sequence_archived')::uuid;
  denied boolean := false;
BEGIN
  BEGIN
    PERFORM public.enroll_sequence_contact(sid, archived);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied OR EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE sequence_id = sid)
    OR (SELECT total_enrolled FROM public.sequences WHERE id = sid) <> 0 THEN
    RAISE EXCEPTION 'Contato arquivado foi inscrito ou alterou o contador';
  END IF;
  IF public.enroll_sequence_contact(sid, cid)->>'created' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'Contato vivo não foi inscrito';
  END IF;
  UPDATE public.contacts SET deleted_at = now() WHERE id = cid;
  denied := false;
  BEGIN
    PERFORM public.enroll_sequence_contact(sid, cid);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied OR (SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = sid) <> 1
    OR (SELECT total_enrolled FROM public.sequences WHERE id = sid) <> 1 THEN
    RAISE EXCEPTION 'Retry de contato arquivado confirmou sucesso ou alterou inscrições';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'sequence_archived_contact: OK' AS result;
ROLLBACK;
