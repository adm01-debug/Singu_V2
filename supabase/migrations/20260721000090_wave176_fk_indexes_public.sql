-- Migration: wave176_fk_indexes_public (Wave 176)
-- PERFORMANCE FIX: 119 FK constraints in public schema lack a covering index
-- on the FK column. Without a leading-column index on the FK column, PostgreSQL
-- must perform a sequential scan of the child table on every ON DELETE/UPDATE
-- CASCADE check against the parent, degrading performance on parent-record writes.
--
-- Strategy: Dynamically find all FK columns in public schema that have no index
-- where the FK column is the first key column, then create the missing indexes.
-- Uses IF NOT EXISTS — safe to re-run. Excludes columns already covered by a
-- PK, UNIQUE, or other index where that column leads.

DO $$
DECLARE
  r             RECORD;
  idx_name      text;
  created_count int := 0;
  skip_count    int := 0;
BEGIN
  FOR r IN
    -- FK columns in public schema whose column is NOT the leading column
    -- of any existing index on that table.
    WITH fk_cols AS (
      SELECT DISTINCT
        t.relname     AS table_name,
        a.attname     AS column_name,
        t.oid         AS table_oid
      FROM pg_constraint c
      JOIN pg_class     t ON t.oid = c.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
      JOIN pg_attribute a ON a.attrelid = c.conrelid
        AND a.attnum = ANY(c.conkey)
        AND NOT a.attisdropped
      WHERE c.contype = 'f'
    ),
    covered AS (
      -- Indexes where the FK candidate column is the FIRST key column
      SELECT DISTINCT
        ix.indrelid           AS table_oid,
        a.attname             AS column_name
      FROM pg_index     ix
      JOIN pg_class     t  ON t.oid = ix.indrelid
      JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
      JOIN pg_attribute a  ON a.attrelid = ix.indrelid
        AND a.attnum = ix.indkey[0]
        AND NOT a.attisdropped
    )
    SELECT fc.table_name, fc.column_name
    FROM   fk_cols fc
    LEFT JOIN covered c ON c.table_oid = fc.table_oid
                       AND c.column_name = fc.column_name
    WHERE  c.column_name IS NULL
    ORDER  BY fc.table_name, fc.column_name
  LOOP
    idx_name := format('idx_%s_%s', r.table_name, r.column_name);
    IF length(idx_name) > 63 THEN
      idx_name := left(idx_name, 63);
    END IF;

    BEGIN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON public.%I (%I)',
        idx_name, r.table_name, r.column_name
      );
      created_count := created_count + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped %.%: %', r.table_name, r.column_name, SQLERRM;
      skip_count := skip_count + 1;
    END;
  END LOOP;

  RAISE NOTICE '[Wave 176] Created % FK indexes in public schema (% skipped)', created_count, skip_count;
END;
$$;

-- ── Verification ──────────────────────────────────────────────────────────────
DO $$
DECLARE
  missing_count int;
BEGIN
  WITH fk_cols AS (
    SELECT DISTINCT
      t.oid AS table_oid, a.attname AS column_name
    FROM pg_constraint c
    JOIN pg_class     t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace AND n.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = c.conrelid
      AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped
    WHERE c.contype = 'f'
  ),
  covered AS (
    SELECT DISTINCT ix.indrelid AS table_oid, a.attname AS column_name
    FROM pg_index ix
    JOIN pg_class t ON t.oid = ix.indrelid
    JOIN pg_namespace ns ON ns.oid = t.relnamespace AND ns.nspname = 'public'
    JOIN pg_attribute a ON a.attrelid = ix.indrelid
      AND a.attnum = ix.indkey[0] AND NOT a.attisdropped
  )
  SELECT COUNT(*) INTO missing_count
  FROM fk_cols fc
  LEFT JOIN covered c ON c.table_oid = fc.table_oid AND c.column_name = fc.column_name
  WHERE c.column_name IS NULL;

  IF missing_count = 0 THEN
    RAISE NOTICE '[Wave 176] All FK columns in public schema now have leading-column indexes. Performance clean.';
  ELSE
    RAISE WARNING '[Wave 176] % FK columns still missing a leading-column index', missing_count;
  END IF;
END;
$$;
