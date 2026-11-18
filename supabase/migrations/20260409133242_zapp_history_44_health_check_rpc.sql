-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133242
-- nome:   zapp_history_44_health_check_rpc

-- ============================================================================
-- MELHORIA 44: health_check RPC — diagnóstico completo do pipeline em 1 chamada
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'timestamp', NOW(),
    'extensions', jsonb_build_object(
      'pgvector', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector'),
      'pg_cron', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'),
      'pg_net', EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net')
    ),
    'guc_configured', jsonb_build_object(
      'service_role_key_set', current_setting('app.service_role_key', true) IS NOT NULL
        AND current_setting('app.service_role_key', true) <> '',
      'functions_base_url_set', current_setting('app.functions_base_url', true) IS NOT NULL
        AND current_setting('app.functions_base_url', true) <> ''
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
    'cron_jobs', (SELECT jsonb_agg(jsonb_build_object(
      'name', jobname, 'schedule', schedule, 'active', active
    )) FROM cron.job WHERE jobname LIKE 'zapp-%'),
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
    'integrations', jsonb_build_object(
      'media_pipeline_deployed', EXISTS (SELECT 1 FROM storage.buckets WHERE id IS NOT NULL LIMIT 1),
      'embedding_configs_count', (SELECT COUNT(*) FROM public.embedding_configs WHERE task LIKE 'zapp_history%')
    )
  ) INTO v_result;

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.health_check() TO authenticated, service_role;

COMMENT ON FUNCTION zapp_history.health_check IS
  'Snapshot completo do pipeline: extensions, GUC, contagens, pendências, cron, últimos 24h.';
