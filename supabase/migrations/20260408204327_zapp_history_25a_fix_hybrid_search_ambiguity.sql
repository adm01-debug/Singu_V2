-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260408204327
-- nome:   zapp_history_25a_fix_hybrid_search_ambiguity

DROP FUNCTION IF EXISTS zapp_history.search_messages_hybrid(TEXT, VECTOR(1536), UUID, INTEGER, INTEGER);

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

GRANT EXECUTE ON FUNCTION zapp_history.search_messages_hybrid(TEXT, VECTOR(1536), UUID, INTEGER, INTEGER) TO authenticated;
