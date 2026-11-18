-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260401192028
-- nome:   create_rpc_sync_interaction_from_zapp

-- =============================================================
-- RPC: sync_interaction_from_zapp
-- Recebe dados de uma conversa do zapp-web e grava na tabela
-- interactions do CRM. Também atualiza relationship_score.
-- =============================================================
CREATE OR REPLACE FUNCTION public.sync_interaction_from_zapp(
  p_phone TEXT,
  p_channel TEXT DEFAULT 'whatsapp',
  p_direction TEXT DEFAULT 'inbound',
  p_assunto TEXT DEFAULT NULL,
  p_resumo TEXT DEFAULT NULL,
  p_conteudo TEXT DEFAULT NULL,
  p_sentiment TEXT DEFAULT 'neutral',
  p_message_count INT DEFAULT 0,
  p_duration_seconds INT DEFAULT NULL,
  p_agent_name TEXT DEFAULT NULL,
  p_zapp_conversation_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean TEXT;
  v_contact_id UUID;
  v_company_id UUID;
  v_interaction_id UUID;
  v_new_score INT;
BEGIN
  -- Clean phone
  v_clean := regexp_replace(p_phone, '[^0-9]', '', 'g');
  IF length(v_clean) >= 12 AND v_clean LIKE '55%' THEN
    v_clean := substring(v_clean FROM 3);
  END IF;

  -- Find contact
  SELECT cp.contact_id INTO v_contact_id
  FROM contact_phones cp
  WHERE cp.numero_normalizado = v_clean
     OR cp.numero_e164 = '+55' || v_clean
     OR cp.numero = v_clean
  LIMIT 1;

  -- If no contact found via contact_phones, try company_phones
  IF v_contact_id IS NULL THEN
    SELECT cph.company_id INTO v_company_id
    FROM company_phones cph
    WHERE cph.numero_normalizado = v_clean
       OR cph.numero_e164 = '+55' || v_clean
       OR cph.numero = v_clean
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

  -- If still no contact, return not_found
  IF v_contact_id IS NULL THEN
    RETURN jsonb_build_object('synced', false, 'reason', 'contact_not_found', 'phone', p_phone);
  END IF;

  -- Check for duplicate (same contact, same day, same external_id)
  IF p_zapp_conversation_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM interactions 
      WHERE external_id = p_zapp_conversation_id AND source_system = 'zapp-web'
    ) THEN
      RETURN jsonb_build_object('synced', false, 'reason', 'duplicate', 'external_id', p_zapp_conversation_id);
    END IF;
  END IF;

  -- Insert interaction
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
    jsonb_build_object(
      'message_count', p_message_count,
      'agent_name', p_agent_name,
      'synced_at', NOW()
    )
  )
  RETURNING id INTO v_interaction_id;

  -- Recalculate relationship score
  BEGIN
    v_new_score := calculate_relationship_score(v_contact_id);
    UPDATE contacts SET 
      relationship_score = v_new_score,
      updated_at = NOW()
    WHERE id = v_contact_id;
  EXCEPTION WHEN OTHERS THEN
    v_new_score := NULL;
  END;

  RETURN jsonb_build_object(
    'synced', true,
    'interaction_id', v_interaction_id,
    'contact_id', v_contact_id,
    'company_id', v_company_id,
    'new_relationship_score', v_new_score
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_interaction_from_zapp(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,INT,INT,TEXT,TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.sync_interaction_from_zapp(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,INT,INT,TEXT,TEXT) TO authenticated;
