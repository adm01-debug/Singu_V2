-- Migration: dormant_explicit_deny_all_policies (Wave 140)
-- Adds explicit RESTRICTIVE USING(false) policies to all _dormant tables that
-- have RLS enabled but no policies (advisor: rls_enabled_no_policy).
--
-- Wave 131 dropped the always-true allow policies from _dormant, leaving
-- RLS enabled with zero policies. That is implicit deny-all (correct behavior),
-- but the advisor still flags tables with "RLS enabled, no policies."
--
-- Adding a single RESTRICTIVE USING(false) policy makes the intent explicit:
--   - Silences the advisor
--   - Documents that deny-all is intentional (locked schema)
--   - service_role bypasses RLS via rolbypassrls=true, so operational access
--     is unaffected

DO $$
DECLARE
  t record;
  pol_name text;
BEGIN
  FOR t IN
    SELECT c.relname AS tname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = '_dormant'
      AND c.relkind = 'r'
      AND c.relrowsecurity = true
      AND NOT EXISTS (
        SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
      )
    ORDER BY c.relname
  LOOP
    pol_name := 'dormant_deny_all_' || t.tname;
    BEGIN
      EXECUTE format(
        'CREATE POLICY %I ON _dormant.%I AS RESTRICTIVE FOR ALL USING (false)',
        pol_name, t.tname
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not create deny policy on _dormant.%: %', t.tname, SQLERRM;
    END;
  END LOOP;
END $$;
