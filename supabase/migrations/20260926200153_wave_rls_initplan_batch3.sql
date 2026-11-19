DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_report_overrides' AND p.polname='Users can update report overrides') THEN
    ALTER POLICY "Users can update report overrides" ON public.contact_report_overrides USING (((select auth.uid()) IS NOT NULL)) WITH CHECK (((select auth.uid()) IS NOT NULL));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_report_overrides' AND p.polname='Users can view report overrides') THEN
    ALTER POLICY "Users can view report overrides" ON public.contact_report_overrides USING (((select auth.uid()) IS NOT NULL));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_time_analysis' AND p.polname='Users can delete their own contact time analysis') THEN
    ALTER POLICY "Users can delete their own contact time analysis" ON public.contact_time_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_time_analysis' AND p.polname='Users can insert their own contact time analysis') THEN
    ALTER POLICY "Users can insert their own contact time analysis" ON public.contact_time_analysis WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_time_analysis' AND p.polname='Users can update their own contact time analysis') THEN
    ALTER POLICY "Users can update their own contact time analysis" ON public.contact_time_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_time_analysis' AND p.polname='Users can view their own contact time analysis') THEN
    ALTER POLICY "Users can view their own contact time analysis" ON public.contact_time_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contact_time_analysis_audit' AND p.polname='Users can view their own analysis audit') THEN
    ALTER POLICY "Users can view their own analysis audit" ON public.contact_time_analysis_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
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
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contacts' AND p.polname='Users can delete their own contacts') THEN
    ALTER POLICY "Users can delete their own contacts" ON public.contacts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contacts' AND p.polname='Users can insert their own contacts') THEN
    ALTER POLICY "Users can insert their own contacts" ON public.contacts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contacts' AND p.polname='Users can update their own contacts') THEN
    ALTER POLICY "Users can update their own contacts" ON public.contacts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='contacts' AND p.polname='Users can view their own contacts') THEN
    ALTER POLICY "Users can view their own contacts" ON public.contacts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_analyses' AND p.polname='conv_analyses_delete_own') THEN
    ALTER POLICY conv_analyses_delete_own ON public.conversation_analyses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_analyses' AND p.polname='conv_analyses_insert_own') THEN
    ALTER POLICY conv_analyses_insert_own ON public.conversation_analyses WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_analyses' AND p.polname='conv_analyses_select_own') THEN
    ALTER POLICY conv_analyses_select_own ON public.conversation_analyses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_analyses' AND p.polname='conv_analyses_update_own') THEN
    ALTER POLICY conv_analyses_update_own ON public.conversation_analyses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_topics_catalog' AND p.polname='conv_topics_delete_own') THEN
    ALTER POLICY conv_topics_delete_own ON public.conversation_topics_catalog USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_topics_catalog' AND p.polname='conv_topics_insert_own') THEN
    ALTER POLICY conv_topics_insert_own ON public.conversation_topics_catalog WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_topics_catalog' AND p.polname='conv_topics_select_own') THEN
    ALTER POLICY conv_topics_select_own ON public.conversation_topics_catalog USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversation_topics_catalog' AND p.polname='conv_topics_update_own') THEN
    ALTER POLICY conv_topics_update_own ON public.conversation_topics_catalog USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversational_search_cache' AND p.polname='users delete own conv cache') THEN
    ALTER POLICY "users delete own conv cache" ON public.conversational_search_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversational_search_cache' AND p.polname='users insert own conv cache') THEN
    ALTER POLICY "users insert own conv cache" ON public.conversational_search_cache WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversational_search_cache' AND p.polname='users read own conv cache') THEN
    ALTER POLICY "users read own conv cache" ON public.conversational_search_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='conversational_search_cache' AND p.polname='users update own conv cache') THEN
    ALTER POLICY "users update own conv cache" ON public.conversational_search_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_alerts' AND p.polname='Users can manage their own alerts') THEN
    ALTER POLICY "Users can manage their own alerts" ON public.crm_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_automation_logs' AND p.polname='Users can view their own automation logs') THEN
    ALTER POLICY "Users can view their own automation logs" ON public.crm_automation_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_automation_reprocess_queue' AND p.polname='Users can view their own reprocess queue') THEN
    ALTER POLICY "Users can view their own reprocess queue" ON public.crm_automation_reprocess_queue USING (((select auth.uid()) IN ( SELECT crm_automation_logs.user_id
   FROM crm_automation_logs
  WHERE (crm_automation_logs.id = crm_automation_reprocess_queue.log_id))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_cadence_rules' AND p.polname='Users can manage their own cadence rules') THEN
    ALTER POLICY "Users can manage their own cadence rules" ON public.crm_cadence_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_consent_audit_logs' AND p.polname='Users can insert their own consent logs') THEN
    ALTER POLICY "Users can insert their own consent logs" ON public.crm_consent_audit_logs WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_metric_overrides' AND p.polname='Users can manage their own overrides') THEN
    ALTER POLICY "Users can manage their own overrides" ON public.crm_metric_overrides USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_objection_intelligence' AND p.polname='System can manage objection intelligence') THEN
    ALTER POLICY "System can manage objection intelligence" ON public.crm_objection_intelligence USING ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_objection_intelligence' AND p.polname='Users can view objection intelligence for their contacts') THEN
    ALTER POLICY "Users can view objection intelligence for their contacts" ON public.crm_objection_intelligence USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = crm_objection_intelligence.contact_id) AND ((c.user_id = (select auth.uid())) OR (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='crm_relationship_audit_logs' AND p.polname='Users can view their own relationship audit logs') THEN
    ALTER POLICY "Users can view their own relationship audit logs" ON public.crm_relationship_audit_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_accounts' AND p.polname='cs_accounts_delete') THEN
    ALTER POLICY cs_accounts_delete ON public.cs_accounts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_accounts' AND p.polname='cs_accounts_insert') THEN
    ALTER POLICY cs_accounts_insert ON public.cs_accounts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_accounts' AND p.polname='cs_accounts_select') THEN
    ALTER POLICY cs_accounts_select ON public.cs_accounts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_accounts' AND p.polname='cs_accounts_update') THEN
    ALTER POLICY cs_accounts_update ON public.cs_accounts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_health_signals' AND p.polname='cs_signals_delete') THEN
    ALTER POLICY cs_signals_delete ON public.cs_health_signals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_health_signals' AND p.polname='cs_signals_insert') THEN
    ALTER POLICY cs_signals_insert ON public.cs_health_signals WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_health_signals' AND p.polname='cs_signals_select') THEN
    ALTER POLICY cs_signals_select ON public.cs_health_signals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_health_signals' AND p.polname='cs_signals_update') THEN
    ALTER POLICY cs_signals_update ON public.cs_health_signals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_nps_responses' AND p.polname='cs_nps_delete') THEN
    ALTER POLICY cs_nps_delete ON public.cs_nps_responses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_nps_responses' AND p.polname='cs_nps_insert') THEN
    ALTER POLICY cs_nps_insert ON public.cs_nps_responses WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_nps_responses' AND p.polname='cs_nps_select') THEN
    ALTER POLICY cs_nps_select ON public.cs_nps_responses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_nps_responses' AND p.polname='cs_nps_update') THEN
    ALTER POLICY cs_nps_update ON public.cs_nps_responses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_qbrs' AND p.polname='cs_qbrs_delete') THEN
    ALTER POLICY cs_qbrs_delete ON public.cs_qbrs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_qbrs' AND p.polname='cs_qbrs_insert') THEN
    ALTER POLICY cs_qbrs_insert ON public.cs_qbrs WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_qbrs' AND p.polname='cs_qbrs_select') THEN
    ALTER POLICY cs_qbrs_select ON public.cs_qbrs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_qbrs' AND p.polname='cs_qbrs_update') THEN
    ALTER POLICY cs_qbrs_update ON public.cs_qbrs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_renewals' AND p.polname='cs_renewals_delete') THEN
    ALTER POLICY cs_renewals_delete ON public.cs_renewals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_renewals' AND p.polname='cs_renewals_insert') THEN
    ALTER POLICY cs_renewals_insert ON public.cs_renewals WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_renewals' AND p.polname='cs_renewals_select') THEN
    ALTER POLICY cs_renewals_select ON public.cs_renewals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cs_renewals' AND p.polname='cs_renewals_update') THEN
    ALTER POLICY cs_renewals_update ON public.cs_renewals USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='csat_surveys' AND p.polname='Users manage own csat surveys') THEN
    ALTER POLICY "Users manage own csat surveys" ON public.csat_surveys USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='custom_field_values' AND p.polname='Users manage own custom field values') THEN
    ALTER POLICY "Users manage own custom field values" ON public.custom_field_values USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='custom_fields' AND p.polname='Users manage own custom fields') THEN
    ALTER POLICY "Users manage own custom fields" ON public.custom_fields USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
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
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_forecasts' AND p.polname='own deal_forecasts delete') THEN
    ALTER POLICY "own deal_forecasts delete" ON public.deal_forecasts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_forecasts' AND p.polname='own deal_forecasts insert') THEN
    ALTER POLICY "own deal_forecasts insert" ON public.deal_forecasts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_forecasts' AND p.polname='own deal_forecasts select') THEN
    ALTER POLICY "own deal_forecasts select" ON public.deal_forecasts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_forecasts' AND p.polname='own deal_forecasts update') THEN
    ALTER POLICY "own deal_forecasts update" ON public.deal_forecasts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_room_activities' AND p.polname='owner_all_act') THEN
    ALTER POLICY owner_all_act ON public.deal_room_activities USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_room_comments' AND p.polname='owner_all_cmt') THEN
    ALTER POLICY owner_all_cmt ON public.deal_room_comments USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_room_documents' AND p.polname='owner_all_docs') THEN
    ALTER POLICY owner_all_docs ON public.deal_room_documents USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_room_milestones' AND p.polname='owner_all_ms') THEN
    ALTER POLICY owner_all_ms ON public.deal_room_milestones USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_room_stakeholders' AND p.polname='owner_all_sh') THEN
    ALTER POLICY owner_all_sh ON public.deal_room_stakeholders USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='deal_rooms' AND p.polname='owner_all_rooms') THEN
    ALTER POLICY owner_all_rooms ON public.deal_rooms USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
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
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='decision_criteria' AND p.polname='Users can create their own decision criteria') THEN
    ALTER POLICY "Users can create their own decision criteria" ON public.decision_criteria WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='decision_criteria' AND p.polname='Users can delete their own decision criteria') THEN
    ALTER POLICY "Users can delete their own decision criteria" ON public.decision_criteria USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='decision_criteria' AND p.polname='Users can update their own decision criteria') THEN
    ALTER POLICY "Users can update their own decision criteria" ON public.decision_criteria USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='decision_criteria' AND p.polname='Users can view their own decision criteria') THEN
    ALTER POLICY "Users can view their own decision criteria" ON public.decision_criteria USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='device_login_notifications' AND p.polname='Users read own device notifications') THEN
    ALTER POLICY "Users read own device notifications" ON public.device_login_notifications USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='disc_analysis_history' AND p.polname='Users can create their own DISC analysis') THEN
    ALTER POLICY "Users can create their own DISC analysis" ON public.disc_analysis_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='disc_analysis_history' AND p.polname='Users can delete their own DISC analysis') THEN
    ALTER POLICY "Users can delete their own DISC analysis" ON public.disc_analysis_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
