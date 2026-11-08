CREATE OR REPLACE FUNCTION public.complete_validation_queue_item(p_queue_id uuid, p_claim_token uuid, p_user_id uuid, p_contact_id uuid, p_kind text, p_value text, p_result jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
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
$function$
