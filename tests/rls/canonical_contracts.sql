BEGIN;
SELECT set_config('rls.contract_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.contract_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.contract_owner'), 'role', 'authenticated')::text, true);
INSERT INTO public.contacts (user_id, first_name, last_name)
VALUES (current_setting('rls.contract_owner')::uuid, 'Contrato', 'Fixture')
RETURNING set_config('rls.contract_contact', id::text, true);
INSERT INTO public.sequences (user_id, name)
VALUES (current_setting('rls.contract_owner')::uuid, 'Contrato fixture')
RETURNING set_config('rls.contract_sequence', id::text, true);
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vak_analysis_history' AND column_name='primary_modality') THEN
    INSERT INTO public.vak_analysis_history (user_id, contact_id, primary_modality)
    VALUES (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid, 'V');
  ELSE
    INSERT INTO public.vak_analysis_history (user_id, contact_id)
    VALUES (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid);
  END IF;
END $$;
INSERT INTO public.metaprogram_analysis (user_id, contact_id)
VALUES (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid);

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
  BEGIN
    UPDATE public.csat_surveys SET score=0 WHERE contact_id=cid AND survey_type='csat';
    RAISE EXCEPTION 'CSAT aceita nota zero';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.csat_surveys SET nps_score=11 WHERE contact_id=cid AND survey_type='nps';
    RAISE EXCEPTION 'NPS aceita nota 11';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.csat_surveys SET nps_score=-1 WHERE contact_id=cid AND survey_type='nps';
    RAISE EXCEPTION 'NPS aceita nota negativa';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.csat_surveys SET nps_score=NULL WHERE contact_id=cid AND survey_type='nps';
    RAISE EXCEPTION 'Pesquisa respondida aceita nota nula';
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
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sequence_steps' AND column_name='step_number') THEN
    INSERT INTO public.sequence_steps (user_id, sequence_id, step_number, step_order, channel, condition_type, condition_wait_hours, branch_on_yes_step)
    VALUES (uid, sid, 1, 1, 'email', 'if_opened', 24, 2);
  ELSE
    INSERT INTO public.sequence_steps (sequence_id, step_order, channel, condition_type, condition_wait_hours, branch_on_yes_step)
    VALUES (sid, 1, 'email', 'if_opened', 24, 2);
  END IF;
  BEGIN
    UPDATE public.sequence_steps SET condition_type='invalid_condition' WHERE sequence_id=sid;
    RAISE EXCEPTION 'Condição inválida aceita';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
END $$;
RESET ROLE;

INSERT INTO public.csat_surveys (user_id, contact_id, survey_type, status, expires_at)
VALUES
  (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid, 'nps', 'pending', now() + interval '1 day'),
  (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid, 'csat', 'pending', now() + interval '1 day'),
  (current_setting('rls.contract_owner')::uuid, current_setting('rls.contract_contact')::uuid, 'ces', 'pending', now() + interval '1 day');
SELECT set_config('rls.nps_token', (SELECT public_token::text FROM public.csat_surveys WHERE contact_id=current_setting('rls.contract_contact')::uuid AND survey_type='nps' AND status='pending'), true);
SELECT set_config('rls.csat_token', (SELECT public_token::text FROM public.csat_surveys WHERE contact_id=current_setting('rls.contract_contact')::uuid AND survey_type='csat' AND status='pending'), true);
SELECT set_config('rls.ces_token', (SELECT public_token::text FROM public.csat_surveys WHERE contact_id=current_setting('rls.contract_contact')::uuid AND survey_type='ces' AND status='pending'), true);
SET LOCAL ROLE anon;
DO $$
DECLARE
  token uuid := current_setting('rls.nps_token')::uuid;
BEGIN
  IF (public.get_public_csat_survey(token)->>'rating_max')::integer <> 10 THEN RAISE EXCEPTION 'Escala NPS pública incorreta'; END IF;
  IF NOT public.submit_public_csat_survey(token, 10, 'Resposta pública') THEN RAISE EXCEPTION 'NPS público rejeita nota 10'; END IF;
  IF public.submit_public_csat_survey(token, 0, NULL) THEN RAISE EXCEPTION 'Pesquisa respondida aceita reenvio'; END IF;
  IF (public.get_public_csat_survey(token)->>'score')::integer <> 10 THEN RAISE EXCEPTION 'Leitura pública usa a nota errada'; END IF;
  BEGIN
    PERFORM public.submit_public_csat_survey(current_setting('rls.csat_token')::uuid, 10, NULL);
    RAISE EXCEPTION 'CSAT público aceita nota 10';
  EXCEPTION WHEN invalid_parameter_value THEN NULL;
  END;
  IF NOT public.submit_public_csat_survey(current_setting('rls.csat_token')::uuid, 5, NULL) THEN RAISE EXCEPTION 'CSAT público rejeita nota 5'; END IF;
  IF NOT public.submit_public_csat_survey(current_setting('rls.ces_token')::uuid, 7, NULL) THEN RAISE EXCEPTION 'CES público rejeita nota 7'; END IF;
  IF public.submit_public_csat_survey(gen_random_uuid(), 5, NULL) THEN RAISE EXCEPTION 'Token inexistente aceito'; END IF;
END $$;
RESET ROLE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.csat_surveys WHERE public_token=current_setting('rls.nps_token')::uuid AND (score IS NOT NULL OR nps_score <> 10 OR sent_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'NPS grava nota CSAT ou envio fictício';
  END IF;
END $$;

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
