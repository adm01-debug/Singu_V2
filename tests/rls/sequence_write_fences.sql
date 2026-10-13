BEGIN;
SELECT set_config('rls.sequence_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('rls.sequence_other_owner', (SELECT id::text FROM auth.users ORDER BY created_at OFFSET 1 LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.sequence_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.sequence_owner'), 'role', 'authenticated', 'aal', 'aal1')::text, true);
SET LOCAL ROLE service_role;
DO $test$
DECLARE
  owner_id uuid := current_setting('rls.sequence_owner')::uuid;
  other_owner uuid := current_setting('rls.sequence_other_owner')::uuid;
  cid uuid := gen_random_uuid();
  second_contact uuid := gen_random_uuid();
  foreign_contact uuid := gen_random_uuid();
  foreign_enrollment uuid;
  sid uuid := gen_random_uuid();
  draft_id uuid := gen_random_uuid();
  paused_id uuid := gen_random_uuid();
  foreign_id uuid := gen_random_uuid();
  rollback_id uuid := gen_random_uuid();
  step_id uuid := gen_random_uuid();
  auto_id uuid := gen_random_uuid();
  rollback_automation uuid := gen_random_uuid();
  reservation_token uuid := gen_random_uuid();
  saved jsonb;
  retried jsonb;
  scheduled timestamptz;
  denied boolean;
  bad_sequence uuid;
BEGIN
  IF owner_id IS NULL OR other_owner IS NULL OR owner_id = other_owner THEN
    RAISE EXCEPTION 'A prova exige duas contas cadastradas';
  END IF;
  INSERT INTO public.contacts(id,user_id,first_name,last_name,email) VALUES
    (cid,owner_id,'Reserva principal','Prova','reserva@example.test'),
    (second_contact,owner_id,'Reserva secundária','Prova','segunda@example.test'),
    (foreign_contact,other_owner,'Outra conta','Prova','outra@example.test');
  INSERT INTO public.sequences(id,user_id,name,status,max_enrollments) VALUES
    (sid,owner_id,'Contrato de reserva','active',1),
    (draft_id,owner_id,'Rascunho protegido','draft',10),
    (paused_id,owner_id,'Pausa protegida','paused',10),
    (foreign_id,other_owner,'Sequência alheia','active',10),
    (rollback_id,owner_id,'Rollback da automação','active',10);
  INSERT INTO public.sequence_steps(id,sequence_id,user_id,step_order,step_number,channel,delay_days,delay_hours)
  VALUES (step_id,sid,owner_id,1,1,'email',0,3);
  INSERT INTO public.lead_score_threshold_automations(id,user_id,name,trigger_type,score_target,action_type,action_config,cooldown_hours)
  VALUES (auto_id,owner_id,'Inscrição protegida','score_above',80,'enroll_sequence',jsonb_build_object('sequence_id',sid),0),
    (rollback_automation,owner_id,'Inscrição com falha','score_above',80,'enroll_sequence',jsonb_build_object('sequence_id',rollback_id),0);
  saved := public.enroll_lead_score_contact(auto_id,cid,owner_id,'{"from_score":70,"to_score":90}');
  SELECT next_action_at INTO scheduled FROM public.sequence_enrollments WHERE id = (saved->>'id')::uuid;
  UPDATE public.sequence_steps SET delay_hours = 8 WHERE id = step_id;
  retried := public.enroll_lead_score_contact(auto_id,cid,owner_id,'{"from_score":70,"to_score":90}');
  IF saved->>'created' <> 'true' OR retried->>'created' <> 'false' OR saved->>'id' <> retried->>'id'
    OR scheduled <> now() + interval '3 hours'
    OR scheduled <> (SELECT next_action_at FROM public.sequence_enrollments WHERE id = (saved->>'id')::uuid)
    OR (SELECT total_enrolled FROM public.sequences WHERE id = sid) <> 1
    OR (SELECT fired_count FROM public.lead_score_threshold_automations WHERE id = auto_id) <> 1
    OR (SELECT count(*) FROM public.lead_score_threshold_log WHERE automation_id = auto_id) <> 1 THEN
    RAISE EXCEPTION 'Inscrição automática, atraso, histórico ou retry incoerente';
  END IF;
  denied := false;
  BEGIN
    INSERT INTO public.sequence_enrollments(sequence_id,contact_id,user_id) VALUES (sid,second_contact,owner_id);
  EXCEPTION WHEN check_violation THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Insert direto excedeu a capacidade'; END IF;
  FOREACH bad_sequence IN ARRAY ARRAY[draft_id,paused_id,foreign_id] LOOP
    denied := false;
    BEGIN
      INSERT INTO public.sequence_enrollments(sequence_id,contact_id,user_id) VALUES (bad_sequence,cid,owner_id);
    EXCEPTION WHEN insufficient_privilege THEN denied := true;
    END;
    IF NOT denied THEN RAISE EXCEPTION 'Insert direto aceitou sequência indisponível'; END IF;
  END LOOP;
  denied := false;
  BEGIN
    INSERT INTO public.sequence_enrollments(sequence_id,contact_id,user_id) VALUES (sid,foreign_contact,owner_id);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Insert direto aceitou contato alheio'; END IF;
  denied := false;
  BEGIN
    PERFORM public.enroll_lead_score_contact(rollback_automation,second_contact,owner_id,'{"from_score":"inválido","to_score":90}');
  EXCEPTION WHEN invalid_text_representation THEN denied := true;
  END;
  IF NOT denied OR EXISTS (SELECT 1 FROM public.sequence_enrollments WHERE sequence_id = rollback_id)
    OR (SELECT total_enrolled FROM public.sequences WHERE id = rollback_id) <> 0
    OR (SELECT fired_count FROM public.lead_score_threshold_automations WHERE id = rollback_automation) <> 0
    OR EXISTS (SELECT 1 FROM public.lead_score_threshold_log WHERE automation_id = rollback_automation) THEN
    RAISE EXCEPTION 'Falha da automação deixou alterações parciais';
  END IF;
  UPDATE public.sequence_enrollments SET next_action_at = now() - interval '1 second' WHERE id = (saved->>'id')::uuid;
  denied := false;
  BEGIN
    PERFORM public.reserve_sequence_email_send((saved->>'id')::uuid,owner_id,step_id,0,gen_random_uuid(),2);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Etapa com ordem divergente obteve reserva'; END IF;
  IF public.reserve_sequence_email_send((saved->>'id')::uuid,owner_id,step_id,0,reservation_token,1)->>'token' IS DISTINCT FROM reservation_token::text THEN
    RAISE EXCEPTION 'Reserva não confirmada';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sequence_email_reservations AS reservation
    WHERE reservation.enrollment_id=(saved->>'id')::uuid
      AND reservation.step_id IN (SELECT step.id FROM public.sequence_steps AS step
        WHERE step.sequence_id = sid AND step.step_order = 1)
      AND reservation.current_step=0 AND reservation.step_order=1
      AND reservation.idempotency_key='seq-' || (saved->>'id') || '-step-1') THEN
    RAISE EXCEPTION 'Reserva perdeu os dados para conciliação com o provedor';
  END IF;
  IF public.reserve_sequence_email_send((saved->>'id')::uuid,owner_id,step_id,0,gen_random_uuid(),1) IS NOT NULL THEN
    RAISE EXCEPTION 'Dois processadores reservaram o mesmo envio';
  END IF;
  IF public.release_sequence_email_send((saved->>'id')::uuid,gen_random_uuid()) THEN
    RAISE EXCEPTION 'Outro token liberou a reserva';
  END IF;
  UPDATE public.sequence_email_reservations SET created_at = now() - interval '7 days' WHERE token = reservation_token;
  denied := false;
  BEGIN
    UPDATE public.contacts SET deleted_at = now() WHERE id = cid;
  EXCEPTION WHEN object_not_in_prerequisite_state THEN denied := true;
  END;
  IF NOT denied OR (SELECT deleted_at FROM public.contacts WHERE id = cid) IS NOT NULL THEN
    RAISE EXCEPTION 'Arquivo concluiu durante envio, inclusive com reserva antiga';
  END IF;
  UPDATE public.sequence_enrollments SET status = 'paused' WHERE id = (saved->>'id')::uuid;
  denied := false;
  BEGIN
    UPDATE public.sequence_enrollments SET status = 'active' WHERE id = (saved->>'id')::uuid;
  EXCEPTION WHEN object_not_in_prerequisite_state THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Retomada ignorou envio pendente'; END IF;
  IF NOT public.release_sequence_email_send((saved->>'id')::uuid,reservation_token) THEN
    RAISE EXCEPTION 'Reserva não liberada pelo serviço responsável';
  END IF;
  UPDATE public.sequence_enrollments SET status = 'active' WHERE id = (saved->>'id')::uuid;
  UPDATE public.contacts SET deleted_at = now() WHERE id = cid;
  IF (SELECT status FROM public.sequence_enrollments WHERE id = (saved->>'id')::uuid) <> 'paused' THEN
    RAISE EXCEPTION 'Arquivamento não suspendeu inscrição';
  END IF;
  denied := false;
  BEGIN
    PERFORM public.reserve_sequence_email_send((saved->>'id')::uuid,owner_id,step_id,0,gen_random_uuid(),1);
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Contato arquivado recebeu reserva'; END IF;
  UPDATE public.contacts SET deleted_at = NULL WHERE id = cid;
  UPDATE public.sequence_enrollments SET status = 'active' WHERE id = (saved->>'id')::uuid;
  PERFORM public.reserve_sequence_email_send((saved->>'id')::uuid,owner_id,step_id,0,reservation_token,1);
  PERFORM set_config('rls.pending_contact',cid::text,true);
  PERFORM set_config('rls.pending_enrollment',saved->>'id',true);
  PERFORM set_config('rls.pending_step',step_id::text,true);
  INSERT INTO public.sequence_steps(sequence_id,user_id,step_order,step_number,channel,delay_days,delay_hours)
    VALUES (foreign_id,other_owner,1,1,'email',0,0) RETURNING id INTO step_id;
  INSERT INTO public.sequence_enrollments(sequence_id,contact_id,user_id)
    VALUES (foreign_id,foreign_contact,other_owner) RETURNING id INTO foreign_enrollment;
  PERFORM public.reserve_sequence_email_send(foreign_enrollment,other_owner,step_id,0,gen_random_uuid(),1);
END;
$test$;
RESET ROLE;
SET LOCAL ROLE authenticated;
DO $owner$
DECLARE denied boolean := false;
BEGIN
  IF (SELECT count(*) FROM public.sequence_email_reservations) <> 1 THEN
    RAISE EXCEPTION 'Reserva de outra conta foi exposta ao proprietário';
  END IF;
  BEGIN
    UPDATE public.contacts SET deleted_at = now() WHERE id = current_setting('rls.pending_contact')::uuid;
  EXCEPTION WHEN object_not_in_prerequisite_state THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Proprietário arquivou contato durante envio'; END IF;
  denied := false;
  BEGIN
    DELETE FROM public.sequence_email_reservations WHERE enrollment_id = current_setting('rls.pending_enrollment')::uuid;
  EXCEPTION WHEN insufficient_privilege THEN denied := true;
  END;
  IF NOT denied THEN RAISE EXCEPTION 'Proprietário conseguiu remover a reserva interna'; END IF;
END;
$owner$;
RESET ROLE;
DO $access$
DECLARE signature text;
BEGIN
  FOREACH signature IN ARRAY ARRAY[
    'public.reserve_sequence_email_send(uuid,uuid,uuid,integer,uuid,integer)',
    'public.release_sequence_email_send(uuid,uuid)',
    'public.enroll_lead_score_contact(uuid,uuid,uuid,jsonb)'
  ] LOOP
    IF has_function_privilege('anon',signature,'EXECUTE')
      OR has_function_privilege('authenticated',signature,'EXECUTE')
      OR NOT has_function_privilege('service_role',signature,'EXECUTE') THEN
      RAISE EXCEPTION 'Permissão da operação interna divergente: %',signature;
    END IF;
  END LOOP;
END;
$access$;
SET LOCAL ROLE service_role;
DO $receipt$
DECLARE eid uuid := current_setting('rls.pending_enrollment')::uuid;
BEGIN
  BEGIN
    PERFORM public.complete_sequence_email_delivery(eid,current_setting('rls.sequence_owner')::uuid,
      current_setting('rls.pending_step')::uuid,0,'provedor-fences','tracking-fences',NULL,'Contrato');
    IF EXISTS (SELECT 1 FROM public.sequence_email_reservations WHERE enrollment_id=eid) THEN
      RAISE EXCEPTION 'Confirmação gravada deixou reserva pendente';
    END IF;
    RAISE EXCEPTION 'Rollback da confirmação' USING ERRCODE='P0002';
  EXCEPTION WHEN no_data_found THEN NULL;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.sequence_email_reservations WHERE enrollment_id=eid)
    OR EXISTS (SELECT 1 FROM public.sequence_send_log WHERE enrollment_id=eid) THEN
    RAISE EXCEPTION 'Rollback não preservou a reserva ou deixou um recibo parcial';
  END IF;
  PERFORM public.complete_sequence_email_delivery(eid,current_setting('rls.sequence_owner')::uuid,
    current_setting('rls.pending_step')::uuid,0,'provedor-fences','tracking-fences',NULL,'Contrato');
  IF EXISTS (SELECT 1 FROM public.sequence_email_reservations WHERE enrollment_id=eid)
    OR (SELECT status FROM public.sequence_enrollments WHERE id=eid) <> 'completed' THEN
    RAISE EXCEPTION 'Confirmação e encerramento da reserva não foram atômicos';
  END IF;
END;
$receipt$;
RESET ROLE;
SELECT 'sequence_write_fences: OK' AS result;
ROLLBACK;
