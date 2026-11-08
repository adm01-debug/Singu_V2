CREATE OR REPLACE FUNCTION public.save_behavioral_profile_if_fresh(p_contact_id uuid, p_claim_token uuid, p_profile jsonb, p_started_at timestamp with time zone, p_trigger_source text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
