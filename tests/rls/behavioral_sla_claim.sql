BEGIN;
SELECT set_config('rls.sla_owner', (SELECT id::text FROM auth.users ORDER BY created_at, id LIMIT 1), true);
INSERT INTO public.contacts(user_id, first_name, last_name)
VALUES (current_setting('rls.sla_owner')::uuid, 'Contrato', 'SLA')
RETURNING set_config('rls.sla_contact', id::text, true);
INSERT INTO public.behavioral_insight_feedback(user_id, contact_id, insight_kind, insight_label, vote)
SELECT current_setting('rls.sla_owner')::uuid, current_setting('rls.sla_contact')::uuid,
  'preference', 'Contrato SLA ' || n, -1 FROM generate_series(1, 3) n;
INSERT INTO public.interactions(contact_id, type, content, user_id)
VALUES (current_setting('rls.sla_contact')::uuid, 'note', 'Histórico aguardando geração', current_setting('rls.sla_owner')::uuid);
SET LOCAL ROLE service_role;
DO $test$
DECLARE
  owner_id uuid := current_setting('rls.sla_owner')::uuid;
  fixture_contact_id uuid := current_setting('rls.sla_contact')::uuid;
  first_claim public.behavioral_profile_regen_queue;
  renewed public.behavioral_profile_regen_queue;
  batch_claim public.behavioral_profile_regen_queue;
  waiting_contact uuid;
  ready_contact uuid;
  affected integer;
  failed boolean := false;
  saved jsonb;
BEGIN
  IF has_function_privilege('authenticated', 'public.claim_behavioral_profile_sla(uuid,uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.claim_behavioral_profile_sla(uuid,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_behavioral_profile_sla_batch(integer)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.claim_behavioral_profile_sla_batch(integer)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Reserva SLA exposta fora do serviço';
  END IF;
  IF EXISTS (SELECT 1 FROM public.claim_behavioral_profile_sla_batch(5)) THEN
    RAISE EXCEPTION 'Lote ignorou pedido em espera';
  END IF;
  BEGIN
    PERFORM public.claim_behavioral_profile_sla(fixture_contact_id, gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN failed := true;
  END;
  IF NOT failed THEN RAISE EXCEPTION 'SLA aceitou proprietário divergente'; END IF;
  IF (public.claim_behavioral_profile_sla(fixture_contact_id, owner_id)).contact_id IS NOT NULL THEN
    RAISE EXCEPTION 'SLA antecipou o pedido de histórico em espera';
  END IF;
  UPDATE public.behavioral_profile_regen_queue AS q SET next_run_at = clock_timestamp() - interval '1 second'
  WHERE q.contact_id = fixture_contact_id;
  first_claim := public.claim_behavioral_profile_sla(fixture_contact_id, owner_id);
  IF first_claim.contact_id IS DISTINCT FROM fixture_contact_id OR first_claim.claim_token IS NULL
    OR first_claim.attempts <> 1
    OR first_claim.next_run_at < clock_timestamp() + interval '19 minutes'
    OR (public.claim_behavioral_profile_sla(fixture_contact_id, owner_id)).contact_id IS NOT NULL THEN
    RAISE EXCEPTION 'SLA não reservou exclusivamente o contato';
  END IF;
  INSERT INTO public.interactions(contact_id, type, content, user_id)
  VALUES (fixture_contact_id, 'note', 'Histórico posterior ao SLA', owner_id);
  UPDATE public.behavioral_profile_regen_queue AS q SET last_error = 'Worker antigo'
  WHERE q.contact_id = fixture_contact_id AND q.claim_token = first_claim.claim_token;
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN RAISE EXCEPTION 'Reserva SLA antiga alterou solicitação nova'; END IF;
  UPDATE public.behavioral_profile_regen_queue AS q SET next_run_at = clock_timestamp() - interval '1 second'
  WHERE q.contact_id = fixture_contact_id;
  renewed := public.claim_behavioral_profile_sla(fixture_contact_id, owner_id);
  IF renewed.claim_token IS NULL OR renewed.claim_token = first_claim.claim_token THEN
    RAISE EXCEPTION 'SLA não preservou o novo pedido com outra reserva';
  END IF;
  saved := public.save_behavioral_profile_if_fresh(fixture_contact_id, renewed.claim_token,
    jsonb_build_object('user_id', owner_id, 'summary', 'SLA confirmado'), clock_timestamp(), 'auto');
  IF saved IS NULL OR (public.claim_behavioral_profile_sla(fixture_contact_id, owner_id)).contact_id IS NOT NULL
    OR EXISTS (SELECT 1 FROM public.behavioral_profile_regen_queue AS q WHERE q.contact_id = fixture_contact_id) THEN
    RAISE EXCEPTION 'SLA recriou fila concluída ou ignorou perfil recente';
  END IF;
  INSERT INTO public.contacts(user_id, first_name, last_name)
  VALUES (owner_id, 'Aguardando', 'Lote') RETURNING id INTO waiting_contact;
  INSERT INTO public.contacts(user_id, first_name, last_name)
  VALUES (owner_id, 'Pronto', 'Lote') RETURNING id INTO ready_contact;
  INSERT INTO public.behavioral_insight_feedback(user_id, contact_id, insight_kind, insight_label, vote)
  SELECT owner_id, candidates.id, 'preference', 'Contrato lote ' || n, -1
  FROM (VALUES (waiting_contact), (ready_contact)) AS candidates(id)
  CROSS JOIN generate_series(1, 3) AS n;
  INSERT INTO public.behavioral_profile_regen_queue (
    contact_id, user_id, enqueued_at, next_run_at, trigger_source
  ) VALUES (waiting_contact, owner_id, clock_timestamp(), clock_timestamp() + interval '1 hour',
    'cron_auto_regen_downvotes');
  SELECT * INTO batch_claim FROM public.claim_behavioral_profile_sla_batch(5);
  IF batch_claim.contact_id IS DISTINCT FROM ready_contact OR batch_claim.claim_token IS NULL
    OR EXISTS (SELECT 1 FROM public.claim_behavioral_profile_sla_batch(5)) THEN
    RAISE EXCEPTION 'Lote não ignorou contato reservado ou recriou reserva concluída';
  END IF;
END;
$test$;
ROLLBACK;
