-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408200316
-- nome:   zapp_history_10_pg_cron_jobs

-- ============================================================================
-- pg_cron helper + 6 jobs agendados
--
-- IMPORTANTE: antes do primeiro run, configurar GUC manualmente:
--   ALTER DATABASE postgres SET app.service_role_key = 'eyJ...';
--   ALTER DATABASE postgres SET app.functions_base_url = 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1';
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.invoke_edge_function(
  p_function_name TEXT,
  p_body JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $fn$
DECLARE
  v_url TEXT;
  v_key TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := current_setting('app.functions_base_url', true) || '/' || p_function_name;
  v_key := current_setting('app.service_role_key', true);

  IF v_url IS NULL OR v_key IS NULL OR v_url = '/' || p_function_name THEN
    RAISE WARNING 'app.functions_base_url and app.service_role_key must be set via ALTER DATABASE before cron jobs work';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := p_body,
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$fn$;

-- Unschedule idempotente
DO $$
DECLARE j TEXT;
BEGIN
  FOR j IN SELECT unnest(ARRAY[
    'zapp-generate-daily-summaries',
    'zapp-process-pending-media',
    'zapp-embed-pending-messages',
    'zapp-curate-training-dataset',
    'zapp-cleanup-expired-media',
    'zapp-sync-pending-summaries'
  ]) LOOP
    BEGIN
      PERFORM cron.unschedule(j);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END$$;

-- Job 1: Sumário diário às 23:00 BRT (02:00 UTC do dia seguinte)
SELECT cron.schedule(
  'zapp-generate-daily-summaries',
  '0 2 * * *',
  $cmd$SELECT zapp_history.invoke_edge_function('generate-daily-summary', jsonb_build_object('date', (CURRENT_DATE - INTERVAL '1 day')::date::text));$cmd$
);

-- Job 2: Mídia/áudio/links pendentes a cada 15 min
SELECT cron.schedule(
  'zapp-process-pending-media',
  '*/15 * * * *',
  $cmd$SELECT zapp_history.invoke_edge_function('process-pending-media');$cmd$
);

-- Job 3: Embeddings em batch a cada 30 min
SELECT cron.schedule(
  'zapp-embed-pending-messages',
  '*/30 * * * *',
  $cmd$SELECT zapp_history.invoke_edge_function('embed-message');$cmd$
);

-- Job 4: Curadoria de dataset de treino (domingo 04h UTC)
SELECT cron.schedule(
  'zapp-curate-training-dataset',
  '0 4 * * 0',
  $cmd$SELECT zapp_history.invoke_edge_function('curate-training-dataset');$cmd$
);

-- Job 5: Cleanup de mídia expirada (diário 05h UTC)
SELECT cron.schedule(
  'zapp-cleanup-expired-media',
  '0 5 * * *',
  $cmd$UPDATE zapp_history.message_media SET download_status = 'expired' WHERE download_status = 'failed' AND download_attempts >= 5 AND created_at < NOW() - INTERVAL '7 days';$cmd$
);

-- Job 6: Retry de sumários não sincronizados com interactions (a cada hora)
SELECT cron.schedule(
  'zapp-sync-pending-summaries',
  '30 * * * *',
  $cmd$SELECT zapp_history.sync_summary_to_interaction(id) FROM zapp_history.conversation_daily_summaries WHERE synced_to_interactions = FALSE AND created_at > NOW() - INTERVAL '7 days' LIMIT 100;$cmd$
);
