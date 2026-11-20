-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409133339
-- nome:   zapp_history_45b_runtime_config_table

-- ============================================================================
-- MELHORIA 45b: Tabela de runtime config como alternativa ao GUC
-- (resolve o problema "permission denied to set parameter via ALTER DATABASE")
-- ============================================================================

CREATE TABLE IF NOT EXISTS zapp_history.runtime_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID
);

ALTER TABLE zapp_history.runtime_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS rc_service_all ON zapp_history.runtime_config;
CREATE POLICY rc_service_all ON zapp_history.runtime_config
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Admins veem mas valor de secrets é mascarado via view
DROP POLICY IF EXISTS rc_admin_read ON zapp_history.runtime_config;
CREATE POLICY rc_admin_read ON zapp_history.runtime_config
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid())
  );

-- Configura functions_base_url (valor seguro de hardcodar)
INSERT INTO zapp_history.runtime_config (key, value, is_secret, description)
VALUES (
  'functions_base_url',
  'https://pgxfvjmuubtbowutlide.supabase.co/functions/v1',
  FALSE,
  'Base URL das edge functions deste projeto'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- service_role_key fica como placeholder pendente
INSERT INTO zapp_history.runtime_config (key, value, is_secret, description)
VALUES (
  'service_role_key',
  'PENDING_MANUAL_INSERT',
  TRUE,
  'Service role key — popular MANUALMENTE via: UPDATE zapp_history.runtime_config SET value = ''eyJ...'' WHERE key = ''service_role_key'';'
)
ON CONFLICT (key) DO NOTHING;

-- View mascarada
CREATE OR REPLACE VIEW zapp_history.v_runtime_config_safe AS
SELECT
  key,
  CASE WHEN is_secret THEN
    CASE
      WHEN value = 'PENDING_MANUAL_INSERT' THEN '⚠️ NOT_SET'
      WHEN length(value) > 12 THEN substring(value FROM 1 FOR 6) || '...' || substring(value FROM length(value) - 4)
      ELSE '***'
    END
  ELSE value END AS value_safe,
  is_secret,
  description,
  updated_at
FROM zapp_history.runtime_config;

GRANT SELECT ON zapp_history.v_runtime_config_safe TO authenticated;

-- ============================================================================
-- Helper: get_config(key) — usa runtime_config OU GUC como fallback
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.get_config(p_key TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $fn$
DECLARE
  v_value TEXT;
BEGIN
  -- Tenta runtime_config primeiro
  SELECT value INTO v_value FROM zapp_history.runtime_config WHERE key = p_key;
  IF v_value IS NOT NULL AND v_value <> 'PENDING_MANUAL_INSERT' THEN
    RETURN v_value;
  END IF;

  -- Fallback: GUC
  v_value := current_setting('app.' || p_key, true);
  IF v_value IS NOT NULL AND v_value <> '' THEN
    RETURN v_value;
  END IF;

  RETURN NULL;
END;
$fn$;

-- Atualiza invoke_edge_function pra usar get_config()
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
  v_key TEXT;
  v_request_id BIGINT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  v_key := zapp_history.get_config('service_role_key');

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'config not set: functions_base_url=% / service_role_key=%',
      v_url IS NOT NULL, v_key IS NOT NULL;
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url || '/' || p_function_name,
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

-- Idem para os 3 helpers da melhoria 38
CREATE OR REPLACE FUNCTION zapp_history.request_embedding(
  p_texts JSONB,
  p_provider TEXT DEFAULT 'qwen3-embedding-8b',
  p_task TEXT DEFAULT 'retrieval.passage'
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_url TEXT; v_key TEXT; v_request_id BIGINT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  v_key := zapp_history.get_config('service_role_key');
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NULL; END IF;
  SELECT net.http_post(
    url := v_url || '/rag-embed-v2',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('texts', p_texts, 'provider', p_provider, 'task', p_task),
    timeout_milliseconds := 60000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION zapp_history.request_transcription(p_audio_base64 TEXT)
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_url TEXT; v_key TEXT; v_request_id BIGINT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  v_key := zapp_history.get_config('service_role_key');
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NULL; END IF;
  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('action', 'transcribe', 'audio_base64', p_audio_base64),
    timeout_milliseconds := 120000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;

CREATE OR REPLACE FUNCTION zapp_history.request_classify(p_text TEXT, p_labels TEXT[])
RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $fn$
DECLARE v_url TEXT; v_key TEXT; v_request_id BIGINT;
BEGIN
  v_url := zapp_history.get_config('functions_base_url');
  v_key := zapp_history.get_config('service_role_key');
  IF v_url IS NULL OR v_key IS NULL THEN RETURN NULL; END IF;
  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := jsonb_build_object('Authorization', 'Bearer ' || v_key, 'Content-Type', 'application/json'),
    body := jsonb_build_object('action', 'classify', 'text', p_text, 'labels', to_jsonb(p_labels)),
    timeout_milliseconds := 30000
  ) INTO v_request_id;
  RETURN v_request_id;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.get_config(TEXT) TO authenticated, service_role;

-- Atualiza health_check pra refletir runtime_config
COMMENT ON FUNCTION zapp_history.invoke_edge_function IS
  'Invoca edge function via pg_net. Lê config de zapp_history.runtime_config (preferido) com fallback pra GUC ALTER DATABASE.';
