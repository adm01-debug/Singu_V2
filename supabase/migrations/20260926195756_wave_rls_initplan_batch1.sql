DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_account_plans' AND p.polname='abm_plans_insert') THEN
    ALTER POLICY abm_plans_insert ON public.abm_account_plans WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_account_plans' AND p.polname='abm_plans_select') THEN
    ALTER POLICY abm_plans_select ON public.abm_account_plans USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_account_plans' AND p.polname='abm_plans_update') THEN
    ALTER POLICY abm_plans_update ON public.abm_account_plans USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_accounts' AND p.polname='abm_accounts_delete') THEN
    ALTER POLICY abm_accounts_delete ON public.abm_accounts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_accounts' AND p.polname='abm_accounts_insert') THEN
    ALTER POLICY abm_accounts_insert ON public.abm_accounts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_accounts' AND p.polname='abm_accounts_select') THEN
    ALTER POLICY abm_accounts_select ON public.abm_accounts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_accounts' AND p.polname='abm_accounts_update') THEN
    ALTER POLICY abm_accounts_update ON public.abm_accounts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_buying_committee' AND p.polname='abm_committee_delete') THEN
    ALTER POLICY abm_committee_delete ON public.abm_buying_committee USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_buying_committee' AND p.polname='abm_committee_insert') THEN
    ALTER POLICY abm_committee_insert ON public.abm_buying_committee WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_buying_committee' AND p.polname='abm_committee_select') THEN
    ALTER POLICY abm_committee_select ON public.abm_buying_committee USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_buying_committee' AND p.polname='abm_committee_update') THEN
    ALTER POLICY abm_committee_update ON public.abm_buying_committee USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_campaigns' AND p.polname='abm_campaigns_delete') THEN
    ALTER POLICY abm_campaigns_delete ON public.abm_campaigns USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_campaigns' AND p.polname='abm_campaigns_insert') THEN
    ALTER POLICY abm_campaigns_insert ON public.abm_campaigns WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_campaigns' AND p.polname='abm_campaigns_select') THEN
    ALTER POLICY abm_campaigns_select ON public.abm_campaigns USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_campaigns' AND p.polname='abm_campaigns_update') THEN
    ALTER POLICY abm_campaigns_update ON public.abm_campaigns USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_whitespace_opportunities' AND p.polname='abm_whitespace_delete') THEN
    ALTER POLICY abm_whitespace_delete ON public.abm_whitespace_opportunities USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_whitespace_opportunities' AND p.polname='abm_whitespace_insert') THEN
    ALTER POLICY abm_whitespace_insert ON public.abm_whitespace_opportunities WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_whitespace_opportunities' AND p.polname='abm_whitespace_select') THEN
    ALTER POLICY abm_whitespace_select ON public.abm_whitespace_opportunities USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='abm_whitespace_opportunities' AND p.polname='abm_whitespace_update') THEN
    ALTER POLICY abm_whitespace_update ON public.abm_whitespace_opportunities USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='access_blocked_log' AND p.polname='Admins read blocked logs') THEN
    ALTER POLICY "Admins read blocked logs" ON public.access_blocked_log USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='access_security_settings' AND p.polname='Users manage own security settings') THEN
    ALTER POLICY "Users manage own security settings" ON public.access_security_settings USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='activities' AND p.polname='Users can delete their own activities') THEN
    ALTER POLICY "Users can delete their own activities" ON public.activities USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='activities' AND p.polname='Users can insert their own activities') THEN
    ALTER POLICY "Users can insert their own activities" ON public.activities WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='activities' AND p.polname='Users can update their own activities') THEN
    ALTER POLICY "Users can update their own activities" ON public.activities USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='activities' AND p.polname='Users can view their own activities') THEN
    ALTER POLICY "Users can view their own activities" ON public.activities USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_chat_messages' AND p.polname='Users manage own messages') THEN
    ALTER POLICY "Users manage own messages" ON public.ai_chat_messages USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_chat_threads' AND p.polname='Users manage own threads') THEN
    ALTER POLICY "Users manage own threads" ON public.ai_chat_threads USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_recommendation_audit_logs' AND p.polname='Users can insert their own recommendation audit logs') THEN
    ALTER POLICY "Users can insert their own recommendation audit logs" ON public.ai_recommendation_audit_logs WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_recommendation_audit_logs' AND p.polname='Users can update their own recommendation audit logs') THEN
    ALTER POLICY "Users can update their own recommendation audit logs" ON public.ai_recommendation_audit_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_recommendation_audit_logs' AND p.polname='Users can view their own recommendation audit logs') THEN
    ALTER POLICY "Users can view their own recommendation audit logs" ON public.ai_recommendation_audit_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $migration$
BEGIN
  IF to_regclass('public.ai_recommendation_audit_logs_v2') IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM pg_policy
      WHERE polrelid = to_regclass('public.ai_recommendation_audit_logs_v2')
        AND polname = 'Users can manage their own recommendation logs v2'
    )
  THEN
    ALTER POLICY "Users can manage their own recommendation logs v2"
      ON public.ai_recommendation_audit_logs_v2
      USING (((select auth.uid()) = user_id));
  END IF;
END;
$migration$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_recommendation_logs' AND p.polname='Users can create their own recommendation logs') THEN
    ALTER POLICY "Users can create their own recommendation logs" ON public.ai_recommendation_logs WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_recommendation_logs' AND p.polname='Users can update their own recommendation logs') THEN
    ALTER POLICY "Users can update their own recommendation logs" ON public.ai_recommendation_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_recommendation_logs' AND p.polname='Users can view their own recommendation logs') THEN
    ALTER POLICY "Users can view their own recommendation logs" ON public.ai_recommendation_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='ai_tone_preferences' AND p.polname='Users can manage their own tone preferences') THEN
    ALTER POLICY "Users can manage their own tone preferences" ON public.ai_tone_preferences USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='alerts' AND p.polname='Users can delete their own alerts') THEN
    ALTER POLICY "Users can delete their own alerts" ON public.alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='alerts' AND p.polname='Users can insert their own alerts') THEN
    ALTER POLICY "Users can insert their own alerts" ON public.alerts WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='alerts' AND p.polname='Users can update their own alerts') THEN
    ALTER POLICY "Users can update their own alerts" ON public.alerts USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='applied_objection_responses' AND p.polname='Users can create own applied responses') THEN
    ALTER POLICY "Users can create own applied responses" ON public.applied_objection_responses WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='applied_objection_responses' AND p.polname='Users can delete own applied responses') THEN
    ALTER POLICY "Users can delete own applied responses" ON public.applied_objection_responses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='applied_objection_responses' AND p.polname='Users can view own applied responses') THEN
    ALTER POLICY "Users can view own applied responses" ON public.applied_objection_responses USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='attribution_models_cache' AND p.polname='amc_owner_all') THEN
    ALTER POLICY amc_owner_all ON public.attribution_models_cache USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='attribution_touchpoints' AND p.polname='atp_owner_all') THEN
    ALTER POLICY atp_owner_all ON public.attribution_touchpoints USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='audit_log' AND p.polname='System can insert audit logs') THEN
    ALTER POLICY "System can insert audit logs" ON public.audit_log WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='audit_log' AND p.polname='Users can view their own audit logs') THEN
    ALTER POLICY "Users can view their own audit logs" ON public.audit_log USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_logs' AND p.polname='Users can create their own automation logs') THEN
    ALTER POLICY "Users can create their own automation logs" ON public.automation_logs WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_logs' AND p.polname='Users can delete their own automation logs') THEN
    ALTER POLICY "Users can delete their own automation logs" ON public.automation_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_logs' AND p.polname='Users can only update own automation logs') THEN
    ALTER POLICY "Users can only update own automation logs" ON public.automation_logs USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_logs' AND p.polname='Users can view their own automation logs') THEN
    ALTER POLICY "Users can view their own automation logs" ON public.automation_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_rules' AND p.polname='Users can create their own automation rules') THEN
    ALTER POLICY "Users can create their own automation rules" ON public.automation_rules WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_rules' AND p.polname='Users can delete their own automation rules') THEN
    ALTER POLICY "Users can delete their own automation rules" ON public.automation_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_rules' AND p.polname='Users can update their own automation rules') THEN
    ALTER POLICY "Users can update their own automation rules" ON public.automation_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='automation_rules' AND p.polname='Users can view their own automation rules') THEN
    ALTER POLICY "Users can view their own automation rules" ON public.automation_rules USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='battle_cards' AND p.polname='battle_cards_delete_own') THEN
    ALTER POLICY battle_cards_delete_own ON public.battle_cards USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='battle_cards' AND p.polname='battle_cards_insert_own') THEN
    ALTER POLICY battle_cards_insert_own ON public.battle_cards WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='battle_cards' AND p.polname='battle_cards_select_own') THEN
    ALTER POLICY battle_cards_select_own ON public.battle_cards USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='battle_cards' AND p.polname='battle_cards_update_own') THEN
    ALTER POLICY battle_cards_update_own ON public.battle_cards USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_insight_feedback' AND p.polname='Admins read all insight feedback') THEN
    ALTER POLICY "Admins read all insight feedback" ON public.behavioral_insight_feedback USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_insight_feedback' AND p.polname='Users delete own insight feedback') THEN
    ALTER POLICY "Users delete own insight feedback" ON public.behavioral_insight_feedback USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_insight_feedback' AND p.polname='Users insert own insight feedback') THEN
    ALTER POLICY "Users insert own insight feedback" ON public.behavioral_insight_feedback WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_insight_feedback' AND p.polname='Users read own insight feedback') THEN
    ALTER POLICY "Users read own insight feedback" ON public.behavioral_insight_feedback USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_insight_feedback' AND p.polname='Users update own insight feedback') THEN
    ALTER POLICY "Users update own insight feedback" ON public.behavioral_insight_feedback USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_profile_regen_queue' AND p.polname='Admins insert regen queue') THEN
    ALTER POLICY "Admins insert regen queue" ON public.behavioral_profile_regen_queue WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_profile_regen_queue' AND p.polname='Admins read all regen queue') THEN
    ALTER POLICY "Admins read all regen queue" ON public.behavioral_profile_regen_queue USING (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_profile_regen_queue' AND p.polname='Admins update regen queue') THEN
    ALTER POLICY "Admins update regen queue" ON public.behavioral_profile_regen_queue USING (has_role((select auth.uid()), 'admin'::app_role)) WITH CHECK (has_role((select auth.uid()), 'admin'::app_role));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='behavioral_profile_regen_queue' AND p.polname='Users read own queue items') THEN
    ALTER POLICY "Users read own queue items" ON public.behavioral_profile_regen_queue USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='brain_dominance_analysis' AND p.polname='Owner or admin can insert brain dominance analysis') THEN
    ALTER POLICY "Owner or admin can insert brain dominance analysis" ON public.brain_dominance_analysis WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role)));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='brain_dominance_analysis' AND p.polname='Users can update brain dominance analysis') THEN
    ALTER POLICY "Users can update brain dominance analysis" ON public.brain_dominance_analysis USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='brain_dominance_analysis' AND p.polname='Users can view brain dominance analysis') THEN
    ALTER POLICY "Users can view brain dominance analysis" ON public.brain_dominance_analysis USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='call_logs' AND p.polname='Users can manage their own call logs') THEN
    ALTER POLICY "Users can manage their own call logs" ON public.call_logs USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='campaign_recipients' AND p.polname='Users manage campaign recipients') THEN
    ALTER POLICY "Users manage campaign recipients" ON public.campaign_recipients USING ((EXISTS ( SELECT 1
   FROM email_campaigns ec
  WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM email_campaigns ec
  WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid()))))));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='canned_responses' AND p.polname='Users manage own canned responses') THEN
    ALTER POLICY "Users manage own canned responses" ON public.canned_responses USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='churn_risk_scores' AND p.polname='Users can create their own churn risks') THEN
    ALTER POLICY "Users can create their own churn risks" ON public.churn_risk_scores WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='churn_risk_scores' AND p.polname='Users can delete their own churn risks') THEN
    ALTER POLICY "Users can delete their own churn risks" ON public.churn_risk_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='churn_risk_scores' AND p.polname='Users can update their own churn risks') THEN
    ALTER POLICY "Users can update their own churn risks" ON public.churn_risk_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='churn_risk_scores' AND p.polname='Users can view their own churn risks') THEN
    ALTER POLICY "Users can view their own churn risks" ON public.churn_risk_scores USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='city_whitelist' AND p.polname='Users manage own cities') THEN
    ALTER POLICY "Users manage own cities" ON public.city_whitelist USING ((user_id = (select auth.uid()))) WITH CHECK ((user_id = (select auth.uid())));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='client_values' AND p.polname='Users can create their own client values') THEN
    ALTER POLICY "Users can create their own client values" ON public.client_values WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='client_values' AND p.polname='Users can delete their own client values') THEN
    ALTER POLICY "Users can delete their own client values" ON public.client_values USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='client_values' AND p.polname='Users can update their own client values') THEN
    ALTER POLICY "Users can update their own client values" ON public.client_values USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='client_values' AND p.polname='Users can view their own client values') THEN
    ALTER POLICY "Users can view their own client values" ON public.client_values USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='coaching_scorecards' AND p.polname='coaching_scorecards_delete_own') THEN
    ALTER POLICY coaching_scorecards_delete_own ON public.coaching_scorecards USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='coaching_scorecards' AND p.polname='coaching_scorecards_insert_own') THEN
    ALTER POLICY coaching_scorecards_insert_own ON public.coaching_scorecards WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='coaching_scorecards' AND p.polname='coaching_scorecards_select_own') THEN
    ALTER POLICY coaching_scorecards_select_own ON public.coaching_scorecards USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='coaching_scorecards' AND p.polname='coaching_scorecards_update_own') THEN
    ALTER POLICY coaching_scorecards_update_own ON public.coaching_scorecards USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cognitive_bias_history' AND p.polname='Users can create their own cognitive bias history') THEN
    ALTER POLICY "Users can create their own cognitive bias history" ON public.cognitive_bias_history WITH CHECK (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cognitive_bias_history' AND p.polname='Users can delete their own cognitive bias history') THEN
    ALTER POLICY "Users can delete their own cognitive bias history" ON public.cognitive_bias_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cognitive_bias_history' AND p.polname='Users can update their own cognitive_bias_history') THEN
    ALTER POLICY "Users can update their own cognitive_bias_history" ON public.cognitive_bias_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='cognitive_bias_history' AND p.polname='Users can view their own cognitive bias history') THEN
    ALTER POLICY "Users can view their own cognitive bias history" ON public.cognitive_bias_history USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
DO $w$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
             WHERE c.relname='communication_preferences' AND p.polname='Users can delete their own communication preferences') THEN
    ALTER POLICY "Users can delete their own communication preferences" ON public.communication_preferences USING (((select auth.uid()) = user_id));
  END IF;
END;
$w$;
