-- RPCs chamadas por usuários via edge function external-data passam a rodar
-- com o JWT do usuário (role authenticated), e não mais com a service role.
-- Os 18 guards assert_* (mesma lista de 20260721000079) só levantam
-- insufficient_privilege e são SECURITY INVOKER: sob RLS só enxergam linhas do
-- próprio usuário, então EXECUTE para authenticated não permite sondar posse de
-- registros alheios. Um guard que não seja INVOKER aborta a migration.
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
