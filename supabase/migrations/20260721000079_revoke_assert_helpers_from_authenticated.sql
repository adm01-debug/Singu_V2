-- Migration: revoke_assert_helpers_from_authenticated (Wave 165)
-- SECURITY HARDENING: The 18 assert_*_access / assert_self_user_id guard
-- helpers are SECURITY DEFINER functions called exclusively from within other
-- SECURITY DEFINER functions (which run as postgres/owner).  PostgreSQL checks
-- EXECUTE privilege against the CURRENT ROLE at call time; when called from a
-- SECURITY DEFINER context that role is postgres (superuser), so the authenticated
-- grant on these helpers is never needed for them to function correctly.
--
-- Revoking EXECUTE from PUBLIC, anon, and authenticated:
--   • Prevents clients from probing ownership (e.g. SELECT assert_company_access($1))
--   • Eliminates 18 entries from the Supabase SECDEF lint advisory
--   • Has ZERO functional impact — the functions still work when called from
--     other SECURITY DEFINER functions because postgres always has EXECUTE.

REVOKE ALL ON FUNCTION public.assert_alert_access(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_cadence_access(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_company_access(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_contact_access(uuid)      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_customer_access(uuid)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_deal_access(uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_event_access(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_goal_access(uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_interaction_access(uuid)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_note_access(uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_notification_access(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_opportunity_access(uuid)  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_proposal_access(uuid)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_reminder_access(uuid)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_self_user_id(uuid)        FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_task_access(uuid)         FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_violation_access(uuid)    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assert_visit_access(uuid)        FROM PUBLIC, anon, authenticated;

-- Retain EXECUTE for service_role (for direct testing/maintenance calls)
GRANT EXECUTE ON FUNCTION public.assert_alert_access(uuid)        TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_cadence_access(uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_company_access(uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_contact_access(uuid)      TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_customer_access(uuid)     TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_deal_access(uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_event_access(uuid)        TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_goal_access(uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_interaction_access(uuid)  TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_note_access(uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_notification_access(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_opportunity_access(uuid)  TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_proposal_access(uuid)     TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_reminder_access(uuid)     TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_self_user_id(uuid)        TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_task_access(uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_violation_access(uuid)    TO service_role;
GRANT EXECUTE ON FUNCTION public.assert_visit_access(uuid)        TO service_role;

-- Verification
DO $$
DECLARE
  still_accessible int;
BEGIN
  SELECT COUNT(*) INTO still_accessible
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'assert_%'
    AND has_function_privilege('authenticated', p.oid, 'EXECUTE') = true;

  IF still_accessible = 0 THEN
    RAISE NOTICE '[Wave 165] All assert_* helpers locked down from authenticated. Clean.';
  ELSE
    RAISE WARNING '[Wave 165] % assert_* helpers still accessible to authenticated', still_accessible;
  END IF;
END;
$$;
