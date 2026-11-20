-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408201100
-- nome:   zapp_history_17_hybrid_search

-- ============================================================================
-- MELHORIA 17: search_messages_hybrid — combina full-text + semântico vetorial
-- Reciprocal Rank Fusion (RRF) para mesclar os 2 rankings
-- ============================================================================

CREATE OR REPLACE FUNCTION zapp_history.search_messages_hybrid(
  p_query_text TEXT,
  p_query_embedding VECTOR(1536) DEFAULT NULL,
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
      m.id,
      m.contact_id,
      m.content,
      m.message_type,
      m.direction,
      m.created_at,
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
      me.message_id AS id,
      me.contact_id,
      me.content_text AS content,
      m.message_type,
      m.direction,
      m.created_at,
      (1 - (me.embedding <=> p_query_embedding))::REAL AS rank,
      ROW_NUMBER() OVER (ORDER BY me.embedding <=> p_query_embedding) AS row
    FROM zapp_history.message_embeddings me
    JOIN zapp_history.messages m ON m.id = me.message_id
    WHERE p_query_embedding IS NOT NULL
      AND (p_contact_id IS NULL OR me.contact_id = p_contact_id)
    ORDER BY me.embedding <=> p_query_embedding
    LIMIT p_limit * 2
  ),
  combined AS (
    SELECT
      COALESCE(fts.id, vec.id) AS id,
      COALESCE(fts.contact_id, vec.contact_id) AS contact_id,
      COALESCE(fts.content, vec.content) AS content,
      COALESCE(fts.message_type, vec.message_type) AS message_type,
      COALESCE(fts.direction, vec.direction) AS direction,
      COALESCE(fts.created_at, vec.created_at) AS created_at,
      COALESCE(fts.rank, 0) AS fts_rank,
      COALESCE(vec.rank, 0) AS vector_rank,
      -- Reciprocal Rank Fusion
      COALESCE(1.0 / (p_rrf_k + fts.row), 0) + COALESCE(1.0 / (p_rrf_k + vec.row), 0) AS rrf_score
    FROM fts
    FULL OUTER JOIN vec ON fts.id = vec.id
  )
  SELECT
    id, contact_id, content, message_type, direction, created_at,
    fts_rank, vector_rank, rrf_score::NUMERIC AS hybrid_score
  FROM combined
  ORDER BY rrf_score DESC
  LIMIT p_limit;
END;
$fn$;

GRANT EXECUTE ON FUNCTION zapp_history.search_messages_hybrid(TEXT, VECTOR(1536), UUID, INTEGER, INTEGER) TO authenticated;

COMMENT ON FUNCTION zapp_history.search_messages_hybrid IS
  'Busca híbrida (full-text + vetorial) com Reciprocal Rank Fusion. Funciona só com FTS se p_query_embedding=NULL.';
