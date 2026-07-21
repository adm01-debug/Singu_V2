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

CREATE POLICY internal_deny_all ON public.access_blocked_log
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);

CREATE POLICY internal_deny_all ON public.asia_upload_mapping
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);

CREATE POLICY internal_deny_all ON public.login_attempts
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);

CREATE POLICY internal_deny_all ON public.password_reset_requests
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);

CREATE POLICY internal_deny_all ON public.sm_upload_mapping
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);

CREATE POLICY internal_deny_all ON public.xbz_upload_mapping
  AS RESTRICTIVE
  FOR ALL
  TO authenticated, anon
  USING (false);
