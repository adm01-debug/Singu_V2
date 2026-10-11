BEGIN;
SELECT set_config('rls.lead_owner', (SELECT id::text FROM auth.users ORDER BY created_at LIMIT 1), true);
SELECT set_config('request.jwt.claim.sub', current_setting('rls.lead_owner'), true);
SELECT set_config('request.jwt.claims', json_build_object('sub', current_setting('rls.lead_owner'), 'role', 'service_role')::text, true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.lead_owner')::uuid, 'Contrato', 'Pontuação')
RETURNING set_config('rls.lead_contact', id::text, true);
INSERT INTO public.lead_score_recompute_queue(user_id, contact_id)
VALUES (current_setting('rls.lead_owner')::uuid, current_setting('rls.lead_contact')::uuid)
RETURNING set_config('rls.lead_queue', id::text, true);
INSERT INTO public.lead_score_recompute_queue(user_id, contact_id)
VALUES (current_setting('rls.lead_owner')::uuid, gen_random_uuid())
RETURNING set_config('rls.lead_orphan_queue', id::text, true);
SET LOCAL ROLE service_role;
DO $test$
DECLARE
  uid uuid := current_setting('rls.lead_owner')::uuid;
  cid uuid := current_setting('rls.lead_contact')::uuid;
  qid uuid := current_setting('rls.lead_queue')::uuid;
  score jsonb;
  history jsonb;
  failed boolean;
BEGIN
  score := jsonb_build_object('user_id', uid, 'contact_id', cid, 'total_score', 50,
    'fit_score', 50, 'engagement_score', 50, 'intent_score', 50, 'relationship_score', 50,
    'grade', 'warm', 'calculated_at', now(), 'last_calculated_at', now(), 'factors', '{"signals_count":2}'::jsonb);
  history := score || jsonb_build_object('recorded_at', now());
  failed := false;
  BEGIN
    PERFORM public.persist_lead_score_results(uid, jsonb_build_array(score),
      jsonb_build_array(history || '{"recorded_at":null}'::jsonb), ARRAY[qid]);
  EXCEPTION WHEN not_null_violation THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.lead_scores WHERE contact_id = cid)
    OR EXISTS (SELECT 1 FROM public.lead_score_recompute_queue WHERE id = qid AND processed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Falha no histórico deixou score ou fila persistidos';
  END IF;
  failed := false;
  BEGIN
    PERFORM public.persist_lead_score_results(uid, jsonb_build_array(score || '{"grade":"A"}'::jsonb),
      jsonb_build_array(history), ARRAY[qid]);
  EXCEPTION WHEN check_violation THEN failed := true;
  END;
  IF NOT failed OR EXISTS (SELECT 1 FROM public.lead_score_history WHERE contact_id = cid) THEN
    RAISE EXCEPTION 'Categoria incompatível deixou histórico persistido';
  END IF;
  PERFORM public.persist_lead_score_results(uid, jsonb_build_array(score), jsonb_build_array(history), ARRAY[qid]);
  IF NOT EXISTS (SELECT 1 FROM public.lead_scores WHERE contact_id = cid AND grade = 'warm' AND total_score = 50)
    OR NOT EXISTS (SELECT 1 FROM public.lead_score_history WHERE contact_id = cid AND company_id IS NULL AND factors->>'signals_count' = '2')
    OR NOT EXISTS (SELECT 1 FROM public.lead_score_recompute_queue WHERE id = qid AND processed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Transação não gravou score, histórico e conclusão da fila';
  END IF;
  IF has_function_privilege('authenticated', 'public.persist_lead_score_results(uuid,jsonb,jsonb,uuid[])', 'EXECUTE')
    OR has_function_privilege('anon', 'public.persist_lead_score_results(uuid,jsonb,jsonb,uuid[])', 'EXECUTE') THEN
    RAISE EXCEPTION 'Persistência do servidor exposta ao cliente';
  END IF;
  score := score || jsonb_build_object('total_score', 70, 'previous_score', 50, 'grade', 'hot');
  PERFORM public.persist_lead_score_results(uid, jsonb_build_array(score),
    jsonb_build_array(score || jsonb_build_object('recorded_at', now())), '{}');
  IF NOT EXISTS (SELECT 1 FROM public.lead_scores WHERE contact_id = cid AND total_score = 70 AND score_change = 20)
    OR (SELECT count(*) FROM public.lead_score_history WHERE contact_id = cid) <> 2 THEN
    RAISE EXCEPTION 'Atualização não preservou histórico e diferença gerada pelo banco';
  END IF;
  failed := false;
  BEGIN
    PERFORM public.persist_lead_score_results('00000000-0000-0000-0000-0000000000b2',
      jsonb_build_array(score || '{"user_id":"00000000-0000-0000-0000-0000000000b2"}'::jsonb), '[]', '{}');
  EXCEPTION WHEN insufficient_privilege THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'Outro tenant alterou a pontuação'; END IF;
  UPDATE public.lead_score_recompute_queue SET processed_at = NULL WHERE id = qid;
  PERFORM public.persist_lead_score_results(uid, '[]', '[]', ARRAY[qid, current_setting('rls.lead_orphan_queue')::uuid]);
  IF NOT EXISTS (SELECT 1 FROM public.lead_score_recompute_queue
      WHERE id = current_setting('rls.lead_orphan_queue')::uuid AND processed_at IS NOT NULL)
    OR EXISTS (SELECT 1 FROM public.lead_score_recompute_queue WHERE id = qid AND processed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Descarte de contato excluído concluiu também uma pontuação não gravada';
  END IF;
END;
$test$;
RESET ROLE;
SELECT 'lead_score_persistence_contract: OK' AS result;
ROLLBACK;
