CREATE OR REPLACE FUNCTION public.enqueue_behavioral_profile_regen()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_contact_id uuid := NEW.contact_id;
  v_user_id uuid;
BEGIN
  IF v_contact_id IS NULL THEN RETURN NEW; END IF;
  SELECT user_id INTO v_user_id FROM public.contacts WHERE id = v_contact_id;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.behavioral_profile_regen_queue (
    contact_id, user_id, next_run_at, trigger_source, enqueued_at, updated_at
  ) VALUES (
    v_contact_id, v_user_id, clock_timestamp() + interval '5 minutes',
    TG_TABLE_NAME, clock_timestamp(), clock_timestamp()
  )
  ON CONFLICT (contact_id) DO UPDATE
  SET next_run_at = EXCLUDED.next_run_at,
      claim_token = gen_random_uuid(),
      last_processed_at = NULL,
      trigger_source = EXCLUDED.trigger_source,
      enqueued_at = EXCLUDED.enqueued_at,
      updated_at = EXCLUDED.updated_at,
      attempts = 0,
      last_error = NULL;
  RETURN NEW;
END;
$function$
