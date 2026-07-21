-- Migration: fix auth_rls_initplan (Wave 118)
-- Problem: RLS policies using bare auth.uid() cause the function to be re-evaluated
-- for every row scanned instead of once per query (initplan optimization).
-- Fix: wrap auth.uid() in (SELECT auth.uid()) so Postgres plans it as a subquery
-- that executes once per statement. Reduces CPU cost on large table scans.
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

DO $$
DECLARE
  p record;
  new_qual text;
  new_check text;
BEGIN
  FOR p IN
    SELECT
      tablename,
      policyname,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual      IS NOT NULL AND qual      ~ 'auth\.uid\(\)' AND qual      !~ 'SELECT auth\.uid\(\)')
        OR
        (with_check IS NOT NULL AND with_check ~ 'auth\.uid\(\)' AND with_check !~ 'SELECT auth\.uid\(\)')
      )
    ORDER BY tablename, policyname
  LOOP
    new_qual  := regexp_replace(p.qual,       'auth\.uid\(\)', '(SELECT auth.uid())', 'g');
    new_check := regexp_replace(p.with_check, 'auth\.uid\(\)', '(SELECT auth.uid())', 'g');

    BEGIN
      IF p.qual IS NOT NULL AND p.with_check IS NOT NULL THEN
        EXECUTE format(
          'ALTER POLICY %I ON public.%I USING %s WITH CHECK %s',
          p.policyname, p.tablename, new_qual, new_check
        );
      ELSIF p.qual IS NOT NULL THEN
        EXECUTE format(
          'ALTER POLICY %I ON public.%I USING %s',
          p.policyname, p.tablename, new_qual
        );
      ELSE
        EXECUTE format(
          'ALTER POLICY %I ON public.%I WITH CHECK %s',
          p.policyname, p.tablename, new_check
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Could not alter policy % on %: %', p.policyname, p.tablename, SQLERRM;
    END;
  END LOOP;
END $$;
