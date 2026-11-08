-- Migration: explicit_deny_rls_no_policy_tables (Wave 125)
-- 6 public tables have RLS enabled but zero policies, triggering the
-- rls_enabled_no_policy advisor warning. In all cases the lockdown is
-- intentional — these are internal/security-only tables accessed exclusively
-- via service_role (which bypasses RLS). Adding an explicit USING (false)
-- ALL policy documents intent, silences the advisor, and preserves the
-- same deny-all posture for authenticated/anon API consumers.
--
-- Tables and their purpose:
--   access_blocked_log      — security audit log (write via edge fn, no user reads)
--   asia_upload_mapping     — internal ASIA import pipeline mapping table
--   login_attempts          — brute-force protection log (service_role only)
--   password_reset_requests — password reset security log (service_role only)
--   sm_upload_mapping       — internal SM import pipeline mapping table
--   xbz_upload_mapping      — internal XBZ import pipeline mapping table

DO $migration$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'access_blocked_log',
    'asia_upload_mapping',
    'login_attempts',
    'password_reset_requests',
    'sm_upload_mapping',
    'xbz_upload_mapping'
  ]
  LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass(format('public.%I', table_name))
          AND polname = 'internal_deny_all'
      )
    THEN
      EXECUTE format(
        'CREATE POLICY internal_deny_all ON public.%I AS RESTRICTIVE FOR ALL TO authenticated, anon USING (false)',
        table_name
      );
    END IF;
  END LOOP;
END;
$migration$;
