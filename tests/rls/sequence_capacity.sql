BEGIN;
SELECT set_config('rls.sequence_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.sequence_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.sequence_owner'), 'role', 'authenticated')::text, true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Limite', 'Primeiro')
RETURNING set_config('rls.sequence_contact', id::text, true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Limite', 'Segundo')
RETURNING set_config('rls.sequence_other', id::text, true);
INSERT INTO public.sequences(user_id, name, max_enrollments, status)
VALUES (current_setting('rls.sequence_owner')::uuid, 'Contrato de capacidade', 1, 'active')
RETURNING set_config('rls.sequence_id', id::text, true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  sid uuid := current_setting('rls.sequence_id')::uuid;
  cid uuid := current_setting('rls.sequence_contact')::uuid;
  saved jsonb;
  retried jsonb;
  denied boolean := false;
BEGIN
  saved := public.enroll_sequence_contact(sid, cid);
  UPDATE public.sequences SET total_enrolled = 0 WHERE id = sid;
  BEGIN
    PERFORM public.enroll_sequence_contact(sid, current_setting('rls.sequence_other')::uuid);
  EXCEPTION WHEN check_violation THEN denied := true;
  END;
  retried := public.enroll_sequence_contact(sid, cid);
  IF NOT denied OR saved->>'created' IS DISTINCT FROM 'true' OR retried->>'created' IS DISTINCT FROM 'false'
    OR saved->>'id' IS DISTINCT FROM retried->>'id'
    OR (SELECT count(*) FROM public.sequence_enrollments WHERE sequence_id = sid) <> 1
    OR (SELECT total_enrolled FROM public.sequences WHERE id = sid) <> 1 THEN
    RAISE EXCEPTION 'Capacidade excedida, retry duplicado ou contador incoerente';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'sequence_capacity: OK' AS result;
ROLLBACK;
