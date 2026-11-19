DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='communication_preferences' AND p.polname='Users can insert their own communication preferences') THEN
    ALTER POLICY "Users can insert their own communication preferences" ON public.communication_preferences WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='communication_preferences' AND p.polname='Users can update their own communication preferences') THEN
    ALTER POLICY "Users can update their own communication preferences" ON public.communication_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='communication_preferences' AND p.polname='Users can view their own communication preferences') THEN
    ALTER POLICY "Users can view their own communication preferences" ON public.communication_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='companies' AND p.polname='Users can update their own companies') THEN
    ALTER POLICY "Users can update their own companies" ON public.companies USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='companies' AND p.polname='Users can view their own companies') THEN
    ALTER POLICY "Users can view their own companies" ON public.companies USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $migration$
DECLARE
  policy_definition record;
  clauses text;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('company_phones', 'company_phones_delete', true, false),
      ('company_phones', 'company_phones_insert', false, true),
      ('company_phones', 'company_phones_select', true, false),
      ('company_phones', 'company_phones_update', true, true),
      ('contact_phones', 'contact_phones_delete', true, false),
      ('contact_phones', 'contact_phones_insert', false, true),
      ('contact_phones', 'contact_phones_select', true, false),
      ('contact_phones', 'contact_phones_update', true, true)
    ) AS policies(table_name, policy_name, use_using, use_check)
  LOOP
    IF to_regclass(format('public.%I', policy_definition.table_name)) IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass(format('public.%I', policy_definition.table_name))
          AND polname = policy_definition.policy_name
      )
    THEN
      clauses := '';
      IF policy_definition.use_using THEN
        clauses := clauses || ' USING ((SELECT has_role((select auth.uid()), ''admin''::app_role) AS has_role))';
      END IF;
      IF policy_definition.use_check THEN
        clauses := clauses || ' WITH CHECK ((SELECT has_role((select auth.uid()), ''admin''::app_role) AS has_role))';
      END IF;

      EXECUTE format(
        'ALTER POLICY %I ON public.%I%s',
        policy_definition.policy_name,
        policy_definition.table_name,
        clauses
      );
    END IF;
  END LOOP;
END;
$migration$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_alerts' AND p.polname='Users can create their own compatibility alerts') THEN
    ALTER POLICY "Users can create their own compatibility alerts" ON public.compatibility_alerts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_alerts' AND p.polname='Users can delete their own compatibility alerts') THEN
    ALTER POLICY "Users can delete their own compatibility alerts" ON public.compatibility_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_alerts' AND p.polname='Users can update their own compatibility alerts') THEN
    ALTER POLICY "Users can update their own compatibility alerts" ON public.compatibility_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_alerts' AND p.polname='Users can view their own compatibility alerts') THEN
    ALTER POLICY "Users can view their own compatibility alerts" ON public.compatibility_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_settings' AND p.polname='Users can create their own compatibility settings') THEN
    ALTER POLICY "Users can create their own compatibility settings" ON public.compatibility_settings WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_settings' AND p.polname='Users can delete their own compatibility_settings') THEN
    ALTER POLICY "Users can delete their own compatibility_settings" ON public.compatibility_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_settings' AND p.polname='Users can update their own compatibility settings') THEN
    ALTER POLICY "Users can update their own compatibility settings" ON public.compatibility_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='compatibility_settings' AND p.polname='Users can view their own compatibility settings') THEN
    ALTER POLICY "Users can view their own compatibility settings" ON public.compatibility_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_anomalies' AND p.polname='Admins can delete anomalies') THEN
    ALTER POLICY "Admins can delete anomalies" ON public.connection_anomalies USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_anomalies' AND p.polname='Admins can update anomalies') THEN
    ALTER POLICY "Admins can update anomalies" ON public.connection_anomalies USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_anomalies' AND p.polname='Admins can view anomalies') THEN
    ALTER POLICY "Admins can view anomalies" ON public.connection_anomalies USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_configs' AND p.polname='admins manage connection_configs') THEN
    ALTER POLICY "admins manage connection_configs" ON public.connection_configs USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_quotas' AND p.polname='Admins manage connection quotas') THEN
    ALTER POLICY "Admins manage connection quotas" ON public.connection_quotas USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_quotas' AND p.polname='users_read_own_connection_quotas') THEN
    ALTER POLICY users_read_own_connection_quotas ON public.connection_quotas USING ((EXISTS ( SELECT 1
   FROM incoming_webhooks w
  WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_test_logs' AND p.polname='admins insert connection_test_logs') THEN
    ALTER POLICY "admins insert connection_test_logs" ON public.connection_test_logs WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='connection_test_logs' AND p.polname='admins read connection_test_logs') THEN
    ALTER POLICY "admins read connection_test_logs" ON public.connection_test_logs USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_analytical_profile_versions' AND p.polname='Users insert own profile versions') THEN
    ALTER POLICY "Users insert own profile versions" ON public.contact_analytical_profile_versions WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_analytical_profile_versions' AND p.polname='Users read own profile versions') THEN
    ALTER POLICY "Users read own profile versions" ON public.contact_analytical_profile_versions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_analytical_profiles' AND p.polname='Users can manage analytical profiles of their contacts') THEN
    ALTER POLICY "Users can manage analytical profiles of their contacts" ON public.contact_analytical_profiles USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_analytical_profiles' AND p.polname='Users can view analytical profiles of their contacts') THEN
    ALTER POLICY "Users can view analytical profiles of their contacts" ON public.contact_analytical_profiles USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_automation_settings' AND p.polname='Users can manage their own contact automation settings') THEN
    ALTER POLICY "Users can manage their own contact automation settings" ON public.contact_automation_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_behavior' AND p.polname='Owner or admin can delete contact_behavior') THEN
    ALTER POLICY "Owner or admin can delete contact_behavior" ON public.contact_behavior USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_behavior' AND p.polname='Owner or admin can insert contact_behavior') THEN
    ALTER POLICY "Owner or admin can insert contact_behavior" ON public.contact_behavior WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_behavior' AND p.polname='Owner or admin can select contact_behavior') THEN
    ALTER POLICY "Owner or admin can select contact_behavior" ON public.contact_behavior USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_behavior' AND p.polname='Owner or admin can update contact_behavior') THEN
    ALTER POLICY "Owner or admin can update contact_behavior" ON public.contact_behavior USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_business_context' AND p.polname='Owner or admin can delete contact_business_context') THEN
    ALTER POLICY "Owner or admin can delete contact_business_context" ON public.contact_business_context USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_business_context' AND p.polname='Owner or admin can insert contact_business_context') THEN
    ALTER POLICY "Owner or admin can insert contact_business_context" ON public.contact_business_context WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_business_context' AND p.polname='Owner or admin can select contact_business_context') THEN
    ALTER POLICY "Owner or admin can select contact_business_context" ON public.contact_business_context USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_business_context' AND p.polname='Owner or admin can update contact_business_context') THEN
    ALTER POLICY "Owner or admin can update contact_business_context" ON public.contact_business_context USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_cadence' AND p.polname='Users can create their own contact cadence') THEN
    ALTER POLICY "Users can create their own contact cadence" ON public.contact_cadence WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_cadence' AND p.polname='Users can delete their own contact cadence') THEN
    ALTER POLICY "Users can delete their own contact cadence" ON public.contact_cadence USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_cadence' AND p.polname='Users can update their own contact cadence') THEN
    ALTER POLICY "Users can update their own contact cadence" ON public.contact_cadence USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_cadence' AND p.polname='Users can view their own contact cadence') THEN
    ALTER POLICY "Users can view their own contact cadence" ON public.contact_cadence USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_cadence_audit' AND p.polname='Users can view their own cadence audit') THEN
    ALTER POLICY "Users can view their own cadence audit" ON public.contact_cadence_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_decision_making' AND p.polname='Owner or admin can delete contact_decision_making') THEN
    ALTER POLICY "Owner or admin can delete contact_decision_making" ON public.contact_decision_making USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_decision_making' AND p.polname='Owner or admin can insert contact_decision_making') THEN
    ALTER POLICY "Owner or admin can insert contact_decision_making" ON public.contact_decision_making WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_decision_making' AND p.polname='Owner or admin can select contact_decision_making') THEN
    ALTER POLICY "Owner or admin can select contact_decision_making" ON public.contact_decision_making USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_decision_making' AND p.polname='Owner or admin can update contact_decision_making') THEN
    ALTER POLICY "Owner or admin can update contact_decision_making" ON public.contact_decision_making USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_family_history' AND p.polname='Users can insert their contact family history') THEN
    ALTER POLICY "Users can insert their contact family history" ON public.contact_family_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_family_history' AND p.polname='Users can view their contact family history') THEN
    ALTER POLICY "Users can view their contact family history" ON public.contact_family_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_influence' AND p.polname='Owner or admin can delete contact_influence') THEN
    ALTER POLICY "Owner or admin can delete contact_influence" ON public.contact_influence USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_influence' AND p.polname='Owner or admin can insert contact_influence') THEN
    ALTER POLICY "Owner or admin can insert contact_influence" ON public.contact_influence WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_influence' AND p.polname='Owner or admin can select contact_influence') THEN
    ALTER POLICY "Owner or admin can select contact_influence" ON public.contact_influence USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_influence' AND p.polname='Owner or admin can update contact_influence') THEN
    ALTER POLICY "Owner or admin can update contact_influence" ON public.contact_influence USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_metaprograms' AND p.polname='Owner or admin can delete contact_metaprograms') THEN
    ALTER POLICY "Owner or admin can delete contact_metaprograms" ON public.contact_metaprograms USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_metaprograms' AND p.polname='Owner or admin can insert contact_metaprograms') THEN
    ALTER POLICY "Owner or admin can insert contact_metaprograms" ON public.contact_metaprograms WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_metaprograms' AND p.polname='Owner or admin can select contact_metaprograms') THEN
    ALTER POLICY "Owner or admin can select contact_metaprograms" ON public.contact_metaprograms USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_metaprograms' AND p.polname='Owner or admin can update contact_metaprograms') THEN
    ALTER POLICY "Owner or admin can update contact_metaprograms" ON public.contact_metaprograms USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_next_actions' AND p.polname='Users can delete their own next actions') THEN
    ALTER POLICY "Users can delete their own next actions" ON public.contact_next_actions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_next_actions' AND p.polname='Users can insert their own next actions') THEN
    ALTER POLICY "Users can insert their own next actions" ON public.contact_next_actions WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_next_actions' AND p.polname='Users can update their own next actions') THEN
    ALTER POLICY "Users can update their own next actions" ON public.contact_next_actions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_next_actions' AND p.polname='Users can view their own next actions') THEN
    ALTER POLICY "Users can view their own next actions" ON public.contact_next_actions USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_objection_scripts' AND p.polname='Users can insert objection scripts for their contacts') THEN
    ALTER POLICY "Users can insert objection scripts for their contacts" ON public.contact_objection_scripts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_objection_scripts' AND p.polname='Users can view objection scripts for their contacts') THEN
    ALTER POLICY "Users can view objection scripts for their contacts" ON public.contact_objection_scripts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_personality' AND p.polname='Owner or admin can delete contact_personality') THEN
    ALTER POLICY "Owner or admin can delete contact_personality" ON public.contact_personality USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_personality' AND p.polname='Owner or admin can insert contact_personality') THEN
    ALTER POLICY "Owner or admin can insert contact_personality" ON public.contact_personality WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_personality' AND p.polname='Owner or admin can update contact_personality') THEN
    ALTER POLICY "Owner or admin can update contact_personality" ON public.contact_personality USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_predictive_roadmap' AND p.polname='System can manage predictive roadmap') THEN
    ALTER POLICY "System can manage predictive roadmap" ON public.contact_predictive_roadmap USING ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_predictive_roadmap' AND p.polname='Users can insert roadmap for their contacts') THEN
    ALTER POLICY "Users can insert roadmap for their contacts" ON public.contact_predictive_roadmap WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_predictive_roadmap' AND p.polname='Users can update roadmap for their contacts') THEN
    ALTER POLICY "Users can update roadmap for their contacts" ON public.contact_predictive_roadmap USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_predictive_roadmap' AND p.polname='Users can view predictive roadmap for their contacts') THEN
    ALTER POLICY "Users can view predictive roadmap for their contacts" ON public.contact_predictive_roadmap USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = (select auth.uid())) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_predictive_roadmap' AND p.polname='Users can view roadmap for their contacts') THEN
    ALTER POLICY "Users can view roadmap for their contacts" ON public.contact_predictive_roadmap USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_preferences' AND p.polname='Users can create their own contact preferences') THEN
    ALTER POLICY "Users can create their own contact preferences" ON public.contact_preferences WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_preferences' AND p.polname='Users can delete their own contact preferences') THEN
    ALTER POLICY "Users can delete their own contact preferences" ON public.contact_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_preferences' AND p.polname='Users can update their own contact preferences') THEN
    ALTER POLICY "Users can update their own contact preferences" ON public.contact_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_preferences' AND p.polname='Users can view their own contact preferences') THEN
    ALTER POLICY "Users can view their own contact preferences" ON public.contact_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_preferences_audit' AND p.polname='Users can view their own preferences audit') THEN
    ALTER POLICY "Users can view their own preferences audit" ON public.contact_preferences_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_rapport_strategy' AND p.polname='Owner or admin can delete contact_rapport_strategy') THEN
    ALTER POLICY "Owner or admin can delete contact_rapport_strategy" ON public.contact_rapport_strategy USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_rapport_strategy' AND p.polname='Owner or admin can insert contact_rapport_strategy') THEN
    ALTER POLICY "Owner or admin can insert contact_rapport_strategy" ON public.contact_rapport_strategy WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_rapport_strategy' AND p.polname='Owner or admin can select contact_rapport_strategy') THEN
    ALTER POLICY "Owner or admin can select contact_rapport_strategy" ON public.contact_rapport_strategy USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_rapport_strategy' AND p.polname='Owner or admin can update contact_rapport_strategy') THEN
    ALTER POLICY "Owner or admin can update contact_rapport_strategy" ON public.contact_rapport_strategy USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_relatives' AND p.polname='Users can delete their own contact_relatives') THEN
    ALTER POLICY "Users can delete their own contact_relatives" ON public.contact_relatives USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_relatives' AND p.polname='Users can insert their own contact_relatives') THEN
    ALTER POLICY "Users can insert their own contact_relatives" ON public.contact_relatives WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_relatives' AND p.polname='Users can update their own contact_relatives') THEN
    ALTER POLICY "Users can update their own contact_relatives" ON public.contact_relatives USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_relatives' AND p.polname='Users can view their own contact_relatives') THEN
    ALTER POLICY "Users can view their own contact_relatives" ON public.contact_relatives USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_relatives_audit' AND p.polname='Users can view their own relatives audit') THEN
    ALTER POLICY "Users can view their own relatives audit" ON public.contact_relatives_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_report_overrides' AND p.polname='Users can insert report overrides') THEN
    ALTER POLICY "Users can insert report overrides" ON public.contact_report_overrides WITH CHECK (((select auth.uid()) IS NOT NULL));
  END IF;
END;
$w$;
