-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408205750
-- nome:   zapp_history_34_phone_lookup_atomic

-- ============================================================================
-- MELHORIA 34: Tabela atômica phone → contact resolve race condition do trigger
-- e melhora regex de URL pra remover trailing punctuation
-- ============================================================================

CREATE TABLE IF NOT EXISTS zapp_history.phone_to_contact (
  phone_normalized TEXT PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT DEFAULT 'auto'
);

CREATE INDEX IF NOT EXISTS idx_ptc_contact ON zapp_history.phone_to_contact(contact_id);
ALTER TABLE zapp_history.phone_to_contact ENABLE ROW LEVEL SECURITY;
CREATE POLICY ptc_service_all ON zapp_history.phone_to_contact
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Pré-popula com dados existentes em contact_phones (faz um sync inicial)
INSERT INTO zapp_history.phone_to_contact (phone_normalized, contact_id, source)
SELECT
  regexp_replace(COALESCE(numero_normalizado, numero, numero_e164, ''), '\D', '', 'g') AS phone_normalized,
  contact_id,
  'contact_phones_sync'
FROM public.contact_phones cp
JOIN public.contacts c ON c.id = cp.contact_id
WHERE c.deleted_at IS NULL
  AND COALESCE(cp.numero_normalizado, cp.numero, cp.numero_e164) IS NOT NULL
  AND length(regexp_replace(COALESCE(numero_normalizado, numero, numero_e164, ''), '\D', '', 'g')) >= 8
ON CONFLICT (phone_normalized) DO NOTHING;

-- ============================================================================
-- Trigger atualizado: usa phone_to_contact ATOMICO
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.parse_connector_log_to_messages()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_phone_clean TEXT;
  v_phone_e164 TEXT;
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
  v_url_match RECORD;
  v_url_clean TEXT;
  v_payload JSONB;
  v_is_inbound BOOLEAN;
  v_default_user_id UUID;
BEGIN
  IF NEW.direction NOT IN ('inbound', 'outbound') THEN
    UPDATE public.connector_log SET processed = TRUE WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  v_is_inbound := NEW.direction = 'inbound';
  v_phone_clean := regexp_replace(COALESCE(NEW.whatsapp_number, ''), '\D', '', 'g');
  IF v_phone_clean = '' THEN
    UPDATE public.connector_log SET parse_error = 'empty phone' WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- ============ ATOMIC LOOKUP via phone_to_contact ============
  -- 1) Tenta achar no lookup atômico (resolve Halloween problem)
  SELECT contact_id INTO v_contact_id
  FROM zapp_history.phone_to_contact
  WHERE phone_normalized = v_phone_clean;

  -- 2) Se não achou, tenta variantes em contact_phones (dados pré-existentes)
  IF v_contact_id IS NULL THEN
    v_phone_e164 := '+' || v_phone_clean;
    v_phone_variants := ARRAY[
      v_phone_clean, v_phone_e164,
      CASE WHEN v_phone_clean ~ '^55' THEN substring(v_phone_clean from 3) ELSE '55' || v_phone_clean END,
      CASE WHEN length(v_phone_clean) = 13 AND substring(v_phone_clean from 5 for 1) = '9'
        THEN substring(v_phone_clean from 1 for 4) || substring(v_phone_clean from 6) ELSE v_phone_clean END
    ];

    SELECT cp.contact_id, c.company_id INTO v_contact_id, v_company_id
    FROM public.contact_phones cp
    JOIN public.contacts c ON c.id = cp.contact_id
    WHERE (
      regexp_replace(COALESCE(cp.numero_normalizado, ''), '\D', '', 'g') = ANY(v_phone_variants)
      OR regexp_replace(COALESCE(cp.numero_e164, ''), '\D', '', 'g') = ANY(v_phone_variants)
      OR regexp_replace(COALESCE(cp.numero, ''), '\D', '', 'g') = ANY(v_phone_variants)
    )
    AND c.deleted_at IS NULL
    ORDER BY cp.is_primary DESC NULLS LAST, cp.confiabilidade DESC NULLS LAST
    LIMIT 1;
  END IF;

  -- 3) Cria contato se ainda não achou
  IF v_contact_id IS NULL THEN
    SELECT id INTO v_default_user_id FROM public.profiles WHERE is_active = TRUE ORDER BY created_at LIMIT 1;
    IF v_default_user_id IS NULL THEN
      SELECT id INTO v_default_user_id FROM public.profiles ORDER BY created_at LIMIT 1;
    END IF;

    INSERT INTO public.contacts (
      user_id, first_name, last_name, tags_array, source, notes
    ) VALUES (
      v_default_user_id,
      COALESCE(NEW.push_name, v_phone_clean), '',
      ARRAY['_zapp_auto_created','whatsapp'],
      'WHATSAPP'::data_source,
      'Criado automaticamente em ' || NOW()::text || E'\nTelefone: ' || v_phone_clean
    ) RETURNING id INTO v_contact_id;

    BEGIN
      INSERT INTO public.contact_phones (
        contact_id, numero, numero_normalizado, numero_e164,
        phone_type, is_primary, is_whatsapp, fonte
      ) VALUES (
        v_contact_id, v_phone_clean, v_phone_clean, '+' || v_phone_clean,
        'celular', TRUE, TRUE, 'zapp_history_auto'
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  -- 4) ATOMIC: registra no lookup com ON CONFLICT
  INSERT INTO zapp_history.phone_to_contact (phone_normalized, contact_id, source)
  VALUES (v_phone_clean, v_contact_id, 'connector_log')
  ON CONFLICT (phone_normalized) DO UPDATE SET contact_id = zapp_history.phone_to_contact.contact_id
  RETURNING contact_id INTO v_contact_id;

  -- whatsapp_connection (ON CONFLICT atômico)
  INSERT INTO zapp_history.whatsapp_connections (instance_name, display_name, status, evolution_base_url)
  VALUES ('wpp2', 'Evolution wpp2 (auto)', 'connected', 'https://evolution.atomicabr.com.br')
  ON CONFLICT (instance_name) DO UPDATE SET instance_name = EXCLUDED.instance_name
  RETURNING id INTO v_conn_id;

  -- conversation (ON CONFLICT atômico)
  v_remote_jid := v_phone_clean || '@s.whatsapp.net';
  INSERT INTO zapp_history.conversations (contact_id, company_id, whatsapp_connection_id, remote_jid, status)
  VALUES (v_contact_id, v_company_id, v_conn_id, v_remote_jid, 'open')
  ON CONFLICT (contact_id, whatsapp_connection_id, remote_jid) DO UPDATE
    SET status = zapp_history.conversations.status
  RETURNING id INTO v_conv_id;

  -- Detecta tipo de mensagem
  v_payload := NEW.raw_payload;
  v_msg_data := COALESCE(v_payload->'data'->'message', '{}'::jsonb);
  v_evolution_id := v_payload->'data'->'key'->>'id';

  IF v_msg_data ? 'audioMessage' THEN v_msg_type := 'audio'; v_msg_content := NULL;
  ELSIF v_msg_data ? 'imageMessage' THEN v_msg_type := 'image'; v_caption := v_msg_data->'imageMessage'->>'caption'; v_msg_content := v_caption;
  ELSIF v_msg_data ? 'videoMessage' THEN v_msg_type := 'video'; v_caption := v_msg_data->'videoMessage'->>'caption'; v_msg_content := v_caption;
  ELSIF v_msg_data ? 'documentMessage' THEN v_msg_type := 'document'; v_caption := v_msg_data->'documentMessage'->>'fileName'; v_msg_content := v_caption;
  ELSIF v_msg_data ? 'stickerMessage' THEN v_msg_type := 'sticker'; v_msg_content := NULL;
  ELSIF v_msg_data ? 'locationMessage' THEN v_msg_type := 'location'; v_msg_content := '[localização]';
  ELSIF v_msg_data ? 'contactMessage' THEN v_msg_type := 'contact'; v_msg_content := v_msg_data->'contactMessage'->>'displayName';
  ELSIF v_msg_data ? 'conversation' THEN v_msg_type := 'text'; v_msg_content := v_msg_data->>'conversation';
  ELSIF v_msg_data ? 'extendedTextMessage' THEN v_msg_type := 'text'; v_msg_content := v_msg_data->'extendedTextMessage'->>'text';
  ELSE v_msg_type := 'text'; v_msg_content := NEW.message_text;
  END IF;

  INSERT INTO zapp_history.messages (
    conversation_id, contact_id, company_id, direction, message_type, content,
    whatsapp_message_id, evolution_message_id, from_me, raw_payload
  ) VALUES (
    v_conv_id, v_contact_id, v_company_id, NEW.direction, v_msg_type, v_msg_content,
    v_evolution_id, v_evolution_id, NOT v_is_inbound, v_payload
  )
  ON CONFLICT (whatsapp_message_id) DO NOTHING
  RETURNING id INTO v_msg_id;

  IF v_msg_id IS NULL THEN
    SELECT id INTO v_msg_id FROM zapp_history.messages WHERE whatsapp_message_id = v_evolution_id;
    UPDATE public.connector_log SET processed = TRUE, zapp_message_id = v_msg_id WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  IF v_msg_type IN ('image','video','document','sticker') THEN
    INSERT INTO zapp_history.message_media (
      message_id, media_type, storage_path, caption, mime_type, file_size_bytes,
      width, height, duration_seconds, file_name,
      whatsapp_media_id, evolution_message_id, download_status
    ) VALUES (
      v_msg_id, v_msg_type, 'PENDING', v_caption,
      v_msg_data->(v_msg_type||'Message')->>'mimetype',
      NULLIF(v_msg_data->(v_msg_type||'Message')->>'fileLength','')::BIGINT,
      NULLIF(v_msg_data->(v_msg_type||'Message')->>'width','')::INT,
      NULLIF(v_msg_data->(v_msg_type||'Message')->>'height','')::INT,
      NULLIF(v_msg_data->(v_msg_type||'Message')->>'seconds','')::INT,
      v_msg_data->(v_msg_type||'Message')->>'fileName',
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
      NULLIF(v_msg_data->'audioMessage'->>'fileLength','')::BIGINT,
      NULLIF(v_msg_data->'audioMessage'->>'seconds','')::NUMERIC,
      CASE WHEN v_is_inbound THEN 'contact' ELSE 'agent' END,
      'pending'
    );
  END IF;

  -- URLs com regex que tira trailing punctuation
  IF v_msg_content IS NOT NULL THEN
    FOR v_url_match IN
      SELECT (regexp_matches(v_msg_content, 'https?://[^\s<>"'']+', 'g'))[1] AS url
    LOOP
      -- Remove pontuação trailing comum: . , ; : ! ? ) ] }
      v_url_clean := regexp_replace(v_url_match.url, '[\.,;:!?\)\]\}]+$', '');
      BEGIN
        INSERT INTO zapp_history.message_links (message_id, url, domain, scheme, path, fetch_status)
        VALUES (
          v_msg_id, v_url_clean,
          (regexp_match(v_url_clean, 'https?://([^/]+)'))[1],
          (regexp_match(v_url_clean, '^(https?)'))[1],
          COALESCE((regexp_match(v_url_clean, 'https?://[^/]+(/.*)$'))[1], '/'),
          'pending'
        );
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END IF;

  UPDATE public.connector_log SET processed = TRUE, zapp_message_id = v_msg_id, parse_error = NULL WHERE id = NEW.id;
  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  UPDATE public.connector_log SET parse_error = SQLERRM WHERE id = NEW.id;
  RETURN NEW;
END;
$fn$;
