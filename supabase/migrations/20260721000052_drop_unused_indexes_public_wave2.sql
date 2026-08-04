-- Migration: drop_unused_indexes_public_wave2 (Wave 138)
-- Drops all remaining non-unique, non-PK indexes in the public schema with
-- idx_scan = 0 (never used since last stats reset).
--
-- Exclusions (kept because they support active query patterns):
--   idx_contacts_first_name_trgm — contact fuzzy search by first name
--   idx_contacts_last_name_trgm  — contact fuzzy search by last name
--   idx_contacts_email_trgm      — contact fuzzy search by email
--   idx_companies_name_trgm      — company fuzzy search by name
--
-- All other idx_scan=0 non-unique indexes are write overhead without benefit.
-- They can be recreated if a new query pattern emerges that needs them.

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
