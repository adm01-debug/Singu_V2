-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408205204
-- nome:   zapp_history_32_connector_log_parser_trigger

-- ============================================================================
-- MELHORIA 32: Trigger AFTER INSERT em connector_log que:
--   1. Resolve contact_id via lookup em contact_phones (telefone normalizado)
--   2. Garante whatsapp_connection (single instance hardcoded "wpp2" do connector v5)
--   3. Cria/atualiza conversation
--   4. Insere message em zapp_history.messages
--   5. Detecta tipo (text/audio/image/video/document/sticker)
--   6. Cria stub em message_media OU message_audio (status=pending para download posterior)
--   7. Extrai URLs do texto e popula message_links
--   8. Marca processed=true e guarda zapp_message_id
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.parse_connector_log_to_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_phone_clean TEXT;
  v_phone_variants TEXT[];
  v_contact_id UUID;
  v_company_id UUID;
  v_conn_id UUID;
  v_conv_id UUID;
  v_msg_id UUID;
  v_remote_jid TEXT;
  v_msg_type TEXT;
  v_msg_content TEXT;
  v_msg_data JSONB;
  v_evolution_id TEXT;
  v_caption TEXT;
  v_url TEXT;
  v_url_match RECORD;
  v_payload JSONB;
  v_is_inbound BOOLEAN;
BEGIN
  -- Só processa inbound/outbound (skip "open-chat")
  IF NEW.direction NOT IN ('inbound', 'outbound') THEN
    NEW.processed := TRUE;
    UPDATE public.connector_log SET processed = TRUE WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  v_is_inbound := NEW.direction = 'inbound';

  -- 1) Normaliza telefone e tenta encontrar contato
  v_phone_clean := regexp_replace(COALESCE(NEW.whatsapp_number, ''), '\D', '', 'g');
  IF v_phone_clean = '' THEN
    UPDATE public.connector_log SET parse_error = 'empty phone' WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- Variantes do telefone para casamento (com/sem 55, com/sem 9 móvel)
  v_phone_variants := ARRAY[
    v_phone_clean,
    CASE WHEN v_phone_clean ~ '^55' THEN substring(v_phone_clean from 3) ELSE '55' || v_phone_clean END,
    CASE WHEN length(v_phone_clean) = 13 AND substring(v_phone_clean from 5 for 1) = '9' THEN substring(v_phone_clean from 1 for 4) || substring(v_phone_clean from 6) ELSE v_phone_clean END
  ];

  -- Tenta resolver contact via contact_phones
  SELECT cp.contact_id, c.company_id INTO v_contact_id, v_company_id
  FROM public.contact_phones cp
  JOIN public.contacts c ON c.id = cp.contact_id
  WHERE regexp_replace(cp.phone, '\D', '', 'g') = ANY(v_phone_variants)
    AND c.deleted_at IS NULL
  LIMIT 1;

  -- Se não achou contact, cria contato órfão (zapp_unknown_*)
  IF v_contact_id IS NULL THEN
    -- Tenta achar um user_id default (primeiro profile ativo)
    DECLARE v_default_user_id UUID;
    BEGIN
      SELECT id INTO v_default_user_id FROM public.profiles WHERE is_active = TRUE ORDER BY created_at LIMIT 1;
      IF v_default_user_id IS NULL THEN
        SELECT id INTO v_default_user_id FROM public.profiles ORDER BY created_at LIMIT 1;
      END IF;

      INSERT INTO public.contacts (
        user_id, first_name, last_name,
        tags_array, source, notes
      ) VALUES (
        v_default_user_id,
        COALESCE(NEW.push_name, v_phone_clean),
        '',
        ARRAY['_zapp_auto_created','whatsapp'],
        'whatsapp'::data_source,
        'Criado automaticamente pelo zapp_history em ' || NOW()::text || E'\nTelefone: ' || v_phone_clean
      ) RETURNING id INTO v_contact_id;

      -- Cria contact_phone associado
      BEGIN
        INSERT INTO public.contact_phones (contact_id, phone, phone_type)
        VALUES (v_contact_id, v_phone_clean, 'mobile');
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END;
  END IF;

  -- 2) Garante a whatsapp_connection (instance default 'wpp2' do connector v5)
  SELECT id INTO v_conn_id
  FROM zapp_history.whatsapp_connections
  WHERE instance_name = 'wpp2'
  LIMIT 1;

  IF v_conn_id IS NULL THEN
    INSERT INTO zapp_history.whatsapp_connections (
      instance_name, display_name, status, evolution_base_url
    ) VALUES (
      'wpp2', 'Evolution wpp2 (auto-criado)', 'connected', 'https://evolution.atomicabr.com.br'
    ) RETURNING id INTO v_conn_id;
  END IF;

  -- 3) Cria/recupera conversation
  v_remote_jid := v_phone_clean || '@s.whatsapp.net';

  SELECT id INTO v_conv_id
  FROM zapp_history.conversations
  WHERE contact_id = v_contact_id
    AND whatsapp_connection_id = v_conn_id
    AND remote_jid = v_remote_jid
  LIMIT 1;

  IF v_conv_id IS NULL THEN
    INSERT INTO zapp_history.conversations (
      contact_id, company_id, whatsapp_connection_id, remote_jid, status
    ) VALUES (
      v_contact_id, v_company_id, v_conn_id, v_remote_jid, 'open'
    ) RETURNING id INTO v_conv_id;
  END IF;

  -- 4) Detecta tipo de mensagem do payload (raw_payload se existir, senão message_text)
  v_payload := NEW.raw_payload;
  v_msg_data := COALESCE(v_payload->'data'->'message', '{}'::jsonb);
  v_evolution_id := v_payload->'data'->'key'->>'id';

  IF v_msg_data ? 'audioMessage' THEN
    v_msg_type := 'audio';
    v_msg_content := NULL;
  ELSIF v_msg_data ? 'imageMessage' THEN
    v_msg_type := 'image';
    v_caption := v_msg_data->'imageMessage'->>'caption';
    v_msg_content := v_caption;
  ELSIF v_msg_data ? 'videoMessage' THEN
    v_msg_type := 'video';
    v_caption := v_msg_data->'videoMessage'->>'caption';
    v_msg_content := v_caption;
  ELSIF v_msg_data ? 'documentMessage' THEN
    v_msg_type := 'document';
    v_caption := v_msg_data->'documentMessage'->>'fileName';
    v_msg_content := v_caption;
  ELSIF v_msg_data ? 'stickerMessage' THEN
    v_msg_type := 'sticker';
    v_msg_content := NULL;
  ELSIF v_msg_data ? 'locationMessage' THEN
    v_msg_type := 'location';
    v_msg_content := '[localização]';
  ELSIF v_msg_data ? 'contactMessage' THEN
    v_msg_type := 'contact';
    v_msg_content := v_msg_data->'contactMessage'->>'displayName';
  ELSIF v_msg_data ? 'conversation' THEN
    v_msg_type := 'text';
    v_msg_content := v_msg_data->>'conversation';
  ELSIF v_msg_data ? 'extendedTextMessage' THEN
    v_msg_type := 'text';
    v_msg_content := v_msg_data->'extendedTextMessage'->>'text';
  ELSE
    -- Fallback: usa message_text do log
    v_msg_type := 'text';
    v_msg_content := NEW.message_text;
  END IF;

  -- 5) Insere a mensagem
  INSERT INTO zapp_history.messages (
    conversation_id, contact_id, company_id,
    direction, message_type, content,
    whatsapp_message_id, evolution_message_id,
    from_me, raw_payload
  ) VALUES (
    v_conv_id, v_contact_id, v_company_id,
    NEW.direction, v_msg_type, v_msg_content,
    v_evolution_id,
    v_evolution_id,
    NOT v_is_inbound,
    v_payload
  )
  ON CONFLICT (whatsapp_message_id) DO NOTHING
  RETURNING id INTO v_msg_id;

  -- Se conflict (mensagem duplicada), pega o ID existente
  IF v_msg_id IS NULL THEN
    SELECT id INTO v_msg_id
    FROM zapp_history.messages
    WHERE whatsapp_message_id = v_evolution_id;

    NEW.processed := TRUE;
    NEW.zapp_message_id := v_msg_id;
    UPDATE public.connector_log SET processed = TRUE, zapp_message_id = v_msg_id WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- 6) Cria stub em message_media OU message_audio se aplicável
  IF v_msg_type IN ('image','video','document','sticker') THEN
    INSERT INTO zapp_history.message_media (
      message_id, media_type, storage_path, caption,
      mime_type, file_size_bytes, width, height, duration_seconds, file_name,
      whatsapp_media_id, evolution_message_id, download_status
    ) VALUES (
      v_msg_id, v_msg_type, 'PENDING', v_caption,
      CASE
        WHEN v_msg_type = 'image' THEN v_msg_data->'imageMessage'->>'mimetype'
        WHEN v_msg_type = 'video' THEN v_msg_data->'videoMessage'->>'mimetype'
        WHEN v_msg_type = 'document' THEN v_msg_data->'documentMessage'->>'mimetype'
        WHEN v_msg_type = 'sticker' THEN v_msg_data->'stickerMessage'->>'mimetype'
      END,
      CASE
        WHEN v_msg_type = 'image' THEN (v_msg_data->'imageMessage'->>'fileLength')::BIGINT
        WHEN v_msg_type = 'video' THEN (v_msg_data->'videoMessage'->>'fileLength')::BIGINT
        WHEN v_msg_type = 'document' THEN (v_msg_data->'documentMessage'->>'fileLength')::BIGINT
        WHEN v_msg_type = 'sticker' THEN (v_msg_data->'stickerMessage'->>'fileLength')::BIGINT
      END,
      CASE WHEN v_msg_type IN ('image','video') THEN (v_msg_data->v_msg_type||'Message'->>'width')::INT END,
      CASE WHEN v_msg_type IN ('image','video') THEN (v_msg_data->v_msg_type||'Message'->>'height')::INT END,
      CASE WHEN v_msg_type = 'video' THEN (v_msg_data->'videoMessage'->>'seconds')::INT END,
      CASE WHEN v_msg_type = 'document' THEN v_msg_data->'documentMessage'->>'fileName' END,
      v_evolution_id, v_evolution_id, 'pending'
    );
  END IF;

  IF v_msg_type = 'audio' THEN
    INSERT INTO zapp_history.message_audio (
      message_id, storage_path, mime_type, file_size_bytes, duration_seconds,
      speaker, transcription_status
    ) VALUES (
      v_msg_id, 'PENDING',
      v_msg_data->'audioMessage'->>'mimetype',
      (v_msg_data->'audioMessage'->>'fileLength')::BIGINT,
      (v_msg_data->'audioMessage'->>'seconds')::NUMERIC,
      CASE WHEN v_is_inbound THEN 'contact' ELSE 'agent' END,
      'pending'
    );
  END IF;

  -- 7) Extrai URLs do texto (regex simples) e popula message_links
  IF v_msg_content IS NOT NULL THEN
    FOR v_url_match IN
      SELECT (regexp_matches(v_msg_content, 'https?://[^\s<>"'']+', 'g'))[1] AS url
    LOOP
      BEGIN
        INSERT INTO zapp_history.message_links (
          message_id, url, domain, scheme, path, fetch_status
        ) VALUES (
          v_msg_id,
          v_url_match.url,
          (regexp_match(v_url_match.url, 'https?://([^/]+)'))[1],
          (regexp_match(v_url_match.url, '^(https?)'))[1],
          COALESCE((regexp_match(v_url_match.url, 'https?://[^/]+(/.*)$'))[1], '/'),
          'pending'
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;

  -- 8) Marca como processado
  NEW.processed := TRUE;
  NEW.zapp_message_id := v_msg_id;
  UPDATE public.connector_log
  SET processed = TRUE, zapp_message_id = v_msg_id, parse_error = NULL
  WHERE id = NEW.id;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.connector_log SET parse_error = SQLERRM WHERE id = NEW.id;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_parse_connector_log ON public.connector_log;
CREATE TRIGGER trg_parse_connector_log
  AFTER INSERT ON public.connector_log
  FOR EACH ROW EXECUTE FUNCTION zapp_history.parse_connector_log_to_messages();

COMMENT ON FUNCTION zapp_history.parse_connector_log_to_messages IS
  'Bridge entre o webhook evolution-bitrix-connector existente e o schema zapp_history. Sem deploy de edge function: tudo via trigger SQL no INSERT em connector_log.';
