DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='rfm_history' AND p.polname='Users can view their own RFM history') THEN
    ALTER POLICY "Users can view their own RFM history" ON public.rfm_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='rfm_metrics' AND p.polname='Users can view their RFM metrics') THEN
    ALTER POLICY "Users can view their RFM metrics" ON public.rfm_metrics USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='rfm_segment_config' AND p.polname='Users can manage their RFM segment config') THEN
    ALTER POLICY "Users can manage their RFM segment config" ON public.rfm_segment_config USING (((select auth.uid()) = user_id));
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
      ('rodizio_distribuicao_staging', 'admin_insert', false, true),
      ('rodizio_distribuicao_staging', 'admin_select', true, false),
      ('rodizio_distribuicao_staging', 'admin_update', true, true),
      ('rodizio_execucoes', 'admin_insert', false, true),
      ('rodizio_execucoes', 'admin_select', true, false),
      ('rodizio_execucoes', 'admin_update', true, true)
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
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='role_permissions' AND p.polname='Admins manage role_permissions') THEN
    ALTER POLICY "Admins manage role_permissions" ON public.role_permissions USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_playbooks' AND p.polname='playbooks_delete_own') THEN
    ALTER POLICY playbooks_delete_own ON public.sales_playbooks USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_playbooks' AND p.polname='playbooks_insert_own') THEN
    ALTER POLICY playbooks_insert_own ON public.sales_playbooks WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_playbooks' AND p.polname='playbooks_select_own') THEN
    ALTER POLICY playbooks_select_own ON public.sales_playbooks USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_playbooks' AND p.polname='playbooks_update_own') THEN
    ALTER POLICY playbooks_update_own ON public.sales_playbooks USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_team_members' AND p.polname='Admins can view all team members') THEN
    ALTER POLICY "Admins can view all team members" ON public.sales_team_members USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_team_members' AND p.polname='Users can delete their own team members') THEN
    ALTER POLICY "Users can delete their own team members" ON public.sales_team_members USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_team_members' AND p.polname='Users can insert their own team members') THEN
    ALTER POLICY "Users can insert their own team members" ON public.sales_team_members WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_team_members' AND p.polname='Users can update their own team members') THEN
    ALTER POLICY "Users can update their own team members" ON public.sales_team_members USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sales_team_members' AND p.polname='Users can view their own team members') THEN
    ALTER POLICY "Users can view their own team members" ON public.sales_team_members USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='schema_drift_alerts' AND p.polname='Admins can update schema drift alerts') THEN
    ALTER POLICY "Admins can update schema drift alerts" ON public.schema_drift_alerts USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='schema_drift_alerts' AND p.polname='Admins can view schema drift alerts') THEN
    ALTER POLICY "Admins can view schema drift alerts" ON public.schema_drift_alerts USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='schema_drift_alerts' AND p.polname='Users can insert their own schema drift alerts') THEN
    ALTER POLICY "Users can insert their own schema drift alerts" ON public.schema_drift_alerts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='score_history' AND p.polname='Users can delete their own score history') THEN
    ALTER POLICY "Users can delete their own score history" ON public.score_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='score_history' AND p.polname='Users can insert their own score history') THEN
    ALTER POLICY "Users can insert their own score history" ON public.score_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='score_history' AND p.polname='Users can update their own score_history') THEN
    ALTER POLICY "Users can update their own score_history" ON public.score_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='score_history' AND p.polname='Users can view their own score history') THEN
    ALTER POLICY "Users can view their own score history" ON public.score_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='search_products_cache' AND p.polname='Users delete own products cache') THEN
    ALTER POLICY "Users delete own products cache" ON public.search_products_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='search_products_cache' AND p.polname='Users insert own products cache') THEN
    ALTER POLICY "Users insert own products cache" ON public.search_products_cache WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='search_products_cache' AND p.polname='Users update own products cache') THEN
    ALTER POLICY "Users update own products cache" ON public.search_products_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='search_products_cache' AND p.polname='Users view own products cache') THEN
    ALTER POLICY "Users view own products cache" ON public.search_products_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='secret_rotation_log' AND p.polname='Admins can delete secret rotation logs') THEN
    ALTER POLICY "Admins can delete secret rotation logs" ON public.secret_rotation_log USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='secret_rotation_log' AND p.polname='Admins can insert secret rotation logs') THEN
    ALTER POLICY "Admins can insert secret rotation logs" ON public.secret_rotation_log WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='secret_rotation_log' AND p.polname='Admins can view secret rotation logs') THEN
    ALTER POLICY "Admins can view secret rotation logs" ON public.secret_rotation_log USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='semantic_search_cache' AND p.polname='Users delete own search cache') THEN
    ALTER POLICY "Users delete own search cache" ON public.semantic_search_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='semantic_search_cache' AND p.polname='Users insert own search cache') THEN
    ALTER POLICY "Users insert own search cache" ON public.semantic_search_cache WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='semantic_search_cache' AND p.polname='Users update own search cache') THEN
    ALTER POLICY "Users update own search cache" ON public.semantic_search_cache USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='semantic_search_cache' AND p.polname='Users view own search cache') THEN
    ALTER POLICY "Users view own search cache" ON public.semantic_search_cache USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sentiment_annotations' AND p.polname='Owner or admin can delete sentiment annotations') THEN
    ALTER POLICY "Owner or admin can delete sentiment annotations" ON public.sentiment_annotations USING ((((select auth.uid()) = created_by) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sentiment_annotations' AND p.polname='Owner or admin can update sentiment annotations') THEN
    ALTER POLICY "Owner or admin can update sentiment annotations" ON public.sentiment_annotations USING ((((select auth.uid()) = created_by) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sentiment_annotations' AND p.polname='Owner or admin can view sentiment annotations') THEN
    ALTER POLICY "Owner or admin can view sentiment annotations" ON public.sentiment_annotations USING ((((select auth.uid()) = created_by) OR (EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = sentiment_annotations.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sentiment_annotations' AND p.polname='Users can create their own sentiment annotations') THEN
    ALTER POLICY "Users can create their own sentiment annotations" ON public.sentiment_annotations WITH CHECK (((select auth.uid()) = created_by));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_enrollments' AND p.polname='Users manage own enrollments') THEN
    ALTER POLICY "Users manage own enrollments" ON public.sequence_enrollments USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_events' AND p.polname='Service role full access seq events') THEN
    ALTER POLICY "Service role full access seq events" ON public.sequence_events USING ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_events' AND p.polname='Users insert own sequence events') THEN
    ALTER POLICY "Users insert own sequence events" ON public.sequence_events WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_events' AND p.polname='Users view own sequence events') THEN
    ALTER POLICY "Users view own sequence events" ON public.sequence_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_send_log' AND p.polname='Service role full access seq send log') THEN
    ALTER POLICY "Service role full access seq send log" ON public.sequence_send_log USING ((((select auth.jwt()) ->> 'role'::text) = 'service_role'::text));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_send_log' AND p.polname='Users view own sequence send log') THEN
    ALTER POLICY "Users view own sequence send log" ON public.sequence_send_log USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequence_steps' AND p.polname='Users manage own sequence steps') THEN
    ALTER POLICY "Users manage own sequence steps" ON public.sequence_steps USING ((EXISTS ( SELECT 1
   FROM sequences s
  WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = (select auth.uid())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM sequences s
  WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sequences' AND p.polname='Users manage own sequences') THEN
    ALTER POLICY "Users manage own sequences" ON public.sequences USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='smart_notifications' AND p.polname='self delete notif') THEN
    ALTER POLICY "self delete notif" ON public.smart_notifications USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='smart_notifications' AND p.polname='self insert notif') THEN
    ALTER POLICY "self insert notif" ON public.smart_notifications WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='smart_notifications' AND p.polname='self read notif') THEN
    ALTER POLICY "self read notif" ON public.smart_notifications USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='smart_notifications' AND p.polname='self update notif') THEN
    ALTER POLICY "self update notif" ON public.smart_notifications USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_campaign_recipients' AND p.polname='Delete recipients of own SMS campaigns') THEN
    ALTER POLICY "Delete recipients of own SMS campaigns" ON public.sms_campaign_recipients USING ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_campaign_recipients' AND p.polname='Insert recipients of own SMS campaigns') THEN
    ALTER POLICY "Insert recipients of own SMS campaigns" ON public.sms_campaign_recipients WITH CHECK ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_campaign_recipients' AND p.polname='Update recipients of own SMS campaigns') THEN
    ALTER POLICY "Update recipients of own SMS campaigns" ON public.sms_campaign_recipients USING ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_campaign_recipients' AND p.polname='View recipients of own SMS campaigns') THEN
    ALTER POLICY "View recipients of own SMS campaigns" ON public.sms_campaign_recipients USING ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_campaigns' AND p.polname='Users manage own SMS campaigns') THEN
    ALTER POLICY "Users manage own SMS campaigns" ON public.sms_campaigns USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_opt_outs' AND p.polname='Users manage own SMS opt-outs') THEN
    ALTER POLICY "Users manage own SMS opt-outs" ON public.sms_opt_outs USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='sms_templates' AND p.polname='Users manage own SMS templates') THEN
    ALTER POLICY "Users manage own SMS templates" ON public.sms_templates USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_behavior_analysis' AND p.polname='Users can delete their own social behavior analysis') THEN
    ALTER POLICY "Users can delete their own social behavior analysis" ON public.social_behavior_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_behavior_analysis' AND p.polname='Users can insert their own social behavior analysis') THEN
    ALTER POLICY "Users can insert their own social behavior analysis" ON public.social_behavior_analysis WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_behavior_analysis' AND p.polname='Users can update their own social behavior analysis') THEN
    ALTER POLICY "Users can update their own social behavior analysis" ON public.social_behavior_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_behavior_analysis' AND p.polname='Users can view their own social behavior analysis') THEN
    ALTER POLICY "Users can view their own social behavior analysis" ON public.social_behavior_analysis USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_consent_audit' AND p.polname='Users can insert consent logs') THEN
    ALTER POLICY "Users can insert consent logs" ON public.social_consent_audit WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_consent_audit' AND p.polname='Users can view their own consent logs') THEN
    ALTER POLICY "Users can view their own consent logs" ON public.social_consent_audit USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_life_events' AND p.polname='Users can delete their own social life events') THEN
    ALTER POLICY "Users can delete their own social life events" ON public.social_life_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_life_events' AND p.polname='Users can insert their own social life events') THEN
    ALTER POLICY "Users can insert their own social life events" ON public.social_life_events WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_life_events' AND p.polname='Users can update their own social life events') THEN
    ALTER POLICY "Users can update their own social life events" ON public.social_life_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_life_events' AND p.polname='Users can view their own social life events') THEN
    ALTER POLICY "Users can view their own social life events" ON public.social_life_events USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_profiles' AND p.polname='Users can delete their own social profiles') THEN
    ALTER POLICY "Users can delete their own social profiles" ON public.social_profiles USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_profiles' AND p.polname='Users can insert their own social profiles') THEN
    ALTER POLICY "Users can insert their own social profiles" ON public.social_profiles WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_profiles' AND p.polname='Users can update their own social profiles') THEN
    ALTER POLICY "Users can update their own social profiles" ON public.social_profiles USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_profiles' AND p.polname='Users can view their own social profiles') THEN
    ALTER POLICY "Users can view their own social profiles" ON public.social_profiles USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_scraping_schedule' AND p.polname='Users can delete their own scraping schedule') THEN
    ALTER POLICY "Users can delete their own scraping schedule" ON public.social_scraping_schedule USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_scraping_schedule' AND p.polname='Users can insert their own scraping schedule') THEN
    ALTER POLICY "Users can insert their own scraping schedule" ON public.social_scraping_schedule WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_scraping_schedule' AND p.polname='Users can update their own scraping schedule') THEN
    ALTER POLICY "Users can update their own scraping schedule" ON public.social_scraping_schedule USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_scraping_schedule' AND p.polname='Users can view their own scraping schedule') THEN
    ALTER POLICY "Users can view their own scraping schedule" ON public.social_scraping_schedule USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='social_sync_queue' AND p.polname='Owner or admin can view social sync queue') THEN
    ALTER POLICY "Owner or admin can view social sync queue" ON public.social_sync_queue USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = social_sync_queue.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='stakeholder_alerts' AND p.polname='Users can create their own stakeholder alerts') THEN
    ALTER POLICY "Users can create their own stakeholder alerts" ON public.stakeholder_alerts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='stakeholder_alerts' AND p.polname='Users can delete their own stakeholder alerts') THEN
    ALTER POLICY "Users can delete their own stakeholder alerts" ON public.stakeholder_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='stakeholder_alerts' AND p.polname='Users can update their own stakeholder alerts') THEN
    ALTER POLICY "Users can update their own stakeholder alerts" ON public.stakeholder_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='stakeholder_alerts' AND p.polname='Users can view their own stakeholder alerts') THEN
    ALTER POLICY "Users can view their own stakeholder alerts" ON public.stakeholder_alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='suggested_life_events' AND p.polname='Owner or admin can delete suggested life events') THEN
    ALTER POLICY "Owner or admin can delete suggested life events" ON public.suggested_life_events USING ((((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='suggested_life_events' AND p.polname='Owner or admin can update suggested life events') THEN
    ALTER POLICY "Owner or admin can update suggested life events" ON public.suggested_life_events USING ((((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role))) WITH CHECK ((((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='suggested_life_events' AND p.polname='Owner or admin can view suggested life events') THEN
    ALTER POLICY "Owner or admin can view suggested life events" ON public.suggested_life_events USING ((((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='suggested_life_events' AND p.polname='Users can insert their own suggested life events') THEN
    ALTER POLICY "Users can insert their own suggested life events" ON public.suggested_life_events WITH CHECK ((((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='suggested_rapport_intel' AND p.polname='Users can manage their suggested rapport') THEN
    ALTER POLICY "Users can manage their suggested rapport" ON public.suggested_rapport_intel USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='support_tickets' AND p.polname='Users manage own tickets') THEN
    ALTER POLICY "Users manage own tickets" ON public.support_tickets USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relnamespace = 'public'::regnamespace AND c.relname='system_alerts' AND p.polname='Admins can acknowledge system alerts') THEN
    ALTER POLICY "Admins can acknowledge system alerts" ON public.system_alerts USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
