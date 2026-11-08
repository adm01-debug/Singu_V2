CREATE OR REPLACE FUNCTION public.sync_interaction_from_zapp(p_phone text, p_channel text DEFAULT 'whatsapp'::text, p_direction text DEFAULT 'inbound'::text, p_assunto text DEFAULT NULL::text, p_resumo text DEFAULT NULL::text, p_conteudo text DEFAULT NULL::text, p_sentiment text DEFAULT 'neutral'::text, p_message_count integer DEFAULT 0, p_duration_seconds integer DEFAULT NULL::integer, p_agent_name text DEFAULT NULL::text, p_zapp_conversation_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_clean TEXT;
  v_contact_id UUID;
  v_company_id UUID;
  v_interaction_id UUID;
  v_new_score INT;
  v_rfm_result JSONB;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    RAISE EXCEPTION 'This function is reserved for the service role'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF length(v_clean) >= 12 AND v_clean LIKE '55%' THEN
    v_clean := substring(v_clean FROM 3);
  END IF;

  SELECT cp.contact_id INTO v_contact_id
  FROM contact_phones cp
  WHERE cp.numero_normalizado = v_clean OR cp.numero_e164 = '+55' || v_clean OR cp.numero = v_clean
  LIMIT 1;

  IF v_contact_id IS NULL THEN
    SELECT cph.company_id INTO v_company_id
    FROM company_phones cph
    WHERE cph.numero_normalizado = v_clean OR cph.numero_e164 = '+55' || v_clean OR cph.numero = v_clean
    LIMIT 1;
    IF v_company_id IS NOT NULL THEN
      SELECT c.id INTO v_contact_id
      FROM contacts c WHERE c.company_id = v_company_id AND c.deleted_at IS NULL
      ORDER BY c.created_at ASC LIMIT 1;
    END IF;
  ELSE
    SELECT c.company_id INTO v_company_id
    FROM contacts c WHERE c.id = v_contact_id;
  END IF;

  IF v_contact_id IS NULL THEN
    RETURN jsonb_build_object('synced', false, 'reason', 'contact_not_found', 'phone', p_phone);
  END IF;

  IF p_zapp_conversation_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM interactions WHERE external_id = p_zapp_conversation_id AND source_system = 'zapp-web'
    ) THEN
      RETURN jsonb_build_object('synced', false, 'reason', 'duplicate', 'external_id', p_zapp_conversation_id);
    END IF;
  END IF;

  INSERT INTO interactions (
    contact_id, company_id, channel, direction, status,
    assunto, resumo, conteudo, sentiment,
    data_interacao, duracao_segundos,
    external_id, source_system,
    type, title, content,
    metadata
  ) VALUES (
    v_contact_id, v_company_id, p_channel, p_direction, 'concluido',
    COALESCE(p_assunto, 'Conversa via WhatsApp'),
    p_resumo, p_conteudo, p_sentiment,
    NOW(), p_duration_seconds,
    p_zapp_conversation_id, 'zapp-web',
    p_channel, COALESCE(p_assunto, 'Conversa WhatsApp'), p_conteudo,
    jsonb_build_object('message_count', p_message_count, 'agent_name', p_agent_name, 'synced_at', NOW())
  )
  RETURNING id INTO v_interaction_id;

  -- Recalculate relationship score
  BEGIN
    v_new_score := calculate_relationship_score(v_contact_id);
    UPDATE contacts SET relationship_score = v_new_score, updated_at = NOW()
    WHERE id = v_contact_id;
  EXCEPTION WHEN OTHERS THEN v_new_score := NULL;
  END;

  -- Recalculate RFM if company exists
  IF v_company_id IS NOT NULL THEN
    BEGIN
      v_rfm_result := recalculate_rfm_for_company(v_company_id);
    EXCEPTION WHEN OTHERS THEN v_rfm_result := NULL;
    END;
  END IF;

  RETURN jsonb_build_object(
    'synced', true,
    'interaction_id', v_interaction_id,
    'contact_id', v_contact_id,
    'company_id', v_company_id,
    'new_relationship_score', v_new_score,
    'rfm_update', v_rfm_result
  );
END;
$function$
