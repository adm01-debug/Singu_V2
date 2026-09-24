-- Defense-in-depth: explicit deny-by-authenticated policies on audit_log partitions.
-- service_role bypasses RLS and remains fully functional.
-- Silences 7 INFO findings (0008_rls_enabled_no_policy) from Supabase linter.

DO $$
DECLARE
  part TEXT;
BEGIN
  FOREACH part IN ARRAY ARRAY[
    'audit_log_2026_07',
    'audit_log_2026_08',
    'audit_log_2026_09',
    'audit_log_2026_10',
    'audit_log_2026_11',
    'audit_log_2026_12',
    'audit_log_default'
  ]
  LOOP
    IF to_regclass('public.' || part) IS NULL THEN
      CONTINUE;
    END IF;
    EXECUTE format(
      'DROP POLICY IF EXISTS "deny_authenticated_direct_access" ON public.%I;',
      part
    );
    EXECUTE format(
      'CREATE POLICY "deny_authenticated_direct_access" ON public.%I AS RESTRICTIVE FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);',
      part
    );
  END LOOP;
END $$;
