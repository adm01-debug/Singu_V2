CREATE OR REPLACE FUNCTION public.claim_behavioral_profile_sla(p_contact_id uuid, p_user_id uuid)
 RETURNS behavioral_profile_regen_queue
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_owner uuid;
  v_queue public.behavioral_profile_regen_queue;
BEGIN
  IF current_user <> 'service_role' OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'Reserva exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  SELECT c.user_id INTO v_owner FROM public.contacts AS c
  WHERE c.id = p_contact_id AND c.deleted_at IS NULL FOR SHARE;
  IF v_owner IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Proprietário do contato divergente' USING ERRCODE = '42501';
  END IF;
  IF (SELECT count(*) FROM public.behavioral_insight_feedback AS feedback
      WHERE feedback.contact_id = p_contact_id AND feedback.user_id = v_owner
        AND feedback.vote = -1 AND feedback.created_at >= clock_timestamp() - interval '30 days') < 3
    OR EXISTS (SELECT 1 FROM public.contact_analytical_profiles AS profile
      WHERE profile.contact_id = p_contact_id
        AND profile.last_updated_at >= clock_timestamp() - interval '24 hours') THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.behavioral_profile_regen_queue (
    contact_id, user_id, enqueued_at, next_run_at, trigger_source
  ) VALUES (p_contact_id, v_owner, clock_timestamp(), clock_timestamp(), 'cron_auto_regen_downvotes')
  ON CONFLICT (contact_id) DO NOTHING;

  SELECT q.* INTO v_queue FROM public.behavioral_profile_regen_queue AS q
  WHERE q.contact_id = p_contact_id FOR UPDATE;
  IF v_queue.user_id IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'Proprietário da reserva divergente' USING ERRCODE = '42501';
  END IF;
  IF v_queue.next_run_at > clock_timestamp() OR v_queue.attempts >= 5
    OR v_queue.last_processed_at >= clock_timestamp() - interval '24 hours' THEN
    RETURN NULL;
  END IF;

  UPDATE public.behavioral_profile_regen_queue
  SET attempts = attempts + 1, claim_token = gen_random_uuid(),
    next_run_at = clock_timestamp() + interval '20 minutes',
    last_processed_at = clock_timestamp(), last_error = NULL
  WHERE contact_id = p_contact_id
  RETURNING * INTO v_queue;
  RETURN v_queue;
END;
$function$
