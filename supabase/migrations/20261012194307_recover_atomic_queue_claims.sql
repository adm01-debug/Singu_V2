ALTER TABLE public.validation_queue
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_token uuid;

ALTER TABLE public.behavioral_profile_regen_queue
  ADD COLUMN IF NOT EXISTS claim_token uuid DEFAULT gen_random_uuid();

CREATE OR REPLACE FUNCTION public.update_bpr_queue_updated_at()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.claim_token = gen_random_uuid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_validation_batch(
  p_batch_size integer DEFAULT 50,
  p_max_attempts integer DEFAULT 3
)
RETURNS SETOF public.validation_queue
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.claim_validation_batch(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_validation_batch(integer, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_regen_batch(
  p_batch_size integer DEFAULT 10,
  p_lock_minutes integer DEFAULT 15
)
RETURNS SETOF public.behavioral_profile_regen_queue
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF p_batch_size IS NULL OR p_lock_minutes IS NULL
    OR p_batch_size NOT BETWEEN 1 AND 100 OR p_lock_minutes NOT BETWEEN 1 AND 60 THEN
    RAISE EXCEPTION 'Limites inválidos para a fila de perfis' USING ERRCODE = '22023';
  END IF;

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
$$;

REVOKE ALL ON FUNCTION public.claim_regen_batch(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_regen_batch(integer, integer) TO service_role;

-- Rollback: pare ambos os workers, restaure as funções anteriores da migration
-- 20260720000002 e libere manualmente os itens 'processing' após conferir o
-- provedor. Em instalações sem essas funções, remova-as antes das colunas:
-- DROP FUNCTION public.claim_validation_batch(integer, integer);
-- DROP FUNCTION public.claim_regen_batch(integer, integer);
-- ALTER TABLE public.validation_queue DROP COLUMN claim_token, DROP COLUMN lease_expires_at;
-- CREATE OR REPLACE FUNCTION public.update_bpr_queue_updated_at()
-- RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $rollback$
-- BEGIN NEW.updated_at = now(); RETURN NEW; END; $rollback$;
-- ALTER TABLE public.behavioral_profile_regen_queue DROP COLUMN claim_token;
