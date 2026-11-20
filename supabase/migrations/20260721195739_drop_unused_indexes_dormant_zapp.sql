-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721195739
-- nome:   drop_unused_indexes_dormant_zapp

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

DO $$
DECLARE
  idx record;
  keep_list text[] := ARRAY[
    'idx_cds_embedding_1024',
    'idx_ma_embedding_1024',
    'idx_me_vector',
    'idx_me_vector_1024',
    'idx_ma_embedding',
    'idx_cds_embedding',
    'idx_messages_nlp_entities',
    'idx_messages_contact_info_gin',
    'idx_messages_location_gin',
    'idx_product_dict_patterns',
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
