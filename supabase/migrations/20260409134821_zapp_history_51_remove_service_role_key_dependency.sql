-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409134821
-- nome:   zapp_history_51_remove_service_role_key_dependency

-- ============================================================================
-- MELHORIA 51: Remove dependência de service_role_key dos helpers pg_net.
-- Como todas as edge functions têm verify_jwt=false, pg_net chama livremente.
-- ============================================================================

-- Marca service_role_key como "não necessário"
UPDATE zapp_history.runtime_config
SET value = 'NOT_REQUIRED_VERIFY_JWT_FALSE',
    description = 'Não é necessário: todas as edge functions deste projeto têm verify_jwt=false, pg_net chama sem auth',
    is_secret = FALSE,
    updated_at = NOW()
WHERE key = 'service_role_key';

-- Refatora invoke_edge_function: não precisa mais de key
CREATE OR REPLACE FUNCTION zapp_history.invoke_edge_function(
  p_function_name TEXT,
  p_body JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn$
DECLARE
  v_url TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  IF v_url IS NULL THEN
    v_url := 'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1';
  END IF;

  SELECT net.http_post(
    url := v_url || '/' || p_function_name,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := p_body,
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$fn$;

-- request_embedding sem key
CREATE OR REPLACE FUNCTION zapp_history.request_embedding(
  p_texts JSONB,
  p_provider TEXT DEFAULT 'qwen3-embedding-8b',
  p_task TEXT DEFAULT 'retrieval.passage'
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_url TEXT; v_request_id BIGINT;
BEGIN
  v_url := COALESCE(zapp_history.get_config('functions_base_url'),
                    'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1');
  SELECT net.http_post(
    url := v_url || '/rag-embed-v2',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('texts', p_texts, 'provider', p_provider, 'task', p_task),
    timeout_milliseconds := 60000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;

-- request_transcription sem key
CREATE OR REPLACE FUNCTION zapp_history.request_transcription(p_audio_base64 TEXT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_url TEXT; v_request_id BIGINT;
BEGIN
  v_url := COALESCE(zapp_history.get_config('functions_base_url'),
                    'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1');
  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('action', 'transcribe', 'audio_base64', p_audio_base64),
    timeout_milliseconds := 120000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;

-- request_classify sem key
CREATE OR REPLACE FUNCTION zapp_history.request_classify(p_text TEXT, p_labels TEXT[])
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_url TEXT; v_request_id BIGINT;
BEGIN
  v_url := COALESCE(zapp_history.get_config('functions_base_url'),
                    'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1');
  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := jsonb_build_object('action', 'classify', 'text', p_text, 'labels', to_jsonb(p_labels)),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;
