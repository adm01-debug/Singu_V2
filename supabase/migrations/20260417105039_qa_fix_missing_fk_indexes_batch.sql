-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260417105039
-- nome:   qa_fix_missing_fk_indexes_batch

-- Gerar todos os CREATE INDEX para FKs faltantes via DO block
DO $$
DECLARE
  rec RECORD;
  idx_name text;
  sql text;
BEGIN
  FOR rec IN 
    WITH fk_cols AS (
      SELECT DISTINCT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ),
    indexed_cols AS (
      SELECT DISTINCT c.relname AS table_name, a.attname AS column_name
      FROM pg_index i
      JOIN pg_class c ON c.oid = i.indrelid
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY(i.indkey)
      WHERE n.nspname = 'public'
        AND array_position(i.indkey::int[], a.attnum::int) = 0
    )
    SELECT fk.table_name, fk.column_name
    FROM fk_cols fk
    LEFT JOIN indexed_cols ic ON ic.table_name = fk.table_name AND ic.column_name = fk.column_name
    WHERE ic.column_name IS NULL
  LOOP
    idx_name := 'idx_' || rec.table_name || '_' || rec.column_name || '_fk';
    -- Truncar se nome ficar muito longo (limite PG = 63)
    IF length(idx_name) > 63 THEN
      idx_name := left(idx_name, 63);
    END IF;
    sql := format('CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)', idx_name, rec.table_name, rec.column_name);
    BEGIN
      EXECUTE sql;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed for %: %', sql, SQLERRM;
    END;
  END LOOP;
END $$;
