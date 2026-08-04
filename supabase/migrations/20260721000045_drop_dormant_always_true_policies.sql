-- Migration: drop_dormant_always_true_policies (Wave 131)
-- Drops all 128 RLS policies in the _dormant schema that have
-- USING (true) or WITH CHECK (true). These policies grant unrestricted
-- full-table access to the public role on tables that are explicitly
-- dormant (not in active production use).
--
-- After this migration:
--   - service_role: continues to have full access (BYPASSRLS=true)
--   - authenticated / anon: deny-all by default (no permissive policy)
--
-- This eliminates the rls_policy_always_true advisor warnings and closes
-- a data access gap — dormant tables should not be readable or writable
-- by API consumers.

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = '_dormant'
      AND (
        (qual      IS NOT NULL AND trim(qual)        = 'true')
        OR
        (with_check IS NOT NULL AND trim(with_check) = 'true')
      )
    ORDER BY tablename, policyname
  LOOP
    BEGIN
      EXECUTE format(
        'DROP POLICY IF EXISTS %I ON _dormant.%I',
        p.policyname, p.tablename
      );
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not drop policy % on _dormant.%: %',
          p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
