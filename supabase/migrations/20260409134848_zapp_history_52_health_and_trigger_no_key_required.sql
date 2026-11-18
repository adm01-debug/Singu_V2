-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409134848
-- nome:   zapp_history_52_health_and_trigger_no_key_required

-- Trigger auto_embed: dispara sempre, sem checar key
CREATE OR REPLACE FUNCTION zapp_history.trg_auto_request_embedding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_req_id BIGINT;
BEGIN
  IF NEW.message_type <> 'text' OR NEW.content IS NULL OR length(NEW.content) < 10 THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_req_id := zapp_history.request_embedding(
      jsonb_build_array(NEW.content), 'qwen3-embedding-8b', 'retrieval.passage'
    );
    INSERT INTO zapp_history.async_request_log (
      request_kind, entity_type, entity_id, pg_net_request_id, payload_preview, status
    ) VALUES (
      'embedding', 'messages', NEW.id, v_req_id, left(NEW.content, 100), 'dispatched'
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

-- health_check v3: GREEN se base_url está setada
CREATE OR REPLACE FUNCTION zapp_history.health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
  v_url TEXT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');

  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'overall_status', CASE WHEN v_url IS NOT NULL THEN 'GREEN' ELSE 'RED' END,
    'extensions', jsonb_build_object(
      'pgvector', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector'),
      'pg_cron', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'),
      'pg_net', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    ),
    'config', jsonb_build_object(
      'functions_base_url', v_url,
      'auth_required', FALSE,
      'auth_note', 'Edge functions deste projeto têm verify_jwt=false. pg_net chama sem credenciais.'
    ),
    'tables', jsonb_build_object(
      'whatsapp_connections', (SELECT COUNT(*) FROM zapp_history.whatsapp_connections),
      'conversations', (SELECT COUNT(*) FROM zapp_history.conversations),
      'messages', (SELECT COUNT(*) FROM zapp_history.messages),
      'message_media', (SELECT COUNT(*) FROM zapp_history.message_media),
      'message_audio', (SELECT COUNT(*) FROM zapp_history.message_audio),
      'message_links', (SELECT COUNT(*) FROM zapp_history.message_links),
      'connector_log_total', (SELECT COUNT(*) FROM public.connector_log),
      'connector_log_processed', (SELECT COUNT(*) FROM public.connector_log WHERE processed = TRUE),
      'connector_log_with_errors', (SELECT COUNT(*) FROM public.connector_log WHERE parse_error IS NOT NULL),
      'phone_to_contact', (SELECT COUNT(*) FROM zapp_history.phone_to_contact),
      'admin_grants', (SELECT COUNT(*) FROM zapp_history.admin_grants),
      'async_request_log', (SELECT COUNT(*) FROM zapp_history.async_request_log)
    ),
    'pending', (SELECT jsonb_object_agg(pipeline, jsonb_build_object('pending', pending, 'stuck', stuck))
                FROM zapp_history.v_pipeline_pending),
    'cron_jobs_active', (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE 'zapp-%' AND active = TRUE),
    'last_24h', jsonb_build_object(
      'connector_logs_received', (SELECT COUNT(*) FROM public.connector_log WHERE created_at > NOW() - INTERVAL '24 hours'),
      'messages_inserted', (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at > NOW() - INTERVAL '24 hours'),
      'embeddings_dispatched', (SELECT COUNT(*) FROM zapp_history.async_request_log WHERE triggered_at > NOW() - INTERVAL '24 hours' AND request_kind = 'embedding' AND status = 'dispatched')
    ),
    'next_actions', CASE
      WHEN v_url IS NULL THEN jsonb_build_array('functions_base_url não setada')
      ELSE jsonb_build_array('✅ Pipeline operacional. Aguardando primeira mensagem real.')
    END
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;
