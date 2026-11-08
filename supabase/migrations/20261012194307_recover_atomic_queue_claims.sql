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

CREATE OR REPLACE FUNCTION public.enqueue_behavioral_profile_regen()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.enqueue_behavioral_profile_regen() FROM PUBLIC, anon, authenticated;

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

CREATE OR REPLACE FUNCTION public.complete_validation_queue_item(
  p_queue_id uuid,
  p_claim_token uuid,
  p_user_id uuid,
  p_contact_id uuid,
  p_kind text,
  p_value text,
  p_result jsonb
)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_queue public.validation_queue;
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Confirmação exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  IF p_queue_id IS NULL OR p_claim_token IS NULL OR p_user_id IS NULL
    OR p_kind IS NULL OR p_kind NOT IN ('email', 'phone') OR p_value IS NULL
    OR p_result IS NULL OR jsonb_typeof(p_result) <> 'object' THEN
    RAISE EXCEPTION 'Validação incompleta' USING ERRCODE = '22023';
  END IF;
  SELECT q.* INTO v_queue FROM public.validation_queue q
  WHERE q.id = p_queue_id FOR UPDATE;
  IF NOT FOUND OR v_queue.claim_token IS DISTINCT FROM p_claim_token THEN RETURN NULL; END IF;
  IF v_queue.user_id <> p_user_id OR v_queue.contact_id IS DISTINCT FROM p_contact_id
    OR v_queue.kind::text <> p_kind OR v_queue.value <> p_value
    OR (p_contact_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.contacts c WHERE c.id = p_contact_id AND c.user_id = p_user_id
    )) THEN
    RAISE EXCEPTION 'Proprietário ou alvo da validação divergente' USING ERRCODE = '42501';
  END IF;
  IF v_queue.status = 'done' THEN
    IF (p_kind = 'email' AND EXISTS (
      SELECT 1 FROM public.email_verifications v
      WHERE v.id = p_queue_id AND v.user_id = p_user_id
        AND v.contact_id IS NOT DISTINCT FROM p_contact_id AND v.email = p_value
    )) OR (p_kind = 'phone' AND EXISTS (
      SELECT 1 FROM public.phone_validations v
      WHERE v.id = p_queue_id AND v.user_id = p_user_id
        AND v.contact_id IS NOT DISTINCT FROM p_contact_id AND v.phone_input = p_value
    )) THEN RETURN p_queue_id; END IF;
    RAISE EXCEPTION 'Recibo persistido ausente' USING ERRCODE = '55000';
  END IF;
  IF v_queue.status <> 'processing' THEN RETURN NULL; END IF;

  IF p_kind = 'email' THEN
    INSERT INTO public.email_verifications (
      id, user_id, contact_id, email, status, score, mx_found, smtp_check,
      disposable, role_account, free_provider, reasons, provider, raw
    ) VALUES (
      p_queue_id, p_user_id, p_contact_id, p_value, p_result->>'status',
      (p_result->>'score')::integer, (p_result->>'mx_found')::boolean,
      (p_result->>'smtp_check')::boolean, (p_result->>'disposable')::boolean,
      (p_result->>'role_account')::boolean, (p_result->>'free_provider')::boolean,
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_result->'reasons', '[]'::jsonb))),
      'internal', p_result
    );
  ELSE
    INSERT INTO public.phone_validations (
      id, user_id, contact_id, phone_input, phone_e164, status, line_type,
      country, country_code, is_active, reasons, provider, raw
    ) VALUES (
      p_queue_id, p_user_id, p_contact_id, p_value, p_result->>'phone_e164',
      p_result->>'status', p_result->>'line_type', p_result->>'country',
      p_result->>'country_code', p_result->>'status' = 'valid',
      ARRAY(SELECT jsonb_array_elements_text(COALESCE(p_result->'reasons', '[]'::jsonb))),
      'libphonenumber', p_result
    );
  END IF;
  UPDATE public.validation_queue
  SET status = 'done', processed_at = clock_timestamp(), last_error = NULL, lease_expires_at = NULL
  WHERE id = p_queue_id;
  RETURN p_queue_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_validation_queue_item(uuid, uuid, uuid, uuid, text, text, jsonb)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_validation_queue_item(uuid, uuid, uuid, uuid, text, text, jsonb)
TO service_role;

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
  v_pending public.behavioral_profile_regen_queue;
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
  IF p_profile ? 'user_id' AND (p_profile->>'user_id')::uuid IS DISTINCT FROM v_owner THEN
    RAISE EXCEPTION 'Proprietário do perfil divergente' USING ERRCODE = '42501';
  END IF;

  IF p_claim_token IS NOT NULL AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Reserva exclusiva do serviço' USING ERRCODE = '42501';
  END IF;
  IF current_user = 'service_role' THEN
    SELECT q.* INTO v_pending
    FROM public.behavioral_profile_regen_queue AS q
    WHERE q.contact_id = p_contact_id
      AND (p_claim_token IS NULL OR q.claim_token = p_claim_token)
    FOR UPDATE;
    IF p_claim_token IS NOT NULL AND v_pending.contact_id IS NULL THEN RETURN NULL; END IF;
    IF v_pending.user_id IS NOT NULL AND v_pending.user_id <> v_owner THEN
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

  IF p_claim_token IS NOT NULL THEN
    DELETE FROM public.behavioral_profile_regen_queue
    WHERE contact_id = p_contact_id AND claim_token = p_claim_token;
  END IF;
  IF v_saved.id IS NULL THEN RETURN NULL; END IF;
  IF current_user = 'service_role' AND p_claim_token IS NULL AND p_trigger_source = 'manual'
    AND v_pending.enqueued_at <= p_started_at THEN
    DELETE FROM public.behavioral_profile_regen_queue
    WHERE contact_id = p_contact_id AND claim_token = v_pending.claim_token;
  END IF;

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

CREATE OR REPLACE FUNCTION public.claim_behavioral_profile_retry(
  p_contact_id uuid,
  p_actor_id uuid
)
RETURNS public.behavioral_profile_regen_queue
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_queue public.behavioral_profile_regen_queue;
BEGIN
  IF current_user <> 'service_role' OR p_actor_id IS NULL
    OR NOT COALESCE(public.has_role(p_actor_id, 'admin'), false) THEN
    RAISE EXCEPTION 'Reanálise exclusiva de administrador autenticado' USING ERRCODE = '42501';
  END IF;

  SELECT c.user_id INTO v_owner FROM public.contacts AS c WHERE c.id = p_contact_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Contato não encontrado' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.behavioral_profile_regen_queue (
    contact_id, user_id, enqueued_at, next_run_at, trigger_source
  ) VALUES (p_contact_id, v_owner, clock_timestamp(), clock_timestamp(), 'manual_retry')
  ON CONFLICT (contact_id) DO NOTHING;

  SELECT q.* INTO v_queue FROM public.behavioral_profile_regen_queue AS q
  WHERE q.contact_id = p_contact_id FOR UPDATE;
  IF v_queue.user_id <> v_owner THEN
    RAISE EXCEPTION 'Proprietário da reserva divergente' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.contact_analytical_profile_versions AS version
    WHERE version.contact_id = p_contact_id AND version.trigger_source = 'manual'
      AND version.generated_at > clock_timestamp() - interval '5 minutes'
  ) THEN
    RAISE EXCEPTION 'Reanálise recente; aguarde cinco minutos' USING ERRCODE = 'P0001';
  END IF;
  IF (v_queue.claim_token IS NOT NULL AND v_queue.next_run_at > clock_timestamp())
    OR (v_queue.trigger_source LIKE 'manual_retry%'
      AND v_queue.last_processed_at > clock_timestamp() - interval '5 minutes') THEN
    RAISE EXCEPTION 'Contato reservado ou em pausa temporária; aguarde para tentar novamente'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.behavioral_profile_regen_queue
  SET attempts = attempts + 1,
      claim_token = gen_random_uuid(),
      next_run_at = clock_timestamp() + interval '20 minutes',
      last_processed_at = clock_timestamp(),
      trigger_source = 'manual_retry',
      last_error = NULL,
      updated_at = clock_timestamp()
  WHERE contact_id = p_contact_id
  RETURNING * INTO v_queue;
  RETURN v_queue;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_behavioral_profile_retry(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_behavioral_profile_retry(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_behavioral_profile_sla(
  p_contact_id uuid,
  p_user_id uuid
)
RETURNS public.behavioral_profile_regen_queue
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.claim_behavioral_profile_sla(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_behavioral_profile_sla(uuid, uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.claim_behavioral_profile_sla_batch(p_limit integer DEFAULT 5)
RETURNS SETOF public.behavioral_profile_regen_queue
LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO public, pg_temp
AS $$
DECLARE
  v_candidate record;
  v_claim public.behavioral_profile_regen_queue;
BEGIN
  IF current_user <> 'service_role' THEN
    RAISE EXCEPTION 'Reserva exclusiva do serviço' USING ERRCODE = '42501';
  END IF;

  FOR v_candidate IN
    SELECT c.id, c.user_id
    FROM public.contacts AS c
    JOIN (
      SELECT feedback.contact_id, feedback.user_id
      FROM public.behavioral_insight_feedback AS feedback
      WHERE feedback.vote = -1
        AND feedback.created_at >= clock_timestamp() - interval '30 days'
      GROUP BY feedback.contact_id, feedback.user_id
      HAVING count(*) >= 3
    ) AS votes ON votes.contact_id = c.id AND votes.user_id = c.user_id
    LEFT JOIN public.behavioral_profile_regen_queue AS q ON q.contact_id = c.id
    WHERE c.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.contact_analytical_profiles AS profile
        WHERE profile.contact_id = c.id
          AND profile.last_updated_at >= clock_timestamp() - interval '24 hours'
      )
      AND (q.contact_id IS NULL OR (
        q.user_id = c.user_id
        AND q.next_run_at <= clock_timestamp()
        AND q.attempts < 5
        AND (q.last_processed_at IS NULL
          OR q.last_processed_at < clock_timestamp() - interval '24 hours')
      ))
    ORDER BY c.id
    LIMIT LEAST(GREATEST(coalesce(p_limit, 5), 0), 5)
    FOR UPDATE OF c SKIP LOCKED
  LOOP
    v_claim := public.claim_behavioral_profile_sla(v_candidate.id, v_candidate.user_id);
    IF v_claim.contact_id IS NOT NULL THEN
      RETURN NEXT v_claim;
    END IF;
  END LOOP;
  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_behavioral_profile_sla_batch(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_behavioral_profile_sla_batch(integer) TO service_role;

-- Rollback: pare ambos os workers, restaure as funções anteriores da migration
-- 20260720000002 e libere manualmente os itens 'processing' após conferir o
-- provedor. Em instalações sem essas funções, remova-as antes das colunas:
-- Restaure enqueue_behavioral_profile_regen da migration 20260712221610,
-- preservando as datas dos registros posteriores; somente pedidos futuros
-- voltarão a manter o enqueued_at original após ON CONFLICT.
-- DROP FUNCTION public.claim_validation_batch(integer, integer);
-- DROP FUNCTION public.complete_validation_queue_item(uuid, uuid, uuid, uuid, text, text, jsonb);
-- DROP FUNCTION public.claim_regen_batch(integer, integer);
-- DROP FUNCTION public.save_behavioral_profile_if_fresh(uuid, uuid, jsonb, timestamptz, text);
-- DROP FUNCTION public.claim_behavioral_profile_retry(uuid, uuid);
-- DROP FUNCTION public.claim_behavioral_profile_sla(uuid, uuid);
-- DROP FUNCTION public.claim_behavioral_profile_sla_batch(integer);
-- GRANT UPDATE ON public.validation_queue TO authenticated;
-- GRANT UPDATE ON public.behavioral_profile_regen_queue TO authenticated;
-- ALTER TABLE public.validation_queue DROP COLUMN claim_token, DROP COLUMN lease_expires_at;
-- CREATE OR REPLACE FUNCTION public.update_bpr_queue_updated_at()
-- RETURNS trigger LANGUAGE plpgsql SET search_path TO public AS $rollback$
-- BEGIN NEW.updated_at = now(); RETURN NEW; END; $rollback$;
-- ALTER TABLE public.behavioral_profile_regen_queue DROP COLUMN claim_token;
