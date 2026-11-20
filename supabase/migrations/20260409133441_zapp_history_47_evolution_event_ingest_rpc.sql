-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133441
-- nome:   zapp_history_47_evolution_event_ingest_rpc

-- ============================================================================
-- MELHORIA 47: ingest_evolution_event — RPC que recebe payload Evolution cru
-- e roda o pipeline inteiro. Substitui (parcialmente) a edge function.
-- Pode ser chamada via REST PostgREST: POST /rpc/ingest_evolution_event
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.ingest_evolution_event(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_event TEXT;
  v_data JSONB;
  v_key JSONB;
  v_remote_jid TEXT;
  v_from_me BOOLEAN;
  v_phone TEXT;
  v_push_name TEXT;
  v_message_id TEXT;
  v_msg JSONB;
  v_message_text TEXT;
  v_direction TEXT;
  v_log_id BIGINT;
  v_zapp_msg_id UUID;
BEGIN
  v_event := p_payload->>'event';
  v_data := p_payload->'data';
  v_key := v_data->'key';

  -- Skip eventos não suportados
  IF v_event IS NOT NULL AND v_event NOT IN ('messages.upsert', 'send.message') THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'event_type', 'event', v_event);
  END IF;

  -- Extrai phone do remoteJid
  v_remote_jid := v_key->>'remoteJid';
  v_from_me := COALESCE((v_key->>'fromMe')::boolean, false);

  IF v_remote_jid IS NULL THEN
    RETURN jsonb_build_object('error', 'missing remoteJid in payload.data.key');
  END IF;

  -- Skip grupos e status
  IF v_remote_jid LIKE '%@g.us' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'group');
  END IF;
  IF v_remote_jid = 'status@broadcast' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'status_broadcast');
  END IF;

  -- Normaliza phone
  v_phone := regexp_replace(
    regexp_replace(v_remote_jid, '@s\.whatsapp\.net$|@lid$|@.*$', ''),
    '\D', '', 'g'
  );

  v_push_name := v_data->>'pushName';
  v_message_id := v_key->>'id';
  v_msg := v_data->'message';

  -- Determina direction
  v_direction := CASE WHEN v_from_me THEN 'outbound' ELSE 'inbound' END;

  -- Extrai message_text resumido (mesma lógica do webhook v5)
  IF v_msg ? 'conversation' THEN
    v_message_text := v_msg->>'conversation';
  ELSIF v_msg ? 'extendedTextMessage' THEN
    v_message_text := v_msg->'extendedTextMessage'->>'text';
  ELSIF v_msg ? 'imageMessage' THEN
    v_message_text := '[foto] ' || COALESCE(v_msg->'imageMessage'->>'caption', '');
  ELSIF v_msg ? 'videoMessage' THEN
    v_message_text := '[video] ' || COALESCE(v_msg->'videoMessage'->>'caption', '');
  ELSIF v_msg ? 'audioMessage' THEN
    v_message_text := '[audio]';
  ELSIF v_msg ? 'documentMessage' THEN
    v_message_text := '[documento] ' || COALESCE(v_msg->'documentMessage'->>'fileName', '');
  ELSIF v_msg ? 'stickerMessage' THEN
    v_message_text := '[figurinha]';
  ELSIF v_msg ? 'locationMessage' THEN
    v_message_text := '[localizacao]';
  ELSIF v_msg ? 'contactMessage' THEN
    v_message_text := '[contato] ' || COALESCE(v_msg->'contactMessage'->>'displayName', '');
  ELSIF v_msg ? 'reactionMessage' THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'reaction');
  ELSE
    v_message_text := '[mensagem nao suportada]';
  END IF;

  -- INSERE no connector_log COM raw_payload completo (trigger faz o resto)
  INSERT INTO public.connector_log (
    direction, whatsapp_number, push_name, message_text, raw_payload
  ) VALUES (
    v_direction, v_phone, v_push_name, v_message_text, p_payload
  )
  RETURNING id INTO v_log_id;

  -- Lê resultado pós-trigger
  SELECT zapp_message_id INTO v_zapp_msg_id FROM public.connector_log WHERE id = v_log_id;

  RETURN jsonb_build_object(
    'ok', TRUE,
    'log_id', v_log_id,
    'zapp_message_id', v_zapp_msg_id,
    'phone', v_phone,
    'direction', v_direction,
    'message_text', v_message_text
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error', SQLERRM, 'state', SQLSTATE);
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.ingest_evolution_event(JSONB) TO authenticated, service_role;

COMMENT ON FUNCTION zapp_history.ingest_evolution_event IS
  'Recebe payload cru da Evolution API e roda o pipeline inteiro. Pode ser chamada via PostgREST RPC: POST /rpc/ingest_evolution_event. Substitui parcialmente a edge function evolution-bitrix-connector quando você quiser ingerir direto.';
