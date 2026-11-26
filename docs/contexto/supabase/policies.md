# Policies (RLS)


Visão consolidada (inclui `storage.objects` e `realtime.messages`); detalhes por tabela em `tables/`.

| tabela | policy | cmd | tipo | roles | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| _dormant.activity_goals | dormant_deny_all_activity_goals | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.api_usage_log | dormant_deny_all_api_usage_log | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.automation_logs | Users can create their own automation logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.automation_logs | Users can delete their own automation logs | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.automation_logs | Users can only update own automation logs | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.automation_logs | Users can view their own automation logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.automation_rules | Users can create their own automation rules | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.automation_rules | Users can delete their own automation rules | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.automation_rules | Users can update their own automation rules | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.automation_rules | Users can view their own automation rules | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.cadences | dormant_deny_all_cadences | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.category_metrics | dormant_deny_all_category_metrics | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.client_values | Users can create their own client values | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.client_values | Users can delete their own client values | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.client_values | Users can update their own client values | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.client_values | Users can view their own client values | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.cognitive_bias_history | Users can create their own cognitive bias history | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.cognitive_bias_history | Users can delete their own cognitive bias history | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.cognitive_bias_history | Users can update their own cognitive_bias_history | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.cognitive_bias_history | Users can view their own cognitive bias history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.cognitive_biases | dormant_deny_all_cognitive_biases | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.collectible_badges | dormant_deny_all_collectible_badges | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.communication_cadence | dormant_deny_all_communication_cadence | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.communication_preferences | dormant_deny_all_communication_preferences | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.compatibility_alerts | Users can create their own compatibility alerts | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.compatibility_alerts | Users can delete their own compatibility alerts | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.compatibility_alerts | Users can update their own compatibility alerts | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.compatibility_alerts | Users can view their own compatibility alerts | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.compatibility_settings | Users can create their own compatibility settings | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.compatibility_settings | Users can delete their own compatibility_settings | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.compatibility_settings | Users can update their own compatibility settings | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.compatibility_settings | Users can view their own compatibility settings | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_availability | dormant_deny_all_contact_availability | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.contact_cadence | Users can create their own contact cadence | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.contact_cadence | Users can delete their own contact cadence | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_cadence | Users can update their own contact cadence | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_cadence | Users can view their own contact cadence | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_compatibility | dormant_deny_all_contact_compatibility | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.contact_metaprograms | dormant_deny_all_contact_metaprograms | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.contact_preferences | Users can create their own contact preferences | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.contact_preferences | Users can delete their own contact preferences | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_preferences | Users can update their own contact preferences | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_preferences | Users can view their own contact preferences | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_relationships | dormant_deny_all_contact_relationships | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.contact_relatives | Users can delete their own contact_relatives | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_relatives | Users can insert their own contact_relatives | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.contact_relatives | Users can update their own contact_relatives | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_relatives | Users can view their own contact_relatives | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_rfm_scores | dormant_deny_all_contact_rfm_scores | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.contact_time_analysis | Users can delete their own contact time analysis | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_time_analysis | Users can insert their own contact time analysis | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.contact_time_analysis | Users can update their own contact time analysis | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_time_analysis | Users can view their own contact time analysis | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.contact_trigger_preferences | dormant_deny_all_contact_trigger_preferences | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.contact_values | dormant_deny_all_contact_values | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.daily_metrics | dormant_deny_all_daily_metrics | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.dashboard_widgets | dormant_deny_all_dashboard_widgets | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.deal_chat_history | dormant_deny_all_deal_chat_history | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.deal_outcomes | dormant_deny_all_deal_outcomes | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.deal_stage_history | dormant_deny_all_deal_stage_history | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.decision_criteria | dormant_deny_all_decision_criteria | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.disc_analysis_history | Users can create their own DISC analysis | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.disc_analysis_history | Users can delete their own DISC analysis | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_analysis_history | Users can update their own disc_analysis_history | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_analysis_history | Users can view their own DISC analysis history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_assessments | dormant_deny_all_disc_assessments | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.disc_communication_logs | Users can create their own DISC communication logs | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.disc_communication_logs | Users can delete their own disc_communication_logs | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_communication_logs | Users can update their own DISC communication logs | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_communication_logs | Users can view their own DISC communication logs | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_compatibility | dormant_deny_all_disc_compatibility | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.disc_conversion_metrics | Users can manage their own DISC conversion metrics | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.disc_interaction_signals | dormant_deny_all_disc_interaction_signals | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.disc_questions | dormant_deny_all_disc_questions | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.emotional_anchors | dormant_deny_all_emotional_anchors | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.emotional_states | dormant_deny_all_emotional_states | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.emotional_states_history | Users can create their own emotional states history | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.emotional_states_history | Users can delete their own emotional states history | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.emotional_states_history | Users can update their own emotional_states_history | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.emotional_states_history | Users can view their own emotional states history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.entity_versions | dormant_deny_all_entity_versions | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.eq_analysis_history | Users can create their own EQ analysis history | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.eq_analysis_history | Users can delete their own EQ analysis history | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.eq_analysis_history | Users can update their own eq_analysis_history | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.eq_analysis_history | Users can view their own EQ analysis history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.favorite_templates | Users can delete their own favorites | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.favorite_templates | Users can insert their own favorites | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.favorite_templates | Users can view their own favorites | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.health_alert_settings | Users can create their own health settings | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.health_alert_settings | Users can delete their own health_alert_settings | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.health_alert_settings | Users can update their own health settings | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.health_alert_settings | Users can view their own health settings | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.health_alerts | dormant_deny_all_health_alerts | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.hidden_objections | Users can create their own hidden objections | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.hidden_objections | Users can delete their own hidden objections | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.hidden_objections | Users can update their own hidden objections | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.hidden_objections | Users can view their own hidden objections | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.inactivity_alerts | dashboard_alert_owner_select | SELECT | PERMISSIVE | authenticated | `(((contact_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = inactivity_alerts.contact_id) AND (c.user_id = auth.uid()) AND (c.deleted_at IS NULL))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = inactivity_alerts.company_id) AND (c.user_id = auth.uid()) AND (c.deleted_at IS NULL))))))` |  |
| _dormant.influence_network | dormant_deny_all_influence_network | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.insights | dormant_deny_all_insights | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.life_events | dormant_deny_all_life_events | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.lux_intelligence | Users can delete their own lux intelligence | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.lux_intelligence | Users can insert their own lux intelligence | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.lux_intelligence | Users can update their own lux intelligence | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.lux_intelligence | Users can view their own lux intelligence | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.metaprogram_analysis | Users can create their own metaprogram analysis | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.metaprogram_analysis | Users can delete their own metaprogram analysis | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.metaprogram_analysis | Users can update their own metaprogram_analysis | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.metaprogram_analysis | Users can view their own metaprogram analysis | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.notes | dormant_deny_all_notes | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.objection_templates | dormant_deny_all_objection_templates | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.objections | dormant_deny_all_objections | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.offer_suggestions | dormant_deny_all_offer_suggestions | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.playbooks | dormant_deny_all_playbooks | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.products | dormant_deny_all_products | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.purchase_history | dormant_deny_all_purchase_history | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.rfm_analysis | Users can manage their own RFM analysis | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.rfm_calculations | dormant_deny_all_rfm_calculations | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.rfm_history | dormant_deny_all_rfm_history | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.rfm_metrics | Users can view their RFM metrics | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.sales_goals | dormant_deny_all_sales_goals | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.salesperson_xp | dormant_deny_all_salesperson_xp | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.saved_filters | Users can delete own filters | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.saved_filters | Users can insert own filters | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.saved_filters | Users can update own filters | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.saved_filters | Users can view own filters | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.score_history | Users can delete their own score history | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.score_history | Users can insert their own score history | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.score_history | Users can update their own score_history | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.score_history | Users can view their own score history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_behavior_analysis | Users can delete their own social behavior analysis | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_behavior_analysis | Users can insert their own social behavior analysis | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.social_behavior_analysis | Users can update their own social behavior analysis | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_behavior_analysis | Users can view their own social behavior analysis | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_life_events | Users can delete their own social life events | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_life_events | Users can insert their own social life events | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.social_life_events | Users can update their own social life events | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_life_events | Users can view their own social life events | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_mentions | dormant_deny_all_social_mentions | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.social_profiles | Users can delete their own social profiles | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_profiles | Users can insert their own social profiles | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.social_profiles | Users can update their own social profiles | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_profiles | Users can view their own social profiles | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_scraping_schedule | Users can delete their own scraping schedule | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_scraping_schedule | Users can insert their own scraping schedule | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.social_scraping_schedule | Users can update their own scraping schedule | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.social_scraping_schedule | Users can view their own scraping schedule | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.stakeholder_alerts | Users can create their own stakeholder alerts | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.stakeholder_alerts | Users can delete their own stakeholder alerts | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.stakeholder_alerts | Users can update their own stakeholder alerts | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.stakeholder_alerts | Users can view their own stakeholder alerts | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.team_closers | dormant_deny_all_team_closers | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.teams | dormant_deny_all_teams | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.time_analysis | dormant_deny_all_time_analysis | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.trigger_ab_tests | Users can create their own AB tests | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.trigger_ab_tests | Users can delete their own AB tests | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_ab_tests | Users can update their own AB tests | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_ab_tests | Users can view their own AB tests | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_channel_effectiveness | Users can create their own channel effectiveness | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.trigger_channel_effectiveness | Users can delete their own channel effectiveness | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_channel_effectiveness | Users can update their own channel effectiveness | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_channel_effectiveness | Users can view their own channel effectiveness | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_intensity_history | Users can create their own intensity history | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.trigger_intensity_history | Users can delete their own intensity history | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_intensity_history | Users can update their own intensity history | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_intensity_history | Users can view their own intensity history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_suggestions | dormant_deny_all_trigger_suggestions | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.trigger_usage_history | Users can delete their own trigger usage history | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_usage_history | Users can insert their own trigger usage history | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.trigger_usage_history | Users can update their own trigger usage history | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_usage_history | Users can view their own trigger usage history | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.trigger_usage_log | dormant_deny_all_trigger_usage_log | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.user_companies_link | dormant_deny_all_user_companies_link | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.user_contacts_link | dormant_deny_all_user_contacts_link | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.user_disc_profile | dormant_deny_all_user_disc_profile | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.vak_analysis_history | Users can delete their own VAK analysis | DELETE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.vak_analysis_history | Users can insert their own VAK analysis | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.vak_analysis_history | Users can update their own vak_analysis_history | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.vak_analysis_history | Users can view their own VAK analysis | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.vak_profiles | dormant_deny_all_vak_profiles | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.victory_feed | dormant_deny_all_victory_feed | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.weekly_report_settings | Users can create their own report settings | INSERT | PERMISSIVE | public |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.weekly_report_settings | Users can delete their own weekly_report_settings | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.weekly_report_settings | Users can update their own report settings | UPDATE | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.weekly_report_settings | Users can view their own report settings | SELECT | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| _dormant.weekly_reports | dormant_deny_all_weekly_reports | ALL | RESTRICTIVE | public | `false` |  |
| _dormant.whatsapp_instances | Users can manage their own whatsapp_instances | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.whatsapp_kpis | Users can manage their own whatsapp_kpis | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.whatsapp_messages | Users can manage their own whatsapp_messages | ALL | PERMISSIVE | public | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| _dormant.xp_history | dormant_deny_all_xp_history | ALL | RESTRICTIVE | public | `false` |  |
| public.abm_account_plans | abm_plans_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.abm_account_plans | abm_plans_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_account_plans | abm_plans_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_accounts | abm_accounts_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_accounts | abm_accounts_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.abm_accounts | abm_accounts_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_accounts | abm_accounts_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_buying_committee | abm_committee_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_buying_committee | abm_committee_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.abm_buying_committee | abm_committee_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_buying_committee | abm_committee_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_campaigns | abm_campaigns_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_campaigns | abm_campaigns_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.abm_campaigns | abm_campaigns_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_campaigns | abm_campaigns_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_whitespace_opportunities | abm_whitespace_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_whitespace_opportunities | abm_whitespace_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.abm_whitespace_opportunities | abm_whitespace_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.abm_whitespace_opportunities | abm_whitespace_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.access_blocked_log | Admins read blocked logs | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.access_blocked_log | access_blocked_log_internal_deny_all | ALL | RESTRICTIVE | anon, authenticated | `false` |  |
| public.access_blocked_log | service_role_inserts_access_blocked_log | INSERT | PERMISSIVE | authenticated |  | `false` |
| public.access_security_settings | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.access_security_settings | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.access_security_settings | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.access_security_settings | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.access_security_settings | Users manage own security settings | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.achievements | achievements_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.activities | Users can delete their own activities | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.activities | Users can insert their own activities | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.activities | Users can update their own activities | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.activities | Users can view their own activities | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.activities | service_role_full_activities | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.activities | singu_activities_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.activities | singu_activities_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.activities | singu_activities_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.activities | singu_activities_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.activity_feed | activity_feed_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.activity_feed | activity_feed_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.activity_feed | activity_feed_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.activity_feed | activity_feed_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.ai_chat_messages | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_chat_messages | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_chat_messages | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_chat_messages | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_chat_messages | Users manage own messages | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_chat_threads | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_chat_threads | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_chat_threads | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_chat_threads | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_chat_threads | Users manage own threads | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_gateway_metrics | Service role manages ai_gateway_metrics | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.ai_recommendation_audit_logs | Users can insert their own recommendation audit logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_recommendation_audit_logs | Users can update their own recommendation audit logs | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_recommendation_audit_logs | Users can view their own recommendation audit logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_recommendation_audit_logs_v2 | Users can manage their own recommendation logs v2 | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_recommendation_logs | Users can create their own recommendation logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ai_recommendation_logs | Users can update their own recommendation logs | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_recommendation_logs | Users can view their own recommendation logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ai_tone_preferences | Users can manage their own tone preferences | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.alert_rules | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.alert_rules | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.alerts | Users can delete their own alerts | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.alerts | Users can insert their own alerts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.alerts | Users can update their own alerts | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.alerts | Users can view their own alerts | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.alerts | service_role_full_alerts | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.alerts | singu_alerts_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.alerts | singu_alerts_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.alerts | singu_alerts_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.alerts | singu_alerts_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.applied_objection_responses | Users can create own applied responses | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.applied_objection_responses | Users can delete own applied responses | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.applied_objection_responses | Users can view own applied responses | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.asia_upload_mapping | asia_upload_mapping_internal_deny_all | ALL | RESTRICTIVE | anon, authenticated | `false` |  |
| public.attribution_models_cache | amc_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.attribution_touchpoints | atp_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.audit_log | System can insert audit logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.audit_log | Users can view their own audit logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.audit_log | audit_log_service | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.automation_executions | automation_executions_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM automation_rules r   WHERE ((r.id = automation_executions.rule_id) AND ((r.user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` |  |
| public.automation_logs | Users can create their own automation logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.automation_logs | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_logs | Users can delete their own automation logs | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_logs | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.automation_logs | Users can only update own automation logs | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.automation_logs | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_logs | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_logs | Users can view their own automation logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | Users can create their own automation rules | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.automation_rules | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | Users can delete their own automation rules | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.automation_rules | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | Users can update their own automation rules | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | Users can view their own automation rules | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.automation_rules | automation_rules_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.automations | automations_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = created_by)` |  |
| public.automations | automations_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = created_by)` |
| public.automations | automations_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = created_by)` |  |
| public.automations | automations_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = created_by)` | `(( SELECT auth.uid() AS uid) = created_by)` |
| public.badges | badges_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.battle_cards | battle_cards_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.battle_cards | battle_cards_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.battle_cards | battle_cards_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.battle_cards | battle_cards_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.behavioral_insight_feedback | Admins read all insight feedback | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.behavioral_insight_feedback | Users delete own insight feedback | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.behavioral_insight_feedback | Users insert own insight feedback | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.behavioral_insight_feedback | Users read own insight feedback | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.behavioral_insight_feedback | Users update own insight feedback | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.behavioral_profile_regen_queue | Admins insert regen queue | INSERT | PERMISSIVE | authenticated |  | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.behavioral_profile_regen_queue | Admins read all regen queue | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.behavioral_profile_regen_queue | Admins update regen queue | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.behavioral_profile_regen_queue | Users read own queue items | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.brain_dominance_analysis | Owner or admin can insert brain dominance analysis | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.brain_dominance_analysis | Users can update brain dominance analysis | UPDATE | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.brain_dominance_analysis | Users can view brain dominance analysis | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.cadence_enrollments | cadence_enrollments_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.cadence_enrollments | cadence_enrollments_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.cadence_enrollments | cadence_enrollments_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.cadence_enrollments | cadence_enrollments_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.calendar_events | Users own data | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.call_logs | Users can manage their own call logs | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.campaign_members | Authenticated read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.campaign_recipients | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.campaign_recipients | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.campaign_recipients | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.campaign_recipients | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.campaign_recipients | Users manage campaign recipients | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM email_campaigns ec   WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = ( SELECT auth.uid() AS uid)))))` | `(EXISTS ( SELECT 1    FROM email_campaigns ec   WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = ( SELECT auth.uid() AS uid)))))` |
| public.campaigns | Authenticated read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.canned_responses | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.canned_responses | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.canned_responses | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.canned_responses | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.canned_responses | Users manage own canned responses | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.carrier_evaluations | carrier_evaluations_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_evaluations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_evaluations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.carrier_evaluations | carrier_evaluations_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.carrier_homologations | carrier_homologations_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_homologations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_homologations.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.carrier_homologations | carrier_homologations_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.carrier_qualification_config | carrier_qualification_config_admin_write | ALL | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.carrier_qualification_config | carrier_qualification_config_authenticated_read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.carrier_score_history | carrier_score_history_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_score_history.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_score_history.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.carrier_score_history | carrier_score_history_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.carrier_scores | carrier_scores_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_scores.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (carriers ca      JOIN companies c ON ((c.id = ca.company_id)))   WHERE ((ca.id = carrier_scores.carrier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.carrier_scores | carrier_scores_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.carriers | carriers_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = carriers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = carriers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.carriers | carriers_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.churn_predictions | churn_predictions_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.churn_predictions | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.churn_risk_factors | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.churn_risk_factors | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.churn_risk_scores | Users can create their own churn risks | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.churn_risk_scores | Users can delete their own churn risks | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.churn_risk_scores | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.churn_risk_scores | Users can update their own churn risks | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.churn_risk_scores | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.churn_risk_scores | Users can view their own churn risks | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cidades | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.cidades | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.city_whitelist | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.city_whitelist | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.city_whitelist | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.city_whitelist | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.city_whitelist | Users manage own cities | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.client_values | Users can create their own client values | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.client_values | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.client_values | Users can delete their own client values | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.client_values | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.client_values | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.client_values | Users can update their own client values | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.client_values | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.client_values | Users can view their own client values | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.clients | clients_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.closing_score_config | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.closing_score_config | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.cnaes | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.cnaes | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.cnpj_cache | Authenticated read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.coaching_scorecards | coaching_scorecards_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.coaching_scorecards | coaching_scorecards_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.coaching_scorecards | coaching_scorecards_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.coaching_scorecards | coaching_scorecards_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cognitive_bias_history | Users can create their own cognitive bias history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.cognitive_bias_history | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cognitive_bias_history | Users can delete their own cognitive bias history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.cognitive_bias_history | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.cognitive_bias_history | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cognitive_bias_history | Users can update their own cognitive_bias_history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.cognitive_bias_history | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cognitive_bias_history | Users can view their own cognitive bias history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.commission_rules | commission_rules_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.commissions | commissions_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.commissions | commissions_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.commissions | commissions_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.commissions | commissions_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.communication_preferences | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.communication_preferences | Users can delete their own communication preferences | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.communication_preferences | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.communication_preferences | Users can insert their own communication preferences | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.communication_preferences | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.communication_preferences | Users can update their own communication preferences | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.communication_preferences | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.communication_preferences | Users can view their own communication preferences | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.companies | Users can delete their own companies | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.companies | Users can insert their own companies | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.companies | Users can update their own companies | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.companies | Users can view their own companies | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.companies | companies_owner_or_admin | ALL | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` | `((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` |
| public.companies | service_role_full_companies | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.companies | singu_companies_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.companies | singu_companies_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.companies | singu_companies_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.companies | singu_companies_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.company_addresses | company_addresses_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.company_addresses | company_addresses_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.company_addresses | company_addresses_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.company_addresses | company_addresses_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.company_addresses | singu_company_relation_owner | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| public.company_addresses | singu_company_relation_scope | ALL | RESTRICTIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_addresses.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| public.company_cadences | company_cadences_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.company_cadences | company_cadences_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.company_cadences | company_cadences_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.company_cadences | company_cadences_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.company_cnaes | company_cnaes_owner_or_admin_mfa_all | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_cnaes.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_cnaes.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.company_cnaes | company_cnaes_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.company_emails | company_emails_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.company_emails | company_emails_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.company_emails | company_emails_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.company_emails | company_emails_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.company_emails | singu_company_relation_owner | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| public.company_emails | singu_company_relation_scope | ALL | RESTRICTIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_emails.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| public.company_phones | company_phones_delete | DELETE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.company_phones | company_phones_insert | INSERT | PERMISSIVE | authenticated |  | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.company_phones | company_phones_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.company_phones | company_phones_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.company_phones | singu_company_relation_owner | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| public.company_phones | singu_company_relation_scope | ALL | RESTRICTIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_phones.company_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role))` |
| public.company_rfm_scores | company_rfm_scores_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.company_rfm_scores | company_rfm_scores_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.company_rfm_scores | company_rfm_scores_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.company_rfm_scores | company_rfm_scores_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.company_social_media | company_social_media_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_social_media.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_social_media.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.company_social_media | company_social_media_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.company_stakeholder_map | company_stakeholder_map_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.company_stakeholder_map | company_stakeholder_map_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.company_stakeholder_map | company_stakeholder_map_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.company_stakeholder_map | company_stakeholder_map_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.company_territories | company_territories_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = company_territories.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.compatibility_alerts | Users can create their own compatibility alerts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.compatibility_alerts | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.compatibility_alerts | Users can delete their own compatibility alerts | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.compatibility_alerts | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.compatibility_alerts | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.compatibility_alerts | Users can update their own compatibility alerts | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.compatibility_alerts | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.compatibility_alerts | Users can view their own compatibility alerts | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.compatibility_settings | Users can create their own compatibility settings | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.compatibility_settings | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.compatibility_settings | Users can delete their own compatibility_settings | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.compatibility_settings | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.compatibility_settings | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.compatibility_settings | Users can update their own compatibility settings | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.compatibility_settings | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.compatibility_settings | Users can view their own compatibility settings | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.competitive_losses | competitive_losses_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((((company_id IS NOT NULL) OR (reported_by = ( SELECT auth.uid() AS uid))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = competitive_losses.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.competitors | competitors_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.config_regras_negocio | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.config_regras_negocio | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.connection_anomalies | Admins can delete anomalies | DELETE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.connection_anomalies | Admins can update anomalies | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.connection_anomalies | Admins can view anomalies | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.connection_anomalies | Only service role inserts anomalies | INSERT | PERMISSIVE | service_role |  | `true` |
| public.connection_configs | admins manage connection_configs | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.connection_quotas | Admins manage connection quotas | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.connection_quotas | users_read_own_connection_quotas | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM incoming_webhooks w   WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = ( SELECT auth.uid() AS uid)))))` |  |
| public.connection_test_logs | admins insert connection_test_logs | INSERT | PERMISSIVE | authenticated |  | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.connection_test_logs | admins read connection_test_logs | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.connector_log | cl_admin_read | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |  |
| public.contact_addresses | contact_addresses_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_addresses.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_addresses.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.contact_addresses | contact_addresses_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.contact_analytical_profile_versions | Users insert own profile versions | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_analytical_profile_versions | Users read own profile versions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_analytical_profiles | Users can manage analytical profiles of their contacts | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_analytical_profiles | Users can view analytical profiles of their contacts | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_automation_settings | Users can manage their own contact automation settings | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_behavior | Owner or admin can delete contact_behavior | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_behavior | Owner or admin can insert contact_behavior | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_behavior | Owner or admin can select contact_behavior | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_behavior | Owner or admin can update contact_behavior | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_business_context | Owner or admin can delete contact_business_context | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_business_context | Owner or admin can insert contact_business_context | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_business_context | Owner or admin can select contact_business_context | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_business_context | Owner or admin can update contact_business_context | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_cadence | Users can create their own contact cadence | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.contact_cadence | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_cadence | Users can delete their own contact cadence | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_cadence | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_cadence | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_cadence | Users can update their own contact cadence | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_cadence | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_cadence | Users can view their own contact cadence | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_cadence_audit | Users can view their own cadence audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_decision_making | Owner or admin can delete contact_decision_making | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_decision_making | Owner or admin can insert contact_decision_making | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_decision_making | Owner or admin can select contact_decision_making | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_decision_making | Owner or admin can update contact_decision_making | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_emails | contact_emails_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.contact_emails | contact_emails_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.contact_emails | contact_emails_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.contact_emails | contact_emails_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.contact_emails | contact_emails_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.contact_emails | contact_relation_active_owner_or_admin | ALL | RESTRICTIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_emails.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_emails.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.contact_family_history | contact_family_history_owner_or_admin_mfa_insert | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_family_history.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.contact_family_history | contact_family_history_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_family_history.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.contact_influence | Owner or admin can delete contact_influence | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_influence | Owner or admin can insert contact_influence | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_influence | Owner or admin can select contact_influence | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_influence | Owner or admin can update contact_influence | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_metaprograms | Owner or admin can delete contact_metaprograms | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_metaprograms | Owner or admin can insert contact_metaprograms | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_metaprograms | Owner or admin can select contact_metaprograms | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_metaprograms | Owner or admin can update contact_metaprograms | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_next_actions | Users can delete their own next actions | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_next_actions | Users can insert their own next actions | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_next_actions | Users can update their own next actions | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_next_actions | Users can view their own next actions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_notes | contact_notes_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_notes | contact_notes_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_notes | contact_notes_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_notes | contact_notes_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_objection_scripts | Users can insert objection scripts for their contacts | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_objection_scripts | Users can view objection scripts for their contacts | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_personality | Owner or admin can delete contact_personality | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_personality | Owner or admin can insert contact_personality | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_personality | Owner or admin can update contact_personality | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_phones | contact_phones_delete | DELETE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.contact_phones | contact_phones_insert | INSERT | PERMISSIVE | authenticated |  | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.contact_phones | contact_phones_owner_access | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))` | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)) AND (c.deleted_at IS NULL))))` |
| public.contact_phones | contact_phones_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.contact_phones | contact_phones_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.contact_phones | contact_relation_active_owner_or_admin | ALL | RESTRICTIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_phones.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.contact_predictive_roadmap | System can manage predictive roadmap | ALL | PERMISSIVE | authenticated | `((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)` |  |
| public.contact_predictive_roadmap | Users can insert roadmap for their contacts | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_predictive_roadmap | Users can update roadmap for their contacts | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_predictive_roadmap | Users can view predictive roadmap for their contacts | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = ( SELECT auth.uid() AS uid)) OR ((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)))))` |  |
| public.contact_predictive_roadmap | Users can view roadmap for their contacts | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_preferences | Users can create their own contact preferences | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.contact_preferences | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_preferences | Users can delete their own contact preferences | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_preferences | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_preferences | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_preferences | Users can update their own contact preferences | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_preferences | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_preferences | Users can view their own contact preferences | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_preferences_audit | Users can view their own preferences audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_rapport_strategy | Owner or admin can delete contact_rapport_strategy | DELETE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_rapport_strategy | Owner or admin can insert contact_rapport_strategy | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_rapport_strategy | Owner or admin can select contact_rapport_strategy | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.contact_rapport_strategy | Owner or admin can update contact_rapport_strategy | UPDATE | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.contact_relatives | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_relatives | Users can delete their own contact_relatives | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_relatives | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_relatives | Users can insert their own contact_relatives | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.contact_relatives | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_relatives | Users can update their own contact_relatives | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_relatives | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_relatives | Users can view their own contact_relatives | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_relatives_audit | Users can view their own relatives audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_report_overrides | Users can insert report overrides | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.contact_report_overrides | Users can update report overrides | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.contact_report_overrides | Users can view report overrides | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.contact_social_media | contact_social_media_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_social_media.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = contact_social_media.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.contact_social_media | contact_social_media_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.contact_time_analysis | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_time_analysis | Users can delete their own contact time analysis | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_time_analysis | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contact_time_analysis | Users can insert their own contact time analysis | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.contact_time_analysis | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_time_analysis | Users can update their own contact time analysis | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_time_analysis | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contact_time_analysis | Users can view their own contact time analysis | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contact_time_analysis_audit | Users can view their own analysis audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contacts | Users can access their own contacts | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contacts | Users can delete their own contacts | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contacts | Users can insert their own contacts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.contacts | Users can update their own contacts | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contacts | Users can view their own contacts | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.contacts | service_role_full_contacts | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.contacts | singu_contacts_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contacts | singu_contacts_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.contacts | singu_contacts_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.contacts | singu_contacts_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversation_analyses | conv_analyses_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversation_analyses | conv_analyses_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.conversation_analyses | conv_analyses_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversation_analyses | conv_analyses_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversation_topics_catalog | conv_topics_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversation_topics_catalog | conv_topics_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.conversation_topics_catalog | conv_topics_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversation_topics_catalog | conv_topics_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversational_search_cache | users delete own conv cache | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversational_search_cache | users insert own conv cache | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.conversational_search_cache | users read own conv cache | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.conversational_search_cache | users update own conv cache | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.coop_sistemas | coop_sistemas_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.crm_alerts | Users can manage their own alerts | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.crm_automation_logs | Users can view their own automation logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.crm_automation_reprocess_queue | Users can view their own reprocess queue | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IN ( SELECT crm_automation_logs.user_id    FROM crm_automation_logs   WHERE (crm_automation_logs.id = crm_automation_reprocess_queue.log_id)))` |  |
| public.crm_cadence_rules | Users can manage their own cadence rules | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.crm_consent_audit_logs | Users can insert their own consent logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.crm_metric_overrides | Users can manage their own overrides | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.crm_objection_intelligence | crm_objection_intelligence_contact_owner_or_admin | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = crm_objection_intelligence.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = crm_objection_intelligence.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` |
| public.crm_relationship_audit_logs | Users can view their own relationship audit logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cron_secrets | service role only | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.cs_accounts | cs_accounts_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_accounts | cs_accounts_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.cs_accounts | cs_accounts_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_accounts | cs_accounts_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_health_signals | cs_signals_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_health_signals | cs_signals_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.cs_health_signals | cs_signals_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_health_signals | cs_signals_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_nps_responses | cs_nps_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_nps_responses | cs_nps_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.cs_nps_responses | cs_nps_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_nps_responses | cs_nps_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_qbrs | cs_qbrs_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_qbrs | cs_qbrs_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.cs_qbrs | cs_qbrs_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_qbrs | cs_qbrs_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_renewals | cs_renewals_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_renewals | cs_renewals_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.cs_renewals | cs_renewals_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.cs_renewals | cs_renewals_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.csat_surveys | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.csat_surveys | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.csat_surveys | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.csat_surveys | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.csat_surveys | Users manage own csat surveys | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.csat_surveys | csat_surveys_owner | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.custom_field_values | Users manage own custom field values | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.custom_field_values | custom_field_values_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.custom_field_values | custom_field_values_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.custom_field_values | custom_field_values_select | SELECT | PERMISSIVE | authenticated | `((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))` |  |
| public.custom_field_values | custom_field_values_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.custom_fields | Users manage own custom fields | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.custom_fields | custom_fields_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.custom_fields | custom_fields_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.custom_fields | custom_fields_select | SELECT | PERMISSIVE | authenticated | `((user_id IS NULL) OR (user_id = ( SELECT auth.uid() AS uid)))` |  |
| public.custom_fields | custom_fields_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.customer_events | customer_events_admin_mfa_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| public.customer_events | customer_events_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((((customer_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((customer_id IS NULL) OR (EXISTS ( SELECT 1    FROM (customers cu      JOIN companies co ON ((co.id = cu.company_id)))   WHERE ((cu.id = customer_events.customer_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid)))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies co   WHERE ((co.id = customer_events.company_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.customer_events | customer_events_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.customer_events | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.customer_health_scores | customer_health_scores_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = customer_health_scores.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.customer_ownership_history | customer_ownership_history_admin_mfa_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |  |
| public.customer_ownership_history | customer_ownership_history_admin_mfa_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| public.customer_ownership_history | customer_ownership_history_admin_mfa_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| public.customer_ownership_history | customer_ownership_history_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((((customer_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((customer_id IS NULL) OR (EXISTS ( SELECT 1    FROM (customers cu      JOIN companies co ON ((co.id = cu.company_id)))   WHERE ((cu.id = customer_ownership_history.customer_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid)))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies co   WHERE ((co.id = customer_ownership_history.company_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.customer_ownership_history | customer_ownership_history_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.customer_ownership_history | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.customer_purchases | admin_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.customer_rotation_state | admin_delete | DELETE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.customer_rotation_state | admin_insert | INSERT | PERMISSIVE | authenticated |  | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.customer_rotation_state | admin_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.customer_rotation_state | admin_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.customer_sdr_history | customer_sdr_history_admin_mfa_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |  |
| public.customer_sdr_history | customer_sdr_history_admin_mfa_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| public.customer_sdr_history | customer_sdr_history_admin_mfa_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| public.customer_sdr_history | customer_sdr_history_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((((customer_id IS NOT NULL) OR (company_id IS NOT NULL)) AND ((customer_id IS NULL) OR (EXISTS ( SELECT 1    FROM (customers cu      JOIN companies co ON ((co.id = cu.company_id)))   WHERE ((cu.id = customer_sdr_history.customer_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid)))))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies co   WHERE ((co.id = customer_sdr_history.company_id) AND (co.deleted_at IS NULL) AND (co.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.customer_sdr_history | customer_sdr_history_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.customer_sdr_history | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.customer_surveys | customer_surveys_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((((company_id IS NOT NULL) OR (contact_id IS NOT NULL)) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = customer_surveys.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = customer_surveys.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.customers | customers_delete | DELETE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.customers | customers_insert | INSERT | PERMISSIVE | authenticated |  | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.customers | customers_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.customers | customers_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.daily_challenges | daily_challenges_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.data_quality_audits | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.data_quality_audits | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.deal_competitors | deal_competitors_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.deal_forecasts | own deal_forecasts delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deal_forecasts | own deal_forecasts insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_forecasts | own deal_forecasts select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deal_forecasts | own deal_forecasts update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deal_items | deal_items_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM deals d   WHERE ((d.id = deal_items.deal_id) AND (d.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.deal_room_activities | owner_all_act | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_room_comments | owner_all_cmt | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_room_documents | owner_all_docs | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_room_milestones | owner_all_ms | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_room_stakeholders | owner_all_sh | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_rooms | owner_all_rooms | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deal_velocity_analysis | deal_velocity_analysis_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.deal_velocity_analysis | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.deals | Users can delete their own deals | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deals | Users can insert their own deals | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deals | Users can update their own deals | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deals | Users can view their own deals | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deals | deals_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deals | deals_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.deals | deals_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.deals | deals_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.decision_criteria | Users can create their own decision criteria | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.decision_criteria | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.decision_criteria | Users can delete their own decision criteria | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.decision_criteria | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.decision_criteria | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.decision_criteria | Users can update their own decision criteria | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.decision_criteria | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.decision_criteria | Users can view their own decision criteria | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.device_login_notifications | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.device_login_notifications | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.device_login_notifications | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.device_login_notifications | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.device_login_notifications | Users read own device notifications | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.disc_analysis_history | Users can create their own DISC analysis | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.disc_analysis_history | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_analysis_history | Users can delete their own DISC analysis | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_analysis_history | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.disc_analysis_history | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_analysis_history | Users can update their own disc_analysis_history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_analysis_history | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_analysis_history | Users can view their own DISC analysis history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_analysis_history_audit | Users can view their own DISC audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_approach_recommendations | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.disc_approach_recommendations | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.disc_communication_logs | Users can create their own DISC communication logs | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.disc_communication_logs | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_communication_logs | Users can delete their own disc_communication_logs | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_communication_logs | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.disc_communication_logs | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_communication_logs | Users can update their own DISC communication logs | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_communication_logs | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_communication_logs | Users can view their own DISC communication logs | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_conversion_metrics | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_conversion_metrics | Users can delete their own DISC conversion metrics | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_conversion_metrics | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.disc_conversion_metrics | Users can insert their own DISC conversion metrics | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.disc_conversion_metrics | Users can manage their own DISC conversion metrics | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_conversion_metrics | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_conversion_metrics | Users can update their own DISC conversion metrics | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_conversion_metrics | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.disc_conversion_metrics | Users can view their own DISC conversion metrics | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.disc_profile_config | Authenticated can read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.disc_profile_config | Authenticated users can view DISC profile configs | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.disc_templates | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.disc_templates | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.document_signatures | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_signatures | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_signatures | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_signatures | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_signatures | Users delete own signatures | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_signatures | Users insert own signatures | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_signatures | Users update own signatures | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_signatures | Users view own signatures | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_templates | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_templates | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_templates | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_templates | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_templates | Users delete own templates | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_templates | Users insert own templates | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_templates | Users update own templates | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_templates | Users view own templates | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_views | Owner views document_views via signature | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM document_signatures s   WHERE ((s.id = document_views.signature_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.document_views | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_views | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_views | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.document_views | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.document_views | service_role_inserts_document_views | INSERT | PERMISSIVE | authenticated |  | `false` |
| public.documents | Users manage own documents | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.documents | documents_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.documents | documents_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.documents | documents_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.documents | documents_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.duplicate_candidates | duplicate_candidates_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.economic_group_members | Authenticated read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.economic_groups | Authenticated read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.email_campaigns | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_campaigns | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_campaigns | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_campaigns | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_campaigns | Users manage own campaigns | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_finder_results | efr_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_finder_results | efr_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_finder_results | efr_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_finder_results | efr_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_logs | email_logs_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.email_logs | email_logs_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.email_thread_summaries | Users delete own email thread summaries | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_thread_summaries | Users insert own email thread summaries | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_thread_summaries | Users update own email thread summaries | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_thread_summaries | Users view own email thread summaries | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_verifications | ev_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_verifications | ev_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.email_verifications | ev_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.email_verifications | ev_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.embedding_configs | embedding_configs_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.embedding_configs | embedding_configs_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.embedding_configs | embedding_configs_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.embedding_configs | embedding_configs_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.emotional_anchors | Users can create their own emotional anchors | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.emotional_anchors | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.emotional_anchors | Users can delete their own emotional anchors | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.emotional_anchors | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.emotional_anchors | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.emotional_anchors | Users can update their own emotional anchors | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.emotional_anchors | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.emotional_anchors | Users can view their own emotional anchors | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.emotional_states_history | Users can create their own emotional states history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.emotional_states_history | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.emotional_states_history | Users can delete their own emotional states history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.emotional_states_history | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.emotional_states_history | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.emotional_states_history | Users can update their own emotional_states_history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.emotional_states_history | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.emotional_states_history | Users can view their own emotional states history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.entity_relationships | auth users insert entity_relationships | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.entity_relationships | auth users read entity_relationships | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.entity_relationships | creator or admin deletes entity_relationships | DELETE | PERMISSIVE | authenticated | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.entity_relationships | creator or admin updates entity_relationships | UPDATE | PERMISSIVE | authenticated | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((created_by = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.eq_analysis_history | Users can create their own EQ analysis history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.eq_analysis_history | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.eq_analysis_history | Users can delete their own EQ analysis history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.eq_analysis_history | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.eq_analysis_history | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.eq_analysis_history | Users can update their own eq_analysis_history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.eq_analysis_history | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.eq_analysis_history | Users can view their own EQ analysis history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.eq_assessment_questions | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.eq_assessment_questions | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.error_logs | Admins can view error logs | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.error_logs | Authenticated users can insert error logs | INSERT | PERMISSIVE | authenticated |  | `((auth.uid() IS NOT NULL) AND (user_id = auth.uid()))` |
| public.estados | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.estados | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.external_data_audit_log | admin_only_select_external_data_audit | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.favorite_templates | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.favorite_templates | Users can delete their own favorites | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.favorite_templates | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.favorite_templates | Users can insert their own favorites | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.favorite_templates | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.favorite_templates | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.favorite_templates | Users can view their own favorites | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.favorites | favorites_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.favorites | favorites_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.favorites | favorites_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.favorites | favorites_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.feature_flags | Admins can delete feature flags | DELETE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.feature_flags | Admins can insert feature flags | INSERT | PERMISSIVE | authenticated |  | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.feature_flags | Admins can update feature flags | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.feature_flags | Authenticated can read feature flags | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.ficha360_conversation_summaries | Users delete own f360 summaries | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ficha360_conversation_summaries | Users insert own f360 summaries | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ficha360_conversation_summaries | Users see own f360 summaries | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.follow_up_approvals | Users can create their own follow-up approvals | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.follow_up_approvals | Users can delete their own follow-up approvals | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.follow_up_approvals | Users can manage their follow-up approvals | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.follow_up_approvals | Users can update their own follow-up approvals | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.follow_up_approvals | Users can view their own follow-up approvals | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.follow_up_approvals_v2 | Users can manage their own follow-up approvals | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.follow_up_approvals_v2 | Users can manage their own follow-up approvals v2 | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_categories_history | own forecast_cat_history insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.forecast_categories_history | own forecast_cat_history select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_periods | own forecast_periods delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_periods | own forecast_periods insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.forecast_periods | own forecast_periods select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_periods | own forecast_periods update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_quota_settings | own quota_settings insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.forecast_quota_settings | own quota_settings select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_quota_settings | own quota_settings update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_snapshots | own forecast_snapshots delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.forecast_snapshots | own forecast_snapshots insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.forecast_snapshots | own forecast_snapshots select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.form_submissions | fs_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.form_submissions | fs_public_insert | INSERT | PERMISSIVE | authenticated |  | `(EXISTS ( SELECT 1    FROM forms f   WHERE ((f.id = form_submissions.form_id) AND (f.is_published = true) AND (f.user_id = form_submissions.user_id))))` |
| public.forms | Anon can view published forms | SELECT | PERMISSIVE | anon, authenticated | `(is_published = true)` |  |
| public.forms | forms_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.forms | forms_public_read_published | SELECT | PERMISSIVE | authenticated | `(is_published = true)` |  |
| public.geo_allowed_countries | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.geo_allowed_countries | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.geo_allowed_countries | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.geo_allowed_countries | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.geo_allowed_countries | Users manage own geo countries | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.grupos_economicos | grupos_economicos_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.guardrail_ml_logs | guardrail_ml_logs_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.guardrail_ml_logs | guardrail_ml_logs_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.handoff_requests | Admins can view all handoff requests | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.handoff_requests | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.handoff_requests | Users can delete their own handoff requests | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.handoff_requests | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.handoff_requests | Users can insert their own handoff requests | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.handoff_requests | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.handoff_requests | Users can update their own handoff requests | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.handoff_requests | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.handoff_requests | Users can view their own handoff requests | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alert_settings | Users can create their own health settings | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.health_alert_settings | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alert_settings | Users can delete their own health_alert_settings | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.health_alert_settings | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.health_alert_settings | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alert_settings | Users can update their own health settings | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.health_alert_settings | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alert_settings | Users can view their own health settings | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.health_alerts | Users can create their own health alerts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.health_alerts | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alerts | Users can delete their own health alerts | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.health_alerts | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.health_alerts | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alerts | Users can update their own health alerts | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.health_alerts | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.health_alerts | Users can view their own health alerts | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.hidden_objections | Users can create their own hidden objections | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.hidden_objections | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.hidden_objections | Users can delete their own hidden objections | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.hidden_objections | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.hidden_objections | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.hidden_objections | Users can update their own hidden objections | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.hidden_objections | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.hidden_objections | Users can view their own hidden objections | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.import_jobs | import_jobs_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.inactivity_alerts | inactivity_alerts_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.incoming_webhook_dlq | Admins manage DLQ | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.incoming_webhook_logs | admins read incoming_webhook_logs | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.incoming_webhook_logs | service_role_inserts_webhook_logs | INSERT | PERMISSIVE | authenticated |  | `false` |
| public.incoming_webhook_nonces | incoming_webhook_nonces_service_only | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.incoming_webhooks | admins manage incoming_webhooks | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.insights | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.insights | Users can delete their own insights | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.insights | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.insights | Users can insert their own insights | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.insights | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.insights | Users can update their own insights | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.insights | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.insights | Users can view their own insights | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.integration_logs | integration_logs_owner_admin_mfa_all | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM integrations i   WHERE ((i.id = integration_logs.integration_id) AND ((i.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` | `(EXISTS ( SELECT 1    FROM integrations i   WHERE ((i.id = integration_logs.integration_id) AND ((i.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` |
| public.integrations | integrations_owner_admin_mfa_all | ALL | PERMISSIVE | authenticated | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.intent_scores | Users delete own intent scores | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_scores | Users insert own intent scores | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.intent_scores | Users update own intent scores | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_scores | Users view own intent scores | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_signals | Users delete own intent signals | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_signals | Users insert own intent signals | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.intent_signals | Users update own intent signals | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_signals | Users view own intent signals | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_tracking_pixels | Users delete own pixels | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_tracking_pixels | Users insert own pixels | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.intent_tracking_pixels | Users update own pixels | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.intent_tracking_pixels | Users view own pixels | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interaction_summaries | Users can manage summaries of their entities | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interaction_summaries | Users can view summaries of their entities | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interaction_templates | interaction_templates_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.interaction_templates | interaction_templates_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.interaction_templates | interaction_templates_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.interaction_templates | interaction_templates_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.interactions | Users can access their own interactions | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interactions | Users can delete their own interactions | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.interactions | Users can insert their own interactions | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.interactions | Users can update their own interactions | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.interactions | Users can view their own interactions | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.interactions | service_role_full_interactions | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.interactions | singu_interactions_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interactions | singu_interactions_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.interactions | singu_interactions_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interactions | singu_interactions_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.interactions_audit | Users can view their own interactions audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ip_whitelist | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ip_whitelist | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ip_whitelist | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ip_whitelist | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ip_whitelist | Users manage own IPs | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.knowledge_base_articles | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.knowledge_base_articles | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.knowledge_base_articles | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.knowledge_base_articles | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.knowledge_base_articles | Users manage own kb articles | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.landing_page_submissions | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.landing_page_submissions | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.landing_page_submissions | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.landing_page_submissions | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.landing_page_submissions | owners read submissions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.landing_page_submissions | public can insert submissions to published pages | INSERT | PERMISSIVE | anon, authenticated |  | `(EXISTS ( SELECT 1    FROM landing_pages lp   WHERE ((lp.id = landing_page_submissions.landing_page_id) AND (lp.is_published = true) AND (lp.user_id = landing_page_submissions.user_id))))` |
| public.landing_pages | Anon can view published landing pages | SELECT | PERMISSIVE | anon, authenticated | `(is_published = true)` |  |
| public.landing_pages | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.landing_pages | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.landing_pages | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.landing_pages | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.landing_pages | owners manage landing pages | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.landing_pages | public can read published landing pages | SELECT | PERMISSIVE | anon, authenticated | `(is_published = true)` |  |
| public.lead_assignments | Admins can view all assignments | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.lead_assignments | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_assignments | Users can delete their own assignments | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_assignments | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_assignments | Users can insert their own assignments | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_assignments | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_assignments | Users can update their own assignments | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_assignments | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_assignments | Users can view their own assignments | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_magnet_downloads | lmd_owner_read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_magnet_downloads | lmd_public_insert | INSERT | PERMISSIVE | authenticated |  | `(EXISTS ( SELECT 1    FROM lead_magnets m   WHERE ((m.id = lead_magnet_downloads.magnet_id) AND (m.is_published = true) AND (m.user_id = lead_magnet_downloads.user_id))))` |
| public.lead_magnets | lm_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_magnets | lm_public_read | SELECT | PERMISSIVE | authenticated | `(is_published = true)` |  |
| public.lead_routing_rules | Admins can view all routing rules | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.lead_routing_rules | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_routing_rules | Users can delete their own routing rules | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_routing_rules | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_routing_rules | Users can insert their own routing rules | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_routing_rules | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_routing_rules | Users can update their own routing rules | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_routing_rules | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_routing_rules | Users can view their own routing rules | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_config | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_config | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_config | Users can insert their own config | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_config | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_config | Users can update their own config | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_config | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_config | Users can view their own config | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_history | Users can insert their own score history | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_history | Users can view their own score history | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_history | Users own data | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_recompute_queue | lead_score_queue_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_recompute_queue | lead_score_queue_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_rules | lead_score_rules_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_rules | lead_score_rules_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_rules | lead_score_rules_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_rules | lead_score_rules_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_threshold_automations | auto delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_threshold_automations | auto insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_threshold_automations | auto select own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_threshold_automations | auto update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_threshold_log | log insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_threshold_log | log select own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_thresholds | lead_score_thresholds_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_thresholds | lead_score_thresholds_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_score_thresholds | lead_score_thresholds_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_score_thresholds | lead_score_thresholds_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_scores | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_scores | Users can delete their own lead scores | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_scores | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_scores | Users can insert their own lead scores | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_scores | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lead_scores | Users can update their own lead scores | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_scores | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_scores | Users can view their own lead scores | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lead_sources | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.lead_sources | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.life_events | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.life_events | Users can delete their own life events | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.life_events | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.life_events | Users can insert their own life events | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.life_events | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.life_events | Users can update their own life events | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.life_events | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.life_events | Users can view their own life events | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.life_events_history | Users can view their own life events history | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.login_attempts | Admins read all attempts | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.login_attempts | Service role insert login_attempts | INSERT | PERMISSIVE | service_role |  | `true` |
| public.login_attempts | Users read own attempts | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.login_attempts | login_attempts_internal_deny_all | ALL | RESTRICTIVE | anon, authenticated | `false` |  |
| public.loss_reasons | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.loss_reasons | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.lux_intelligence | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lux_intelligence | Users can delete their own lux intelligence | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.lux_intelligence | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lux_intelligence | Users can insert their own lux intelligence | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.lux_intelligence | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lux_intelligence | Users can update their own lux intelligence | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.lux_intelligence | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lux_intelligence | Users can view their own lux intelligence | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.lux_webhook_config | Admins can delete lux_webhook_config | DELETE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.lux_webhook_config | Admins can insert lux_webhook_config | INSERT | PERMISSIVE | authenticated |  | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.lux_webhook_config | Admins can update lux_webhook_config | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.lux_webhook_config | Admins can view lux_webhook_config | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.lux_webhook_config | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.lux_webhook_config | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lux_webhook_config | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.lux_webhook_config | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.marketing_campaign_stats | Users can insert their own marketing stats | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.marketing_campaign_stats | Users can update their own marketing stats | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.marketing_campaign_stats | Users can view their own marketing stats | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.marketing_roi_data | Users can insert their own ROI data | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.marketing_roi_data | Users can view their own ROI data | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.mcp_tool_calls | Admins read mcp_tool_calls | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.mcp_tool_calls | Service role insert mcp_tool_calls | INSERT | PERMISSIVE | service_role |  | `true` |
| public.meeting_summaries | Users can create own meeting summaries | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.meeting_summaries | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meeting_summaries | Users can delete own meeting summaries | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meeting_summaries | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.meeting_summaries | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.meeting_summaries | Users can update own meeting summaries | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meeting_summaries | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meeting_summaries | Users can view own meeting summaries | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meetings | meetings_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meetings | meetings_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.meetings | meetings_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.meetings | meetings_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.message_templates | Authenticated read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.metaprogram_analysis | Users can create their own metaprogram analysis | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.metaprogram_analysis | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.metaprogram_analysis | Users can delete their own metaprogram analysis | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.metaprogram_analysis | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.metaprogram_analysis | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.metaprogram_analysis | Users can update their own metaprogram_analysis | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.metaprogram_analysis | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.metaprogram_analysis | Users can view their own metaprogram analysis | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.model_pricing_v2 | model_pricing_v2_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.mql_classifications | mqlcls_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.mql_criteria | mqlc_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.neuro_behavioral_history | Users can insert their own contact's neuro history | INSERT | PERMISSIVE | authenticated |  | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| public.neuro_behavioral_history | Users can view their own contact's neuro history | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.neuro_pnl_sessions | Owner or admin can insert neuro pnl sessions | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.neuro_pnl_sessions | Users can update neuro pnl sessions | UPDATE | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.neuro_pnl_sessions | Users can view neuro pnl sessions | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.nlp_extractions | nlp_extractions_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.nlp_extractions | nlp_extractions_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.nlp_feedback | Users can insert their own feedback | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nlp_feedback | Users can view their own feedback | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notification_logs | Users can view their own notification logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notification_preferences | self read prefs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notification_preferences | self update prefs | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notification_preferences | self upsert prefs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.notifications | notifications_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notifications | notifications_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.notifications | notifications_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.notifications | notifications_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.notifications | notifications_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nps_surveys | nps_surveys_owner_or_admin_mfa_all | ALL | PERMISSIVE | authenticated | `((((company_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (created_by = ( SELECT auth.uid() AS uid))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = nps_surveys.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = nps_surveys.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((((company_id IS NOT NULL) OR (contact_id IS NOT NULL) OR (created_by = ( SELECT auth.uid() AS uid))) AND ((company_id IS NULL) OR (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = nps_surveys.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) AND ((contact_id IS NULL) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = nps_surveys.contact_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.nurturing_enrollments | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.nurturing_enrollments | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nurturing_enrollments | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nurturing_enrollments | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.nurturing_enrollments | Users manage own nurturing enrollments | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nurturing_executions | ne_owner_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nurturing_workflows | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.nurturing_workflows | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nurturing_workflows | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.nurturing_workflows | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.nurturing_workflows | Users manage own nurturing workflows | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.oauth_tokens | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.objection_example_feedback | Users delete own objection feedback | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.objection_example_feedback | Users insert own objection feedback | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.objection_example_feedback | Users update own objection feedback | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.objection_example_feedback | Users view own objection feedback | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.offer_suggestions | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.offer_suggestions | Users can delete their own offer suggestions | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.offer_suggestions | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.offer_suggestions | Users can insert their own offer suggestions | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.offer_suggestions | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.offer_suggestions | Users can update their own offer suggestions | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.offer_suggestions | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.offer_suggestions | Users can view their own offer suggestions | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.password_reset_requests | Admins manage reset requests | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.password_reset_requests | Users read own reset requests | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.password_reset_requests | password_reset_requests_internal_deny_all | ALL | RESTRICTIVE | anon, authenticated | `false` |  |
| public.people_intelligence_events | pie_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.people_intelligence_events | pie_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.people_intelligence_events | pie_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.permissions | Admins manage permissions | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.permissions | Authenticated read permissions | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.permissions | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.permissions | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.phone_validations | pv_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.phone_validations | pv_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.phone_validations | pv_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.phone_validations | pv_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.pipeline_stage_transitions | Leitura pública de transições | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.pipeline_stage_transitions | Transitions are viewable by everyone authenticated | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.pipeline_stages | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.pipeline_stages | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.pipelines | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.pipelines | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.playbook_usage_log | playbook_usage_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.playbook_usage_log | playbook_usage_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.portfolio_settings | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.portfolio_settings | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.product_novelties | authenticated_read_novelties | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.product_novelties | service_all_novelties | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.products | products_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.profiles | Admins can view all profiles | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.profiles | Users can insert their own profile | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = id)` |
| public.profiles | Users can update their own profile | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = id)` |  |
| public.profiles | Users can view their own profile | SELECT | PERMISSIVE | authenticated | `(auth.uid() = id)` |  |
| public.profiles | service_role_full_profiles | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.profiles | singu_profiles_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = id)` |
| public.profiles | singu_profiles_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = id)` |  |
| public.profiles | singu_profiles_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = id)` |  |
| public.proposals | proposals_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.proposals | proposals_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.proposals | proposals_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.proposals | proposals_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.proximo_passo_feedback | Users can delete their own passo feedbacks | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.proximo_passo_feedback | Users can insert their own passo feedbacks | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.proximo_passo_feedback | Users can view their own passo feedbacks | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.psychographic_audit_log | Owner or admin can view psychographic audit logs | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = psychographic_audit_log.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.purchase_history | Users can delete their own purchase history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.purchase_history | Users can insert their own purchase history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.purchase_history | Users can update their own purchase history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.purchase_history | Users can view their own purchase history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.purchase_history | purchase_history_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.purchase_history | purchase_history_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.purchase_history | purchase_history_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.purchase_history | purchase_history_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.push_subscriptions | Users can create their own subscriptions | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.push_subscriptions | Users can delete their own subscriptions | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.push_subscriptions | Users can update their own subscriptions | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.push_subscriptions | Users can view own push subscriptions | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.push_subscriptions | Users can view own subscriptions limited | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.push_subscriptions | Users can view their own subscriptions | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.push_subscriptions | push_subscriptions_user_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.push_subscriptions | push_subscriptions_user_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.push_subscriptions | push_subscriptions_user_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.push_subscriptions | push_subscriptions_user_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.query_telemetry | Users can delete their own telemetry | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.query_telemetry | Users can insert their own telemetry | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.query_telemetry | Users can view their own telemetry | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.query_telemetry | query_telemetry_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.query_telemetry | query_telemetry_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.query_telemetry | query_telemetry_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.query_telemetry | query_telemetry_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.quick_notes | quick_notes_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.quick_notes | quick_notes_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.quick_notes | quick_notes_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.quick_notes | quick_notes_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ragas_scores | ragas_scores_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.ragas_scores | ragas_scores_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.redistribution_log | Admins can view all redistribution logs | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.redistribution_log | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.redistribution_log | Users can insert their own redistribution logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.redistribution_log | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.redistribution_log | Users can view their own redistribution logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.reframing_analysis | Users can create their own reframing analysis | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.reframing_analysis | Users can update their own reframing analysis | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.reframing_analysis | Users can view their own reframing analysis | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.reframing_analysis_audit | Users can view their own reframing audit | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.relationship_score_history | relationship_score_history_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.relationship_score_history | relationship_score_history_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.relationship_score_history | relationship_score_history_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.relationship_score_history | relationship_score_history_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.reminders | reminders_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.reminders | reminders_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.reminders | reminders_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.reminders | reminders_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.reminders | reminders_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.report_executions | report_executions_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM scheduled_reports r   WHERE ((r.id = report_executions.scheduled_report_id) AND ((r.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` | `(EXISTS ( SELECT 1    FROM scheduled_reports r   WHERE ((r.id = report_executions.scheduled_report_id) AND ((r.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` |
| public.revops_alerts | Users delete own alerts | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_alerts | Users insert own alerts | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.revops_alerts | Users update own alerts | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_alerts | Users view own alerts | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_benchmarks | Users delete own benchmarks | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_benchmarks | Users insert own benchmarks | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.revops_benchmarks | Users update own benchmarks | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_benchmarks | Users view own benchmarks | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_snapshots | Users delete own snapshots | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.revops_snapshots | Users insert own snapshots | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.revops_snapshots | Users view own snapshots | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.rfm_analysis | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.rfm_analysis | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.rfm_analysis | Users can manage their own RFM analysis | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.rfm_analysis | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.rfm_analysis | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.rfm_history | Users can view their own RFM history | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.rfm_history | rfm_history_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.rfm_history | rfm_history_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.rfm_history | rfm_history_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.rfm_history | rfm_history_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.rfm_metrics | Users can view their RFM metrics | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.rfm_metrics | rfm_metrics_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.rfm_metrics | rfm_metrics_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.rfm_metrics | rfm_metrics_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.rfm_metrics | rfm_metrics_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.rfm_segment_config | Users can manage their RFM segment config | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.rfm_segment_config | rfm_segment_config_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.rfm_segment_config | rfm_segment_config_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.rfm_segment_config | rfm_segment_config_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.rfm_segment_config | rfm_segment_config_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.rodizio_distribuicao_staging | admin_delete | DELETE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.rodizio_distribuicao_staging | admin_insert | INSERT | PERMISSIVE | authenticated |  | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.rodizio_distribuicao_staging | admin_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.rodizio_distribuicao_staging | admin_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.rodizio_execucoes | admin_insert | INSERT | PERMISSIVE | authenticated |  | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.rodizio_execucoes | admin_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.rodizio_execucoes | admin_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.role_permissions | Admins manage role_permissions | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.role_permissions | Authenticated read role_permissions | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.role_permissions | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.role_permissions | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.rpc_perf_samples | Admins read perf samples | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rpc_plan_snapshots | admins_read_rpc_plan_snapshots | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.rpc_plan_snapshots | service_role_writes_rpc_plan_snapshots | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sales | legacy_sales_owner | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM salespeople sp   WHERE ((sp.id = sales.salesperson_id) AND (sp.auth_user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.sales | legacy_sales_service | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sales_activities | legacy_sales_activities_owner | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM salespeople sp   WHERE ((sp.id = sales_activities.salesperson_id) AND (sp.auth_user_id = ( SELECT auth.uid() AS uid))))) AND ((sale_id IS NULL) OR (EXISTS ( SELECT 1    FROM sales s   WHERE (s.id = sales_activities.sale_id)))))` |  |
| public.sales_activities | legacy_sales_service | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sales_cadences | sales_cadences_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.sales_forecasts | Users own data | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sales_goals | sales_goals_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.sales_goals | sales_goals_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.sales_goals | sales_goals_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.sales_goals | sales_goals_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.sales_opportunities | sales_opportunities_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `(((company_id IS NOT NULL) AND (EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = sales_opportunities.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid)))))) OR ((company_id IS NULL) AND ((identified_by = ( SELECT auth.uid() AS uid)) OR (assigned_to = ( SELECT auth.uid() AS uid)))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.sales_playbooks | playbooks_delete_own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_playbooks | playbooks_insert_own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sales_playbooks | playbooks_select_own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_playbooks | playbooks_update_own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_scripts | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.sales_scripts | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sales_tasks | sales_tasks_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.sales_team_members | Admins can view all team members | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.sales_team_members | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_team_members | Users can delete their own team members | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_team_members | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sales_team_members | Users can insert their own team members | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sales_team_members | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sales_team_members | Users can update their own team members | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_team_members | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sales_team_members | Users can view their own team members | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.salespeople | legacy_sales_service | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.salespeople | legacy_salespeople_owner | SELECT | PERMISSIVE | authenticated | `(auth_user_id = ( SELECT auth.uid() AS uid))` |  |
| public.scheduled_reports | scheduled_reports_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.scheduled_visits | scheduled_visits_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.scheduled_visits | scheduled_visits_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.scheduled_visits | scheduled_visits_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.scheduled_visits | scheduled_visits_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.schema_drift_alerts | Admins can update schema drift alerts | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.schema_drift_alerts | Admins can view schema drift alerts | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.schema_drift_alerts | Users can insert their own schema drift alerts | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.schema_drift_alerts | schema_drift_alerts_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.schema_drift_alerts | schema_drift_alerts_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.schema_drift_alerts | schema_drift_alerts_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.schema_drift_alerts | schema_drift_alerts_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.score_history | Users can delete their own score history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.score_history | Users can insert their own score history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.score_history | Users can update their own score_history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.score_history | Users can view their own score history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.score_history | score_history_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.score_history | score_history_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.score_history | score_history_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.score_history | score_history_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.script_sections | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.script_sections | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sdr_alert_history | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.sdr_alert_history | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sdr_closer_assignments | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.sdr_closer_assignments | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.search_products_cache | Users delete own products cache | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.search_products_cache | Users insert own products cache | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.search_products_cache | Users update own products cache | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.search_products_cache | Users view own products cache | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.search_products_cache | search_products_cache_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.secret_rotation_log | secret_rotation_admin_mfa_all | ALL | PERMISSIVE | authenticated | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` | `(( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))` |
| public.seller_daily_metrics | Users own data | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.semantic_search_cache | Users delete own search cache | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.semantic_search_cache | Users insert own search cache | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.semantic_search_cache | Users update own search cache | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.semantic_search_cache | Users view own search cache | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.semantic_search_cache | semantic_search_cache_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.sentiment_annotations | Owner or admin can delete sentiment annotations | DELETE | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = created_by) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.sentiment_annotations | Owner or admin can update sentiment annotations | UPDATE | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = created_by) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.sentiment_annotations | Owner or admin can view sentiment annotations | SELECT | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = created_by) OR (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = sentiment_annotations.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.sentiment_annotations | Users can create their own sentiment annotations | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = created_by)` |
| public.sequence_email_reservations | sequence_email_reservation_owner | SELECT | PERMISSIVE | authenticated | `((user_id = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(auth.uid(), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.sequence_enrollments | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequence_enrollments | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequence_enrollments | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequence_enrollments | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequence_enrollments | Users manage own enrollments | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.sequence_enrollments | singu_sequence_enrollment_scope | ALL | RESTRICTIVE | authenticated | `((user_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_enrollments.sequence_id) AND (s.user_id = auth.uid())))) AND (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = sequence_enrollments.contact_id) AND (c.user_id = auth.uid())))))` | `((user_id = auth.uid()) AND (EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_enrollments.sequence_id) AND (s.user_id = auth.uid())))) AND (EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = sequence_enrollments.contact_id) AND (c.user_id = auth.uid())))))` |
| public.sequence_events | Service role full access seq events | ALL | PERMISSIVE | authenticated | `((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)` |  |
| public.sequence_events | Users insert own sequence events | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequence_events | Users view own sequence events | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequence_send_log | Service role full access seq send log | ALL | PERMISSIVE | authenticated | `((( SELECT auth.jwt() AS jwt) ->> 'role'::text) = 'service_role'::text)` |  |
| public.sequence_send_log | Users view own sequence send log | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequence_steps | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequence_steps | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequence_steps | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequence_steps | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequence_steps | Users manage own sequence steps | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))` | `(EXISTS ( SELECT 1    FROM sequences s   WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = ( SELECT auth.uid() AS uid)))))` |
| public.sequences | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequences | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequences | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sequences | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sequences | Users manage own sequences | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.sla_rules | sla_rules_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.sla_violations | sla_violations_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.sla_violations | sla_violations_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.sla_violations | sla_violations_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.sla_violations | sla_violations_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.sleight_of_mouth_examples | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.sleight_of_mouth_examples | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sleight_of_mouth_patterns | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.sleight_of_mouth_patterns | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.sm_upload_mapping | sm_upload_mapping_internal_deny_all | ALL | RESTRICTIVE | anon, authenticated | `false` |  |
| public.smart_notifications | self delete notif | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.smart_notifications | self insert notif | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.smart_notifications | self read notif | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.smart_notifications | self update notif | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.smart_segments | smart_segments_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.sms_campaign_recipients | Delete recipients of own SMS campaigns | DELETE | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.sms_campaign_recipients | Insert recipients of own SMS campaigns | INSERT | PERMISSIVE | authenticated |  | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |
| public.sms_campaign_recipients | Update recipients of own SMS campaigns | UPDATE | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.sms_campaign_recipients | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_campaign_recipients | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_campaign_recipients | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_campaign_recipients | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_campaign_recipients | View recipients of own SMS campaigns | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM sms_campaigns c   WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.sms_campaigns | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_campaigns | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_campaigns | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_campaigns | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_campaigns | Users manage own SMS campaigns | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_opt_outs | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_opt_outs | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_opt_outs | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_opt_outs | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_opt_outs | Users manage own SMS opt-outs | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_templates | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_templates | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_templates | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sms_templates | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.sms_templates | Users manage own SMS templates | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.social_behavior_analysis | Users can delete their own social behavior analysis | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_behavior_analysis | Users can insert their own social behavior analysis | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.social_behavior_analysis | Users can update their own social behavior analysis | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_behavior_analysis | Users can view their own social behavior analysis | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_behavior_analysis | social_behavior_analysis_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_behavior_analysis | social_behavior_analysis_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_behavior_analysis | social_behavior_analysis_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_behavior_analysis | social_behavior_analysis_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_consent_audit | Users can insert consent logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.social_consent_audit | Users can view their own consent logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.social_insights | social_insights_delete_own | DELETE | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.social_insights | social_insights_insert_own | INSERT | PERMISSIVE | public |  | `(auth.uid() = user_id)` |
| public.social_insights | social_insights_select_own | SELECT | PERMISSIVE | public | `(auth.uid() = user_id)` |  |
| public.social_insights | social_insights_update_own | UPDATE | PERMISSIVE | public | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.social_life_events | Users can delete their own social life events | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_life_events | Users can insert their own social life events | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.social_life_events | Users can update their own social life events | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_life_events | Users can view their own social life events | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_life_events | social_life_events_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_life_events | social_life_events_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_life_events | social_life_events_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_life_events | social_life_events_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_profiles | Users can delete their own social profiles | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_profiles | Users can insert their own social profiles | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.social_profiles | Users can update their own social profiles | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_profiles | Users can view their own social profiles | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_profiles | social_profiles_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_profiles | social_profiles_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_profiles | social_profiles_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_profiles | social_profiles_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_scraping_schedule | Users can delete their own scraping schedule | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_scraping_schedule | Users can insert their own scraping schedule | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.social_scraping_schedule | Users can update their own scraping schedule | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_scraping_schedule | Users can view their own scraping schedule | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.social_scraping_schedule | social_scraping_schedule_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_scraping_schedule | social_scraping_schedule_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_scraping_schedule | social_scraping_schedule_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.social_scraping_schedule | social_scraping_schedule_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.social_sync_queue | Owner or admin can view social sync queue | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = social_sync_queue.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.staging_portal_sicoob | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.stakeholder_alerts | Users can create their own stakeholder alerts | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.stakeholder_alerts | Users can delete their own stakeholder alerts | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.stakeholder_alerts | Users can update their own stakeholder alerts | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.stakeholder_alerts | Users can view their own stakeholder alerts | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.stakeholder_alerts | stakeholder_alerts_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.stakeholder_alerts | stakeholder_alerts_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.stakeholder_alerts | stakeholder_alerts_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.stakeholder_alerts | stakeholder_alerts_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.suggested_life_events | Owner or admin can delete suggested life events | DELETE | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.suggested_life_events | Owner or admin can update suggested life events | UPDATE | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.suggested_life_events | Owner or admin can view suggested life events | SELECT | PERMISSIVE | authenticated | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.suggested_life_events | Service role can manage suggested life events | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.suggested_life_events | Users can insert their own suggested life events | INSERT | PERMISSIVE | authenticated |  | `((( SELECT auth.uid() AS uid) = user_id) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.suggested_rapport_intel | System/Users can insert suggested rapport | INSERT | PERMISSIVE | authenticated |  | `(EXISTS ( SELECT 1    FROM contacts   WHERE (contacts.id = suggested_rapport_intel.contact_id)))` |
| public.suggested_rapport_intel | Users can manage their suggested rapport | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.suggested_rapport_intel | Users can update status of suggested rapport | UPDATE | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts   WHERE (contacts.id = suggested_rapport_intel.contact_id)))` |  |
| public.suggested_rapport_intel | Users can view suggested rapport for their contacts | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM contacts   WHERE (contacts.id = suggested_rapport_intel.contact_id)))` |  |
| public.supplier_evaluations | supplier_evaluations_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_evaluations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_evaluations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.supplier_evaluations | supplier_evaluations_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.supplier_homologations | supplier_homologations_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_homologations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_homologations.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.supplier_homologations | supplier_homologations_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.supplier_qualification_config | supplier_qualification_config_admin_write | ALL | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.supplier_qualification_config | supplier_qualification_config_authenticated_read | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.supplier_score_history | supplier_score_history_owner_or_admin_mfa_insert | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_score_history.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.supplier_score_history | supplier_score_history_owner_or_admin_mfa_select | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_score_history.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |  |
| public.supplier_score_history | supplier_score_history_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.supplier_scores | supplier_scores_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_scores.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM (suppliers s      JOIN companies c ON ((c.id = s.company_id)))   WHERE ((s.id = supplier_scores.supplier_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.supplier_scores | supplier_scores_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.suppliers | suppliers_owner_or_admin_mfa | ALL | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = suppliers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((EXISTS ( SELECT 1    FROM companies c   WHERE ((c.id = suppliers.company_id) AND (c.deleted_at IS NULL) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.suppliers | suppliers_select_admin | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.support_tickets | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.support_tickets | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.support_tickets | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.support_tickets | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.support_tickets | Users manage own tickets | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.sync_log | sync_log_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.sync_log | sync_log_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.system_alerts | Admins can acknowledge system alerts | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.system_alerts | Admins can view system alerts | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.system_config | Admins manage system_config | ALL | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.system_config | Authenticated reads system_config | SELECT | PERMISSIVE | authenticated | `true` |  |
| public.system_health_snapshots | Admins can view system health snapshots | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.system_health_snapshots | Service role can insert system health snapshots | INSERT | PERMISSIVE | authenticated |  | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.tags | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.tags | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.tasks | tasks_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.tasks | tasks_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.tasks | tasks_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.tasks | tasks_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.territories | territories_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.territory_assignments | territory_assignments_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.territory_assignments | territory_assignments_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.territory_assignments | territory_assignments_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.territory_assignments | territory_assignments_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.ticket_comments | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ticket_comments | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ticket_comments | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.ticket_comments | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.ticket_comments | Users manage own ticket comments | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.trigger_ab_tests | Users can create their own AB tests | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.trigger_ab_tests | Users can delete their own AB tests | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_ab_tests | Users can update their own AB tests | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_ab_tests | Users can view their own AB tests | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_ab_tests | trigger_ab_tests_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_ab_tests | trigger_ab_tests_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_ab_tests | trigger_ab_tests_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_ab_tests | trigger_ab_tests_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_bundles | Users can create their own bundles | INSERT | PERMISSIVE | authenticated |  | `((auth.uid() = user_id) AND (COALESCE(is_system_bundle, false) = false))` |
| public.trigger_bundles | Users can delete their own bundles | DELETE | PERMISSIVE | authenticated | `((auth.uid() = user_id) AND (is_system_bundle = false))` |  |
| public.trigger_bundles | Users can update their own bundles | UPDATE | PERMISSIVE | authenticated | `((auth.uid() = user_id) AND (is_system_bundle = false))` |  |
| public.trigger_bundles | Users can view their own bundles | SELECT | PERMISSIVE | authenticated | `((auth.uid() = user_id) OR (is_system_bundle = true))` |  |
| public.trigger_bundles | trigger_bundles_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_bundles | trigger_bundles_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_bundles | trigger_bundles_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_bundles | trigger_bundles_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_channel_effectiveness | Users can create their own channel effectiveness | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.trigger_channel_effectiveness | Users can delete their own channel effectiveness | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_channel_effectiveness | Users can update their own channel effectiveness | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_channel_effectiveness | Users can view their own channel effectiveness | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_intensity_history | Users can create their own intensity history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.trigger_intensity_history | Users can delete their own intensity history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_intensity_history | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.trigger_intensity_history | Users can update their own intensity history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_intensity_history | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.trigger_intensity_history | Users can view their own intensity history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_types | trigger_types_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.trigger_types | trigger_types_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.trigger_types | trigger_types_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.trigger_types | trigger_types_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.trigger_usage_history | Users can delete their own trigger usage history | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_usage_history | Users can insert their own trigger usage history | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.trigger_usage_history | Users can update their own trigger usage history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_usage_history | Users can view their own trigger usage history | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.trigger_usage_history | trigger_usage_history_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_usage_history | trigger_usage_history_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.trigger_usage_history | trigger_usage_history_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.trigger_usage_history | trigger_usage_history_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.uapi_sessions | uapi_sessions_service_only | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.user_badges | user_badges_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_badges | user_badges_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_badges | user_badges_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_badges | user_badges_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_goals | user_goals_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_goals | user_goals_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_goals | user_goals_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_goals | user_goals_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_known_devices | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_known_devices | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_known_devices | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_known_devices | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_known_devices | Users manage own devices | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.user_roles | Admins can delete roles | DELETE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.user_roles | Admins can insert roles | INSERT | PERMISSIVE | authenticated |  | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |
| public.user_roles | Admins can update roles | UPDATE | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.user_roles | Admins can view all roles | SELECT | PERMISSIVE | authenticated | `has_role(( SELECT auth.uid() AS uid), 'admin'::app_role)` |  |
| public.user_roles | Users can view their own roles | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_roles | user_roles_auth_select | SELECT | PERMISSIVE | authenticated | `((user_id = ( SELECT auth.uid() AS uid)) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.user_roles | user_roles_service_delete | DELETE | PERMISSIVE | service_role | `true` |  |
| public.user_roles | user_roles_service_insert | INSERT | PERMISSIVE | service_role |  | `true` |
| public.user_roles | user_roles_service_update | UPDATE | PERMISSIVE | service_role | `true` |  |
| public.user_ui_preferences | Users delete own ui prefs | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_ui_preferences | Users insert own ui prefs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.user_ui_preferences | Users select own ui prefs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.user_ui_preferences | Users update own ui prefs | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.users | admin_select | SELECT | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |  |
| public.users | admin_update | UPDATE | PERMISSIVE | authenticated | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` | `( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role)` |
| public.users | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.vak_analysis_history | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.vak_analysis_history | Users can delete their own VAK analysis | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.vak_analysis_history | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.vak_analysis_history | Users can insert their own VAK analysis | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.vak_analysis_history | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.vak_analysis_history | Users can update their own vak_analysis_history | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.vak_analysis_history | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.vak_analysis_history | Users can view their own VAK analysis | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.vak_keywords | read_only_auth | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |  |
| public.vak_keywords | service_full | ALL | PERMISSIVE | service_role | `true` | `true` |
| public.validation_queue | users insert own validation queue | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.validation_queue | users update own validation queue | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.validation_queue | users view own validation queue | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.visit_checkins | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.visit_checkins | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.visit_checkins | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.visit_checkins | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.visit_checkins | Users manage own visit checkins | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.webauthn_credentials | Users can delete own | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.webauthn_credentials | Users can insert own | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.webauthn_credentials | Users can update own | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.webauthn_credentials | Users can view own | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.webauthn_credentials | Users manage own webauthn | ALL | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.webhook_logs | webhook_logs_owner_admin_mfa_all | ALL | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM webhooks w   WHERE ((w.id = webhook_logs.webhook_id) AND ((w.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` | `(EXISTS ( SELECT 1    FROM webhooks w   WHERE ((w.id = webhook_logs.webhook_id) AND ((w.created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text))))))` |
| public.webhooks | webhooks_owner_admin_mfa_all | ALL | PERMISSIVE | authenticated | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` | `((created_by = ( SELECT auth.uid() AS uid)) OR (( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role) AND (( SELECT (auth.jwt() ->> 'aal'::text)) = 'aal2'::text)))` |
| public.weekly_challenges | challenges_all | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) IS NOT NULL)` | `(( SELECT auth.uid() AS uid) IS NOT NULL)` |
| public.weekly_report_settings | Users can create their own report settings | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.weekly_report_settings | Users can delete their own weekly_report_settings | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.weekly_report_settings | Users can update their own report settings | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.weekly_report_settings | Users can view their own report settings | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.weekly_report_settings | weekly_report_settings_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.weekly_report_settings | weekly_report_settings_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.weekly_report_settings | weekly_report_settings_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.weekly_report_settings | weekly_report_settings_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.weekly_reports | Users can create their own reports | INSERT | PERMISSIVE | authenticated |  | `(auth.uid() = user_id)` |
| public.weekly_reports | Users can delete their own weekly_reports | DELETE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.weekly_reports | Users can update their own weekly_reports | UPDATE | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.weekly_reports | Users can view their own reports | SELECT | PERMISSIVE | authenticated | `(auth.uid() = user_id)` |  |
| public.weekly_reports | weekly_reports_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.weekly_reports | weekly_reports_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.weekly_reports | weekly_reports_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.weekly_reports | weekly_reports_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.whatsapp_ingestion_logs | Users can insert their own ingestion logs | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.whatsapp_ingestion_logs | Users can view their own ingestion logs | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.whatsapp_instances | Users can manage their own whatsapp_instances | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.whatsapp_instances | whatsapp_instances_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.whatsapp_instances | whatsapp_instances_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.whatsapp_instances | whatsapp_instances_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.whatsapp_instances | whatsapp_instances_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.whatsapp_kpis | Users can manage their own whatsapp_kpis | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.whatsapp_kpis | whatsapp_kpis_delete | DELETE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.whatsapp_kpis | whatsapp_kpis_insert | INSERT | PERMISSIVE | authenticated |  | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.whatsapp_kpis | whatsapp_kpis_select | SELECT | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` |  |
| public.whatsapp_kpis | whatsapp_kpis_update | UPDATE | PERMISSIVE | authenticated | `(user_id = ( SELECT auth.uid() AS uid))` | `(user_id = ( SELECT auth.uid() AS uid))` |
| public.whatsapp_messages | Users can manage their own whatsapp messages | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.whatsapp_messages | Users can manage their own whatsapp_messages | ALL | PERMISSIVE | authenticated | `(auth.uid() = user_id)` | `(auth.uid() = user_id)` |
| public.whatsapp_messages | whatsapp_messages_delete | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.whatsapp_messages | whatsapp_messages_insert | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.whatsapp_messages | whatsapp_messages_select | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.whatsapp_messages | whatsapp_messages_update | UPDATE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.whatsapp_messages_index | Owner or admin can insert whatsapp messages index | INSERT | PERMISSIVE | authenticated |  | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |
| public.whatsapp_messages_index | Owner or admin can view whatsapp messages index | SELECT | PERMISSIVE | authenticated | `((EXISTS ( SELECT 1    FROM contacts c   WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))) OR has_role(( SELECT auth.uid() AS uid), 'admin'::app_role))` |  |
| public.whatsapp_transcriptions | Users can view transcriptions of their messages | SELECT | PERMISSIVE | authenticated | `(EXISTS ( SELECT 1    FROM whatsapp_messages m   WHERE ((m.id = whatsapp_transcriptions.whatsapp_message_id) AND (m.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| public.win_loss_insights | users delete own insights | DELETE | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.win_loss_insights | users insert own insights | INSERT | PERMISSIVE | authenticated |  | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.win_loss_insights | users view own insights | SELECT | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` |  |
| public.win_loss_reasons | users manage own reasons | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.win_loss_records | users manage own win_loss_records | ALL | PERMISSIVE | authenticated | `(( SELECT auth.uid() AS uid) = user_id)` | `(( SELECT auth.uid() AS uid) = user_id)` |
| public.workspace_accounts | workspace_accounts_select_admin | SELECT | PERMISSIVE | authenticated | `has_role(auth.uid(), 'admin'::app_role)` |  |
| public.xbz_upload_mapping | xbz_upload_mapping_internal_deny_all | ALL | RESTRICTIVE | anon, authenticated | `false` |  |
| storage.objects | Users delete own docs | DELETE | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))` |  |
| storage.objects | Users read own docs | SELECT | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))` |  |
| storage.objects | Users upload own docs | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))` |
| storage.objects | am_authenticated_read | SELECT | PERMISSIVE | public | `((bucket_id = 'audio-messages'::text) AND (( SELECT auth.uid() AS uid) IS NOT NULL) AND ((EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid)))) OR (((storage.foldername(name))[1] = 'contacts'::text) AND zapp_history.user_can_access_contact(((storage.foldername(name))[2])::uuid, ( SELECT auth.uid() AS uid)))))` |  |
| storage.objects | am_service_all | ALL | PERMISSIVE | public | `((bucket_id = 'audio-messages'::text) AND (auth.role() = 'service_role'::text))` | `((bucket_id = 'audio-messages'::text) AND (auth.role() = 'service_role'::text))` |
| storage.objects | deal_rooms_owner_delete_docs | DELETE | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'deal-rooms'::text) AND (EXISTS ( SELECT 1    FROM deal_rooms r   WHERE (((r.id)::text = (storage.foldername(objects.name))[2]) AND (r.user_id = ( SELECT auth.uid() AS uid))))))` |  |
| storage.objects | deal_rooms_owner_read_docs | SELECT | PERMISSIVE | authenticated | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'deal-rooms'::text) AND (EXISTS ( SELECT 1    FROM deal_rooms r   WHERE (((r.id)::text = (storage.foldername(objects.name))[2]) AND (r.user_id = ( SELECT auth.uid() AS uid))))))` |  |
| storage.objects | deal_rooms_owner_write_docs | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'documents'::text) AND ((storage.foldername(name))[1] = 'deal-rooms'::text) AND (EXISTS ( SELECT 1    FROM deal_rooms r   WHERE (((r.id)::text = (storage.foldername(objects.name))[2]) AND (r.user_id = ( SELECT auth.uid() AS uid))))))` |
| storage.objects | logos_authenticated_insert | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'logos'::text) AND (( SELECT auth.uid() AS uid) IS NOT NULL))` |
| storage.objects | logos_authenticated_update | UPDATE | PERMISSIVE | authenticated | `((bucket_id = 'logos'::text) AND (( SELECT auth.uid() AS uid) IS NOT NULL))` | `((bucket_id = 'logos'::text) AND (( SELECT auth.uid() AS uid) IS NOT NULL))` |
| storage.objects | wa audio owner delete | DELETE | PERMISSIVE | authenticated | `((bucket_id = 'whatsapp-audio'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))` |  |
| storage.objects | wa audio owner insert | INSERT | PERMISSIVE | authenticated |  | `((bucket_id = 'whatsapp-audio'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))` |
| storage.objects | wa audio owner read | SELECT | PERMISSIVE | authenticated | `((bucket_id = 'whatsapp-audio'::text) AND ((storage.foldername(name))[1] = (( SELECT auth.uid() AS uid))::text))` |  |
| storage.objects | wm_authenticated_read | SELECT | PERMISSIVE | public | `((bucket_id = 'whatsapp-media'::text) AND (( SELECT auth.uid() AS uid) IS NOT NULL) AND ((EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid)))) OR (((storage.foldername(name))[1] = 'contacts'::text) AND zapp_history.user_can_access_contact(((storage.foldername(name))[2])::uuid, ( SELECT auth.uid() AS uid)))))` |  |
| storage.objects | wm_service_all | ALL | PERMISSIVE | public | `((bucket_id = 'whatsapp-media'::text) AND (auth.role() = 'service_role'::text))` | `((bucket_id = 'whatsapp-media'::text) AND (auth.role() = 'service_role'::text))` |
| zapp_history.admin_grants | ag_admin_read | SELECT | PERMISSIVE | public | `((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid)))))` |  |
| zapp_history.ai_cost_log | acl_admin_read | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |  |
| zapp_history.ai_training_dataset | atd_admin_read | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |  |
| zapp_history.async_request_log | arl_admin_read | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |  |
| zapp_history.conversation_daily_summaries | cds_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.conversations | conv_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.disc_playbook | pub_read_playbook | SELECT | PERMISSIVE | anon, authenticated | `true` |  |
| zapp_history.edge_function_templates | eft_authenticated_read | SELECT | PERMISSIVE | authenticated | `true` |  |
| zapp_history.location_dictionary | pub_read_location | SELECT | PERMISSIVE | anon, authenticated | `true` |  |
| zapp_history.message_audio | ma_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.message_embeddings | me_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.message_links | ml_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.message_media | mm_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.messages | msg_read | SELECT | PERMISSIVE | public | `zapp_history.user_can_access_contact(contact_id)` |  |
| zapp_history.phone_to_contact | phone_to_contact_select | SELECT | PERMISSIVE | authenticated | `true` |  |
| zapp_history.product_dictionary | pub_read_products | SELECT | PERMISSIVE | anon, authenticated | `true` |  |
| zapp_history.runtime_config | rc_admin_read | SELECT | PERMISSIVE | public | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |  |
| zapp_history.whatsapp_connections | wc_owner_read | SELECT | PERMISSIVE | public | `((owner_user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid)))))` |  |
