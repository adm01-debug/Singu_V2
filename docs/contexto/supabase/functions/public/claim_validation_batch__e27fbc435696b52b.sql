CREATE OR REPLACE FUNCTION public.claim_validation_batch(p_batch_size integer DEFAULT 50, p_max_attempts integer DEFAULT 3)
 RETURNS SETOF validation_queue
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF p_batch_size IS NULL OR p_max_attempts IS NULL
    OR p_batch_size NOT BETWEEN 1 AND 100 OR p_max_attempts NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'Limites inválidos para a fila de validação' USING ERRCODE = '22023';
  END IF;

  UPDATE public.validation_queue
  SET status = 'error', processed_at = now(),
      last_error = COALESCE(last_error, 'Prazo da validação excedido'),
      claim_token = NULL, lease_expires_at = NULL
  WHERE attempts >= p_max_attempts
    AND (status = 'pending' OR (status = 'processing'
      AND (lease_expires_at IS NULL OR lease_expires_at <= now())));

  RETURN QUERY
    UPDATE public.validation_queue AS q
    SET status = 'processing', attempts = q.attempts + 1,
        lease_expires_at = now() + interval '15 minutes',
        claim_token = gen_random_uuid()
    WHERE q.id IN (
      SELECT pending.id FROM public.validation_queue AS pending
      WHERE pending.attempts < p_max_attempts
        AND (pending.status = 'pending'
          OR (pending.status = 'processing' AND
            (pending.lease_expires_at IS NULL OR pending.lease_expires_at <= now())))
      ORDER BY pending.created_at, pending.id
      FOR UPDATE SKIP LOCKED LIMIT p_batch_size
    )
    RETURNING q.*;
END;
$function$
