CREATE OR REPLACE FUNCTION public.claim_regen_batch(p_batch_size integer DEFAULT 10, p_lock_minutes integer DEFAULT 15)
 RETURNS SETOF behavioral_profile_regen_queue
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_batch_size IS NULL OR p_lock_minutes IS NULL
    OR p_batch_size NOT BETWEEN 1 AND 100 OR p_lock_minutes NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'Limites inválidos para a fila de perfis' USING ERRCODE = '22023';
  END IF;

  UPDATE public.behavioral_profile_regen_queue
  SET last_error = 'Limite de tentativas após expiração da reserva',
      updated_at = clock_timestamp()
  WHERE attempts >= 5 AND next_run_at <= clock_timestamp()
    AND NULLIF(last_error, '') IS NULL;

  RETURN QUERY
    UPDATE public.behavioral_profile_regen_queue AS q
    SET next_run_at = clock_timestamp() + make_interval(mins => p_lock_minutes),
        last_processed_at = clock_timestamp(),
        attempts = q.attempts + 1,
        claim_token = gen_random_uuid(),
        updated_at = clock_timestamp()
    WHERE q.contact_id IN (
      SELECT pending.contact_id FROM public.behavioral_profile_regen_queue AS pending
      WHERE pending.next_run_at <= clock_timestamp() AND pending.attempts < 5
      ORDER BY pending.next_run_at, pending.contact_id
      FOR UPDATE SKIP LOCKED LIMIT p_batch_size
    )
    RETURNING q.*;
END;
$function$
