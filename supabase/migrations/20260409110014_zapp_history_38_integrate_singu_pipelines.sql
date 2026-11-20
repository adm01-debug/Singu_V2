-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260409110014
-- nome:   zapp_history_38_integrate_singu_pipelines

-- ============================================================================
-- MELHORIA 38: Integração com edge functions SINGU existentes
-- media-pipeline (Whisper v3) + rag-embed-v2 (Qwen3/BGE-M3/Jina v3, 1024 dim)
-- ============================================================================

-- Adiciona coluna embedding_1024 em message_embeddings para co-existir com 1536
ALTER TABLE zapp_history.message_embeddings
  ADD COLUMN IF NOT EXISTS embedding_1024 VECTOR(1024),
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ALTER COLUMN embedding DROP NOT NULL;

-- Índice IVFFlat na coluna 1024
CREATE INDEX IF NOT EXISTS idx_me_vector_1024
  ON zapp_history.message_embeddings USING ivfflat (embedding_1024 vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding_1024 IS NOT NULL;

-- Mesmo para message_audio (se quiser embeddings via rag-embed-v2)
ALTER TABLE zapp_history.message_audio
  ADD COLUMN IF NOT EXISTS embedding_1024 VECTOR(1024),
  ADD COLUMN IF NOT EXISTS embedding_provider TEXT;

CREATE INDEX IF NOT EXISTS idx_ma_embedding_1024
  ON zapp_history.message_audio USING ivfflat (embedding_1024 vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding_1024 IS NOT NULL;

-- Mesmo para conversation_daily_summaries
ALTER TABLE zapp_history.conversation_daily_summaries
  ADD COLUMN IF NOT EXISTS embedding_1024 VECTOR(1024),
  ADD COLUMN IF NOT EXISTS embedding_provider TEXT;

CREATE INDEX IF NOT EXISTS idx_cds_embedding_1024
  ON zapp_history.conversation_daily_summaries USING ivfflat (embedding_1024 vector_cosine_ops)
  WITH (lists = 100)
  WHERE embedding_1024 IS NOT NULL;

-- ============================================================================
-- Helper: chama rag-embed-v2 via pg_net (fire and forget)
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.request_embedding(
  p_texts JSONB,
  p_provider TEXT DEFAULT 'qwen3-embedding-8b',
  p_task TEXT DEFAULT 'retrieval.passage'
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
  v_url := current_setting('app.functions_base_url', true);
  v_key := current_setting('app.service_role_key', true);

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'GUC app.functions_base_url e app.service_role_key precisam ser configurados';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url || '/rag-embed-v2',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'texts', p_texts,
      'provider', p_provider,
      'task', p_task
    ),
    timeout_milliseconds := 60000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$fn$;

-- ============================================================================
-- Helper: chama media-pipeline para transcrição via pg_net
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.request_transcription(
  p_audio_base64 TEXT
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
  v_url := current_setting('app.functions_base_url', true);
  v_key := current_setting('app.service_role_key', true);

  IF v_url IS NULL OR v_key IS NULL THEN
    RAISE WARNING 'GUC não configurado';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('action', 'transcribe', 'audio_base64', p_audio_base64),
    timeout_milliseconds := 120000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$fn$;

-- ============================================================================
-- Helper: classify via media-pipeline (zero-shot)
-- Útil pra classificar intent de mensagens
-- ============================================================================
CREATE OR REPLACE FUNCTION zapp_history.request_classify(
  p_text TEXT,
  p_labels TEXT[]
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
  v_url := current_setting('app.functions_base_url', true);
  v_key := current_setting('app.service_role_key', true);

  IF v_url IS NULL OR v_key IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url || '/media-pipeline',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'action', 'classify',
      'text', p_text,
      'labels', to_jsonb(p_labels)
    ),
    timeout_milliseconds := 30000
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$fn$;

-- ============================================================================
-- Atualiza embedding_configs do SINGU com os providers reais
-- ============================================================================
INSERT INTO public.embedding_configs (provider, dimension, task, hybrid_search, reranker_top_k)
SELECT 'qwen3-embedding-8b', 1024, 'zapp_history_messages_singu', TRUE, 20
WHERE NOT EXISTS (
  SELECT 1 FROM public.embedding_configs
  WHERE provider = 'qwen3-embedding-8b' AND task = 'zapp_history_messages_singu'
);

INSERT INTO public.embedding_configs (provider, dimension, task, hybrid_search, reranker_top_k)
SELECT 'bge-m3', 1024, 'zapp_history_summaries_singu', TRUE, 10
WHERE NOT EXISTS (
  SELECT 1 FROM public.embedding_configs
  WHERE provider = 'bge-m3' AND task = 'zapp_history_summaries_singu'
);

-- ============================================================================
-- Hybrid search v2 usando embedding_1024 (compatível com SINGU)
-- ============================================================================
DROP FUNCTION IF EXISTS zapp_history.search_messages_hybrid_v2(TEXT, VECTOR(1024), UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION zapp_history.search_messages_hybrid_v2(
  p_query_text TEXT,
  p_query_embedding VECTOR(1024) DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_rrf_k INTEGER DEFAULT 60
)
RETURNS TABLE (
  message_id UUID,
  contact_id UUID,
  content TEXT,
  message_type TEXT,
  direction TEXT,
  created_at TIMESTAMPTZ,
  fts_rank REAL,
  vector_rank REAL,
  hybrid_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = zapp_history, public, pg_temp
AS $fn$
BEGIN
  RETURN QUERY
  WITH fts AS (
    SELECT
      m.id AS m_id,
      m.contact_id AS m_contact_id,
      m.content AS m_content,
      m.message_type AS m_type,
      m.direction AS m_dir,
      m.created_at AS m_created,
      ts_rank(to_tsvector('portuguese', coalesce(m.content,'')), plainto_tsquery('portuguese', p_query_text)) AS rank,
      ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('portuguese', coalesce(m.content,'')), plainto_tsquery('portuguese', p_query_text)) DESC) AS row
    FROM zapp_history.messages m
    WHERE (p_contact_id IS NULL OR m.contact_id = p_contact_id)
      AND to_tsvector('portuguese', coalesce(m.content,'')) @@ plainto_tsquery('portuguese', p_query_text)
    ORDER BY rank DESC
    LIMIT p_limit * 2
  ),
  vec AS (
    SELECT
      me.message_id AS m_id,
      me.contact_id AS m_contact_id,
      me.content_text AS m_content,
      m.message_type AS m_type,
      m.direction AS m_dir,
      m.created_at AS m_created,
      (1 - (me.embedding_1024 <=> p_query_embedding))::REAL AS rank,
      ROW_NUMBER() OVER (ORDER BY me.embedding_1024 <=> p_query_embedding) AS row
    FROM zapp_history.message_embeddings me
    JOIN zapp_history.messages m ON m.id = me.message_id
    WHERE p_query_embedding IS NOT NULL
      AND me.embedding_1024 IS NOT NULL
      AND (p_contact_id IS NULL OR me.contact_id = p_contact_id)
    ORDER BY me.embedding_1024 <=> p_query_embedding
    LIMIT p_limit * 2
  ),
  combined AS (
    SELECT
      COALESCE(fts.m_id, vec.m_id) AS c_id,
      COALESCE(fts.m_contact_id, vec.m_contact_id) AS c_contact_id,
      COALESCE(fts.m_content, vec.m_content) AS c_content,
      COALESCE(fts.m_type, vec.m_type) AS c_type,
      COALESCE(fts.m_dir, vec.m_dir) AS c_dir,
      COALESCE(fts.m_created, vec.m_created) AS c_created,
      COALESCE(fts.rank, 0) AS c_fts_rank,
      COALESCE(vec.rank, 0) AS c_vec_rank,
      COALESCE(1.0 / (p_rrf_k + fts.row), 0) + COALESCE(1.0 / (p_rrf_k + vec.row), 0) AS c_rrf
    FROM fts
    FULL OUTER JOIN vec ON fts.m_id = vec.m_id
  )
  SELECT
    c_id, c_contact_id, c_content, c_type, c_dir, c_created,
    c_fts_rank, c_vec_rank, c_rrf::NUMERIC
  FROM combined
  ORDER BY c_rrf DESC
  LIMIT p_limit;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.search_messages_hybrid_v2(TEXT, VECTOR(1024), UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION zapp_history.request_embedding(JSONB, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION zapp_history.request_transcription(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION zapp_history.request_classify(TEXT, TEXT[]) TO service_role;

COMMENT ON FUNCTION zapp_history.request_embedding IS
  'Dispara rag-embed-v2 via pg_net. Providers: qwen3-embedding-8b (default), bge-m3, jina-v3. Async, retorna request_id.';
COMMENT ON FUNCTION zapp_history.request_transcription IS
  'Dispara media-pipeline action=transcribe (Whisper v3) via pg_net. Async.';
COMMENT ON FUNCTION zapp_history.request_classify IS
  'Dispara media-pipeline action=classify (BART MNLI zero-shot) via pg_net.';
