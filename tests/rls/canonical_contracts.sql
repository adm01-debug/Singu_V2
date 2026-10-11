BEGIN;
SELECT set_config('rls.contract_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
INSERT INTO public.contacts (user_id, first_name, last_name)
VALUES (current_setting('rls.contract_owner')::uuid, 'Contrato', 'Fixture')
RETURNING set_config('rls.contract_contact', id::text, true);
INSERT INTO public.sequences (user_id, name)
VALUES (current_setting('rls.contract_owner')::uuid, 'Contrato fixture')
RETURNING set_config('rls.contract_sequence', id::text, true);
INSERT INTO public.vak_analysis_history (user_id, contact_id, primary_modality)
VALUES (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid, 'V');
INSERT INTO public.metaprogram_analysis (user_id, contact_id)
VALUES (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid);

SELECT set_config('request.jwt.claim.sub', current_setting('rls.contract_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.contract_owner'), 'role', 'authenticated')::text, true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  uid uuid := current_setting('rls.contract_owner')::uuid;
  cid uuid := current_setting('rls.contract_contact')::uuid;
  sid uuid := current_setting('rls.contract_sequence')::uuid;
  affected integer;
BEGIN
  INSERT INTO public.csat_surveys (user_id, contact_id, survey_type, status)
  VALUES (uid, cid, 'csat', 'sent'), (uid, cid, 'nps', 'sent');
  IF (SELECT count(*) FROM public.csat_surveys WHERE contact_id=cid AND score IS NULL) <> 2 THEN
    RAISE EXCEPTION 'Pesquisa pendente ganhou nota artificial';
  END IF;
  UPDATE public.csat_surveys SET score=5, status='answered' WHERE contact_id=cid AND survey_type='csat';
  UPDATE public.csat_surveys SET nps_score=10, status='answered' WHERE contact_id=cid AND survey_type='nps';
  BEGIN
    UPDATE public.csat_surveys SET score=6 WHERE contact_id=cid AND survey_type='csat';
    RAISE EXCEPTION 'Nota CSAT fora da escala aceita';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  UPDATE public.vak_analysis_history SET is_validated=true, user_feedback='Validado' WHERE contact_id=cid;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Dono não valida VAK'; END IF;
  UPDATE public.metaprogram_analysis SET is_validated=true, user_feedback='Validado' WHERE contact_id=cid;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN RAISE EXCEPTION 'Dono não valida metaprograma'; END IF;
  INSERT INTO public.rfm_analysis (user_id, contact_id, recency_score, frequency_score, monetary_score, segment, segment_code)
  VALUES (uid, cid, 5, 5, 5, 'champions', 'champions');
  INSERT INTO public.sequence_steps (user_id, sequence_id, step_number, step_order, channel, condition_type, condition_wait_hours, branch_on_yes_step)
  VALUES (uid, sid, 1, 1, 'email', 'if_opened', 24, 2);
  BEGIN
    INSERT INTO public.sequence_steps (user_id, sequence_id, step_number, step_order, channel, condition_type)
    VALUES (uid, sid, 2, 2, 'email', 'invalid_condition');
    RAISE EXCEPTION 'Condição inválida aceita';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
RESET ROLE;

SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000950b', true);
SELECT set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-00000000950b","role":"authenticated"}', true);
SET LOCAL ROLE authenticated;
DO $$
DECLARE
  cid uuid := current_setting('rls.contract_contact')::uuid;
  affected integer;
BEGIN
  IF EXISTS (SELECT 1 FROM public.csat_surveys WHERE contact_id=cid)
    OR EXISTS (SELECT 1 FROM public.rfm_analysis WHERE contact_id=cid)
    OR EXISTS (SELECT 1 FROM public.sequence_steps WHERE sequence_id=current_setting('rls.contract_sequence')::uuid) THEN
    RAISE EXCEPTION 'Dados visíveis a outro tenant';
  END IF;
  UPDATE public.vak_analysis_history SET is_validated=false WHERE contact_id=cid;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Outro tenant altera validação VAK'; END IF;
  UPDATE public.metaprogram_analysis SET is_validated=false WHERE contact_id=cid;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Outro tenant altera metaprograma'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
