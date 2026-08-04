-- Migration: drop_unused_indexes_dormant_zapp (Wave 139)
-- Drops unused non-unique, non-PK indexes in _dormant and zapp_history schemas.
--
-- _dormant: ALL 263 unused indexes dropped — schema is locked (deny-all RLS,
--   service_role only) and no queries run against it in production.
--
-- zapp_history: 20 small specialty indexes dropped (8-152 kB each, idx_scan=0).
--   The following categories are explicitly KEPT:
--   - Vector/embedding IVFFlat indexes (6 × ~1.6 MB each): expensive to
--     rebuild, support hybrid semantic search once embeddings are populated.
--   - JSONB GIN indexes: idx_messages_nlp_entities, idx_messages_contact_info_gin,
--     idx_messages_location_gin, idx_product_dict_patterns — support NLP queries.
--   - Pipeline partial index: idx_messages_pending_embedding — supports the
--     batch embedding processor filter.

-- ── _dormant: drop all unused non-unique/non-PK indexes ──────────────────────
DO $$
DECLARE
  idx record;
BEGIN
  FOR idx IN
    SELECT s.indexrelname AS iname, s.relname AS tname
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = '_dormant'
      AND s.idx_scan = 0
      AND NOT i.indisunique
      AND NOT i.indisprimary
    ORDER BY pg_relation_size(s.indexrelid) DESC
  LOOP
    BEGIN
      EXECUTE format('DROP INDEX IF EXISTS _dormant.%I', idx.iname);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not drop index _dormant.%: %', idx.iname, SQLERRM;
    END;
  END LOOP;
END $$;

-- ── zapp_history: drop small specialty indexes, keep vector/GIN/pipeline ──────
DO $$
DECLARE
  idx record;
  keep_list text[] := ARRAY[
    -- Vector/embedding IVFFlat indexes (expensive rebuild)
    'idx_cds_embedding_1024',
    'idx_ma_embedding_1024',
    'idx_me_vector',
    'idx_me_vector_1024',
    'idx_ma_embedding',
    'idx_cds_embedding',
    -- JSONB GIN indexes (NLP and contact info search)
    'idx_messages_nlp_entities',
    'idx_messages_contact_info_gin',
    'idx_messages_location_gin',
    'idx_product_dict_patterns',
    -- AI pipeline partial index
    'idx_messages_pending_embedding'
  ];
BEGIN
  FOR idx IN
    SELECT s.indexrelname AS iname
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = 'zapp_history'
      AND s.idx_scan = 0
      AND NOT i.indisunique
      AND NOT i.indisprimary
      AND NOT (s.indexrelname = ANY(keep_list))
    ORDER BY pg_relation_size(s.indexrelid) DESC
  LOOP
    BEGIN
      EXECUTE format('DROP INDEX IF EXISTS zapp_history.%I', idx.iname);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not drop index zapp_history.%: %', idx.iname, SQLERRM;
    END;
  END LOOP;
END $$;
