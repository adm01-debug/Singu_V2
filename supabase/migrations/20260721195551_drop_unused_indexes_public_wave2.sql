-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721195551
-- nome:   drop_unused_indexes_public_wave2

DO $$
DECLARE
  idx record;
  keep_list text[] := ARRAY[
    'idx_contacts_first_name_trgm',
    'idx_contacts_last_name_trgm',
    'idx_contacts_email_trgm',
    'idx_companies_name_trgm'
  ];
BEGIN
  FOR idx IN
    SELECT indexrelname AS iname
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON i.indexrelid = s.indexrelid
    WHERE s.schemaname = 'public'
      AND s.idx_scan = 0
      AND NOT i.indisunique
      AND NOT i.indisprimary
      AND NOT (s.indexrelname = ANY(keep_list))
    ORDER BY pg_relation_size(s.indexrelid) DESC
  LOOP
    BEGIN
      EXECUTE format('DROP INDEX IF EXISTS public.%I', idx.iname);
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not drop index public.%: %', idx.iname, SQLERRM;
    END;
  END LOOP;
END $$;
