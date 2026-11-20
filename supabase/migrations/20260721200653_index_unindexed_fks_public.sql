-- Recuperada da producao (supabase_migrations.schema_migrations).
--
-- Esta migration JA ESTA APLICADA no banco de producao, mas nao tinha arquivo
-- no repositorio: o check "Supabase Preview" falhava em todo push para a main
-- com "Remote migration versions not found in local migrations directory",
-- e a cadeia local nao reconstruia a producao.
--
-- O SQL abaixo e o que a propria producao registrou ter executado.
-- versao: 20260721200653
-- nome:   index_unindexed_fks_public

-- Migration: index_unindexed_fks_public (Wave 144)
-- Creates covering indexes on all FK columns in public schema with no
-- supporting index (107 unindexed FKs per advisor). Fixes performance advisor.

DO $$
DECLARE
  r record;
  idx_name text;
BEGIN
  FOR r IN
    SELECT DISTINCT
      kcu.table_name  AS tname,
      kcu.column_name AS cname
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = tc.constraint_name
      AND kcu.table_schema   = tc.table_schema
    WHERE tc.table_schema    = 'public'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index    pi
        JOIN pg_class    pc  ON pc.oid  = pi.indrelid
        JOIN pg_namespace pn ON pn.oid  = pc.relnamespace
        JOIN pg_attribute pa ON pa.attrelid = pi.indrelid
                             AND pa.attnum   = pi.indkey[0]
        WHERE pn.nspname  = 'public'
          AND pc.relname  = kcu.table_name
          AND pa.attname  = kcu.column_name
      )
    ORDER BY kcu.table_name, kcu.column_name
  LOOP
    idx_name := left('idx_fk_' || r.tname || '_' || r.cname, 63);
    BEGIN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
        idx_name, r.tname, r.cname
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create index % on public.%.%: %',
        idx_name, r.tname, r.cname, SQLERRM;
    END;
  END LOOP;
END $$;
