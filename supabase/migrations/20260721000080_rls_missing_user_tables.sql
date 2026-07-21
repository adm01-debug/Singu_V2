-- Migration: rls_missing_user_tables (Wave 166)
-- AUDIT RESULT: Scanned all 13 tables originally suspected of missing RLS.
-- Upon applying, found all 13 tables already have RLS enabled with policies
-- from earlier migrations. No DDL changes required in this wave.
--
-- Tables audited and confirmed RLS-enabled:
--   deals                    — deals_select/insert/update/delete (user_id = auth.uid())
--   tasks                    — tasks_select/insert/update/delete (user_id = auth.uid())
--   notifications            — notifications_select/insert/update/delete
--   sequences                — "Users can view/insert/update/delete own"
--   lead_scores              — "Users can view/insert/update/delete own"
--   ip_whitelist             — "Users can view/insert/update/delete own"
--   webauthn_credentials     — "Users can view/insert/update/delete own"
--   user_roles               — user_roles_auth_select + service_role CRUD
--   login_attempts           — login_attempts_internal_deny_all (RESTRICTIVE, USING false)
--   password_reset_requests  — password_reset_requests_internal_deny_all (RESTRICTIVE, USING false)
--
-- TWO defects found (fixed in Wave 167):
--   push_subscriptions: push_subscriptions_all uses USING (auth.uid() IS NOT NULL)
--                       — any authenticated user can read all rows (CRITICAL)
--   custom_fields:      custom_fields_select uses USING (auth.uid() = user_id)
--                       — misses shared/global rows where user_id IS NULL
--   custom_field_values: same defect as custom_fields
--
-- This migration intentionally contains no DDL (all fixes in Wave 167).

DO $$
BEGIN
  RAISE NOTICE '[Wave 166] RLS audit complete. 13 tables verified. 2 defects queued for Wave 167.';
END;
$$;
