ALTER POLICY "Users can update report overrides" ON public.contact_report_overrides USING (((select auth.uid()) IS NOT NULL)) WITH CHECK (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Users can view report overrides" ON public.contact_report_overrides USING (((select auth.uid()) IS NOT NULL));
ALTER POLICY "Users can delete their own contact time analysis" ON public.contact_time_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own contact time analysis" ON public.contact_time_analysis WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own contact time analysis" ON public.contact_time_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own contact time analysis" ON public.contact_time_analysis USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own analysis audit" ON public.contact_time_analysis_audit USING (((select auth.uid()) = user_id));
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polrelid = to_regclass('public.contacts')
      AND polname = 'Users can access their own contacts'
  )
  THEN
    ALTER POLICY "Users can access their own contacts"
      ON public.contacts
      USING (((select auth.uid()) = user_id));
  END IF;
END;
$migration$;
ALTER POLICY "Users can delete their own contacts" ON public.contacts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own contacts" ON public.contacts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own contacts" ON public.contacts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own contacts" ON public.contacts USING (((select auth.uid()) = user_id));
ALTER POLICY conv_analyses_delete_own ON public.conversation_analyses USING (((select auth.uid()) = user_id));
ALTER POLICY conv_analyses_insert_own ON public.conversation_analyses WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY conv_analyses_select_own ON public.conversation_analyses USING (((select auth.uid()) = user_id));
ALTER POLICY conv_analyses_update_own ON public.conversation_analyses USING (((select auth.uid()) = user_id));
ALTER POLICY conv_topics_delete_own ON public.conversation_topics_catalog USING (((select auth.uid()) = user_id));
ALTER POLICY conv_topics_insert_own ON public.conversation_topics_catalog WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY conv_topics_select_own ON public.conversation_topics_catalog USING (((select auth.uid()) = user_id));
ALTER POLICY conv_topics_update_own ON public.conversation_topics_catalog USING (((select auth.uid()) = user_id));
ALTER POLICY "users delete own conv cache" ON public.conversational_search_cache USING (((select auth.uid()) = user_id));
ALTER POLICY "users insert own conv cache" ON public.conversational_search_cache WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "users read own conv cache" ON public.conversational_search_cache USING (((select auth.uid()) = user_id));
ALTER POLICY "users update own conv cache" ON public.conversational_search_cache USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage their own alerts" ON public.crm_alerts USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own automation logs" ON public.crm_automation_logs USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own reprocess queue" ON public.crm_automation_reprocess_queue USING (((select auth.uid()) IN ( SELECT crm_automation_logs.user_id
   FROM crm_automation_logs
  WHERE (crm_automation_logs.id = crm_automation_reprocess_queue.log_id))));
ALTER POLICY "Users can manage their own cadence rules" ON public.crm_cadence_rules USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can insert their own consent logs" ON public.crm_consent_audit_logs WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can manage their own overrides" ON public.crm_metric_overrides USING (((select auth.uid()) = user_id));
ALTER POLICY "System can manage objection intelligence" ON public.crm_objection_intelligence USING ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));
ALTER POLICY "Users can view objection intelligence for their contacts" ON public.crm_objection_intelligence USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = crm_objection_intelligence.contact_id) AND ((c.user_id = (select auth.uid())) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))))));
ALTER POLICY "Users can view their own relationship audit logs" ON public.crm_relationship_audit_logs USING (((select auth.uid()) = user_id));
ALTER POLICY cs_accounts_delete ON public.cs_accounts USING (((select auth.uid()) = user_id));
ALTER POLICY cs_accounts_insert ON public.cs_accounts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY cs_accounts_select ON public.cs_accounts USING (((select auth.uid()) = user_id));
ALTER POLICY cs_accounts_update ON public.cs_accounts USING (((select auth.uid()) = user_id));
ALTER POLICY cs_signals_delete ON public.cs_health_signals USING (((select auth.uid()) = user_id));
ALTER POLICY cs_signals_insert ON public.cs_health_signals WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY cs_signals_select ON public.cs_health_signals USING (((select auth.uid()) = user_id));
ALTER POLICY cs_signals_update ON public.cs_health_signals USING (((select auth.uid()) = user_id));
ALTER POLICY cs_nps_delete ON public.cs_nps_responses USING (((select auth.uid()) = user_id));
ALTER POLICY cs_nps_insert ON public.cs_nps_responses WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY cs_nps_select ON public.cs_nps_responses USING (((select auth.uid()) = user_id));
ALTER POLICY cs_nps_update ON public.cs_nps_responses USING (((select auth.uid()) = user_id));
ALTER POLICY cs_qbrs_delete ON public.cs_qbrs USING (((select auth.uid()) = user_id));
ALTER POLICY cs_qbrs_insert ON public.cs_qbrs WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY cs_qbrs_select ON public.cs_qbrs USING (((select auth.uid()) = user_id));
ALTER POLICY cs_qbrs_update ON public.cs_qbrs USING (((select auth.uid()) = user_id));
ALTER POLICY cs_renewals_delete ON public.cs_renewals USING (((select auth.uid()) = user_id));
ALTER POLICY cs_renewals_insert ON public.cs_renewals WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY cs_renewals_select ON public.cs_renewals USING (((select auth.uid()) = user_id));
ALTER POLICY cs_renewals_update ON public.cs_renewals USING (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own csat surveys" ON public.csat_surveys USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own custom field values" ON public.custom_field_values USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users manage own custom fields" ON public.custom_fields USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
DO $migration$
DECLARE
  policy_definition record;
  clauses text;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('customer_events', 'admin_insert', false, true),
      ('customer_ownership_history', 'admin_insert', false, true),
      ('customer_ownership_history', 'admin_update', true, true),
      ('customer_purchases', 'admin_select', true, false),
      ('customer_rotation_state', 'admin_insert', false, true),
      ('customer_rotation_state', 'admin_select', true, false),
      ('customer_rotation_state', 'admin_update', true, true),
      ('customer_sdr_history', 'admin_insert', false, true),
      ('customer_sdr_history', 'admin_update', true, true),
      ('customers', 'customers_delete', true, false),
      ('customers', 'customers_insert', false, true),
      ('customers', 'customers_select', true, false),
      ('customers', 'customers_update', true, true)
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
ALTER POLICY "own deal_forecasts delete" ON public.deal_forecasts USING (((select auth.uid()) = user_id));
ALTER POLICY "own deal_forecasts insert" ON public.deal_forecasts WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "own deal_forecasts select" ON public.deal_forecasts USING (((select auth.uid()) = user_id));
ALTER POLICY "own deal_forecasts update" ON public.deal_forecasts USING (((select auth.uid()) = user_id));
ALTER POLICY owner_all_act ON public.deal_room_activities USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY owner_all_cmt ON public.deal_room_comments USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY owner_all_docs ON public.deal_room_documents USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY owner_all_ms ON public.deal_room_milestones USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY owner_all_sh ON public.deal_room_stakeholders USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY owner_all_rooms ON public.deal_rooms USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
DO $migration$
DECLARE
  policy_definition record;
  clauses text;
BEGIN
  FOR policy_definition IN
    SELECT *
    FROM (VALUES
      ('Users can delete their own deals', true, false),
      ('Users can insert their own deals', false, true),
      ('Users can update their own deals', true, false),
      ('Users can view their own deals', true, false)
    ) AS policies(policy_name, use_using, use_check)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM pg_policy
      WHERE polrelid = to_regclass('public.deals')
        AND polname = policy_definition.policy_name
    )
    THEN
      clauses := '';
      IF policy_definition.use_using THEN
        clauses := clauses || ' USING (((select auth.uid()) = user_id))';
      END IF;
      IF policy_definition.use_check THEN
        clauses := clauses || ' WITH CHECK (((select auth.uid()) = user_id))';
      END IF;

      EXECUTE format(
        'ALTER POLICY %I ON public.deals%s',
        policy_definition.policy_name,
        clauses
      );
    END IF;
  END LOOP;
END;
$migration$;
ALTER POLICY "Users can create their own decision criteria" ON public.decision_criteria WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own decision criteria" ON public.decision_criteria USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can update their own decision criteria" ON public.decision_criteria USING (((select auth.uid()) = user_id));
ALTER POLICY "Users can view their own decision criteria" ON public.decision_criteria USING (((select auth.uid()) = user_id));
ALTER POLICY "Users read own device notifications" ON public.device_login_notifications USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
ALTER POLICY "Users can create their own DISC analysis" ON public.disc_analysis_history WITH CHECK (((select auth.uid()) = user_id));
ALTER POLICY "Users can delete their own DISC analysis" ON public.disc_analysis_history USING (((select auth.uid()) = user_id));
