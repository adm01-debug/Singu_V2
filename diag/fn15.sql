\set ON_ERROR_STOP 1
BEGIN;
SET LOCAL lock_timeout = '10s';
SET LOCAL statement_timeout = '120s';
SELECT version FROM supabase_migrations.schema_migrations WHERE version = '20261007100000';
-- ==== início: supabase/migrations/20261007100000_external_rpc_user_scope.sql ====
DO $$
DECLARE
  sig text;
  f regprocedure;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'public.assert_alert_access(uuid)',
    'public.assert_cadence_access(uuid)',
    'public.assert_company_access(uuid)',
    'public.assert_contact_access(uuid)',
    'public.assert_customer_access(uuid)',
    'public.assert_deal_access(uuid)',
    'public.assert_event_access(uuid)',
    'public.assert_goal_access(uuid)',
    'public.assert_interaction_access(uuid)',
    'public.assert_note_access(uuid)',
    'public.assert_notification_access(uuid)',
    'public.assert_opportunity_access(uuid)',
    'public.assert_proposal_access(uuid)',
    'public.assert_reminder_access(uuid)',
    'public.assert_task_access(uuid)',
    'public.assert_violation_access(uuid)',
    'public.assert_visit_access(uuid)',
    'public.assert_self_user_id(uuid)'
  ] LOOP
    f := to_regprocedure(sig);
    CONTINUE WHEN f IS NULL;
    IF (SELECT prosecdef FROM pg_proc WHERE oid = f) THEN
      RAISE EXCEPTION 'guard % é SECURITY DEFINER; EXECUTE para authenticated não é seguro', sig;
    END IF;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', f);
  END LOOP;

  IF to_regprocedure('public.get_instant_kpis(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.get_instant_kpis(uuid) SECURITY INVOKER;
    REVOKE ALL ON FUNCTION public.get_instant_kpis(uuid) FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.get_instant_kpis(uuid) TO authenticated, service_role;
  END IF;
END $$;
-- ==== fim da migration ====
INSERT INTO supabase_migrations.schema_migrations (version, name)
SELECT '20261007100000', 'external_rpc_user_scope'
WHERE NOT EXISTS (SELECT 1 FROM supabase_migrations.schema_migrations WHERE version = '20261007100000')
RETURNING version, name;
COMMIT;
SELECT version, name FROM supabase_migrations.schema_migrations WHERE version >= '20261007100000' ORDER BY 1;
-- verificação: contrato dos 18 guards (INVOKER, authenticated sim, anon não)
SELECT p.proname, p.prosecdef AS definer,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_exec,
       has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_exec
  FROM pg_proc p WHERE p.pronamespace = 'public'::regnamespace
   AND p.proname LIKE 'assert\_%' ORDER BY 1;
SELECT prosecdef AS kpis_definer,
       has_function_privilege('authenticated', oid, 'EXECUTE') AS auth_exec,
       has_function_privilege('anon', oid, 'EXECUTE') AS anon_exec
  FROM pg_proc WHERE oid = 'public.get_instant_kpis(uuid)'::regprocedure;
