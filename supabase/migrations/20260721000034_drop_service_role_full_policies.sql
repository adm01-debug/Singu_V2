-- Migration: drop_service_role_full_policies (Wave 120)
-- The service_role Postgres role has BYPASSRLS=true, meaning it always
-- bypasses Row Level Security regardless of any explicit policies.
-- Every "service_role_full" policy (qual=true, roles={service_role}) is
-- therefore dead code: it has zero effect on access control and just adds
-- noise to the policy set, causing "multiple_permissive_policies" advisor
-- warnings on the 21 tables where it co-exists with another ALL policy.
-- Dropping all 110 occurrences is a no-op on effective security.

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND policyname = 'service_role_full'
    ORDER BY tablename
  LOOP
    BEGIN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not drop policy % on %: %', p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
