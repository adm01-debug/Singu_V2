-- Migration: index_unindexed_fks_public (Wave 144)
-- Creates covering indexes on all FK columns in the public schema that
-- currently lack a supporting index (107 unindexed FKs per advisor).
--
-- Unindexed FKs cause:
--   - Full sequential scans on cascade DELETE / UPDATE operations
--   - Slow JOIN queries on FK columns
--   - Lock contention during referential integrity checks
--
-- Strategy:
--   - Detect all FK columns in public schema with no existing index on that column
--   - Skip composite FKs where another index already covers the leading column
--   - Use CREATE INDEX IF NOT EXISTS to be idempotent
--   - Truncate generated index names to 63 bytes (PostgreSQL identifier limit)
--   - Wrap each in BEGIN/EXCEPTION to continue on partial failures

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
      -- exclude FK columns that already have ANY index leading with that column
      AND NOT EXISTS (
        SELECT 1
        FROM pg_index    pi
        JOIN pg_class    pc  ON pc.oid  = pi.indrelid
        JOIN pg_namespace pn ON pn.oid  = pc.relnamespace
        JOIN pg_attribute pa ON pa.attrelid = pi.indrelid
                             AND pa.attnum   = pi.indkey[0]  -- leading column only
        WHERE pn.nspname  = 'public'
          AND pc.relname  = kcu.table_name
          AND pa.attname  = kcu.column_name
      )
    ORDER BY kcu.table_name, kcu.column_name
  LOOP
    -- Build index name, truncate to 63 bytes
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
