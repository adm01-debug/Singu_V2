-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133917
-- nome:   zapp_history_49_auto_invoke_triggers

-- ============================================================================
-- MELHORIA 49: Triggers que disparam transcrição e embedding automaticamente
-- via pg_net (fire-and-forget). Eles só executam quando runtime_config estiver
-- configurada com service_role_key — senão simplesmente no-op silencioso.
-- ============================================================================

-- Tabela de log de requests async pra debug
CREATE TABLE IF NOT EXISTS zapp_history.async_request_log (
  id BIGSERIAL PRIMARY KEY,
  request_kind TEXT NOT NULL,           -- 'transcription' | 'embedding' | 'classify'
  entity_type TEXT NOT NULL,            -- 'message_audio' | 'messages' | 'summary'
  entity_id UUID NOT NULL,
  pg_net_request_id BIGINT,
  payload_preview TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'dispatched'      -- dispatched | skipped_no_config | error
);

CREATE INDEX IF NOT EXISTS idx_arl_entity ON zapp_history.async_request_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_arl_kind_time ON zapp_history.async_request_log(request_kind, triggered_at DESC);

ALTER TABLE zapp_history.async_request_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY arl_service_all ON zapp_history.async_request_log
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY arl_admin_read ON zapp_history.async_request_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid()));

-- ============================================================================
-- Trigger function: quando text message é inserida com content, pede embedding
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.trg_auto_request_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_key TEXT;
  v_url TEXT;
  v_req_id BIGINT;
BEGIN
  -- Só processa text com content suficiente
  IF NEW.message_type <> 'text' OR NEW.content IS NULL OR length(NEW.content) < 10 THEN
    RETURN NEW;
  END IF;

  v_url := zapp_history.get_config('functions_base_url');
  v_key := zapp_history.get_config('service_role_key');

  -- Sem config = no-op silencioso, mas loga skip
  IF v_url IS NULL OR v_key IS NULL THEN
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'embedding', 'messages', NEW.id,
      left(NEW.content, 100), 'skipped_no_config'
    );
    RETURN NEW;
  END IF;

  -- Dispara pg_net
  BEGIN
    v_req_id := zapp_history.request_embedding(
      jsonb_build_array(NEW.content),
      'qwen3-embedding-8b',
      'retrieval.passage'
    );
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, pg_net_request_id, payload_preview, status
    ) VALUES (
      'embedding', 'messages', NEW.id, v_req_id,
      left(NEW.content, 100), 'dispatched'
    );
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, payload_preview, status
    ) VALUES (
      'embedding', 'messages', NEW.id, left(NEW.content, 100), 'error: ' || SQLERRM
    );
  END;

  RETURN NEW;
END;
$fn$;

-- ============================================================================
-- Trigger function: quando message_audio é inserido pending, enfileira no log
-- (a transcrição real requer download do storage_path primeiro, então só loga)
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.trg_auto_enqueue_transcription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
BEGIN
  -- Apenas marca a request no log — download+transcribe é job do cron
  IF NEW.transcription_status = 'pending' THEN
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, status,
      payload_preview
    ) VALUES (
      'transcription', 'message_audio', NEW.message_id, 'enqueued',
      'duration=' || COALESCE(NEW.duration_seconds::text, 'null') ||
      's mime=' || COALESCE(NEW.mime_type, 'null')
    );
  END IF;
  RETURN NEW;
END;
$fn$;

-- Cria os triggers
DROP TRIGGER IF EXISTS trg_auto_embed_message ON zapp_history.messages;
CREATE TRIGGER trg_auto_embed_message
  AFTER INSERT ON zapp_history.messages
  FOR EACH ROW
  EXECUTE FUNCTION zapp_history.trg_auto_request_embedding();

DROP TRIGGER IF EXISTS trg_auto_enqueue_audio ON zapp_history.message_audio;
CREATE TRIGGER trg_auto_enqueue_audio
  AFTER INSERT ON zapp_history.message_audio
  FOR EACH ROW
  EXECUTE FUNCTION zapp_history.trg_auto_enqueue_transcription();

COMMENT ON FUNCTION zapp_history.trg_auto_request_embedding IS
  'Dispara rag-embed-v2 via pg_net quando mensagem de texto é inserida. No-op silencioso se runtime_config não estiver setada.';

COMMENT ON FUNCTION zapp_history.trg_auto_enqueue_transcription IS
  'Registra áudio no async_request_log quando pending. A transcrição efetiva (download + Whisper) é feita pelo cron zapp-process-pending-media.';
