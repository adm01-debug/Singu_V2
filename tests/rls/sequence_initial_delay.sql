BEGIN;
SELECT set_config('request.jwt.claim.sub', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SET LOCAL ROLE authenticated;
DO $test$
DECLARE
  owner_id uuid := auth.uid();
  contact_id uuid := gen_random_uuid();
  delayed_id uuid := gen_random_uuid();
  immediate_id uuid := gen_random_uuid();
  empty_id uuid := gen_random_uuid();
  nullable_id uuid := gen_random_uuid();
  enrollment_id uuid;
  result jsonb;
  scheduled_at timestamptz;
BEGIN
  INSERT INTO public.contacts(id, user_id, first_name)
  VALUES (contact_id, owner_id, 'Contrato do atraso inicial');
  INSERT INTO public.sequences(id, user_id, name, status) VALUES
    (delayed_id, owner_id, 'Atraso inicial', 'active'),
    (immediate_id, owner_id, 'Etapa imediata', 'active'),
    (empty_id, owner_id, 'Sem etapa inicial', 'active'),
    (nullable_id, owner_id, 'Dias legados nulos', 'active');
  INSERT INTO public.sequence_steps(sequence_id, user_id, step_number, step_order, channel, delay_days, delay_hours) VALUES
    (delayed_id, owner_id, 1, 1, 'call', 1, 2),
    (delayed_id, owner_id, 2, 2, 'call', 20, 0),
    (immediate_id, owner_id, 1, 1, 'call', 0, 0),
    (nullable_id, owner_id, 1, 1, 'call', NULL, 6);
  result := public.enroll_sequence_contact(delayed_id, contact_id);
  enrollment_id := (result->>'id')::uuid;
  SELECT next_action_at INTO scheduled_at FROM public.sequence_enrollments WHERE id = enrollment_id;
  IF result->>'created' IS DISTINCT FROM 'true' OR scheduled_at IS DISTINCT FROM now() + interval '1 day 2 hours' THEN
    RAISE EXCEPTION 'A inscrição não respeitou o atraso da primeira etapa';
  END IF;
  UPDATE public.sequence_steps SET delay_days = 4 WHERE sequence_id = delayed_id AND step_order = 1;
  result := public.enroll_sequence_contact(delayed_id, contact_id);
  IF result->>'created' IS DISTINCT FROM 'false' OR (result->>'id')::uuid IS DISTINCT FROM enrollment_id
    OR (SELECT next_action_at FROM public.sequence_enrollments WHERE id = enrollment_id) IS DISTINCT FROM scheduled_at THEN
    RAISE EXCEPTION 'O retry alterou a inscrição ou a data já agendada';
  END IF;
  result := public.enroll_sequence_contact(immediate_id, contact_id);
  IF (SELECT next_action_at FROM public.sequence_enrollments WHERE id = (result->>'id')::uuid) IS DISTINCT FROM now() THEN
    RAISE EXCEPTION 'A inscrição sem atraso não manteve a execução imediata';
  END IF;
  result := public.enroll_sequence_contact(empty_id, contact_id);
  IF (SELECT next_action_at FROM public.sequence_enrollments WHERE id = (result->>'id')::uuid) IS DISTINCT FROM now() THEN
    RAISE EXCEPTION 'A inscrição sem etapas não preservou o contrato';
  END IF;
  result := public.enroll_sequence_contact(nullable_id, contact_id);
  IF (SELECT next_action_at FROM public.sequence_enrollments WHERE id = (result->>'id')::uuid) IS DISTINCT FROM now() + interval '6 hours' THEN
    RAISE EXCEPTION 'Dias nulos impediram o atraso em horas';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'sequence_initial_delay: OK' AS result;
ROLLBACK;
