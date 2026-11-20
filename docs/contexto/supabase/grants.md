# Grants


Roles da API: `anon` (sem login), `authenticated` (logado), `service_role` (bypass RLS). Grants de sistema (postgres, supabase_*) omitidos.

## Tabelas e views

| objeto | role | privilégios |
|---|---|---|
| _dormant.access_denied_logs | anon | SELECT |
| _dormant.access_denied_logs | authenticated | SELECT |
| _dormant.access_denied_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.active_power_ups | anon | SELECT |
| _dormant.active_power_ups | authenticated | SELECT |
| _dormant.active_power_ups | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.active_sessions | anon | SELECT |
| _dormant.active_sessions | authenticated | SELECT |
| _dormant.active_sessions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.activity_goals | anon | SELECT |
| _dormant.activity_goals | authenticated | SELECT |
| _dormant.activity_goals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.activity_log | anon | SELECT |
| _dormant.activity_log | authenticated | SELECT |
| _dormant.activity_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.alert_log | anon | SELECT |
| _dormant.alert_log | authenticated | SELECT |
| _dormant.alert_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.alertas_inativacao | anon | SELECT |
| _dormant.alertas_inativacao | authenticated | SELECT |
| _dormant.alertas_inativacao | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.api_usage_log | anon | SELECT |
| _dormant.api_usage_log | authenticated | SELECT |
| _dormant.api_usage_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.automation_logs | anon | SELECT |
| _dormant.automation_logs | authenticated | SELECT |
| _dormant.automation_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.automation_rules | anon | SELECT |
| _dormant.automation_rules | authenticated | SELECT |
| _dormant.automation_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.available_spins | anon | SELECT |
| _dormant.available_spins | authenticated | SELECT |
| _dormant.available_spins | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.battle_participants | anon | SELECT |
| _dormant.battle_participants | authenticated | SELECT |
| _dormant.battle_participants | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.bitrix24_sync_logs | anon | SELECT |
| _dormant.bitrix24_sync_logs | authenticated | SELECT |
| _dormant.bitrix24_sync_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.blocked_ips | anon | SELECT |
| _dormant.blocked_ips | authenticated | SELECT |
| _dormant.blocked_ips | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.cadence_steps | anon | SELECT |
| _dormant.cadence_steps | authenticated | SELECT |
| _dormant.cadence_steps | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.cadence_tasks | anon | SELECT |
| _dormant.cadence_tasks | authenticated | SELECT |
| _dormant.cadence_tasks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.cadences | anon | SELECT |
| _dormant.cadences | authenticated | SELECT |
| _dormant.cadences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.carrier_contacts | anon | SELECT |
| _dormant.carrier_contacts | authenticated | SELECT |
| _dormant.carrier_contacts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.category_metrics | anon | SELECT |
| _dormant.category_metrics | authenticated | SELECT |
| _dormant.category_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.challenge_progress | anon | SELECT |
| _dormant.challenge_progress | authenticated | SELECT |
| _dormant.challenge_progress | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.chat_conversations | anon | SELECT |
| _dormant.chat_conversations | authenticated | SELECT |
| _dormant.chat_conversations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.chat_messages | anon | SELECT |
| _dormant.chat_messages | authenticated | SELECT |
| _dormant.chat_messages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.circuit_breaker_events | anon | SELECT |
| _dormant.circuit_breaker_events | authenticated | SELECT |
| _dormant.circuit_breaker_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.client_portfolio | anon | SELECT |
| _dormant.client_portfolio | authenticated | SELECT |
| _dormant.client_portfolio | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.client_values | anon | SELECT |
| _dormant.client_values | authenticated | SELECT |
| _dormant.client_values | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.closing_moment_analysis | anon | SELECT |
| _dormant.closing_moment_analysis | authenticated | SELECT |
| _dormant.closing_moment_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.cognitive_bias_history | anon | SELECT |
| _dormant.cognitive_bias_history | authenticated | SELECT |
| _dormant.cognitive_bias_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.cognitive_biases | anon | SELECT |
| _dormant.cognitive_biases | authenticated | SELECT |
| _dormant.cognitive_biases | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.collectible_badges | anon | SELECT |
| _dormant.collectible_badges | authenticated | SELECT |
| _dormant.collectible_badges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.communication_cadence | anon | SELECT |
| _dormant.communication_cadence | authenticated | SELECT |
| _dormant.communication_cadence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.communication_preferences | anon | SELECT |
| _dormant.communication_preferences | authenticated | SELECT |
| _dormant.communication_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.company_tags | anon | SELECT |
| _dormant.company_tags | authenticated | SELECT |
| _dormant.company_tags | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.compatibility_alerts | anon | SELECT |
| _dormant.compatibility_alerts | authenticated | SELECT |
| _dormant.compatibility_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.compatibility_settings | anon | SELECT |
| _dormant.compatibility_settings | authenticated | SELECT |
| _dormant.compatibility_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.competitive_chat_messages | anon | SELECT |
| _dormant.competitive_chat_messages | authenticated | SELECT |
| _dormant.competitive_chat_messages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.competitive_seasons | anon | SELECT |
| _dormant.competitive_seasons | authenticated | SELECT |
| _dormant.competitive_seasons | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_availability | anon | SELECT |
| _dormant.contact_availability | authenticated | SELECT |
| _dormant.contact_availability | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_cadence | anon | SELECT |
| _dormant.contact_cadence | authenticated | SELECT |
| _dormant.contact_cadence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_communication_style | anon | SELECT |
| _dormant.contact_communication_style | authenticated | SELECT |
| _dormant.contact_communication_style | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_compatibility | anon | SELECT |
| _dormant.contact_compatibility | authenticated | SELECT |
| _dormant.contact_compatibility | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_eq_scores | anon | SELECT |
| _dormant.contact_eq_scores | authenticated | SELECT |
| _dormant.contact_eq_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_metaprograms | anon | SELECT |
| _dormant.contact_metaprograms | authenticated | SELECT |
| _dormant.contact_metaprograms | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_preferences | anon | SELECT |
| _dormant.contact_preferences | authenticated | SELECT |
| _dormant.contact_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_relationships | anon | SELECT |
| _dormant.contact_relationships | authenticated | SELECT |
| _dormant.contact_relationships | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_relatives | anon | SELECT |
| _dormant.contact_relatives | authenticated | SELECT |
| _dormant.contact_relatives | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_rfm_scores | anon | SELECT |
| _dormant.contact_rfm_scores | authenticated | SELECT |
| _dormant.contact_rfm_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_tags | anon | SELECT |
| _dormant.contact_tags | authenticated | SELECT |
| _dormant.contact_tags | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_time_analysis | anon | SELECT |
| _dormant.contact_time_analysis | authenticated | SELECT |
| _dormant.contact_time_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_trigger_preferences | anon | SELECT |
| _dormant.contact_trigger_preferences | authenticated | SELECT |
| _dormant.contact_trigger_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.contact_values | anon | SELECT |
| _dormant.contact_values | authenticated | SELECT |
| _dormant.contact_values | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.custom_field_values | anon | SELECT |
| _dormant.custom_field_values | authenticated | SELECT |
| _dormant.custom_field_values | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.custom_fields | anon | SELECT |
| _dormant.custom_fields | authenticated | SELECT |
| _dormant.custom_fields | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.customer_contacts | anon | SELECT |
| _dormant.customer_contacts | authenticated | SELECT |
| _dormant.customer_contacts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.daily_challenge_progress | anon | SELECT |
| _dormant.daily_challenge_progress | authenticated | SELECT |
| _dormant.daily_challenge_progress | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.daily_metrics | anon | SELECT |
| _dormant.daily_metrics | authenticated | SELECT |
| _dormant.daily_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.daily_streak_achievements | anon | SELECT |
| _dormant.daily_streak_achievements | authenticated | SELECT |
| _dormant.daily_streak_achievements | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.dashboard_layouts | anon | SELECT |
| _dormant.dashboard_layouts | authenticated | SELECT |
| _dormant.dashboard_layouts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.dashboard_widgets | anon | SELECT |
| _dormant.dashboard_widgets | authenticated | SELECT |
| _dormant.dashboard_widgets | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deal_chat_history | anon | SELECT |
| _dormant.deal_chat_history | authenticated | SELECT |
| _dormant.deal_chat_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deal_history | anon | SELECT |
| _dormant.deal_history | authenticated | SELECT |
| _dormant.deal_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deal_outcomes | anon | SELECT |
| _dormant.deal_outcomes | authenticated | SELECT |
| _dormant.deal_outcomes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deal_products | anon | SELECT |
| _dormant.deal_products | authenticated | SELECT |
| _dormant.deal_products | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deal_products_catalog | anon | SELECT |
| _dormant.deal_products_catalog | authenticated | SELECT |
| _dormant.deal_products_catalog | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deal_stage_history | anon | SELECT |
| _dormant.deal_stage_history | authenticated | SELECT |
| _dormant.deal_stage_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.deals | anon | SELECT |
| _dormant.deals | authenticated | SELECT |
| _dormant.deals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.decision_criteria | anon | SELECT |
| _dormant.decision_criteria | authenticated | SELECT |
| _dormant.decision_criteria | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.demand_forecasts | anon | SELECT |
| _dormant.demand_forecasts | authenticated | SELECT |
| _dormant.demand_forecasts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.digest_history | anon | SELECT |
| _dormant.digest_history | authenticated | SELECT |
| _dormant.digest_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.digital_signatures | anon | SELECT |
| _dormant.digital_signatures | authenticated | SELECT |
| _dormant.digital_signatures | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_analysis_history | anon | SELECT |
| _dormant.disc_analysis_history | authenticated | SELECT |
| _dormant.disc_analysis_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_assessments | anon | SELECT |
| _dormant.disc_assessments | authenticated | SELECT |
| _dormant.disc_assessments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_communication_logs | anon | SELECT |
| _dormant.disc_communication_logs | authenticated | SELECT |
| _dormant.disc_communication_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_compatibility | anon | SELECT |
| _dormant.disc_compatibility | authenticated | SELECT |
| _dormant.disc_compatibility | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_conversion_metrics | anon | SELECT |
| _dormant.disc_conversion_metrics | authenticated | SELECT |
| _dormant.disc_conversion_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_interaction_signals | anon | SELECT |
| _dormant.disc_interaction_signals | authenticated | SELECT |
| _dormant.disc_interaction_signals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.disc_questions | anon | SELECT |
| _dormant.disc_questions | authenticated | SELECT |
| _dormant.disc_questions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.document_signers | anon | SELECT |
| _dormant.document_signers | authenticated | SELECT |
| _dormant.document_signers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.email_tracking_events | anon | SELECT |
| _dormant.email_tracking_events | authenticated | SELECT |
| _dormant.email_tracking_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.emotional_anchors | anon | SELECT |
| _dormant.emotional_anchors | authenticated | SELECT |
| _dormant.emotional_anchors | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.emotional_states | anon | SELECT |
| _dormant.emotional_states | authenticated | SELECT |
| _dormant.emotional_states | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.emotional_states_history | anon | SELECT |
| _dormant.emotional_states_history | authenticated | SELECT |
| _dormant.emotional_states_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.emotional_trend_snapshots | anon | SELECT |
| _dormant.emotional_trend_snapshots | authenticated | SELECT |
| _dormant.emotional_trend_snapshots | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.entity_versions | anon | SELECT |
| _dormant.entity_versions | authenticated | SELECT |
| _dormant.entity_versions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.eq_analysis_history | anon | SELECT |
| _dormant.eq_analysis_history | authenticated | SELECT |
| _dormant.eq_analysis_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.eq_pillar_details | anon | SELECT |
| _dormant.eq_pillar_details | authenticated | SELECT |
| _dormant.eq_pillar_details | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.favorite_templates | anon | SELECT |
| _dormant.favorite_templates | authenticated | SELECT |
| _dormant.favorite_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.feed_comments | anon | SELECT |
| _dormant.feed_comments | authenticated | SELECT |
| _dormant.feed_comments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.feed_reactions | anon | SELECT |
| _dormant.feed_reactions | authenticated | SELECT |
| _dormant.feed_reactions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.health_alert_settings | anon | SELECT |
| _dormant.health_alert_settings | authenticated | SELECT |
| _dormant.health_alert_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.health_alerts | anon | SELECT |
| _dormant.health_alerts | authenticated | SELECT |
| _dormant.health_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.hidden_objections | anon | SELECT |
| _dormant.hidden_objections | authenticated | SELECT |
| _dormant.hidden_objections | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.icp_data | anon | SELECT |
| _dormant.icp_data | authenticated | SELECT |
| _dormant.icp_data | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.inactivity_alerts | anon | SELECT |
| _dormant.inactivity_alerts | authenticated | SELECT |
| _dormant.inactivity_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.influence_network | anon | SELECT |
| _dormant.influence_network | authenticated | SELECT |
| _dormant.influence_network | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.insights | anon | SELECT |
| _dormant.insights | authenticated | SELECT |
| _dormant.insights | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.interaction_participants | anon | SELECT |
| _dormant.interaction_participants | authenticated | SELECT |
| _dormant.interaction_participants | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.inventory_levels | anon | SELECT |
| _dormant.inventory_levels | authenticated | SELECT |
| _dormant.inventory_levels | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.ip_whitelist | anon | SELECT |
| _dormant.ip_whitelist | authenticated | SELECT |
| _dormant.ip_whitelist | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.known_devices | anon | SELECT |
| _dormant.known_devices | authenticated | SELECT |
| _dormant.known_devices | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.kudos | anon | SELECT |
| _dormant.kudos | authenticated | SELECT |
| _dormant.kudos | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.lead_history | anon | SELECT |
| _dormant.lead_history | authenticated | SELECT |
| _dormant.lead_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.lead_routing_log | anon | SELECT |
| _dormant.lead_routing_log | authenticated | SELECT |
| _dormant.lead_routing_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.lead_scores | anon | SELECT |
| _dormant.lead_scores | authenticated | SELECT |
| _dormant.lead_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.leads | anon | SELECT |
| _dormant.leads | authenticated | SELECT |
| _dormant.leads | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.life_events | anon | SELECT |
| _dormant.life_events | authenticated | SELECT |
| _dormant.life_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.login_alerts | anon | SELECT |
| _dormant.login_alerts | authenticated | SELECT |
| _dormant.login_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.login_attempts | anon | SELECT |
| _dormant.login_attempts | authenticated | SELECT |
| _dormant.login_attempts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.lux_intelligence | anon | SELECT |
| _dormant.lux_intelligence | authenticated | SELECT |
| _dormant.lux_intelligence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.metaprogram_analysis | anon | SELECT |
| _dormant.metaprogram_analysis | authenticated | SELECT |
| _dormant.metaprogram_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.metaprogram_templates | anon | SELECT |
| _dormant.metaprogram_templates | authenticated | SELECT |
| _dormant.metaprogram_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.mfa_verification_attempts | anon | SELECT |
| _dormant.mfa_verification_attempts | authenticated | SELECT |
| _dormant.mfa_verification_attempts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.notes | anon | SELECT |
| _dormant.notes | authenticated | SELECT |
| _dormant.notes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.notification_preferences | anon | SELECT |
| _dormant.notification_preferences | authenticated | SELECT |
| _dormant.notification_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.notification_settings | anon | SELECT |
| _dormant.notification_settings | authenticated | SELECT |
| _dormant.notification_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.notifications | anon | SELECT |
| _dormant.notifications | authenticated | SELECT |
| _dormant.notifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.objection_templates | anon | SELECT |
| _dormant.objection_templates | authenticated | SELECT |
| _dormant.objection_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.objections | anon | SELECT |
| _dormant.objections | authenticated | SELECT |
| _dormant.objections | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.objections_library | anon | SELECT |
| _dormant.objections_library | authenticated | SELECT |
| _dormant.objections_library | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.offer_suggestions | anon | SELECT |
| _dormant.offer_suggestions | authenticated | SELECT |
| _dormant.offer_suggestions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.password_reset_requests | anon | SELECT |
| _dormant.password_reset_requests | authenticated | SELECT |
| _dormant.password_reset_requests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.performance_bets | anon | SELECT |
| _dormant.performance_bets | authenticated | SELECT |
| _dormant.performance_bets | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.personalized_message_templates | anon | SELECT |
| _dormant.personalized_message_templates | authenticated | SELECT |
| _dormant.personalized_message_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.pix_accounts | anon | SELECT |
| _dormant.pix_accounts | authenticated | SELECT |
| _dormant.pix_accounts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.playbook_items | anon | SELECT |
| _dormant.playbook_items | authenticated | SELECT |
| _dormant.playbook_items | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.playbook_progress | anon | SELECT |
| _dormant.playbook_progress | authenticated | SELECT |
| _dormant.playbook_progress | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.playbooks | anon | SELECT |
| _dormant.playbooks | authenticated | SELECT |
| _dormant.playbooks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.pre_contact_briefings | anon | SELECT |
| _dormant.pre_contact_briefings | authenticated | SELECT |
| _dormant.pre_contact_briefings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.price_alerts | anon | SELECT |
| _dormant.price_alerts | authenticated | SELECT |
| _dormant.price_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.price_history | anon | SELECT |
| _dormant.price_history | authenticated | SELECT |
| _dormant.price_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.prize_wheel_spins | anon | SELECT |
| _dormant.prize_wheel_spins | authenticated | SELECT |
| _dormant.prize_wheel_spins | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.products | anon | SELECT |
| _dormant.products | authenticated | SELECT |
| _dormant.products | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.progressive_goals | anon | SELECT |
| _dormant.progressive_goals | authenticated | SELECT |
| _dormant.progressive_goals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.prospect_cadences | anon | SELECT |
| _dormant.prospect_cadences | authenticated | SELECT |
| _dormant.prospect_cadences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.purchase_history | anon | SELECT |
| _dormant.purchase_history | authenticated | SELECT |
| _dormant.purchase_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.push_subscriptions | anon | SELECT |
| _dormant.push_subscriptions | authenticated | SELECT |
| _dormant.push_subscriptions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.quote_sync_logs | anon | SELECT |
| _dormant.quote_sync_logs | authenticated | SELECT |
| _dormant.quote_sync_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.quotes | anon | SELECT |
| _dormant.quotes | authenticated | SELECT |
| _dormant.quotes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rank_change_notifications | anon | SELECT |
| _dormant.rank_change_notifications | authenticated | SELECT |
| _dormant.rank_change_notifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rapport_score_history | anon | SELECT |
| _dormant.rapport_score_history | authenticated | SELECT |
| _dormant.rapport_score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rate_limit_logs | anon | SELECT |
| _dormant.rate_limit_logs | authenticated | SELECT |
| _dormant.rate_limit_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rate_limit_settings | anon | SELECT |
| _dormant.rate_limit_settings | authenticated | SELECT |
| _dormant.rate_limit_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.reauthentication_requests | anon | SELECT |
| _dormant.reauthentication_requests | authenticated | SELECT |
| _dormant.reauthentication_requests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rfm_analysis | anon | SELECT |
| _dormant.rfm_analysis | authenticated | SELECT |
| _dormant.rfm_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rfm_calculations | anon | SELECT |
| _dormant.rfm_calculations | authenticated | SELECT |
| _dormant.rfm_calculations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rfm_history | anon | SELECT |
| _dormant.rfm_history | authenticated | SELECT |
| _dormant.rfm_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.rfm_metrics | anon | SELECT |
| _dormant.rfm_metrics | authenticated | SELECT |
| _dormant.rfm_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.sales_battles | anon | SELECT |
| _dormant.sales_battles | authenticated | SELECT |
| _dormant.sales_battles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.sales_goals | anon | SELECT |
| _dormant.sales_goals | authenticated | SELECT |
| _dormant.sales_goals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.sales_streaks | anon | SELECT |
| _dormant.sales_streaks | authenticated | SELECT |
| _dormant.sales_streaks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.sales_territories | anon | SELECT |
| _dormant.sales_territories | authenticated | SELECT |
| _dormant.sales_territories | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.salesperson_badges | anon | SELECT |
| _dormant.salesperson_badges | authenticated | SELECT |
| _dormant.salesperson_badges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.salesperson_leagues | anon | SELECT |
| _dormant.salesperson_leagues | authenticated | SELECT |
| _dormant.salesperson_leagues | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.salesperson_preferences | anon | SELECT |
| _dormant.salesperson_preferences | authenticated | SELECT |
| _dormant.salesperson_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.salesperson_xp | anon | SELECT |
| _dormant.salesperson_xp | authenticated | SELECT |
| _dormant.salesperson_xp | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.satisfaction_scores | anon | SELECT |
| _dormant.satisfaction_scores | authenticated | SELECT |
| _dormant.satisfaction_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.saved_filters | anon | SELECT |
| _dormant.saved_filters | authenticated | SELECT |
| _dormant.saved_filters | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.score_history | anon | SELECT |
| _dormant.score_history | authenticated | SELECT |
| _dormant.score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.script_usage_log | anon | SELECT |
| _dormant.script_usage_log | authenticated | SELECT |
| _dormant.script_usage_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.security_alert_history | anon | SELECT |
| _dormant.security_alert_history | authenticated | SELECT |
| _dormant.security_alert_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.security_alert_settings | anon | SELECT |
| _dormant.security_alert_settings | authenticated | SELECT |
| _dormant.security_alert_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.shared_interests | anon | SELECT |
| _dormant.shared_interests | authenticated | SELECT |
| _dormant.shared_interests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.sla_configs | anon | SELECT |
| _dormant.sla_configs | authenticated | SELECT |
| _dormant.sla_configs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.smart_reminders | anon | SELECT |
| _dormant.smart_reminders | authenticated | SELECT |
| _dormant.smart_reminders | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.sms_verification_codes | anon | SELECT |
| _dormant.sms_verification_codes | authenticated | SELECT |
| _dormant.sms_verification_codes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.social_behavior_analysis | anon | SELECT |
| _dormant.social_behavior_analysis | authenticated | SELECT |
| _dormant.social_behavior_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.social_life_events | anon | SELECT |
| _dormant.social_life_events | authenticated | SELECT |
| _dormant.social_life_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.social_mentions | anon | SELECT |
| _dormant.social_mentions | authenticated | SELECT |
| _dormant.social_mentions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.social_profiles | anon | SELECT |
| _dormant.social_profiles | authenticated | SELECT |
| _dormant.social_profiles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.social_scraping_schedule | anon | SELECT |
| _dormant.social_scraping_schedule | authenticated | SELECT |
| _dormant.social_scraping_schedule | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.stakeholder_alerts | anon | SELECT |
| _dormant.stakeholder_alerts | authenticated | SELECT |
| _dormant.stakeholder_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.stock_movements | anon | SELECT |
| _dormant.stock_movements | authenticated | SELECT |
| _dormant.stock_movements | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.supplier_contacts | anon | SELECT |
| _dormant.supplier_contacts | authenticated | SELECT |
| _dormant.supplier_contacts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.supplier_order_items | anon | SELECT |
| _dormant.supplier_order_items | authenticated | SELECT |
| _dormant.supplier_order_items | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.supplier_orders | anon | SELECT |
| _dormant.supplier_orders | authenticated | SELECT |
| _dormant.supplier_orders | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.supplier_products | anon | SELECT |
| _dormant.supplier_products | authenticated | SELECT |
| _dormant.supplier_products | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.supplier_risk_assessments | anon | SELECT |
| _dormant.supplier_risk_assessments | authenticated | SELECT |
| _dormant.supplier_risk_assessments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.tasks | anon | SELECT |
| _dormant.tasks | authenticated | SELECT |
| _dormant.tasks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.team_closers | anon | SELECT |
| _dormant.team_closers | authenticated | SELECT |
| _dormant.team_closers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.teams | anon | SELECT |
| _dormant.teams | authenticated | SELECT |
| _dormant.teams | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.template_performance | anon | SELECT |
| _dormant.template_performance | authenticated | SELECT |
| _dormant.template_performance | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.territory_history | anon | SELECT |
| _dormant.territory_history | authenticated | SELECT |
| _dormant.territory_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.time_analysis | anon | SELECT |
| _dormant.time_analysis | authenticated | SELECT |
| _dormant.time_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.tournament_matches | anon | SELECT |
| _dormant.tournament_matches | authenticated | SELECT |
| _dormant.tournament_matches | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.tournament_participants | anon | SELECT |
| _dormant.tournament_participants | authenticated | SELECT |
| _dormant.tournament_participants | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.tournaments | anon | SELECT |
| _dormant.tournaments | authenticated | SELECT |
| _dormant.tournaments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_ab_tests | anon | SELECT |
| _dormant.trigger_ab_tests | authenticated | SELECT |
| _dormant.trigger_ab_tests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_channel_effectiveness | anon | SELECT |
| _dormant.trigger_channel_effectiveness | authenticated | SELECT |
| _dormant.trigger_channel_effectiveness | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_intensity_history | anon | SELECT |
| _dormant.trigger_intensity_history | authenticated | SELECT |
| _dormant.trigger_intensity_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_suggestions | anon | SELECT |
| _dormant.trigger_suggestions | authenticated | SELECT |
| _dormant.trigger_suggestions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_templates | anon | SELECT |
| _dormant.trigger_templates | authenticated | SELECT |
| _dormant.trigger_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_usage_history | anon | SELECT |
| _dormant.trigger_usage_history | authenticated | SELECT |
| _dormant.trigger_usage_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.trigger_usage_log | anon | SELECT |
| _dormant.trigger_usage_log | authenticated | SELECT |
| _dormant.trigger_usage_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.user_companies_link | anon | SELECT |
| _dormant.user_companies_link | authenticated | SELECT |
| _dormant.user_companies_link | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.user_contacts_link | anon | SELECT |
| _dormant.user_contacts_link | authenticated | SELECT |
| _dormant.user_contacts_link | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.user_disc_profile | anon | SELECT |
| _dormant.user_disc_profile | authenticated | SELECT |
| _dormant.user_disc_profile | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.user_favorite_templates | anon | SELECT |
| _dormant.user_favorite_templates | authenticated | SELECT |
| _dormant.user_favorite_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.user_mfa_settings | anon | SELECT |
| _dormant.user_mfa_settings | authenticated | SELECT |
| _dormant.user_mfa_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.user_roles | anon | SELECT |
| _dormant.user_roles | authenticated | SELECT |
| _dormant.user_roles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.vak_analysis_history | anon | SELECT |
| _dormant.vak_analysis_history | authenticated | SELECT |
| _dormant.vak_analysis_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.vak_profiles | anon | SELECT |
| _dormant.vak_profiles | authenticated | SELECT |
| _dormant.vak_profiles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.vak_templates | anon | SELECT |
| _dormant.vak_templates | authenticated | SELECT |
| _dormant.vak_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.victory_feed | anon | SELECT |
| _dormant.victory_feed | authenticated | SELECT |
| _dormant.victory_feed | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.webauthn_challenges | anon | SELECT |
| _dormant.webauthn_challenges | authenticated | SELECT |
| _dormant.webauthn_challenges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.webauthn_credentials | anon | SELECT |
| _dormant.webauthn_credentials | authenticated | SELECT |
| _dormant.webauthn_credentials | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.weekly_matchups | anon | SELECT |
| _dormant.weekly_matchups | authenticated | SELECT |
| _dormant.weekly_matchups | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.weekly_report_settings | anon | SELECT |
| _dormant.weekly_report_settings | authenticated | SELECT |
| _dormant.weekly_report_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.weekly_reports | anon | SELECT |
| _dormant.weekly_reports | authenticated | SELECT |
| _dormant.weekly_reports | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.whatsapp_instances | anon | SELECT |
| _dormant.whatsapp_instances | authenticated | SELECT |
| _dormant.whatsapp_instances | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.whatsapp_kpis | anon | SELECT |
| _dormant.whatsapp_kpis | authenticated | SELECT |
| _dormant.whatsapp_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.whatsapp_messages | anon | SELECT |
| _dormant.whatsapp_messages | authenticated | SELECT |
| _dormant.whatsapp_messages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.workflow_action_logs | anon | SELECT |
| _dormant.workflow_action_logs | authenticated | SELECT |
| _dormant.workflow_action_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.workflow_actions | anon | SELECT |
| _dormant.workflow_actions | authenticated | SELECT |
| _dormant.workflow_actions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.workflow_executions | anon | SELECT |
| _dormant.workflow_executions | authenticated | SELECT |
| _dormant.workflow_executions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.workflow_rules | anon | SELECT |
| _dormant.workflow_rules | authenticated | SELECT |
| _dormant.workflow_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.workflow_triggers | anon | SELECT |
| _dormant.workflow_triggers | authenticated | SELECT |
| _dormant.workflow_triggers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.workflows | anon | SELECT |
| _dormant.workflows | authenticated | SELECT |
| _dormant.workflows | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| _dormant.xp_history | anon | SELECT |
| _dormant.xp_history | authenticated | SELECT |
| _dormant.xp_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.abm_account_plans | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.abm_account_plans | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.abm_accounts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.abm_accounts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.abm_buying_committee | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.abm_buying_committee | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.abm_campaigns | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.abm_campaigns | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.abm_whitespace_opportunities | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.abm_whitespace_opportunities | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.access_blocked_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.access_blocked_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.access_security_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.access_security_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.achievements | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.achievements | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.activities | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.activities | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.activity_feed | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.activity_feed | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_chat_messages | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ai_chat_messages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_chat_threads | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ai_chat_threads | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics_2026_08 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics_2026_09 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics_2026_10 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics_2026_11 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics_2026_12 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_gateway_metrics_2027_01 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_recommendation_audit_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ai_recommendation_audit_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_recommendation_audit_logs_v2 | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ai_recommendation_audit_logs_v2 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_recommendation_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ai_recommendation_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ai_tone_preferences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ai_tone_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.alert_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.alert_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.applied_objection_responses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.applied_objection_responses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.asia_upload_mapping | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.asia_upload_mapping | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.attribution_models_cache | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.attribution_models_cache | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.attribution_touchpoints | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.attribution_touchpoints | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.audit_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.audit_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.automation_executions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.automation_executions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.automation_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.automation_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.automation_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.automation_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.automations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.automations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.badges | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.badges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.battle_cards | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.battle_cards | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.behavioral_insight_feedback | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.behavioral_insight_feedback | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.behavioral_profile_regen_queue | authenticated | DELETE, INSERT, SELECT |
| public.behavioral_profile_regen_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.brain_dominance_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.brain_dominance_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cadence_enrollments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cadence_enrollments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.calendar_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.calendar_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.call_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.call_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.campaign_members | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.campaign_members | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.campaign_recipients | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.campaign_recipients | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.campaigns | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.campaigns | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.canned_responses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.canned_responses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carrier_evaluations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.carrier_evaluations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carrier_homologations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.carrier_homologations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carrier_qualification_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.carrier_qualification_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carrier_score_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.carrier_score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carrier_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.carrier_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.carriers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.carriers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.churn_predictions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.churn_predictions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.churn_risk_factors | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.churn_risk_factors | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.churn_risk_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.churn_risk_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cidades | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cidades | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.city_whitelist | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.city_whitelist | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.client_values | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.client_values | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.clients | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.clients | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.closing_score_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.closing_score_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cnaes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cnaes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cnpj_cache | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cnpj_cache | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.coaching_scorecards | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.coaching_scorecards | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cognitive_bias_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cognitive_bias_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.commission_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.commission_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.commissions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.commissions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.communication_preferences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.communication_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.companies | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.companies | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_addresses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_addresses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_cadences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_cadences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_cnaes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_cnaes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_emails | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_emails | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_phones | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_phones | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_rfm_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_rfm_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_social_media | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_social_media | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_stakeholder_map | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_stakeholder_map | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.company_territories | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.company_territories | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.compatibility_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.compatibility_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.compatibility_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.compatibility_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.competitive_losses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.competitive_losses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.competitors | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.competitors | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.config_regras_negocio | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.config_regras_negocio | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.connection_anomalies | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.connection_anomalies | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.connection_configs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.connection_configs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.connection_quotas | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.connection_quotas | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.connection_test_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.connection_test_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.connector_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.connector_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_addresses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_addresses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_analytical_profile_versions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_analytical_profile_versions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_analytical_profiles | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_analytical_profiles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_automation_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_automation_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_behavior | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_behavior | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_business_context | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_business_context | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_cadence | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_cadence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_cadence_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_cadence_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_decision_making | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_decision_making | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_emails | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_emails | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_family_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_family_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_influence | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_influence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_metaprograms | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_metaprograms | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_next_actions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_next_actions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_notes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_notes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_objection_scripts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_objection_scripts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_personality | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_personality | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_phones | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_phones | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_predictive_roadmap | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_predictive_roadmap | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_preferences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_preferences_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_preferences_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_rapport_strategy | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_rapport_strategy | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_relatives | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_relatives | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_relatives_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_relatives_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_report_overrides | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_report_overrides | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_social_media | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_social_media | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_time_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_time_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contact_time_analysis_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contact_time_analysis_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.contacts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.contacts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.conversation_analyses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.conversation_analyses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.conversation_topics_catalog | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.conversation_topics_catalog | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.conversational_search_cache | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.conversational_search_cache | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.coop_sistemas | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.coop_sistemas | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_automation_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_automation_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_automation_reprocess_queue | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_automation_reprocess_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_cadence_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_cadence_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_consent_audit_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_consent_audit_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_metric_overrides | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_metric_overrides | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_objection_intelligence | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_objection_intelligence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.crm_relationship_audit_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.crm_relationship_audit_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cron_secrets | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cs_accounts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cs_accounts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cs_health_signals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cs_health_signals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cs_nps_responses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cs_nps_responses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cs_qbrs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cs_qbrs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.cs_renewals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.cs_renewals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.csat_surveys | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.csat_surveys | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.custom_field_values | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.custom_field_values | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.custom_fields | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.custom_fields | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_health_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_health_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_ownership_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_ownership_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_purchases | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_purchases | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_rotation_state | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_rotation_state | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_sdr_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_sdr_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customer_surveys | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customer_surveys | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.customers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.customers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.daily_challenges | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.daily_challenges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.data_quality_audits | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.data_quality_audits | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_competitors | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_competitors | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_forecasts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_forecasts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_items | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_items | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_room_activities | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_room_activities | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_room_comments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_room_comments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_room_documents | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_room_documents | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_room_milestones | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_room_milestones | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_room_stakeholders | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_room_stakeholders | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_rooms | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_rooms | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deal_velocity_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deal_velocity_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.deals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.deals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.decision_criteria | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.decision_criteria | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.device_login_notifications | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.device_login_notifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_analysis_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_analysis_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_analysis_history_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_analysis_history_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_approach_recommendations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_approach_recommendations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_communication_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_communication_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_conversion_metrics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_conversion_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_profile_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_profile_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.disc_templates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.disc_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.document_signatures | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.document_signatures | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.document_signatures_public | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.document_signatures_public | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.document_templates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.document_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.document_views | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.document_views | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.documents | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.documents | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.duplicate_candidates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.duplicate_candidates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.economic_group_members | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.economic_group_members | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.economic_groups | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.economic_groups | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.email_campaigns | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.email_campaigns | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.email_finder_results | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.email_finder_results | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.email_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.email_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.email_thread_summaries | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.email_thread_summaries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.email_verifications | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.email_verifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.embedding_configs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.embedding_configs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.emotional_anchors | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.emotional_anchors | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.emotional_states_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.emotional_states_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.entity_relationships | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.entity_relationships | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.eq_analysis_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.eq_analysis_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.eq_assessment_questions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.eq_assessment_questions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.error_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.error_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.estados | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.estados | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.external_data_audit_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.external_data_audit_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.favorite_templates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.favorite_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.favorites | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.favorites | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.feature_flags | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.feature_flags | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ficha360_conversation_summaries | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ficha360_conversation_summaries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.follow_up_approvals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.follow_up_approvals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.follow_up_approvals_v2 | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.follow_up_approvals_v2 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.forecast_categories_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.forecast_categories_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.forecast_periods | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.forecast_periods | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.forecast_quota_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.forecast_quota_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.forecast_snapshots | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.forecast_snapshots | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.form_submissions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.form_submissions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.forms | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.forms | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.forms_public | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.forms_public | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.geo_allowed_countries | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.geo_allowed_countries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.grupos_economicos | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.grupos_economicos | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.guardrail_ml_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.guardrail_ml_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.handoff_requests | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.handoff_requests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.health_alert_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.health_alert_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.health_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.health_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.hidden_objections | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.hidden_objections | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.import_jobs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.import_jobs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.inactivity_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.inactivity_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.incoming_webhook_dlq | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.incoming_webhook_dlq | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.incoming_webhook_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.incoming_webhook_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.incoming_webhook_nonces | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.incoming_webhooks | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.incoming_webhooks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.insights | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.insights | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.integration_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.integration_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.integrations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.integrations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.intent_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.intent_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.intent_signals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.intent_signals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.intent_tracking_pixels | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.intent_tracking_pixels | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.interaction_summaries | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.interaction_summaries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.interaction_templates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.interaction_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.interactions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.interactions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.interactions_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.interactions_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ip_whitelist | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ip_whitelist | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.knowledge_base_articles | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.knowledge_base_articles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.landing_page_submissions | anon | INSERT |
| public.landing_page_submissions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.landing_page_submissions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.landing_pages | anon | SELECT |
| public.landing_pages | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.landing_pages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.landing_pages_public | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.landing_pages_public | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_assignments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_assignments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_magnet_downloads | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_magnet_downloads | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_magnets | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_magnets | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_routing_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_routing_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_recompute_queue | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_recompute_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_threshold_automations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_threshold_automations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_threshold_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_threshold_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_score_thresholds | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_score_thresholds | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lead_sources | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lead_sources | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.life_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.life_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.life_events_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.life_events_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.login_attempts | authenticated | SELECT |
| public.login_attempts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.loss_reasons | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.loss_reasons | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lux_intelligence | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lux_intelligence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.lux_webhook_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.lux_webhook_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.marketing_campaign_stats | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.marketing_campaign_stats | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.marketing_roi_data | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.marketing_roi_data | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.mcp_tool_calls | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.mcp_tool_calls | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.meeting_summaries | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.meeting_summaries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.meetings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.meetings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.message_templates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.message_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.metaprogram_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.metaprogram_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.model_pricing_v2 | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.model_pricing_v2 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.mql_classifications | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.mql_classifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.mql_criteria | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.mql_criteria | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.mv_daily_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.mv_daily_stats | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.mv_daily_stats | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.neuro_behavioral_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.neuro_behavioral_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.neuro_pnl_sessions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.neuro_pnl_sessions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nlp_extractions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.nlp_extractions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nlp_feedback | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.nlp_feedback | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.notification_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.notification_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.notification_preferences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.notification_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.notifications | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.notifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nps_surveys | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.nps_surveys | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nurturing_enrollments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.nurturing_enrollments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nurturing_executions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.nurturing_executions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.nurturing_workflows | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.nurturing_workflows | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.oauth_tokens | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.oauth_tokens | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.objection_example_feedback | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.objection_example_feedback | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.offer_suggestions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.offer_suggestions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.password_reset_requests | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.password_reset_requests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.people_intelligence_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.people_intelligence_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.permissions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.permissions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.phone_validations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.phone_validations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.pipeline_stage_transitions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.pipeline_stage_transitions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.pipeline_stages | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.pipeline_stages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.pipelines | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.pipelines | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.playbook_usage_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.playbook_usage_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.portfolio_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.portfolio_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.product_novelties | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.product_novelties | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.products | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.products | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.profiles | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.profiles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.proposals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.proposals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.proximo_passo_feedback | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.proximo_passo_feedback | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.psychographic_audit_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.psychographic_audit_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.purchase_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.purchase_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.push_subscriptions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.push_subscriptions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.push_subscriptions_safe | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.push_subscriptions_safe | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.query_telemetry | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.query_telemetry | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.quick_notes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.quick_notes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ragas_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ragas_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.redistribution_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.redistribution_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.reframing_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.reframing_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.reframing_analysis_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.reframing_analysis_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.relationship_score_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.relationship_score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.reminders | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.reminders | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.report_executions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.report_executions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.revops_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.revops_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.revops_benchmarks | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.revops_benchmarks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.revops_snapshots | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.revops_snapshots | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rfm_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.rfm_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rfm_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.rfm_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rfm_metrics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.rfm_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rfm_segment_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.rfm_segment_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rodizio_distribuicao_staging | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.rodizio_distribuicao_staging | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rodizio_execucoes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.rodizio_execucoes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.role_permissions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.role_permissions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rpc_perf_samples | authenticated | SELECT |
| public.rpc_perf_samples | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.rpc_plan_snapshots | authenticated | SELECT |
| public.rpc_plan_snapshots | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales | authenticated | SELECT |
| public.sales | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_activities | authenticated | SELECT |
| public.sales_activities | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_cadences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_cadences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_forecasts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_forecasts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_goals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_goals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_opportunities | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_opportunities | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_playbooks | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_playbooks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_scripts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_scripts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_tasks | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_tasks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sales_team_members | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sales_team_members | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.salespeople | authenticated | SELECT |
| public.salespeople | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.scheduled_reports | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.scheduled_reports | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.scheduled_visits | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.scheduled_visits | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.schema_drift_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.schema_drift_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.score_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.script_sections | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.script_sections | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sdr_alert_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sdr_alert_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sdr_closer_assignments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sdr_closer_assignments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.search_products_cache | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.search_products_cache | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.secret_rotation_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.secret_rotation_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.seller_daily_metrics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.seller_daily_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.semantic_search_cache | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.semantic_search_cache | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sentiment_annotations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sentiment_annotations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sequence_email_reservations | authenticated | SELECT |
| public.sequence_email_reservations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sequence_enrollments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sequence_enrollments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sequence_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sequence_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sequence_send_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sequence_send_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sequence_steps | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sequence_steps | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sequences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sequences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sla_rules | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sla_rules | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sla_violations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sla_violations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sleight_of_mouth_examples | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sleight_of_mouth_examples | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sleight_of_mouth_patterns | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sleight_of_mouth_patterns | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.slow_queries_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.slow_queries_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sm_upload_mapping | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sm_upload_mapping | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.smart_notifications | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.smart_notifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.smart_segments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.smart_segments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sms_campaign_recipients | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sms_campaign_recipients | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sms_campaigns | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sms_campaigns | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sms_opt_outs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sms_opt_outs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sms_templates | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sms_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.social_behavior_analysis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.social_behavior_analysis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.social_consent_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.social_consent_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.social_life_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.social_life_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.social_profiles | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.social_profiles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.social_scraping_schedule | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.social_scraping_schedule | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.social_sync_queue | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.social_sync_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.staging_portal_sicoob | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.staging_portal_sicoob | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.stakeholder_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.stakeholder_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.suggested_life_events | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.suggested_life_events | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.suggested_rapport_intel | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.suggested_rapport_intel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.supplier_evaluations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.supplier_evaluations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.supplier_homologations | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.supplier_homologations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.supplier_qualification_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.supplier_qualification_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.supplier_score_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.supplier_score_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.supplier_scores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.supplier_scores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.suppliers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.suppliers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.support_tickets | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.support_tickets | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.sync_log | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.sync_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.system_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.system_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.system_config | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.system_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.system_health_snapshots | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.system_health_snapshots | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.tags | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.tags | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.tasks | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.tasks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.territories | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.territories | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.territory_assignments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.territory_assignments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.ticket_comments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.ticket_comments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.trigger_ab_tests | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.trigger_ab_tests | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.trigger_bundles | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.trigger_bundles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.trigger_channel_effectiveness | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.trigger_channel_effectiveness | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.trigger_intensity_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.trigger_intensity_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.trigger_types | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.trigger_types | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.trigger_usage_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.trigger_usage_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.uapi_sessions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.uapi_sessions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_badges | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.user_badges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_goals | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.user_goals | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_known_devices | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.user_known_devices | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_roles | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.user_roles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.user_ui_preferences | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.user_ui_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.users | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.users | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.users_public | authenticated | SELECT |
| public.users_public | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_channel_stats | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_channel_stats | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_companies_metrics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_companies_metrics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_company_summary | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_company_summary | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_contact_personality_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_contact_personality_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_contact_relatives_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_contact_relatives_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_contact_summary | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_contact_summary | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_daily_kpis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_daily_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_dashboard_kpis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_dashboard_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_deal_summary | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_deal_summary | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_entities | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_entities | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_guardrail_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_guardrail_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_life_events_audit | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_life_events_audit | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_model_catalog | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_model_catalog | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_nlp_analytics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_nlp_analytics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_pipeline_summary | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_pipeline_summary | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_ragas_by_agent | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_ragas_by_agent | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.v_recent_interactions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.v_recent_interactions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vak_analysis_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vak_analysis_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vak_keywords | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vak_keywords | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.validation_queue | authenticated | DELETE, INSERT, SELECT |
| public.validation_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.visit_checkins | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.visit_checkins | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_active_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_active_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_alertas_pendentes_vendedor | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_alertas_pendentes_vendedor | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_alertas_vendedor | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_alertas_vendedor | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_apelidos_progresso | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_apelidos_progresso | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_best_closing_moments | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_best_closing_moments | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_by_state | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_by_state | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_data_quality | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_data_quality | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_evaluations_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_evaluations_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_homologation_control | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_homologation_control | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_homologation_queue | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_homologation_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_qualification_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_qualification_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carrier_ranking | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carrier_ranking | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carriers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carriers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carriers_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carriers_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carteira_sdr | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carteira_sdr | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_carteira_vendedores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_carteira_vendedores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_churn_risk_ranking | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_churn_risk_ranking | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_cliente_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_cliente_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_clientes_prioridade | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_clientes_prioridade | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_closing_score_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_closing_score_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_closing_score_ranking | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_closing_score_ranking | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_communication_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_communication_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_companies_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_companies_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_companies_contato | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_companies_contato | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_companies_cores | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_companies_cores | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_companies_duplicatas | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_companies_duplicatas | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_companies_stats | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_companies_stats | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_company_addresses | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_company_addresses | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_company_social_media | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_company_social_media | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_contact_social_media | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_contact_social_media | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_contacts_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_contacts_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_contacts_contato | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_contacts_contato | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_contacts_full | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_contacts_full | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_contacts_sem_apelido | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_contacts_sem_apelido | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_cooperativas_estrutura | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_cooperativas_estrutura | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_customers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_customers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_customers_ativos | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_customers_ativos | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_customers_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_customers_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_dashboard_sdr | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_dashboard_sdr | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_dashboard_vendedor | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_dashboard_vendedor | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_dashboard_vendedor_v2 | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_dashboard_vendedor_v2 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_deal_velocity_benchmark | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_deal_velocity_benchmark | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_deals_full | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_deals_full | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_disc_compatibility | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_disc_compatibility | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_emotional_trend_by_contact | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_emotional_trend_by_contact | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_empresa_historico_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_empresa_historico_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_empresa_timeline_completa | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_empresa_timeline_completa | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_empresas_hierarquia | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_empresas_hierarquia | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_eq_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_eq_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_eq_evolution | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_eq_evolution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_forecast_mensal | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_forecast_mensal | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_grupos_economicos_resumo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_grupos_economicos_resumo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_historico_alertas | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_historico_alertas | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_historico_carteira | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_historico_carteira | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_historico_carteira_empresa | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_historico_carteira_empresa | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_historico_prospects | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_historico_prospects | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_historico_sdr_closer | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_historico_sdr_closer | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_historico_sdr_empresa | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_historico_sdr_empresa | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_interacoes_sem_apelido | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_interacoes_sem_apelido | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_interaction_timeline | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_interaction_timeline | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_leads_full | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_leads_full | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_matriz_filiais | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_matriz_filiais | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_notification_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_notification_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_pending_followups | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_pending_followups | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_pending_notifications | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_pending_notifications | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_pipeline_stats | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_pipeline_stats | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_pix_accounts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_pix_accounts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_primeiro_ativador | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_primeiro_ativador | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_quem_ativou | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_quem_ativou | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_quem_inativou | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_quem_inativou | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_rapport_points | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_rapport_points | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_recommended_scripts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_recommended_scripts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_reframe_suggestions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_reframe_suggestions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_resumo_alertas_vendedor | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_resumo_alertas_vendedor | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_resumo_diario_vendedor | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_resumo_diario_vendedor | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_risco_inativacao | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_risco_inativacao | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_rodizio_bloqueios | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_rodizio_bloqueios | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_rodizio_carga_closers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_rodizio_carga_closers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_rodizio_carga_sdrs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_rodizio_carga_sdrs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_rodizio_execucoes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_rodizio_execucoes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_rodizio_kpis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_rodizio_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_satisfaction_trend | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_satisfaction_trend | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_sdr_closer_atual | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_sdr_closer_atual | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_sdr_qtd_closers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_sdr_qtd_closers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_search_contacts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_search_contacts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_automation_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_automation_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_communication_intel | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_communication_intel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_contact_360 | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_contact_360 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_data_health | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_data_health | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_disc_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_disc_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_emotional_trend | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_emotional_trend | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_lux_status | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_lux_status | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_rapport_intel | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_rapport_intel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_readiness | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_readiness | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_singu_usage_kpis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_singu_usage_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_social_media_stats | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_social_media_stats | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_status_clientes | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_status_clientes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_alerts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_by_state | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_by_state | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_data_quality | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_data_quality | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_evaluations_history | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_evaluations_history | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_homologation_control | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_homologation_control | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_homologation_queue | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_homologation_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_qualification_dashboard | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_qualification_dashboard | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_supplier_ranking | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_supplier_ranking | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_suppliers | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_suppliers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_suppliers_completo | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_suppliers_completo | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_timeline_cliente | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_timeline_cliente | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_timeline_empresa | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_timeline_empresa | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_todays_reminders | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_todays_reminders | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_top_clientes_vendedor | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_top_clientes_vendedor | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_ultimo_inativador | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_ultimo_inativador | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.vw_workspace_overview | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.vw_workspace_overview | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webauthn_credentials | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.webauthn_credentials | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webhook_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.webhook_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.webhooks | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.webhooks | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.weekly_challenges | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.weekly_challenges | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.weekly_report_settings | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.weekly_report_settings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.weekly_reports | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.weekly_reports | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.whatsapp_ingestion_logs | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.whatsapp_ingestion_logs | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.whatsapp_instances | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.whatsapp_instances | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.whatsapp_kpis | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.whatsapp_kpis | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.whatsapp_messages | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.whatsapp_messages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.whatsapp_messages_index | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.whatsapp_messages_index | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.whatsapp_transcriptions | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.whatsapp_transcriptions | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.win_loss_insights | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.win_loss_insights | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.win_loss_reasons | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.win_loss_reasons | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.win_loss_records | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.win_loss_records | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.workspace_accounts | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.workspace_accounts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| public.xbz_upload_mapping | authenticated | DELETE, INSERT, SELECT, UPDATE |
| public.xbz_upload_mapping | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.bucket_lifecycle_states | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.buckets | anon | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets | authenticated | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.buckets_analytics | anon | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets_analytics | authenticated | DELETE, INSERT, SELECT, UPDATE |
| storage.buckets_analytics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.buckets_vectors | anon | SELECT |
| storage.buckets_vectors | authenticated | SELECT |
| storage.buckets_vectors | service_role | SELECT |
| storage.lifecycle_abandoned_artifacts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.objects | anon | DELETE, INSERT, SELECT, UPDATE |
| storage.objects | authenticated | DELETE, INSERT, SELECT, UPDATE |
| storage.objects | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.s3_multipart_uploads | anon | SELECT |
| storage.s3_multipart_uploads | authenticated | SELECT |
| storage.s3_multipart_uploads | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.s3_multipart_uploads_parts | anon | SELECT |
| storage.s3_multipart_uploads_parts | authenticated | SELECT |
| storage.s3_multipart_uploads_parts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| storage.vector_indexes | anon | SELECT |
| storage.vector_indexes | authenticated | SELECT |
| storage.vector_indexes | service_role | SELECT |
| zapp_history.admin_grants | authenticated | SELECT |
| zapp_history.admin_grants | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.ai_cost_log | authenticated | SELECT |
| zapp_history.ai_cost_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.ai_training_dataset | authenticated | SELECT |
| zapp_history.ai_training_dataset | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.async_request_log | authenticated | SELECT |
| zapp_history.async_request_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.conversation_daily_summaries | authenticated | SELECT |
| zapp_history.conversation_daily_summaries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.conversations | authenticated | INSERT, SELECT, UPDATE |
| zapp_history.conversations | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.disc_playbook | authenticated | SELECT |
| zapp_history.disc_playbook | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.edge_function_templates | authenticated | SELECT |
| zapp_history.edge_function_templates | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.location_dictionary | authenticated | SELECT |
| zapp_history.location_dictionary | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.message_audio | authenticated | INSERT, SELECT, UPDATE |
| zapp_history.message_audio | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.message_embeddings | authenticated | SELECT |
| zapp_history.message_embeddings | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.message_links | authenticated | INSERT, SELECT, UPDATE |
| zapp_history.message_links | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.message_media | authenticated | INSERT, SELECT, UPDATE |
| zapp_history.message_media | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.messages | authenticated | INSERT, SELECT, UPDATE |
| zapp_history.messages | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.phone_to_contact | authenticated | SELECT |
| zapp_history.phone_to_contact | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.product_dictionary | authenticated | SELECT |
| zapp_history.product_dictionary | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.runtime_config | authenticated | SELECT |
| zapp_history.runtime_config | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_audit_intelligence | authenticated | SELECT |
| zapp_history.v_audit_intelligence | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_authority_funnel | authenticated | SELECT |
| zapp_history.v_authority_funnel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_bant_distribution | authenticated | SELECT |
| zapp_history.v_bant_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_budget_sensitivity | authenticated | SELECT |
| zapp_history.v_budget_sensitivity | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_buying_triggers | authenticated | SELECT |
| zapp_history.v_buying_triggers | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_churn_alerts | authenticated | SELECT |
| zapp_history.v_churn_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_company_sizes | authenticated | SELECT |
| zapp_history.v_company_sizes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_competitor_alerts | authenticated | SELECT |
| zapp_history.v_competitor_alerts | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_complexity_distribution | authenticated | SELECT |
| zapp_history.v_complexity_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_contact_360 | authenticated | SELECT |
| zapp_history.v_contact_360 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_conversas_aguardando | authenticated | SELECT |
| zapp_history.v_conversas_aguardando | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_customization_demand | authenticated | SELECT |
| zapp_history.v_customization_demand | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_daily_cost | authenticated | SELECT |
| zapp_history.v_daily_cost | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_dashboard_atendimento | authenticated | SELECT |
| zapp_history.v_dashboard_atendimento | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_delivery_distribution | authenticated | SELECT |
| zapp_history.v_delivery_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_demanda_geografica | authenticated | SELECT |
| zapp_history.v_demanda_geografica | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_demanda_por_cidade | authenticated | SELECT |
| zapp_history.v_demanda_por_cidade | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_disc_distribution | authenticated | SELECT |
| zapp_history.v_disc_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_disc_funnel_matrix | authenticated | SELECT |
| zapp_history.v_disc_funnel_matrix | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_emotional_states | authenticated | SELECT |
| zapp_history.v_emotional_states | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_eventos_demanda | authenticated | SELECT |
| zapp_history.v_eventos_demanda | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_full_intelligence_stream | authenticated | SELECT |
| zapp_history.v_full_intelligence_stream | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_funil_origem | authenticated | SELECT |
| zapp_history.v_funil_origem | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_funil_vendas | authenticated | SELECT |
| zapp_history.v_funil_vendas | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_hesitation_funnel | authenticated | SELECT |
| zapp_history.v_hesitation_funnel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_intelligence_360 | authenticated | SELECT |
| zapp_history.v_intelligence_360 | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_intents_distribution | authenticated | SELECT |
| zapp_history.v_intents_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_journey_funnel | authenticated | SELECT |
| zapp_history.v_journey_funnel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_language_distribution | authenticated | SELECT |
| zapp_history.v_language_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_melhores_horarios | authenticated | SELECT |
| zapp_history.v_melhores_horarios | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_objecoes_recorrentes | authenticated | SELECT |
| zapp_history.v_objecoes_recorrentes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_payment_preferences | authenticated | SELECT |
| zapp_history.v_payment_preferences | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_pedidos_detectados | authenticated | SELECT |
| zapp_history.v_pedidos_detectados | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_pipeline_pending | authenticated | SELECT |
| zapp_history.v_pipeline_pending | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_priority_matrix | authenticated | SELECT |
| zapp_history.v_priority_matrix | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_proximas_respostas | authenticated | SELECT |
| zapp_history.v_proximas_respostas | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_question_topics | authenticated | SELECT |
| zapp_history.v_question_topics | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_recent_summaries | authenticated | SELECT |
| zapp_history.v_recent_summaries | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_referral_sources | authenticated | SELECT |
| zapp_history.v_referral_sources | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_relationship_funnel | authenticated | SELECT |
| zapp_history.v_relationship_funnel | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_routing_queue | authenticated | SELECT |
| zapp_history.v_routing_queue | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_runtime_config_safe | authenticated | SELECT |
| zapp_history.v_runtime_config_safe | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_seasonality_demand | authenticated | SELECT |
| zapp_history.v_seasonality_demand | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_segmentacao_clientes | authenticated | SELECT |
| zapp_history.v_segmentacao_clientes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_sla_atendimento | authenticated | SELECT |
| zapp_history.v_sla_atendimento | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_spam_log | authenticated | SELECT |
| zapp_history.v_spam_log | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_speaker_roles | authenticated | SELECT |
| zapp_history.v_speaker_roles | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_tom_comunicacao | authenticated | SELECT |
| zapp_history.v_tom_comunicacao | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_top_contatos_potencial | authenticated | SELECT |
| zapp_history.v_top_contatos_potencial | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_top_produtos_demanda | authenticated | SELECT |
| zapp_history.v_top_produtos_demanda | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_topicos_recorrentes | authenticated | SELECT |
| zapp_history.v_topicos_recorrentes | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_units_distribution | authenticated | SELECT |
| zapp_history.v_units_distribution | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.v_volume_por_hora | authenticated | SELECT |
| zapp_history.v_volume_por_hora | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
| zapp_history.whatsapp_connections | authenticated | INSERT, SELECT, UPDATE |
| zapp_history.whatsapp_connections | service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |


## Colunas (grants parciais)

| coluna | role | privilégios |
|---|---|---|
| public.forms.description | anon | SELECT |
| public.forms.fields | anon | SELECT |
| public.forms.id | anon | SELECT |
| public.forms.is_published | anon | SELECT |
| public.forms.name | anon | SELECT |
| public.forms.redirect_url | anon | SELECT |
| public.forms.slug | anon | SELECT |
| public.forms.success_message | anon | SELECT |
| public.lead_magnets.description | anon | SELECT |
| public.lead_magnets.id | anon | SELECT |
| public.lead_magnets.is_published | anon | SELECT |
| public.lead_magnets.slug | anon | SELECT |
| public.lead_magnets.thumbnail_url | anon | SELECT |
| public.lead_magnets.title | anon | SELECT |
| public.lead_magnets.type | anon | SELECT |


## Sequences (roles da API)

| sequence | role | privilégios |
|---|---|---|
| public.asia_upload_mapping_id_seq | authenticated | USAGE, SELECT |
| public.asia_upload_mapping_id_seq | service_role | USAGE, SELECT, UPDATE |
| public.config_regras_negocio_id_seq | authenticated | USAGE, SELECT |
| public.config_regras_negocio_id_seq | service_role | USAGE, SELECT, UPDATE |
| public.connector_log_id_seq | authenticated | USAGE, SELECT |
| public.connector_log_id_seq | service_role | USAGE, SELECT, UPDATE |
| public.proposal_number_seq | authenticated | USAGE, SELECT |
| public.proposal_number_seq | service_role | USAGE, SELECT, UPDATE |
| public.quote_number_seq | authenticated | USAGE, SELECT |
| public.quote_number_seq | service_role | USAGE, SELECT, UPDATE |
| public.rpc_perf_samples_id_seq | service_role | USAGE, SELECT, UPDATE |
| public.staging_portal_sicoob_id_seq | authenticated | USAGE, SELECT |
| public.staging_portal_sicoob_id_seq | service_role | USAGE, SELECT, UPDATE |
| public.support_tickets_ticket_number_seq | authenticated | USAGE, SELECT |
| public.support_tickets_ticket_number_seq | service_role | USAGE, SELECT, UPDATE |
| public.xbz_upload_mapping_id_seq | authenticated | USAGE, SELECT |
| public.xbz_upload_mapping_id_seq | service_role | USAGE, SELECT, UPDATE |
| zapp_history.ai_cost_log_id_seq | service_role | USAGE, SELECT, UPDATE |


## Default privileges (aplicam-se a objetos NOVOS)

| schema | owner | tipo | ACL |
|---|---|---|---|
| auth | supabase_auth_admin | functions | postgres=X/supabase_auth_admin, dashboard_user=X/supabase_auth_admin |
| auth | supabase_auth_admin | sequences | postgres=rwU/supabase_auth_admin, dashboard_user=rwU/supabase_auth_admin |
| auth | supabase_auth_admin | tables | postgres=arwdDxtm/supabase_auth_admin, dashboard_user=arwdDxtm/supabase_auth_admin |
| cron | supabase_admin | functions | postgres=X*/supabase_admin |
| cron | supabase_admin | sequences | postgres=r*w*U*/supabase_admin |
| cron | supabase_admin | tables | postgres=a*r*w*d*D*x*t*m*/supabase_admin |
| extensions | supabase_admin | functions | postgres=X*/supabase_admin |
| extensions | supabase_admin | sequences | postgres=r*w*U*/supabase_admin |
| extensions | supabase_admin | tables | postgres=a*r*w*d*D*x*t*m*/supabase_admin |
| graphql | supabase_admin | functions | postgres=X/supabase_admin, anon=X/supabase_admin, authenticated=X/supabase_admin, service_role=X/supabase_admin |
| graphql | supabase_admin | sequences | postgres=rwU/supabase_admin, anon=rwU/supabase_admin, authenticated=rwU/supabase_admin, service_role=rwU/supabase_admin |
| graphql | supabase_admin | tables | postgres=arwdDxtm/supabase_admin, anon=arwdDxtm/supabase_admin, authenticated=arwdDxtm/supabase_admin, service_role=arwdDxtm/supabase_admin |
| graphql_public | supabase_admin | functions | postgres=X/supabase_admin, anon=X/supabase_admin, authenticated=X/supabase_admin, service_role=X/supabase_admin |
| graphql_public | supabase_admin | sequences | postgres=rwU/supabase_admin, anon=rwU/supabase_admin, authenticated=rwU/supabase_admin, service_role=rwU/supabase_admin |
| graphql_public | supabase_admin | tables | postgres=arwdDxtm/supabase_admin, anon=arwdDxtm/supabase_admin, authenticated=arwdDxtm/supabase_admin, service_role=arwdDxtm/supabase_admin |
| public | postgres | functions | postgres=X/postgres, authenticated=X/postgres, service_role=X/postgres |
| public | postgres | sequences | postgres=rwU/postgres, authenticated=rwU/postgres, service_role=rwU/postgres |
| public | postgres | tables | postgres=arwdDxtm/postgres, authenticated=arwdm/postgres, service_role=arwdDxtm/postgres |
| public | supabase_admin | functions | postgres=X/supabase_admin, anon=X/supabase_admin, authenticated=X/supabase_admin, service_role=X/supabase_admin |
| public | supabase_admin | sequences | postgres=rwU/supabase_admin, anon=rwU/supabase_admin, authenticated=rwU/supabase_admin, service_role=rwU/supabase_admin |
| public | supabase_admin | tables | postgres=arwdDxtm/supabase_admin, anon=arwdDxtm/supabase_admin, authenticated=arwdDxtm/supabase_admin, service_role=arwdDxtm/supabase_admin |
| realtime | supabase_admin | functions | postgres=X/supabase_admin, dashboard_user=X/supabase_admin |
| realtime | supabase_admin | sequences | postgres=rwU/supabase_admin, dashboard_user=rwU/supabase_admin |
| realtime | supabase_admin | tables | postgres=a*r*wdDxtm/supabase_admin, dashboard_user=arwdDxtm/supabase_admin |
| storage | postgres | functions | postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres |
| storage | postgres | sequences | postgres=rwU/postgres, anon=rwU/postgres, authenticated=rwU/postgres, service_role=rwU/postgres |
| storage | postgres | tables | postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres, authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres |
| zapp_history | postgres | functions | authenticated=X/postgres, service_role=X/postgres |
| zapp_history | postgres | tables | authenticated=r/postgres, service_role=arwdDxtm/postgres |
