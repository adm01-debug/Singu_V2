ALTER POLICY "Users can insert their own communication preferences" ON public.communication_preferences WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own communication preferences" ON public.communication_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own communication preferences" ON public.communication_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own companies" ON public.companies USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own companies" ON public.companies USING (((select auth.uid()) = user_id));
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
ALTER POLICY "Users can create their own compatibility alerts" ON public.compatibility_alerts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own compatibility alerts" ON public.compatibility_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own compatibility alerts" ON public.compatibility_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own compatibility alerts" ON public.compatibility_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own compatibility settings" ON public.compatibility_settings WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own compatibility_settings" ON public.compatibility_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own compatibility settings" ON public.compatibility_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own compatibility settings" ON public.compatibility_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "Admins can delete anomalies" ON public.connection_anomalies USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can update anomalies" ON public.connection_anomalies USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins can view anomalies" ON public.connection_anomalies USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "admins manage connection_configs" ON public.connection_configs USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Admins manage connection quotas" ON public.connection_quotas USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY users_read_own_connection_quotas ON public.connection_quotas USING ((EXISTS ( SELECT 1
   FROM incoming_webhooks w
  WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = (select auth.uid()))))));
ALTER POLICY "admins insert connection_test_logs" ON public.connection_test_logs WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "admins read connection_test_logs" ON public.connection_test_logs USING (has_role((select auth.uid()), 'admin'::app_role));
ALTER POLICY "Users insert own profile versions" ON public.contact_analytical_profile_versions WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users read own profile versions" ON public.contact_analytical_profile_versions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage analytical profiles of their contacts" ON public.contact_analytical_profiles USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view analytical profiles of their contacts" ON public.contact_analytical_profiles USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage their own contact automation settings" ON public.contact_automation_settings USING (((select auth.uid()) = user_id));
ALTER POLICY "Owner or admin can delete contact_behavior" ON public.contact_behavior USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_behavior" ON public.contact_behavior WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can select contact_behavior" ON public.contact_behavior USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_behavior" ON public.contact_behavior USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can delete contact_business_context" ON public.contact_business_context USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_business_context" ON public.contact_business_context WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can select contact_business_context" ON public.contact_business_context USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_business_context" ON public.contact_business_context USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can create their own contact cadence" ON public.contact_cadence WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own contact cadence" ON public.contact_cadence USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own contact cadence" ON public.contact_cadence USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own contact cadence" ON public.contact_cadence USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own cadence audit" ON public.contact_cadence_audit USING (((select auth.uid()) = user_id));
ALTER POLICY "Owner or admin can delete contact_decision_making" ON public.contact_decision_making USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_decision_making" ON public.contact_decision_making WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can select contact_decision_making" ON public.contact_decision_making USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_decision_making" ON public.contact_decision_making USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can insert their contact family history" ON public.contact_family_history WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their contact family history" ON public.contact_family_history USING (((select auth.uid()) = user_id));
ALTER POLICY "Owner or admin can delete contact_influence" ON public.contact_influence USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_influence" ON public.contact_influence WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can select contact_influence" ON public.contact_influence USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_influence" ON public.contact_influence USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can delete contact_metaprograms" ON public.contact_metaprograms USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_metaprograms" ON public.contact_metaprograms WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can select contact_metaprograms" ON public.contact_metaprograms USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_metaprograms" ON public.contact_metaprograms USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can delete their own next actions" ON public.contact_next_actions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own next actions" ON public.contact_next_actions WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own next actions" ON public.contact_next_actions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own next actions" ON public.contact_next_actions USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert objection scripts for their contacts" ON public.contact_objection_scripts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can view objection scripts for their contacts" ON public.contact_objection_scripts USING (((select auth.uid()) = user_id));
ALTER POLICY "Owner or admin can delete contact_personality" ON public.contact_personality USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_personality" ON public.contact_personality WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_personality" ON public.contact_personality USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "System can manage predictive roadmap" ON public.contact_predictive_roadmap USING ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Users can insert roadmap for their contacts" ON public.contact_predictive_roadmap WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update roadmap for their contacts" ON public.contact_predictive_roadmap USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view predictive roadmap for their contacts" ON public.contact_predictive_roadmap USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = (select auth.uid())) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))))));
ALTER POLICY "Users can view roadmap for their contacts" ON public.contact_predictive_roadmap USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can create their own contact preferences" ON public.contact_preferences WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own contact preferences" ON public.contact_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own contact preferences" ON public.contact_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own contact preferences" ON public.contact_preferences USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own preferences audit" ON public.contact_preferences_audit USING (((select auth.uid()) = user_id));
ALTER POLICY "Owner or admin can delete contact_rapport_strategy" ON public.contact_rapport_strategy USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can insert contact_rapport_strategy" ON public.contact_rapport_strategy WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can select contact_rapport_strategy" ON public.contact_rapport_strategy USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Owner or admin can update contact_rapport_strategy" ON public.contact_rapport_strategy USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
ALTER POLICY "Users can delete their own contact_relatives" ON public.contact_relatives USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own contact_relatives" ON public.contact_relatives WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own contact_relatives" ON public.contact_relatives USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own contact_relatives" ON public.contact_relatives USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own relatives audit" ON public.contact_relatives_audit USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert report overrides" ON public.contact_report_overrides WITH CHECK (((select auth.uid()) IS NOT NULL));
