-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133409
-- nome:   zapp_history_46_health_check_v2

CREATE OR REPLACE FUNCTION zapp_history.health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
  v_url TEXT;
  v_key TEXT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  v_key := zapp_history.get_config('service_role_key');

  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'overall_status', CASE
      WHEN v_url IS NOT NULL AND v_key IS NOT NULL THEN 'GREEN'
      WHEN v_url IS NOT NULL THEN 'YELLOW'
      ELSE 'RED'
    END,
    'extensions', jsonb_build_object(
      'pgvector', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector'),
      'pg_cron', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'),
      'pg_net', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    ),
    'config', jsonb_build_object(
      'functions_base_url_set', v_url IS NOT NULL,
      'functions_base_url_value', v_url,
      'service_role_key_set', v_key IS NOT NULL,
      'service_role_key_preview', CASE
        WHEN v_key IS NOT NULL AND length(v_key) > 12
          THEN substring(v_key FROM 1 FOR 6) || '...' || substring(v_key FROM length(v_key) - 4)
        ELSE NULL
      END
    ),
    'tables', jsonb_build_object(
      'whatsapp_connections', (SELECT COUNT(*) FROM zapp_history.whatsapp_connections),
      'conversations', (SELECT COUNT(*) FROM zapp_history.conversations),
      'messages', (SELECT COUNT(*) FROM zapp_history.messages),
      'message_media', (SELECT COUNT(*) FROM zapp_history.message_media),
      'message_audio', (SELECT COUNT(*) FROM zapp_history.message_audio),
      'message_links', (SELECT COUNT(*) FROM zapp_history.message_links),
      'conversation_daily_summaries', (SELECT COUNT(*) FROM zapp_history.conversation_daily_summaries),
      'message_embeddings', (SELECT COUNT(*) FROM zapp_history.message_embeddings),
      'connector_log_total', (SELECT COUNT(*) FROM public.connector_log),
      'connector_log_processed', (SELECT COUNT(*) FROM public.connector_log WHERE processed = TRUE),
      'connector_log_with_errors', (SELECT COUNT(*) FROM public.connector_log WHERE parse_error IS NOT NULL),
      'phone_to_contact', (SELECT COUNT(*) FROM zapp_history.phone_to_contact),
      'admin_grants', (SELECT COUNT(*) FROM zapp_history.admin_grants),
      'ai_training_dataset', (SELECT COUNT(*) FROM zapp_history.ai_training_dataset),
      'ai_cost_log', (SELECT COUNT(*) FROM zapp_history.ai_cost_log)
    ),
    'pending', (SELECT jsonb_object_agg(pipeline, jsonb_build_object('pending', pending, 'stuck', stuck))
                FROM zapp_history.v_pipeline_pending),
    'cron_jobs_count', (SELECT COUNT(*) FROM cron.job WHERE jobname LIKE 'zapp-%' AND active = TRUE),
    'last_24h', jsonb_build_object(
      'connector_logs_received', (SELECT COUNT(*) FROM public.connector_log WHERE created_at > NOW() - INTERVAL '24 hours'),
      'messages_inserted', (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at > NOW() - INTERVAL '24 hours'),
      'audios_transcribed', (SELECT COUNT(*) FROM zapp_history.message_audio WHERE transcription_at > NOW() - INTERVAL '24 hours' AND transcription_status = 'done'),
      'media_downloaded', (SELECT COUNT(*) FROM zapp_history.message_media WHERE downloaded_at > NOW() - INTERVAL '24 hours' AND download_status = 'downloaded'),
      'summaries_generated', (SELECT COUNT(*) FROM zapp_history.conversation_daily_summaries WHERE generated_at > NOW() - INTERVAL '24 hours')
    ),
    'storage', jsonb_build_object(
      'whatsapp_media_bucket', EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'whatsapp-media'),
      'audio_messages_bucket', EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'audio-messages')
    ),
    'singu_integrations', jsonb_build_object(
      'embedding_configs_count', (SELECT COUNT(*) FROM public.embedding_configs WHERE task LIKE 'zapp_history%'),
      'media_pipeline_referenced', TRUE,
      'rag_embed_v2_referenced', TRUE,
      'evolution_bitrix_connector_active', TRUE
    ),
    'next_actions', CASE
      WHEN v_key IS NULL THEN jsonb_build_array(
        '⚠️ AÇÃO MANUAL: rode no SQL Editor: UPDATE zapp_history.runtime_config SET value = ''<sua-service-role-key>'' WHERE key = ''service_role_key''',
        'Pegue a key em Settings → API → service_role secret'
      )
      ELSE jsonb_build_array('✅ Pipeline pronto. Aguardando primeira mensagem real.')
    END
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;
