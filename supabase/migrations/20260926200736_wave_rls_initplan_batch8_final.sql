DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='system_alerts' AND p.polname='Admins can view system alerts') THEN
    ALTER POLICY "Admins can view system alerts" ON public.system_alerts USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='system_config' AND p.polname='Admins manage system_config') THEN
    ALTER POLICY "Admins manage system_config" ON public.system_config USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='system_health_snapshots' AND p.polname='Admins can view system health snapshots') THEN
    ALTER POLICY "Admins can view system health snapshots" ON public.system_health_snapshots USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='system_health_snapshots' AND p.polname='Service role can insert system health snapshots') THEN
    ALTER POLICY "Service role can insert system health snapshots" ON public.system_health_snapshots WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ticket_comments' AND p.polname='Users manage own ticket comments') THEN
    ALTER POLICY "Users manage own ticket comments" ON public.ticket_comments USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_ab_tests' AND p.polname='Users can create their own AB tests') THEN
    ALTER POLICY "Users can create their own AB tests" ON public.trigger_ab_tests WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_ab_tests' AND p.polname='Users can delete their own AB tests') THEN
    ALTER POLICY "Users can delete their own AB tests" ON public.trigger_ab_tests USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_ab_tests' AND p.polname='Users can update their own AB tests') THEN
    ALTER POLICY "Users can update their own AB tests" ON public.trigger_ab_tests USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_ab_tests' AND p.polname='Users can view their own AB tests') THEN
    ALTER POLICY "Users can view their own AB tests" ON public.trigger_ab_tests USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_bundles' AND p.polname='Users can create their own bundles') THEN
    ALTER POLICY "Users can create their own bundles" ON public.trigger_bundles WITH CHECK ((((select auth.uid()) = user_id) AND (COALESCE(is_system_bundle, false) = false)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_bundles' AND p.polname='Users can delete their own bundles') THEN
    ALTER POLICY "Users can delete their own bundles" ON public.trigger_bundles USING ((((select auth.uid()) = user_id) AND (is_system_bundle = false)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_bundles' AND p.polname='Users can update their own bundles') THEN
    ALTER POLICY "Users can update their own bundles" ON public.trigger_bundles USING ((((select auth.uid()) = user_id) AND (is_system_bundle = false)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_bundles' AND p.polname='Users can view their own bundles') THEN
    ALTER POLICY "Users can view their own bundles" ON public.trigger_bundles USING ((((select auth.uid()) = user_id) OR (is_system_bundle = true)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_channel_effectiveness' AND p.polname='Users can create their own channel effectiveness') THEN
    ALTER POLICY "Users can create their own channel effectiveness" ON public.trigger_channel_effectiveness WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_channel_effectiveness' AND p.polname='Users can delete their own channel effectiveness') THEN
    ALTER POLICY "Users can delete their own channel effectiveness" ON public.trigger_channel_effectiveness USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_channel_effectiveness' AND p.polname='Users can update their own channel effectiveness') THEN
    ALTER POLICY "Users can update their own channel effectiveness" ON public.trigger_channel_effectiveness USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_channel_effectiveness' AND p.polname='Users can view their own channel effectiveness') THEN
    ALTER POLICY "Users can view their own channel effectiveness" ON public.trigger_channel_effectiveness USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_intensity_history' AND p.polname='Users can create their own intensity history') THEN
    ALTER POLICY "Users can create their own intensity history" ON public.trigger_intensity_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_intensity_history' AND p.polname='Users can delete their own intensity history') THEN
    ALTER POLICY "Users can delete their own intensity history" ON public.trigger_intensity_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_intensity_history' AND p.polname='Users can update their own intensity history') THEN
    ALTER POLICY "Users can update their own intensity history" ON public.trigger_intensity_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_intensity_history' AND p.polname='Users can view their own intensity history') THEN
    ALTER POLICY "Users can view their own intensity history" ON public.trigger_intensity_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_usage_history' AND p.polname='Users can delete their own trigger usage history') THEN
    ALTER POLICY "Users can delete their own trigger usage history" ON public.trigger_usage_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_usage_history' AND p.polname='Users can insert their own trigger usage history') THEN
    ALTER POLICY "Users can insert their own trigger usage history" ON public.trigger_usage_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_usage_history' AND p.polname='Users can update their own trigger usage history') THEN
    ALTER POLICY "Users can update their own trigger usage history" ON public.trigger_usage_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='trigger_usage_history' AND p.polname='Users can view their own trigger usage history') THEN
    ALTER POLICY "Users can view their own trigger usage history" ON public.trigger_usage_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_known_devices' AND p.polname='Users manage own devices') THEN
    ALTER POLICY "Users manage own devices" ON public.user_known_devices USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_roles' AND p.polname='Admins can delete roles') THEN
    ALTER POLICY "Admins can delete roles" ON public.user_roles USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_roles' AND p.polname='Admins can insert roles') THEN
    ALTER POLICY "Admins can insert roles" ON public.user_roles WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_roles' AND p.polname='Admins can update roles') THEN
    ALTER POLICY "Admins can update roles" ON public.user_roles USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_roles' AND p.polname='Admins can view all roles') THEN
    ALTER POLICY "Admins can view all roles" ON public.user_roles USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_roles' AND p.polname='Users can view their own roles') THEN
    ALTER POLICY "Users can view their own roles" ON public.user_roles USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_ui_preferences' AND p.polname='Users delete own ui prefs') THEN
    ALTER POLICY "Users delete own ui prefs" ON public.user_ui_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_ui_preferences' AND p.polname='Users insert own ui prefs') THEN
    ALTER POLICY "Users insert own ui prefs" ON public.user_ui_preferences WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_ui_preferences' AND p.polname='Users select own ui prefs') THEN
    ALTER POLICY "Users select own ui prefs" ON public.user_ui_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='user_ui_preferences' AND p.polname='Users update own ui prefs') THEN
    ALTER POLICY "Users update own ui prefs" ON public.user_ui_preferences USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
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
      ('admin_select', true, false),
      ('admin_update', true, true)
    ) AS policies(policy_name, use_using, use_check)
  LOOP
    IF to_regclass('public.users') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM pg_policy
        WHERE polrelid = to_regclass('public.users')
          AND polname = policy_definition.policy_name
      )
    THEN
      clauses := ' USING ((SELECT has_role((select auth.uid()), ''admin''::app_role) AS has_role))';
      IF policy_definition.use_check THEN
        clauses := clauses || ' WITH CHECK ((SELECT has_role((select auth.uid()), ''admin''::app_role) AS has_role))';
      END IF;

      EXECUTE format(
        'ALTER POLICY %I ON public.users%s',
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
             WHERE c.relname='vak_analysis_history' AND p.polname='Users can delete their own VAK analysis') THEN
    ALTER POLICY "Users can delete their own VAK analysis" ON public.vak_analysis_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='vak_analysis_history' AND p.polname='Users can insert their own VAK analysis') THEN
    ALTER POLICY "Users can insert their own VAK analysis" ON public.vak_analysis_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='vak_analysis_history' AND p.polname='Users can update their own vak_analysis_history') THEN
    ALTER POLICY "Users can update their own vak_analysis_history" ON public.vak_analysis_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='vak_analysis_history' AND p.polname='Users can view their own VAK analysis') THEN
    ALTER POLICY "Users can view their own VAK analysis" ON public.vak_analysis_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='validation_queue' AND p.polname='users insert own validation queue') THEN
    ALTER POLICY "users insert own validation queue" ON public.validation_queue WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='validation_queue' AND p.polname='users update own validation queue') THEN
    ALTER POLICY "users update own validation queue" ON public.validation_queue USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='validation_queue' AND p.polname='users view own validation queue') THEN
    ALTER POLICY "users view own validation queue" ON public.validation_queue USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='visit_checkins' AND p.polname='Users manage own visit checkins') THEN
    ALTER POLICY "Users manage own visit checkins" ON public.visit_checkins USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='webauthn_credentials' AND p.polname='Users manage own webauthn') THEN
    ALTER POLICY "Users manage own webauthn" ON public.webauthn_credentials USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_report_settings' AND p.polname='Users can create their own report settings') THEN
    ALTER POLICY "Users can create their own report settings" ON public.weekly_report_settings WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_report_settings' AND p.polname='Users can delete their own weekly_report_settings') THEN
    ALTER POLICY "Users can delete their own weekly_report_settings" ON public.weekly_report_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_report_settings' AND p.polname='Users can update their own report settings') THEN
    ALTER POLICY "Users can update their own report settings" ON public.weekly_report_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_report_settings' AND p.polname='Users can view their own report settings') THEN
    ALTER POLICY "Users can view their own report settings" ON public.weekly_report_settings USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_reports' AND p.polname='Users can create their own reports') THEN
    ALTER POLICY "Users can create their own reports" ON public.weekly_reports WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_reports' AND p.polname='Users can delete their own weekly_reports') THEN
    ALTER POLICY "Users can delete their own weekly_reports" ON public.weekly_reports USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_reports' AND p.polname='Users can update their own weekly_reports') THEN
    ALTER POLICY "Users can update their own weekly_reports" ON public.weekly_reports USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='weekly_reports' AND p.polname='Users can view their own reports') THEN
    ALTER POLICY "Users can view their own reports" ON public.weekly_reports USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_ingestion_logs' AND p.polname='Users can insert their own ingestion logs') THEN
    ALTER POLICY "Users can insert their own ingestion logs" ON public.whatsapp_ingestion_logs WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_ingestion_logs' AND p.polname='Users can view their own ingestion logs') THEN
    ALTER POLICY "Users can view their own ingestion logs" ON public.whatsapp_ingestion_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_instances' AND p.polname='Users can manage their own whatsapp_instances') THEN
    ALTER POLICY "Users can manage their own whatsapp_instances" ON public.whatsapp_instances USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_kpis' AND p.polname='Users can manage their own whatsapp_kpis') THEN
    ALTER POLICY "Users can manage their own whatsapp_kpis" ON public.whatsapp_kpis USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $migration$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polrelid = to_regclass('public.whatsapp_messages')
      AND polname = 'Users can manage their own whatsapp messages'
  )
  THEN
    ALTER POLICY "Users can manage their own whatsapp messages"
      ON public.whatsapp_messages
      USING (((select auth.uid()) = user_id));
  END IF;
END;
$migration$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_messages' AND p.polname='Users can manage their own whatsapp_messages') THEN
    ALTER POLICY "Users can manage their own whatsapp_messages" ON public.whatsapp_messages USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_messages_index' AND p.polname='Owner or admin can insert whatsapp messages index') THEN
    ALTER POLICY "Owner or admin can insert whatsapp messages index" ON public.whatsapp_messages_index WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_messages_index' AND p.polname='Owner or admin can view whatsapp messages index') THEN
    ALTER POLICY "Owner or admin can view whatsapp messages index" ON public.whatsapp_messages_index USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='whatsapp_transcriptions' AND p.polname='Users can view transcriptions of their messages') THEN
    ALTER POLICY "Users can view transcriptions of their messages" ON public.whatsapp_transcriptions USING ((EXISTS ( SELECT 1
   FROM whatsapp_messages m
  WHERE ((m.id = whatsapp_transcriptions.whatsapp_message_id) AND (m.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='win_loss_insights' AND p.polname='users delete own insights') THEN
    ALTER POLICY "users delete own insights" ON public.win_loss_insights USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='win_loss_insights' AND p.polname='users insert own insights') THEN
    ALTER POLICY "users insert own insights" ON public.win_loss_insights WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='win_loss_insights' AND p.polname='users view own insights') THEN
    ALTER POLICY "users view own insights" ON public.win_loss_insights USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='win_loss_reasons' AND p.polname='users manage own reasons') THEN
    ALTER POLICY "users manage own reasons" ON public.win_loss_reasons USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='win_loss_records' AND p.polname='users manage own win_loss_records') THEN
    ALTER POLICY "users manage own win_loss_records" ON public.win_loss_records USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
