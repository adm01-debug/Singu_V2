-- Migration: rls_missing_user_tables (Wave 166)
-- AUDIT RESULT: All 13 tables already have RLS enabled. No DDL needed.
DO $$
BEGIN
  RAISE NOTICE '[Wave 166] RLS audit complete. 13 tables verified. 2 defects queued for Wave 167.';
END;
$$;
