-- Generated 2026-07-21T16:17:01Z

CREATE POLICY abm_plans_delete ON public.abm_account_plans AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_plans_insert ON public.abm_account_plans AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY abm_plans_select ON public.abm_account_plans AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_plans_update ON public.abm_account_plans AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_accounts_delete ON public.abm_accounts AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_accounts_insert ON public.abm_accounts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY abm_accounts_select ON public.abm_accounts AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_accounts_update ON public.abm_accounts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_committee_delete ON public.abm_buying_committee AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_committee_insert ON public.abm_buying_committee AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY abm_committee_select ON public.abm_buying_committee AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_committee_update ON public.abm_buying_committee AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_campaigns_delete ON public.abm_campaigns AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_campaigns_insert ON public.abm_campaigns AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY abm_campaigns_select ON public.abm_campaigns AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_campaigns_update ON public.abm_campaigns AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_whitespace_delete ON public.abm_whitespace_opportunities AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_whitespace_insert ON public.abm_whitespace_opportunities AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY abm_whitespace_select ON public.abm_whitespace_opportunities AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY abm_whitespace_update ON public.abm_whitespace_opportunities AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins read blocked logs" ON public.access_blocked_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY service_role_inserts_access_blocked_log ON public.access_blocked_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Users manage own security settings" ON public.access_security_settings AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can delete their own activities" ON public.activities AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own activities" ON public.activities AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own activities" ON public.activities AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own activities" ON public.activities AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own messages" ON public.ai_chat_messages AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own threads" ON public.ai_chat_threads AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own recommendation audit logs" ON public.ai_recommendation_audit_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own recommendation audit logs" ON public.ai_recommendation_audit_logs AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own recommendation audit logs" ON public.ai_recommendation_audit_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own recommendation logs v2" ON public.ai_recommendation_audit_logs_v2 AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own recommendation logs" ON public.ai_recommendation_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own recommendation logs" ON public.ai_recommendation_logs AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own recommendation logs" ON public.ai_recommendation_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own tone preferences" ON public.ai_tone_preferences AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own alerts" ON public.alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own alerts" ON public.alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own alerts" ON public.alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own alerts" ON public.alerts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create own applied responses" ON public.applied_objection_responses AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own applied responses" ON public.applied_objection_responses AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own applied responses" ON public.applied_objection_responses AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own applied responses" ON public.applied_objection_responses AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY amc_owner_all ON public.attribution_models_cache AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY atp_owner_all ON public.attribution_touchpoints AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "System can insert audit logs" ON public.audit_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own audit logs" ON public.audit_log AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_2026_07 AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_2026_08 AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_2026_09 AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_2026_10 AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_2026_11 AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_2026_12 AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY deny_authenticated_direct_access ON public.audit_log_default AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Users can create their own automation logs" ON public.automation_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own automation logs" ON public.automation_logs AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can only update own automation logs" ON public.automation_logs AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own automation logs" ON public.automation_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own automation rules" ON public.automation_rules AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own automation rules" ON public.automation_rules AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own automation rules" ON public.automation_rules AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own automation rules" ON public.automation_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY battle_cards_delete_own ON public.battle_cards AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY battle_cards_insert_own ON public.battle_cards AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY battle_cards_select_own ON public.battle_cards AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY battle_cards_update_own ON public.battle_cards AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins read all insight feedback" ON public.behavioral_insight_feedback AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users delete own insight feedback" ON public.behavioral_insight_feedback AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own insight feedback" ON public.behavioral_insight_feedback AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own insight feedback" ON public.behavioral_insight_feedback AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users update own insight feedback" ON public.behavioral_insight_feedback AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins insert regen queue" ON public.behavioral_profile_regen_queue AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins read all regen queue" ON public.behavioral_profile_regen_queue AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update regen queue" ON public.behavioral_profile_regen_queue AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users read own queue items" ON public.behavioral_profile_regen_queue AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can insert brain dominance analysis" ON public.brain_dominance_analysis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can update brain dominance analysis" ON public.brain_dominance_analysis AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can view brain dominance analysis" ON public.brain_dominance_analysis AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can manage their own call logs" ON public.call_logs AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users manage campaign recipients" ON public.campaign_recipients AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM email_campaigns ec
  WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM email_campaigns ec
  WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = auth.uid())))));
CREATE POLICY "Users manage own canned responses" ON public.canned_responses AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can create their own churn risks" ON public.churn_risk_scores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own churn risks" ON public.churn_risk_scores AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own churn risks" ON public.churn_risk_scores AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own churn risks" ON public.churn_risk_scores AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own cities" ON public.city_whitelist AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can create their own client values" ON public.client_values AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own client values" ON public.client_values AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own client values" ON public.client_values AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own client values" ON public.client_values AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY coaching_scorecards_delete_own ON public.coaching_scorecards AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY coaching_scorecards_insert_own ON public.coaching_scorecards AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY coaching_scorecards_select_own ON public.coaching_scorecards AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY coaching_scorecards_update_own ON public.coaching_scorecards AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own cognitive bias history" ON public.cognitive_bias_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own cognitive bias history" ON public.cognitive_bias_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own cognitive_bias_history" ON public.cognitive_bias_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own cognitive bias history" ON public.cognitive_bias_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own communication preferences" ON public.communication_preferences AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own communication preferences" ON public.communication_preferences AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own communication preferences" ON public.communication_preferences AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own communication preferences" ON public.communication_preferences AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own companies" ON public.companies AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own companies" ON public.companies AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own companies" ON public.companies AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own companies" ON public.companies AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own compatibility alerts" ON public.compatibility_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own compatibility alerts" ON public.compatibility_alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own compatibility alerts" ON public.compatibility_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own compatibility alerts" ON public.compatibility_alerts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own compatibility settings" ON public.compatibility_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own compatibility_settings" ON public.compatibility_settings AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own compatibility settings" ON public.compatibility_settings AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own compatibility settings" ON public.compatibility_settings AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "users manage own competitors" ON public.competitors AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins can delete anomalies" ON public.connection_anomalies AS PERMISSIVE FOR DELETE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update anomalies" ON public.connection_anomalies AS PERMISSIVE FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view anomalies" ON public.connection_anomalies AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Only service role inserts anomalies" ON public.connection_anomalies AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "admins manage connection_configs" ON public.connection_configs AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage connection quotas" ON public.connection_quotas AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY users_read_own_connection_quotas ON public.connection_quotas AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM incoming_webhooks w
  WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = auth.uid())))));
CREATE POLICY "admins insert connection_test_logs" ON public.connection_test_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins read connection_test_logs" ON public.connection_test_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own profile versions" ON public.contact_analytical_profile_versions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users read own profile versions" ON public.contact_analytical_profile_versions AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage analytical profiles of their contacts" ON public.contact_analytical_profiles AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view analytical profiles of their contacts" ON public.contact_analytical_profiles AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own contact automation settings" ON public.contact_automation_settings AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete contact_behavior" ON public.contact_behavior AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_behavior" ON public.contact_behavior AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_behavior" ON public.contact_behavior AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_behavior" ON public.contact_behavior AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can delete contact_business_context" ON public.contact_business_context AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_business_context" ON public.contact_business_context AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_business_context" ON public.contact_business_context AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_business_context" ON public.contact_business_context AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create their own contact cadence" ON public.contact_cadence AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own contact cadence" ON public.contact_cadence AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own contact cadence" ON public.contact_cadence AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own contact cadence" ON public.contact_cadence AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own cadence audit" ON public.contact_cadence_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete contact_decision_making" ON public.contact_decision_making AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_decision_making" ON public.contact_decision_making AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_decision_making" ON public.contact_decision_making AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_decision_making" ON public.contact_decision_making AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can insert family history" ON public.contact_family_history AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM contacts
  WHERE (contacts.id = contact_family_history.contact_id))));
CREATE POLICY "Users can insert their contact family history" ON public.contact_family_history AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view family history for their contacts" ON public.contact_family_history AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts
  WHERE (contacts.id = contact_family_history.contact_id))));
CREATE POLICY "Users can view their contact family history" ON public.contact_family_history AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete contact_influence" ON public.contact_influence AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_influence" ON public.contact_influence AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_influence" ON public.contact_influence AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_influence" ON public.contact_influence AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can delete contact_metaprograms" ON public.contact_metaprograms AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_metaprograms" ON public.contact_metaprograms AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_metaprograms" ON public.contact_metaprograms AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_metaprograms" ON public.contact_metaprograms AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can delete their own next actions" ON public.contact_next_actions AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own next actions" ON public.contact_next_actions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own next actions" ON public.contact_next_actions AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own next actions" ON public.contact_next_actions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert objection scripts for their contacts" ON public.contact_objection_scripts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view objection scripts for their contacts" ON public.contact_objection_scripts AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete contact_personality" ON public.contact_personality AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_personality" ON public.contact_personality AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_personality" ON public.contact_personality AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_personality" ON public.contact_personality AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "System can manage predictive roadmap" ON public.contact_predictive_roadmap AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));
CREATE POLICY "Users can insert roadmap for their contacts" ON public.contact_predictive_roadmap AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update roadmap for their contacts" ON public.contact_predictive_roadmap AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view predictive roadmap for their contacts" ON public.contact_predictive_roadmap AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = auth.uid()) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))))));
CREATE POLICY "Users can view roadmap for their contacts" ON public.contact_predictive_roadmap AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own contact preferences" ON public.contact_preferences AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own contact preferences" ON public.contact_preferences AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own contact preferences" ON public.contact_preferences AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own contact preferences" ON public.contact_preferences AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own preferences audit" ON public.contact_preferences_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete contact_rapport_strategy" ON public.contact_rapport_strategy AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can insert contact_rapport_strategy" ON public.contact_rapport_strategy AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can select contact_rapport_strategy" ON public.contact_rapport_strategy AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update contact_rapport_strategy" ON public.contact_rapport_strategy AS PERMISSIVE FOR UPDATE TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can delete their own contact_relatives" ON public.contact_relatives AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own contact_relatives" ON public.contact_relatives AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own contact_relatives" ON public.contact_relatives AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own contact_relatives" ON public.contact_relatives AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own relatives audit" ON public.contact_relatives_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert report overrides" ON public.contact_report_overrides AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can update report overrides" ON public.contact_report_overrides AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() IS NOT NULL)) WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can view report overrides" ON public.contact_report_overrides AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can delete their own contact time analysis" ON public.contact_time_analysis AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own contact time analysis" ON public.contact_time_analysis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own contact time analysis" ON public.contact_time_analysis AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own contact time analysis" ON public.contact_time_analysis AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own analysis audit" ON public.contact_time_analysis_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can access their own contacts" ON public.contacts AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own contacts" ON public.contacts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own contacts" ON public.contacts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own contacts" ON public.contacts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own contacts" ON public.contacts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY conv_analyses_delete_own ON public.conversation_analyses AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY conv_analyses_insert_own ON public.conversation_analyses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY conv_analyses_select_own ON public.conversation_analyses AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY conv_analyses_update_own ON public.conversation_analyses AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY conv_topics_delete_own ON public.conversation_topics_catalog AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY conv_topics_insert_own ON public.conversation_topics_catalog AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY conv_topics_select_own ON public.conversation_topics_catalog AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY conv_topics_update_own ON public.conversation_topics_catalog AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "users delete own conv cache" ON public.conversational_search_cache AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "users insert own conv cache" ON public.conversational_search_cache AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "users read own conv cache" ON public.conversational_search_cache AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "users update own conv cache" ON public.conversational_search_cache AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own alerts" ON public.crm_alerts AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own automation logs" ON public.crm_automation_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own reprocess queue" ON public.crm_automation_reprocess_queue AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() IN ( SELECT crm_automation_logs.user_id
   FROM crm_automation_logs
  WHERE (crm_automation_logs.id = crm_automation_reprocess_queue.log_id))));
CREATE POLICY "Users can manage their own cadence rules" ON public.crm_cadence_rules AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own consent logs" ON public.crm_consent_audit_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own overrides" ON public.crm_metric_overrides AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Enable all for authenticated users" ON public.crm_objection_intelligence AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "System can manage objection intelligence" ON public.crm_objection_intelligence AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));
CREATE POLICY "Users can view objection intelligence for their contacts" ON public.crm_objection_intelligence AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = crm_objection_intelligence.contact_id) AND ((c.user_id = auth.uid()) OR ((auth.jwt() ->> 'role'::text) = 'service_role'::text))))));
CREATE POLICY "Usuários podem gerenciar inteligência de objeções" ON public.crm_objection_intelligence AS PERMISSIVE FOR ALL TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Usuários podem ver inteligência de objeções" ON public.crm_objection_intelligence AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Users can view their own relationship audit logs" ON public.crm_relationship_audit_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "service role only" ON public.cron_secrets AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY cs_accounts_delete ON public.cs_accounts AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_accounts_insert ON public.cs_accounts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY cs_accounts_select ON public.cs_accounts AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_accounts_update ON public.cs_accounts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_signals_delete ON public.cs_health_signals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_signals_insert ON public.cs_health_signals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY cs_signals_select ON public.cs_health_signals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_signals_update ON public.cs_health_signals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_nps_delete ON public.cs_nps_responses AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_nps_insert ON public.cs_nps_responses AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY cs_nps_select ON public.cs_nps_responses AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_nps_update ON public.cs_nps_responses AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_qbrs_delete ON public.cs_qbrs AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_qbrs_insert ON public.cs_qbrs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY cs_qbrs_select ON public.cs_qbrs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_qbrs_update ON public.cs_qbrs AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_renewals_delete ON public.cs_renewals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_renewals_insert ON public.cs_renewals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY cs_renewals_select ON public.cs_renewals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY cs_renewals_update ON public.cs_renewals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Anon can view own csat surveys" ON public.csat_surveys AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((public_token IS NOT NULL));
CREATE POLICY "Public can answer survey by token" ON public.csat_surveys AS PERMISSIVE FOR UPDATE TO anon, authenticated USING (((public_token IS NOT NULL) AND (status = 'sent'::text) AND ((expires_at IS NULL) OR (expires_at > now())))) WITH CHECK ((status = ANY (ARRAY['answered'::text, 'sent'::text])));
CREATE POLICY "Public can read survey by token" ON public.csat_surveys AS PERMISSIVE FOR SELECT TO anon, authenticated USING (((public_token IS NOT NULL) AND ((expires_at IS NULL) OR (expires_at > now()))));
CREATE POLICY "Users manage own csat surveys" ON public.csat_surveys AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own custom field values" ON public.custom_field_values AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own custom fields" ON public.custom_fields AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own deal_forecasts delete" ON public.deal_forecasts AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own deal_forecasts insert" ON public.deal_forecasts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own deal_forecasts select" ON public.deal_forecasts AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own deal_forecasts update" ON public.deal_forecasts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY owner_all_act ON public.deal_room_activities AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY owner_all_cmt ON public.deal_room_comments AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY owner_all_docs ON public.deal_room_documents AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY owner_all_ms ON public.deal_room_milestones AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY owner_all_sh ON public.deal_room_stakeholders AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY owner_all_rooms ON public.deal_rooms AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own deals" ON public.deals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own deals" ON public.deals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own deals" ON public.deals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own deals" ON public.deals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own decision criteria" ON public.decision_criteria AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own decision criteria" ON public.decision_criteria AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own decision criteria" ON public.decision_criteria AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own decision criteria" ON public.decision_criteria AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users read own device notifications" ON public.device_login_notifications AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can create their own DISC analysis" ON public.disc_analysis_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own DISC analysis" ON public.disc_analysis_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own disc_analysis_history" ON public.disc_analysis_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own DISC analysis history" ON public.disc_analysis_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own DISC audit" ON public.disc_analysis_history_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own DISC communication logs" ON public.disc_communication_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own disc_communication_logs" ON public.disc_communication_logs AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own DISC communication logs" ON public.disc_communication_logs AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own DISC communication logs" ON public.disc_communication_logs AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own DISC conversion metrics" ON public.disc_conversion_metrics AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own DISC conversion metrics" ON public.disc_conversion_metrics AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own DISC conversion metrics" ON public.disc_conversion_metrics AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own DISC conversion metrics" ON public.disc_conversion_metrics AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Authenticated users can view DISC profile configs" ON public.disc_profile_config AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anon can view own document signatures" ON public.document_signatures AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((signature_token IS NOT NULL));
CREATE POLICY "Users delete own signatures" ON public.document_signatures AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own signatures" ON public.document_signatures AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own signatures" ON public.document_signatures AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own signatures" ON public.document_signatures AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own templates" ON public.document_templates AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own templates" ON public.document_templates AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own templates" ON public.document_templates AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own templates" ON public.document_templates AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner views document_views via signature" ON public.document_views AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM document_signatures s
  WHERE ((s.id = document_views.signature_id) AND (s.user_id = auth.uid())))));
CREATE POLICY service_role_inserts_document_views ON public.document_views AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Users manage own documents" ON public.documents AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own campaigns" ON public.email_campaigns AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY efr_delete_own ON public.email_finder_results AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY efr_insert_own ON public.email_finder_results AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY efr_select_own ON public.email_finder_results AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY efr_update_own ON public.email_finder_results AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own email thread summaries" ON public.email_thread_summaries AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own email thread summaries" ON public.email_thread_summaries AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own email thread summaries" ON public.email_thread_summaries AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own email thread summaries" ON public.email_thread_summaries AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY ev_delete_own ON public.email_verifications AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY ev_insert_own ON public.email_verifications AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY ev_select_own ON public.email_verifications AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY ev_update_own ON public.email_verifications AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own emotional anchors" ON public.emotional_anchors AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own emotional anchors" ON public.emotional_anchors AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own emotional anchors" ON public.emotional_anchors AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own emotional anchors" ON public.emotional_anchors AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own emotional states history" ON public.emotional_states_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own emotional states history" ON public.emotional_states_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own emotional_states_history" ON public.emotional_states_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own emotional states history" ON public.emotional_states_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "auth users insert entity_relationships" ON public.entity_relationships AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "auth users read entity_relationships" ON public.entity_relationships AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "creator or admin deletes entity_relationships" ON public.entity_relationships AS PERMISSIVE FOR DELETE TO authenticated USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "creator or admin updates entity_relationships" ON public.entity_relationships AS PERMISSIVE FOR UPDATE TO authenticated USING (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((created_by = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create their own EQ analysis history" ON public.eq_analysis_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own EQ analysis history" ON public.eq_analysis_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own eq_analysis_history" ON public.eq_analysis_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own EQ analysis history" ON public.eq_analysis_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view error logs" ON public.error_logs AS PERMISSIVE FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated users can insert error logs" ON public.error_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() IS NOT NULL));
CREATE POLICY "Users can delete their own favorites" ON public.favorite_templates AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own favorites" ON public.favorite_templates AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own favorites" ON public.favorite_templates AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can delete feature flags" ON public.feature_flags AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert feature flags" ON public.feature_flags AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update feature flags" ON public.feature_flags AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can read feature flags" ON public.feature_flags AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users delete own f360 summaries" ON public.ficha360_conversation_summaries AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own f360 summaries" ON public.ficha360_conversation_summaries AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users see own f360 summaries" ON public.ficha360_conversation_summaries AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own follow-up approvals" ON public.follow_up_approvals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own follow-up approvals" ON public.follow_up_approvals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their follow-up approvals" ON public.follow_up_approvals AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own follow-up approvals" ON public.follow_up_approvals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own follow-up approvals" ON public.follow_up_approvals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own follow-up approvals" ON public.follow_up_approvals_v2 AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own follow-up approvals v2" ON public.follow_up_approvals_v2 AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "own forecast_cat_history insert" ON public.forecast_categories_history AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own forecast_cat_history select" ON public.forecast_categories_history AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own forecast_periods delete" ON public.forecast_periods AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own forecast_periods insert" ON public.forecast_periods AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own forecast_periods select" ON public.forecast_periods AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own forecast_periods update" ON public.forecast_periods AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own quota_settings insert" ON public.forecast_quota_settings AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own quota_settings select" ON public.forecast_quota_settings AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "own quota_settings update" ON public.forecast_quota_settings AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own forecast_snapshots delete" ON public.forecast_snapshots AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "own forecast_snapshots insert" ON public.forecast_snapshots AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "own forecast_snapshots select" ON public.forecast_snapshots AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY fs_owner_all ON public.form_submissions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY fs_public_insert ON public.form_submissions AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM forms f
  WHERE ((f.id = form_submissions.form_id) AND (f.is_published = true) AND (f.user_id = form_submissions.user_id)))));
CREATE POLICY "Anon can view published forms" ON public.forms AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((is_published = true));
CREATE POLICY forms_owner_all ON public.forms AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY forms_public_read_published ON public.forms AS PERMISSIVE FOR SELECT TO public USING ((is_published = true));
CREATE POLICY "Users manage own geo countries" ON public.geo_allowed_countries AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Admins can view all handoff requests" ON public.handoff_requests AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own handoff requests" ON public.handoff_requests AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own handoff requests" ON public.handoff_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own handoff requests" ON public.handoff_requests AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own handoff requests" ON public.handoff_requests AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own health settings" ON public.health_alert_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own health_alert_settings" ON public.health_alert_settings AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own health settings" ON public.health_alert_settings AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own health settings" ON public.health_alert_settings AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own health alerts" ON public.health_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own health alerts" ON public.health_alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own health alerts" ON public.health_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own health alerts" ON public.health_alerts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own hidden objections" ON public.hidden_objections AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own hidden objections" ON public.hidden_objections AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own hidden objections" ON public.hidden_objections AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own hidden objections" ON public.hidden_objections AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins manage DLQ" ON public.incoming_webhook_dlq AS PERMISSIVE FOR ALL TO public USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins read incoming_webhook_logs" ON public.incoming_webhook_logs AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY service_role_inserts_webhook_logs ON public.incoming_webhook_logs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "admins manage incoming_webhooks" ON public.incoming_webhooks AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own insights" ON public.insights AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own insights" ON public.insights AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own insights" ON public.insights AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own insights" ON public.insights AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own intent scores" ON public.intent_scores AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own intent scores" ON public.intent_scores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own intent scores" ON public.intent_scores AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own intent scores" ON public.intent_scores AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own intent signals" ON public.intent_signals AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own intent signals" ON public.intent_signals AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own intent signals" ON public.intent_signals AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own intent signals" ON public.intent_signals AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own pixels" ON public.intent_tracking_pixels AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own pixels" ON public.intent_tracking_pixels AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own pixels" ON public.intent_tracking_pixels AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own pixels" ON public.intent_tracking_pixels AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage summaries of their entities" ON public.interaction_summaries AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view summaries of their entities" ON public.interaction_summaries AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can access their own interactions" ON public.interactions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own interactions" ON public.interactions AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own interactions" ON public.interactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own interactions" ON public.interactions AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own interactions" ON public.interactions AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own interactions audit" ON public.interactions_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own IPs" ON public.ip_whitelist AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users manage own kb articles" ON public.knowledge_base_articles AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "owners read submissions" ON public.landing_page_submissions AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "public can insert submissions to published pages" ON public.landing_page_submissions AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM landing_pages lp
  WHERE ((lp.id = landing_page_submissions.landing_page_id) AND (lp.is_published = true) AND (lp.user_id = landing_page_submissions.user_id)))));
CREATE POLICY "Anon can view published landing pages" ON public.landing_pages AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((is_published = true));
CREATE POLICY "owners manage landing pages" ON public.landing_pages AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "public can read published landing pages" ON public.landing_pages AS PERMISSIVE FOR SELECT TO anon, authenticated USING ((is_published = true));
CREATE POLICY "Admins can view all assignments" ON public.lead_assignments AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own assignments" ON public.lead_assignments AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own assignments" ON public.lead_assignments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own assignments" ON public.lead_assignments AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own assignments" ON public.lead_assignments AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY lmd_owner_read ON public.lead_magnet_downloads AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY lmd_public_insert ON public.lead_magnet_downloads AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM lead_magnets m
  WHERE ((m.id = lead_magnet_downloads.magnet_id) AND (m.is_published = true) AND (m.user_id = lead_magnet_downloads.user_id)))));
CREATE POLICY lm_owner_all ON public.lead_magnets AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY lm_public_read ON public.lead_magnets AS PERMISSIVE FOR SELECT TO public USING ((is_published = true));
CREATE POLICY "Admins can view all routing rules" ON public.lead_routing_rules AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own routing rules" ON public.lead_routing_rules AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own routing rules" ON public.lead_routing_rules AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own routing rules" ON public.lead_routing_rules AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own routing rules" ON public.lead_routing_rules AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own config" ON public.lead_score_config AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own config" ON public.lead_score_config AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own config" ON public.lead_score_config AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own score history" ON public.lead_score_history AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own score history" ON public.lead_score_history AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_queue_insert_own ON public.lead_score_recompute_queue AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY lead_score_queue_select_own ON public.lead_score_recompute_queue AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_rules_delete_own ON public.lead_score_rules AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_rules_insert_own ON public.lead_score_rules AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY lead_score_rules_select_own ON public.lead_score_rules AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_rules_update_own ON public.lead_score_rules AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "auto delete own" ON public.lead_score_threshold_automations AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "auto insert own" ON public.lead_score_threshold_automations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "auto select own" ON public.lead_score_threshold_automations AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "auto update own" ON public.lead_score_threshold_automations AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "log insert own" ON public.lead_score_threshold_log AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "log select own" ON public.lead_score_threshold_log AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_thresholds_delete_own ON public.lead_score_thresholds AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_thresholds_insert_own ON public.lead_score_thresholds AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY lead_score_thresholds_select_own ON public.lead_score_thresholds AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY lead_score_thresholds_update_own ON public.lead_score_thresholds AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own lead scores" ON public.lead_scores AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own lead scores" ON public.lead_scores AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own lead scores" ON public.lead_scores AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own lead scores" ON public.lead_scores AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own life events" ON public.life_events AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own life events" ON public.life_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own life events" ON public.life_events AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own life events" ON public.life_events AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own life events history" ON public.life_events_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins read all attempts" ON public.login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role insert login_attempts" ON public.login_attempts AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Users read own attempts" ON public.login_attempts AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can delete their own lux intelligence" ON public.lux_intelligence AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own lux intelligence" ON public.lux_intelligence AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own lux intelligence" ON public.lux_intelligence AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own lux intelligence" ON public.lux_intelligence AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can delete lux_webhook_config" ON public.lux_webhook_config AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert lux_webhook_config" ON public.lux_webhook_config AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update lux_webhook_config" ON public.lux_webhook_config AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view lux_webhook_config" ON public.lux_webhook_config AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own marketing stats" ON public.marketing_campaign_stats AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own marketing stats" ON public.marketing_campaign_stats AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own marketing stats" ON public.marketing_campaign_stats AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own ROI data" ON public.marketing_roi_data AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own ROI data" ON public.marketing_roi_data AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins read mcp_tool_calls" ON public.mcp_tool_calls AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role insert mcp_tool_calls" ON public.mcp_tool_calls AS PERMISSIVE FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Users can create own meeting summaries" ON public.meeting_summaries AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete own meeting summaries" ON public.meeting_summaries AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can update own meeting summaries" ON public.meeting_summaries AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own meeting summaries" ON public.meeting_summaries AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own metaprogram analysis" ON public.metaprogram_analysis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own metaprogram analysis" ON public.metaprogram_analysis AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own metaprogram_analysis" ON public.metaprogram_analysis AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own metaprogram analysis" ON public.metaprogram_analysis AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY mqlcls_owner_all ON public.mql_classifications AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY mqlc_owner_all ON public.mql_criteria AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own contact's neuro history" ON public.neuro_behavioral_history AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can view their own contact's neuro history" ON public.neuro_behavioral_history AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Owner or admin can insert neuro pnl sessions" ON public.neuro_pnl_sessions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can update neuro pnl sessions" ON public.neuro_pnl_sessions AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can view neuro pnl sessions" ON public.neuro_pnl_sessions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users can insert their own feedback" ON public.nlp_feedback AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own feedback" ON public.nlp_feedback AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own notification logs" ON public.notification_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "self read prefs" ON public.notification_preferences AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "self update prefs" ON public.notification_preferences AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "self upsert prefs" ON public.notification_preferences AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own nurturing enrollments" ON public.nurturing_enrollments AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY ne_owner_all ON public.nurturing_executions AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own nurturing workflows" ON public.nurturing_workflows AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users delete own objection feedback" ON public.objection_example_feedback AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own objection feedback" ON public.objection_example_feedback AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own objection feedback" ON public.objection_example_feedback AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own objection feedback" ON public.objection_example_feedback AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own offer suggestions" ON public.offer_suggestions AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own offer suggestions" ON public.offer_suggestions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own offer suggestions" ON public.offer_suggestions AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own offer suggestions" ON public.offer_suggestions AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins manage reset requests" ON public.password_reset_requests AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users read own reset requests" ON public.password_reset_requests AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY pie_delete_own ON public.people_intelligence_events AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY pie_insert_own ON public.people_intelligence_events AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY pie_select_own ON public.people_intelligence_events AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins manage permissions" ON public.permissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read permissions" ON public.permissions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY pv_delete_own ON public.phone_validations AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY pv_insert_own ON public.phone_validations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY pv_select_own ON public.phone_validations AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY pv_update_own ON public.phone_validations AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Leitura pública de transições" ON public.pipeline_stage_transitions AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Transitions are viewable by everyone authenticated" ON public.pipeline_stage_transitions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage stages of their pipelines" ON public.pipeline_stages AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM pipelines p
  WHERE ((p.id = pipeline_stages.pipeline_id) AND (p.user_id = auth.uid())))));
CREATE POLICY "Users can view stages of their pipelines" ON public.pipeline_stages AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM pipelines p
  WHERE ((p.id = pipeline_stages.pipeline_id) AND (p.user_id = auth.uid())))));
CREATE POLICY "Users can delete their own pipelines" ON public.pipelines AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own pipelines" ON public.pipelines AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own pipelines" ON public.pipelines AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own pipelines" ON public.pipelines AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY playbook_usage_insert_own ON public.playbook_usage_log AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY playbook_usage_select_own ON public.playbook_usage_log AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own profile" ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));
CREATE POLICY "Users can update their own profile" ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Users can view their own profile" ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY "Users can delete their own passo feedbacks" ON public.proximo_passo_feedback AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can insert their own passo feedbacks" ON public.proximo_passo_feedback AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can view their own passo feedbacks" ON public.proximo_passo_feedback AS PERMISSIVE FOR SELECT TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Owner or admin can view psychographic audit logs" ON public.psychographic_audit_log AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = psychographic_audit_log.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can delete their own purchase history" ON public.purchase_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own purchase history" ON public.purchase_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own purchase history" ON public.purchase_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own purchase history" ON public.purchase_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own push subscriptions" ON public.push_subscriptions AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view own subscriptions limited" ON public.push_subscriptions AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own telemetry" ON public.query_telemetry AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own telemetry" ON public.query_telemetry AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own telemetry" ON public.query_telemetry AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view all redistribution logs" ON public.redistribution_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own redistribution logs" ON public.redistribution_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own redistribution logs" ON public.redistribution_log AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own reframing analysis" ON public.reframing_analysis AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own reframing analysis" ON public.reframing_analysis AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own reframing analysis" ON public.reframing_analysis AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own reframing audit" ON public.reframing_analysis_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own alerts" ON public.revops_alerts AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own alerts" ON public.revops_alerts AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own alerts" ON public.revops_alerts AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own alerts" ON public.revops_alerts AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own benchmarks" ON public.revops_benchmarks AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own benchmarks" ON public.revops_benchmarks AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own benchmarks" ON public.revops_benchmarks AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own benchmarks" ON public.revops_benchmarks AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own snapshots" ON public.revops_snapshots AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own snapshots" ON public.revops_snapshots AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users view own snapshots" ON public.revops_snapshots AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own RFM analysis" ON public.rfm_analysis AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own RFM history" ON public.rfm_history AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their RFM metrics" ON public.rfm_metrics AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their RFM segment config" ON public.rfm_segment_config AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins manage role_permissions" ON public.role_permissions AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated read role_permissions" ON public.role_permissions AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY playbooks_delete_own ON public.sales_playbooks AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY playbooks_insert_own ON public.sales_playbooks AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY playbooks_select_own ON public.sales_playbooks AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY playbooks_update_own ON public.sales_playbooks AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can view all team members" ON public.sales_team_members AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can delete their own team members" ON public.sales_team_members AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own team members" ON public.sales_team_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own team members" ON public.sales_team_members AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own team members" ON public.sales_team_members AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Admins can update schema drift alerts" ON public.schema_drift_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view schema drift alerts" ON public.schema_drift_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert their own schema drift alerts" ON public.schema_drift_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own score history" ON public.score_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own score history" ON public.score_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own score_history" ON public.score_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own score history" ON public.score_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own products cache" ON public.search_products_cache AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own products cache" ON public.search_products_cache AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own products cache" ON public.search_products_cache AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users view own products cache" ON public.search_products_cache AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Admins can delete secret rotation logs" ON public.secret_rotation_log AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert secret rotation logs" ON public.secret_rotation_log AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view secret rotation logs" ON public.secret_rotation_log AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users delete own search cache" ON public.semantic_search_cache AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own search cache" ON public.semantic_search_cache AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users update own search cache" ON public.semantic_search_cache AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users view own search cache" ON public.semantic_search_cache AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete sentiment annotations" ON public.sentiment_annotations AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update sentiment annotations" ON public.sentiment_annotations AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = created_by) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can view sentiment annotations" ON public.sentiment_annotations AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = created_by) OR (EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = sentiment_annotations.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create their own sentiment annotations" ON public.sentiment_annotations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));
CREATE POLICY "Users manage own enrollments" ON public.sequence_enrollments AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Service role full access seq events" ON public.sequence_events AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));
CREATE POLICY "Users insert own sequence events" ON public.sequence_events AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users view own sequence events" ON public.sequence_events AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Service role full access seq send log" ON public.sequence_send_log AS PERMISSIVE FOR ALL TO public USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text));
CREATE POLICY "Users view own sequence send log" ON public.sequence_send_log AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own sequence steps" ON public.sequence_steps AS PERMISSIVE FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM sequences s
  WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM sequences s
  WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = auth.uid())))));
CREATE POLICY "Users manage own sequences" ON public.sequences AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "self delete notif" ON public.smart_notifications AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "self insert notif" ON public.smart_notifications AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "self read notif" ON public.smart_notifications AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "self update notif" ON public.smart_notifications AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Delete recipients of own SMS campaigns" ON public.sms_campaign_recipients AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Insert recipients of own SMS campaigns" ON public.sms_campaign_recipients AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Update recipients of own SMS campaigns" ON public.sms_campaign_recipients AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "View recipients of own SMS campaigns" ON public.sms_campaign_recipients AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM sms_campaigns c
  WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = auth.uid())))));
CREATE POLICY "Users manage own SMS campaigns" ON public.sms_campaigns AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own SMS opt-outs" ON public.sms_opt_outs AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own SMS templates" ON public.sms_templates AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own social behavior analysis" ON public.social_behavior_analysis AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own social behavior analysis" ON public.social_behavior_analysis AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own social behavior analysis" ON public.social_behavior_analysis AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own social behavior analysis" ON public.social_behavior_analysis AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert consent logs" ON public.social_consent_audit AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own consent logs" ON public.social_consent_audit AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own social life events" ON public.social_life_events AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own social life events" ON public.social_life_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own social life events" ON public.social_life_events AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own social life events" ON public.social_life_events AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own social profiles" ON public.social_profiles AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own social profiles" ON public.social_profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own social profiles" ON public.social_profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own social profiles" ON public.social_profiles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own scraping schedule" ON public.social_scraping_schedule AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own scraping schedule" ON public.social_scraping_schedule AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own scraping schedule" ON public.social_scraping_schedule AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own scraping schedule" ON public.social_scraping_schedule AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can view social sync queue" ON public.social_sync_queue AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = social_sync_queue.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can create their own stakeholder alerts" ON public.stakeholder_alerts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own stakeholder alerts" ON public.stakeholder_alerts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own stakeholder alerts" ON public.stakeholder_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own stakeholder alerts" ON public.stakeholder_alerts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can delete suggested life events" ON public.suggested_life_events AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can update suggested life events" ON public.suggested_life_events AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role))) WITH CHECK (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can view suggested life events" ON public.suggested_life_events AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Service role can manage suggested life events" ON public.suggested_life_events AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Users can insert their own suggested life events" ON public.suggested_life_events AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "System/Users can insert suggested rapport" ON public.suggested_rapport_intel AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM contacts
  WHERE (contacts.id = suggested_rapport_intel.contact_id))));
CREATE POLICY "Users can manage their suggested rapport" ON public.suggested_rapport_intel AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update status of suggested rapport" ON public.suggested_rapport_intel AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM contacts
  WHERE (contacts.id = suggested_rapport_intel.contact_id))));
CREATE POLICY "Users can view suggested rapport for their contacts" ON public.suggested_rapport_intel AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM contacts
  WHERE (contacts.id = suggested_rapport_intel.contact_id))));
CREATE POLICY "Users manage own tickets" ON public.support_tickets AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Admins can acknowledge system alerts" ON public.system_alerts AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view system alerts" ON public.system_alerts AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage system_config" ON public.system_config AS PERMISSIVE FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated reads system_config" ON public.system_config AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can view system health snapshots" ON public.system_health_snapshots AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can insert system health snapshots" ON public.system_health_snapshots AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users manage own ticket comments" ON public.ticket_comments AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can create their own AB tests" ON public.trigger_ab_tests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own AB tests" ON public.trigger_ab_tests AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own AB tests" ON public.trigger_ab_tests AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own AB tests" ON public.trigger_ab_tests AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own bundles" ON public.trigger_bundles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (COALESCE(is_system_bundle, false) = false)));
CREATE POLICY "Users can delete their own bundles" ON public.trigger_bundles AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = user_id) AND (is_system_bundle = false)));
CREATE POLICY "Users can update their own bundles" ON public.trigger_bundles AS PERMISSIVE FOR UPDATE TO authenticated USING (((auth.uid() = user_id) AND (is_system_bundle = false)));
CREATE POLICY "Users can view their own bundles" ON public.trigger_bundles AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR (is_system_bundle = true)));
CREATE POLICY "Users can create their own channel effectiveness" ON public.trigger_channel_effectiveness AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own channel effectiveness" ON public.trigger_channel_effectiveness AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own channel effectiveness" ON public.trigger_channel_effectiveness AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own channel effectiveness" ON public.trigger_channel_effectiveness AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own intensity history" ON public.trigger_intensity_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own intensity history" ON public.trigger_intensity_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own intensity history" ON public.trigger_intensity_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own intensity history" ON public.trigger_intensity_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own trigger usage history" ON public.trigger_usage_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own trigger usage history" ON public.trigger_usage_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own trigger usage history" ON public.trigger_usage_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own trigger usage history" ON public.trigger_usage_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own devices" ON public.user_known_devices AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Admins can delete roles" ON public.user_roles AS PERMISSIVE FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles AS PERMISSIVE FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can view all roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view their own roles" ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users delete own ui prefs" ON public.user_ui_preferences AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users insert own ui prefs" ON public.user_ui_preferences AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users select own ui prefs" ON public.user_ui_preferences AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users update own ui prefs" ON public.user_ui_preferences AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own VAK analysis" ON public.vak_analysis_history AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own VAK analysis" ON public.vak_analysis_history AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can update their own vak_analysis_history" ON public.vak_analysis_history AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own VAK analysis" ON public.vak_analysis_history AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "users insert own validation queue" ON public.validation_queue AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "users update own validation queue" ON public.validation_queue AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id));
CREATE POLICY "users view own validation queue" ON public.validation_queue AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users manage own visit checkins" ON public.visit_checkins AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users manage own webauthn" ON public.webauthn_credentials AS PERMISSIVE FOR ALL TO authenticated USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users can create their own report settings" ON public.weekly_report_settings AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own weekly_report_settings" ON public.weekly_report_settings AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own report settings" ON public.weekly_report_settings AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own report settings" ON public.weekly_report_settings AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can create their own reports" ON public.weekly_reports AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can delete their own weekly_reports" ON public.weekly_reports AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can update their own weekly_reports" ON public.weekly_reports AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can view their own reports" ON public.weekly_reports AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY "Users can insert their own ingestion logs" ON public.whatsapp_ingestion_logs AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can view their own ingestion logs" ON public.whatsapp_ingestion_logs AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own whatsapp_instances" ON public.whatsapp_instances AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own whatsapp_kpis" ON public.whatsapp_kpis AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own whatsapp messages" ON public.whatsapp_messages AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users can manage their own whatsapp_messages" ON public.whatsapp_messages AS PERMISSIVE FOR ALL TO authenticated USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "Owner or admin can insert whatsapp messages index" ON public.whatsapp_messages_index AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Owner or admin can view whatsapp messages index" ON public.whatsapp_messages_index AS PERMISSIVE FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM contacts c
  WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role)));
CREATE POLICY "Users can view transcriptions of their messages" ON public.whatsapp_transcriptions AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM whatsapp_messages m
  WHERE ((m.id = whatsapp_transcriptions.whatsapp_message_id) AND (m.user_id = auth.uid())))));
CREATE POLICY "users delete own insights" ON public.win_loss_insights AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "users insert own insights" ON public.win_loss_insights AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "users view own insights" ON public.win_loss_insights AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "users manage own reasons" ON public.win_loss_reasons AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "users manage own win_loss_records" ON public.win_loss_records AS PERMISSIVE FOR ALL TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
