ALTER TABLE public.validation_queue
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS claim_token uuid;

ALTER TABLE public.behavioral_profile_regen_queue
  ADD COLUMN IF NOT EXISTS claim_token uuid DEFAULT gen_random_uuid();

REVOKE UPDATE ON public.validation_queue FROM PUBLIC, anon, authenticated;
REVOKE UPDATE ON public.behavioral_profile_regen_queue FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (claim_token, lease_expires_at, status, attempts, processed_at, last_error)
ON public.validation_queue FROM PUBLIC, anon, authenticated;
REVOKE UPDATE (claim_token, next_run_at, attempts, last_processed_at, last_error)
ON public.behavioral_profile_regen_queue FROM PUBLIC, anon, authenticated;

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

CREATE OR REPLACE FUNCTION public.save_behavioral_profile_if_fresh(
  p_contact_id uuid,
  p_claim_token uuid,
  p_profile jsonb,
  p_started_at timestamptz,
  p_trigger_source text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_claim_owner uuid;
  v_saved public.contact_analytical_profiles;
BEGIN
  IF p_contact_id IS NULL OR p_profile IS NULL OR p_started_at IS NULL
    OR p_trigger_source IS NULL OR p_trigger_source NOT IN ('auto', 'manual') THEN
    RAISE EXCEPTION 'Perfil incompleto' USING ERRCODE = '22023';
  END IF;

  SELECT c.user_id INTO v_owner
  FROM public.contacts AS c
  WHERE c.id = p_contact_id
    AND (current_user = 'service_role' OR c.user_id = auth.uid());
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Contato não pertence ao usuário' USING ERRCODE = '42501';
  END IF;

  IF p_claim_token IS NOT NULL THEN
    IF current_user <> 'service_role' THEN
      RAISE EXCEPTION 'Reserva exclusiva do serviço' USING ERRCODE = '42501';
    END IF;
    SELECT q.user_id INTO v_claim_owner
    FROM public.behavioral_profile_regen_queue AS q
    WHERE q.contact_id = p_contact_id AND q.claim_token = p_claim_token
    FOR UPDATE;
    IF v_claim_owner IS NULL THEN RETURN NULL; END IF;
    IF v_claim_owner <> v_owner THEN
      RAISE EXCEPTION 'Proprietário da reserva divergente' USING ERRCODE = '42501';
    END IF;
  END IF;

  INSERT INTO public.contact_analytical_profiles AS profile (
    contact_id, user_id, preferences, hobbies, recurrent_topics,
    communication_style, sentiment_trend, tone, summary, based_on_count,
    model, last_updated_at
  )
  VALUES (
    p_contact_id, v_owner, COALESCE(p_profile->'preferences', '[]'::jsonb),
    COALESCE(p_profile->'hobbies', '[]'::jsonb),
    COALESCE(p_profile->'recurrent_topics', '[]'::jsonb),
    p_profile->>'communication_style', p_profile->>'sentiment_trend',
    p_profile->>'tone', p_profile->>'summary',
    COALESCE((p_profile->>'based_on_count')::integer, 0),
    p_profile->>'model', p_started_at
  )
  ON CONFLICT (contact_id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    preferences = EXCLUDED.preferences,
    hobbies = EXCLUDED.hobbies,
    recurrent_topics = EXCLUDED.recurrent_topics,
    communication_style = EXCLUDED.communication_style,
    sentiment_trend = EXCLUDED.sentiment_trend,
    tone = EXCLUDED.tone,
    summary = EXCLUDED.summary,
    based_on_count = EXCLUDED.based_on_count,
    model = EXCLUDED.model,
    last_updated_at = EXCLUDED.last_updated_at
  WHERE profile.last_updated_at IS NULL
    OR profile.last_updated_at < EXCLUDED.last_updated_at
  RETURNING * INTO v_saved;

  IF v_saved.id IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.contact_analytical_profile_versions (
    contact_id, user_id, profile_id, summary, tone, communication_style,
    sentiment_trend, preferences, hobbies, recurrent_topics, based_on_count,
    model, trigger_source, generated_at
  ) VALUES (
    p_contact_id, v_owner, v_saved.id, v_saved.summary, v_saved.tone,
    v_saved.communication_style, v_saved.sentiment_trend, v_saved.preferences,
    v_saved.hobbies, v_saved.recurrent_topics, v_saved.based_on_count,
    v_saved.model, p_trigger_source, p_started_at
  );
  RETURN to_jsonb(v_saved);
END;
$$;

REVOKE ALL ON FUNCTION public.save_behavioral_profile_if_fresh(
  uuid, uuid, jsonb, timestamptz, text
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_behavioral_profile_if_fresh(
  uuid, uuid, jsonb, timestamptz, text
) TO authenticated, service_role;

-- Rollback: pare ambos os workers, restaure as funções anteriores da migration
-- 20260720000002 e libere manualmente os itens 'processing' após conferir o
-- provedor. Em instalações sem essas funções, remova-as antes das colunas:
-- DROP FUNCTION public.claim_validation_batch(integer, integer);
-- DROP FUNCTION public.claim_regen_batch(integer, integer);
-- DROP FUNCTION public.save_behavioral_profile_if_fresh(uuid, uuid, jsonb, timestamptz, text);
-- GRANT UPDATE ON public.validation_queue TO authenticated;
-- GRANT UPDATE ON public.behavioral_profile_regen_queue TO authenticated;
-- ALTER TABLE public.validation_queue DROP COLUMN claim_token, DROP COLUMN lease_expires_at;
-- CREATE OR REPLACE FUNCTION public.update_bpr_queue_updated_at()
-- RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $rollback$
-- BEGIN NEW.updated_at = now(); RETURN NEW; END; $rollback$;
-- ALTER TABLE public.behavioral_profile_regen_queue DROP COLUMN claim_token;
