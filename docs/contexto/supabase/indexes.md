# Índices

Uso e tamanho em `stats.md`.

| tabela | índice | método | colunas | único | válido | predicado |
|---|---|---|---|---|---|---|
| _dormant.access_denied_logs | access_denied_logs_pkey | btree | id | sim | sim |  |
| _dormant.active_power_ups | active_power_ups_pkey | btree | id | sim | sim |  |
| _dormant.active_sessions | active_sessions_pkey | btree | id | sim | sim |  |
| _dormant.activity_goals | activity_goals_pkey | btree | id | sim | sim |  |
| _dormant.activity_goals | activity_goals_salesperson_id_key | btree | salesperson_id | sim | sim |  |
| _dormant.activity_log | activity_log_pkey | btree | id | sim | sim |  |
| _dormant.alert_log | alert_log_pkey | btree | id | sim | sim |  |
| _dormant.alertas_inativacao | alertas_inativacao_customer_id_tipo_alerta_data_referencia_key | btree | customer_id, tipo_alerta, data_referencia | sim | sim |  |
| _dormant.alertas_inativacao | alertas_inativacao_pkey | btree | id | sim | sim |  |
| _dormant.api_usage_log | api_usage_log_pkey | btree | id | sim | sim |  |
| _dormant.automation_logs | automation_logs_pkey | btree | id | sim | sim |  |
| _dormant.automation_rules | automation_rules_pkey | btree | id | sim | sim |  |
| _dormant.available_spins | available_spins_pkey | btree | id | sim | sim |  |
| _dormant.available_spins | available_spins_salesperson_id_key | btree | salesperson_id | sim | sim |  |
| _dormant.battle_participants | battle_participants_battle_id_salesperson_id_key | btree | battle_id, salesperson_id | sim | sim |  |
| _dormant.battle_participants | battle_participants_pkey | btree | id | sim | sim |  |
| _dormant.bitrix24_sync_logs | bitrix24_sync_logs_pkey | btree | id | sim | sim |  |
| _dormant.blocked_ips | blocked_ips_ip_address_key | btree | ip_address | sim | sim |  |
| _dormant.blocked_ips | blocked_ips_pkey | btree | id | sim | sim |  |
| _dormant.cadence_steps | cadence_steps_pkey | btree | id | sim | sim |  |
| _dormant.cadence_tasks | cadence_tasks_pkey | btree | id | sim | sim |  |
| _dormant.cadences | cadences_pkey | btree | id | sim | sim |  |
| _dormant.carrier_contacts | carrier_contacts_contact_id_key | btree | contact_id | sim | sim |  |
| _dormant.carrier_contacts | carrier_contacts_pkey | btree | id | sim | sim |  |
| _dormant.category_metrics | category_metrics_date_category_key | btree | date, category | sim | sim |  |
| _dormant.category_metrics | category_metrics_pkey | btree | id | sim | sim |  |
| _dormant.challenge_progress | challenge_progress_challenge_id_salesperson_id_key | btree | challenge_id, salesperson_id | sim | sim |  |
| _dormant.challenge_progress | challenge_progress_pkey | btree | id | sim | sim |  |
| _dormant.chat_conversations | chat_conversations_pkey | btree | id | sim | sim |  |
| _dormant.chat_messages | chat_messages_pkey | btree | id | sim | sim |  |
| _dormant.circuit_breaker_events | circuit_breaker_events_pkey | btree | id | sim | sim |  |
| _dormant.client_portfolio | client_portfolio_client_id_salesperson_id_key | btree | client_id, salesperson_id | sim | sim |  |
| _dormant.client_portfolio | client_portfolio_pkey | btree | id | sim | sim |  |
| _dormant.client_values | client_values_pkey | btree | id | sim | sim |  |
| _dormant.client_values | client_values_user_id_contact_id_category_value_name_key | btree | user_id, contact_id, category, value_name | sim | sim |  |
| _dormant.client_values | idx_client_values_contact | btree | contact_id | não | sim |  |
| _dormant.closing_moment_analysis | closing_moment_analysis_pkey | btree | id | sim | sim |  |
| _dormant.cognitive_bias_history | cognitive_bias_history_pkey | btree | id | sim | sim |  |
| _dormant.cognitive_bias_history | idx_cognitive_bias_history_contact_id | btree | contact_id | não | sim |  |
| _dormant.cognitive_biases | cognitive_biases_pkey | btree | id | sim | sim |  |
| _dormant.collectible_badges | collectible_badges_name_key | btree | name | sim | sim |  |
| _dormant.collectible_badges | collectible_badges_pkey | btree | id | sim | sim |  |
| _dormant.communication_cadence | communication_cadence_pkey | btree | id | sim | sim |  |
| _dormant.communication_cadence | idx_cadence_unique | btree | contact_id | sim | sim |  |
| _dormant.communication_preferences | communication_preferences_pkey | btree | id | sim | sim |  |
| _dormant.communication_preferences | idx_comm_prefs_unique | btree | contact_id | sim | sim |  |
| _dormant.company_tags | company_tags_pkey | btree | company_id, tag_id | sim | sim |  |
| _dormant.compatibility_alerts | compatibility_alerts_pkey | btree | id | sim | sim |  |
| _dormant.compatibility_settings | compatibility_settings_pkey | btree | id | sim | sim |  |
| _dormant.compatibility_settings | compatibility_settings_user_id_key | btree | user_id | sim | sim |  |
| _dormant.competitive_chat_messages | competitive_chat_messages_pkey | btree | id | sim | sim |  |
| _dormant.competitive_seasons | competitive_seasons_pkey | btree | id | sim | sim |  |
| _dormant.contact_availability | contact_availability_pkey | btree | id | sim | sim |  |
| _dormant.contact_cadence | contact_cadence_pkey | btree | id | sim | sim |  |
| _dormant.contact_cadence | contact_cadence_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| _dormant.contact_communication_style | contact_communication_style_pkey | btree | id | sim | sim |  |
| _dormant.contact_compatibility | contact_compatibility_pkey | btree | id | sim | sim |  |
| _dormant.contact_compatibility | idx_compatibility_unique | btree | user_id, contact_id | sim | sim |  |
| _dormant.contact_eq_scores | contact_eq_scores_pkey | btree | id | sim | sim |  |
| _dormant.contact_metaprograms | contact_metaprograms_pkey | btree | id | sim | sim |  |
| _dormant.contact_metaprograms | idx_metaprograms_unique | btree | contact_id | sim | sim |  |
| _dormant.contact_preferences | contact_preferences_pkey | btree | id | sim | sim |  |
| _dormant.contact_preferences | contact_preferences_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| _dormant.contact_relationships | contact_relationships_pkey | btree | id | sim | sim |  |
| _dormant.contact_relationships | contact_relationships_user_id_contact_a_id_contact_b_id_rel_key | btree | user_id, contact_a_id, contact_b_id, relationship_type | sim | sim |  |
| _dormant.contact_relatives | contact_relatives_pkey | btree | id | sim | sim |  |
| _dormant.contact_rfm_scores | contact_rfm_scores_pkey | btree | id | sim | sim |  |
| _dormant.contact_rfm_scores | idx_rfm_scores_contact_unique | btree | contact_id | sim | sim |  |
| _dormant.contact_tags | contact_tags_pkey | btree | contact_id, tag_id | sim | sim |  |
| _dormant.contact_time_analysis | contact_time_analysis_pkey | btree | id | sim | sim |  |
| _dormant.contact_time_analysis | contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key | btree | user_id, contact_id, day_of_week, hour_of_day | sim | sim |  |
| _dormant.contact_time_analysis | idx_contact_time_analysis_contact | btree | contact_id | não | sim |  |
| _dormant.contact_trigger_preferences | contact_trigger_preferences_pkey | btree | id | sim | sim |  |
| _dormant.contact_trigger_preferences | idx_trigger_prefs_unique | btree | contact_id | sim | sim |  |
| _dormant.contact_values | contact_values_pkey | btree | id | sim | sim |  |
| _dormant.custom_field_values | custom_field_values_custom_field_id_entity_id_key | btree | custom_field_id, entity_id | sim | sim |  |
| _dormant.custom_field_values | custom_field_values_pkey | btree | id | sim | sim |  |
| _dormant.custom_fields | custom_fields_entity_type_field_name_key | btree | entity_type, field_name | sim | sim |  |
| _dormant.custom_fields | custom_fields_pkey | btree | id | sim | sim |  |
| _dormant.customer_contacts | customer_contacts_contact_id_key | btree | contact_id | sim | sim |  |
| _dormant.customer_contacts | customer_contacts_pkey | btree | id | sim | sim |  |
| _dormant.daily_challenge_progress | daily_challenge_progress_challenge_id_salesperson_id_key | btree | challenge_id, salesperson_id | sim | sim |  |
| _dormant.daily_challenge_progress | daily_challenge_progress_pkey | btree | id | sim | sim |  |
| _dormant.daily_metrics | daily_metrics_date_key | btree | date | sim | sim |  |
| _dormant.daily_metrics | daily_metrics_pkey | btree | id | sim | sim |  |
| _dormant.daily_streak_achievements | daily_streak_achievements_pkey | btree | id | sim | sim |  |
| _dormant.daily_streak_achievements | daily_streak_achievements_salesperson_id_streak_type_key | btree | salesperson_id, streak_type | sim | sim |  |
| _dormant.dashboard_layouts | dashboard_layouts_pkey | btree | id | sim | sim |  |
| _dormant.dashboard_layouts | dashboard_layouts_user_id_layout_name_key | btree | user_id, layout_name | sim | sim |  |
| _dormant.dashboard_widgets | dashboard_widgets_pkey | btree | id | sim | sim |  |
| _dormant.deal_chat_history | deal_chat_history_pkey | btree | id | sim | sim |  |
| _dormant.deal_history | deal_history_pkey | btree | id | sim | sim |  |
| _dormant.deal_outcomes | deal_outcomes_pkey | btree | id | sim | sim |  |
| _dormant.deal_products | deal_products_pkey | btree | id | sim | sim |  |
| _dormant.deal_products_catalog | deal_products_catalog_codigo_key | btree | codigo | sim | sim |  |
| _dormant.deal_products_catalog | deal_products_catalog_pkey | btree | id | sim | sim |  |
| _dormant.deal_stage_history | deal_stage_history_pkey | btree | id | sim | sim |  |
| _dormant.deals | deals_codigo_key | btree | codigo | sim | sim |  |
| _dormant.deals | deals_pkey | btree | id | sim | sim |  |
| _dormant.decision_criteria | decision_criteria_pkey | btree | id | sim | sim |  |
| _dormant.demand_forecasts | demand_forecasts_pkey | btree | id | sim | sim |  |
| _dormant.digest_history | digest_history_pkey | btree | id | sim | sim |  |
| _dormant.digital_signatures | digital_signatures_pkey | btree | id | sim | sim |  |
| _dormant.disc_analysis_history | disc_analysis_history_pkey | btree | id | sim | sim |  |
| _dormant.disc_analysis_history | idx_disc_analysis_history_contact | btree | contact_id | não | sim |  |
| _dormant.disc_assessments | disc_assessments_pkey | btree | id | sim | sim |  |
| _dormant.disc_communication_logs | disc_communication_logs_pkey | btree | id | sim | sim |  |
| _dormant.disc_communication_logs | idx_disc_communication_logs_contact | btree | contact_id | não | sim |  |
| _dormant.disc_compatibility | disc_compatibility_pkey | btree | id | sim | sim |  |
| _dormant.disc_compatibility | disc_compatibility_profile_a_profile_b_key | btree | profile_a, profile_b | sim | sim |  |
| _dormant.disc_conversion_metrics | disc_conversion_metrics_pkey | btree | id | sim | sim |  |
| _dormant.disc_conversion_metrics | disc_conversion_metrics_user_id_disc_profile_period_start_p_key | btree | user_id, disc_profile, period_start, period_end | sim | sim |  |
| _dormant.disc_interaction_signals | disc_interaction_signals_pkey | btree | id | sim | sim |  |
| _dormant.disc_questions | disc_questions_pkey | btree | id | sim | sim |  |
| _dormant.document_signers | document_signers_pkey | btree | id | sim | sim |  |
| _dormant.email_tracking_events | email_tracking_events_pkey | btree | id | sim | sim |  |
| _dormant.emotional_anchors | emotional_anchors_pkey | btree | id | sim | sim |  |
| _dormant.emotional_states | emotional_states_pkey | btree | id | sim | sim |  |
| _dormant.emotional_states_history | emotional_states_history_pkey | btree | id | sim | sim |  |
| _dormant.emotional_states_history | idx_emotional_states_contact | btree | contact_id | não | sim |  |
| _dormant.emotional_trend_snapshots | emotional_trend_snapshots_pkey | btree | id | sim | sim |  |
| _dormant.entity_versions | entity_versions_pkey | btree | id | sim | sim |  |
| _dormant.entity_versions | unique_entity_version | btree | entity_type, entity_id, version_number | sim | sim |  |
| _dormant.eq_analysis_history | eq_analysis_history_pkey | btree | id | sim | sim |  |
| _dormant.eq_analysis_history | idx_eq_analysis_history_contact_id | btree | contact_id | não | sim |  |
| _dormant.eq_pillar_details | eq_pillar_details_pkey | btree | id | sim | sim |  |
| _dormant.favorite_templates | favorite_templates_pkey | btree | id | sim | sim |  |
| _dormant.favorite_templates | favorite_templates_user_id_template_id_key | btree | user_id, template_id | sim | sim |  |
| _dormant.feed_comments | feed_comments_pkey | btree | id | sim | sim |  |
| _dormant.feed_reactions | feed_reactions_feed_item_id_salesperson_id_key | btree | feed_item_id, salesperson_id | sim | sim |  |
| _dormant.feed_reactions | feed_reactions_pkey | btree | id | sim | sim |  |
| _dormant.health_alert_settings | health_alert_settings_pkey | btree | id | sim | sim |  |
| _dormant.health_alert_settings | unique_user_health_settings | btree | user_id | sim | sim |  |
| _dormant.health_alerts | health_alerts_pkey | btree | id | sim | sim |  |
| _dormant.hidden_objections | hidden_objections_pkey | btree | id | sim | sim |  |
| _dormant.hidden_objections | idx_hidden_objections_contact | btree | contact_id | não | sim |  |
| _dormant.icp_data | icp_data_client_id_key | btree | client_id | sim | sim |  |
| _dormant.icp_data | icp_data_pkey | btree | id | sim | sim |  |
| _dormant.inactivity_alerts | inactivity_alerts_pkey | btree | id | sim | sim |  |
| _dormant.influence_network | idx_influence_unique | btree | contact_id | sim | sim |  |
| _dormant.influence_network | influence_network_pkey | btree | id | sim | sim |  |
| _dormant.insights | insights_pkey | btree | id | sim | sim |  |
| _dormant.interaction_participants | interaction_participants_pkey | btree | id | sim | sim |  |
| _dormant.inventory_levels | inventory_levels_pkey | btree | id | sim | sim |  |
| _dormant.inventory_levels | inventory_levels_product_id_key | btree | product_id | sim | sim |  |
| _dormant.ip_whitelist | ip_whitelist_ip_address_key | btree | ip_address | sim | sim |  |
| _dormant.ip_whitelist | ip_whitelist_pkey | btree | id | sim | sim |  |
| _dormant.known_devices | known_devices_pkey | btree | id | sim | sim |  |
| _dormant.kudos | kudos_pkey | btree | id | sim | sim |  |
| _dormant.lead_history | lead_history_pkey | btree | id | sim | sim |  |
| _dormant.lead_routing_log | lead_routing_log_pkey | btree | id | sim | sim |  |
| _dormant.lead_scores | lead_scores_pkey | btree | id | sim | sim |  |
| _dormant.lead_scores | lead_scores_sale_id_key | btree | sale_id | sim | sim |  |
| _dormant.leads | leads_codigo_key | btree | codigo | sim | sim |  |
| _dormant.leads | leads_pkey | btree | id | sim | sim |  |
| _dormant.life_events | life_events_pkey | btree | id | sim | sim |  |
| _dormant.login_alerts | login_alerts_pkey | btree | id | sim | sim |  |
| _dormant.login_attempts | login_attempts_pkey | btree | id | sim | sim |  |
| _dormant.lux_intelligence | lux_intelligence_pkey | btree | id | sim | sim |  |
| _dormant.metaprogram_analysis | metaprogram_analysis_pkey | btree | id | sim | sim |  |
| _dormant.metaprogram_templates | metaprogram_templates_pkey | btree | id | sim | sim |  |
| _dormant.mfa_verification_attempts | mfa_verification_attempts_pkey | btree | id | sim | sim |  |
| _dormant.notes | notes_pkey | btree | id | sim | sim |  |
| _dormant.notification_preferences | notification_preferences_pkey | btree | id | sim | sim |  |
| _dormant.notification_settings | idx_notif_settings_user | btree | user_id | sim | sim |  |
| _dormant.notification_settings | notification_settings_pkey | btree | id | sim | sim |  |
| _dormant.notifications | notifications_pkey | btree | id | sim | sim |  |
| _dormant.objection_templates | objection_templates_pkey | btree | id | sim | sim |  |
| _dormant.objections | objections_pkey | btree | id | sim | sim |  |
| _dormant.objections_library | objections_library_pkey | btree | id | sim | sim |  |
| _dormant.offer_suggestions | offer_suggestions_pkey | btree | id | sim | sim |  |
| _dormant.password_reset_requests | password_reset_requests_pkey | btree | id | sim | sim |  |
| _dormant.password_reset_requests | password_reset_requests_token_key | btree | token | sim | sim |  |
| _dormant.performance_bets | performance_bets_pkey | btree | id | sim | sim |  |
| _dormant.personalized_message_templates | personalized_message_templates_pkey | btree | id | sim | sim |  |
| _dormant.personalized_message_templates | personalized_message_templates_template_code_key | btree | template_code | sim | sim |  |
| _dormant.pix_accounts | idx_pix_company | btree | company_id | não | sim |  |
| _dormant.pix_accounts | pix_accounts_pkey | btree | id | sim | sim |  |
| _dormant.pix_accounts | uq_pix_chave_ativa | btree | company_id, pix_chave | sim | sim | `(is_active = true)` |
| _dormant.playbook_items | playbook_items_pkey | btree | id | sim | sim |  |
| _dormant.playbook_progress | playbook_progress_pkey | btree | id | sim | sim |  |
| _dormant.playbook_progress | playbook_progress_playbook_item_id_sale_id_key | btree | playbook_item_id, sale_id | sim | sim |  |
| _dormant.playbooks | playbooks_pkey | btree | id | sim | sim |  |
| _dormant.pre_contact_briefings | pre_contact_briefings_pkey | btree | id | sim | sim |  |
| _dormant.price_alerts | price_alerts_pkey | btree | id | sim | sim |  |
| _dormant.price_history | price_history_pkey | btree | id | sim | sim |  |
| _dormant.prize_wheel_spins | prize_wheel_spins_pkey | btree | id | sim | sim |  |
| _dormant.products | products_pkey | btree | id | sim | sim |  |
| _dormant.progressive_goals | progressive_goals_pkey | btree | id | sim | sim |  |
| _dormant.progressive_goals | progressive_goals_salesperson_id_goal_type_key | btree | salesperson_id, goal_type | sim | sim |  |
| _dormant.prospect_cadences | prospect_cadences_pkey | btree | id | sim | sim |  |
| _dormant.prospect_cadences | prospect_cadences_sale_id_cadence_id_key | btree | sale_id, cadence_id | sim | sim |  |
| _dormant.purchase_history | purchase_history_pkey | btree | id | sim | sim |  |
| _dormant.push_subscriptions | push_subscriptions_pkey | btree | id | sim | sim |  |
| _dormant.push_subscriptions | push_subscriptions_user_id_key | btree | user_id | sim | sim |  |
| _dormant.quote_sync_logs | quote_sync_logs_pkey | btree | id | sim | sim |  |
| _dormant.quotes | quotes_pkey | btree | id | sim | sim |  |
| _dormant.quotes | quotes_quote_number_key | btree | quote_number | sim | sim |  |
| _dormant.rank_change_notifications | rank_change_notifications_pkey | btree | id | sim | sim |  |
| _dormant.rapport_score_history | rapport_score_history_pkey | btree | id | sim | sim |  |
| _dormant.rate_limit_logs | rate_limit_logs_pkey | btree | id | sim | sim |  |
| _dormant.rate_limit_settings | rate_limit_settings_action_key | btree | action | sim | sim |  |
| _dormant.rate_limit_settings | rate_limit_settings_pkey | btree | id | sim | sim |  |
| _dormant.reauthentication_requests | reauthentication_requests_pkey | btree | id | sim | sim |  |
| _dormant.rfm_analysis | idx_rfm_analysis_contact | btree | contact_id | não | sim |  |
| _dormant.rfm_analysis | rfm_analysis_pkey | btree | id | sim | sim |  |
| _dormant.rfm_analysis | rfm_analysis_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| _dormant.rfm_calculations | rfm_calculations_pkey | btree | id | sim | sim |  |
| _dormant.rfm_history | rfm_history_pkey | btree | id | sim | sim |  |
| _dormant.rfm_metrics | rfm_metrics_pkey | btree | id | sim | sim |  |
| _dormant.rfm_metrics | rfm_metrics_user_id_period_start_period_end_period_type_key | btree | user_id, period_start, period_end, period_type | sim | sim |  |
| _dormant.sales_battles | sales_battles_pkey | btree | id | sim | sim |  |
| _dormant.sales_goals | sales_goals_pkey | btree | id | sim | sim |  |
| _dormant.sales_goals | sales_goals_salesperson_id_month_key | btree | salesperson_id, month | sim | sim |  |
| _dormant.sales_streaks | sales_streaks_pkey | btree | id | sim | sim |  |
| _dormant.sales_streaks | sales_streaks_salesperson_id_streak_type_key | btree | salesperson_id, streak_type | sim | sim |  |
| _dormant.sales_territories | sales_territories_pkey | btree | id | sim | sim |  |
| _dormant.salesperson_badges | salesperson_badges_pkey | btree | id | sim | sim |  |
| _dormant.salesperson_badges | salesperson_badges_salesperson_id_badge_id_key | btree | salesperson_id, badge_id | sim | sim |  |
| _dormant.salesperson_leagues | salesperson_leagues_pkey | btree | id | sim | sim |  |
| _dormant.salesperson_preferences | salesperson_preferences_pkey | btree | id | sim | sim |  |
| _dormant.salesperson_preferences | salesperson_preferences_salesperson_id_key | btree | salesperson_id | sim | sim |  |
| _dormant.salesperson_xp | salesperson_xp_pkey | btree | id | sim | sim |  |
| _dormant.salesperson_xp | salesperson_xp_salesperson_id_key | btree | salesperson_id | sim | sim |  |
| _dormant.satisfaction_scores | satisfaction_scores_pkey | btree | id | sim | sim |  |
| _dormant.saved_filters | saved_filters_pkey | btree | id | sim | sim |  |
| _dormant.saved_filters | unique_filter_name_per_user_entity | btree | user_id, entity_type, name | sim | sim |  |
| _dormant.score_history | idx_score_history_composite | btree | contact_id, score_type, calculated_at | não | sim |  |
| _dormant.score_history | score_history_pkey | btree | id | sim | sim |  |
| _dormant.script_usage_log | script_usage_log_pkey | btree | id | sim | sim |  |
| _dormant.security_alert_history | security_alert_history_pkey | btree | id | sim | sim |  |
| _dormant.security_alert_settings | security_alert_settings_pkey | btree | id | sim | sim |  |
| _dormant.security_alert_settings | security_alert_settings_user_id_key | btree | user_id | sim | sim |  |
| _dormant.shared_interests | shared_interests_pkey | btree | id | sim | sim |  |
| _dormant.sla_configs | sla_configs_pkey | btree | id | sim | sim |  |
| _dormant.smart_reminders | smart_reminders_pkey | btree | id | sim | sim |  |
| _dormant.sms_verification_codes | sms_verification_codes_pkey | btree | id | sim | sim |  |
| _dormant.social_behavior_analysis | idx_social_behavior_analysis_contact | btree | contact_id | não | sim |  |
| _dormant.social_behavior_analysis | social_behavior_analysis_pkey | btree | id | sim | sim |  |
| _dormant.social_life_events | idx_social_life_events_contact | btree | contact_id | não | sim |  |
| _dormant.social_life_events | social_life_events_pkey | btree | id | sim | sim |  |
| _dormant.social_mentions | social_mentions_pkey | btree | id | sim | sim |  |
| _dormant.social_profiles | idx_social_profiles_contact | btree | contact_id | não | sim |  |
| _dormant.social_profiles | social_profiles_pkey | btree | id | sim | sim |  |
| _dormant.social_scraping_schedule | social_scraping_schedule_contact_id_platform_key | btree | contact_id, platform | sim | sim |  |
| _dormant.social_scraping_schedule | social_scraping_schedule_pkey | btree | id | sim | sim |  |
| _dormant.stakeholder_alerts | idx_stakeholder_alerts_user_contact | btree | user_id, contact_id | não | sim |  |
| _dormant.stakeholder_alerts | stakeholder_alerts_pkey | btree | id | sim | sim |  |
| _dormant.stock_movements | stock_movements_pkey | btree | id | sim | sim |  |
| _dormant.supplier_contacts | supplier_contacts_contact_id_key | btree | contact_id | sim | sim |  |
| _dormant.supplier_contacts | supplier_contacts_pkey | btree | id | sim | sim |  |
| _dormant.supplier_order_items | supplier_order_items_pkey | btree | id | sim | sim |  |
| _dormant.supplier_orders | supplier_orders_pkey | btree | id | sim | sim |  |
| _dormant.supplier_products | supplier_products_pkey | btree | id | sim | sim |  |
| _dormant.supplier_products | supplier_products_supplier_id_product_id_key | btree | supplier_id, product_id | sim | sim |  |
| _dormant.supplier_risk_assessments | supplier_risk_assessments_pkey | btree | id | sim | sim |  |
| _dormant.tasks | tasks_pkey | btree | id | sim | sim |  |
| _dormant.team_closers | team_closers_pkey | btree | id | sim | sim |  |
| _dormant.team_closers | team_closers_team_id_closer_id_key | btree | team_id, closer_id | sim | sim |  |
| _dormant.teams | teams_pkey | btree | id | sim | sim |  |
| _dormant.template_performance | template_performance_pkey | btree | id | sim | sim |  |
| _dormant.territory_history | territory_history_pkey | btree | id | sim | sim |  |
| _dormant.time_analysis | time_analysis_contact_id_day_of_week_hour_of_day_key | btree | contact_id, day_of_week, hour_of_day | sim | sim |  |
| _dormant.time_analysis | time_analysis_pkey | btree | id | sim | sim |  |
| _dormant.tournament_matches | tournament_matches_pkey | btree | id | sim | sim |  |
| _dormant.tournament_participants | tournament_participants_pkey | btree | id | sim | sim |  |
| _dormant.tournament_participants | tournament_participants_tournament_id_salesperson_id_key | btree | tournament_id, salesperson_id | sim | sim |  |
| _dormant.tournaments | tournaments_pkey | btree | id | sim | sim |  |
| _dormant.trigger_ab_tests | idx_trigger_ab_tests_user_contact | btree | user_id, contact_id | não | sim |  |
| _dormant.trigger_ab_tests | trigger_ab_tests_pkey | btree | id | sim | sim |  |
| _dormant.trigger_channel_effectiveness | idx_trigger_channel_effectiveness_user_contact | btree | user_id, contact_id | não | sim |  |
| _dormant.trigger_channel_effectiveness | trigger_channel_effectiveness_pkey | btree | id | sim | sim |  |
| _dormant.trigger_channel_effectiveness | trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key | btree | user_id, contact_id, trigger_type, channel | sim | sim |  |
| _dormant.trigger_intensity_history | idx_trigger_intensity_history_user_contact | btree | user_id, contact_id | não | sim |  |
| _dormant.trigger_intensity_history | trigger_intensity_history_pkey | btree | id | sim | sim |  |
| _dormant.trigger_suggestions | trigger_suggestions_pkey | btree | id | sim | sim |  |
| _dormant.trigger_templates | trigger_templates_pkey | btree | id | sim | sim |  |
| _dormant.trigger_usage_history | trigger_usage_history_pkey | btree | id | sim | sim |  |
| _dormant.trigger_usage_log | trigger_usage_log_pkey | btree | id | sim | sim |  |
| _dormant.user_companies_link | user_companies_link_pkey | btree | id | sim | sim |  |
| _dormant.user_companies_link | user_companies_link_user_id_company_id_key | btree | user_id, company_id | sim | sim |  |
| _dormant.user_contacts_link | user_contacts_link_pkey | btree | id | sim | sim |  |
| _dormant.user_contacts_link | user_contacts_link_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| _dormant.user_disc_profile | idx_user_disc_current | btree | user_id | sim | sim | `(is_current = true)` |
| _dormant.user_disc_profile | user_disc_profile_pkey | btree | id | sim | sim |  |
| _dormant.user_favorite_templates | user_favorite_templates_pkey | btree | id | sim | sim |  |
| _dormant.user_favorite_templates | user_favorite_templates_user_id_template_type_template_id_key | btree | user_id, template_type, template_id | sim | sim |  |
| _dormant.user_mfa_settings | user_mfa_settings_pkey | btree | id | sim | sim |  |
| _dormant.user_mfa_settings | user_mfa_settings_user_id_key | btree | user_id | sim | sim |  |
| _dormant.user_roles | user_roles_pkey | btree | id | sim | sim |  |
| _dormant.user_roles | user_roles_user_id_role_key | btree | user_id, role | sim | sim |  |
| _dormant.vak_analysis_history | idx_vak_analysis_contact | btree | contact_id | não | sim |  |
| _dormant.vak_analysis_history | vak_analysis_history_pkey | btree | id | sim | sim |  |
| _dormant.vak_profiles | idx_vak_unique | btree | contact_id | sim | sim |  |
| _dormant.vak_profiles | vak_profiles_pkey | btree | id | sim | sim |  |
| _dormant.vak_templates | vak_templates_pkey | btree | id | sim | sim |  |
| _dormant.victory_feed | victory_feed_pkey | btree | id | sim | sim |  |
| _dormant.webauthn_challenges | webauthn_challenges_pkey | btree | id | sim | sim |  |
| _dormant.webauthn_credentials | webauthn_credentials_credential_id_key | btree | credential_id | sim | sim |  |
| _dormant.webauthn_credentials | webauthn_credentials_pkey | btree | id | sim | sim |  |
| _dormant.weekly_matchups | weekly_matchups_pkey | btree | id | sim | sim |  |
| _dormant.weekly_report_settings | unique_user_report_settings | btree | user_id | sim | sim |  |
| _dormant.weekly_report_settings | weekly_report_settings_pkey | btree | id | sim | sim |  |
| _dormant.weekly_reports | idx_weekly_reports_unique | btree | user_id, week_start | sim | sim |  |
| _dormant.weekly_reports | weekly_reports_pkey | btree | id | sim | sim |  |
| _dormant.whatsapp_instances | whatsapp_instances_pkey | btree | id | sim | sim |  |
| _dormant.whatsapp_instances | whatsapp_instances_user_id_instance_name_key | btree | user_id, instance_name | sim | sim |  |
| _dormant.whatsapp_kpis | whatsapp_kpis_pkey | btree | id | sim | sim |  |
| _dormant.whatsapp_messages | idx_whatsapp_messages_user_contact | btree | user_id, contact_id | não | sim |  |
| _dormant.whatsapp_messages | whatsapp_messages_pkey | btree | id | sim | sim |  |
| _dormant.workflow_action_logs | workflow_action_logs_pkey | btree | id | sim | sim |  |
| _dormant.workflow_actions | workflow_actions_pkey | btree | id | sim | sim |  |
| _dormant.workflow_executions | workflow_executions_pkey | btree | id | sim | sim |  |
| _dormant.workflow_rules | workflow_rules_pkey | btree | id | sim | sim |  |
| _dormant.workflow_triggers | workflow_triggers_pkey | btree | id | sim | sim |  |
| _dormant.workflows | workflows_pkey | btree | id | sim | sim |  |
| _dormant.xp_history | xp_history_pkey | btree | id | sim | sim |  |
| public.abm_account_plans | abm_account_plans_pkey | btree | id | sim | sim |  |
| public.abm_account_plans | idx_abm_plans_user | btree | user_id | não | sim |  |
| public.abm_accounts | abm_accounts_pkey | btree | id | sim | sim |  |
| public.abm_accounts | abm_accounts_user_id_external_company_id_key | btree | user_id, external_company_id | sim | sim |  |
| public.abm_accounts | idx_abm_accounts_external | btree | external_company_id | não | sim |  |
| public.abm_accounts | idx_abm_accounts_parent | btree | parent_account_id | não | sim |  |
| public.abm_accounts | idx_abm_accounts_tier | btree | user_id, tier | não | sim |  |
| public.abm_accounts | idx_abm_accounts_user | btree | user_id | não | sim |  |
| public.abm_buying_committee | abm_buying_committee_pkey | btree | id | sim | sim |  |
| public.abm_buying_committee | idx_abm_committee_account | btree | account_id | não | sim |  |
| public.abm_buying_committee | idx_abm_committee_user | btree | user_id | não | sim |  |
| public.abm_campaigns | abm_campaigns_pkey | btree | id | sim | sim |  |
| public.abm_campaigns | idx_abm_campaigns_status | btree | user_id, status | não | sim |  |
| public.abm_whitespace_opportunities | abm_whitespace_opportunities_pkey | btree | id | sim | sim |  |
| public.access_blocked_log | access_blocked_log_pkey | btree | id | sim | sim |  |
| public.access_security_settings | access_security_settings_pkey | btree | id | sim | sim |  |
| public.access_security_settings | access_security_settings_user_id_key | btree | user_id | sim | sim |  |
| public.achievements | achievements_pkey | btree | id | sim | sim |  |
| public.achievements | idx_achievements_salesperson_id | btree | salesperson_id | não | sim |  |
| public.activities | activities_pkey | btree | id | sim | sim |  |
| public.activities | idx_activities_company_id | btree | company_id | não | sim |  |
| public.activities | idx_activities_contact_id | btree | contact_id | não | sim |  |
| public.activities | idx_activities_created_at | btree | created_at | não | sim |  |
| public.activities | idx_activities_interaction_id | btree | interaction_id | não | sim |  |
| public.activities | idx_activities_user_id | btree | user_id | não | sim |  |
| public.activity_feed | activity_feed_pkey | btree | id | sim | sim |  |
| public.activity_feed | idx_activity_feed_user_id | btree | user_id | não | sim |  |
| public.ai_chat_messages | ai_chat_messages_pkey | btree | id | sim | sim |  |
| public.ai_chat_messages | idx_ai_chat_messages_user_id | btree | user_id | não | sim |  |
| public.ai_chat_threads | ai_chat_threads_pkey | btree | id | sim | sim |  |
| public.ai_chat_threads | idx_ai_chat_threads_user_id | btree | user_id | não | sim |  |
| public.ai_gateway_metrics | ai_gateway_metrics_pkey | btree | id, created_at | sim | sim |  |
| public.ai_gateway_metrics | idx_ai_gateway_metrics_created | btree | created_at | não | sim |  |
| public.ai_gateway_metrics | idx_ai_gateway_metrics_fn_created | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2026_08 | ai_gateway_metrics_2026_08_created_at_idx | btree | created_at | não | sim |  |
| public.ai_gateway_metrics_2026_08 | ai_gateway_metrics_2026_08_function_name_created_at_idx | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2026_08 | ai_gateway_metrics_2026_08_pkey | btree | id, created_at | sim | sim |  |
| public.ai_gateway_metrics_2026_09 | ai_gateway_metrics_2026_09_created_at_idx | btree | created_at | não | sim |  |
| public.ai_gateway_metrics_2026_09 | ai_gateway_metrics_2026_09_function_name_created_at_idx | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2026_09 | ai_gateway_metrics_2026_09_pkey | btree | id, created_at | sim | sim |  |
| public.ai_gateway_metrics_2026_10 | ai_gateway_metrics_2026_10_created_at_idx | btree | created_at | não | sim |  |
| public.ai_gateway_metrics_2026_10 | ai_gateway_metrics_2026_10_function_name_created_at_idx | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2026_10 | ai_gateway_metrics_2026_10_pkey | btree | id, created_at | sim | sim |  |
| public.ai_gateway_metrics_2026_11 | ai_gateway_metrics_2026_11_created_at_idx | btree | created_at | não | sim |  |
| public.ai_gateway_metrics_2026_11 | ai_gateway_metrics_2026_11_function_name_created_at_idx | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2026_11 | ai_gateway_metrics_2026_11_pkey | btree | id, created_at | sim | sim |  |
| public.ai_gateway_metrics_2026_12 | ai_gateway_metrics_2026_12_created_at_idx | btree | created_at | não | sim |  |
| public.ai_gateway_metrics_2026_12 | ai_gateway_metrics_2026_12_function_name_created_at_idx | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2026_12 | ai_gateway_metrics_2026_12_pkey | btree | id, created_at | sim | sim |  |
| public.ai_gateway_metrics_2027_01 | ai_gateway_metrics_2027_01_created_at_idx | btree | created_at | não | sim |  |
| public.ai_gateway_metrics_2027_01 | ai_gateway_metrics_2027_01_function_name_created_at_idx | btree | function_name, created_at | não | sim |  |
| public.ai_gateway_metrics_2027_01 | ai_gateway_metrics_2027_01_pkey | btree | id, created_at | sim | sim |  |
| public.ai_recommendation_audit_logs | ai_recommendation_audit_logs_pkey | btree | id | sim | sim |  |
| public.ai_recommendation_audit_logs_v2 | ai_recommendation_audit_logs_v2_pkey | btree | id | sim | sim |  |
| public.ai_recommendation_logs | ai_recommendation_logs_pkey | btree | id | sim | sim |  |
| public.ai_tone_preferences | ai_tone_preferences_pkey | btree | id | sim | sim |  |
| public.ai_tone_preferences | ai_tone_preferences_user_id_company_id_key | btree | user_id, company_id | sim | sim |  |
| public.alert_rules | alert_rules_pkey | btree | id | sim | sim |  |
| public.alert_rules | alert_rules_rule_code_key | btree | rule_code | sim | sim |  |
| public.alerts | alerts_pkey | btree | id | sim | sim |  |
| public.alerts | idx_alerts_active | btree | contact_id, user_id | não | sim | `(dismissed = false)` |
| public.alerts | idx_alerts_company_id | btree | company_id | não | sim |  |
| public.alerts | idx_alerts_contact_id | btree | contact_id | não | sim |  |
| public.alerts | idx_alerts_dismissed | btree | dismissed | não | sim | `(dismissed = false)` |
| public.alerts | idx_alerts_interaction_id | btree | interaction_id | não | sim |  |
| public.alerts | idx_alerts_user_id | btree | user_id | não | sim |  |
| public.applied_objection_responses | applied_objection_responses_pkey | btree | id | sim | sim |  |
| public.asia_upload_mapping | asia_upload_mapping_pkey | btree | id | sim | sim |  |
| public.attribution_models_cache | attribution_models_cache_pkey | btree | id | sim | sim |  |
| public.attribution_models_cache | attribution_models_cache_user_id_deal_id_model_key | btree | user_id, deal_id, model | sim | sim |  |
| public.attribution_touchpoints | attribution_touchpoints_pkey | btree | id | sim | sim |  |
| public.audit_log | audit_log_pkey | btree | id | sim | sim |  |
| public.audit_log | idx_audit_log_action | btree | action | não | sim |  |
| public.audit_log | idx_audit_log_created_at | btree | created_at | não | sim |  |
| public.audit_log | idx_audit_log_table_action | btree | table_name, action, created_at | não | sim |  |
| public.automation_executions | automation_executions_pkey | btree | id | sim | sim |  |
| public.automation_executions | idx_automation_executions_rule_id | btree | rule_id | não | sim |  |
| public.automation_executions | idx_automation_executions_status | btree | status, created_at | não | sim |  |
| public.automation_logs | automation_logs_pkey | btree | id | sim | sim |  |
| public.automation_logs | idx_auto_logs_rule | btree | rule_id | não | sim |  |
| public.automation_logs | idx_automation_logs_automation_id | btree | automation_id | não | sim |  |
| public.automation_logs | idx_automation_logs_user_id | btree | user_id | não | sim |  |
| public.automation_rules | automation_rules_pkey | btree | id | sim | sim |  |
| public.automation_rules | idx_auto_rules_user | btree | user_id | não | sim |  |
| public.automations | automations_pkey | btree | id | sim | sim |  |
| public.automations | idx_automations_created_by | btree | created_by | não | sim |  |
| public.badges | badges_code_key | btree | code | sim | sim |  |
| public.badges | badges_pkey | btree | id | sim | sim |  |
| public.battle_cards | battle_cards_pkey | btree | id | sim | sim |  |
| public.behavioral_insight_feedback | behavioral_insight_feedback_pkey | btree | id | sim | sim |  |
| public.behavioral_insight_feedback | behavioral_insight_feedback_unique | btree | user_id, contact_id, insight_kind, insight_label | sim | sim |  |
| public.behavioral_profile_regen_queue | behavioral_profile_regen_queue_pkey | btree | contact_id | sim | sim |  |
| public.behavioral_profile_regen_queue | idx_bpr_queue_next_run | btree | next_run_at | não | sim | `(attempts < 5)` |
| public.behavioral_profile_regen_queue | idx_bpr_queue_trigger_source | btree | trigger_source, updated_at | não | sim |  |
| public.behavioral_profile_regen_queue | idx_bpr_queue_updated_at_desc | btree | updated_at | não | sim |  |
| public.brain_dominance_analysis | brain_dominance_analysis_pkey | btree | id | sim | sim |  |
| public.brain_dominance_analysis | idx_brain_dominance_contact_id | btree | contact_id | não | sim |  |
| public.cadence_enrollments | cadence_enrollments_cadence_id_company_id_key | btree | cadence_id, company_id | sim | sim |  |
| public.cadence_enrollments | cadence_enrollments_pkey | btree | id | sim | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_cadence_id | btree | cadence_id | não | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_company_id_fk | btree | company_id | não | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_contact_id_fk | btree | contact_id | não | sim |  |
| public.cadence_enrollments | idx_cadence_enrollments_user_id | btree | user_id | não | sim |  |
| public.calendar_events | calendar_events_pkey | btree | id | sim | sim |  |
| public.calendar_events | idx_calendar_company | btree | company_id | não | sim |  |
| public.calendar_events | idx_calendar_events_contact_id_fk | btree | contact_id | não | sim |  |
| public.calendar_events | idx_calendar_events_deal_id | btree | deal_id | não | sim |  |
| public.calendar_events | idx_calendar_events_user_id | btree | user_id | não | sim |  |
| public.call_logs | call_logs_external_id_key | btree | external_id | sim | sim |  |
| public.call_logs | call_logs_pkey | btree | id | sim | sim |  |
| public.campaign_members | campaign_members_pkey | btree | id | sim | sim |  |
| public.campaign_members | idx_campaign_members_campaign_id | btree | campaign_id | não | sim |  |
| public.campaign_members | idx_campaign_members_company_id_fk | btree | company_id | não | sim |  |
| public.campaign_members | idx_campaign_members_contact_id_fk | btree | contact_id | não | sim |  |
| public.campaign_members | idx_campaign_members_status | btree | status | não | sim |  |
| public.campaign_members | uq_campaign_members_campaign_contact | btree | campaign_id, contact_id | sim | sim | `(contact_id IS NOT NULL)` |
| public.campaign_recipients | campaign_recipients_campaign_id_contact_id_key | btree | campaign_id, contact_id | sim | sim |  |
| public.campaign_recipients | campaign_recipients_pkey | btree | id | sim | sim |  |
| public.campaign_recipients | idx_campaign_recipients_user_id | btree | user_id | não | sim |  |
| public.campaign_recipients | uq_campaign_recipients_campaign_email | btree | campaign_id, email | sim | sim |  |
| public.campaigns | campaigns_pkey | btree | id | sim | sim |  |
| public.campaigns | idx_campaigns_created_by | btree | created_by | não | sim |  |
| public.campaigns | idx_campaigns_status | btree | status | não | sim |  |
| public.canned_responses | canned_responses_pkey | btree | id | sim | sim |  |
| public.canned_responses | unique_shortcut_per_user | btree | user_id, shortcut | sim | sim |  |
| public.carrier_evaluations | carrier_evaluations_pkey | btree | id | sim | sim |  |
| public.carrier_evaluations | idx_carrier_evaluations_avaliador_id | btree | avaliador_id | não | sim |  |
| public.carrier_evaluations | idx_carrier_evaluations_carrier_data | btree | carrier_id, data_avaliacao | não | sim |  |
| public.carrier_evaluations | idx_carrier_evaluations_carrier_id | btree | carrier_id | não | sim |  |
| public.carrier_evaluations | idx_carrier_evaluations_data | btree | data_avaliacao | não | sim |  |
| public.carrier_homologations | carrier_homologations_pkey | btree | id | sim | sim |  |
| public.carrier_homologations | idx_carrier_homologations_avaliador_id | btree | avaliador_id | não | sim |  |
| public.carrier_homologations | idx_carrier_homologations_carrier_created | btree | carrier_id, created_at | não | sim |  |
| public.carrier_homologations | idx_carrier_homologations_carrier_id | btree | carrier_id | não | sim |  |
| public.carrier_homologations | idx_carrier_homologations_status | btree | status | não | sim |  |
| public.carrier_qualification_config | carrier_qualification_config_pkey | btree | id | sim | sim |  |
| public.carrier_qualification_config | carrier_qualification_config_segment_code_key | btree | segment_code | sim | sim |  |
| public.carrier_score_history | carrier_score_history_pkey | btree | id | sim | sim |  |
| public.carrier_score_history | idx_carrier_score_history_carrier | btree | carrier_id, measured_at | não | sim |  |
| public.carrier_score_history | idx_carrier_score_history_carrier_id | btree | carrier_id | não | sim |  |
| public.carrier_scores | carrier_scores_carrier_id_key | btree | carrier_id | sim | sim |  |
| public.carrier_scores | carrier_scores_pkey | btree | id | sim | sim |  |
| public.carrier_scores | idx_carrier_scores_score_geral | btree | score_geral | não | sim |  |
| public.carrier_scores | idx_carrier_scores_segment | btree | segment_code | não | sim |  |
| public.carriers | carriers_company_id_key | btree | company_id | sim | sim |  |
| public.carriers | carriers_pkey | btree | id | sim | sim |  |
| public.carriers | idx_carriers_homologado | btree | homologado | não | sim |  |
| public.carriers | idx_carriers_score_geral | btree | score_geral | não | sim |  |
| public.churn_predictions | churn_predictions_pkey | btree | id | sim | sim |  |
| public.churn_predictions | idx_churn_predictions_company_id | btree | company_id | não | sim |  |
| public.churn_predictions | idx_churn_predictions_contact | btree | contact_id | não | sim |  |
| public.churn_predictions | idx_churn_predictions_user_id | btree | user_id | não | sim |  |
| public.churn_risk_factors | churn_risk_factors_factor_name_key | btree | factor_name | sim | sim |  |
| public.churn_risk_factors | churn_risk_factors_pkey | btree | id | sim | sim |  |
| public.churn_risk_scores | churn_risk_scores_pkey | btree | id | sim | sim |  |
| public.churn_risk_scores | idx_churn_risk_contact | btree | contact_id | não | sim |  |
| public.churn_risk_scores | idx_churn_risk_level | btree | risk_level | não | sim |  |
| public.churn_risk_scores | idx_churn_risk_user | btree | user_id | não | sim |  |
| public.cidades | cidades_pkey | btree | ibge_code | sim | sim |  |
| public.cidades | idx_cidades_estado_ibge | btree | estado_ibge | não | sim |  |
| public.cidades | idx_cidades_uf | btree | uf | não | sim |  |
| public.city_whitelist | city_whitelist_pkey | btree | id | sim | sim |  |
| public.city_whitelist | idx_city_whitelist_user_id | btree | user_id | não | sim |  |
| public.client_values | client_values_pkey | btree | id | sim | sim |  |
| public.client_values | client_values_user_id_contact_id_category_value_name_key | btree | user_id, contact_id, category, value_name | sim | sim |  |
| public.client_values | idx_client_values_contact | btree | contact_id | não | sim |  |
| public.clients | clients_pkey | btree | id | sim | sim |  |
| public.clients | idx_clients_deleted_by | btree | deleted_by | não | sim |  |
| public.closing_score_config | closing_score_config_factor_name_key | btree | factor_name | sim | sim |  |
| public.closing_score_config | closing_score_config_pkey | btree | id | sim | sim |  |
| public.cnaes | cnaes_pkey | btree | codigo | sim | sim |  |
| public.cnpj_cache | cnpj_cache_cnpj_key | btree | cnpj | sim | sim |  |
| public.cnpj_cache | cnpj_cache_pkey | btree | id | sim | sim |  |
| public.coaching_scorecards | coaching_scorecards_pkey | btree | id | sim | sim |  |
| public.cognitive_bias_history | cognitive_bias_history_pkey | btree | id | sim | sim |  |
| public.cognitive_bias_history | idx_cog_bias_contact | btree | contact_id | não | sim |  |
| public.cognitive_bias_history | idx_cognitive_bias_history_interaction_id | btree | interaction_id | não | sim |  |
| public.cognitive_bias_history | idx_cognitive_bias_history_user_id | btree | user_id | não | sim |  |
| public.commission_rules | commission_rules_pkey | btree | id | sim | sim |  |
| public.commissions | commissions_pkey | btree | id | sim | sim |  |
| public.commissions | idx_commissions_deal_id | btree | deal_id | não | sim |  |
| public.commissions | idx_commissions_rule_id | btree | rule_id | não | sim |  |
| public.commissions | idx_commissions_user_id | btree | user_id | não | sim |  |
| public.communication_preferences | communication_preferences_pkey | btree | id | sim | sim |  |
| public.communication_preferences | communication_preferences_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| public.communication_preferences | idx_comm_pref_contact | btree | contact_id | não | sim |  |
| public.companies | companies_bitrix_company_id_key | btree | bitrix_company_id | sim | sim |  |
| public.companies | companies_pkey | btree | id | sim | sim |  |
| public.companies | idx_companies_active | btree | id | não | sim | `(deleted_at IS NULL)` |
| public.companies | idx_companies_ativo | btree | id | não | sim | `(status = 'ativo'::company_status)` |
| public.companies | idx_companies_carrier | btree | is_carrier | não | sim | `(is_carrier = true)` |
| public.companies | idx_companies_central | btree | central_id | não | sim |  |
| public.companies | idx_companies_cnpj | btree | cnpj | não | sim | `((cnpj IS NOT NULL) AND (cnpj <> ''::text))` |
| public.companies | idx_companies_cnpj_base | btree | cnpj_base | não | sim | `(cnpj_base IS NOT NULL)` |
| public.companies | idx_companies_confederacao_id | btree | confederacao_id | não | sim | `(confederacao_id IS NOT NULL)` |
| public.companies | idx_companies_created_at | btree | created_at | não | sim |  |
| public.companies | idx_companies_created_by_id | btree | created_by_id | não | sim |  |
| public.companies | idx_companies_grupo_economico | btree | grupo_economico_id | não | sim | `(grupo_economico_id IS NOT NULL)` |
| public.companies | idx_companies_is_customer | btree | is_customer | não | sim | `((is_customer = true) AND (deleted_at IS NULL))` |
| public.companies | idx_companies_lead_status | btree | lead_status | não | sim | `(deleted_at IS NULL)` |
| public.companies | idx_companies_matriz | btree | matriz_id | não | sim |  |
| public.companies | idx_companies_nome_crm_trgm | gin | nome_crm | não | sim |  |
| public.companies | idx_companies_razao_social_trgm | gin | razao_social | não | sim |  |
| public.companies | idx_companies_search | gin | search_vector | não | sim |  |
| public.companies | idx_companies_singular | btree | singular_id | não | sim |  |
| public.companies | idx_companies_status | btree | status | não | sim |  |
| public.companies | idx_companies_status_deleted | btree | status | não | sim | `(deleted_at IS NULL)` |
| public.companies | idx_companies_supplier | btree | is_supplier | não | sim | `(is_supplier = true)` |
| public.companies | idx_companies_tipo_coop | btree | tipo_cooperativa | não | sim |  |
| public.companies | idx_companies_title | btree | nome_crm | não | sim |  |
| public.companies | idx_companies_updated_at | btree | updated_at | não | sim |  |
| public.companies | idx_companies_user_id | btree | user_id | não | sim |  |
| public.company_addresses | company_addresses_pkey | btree | id | sim | sim |  |
| public.company_addresses | idx_company_addresses_cep | btree | cep | não | sim |  |
| public.company_addresses | idx_company_addresses_cidade | btree | cidade, estado | não | sim |  |
| public.company_addresses | idx_company_addresses_cidade_ibge | btree | cidade_ibge | não | sim |  |
| public.company_addresses | idx_company_addresses_company | btree | company_id | não | sim |  |
| public.company_addresses | idx_company_addresses_created_at | btree | created_at | não | sim |  |
| public.company_addresses | idx_company_addresses_primary | btree | company_id, is_primary | não | sim |  |
| public.company_addresses | idx_company_addresses_tipo_logradouro | btree | tipo_logradouro | não | sim |  |
| public.company_cadences | company_cadences_company_id_cadence_id_key | btree | company_id, cadence_id | sim | sim |  |
| public.company_cadences | company_cadences_pkey | btree | id | sim | sim |  |
| public.company_cadences | idx_company_cadences_cadence_id | btree | cadence_id | não | sim |  |
| public.company_cadences | idx_company_cadences_company | btree | company_id | não | sim |  |
| public.company_cadences | idx_company_cadences_status | btree | status | não | sim |  |
| public.company_cadences | idx_company_cadences_user_id | btree | user_id | não | sim |  |
| public.company_cnaes | company_cnaes_company_id_cnae_codigo_key | btree | company_id, cnae_codigo | sim | sim |  |
| public.company_cnaes | company_cnaes_pkey | btree | id | sim | sim |  |
| public.company_cnaes | idx_company_cnaes_cnae | btree | cnae_codigo | não | sim |  |
| public.company_cnaes | idx_company_cnaes_company | btree | company_id | não | sim |  |
| public.company_emails | company_emails_company_id_email_unique | btree | company_id, email | sim | sim |  |
| public.company_emails | company_emails_company_id_lower_email_unique | btree | company_id | sim | sim |  |
| public.company_emails | company_emails_pkey | btree | id | sim | sim |  |
| public.company_emails | idx_company_emails_company_id | btree | company_id | não | sim |  |
| public.company_emails | idx_company_emails_email_lower | btree |  | não | sim |  |
| public.company_phones | company_phones_company_id_numero_norm_unique | btree | company_id, numero_normalizado | sim | sim |  |
| public.company_phones | company_phones_pkey | btree | id | sim | sim |  |
| public.company_phones | idx_company_phones_created_at | btree | created_at | não | sim |  |
| public.company_phones | idx_company_phones_e164 | btree | numero_e164 | não | sim | `(numero_e164 IS NOT NULL)` |
| public.company_phones | idx_company_phones_normalizado | btree | numero_normalizado | não | sim |  |
| public.company_phones | idx_company_phones_whatsapp | btree | company_id | não | sim | `(is_whatsapp = true)` |
| public.company_rfm_scores | company_rfm_scores_pkey | btree | id | sim | sim |  |
| public.company_rfm_scores | idx_company_rfm_scores_created_at | btree | created_at | não | sim |  |
| public.company_rfm_scores | idx_company_rfm_scores_segment_id | btree | segment_id | não | sim |  |
| public.company_rfm_scores | idx_company_rfm_segment | btree | segment_code | não | sim |  |
| public.company_rfm_scores | idx_company_rfm_unique | btree | company_id | sim | sim |  |
| public.company_rfm_scores | idx_company_rfm_user | btree | user_id | não | sim |  |
| public.company_social_media | company_social_media_pkey | btree | id | sim | sim |  |
| public.company_social_media | idx_company_social_active | btree | company_id, plataforma | não | sim | `(is_active = true)` |
| public.company_social_media | idx_company_social_company | btree | company_id | não | sim |  |
| public.company_social_media | idx_company_social_media_created_at | btree | created_at | não | sim |  |
| public.company_social_media | idx_company_social_plataforma | btree | plataforma | não | sim |  |
| public.company_social_media | uq_company_social_media | btree | company_id, plataforma | sim | sim |  |
| public.company_stakeholder_map | company_stakeholder_map_company_id_contact_id_key | btree | company_id, contact_id | sim | sim |  |
| public.company_stakeholder_map | company_stakeholder_map_pkey | btree | id | sim | sim |  |
| public.company_stakeholder_map | idx_company_stakeholder_map_access_via_contact_id | btree | access_via_contact_id | não | sim |  |
| public.company_stakeholder_map | idx_company_stakeholder_map_company_id | btree | company_id | não | sim |  |
| public.company_stakeholder_map | idx_company_stakeholder_map_contact_id | btree | contact_id | não | sim |  |
| public.company_stakeholder_map | idx_company_stakeholder_map_user_id | btree | user_id | não | sim |  |
| public.company_territories | company_territories_company_id_key | btree | company_id | sim | sim |  |
| public.company_territories | company_territories_pkey | btree | id | sim | sim |  |
| public.company_territories | idx_company_territories_territory_id | btree | territory_id | não | sim |  |
| public.compatibility_alerts | compatibility_alerts_pkey | btree | id | sim | sim |  |
| public.compatibility_alerts | idx_compatibility_alerts_contact_id | btree | contact_id | não | sim |  |
| public.compatibility_alerts | idx_compatibility_alerts_user_id | btree | user_id | não | sim |  |
| public.compatibility_settings | compatibility_settings_pkey | btree | id | sim | sim |  |
| public.compatibility_settings | idx_compat_settings_user | btree | user_id | sim | sim |  |
| public.competitive_losses | competitive_losses_pkey | btree | id | sim | sim |  |
| public.competitive_losses | idx_competitive_losses_company_id_fk | btree | company_id | não | sim |  |
| public.competitive_losses | idx_competitive_losses_competitor_id | btree | competitor_id | não | sim |  |
| public.competitive_losses | idx_competitive_losses_deal_id | btree | deal_id | não | sim |  |
| public.competitive_losses | idx_competitive_losses_reported_by | btree | reported_by | não | sim |  |
| public.competitors | competitors_pkey | btree | id | sim | sim |  |
| public.config_regras_negocio | config_regras_negocio_chave_key | btree | chave | sim | sim |  |
| public.config_regras_negocio | config_regras_negocio_pkey | btree | id | sim | sim |  |
| public.connection_anomalies | connection_anomalies_pkey | btree | id | sim | sim |  |
| public.connection_anomalies | idx_connection_anomalies_severity | btree | severity, detected_at | não | sim | `(acknowledged_at IS NULL)` |
| public.connection_anomalies | idx_connection_anomalies_webhook | btree | webhook_id, detected_at | não | sim |  |
| public.connection_configs | connection_configs_pkey | btree | id | sim | sim |  |
| public.connection_configs | idx_connection_configs_active | btree | is_active | não | sim |  |
| public.connection_configs | idx_connection_configs_type | btree | connection_type | não | sim |  |
| public.connection_quotas | connection_quotas_pkey | btree | id | sim | sim |  |
| public.connection_quotas | connection_quotas_webhook_id_period_start_key | btree | webhook_id, period_start | sim | sim |  |
| public.connection_quotas | idx_connection_quotas_webhook_period | btree | webhook_id, period_start | não | sim |  |
| public.connection_test_logs | connection_test_logs_pkey | btree | id | sim | sim |  |
| public.connection_test_logs | idx_connection_test_logs_conn | btree | connection_id, created_at | não | sim |  |
| public.connector_log | connector_log_pkey | btree | id | sim | sim |  |
| public.connector_log | idx_cl_created | btree | created_at | não | sim |  |
| public.connector_log | idx_cl_phone | btree | whatsapp_number, created_at | não | sim |  |
| public.contact_addresses | contact_addresses_pkey | btree | id | sim | sim |  |
| public.contact_addresses | idx_ca_contact | btree | contact_id | não | sim |  |
| public.contact_addresses | idx_contact_addresses_created_by | btree | created_by | não | sim |  |
| public.contact_addresses | idx_contact_addresses_updated_by | btree | updated_by | não | sim |  |
| public.contact_analytical_profile_versions | contact_analytical_profile_versions_pkey | btree | id | sim | sim |  |
| public.contact_analytical_profile_versions | idx_capv_contact_generated | btree | contact_id, generated_at | não | sim |  |
| public.contact_analytical_profile_versions | idx_capv_user | btree | user_id | não | sim |  |
| public.contact_analytical_profiles | contact_analytical_profiles_contact_unique | btree | contact_id | sim | sim |  |
| public.contact_analytical_profiles | contact_analytical_profiles_pkey | btree | id | sim | sim |  |
| public.contact_automation_settings | contact_automation_settings_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_automation_settings | contact_automation_settings_pkey | btree | id | sim | sim |  |
| public.contact_behavior | contact_behavior_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_behavior | contact_behavior_pkey | btree | id | sim | sim |  |
| public.contact_behavior | idx_contact_behavior_approver_id | btree | approver_id | não | sim |  |
| public.contact_behavior | idx_contact_behavior_contact_id | btree | contact_id | não | sim |  |
| public.contact_business_context | contact_business_context_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_business_context | contact_business_context_pkey | btree | id | sim | sim |  |
| public.contact_cadence | contact_cadence_pkey | btree | id | sim | sim |  |
| public.contact_cadence | contact_cadence_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| public.contact_cadence | idx_cadence_contact | btree | contact_id | não | sim |  |
| public.contact_cadence_audit | contact_cadence_audit_pkey | btree | id | sim | sim |  |
| public.contact_decision_making | contact_decision_making_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_decision_making | contact_decision_making_pkey | btree | id | sim | sim |  |
| public.contact_emails | contact_emails_contact_id_email_ci_unique | btree | contact_id | sim | sim |  |
| public.contact_emails | contact_emails_pkey | btree | id | sim | sim |  |
| public.contact_emails | idx_contact_emails_contact_id | btree | contact_id | não | sim |  |
| public.contact_emails | idx_contact_emails_primary | btree | contact_id | não | sim | `(is_primary = true)` |
| public.contact_family_history | contact_family_history_pkey | btree | id | sim | sim |  |
| public.contact_family_history | idx_contact_family_history_contact | btree | contact_id, changed_at | não | sim |  |
| public.contact_influence | contact_influence_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_influence | contact_influence_pkey | btree | id | sim | sim |  |
| public.contact_metaprograms | contact_metaprograms_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_metaprograms | contact_metaprograms_pkey | btree | id | sim | sim |  |
| public.contact_next_actions | contact_next_actions_pkey | btree | id | sim | sim |  |
| public.contact_next_actions | contact_next_actions_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| public.contact_next_actions | idx_cna_contact_id | btree | contact_id | não | sim |  |
| public.contact_next_actions | idx_contact_next_actions_generated_at | btree | user_id, generated_at | não | sim |  |
| public.contact_next_actions | idx_contact_next_actions_user_contact | btree | user_id, contact_id | não | sim |  |
| public.contact_notes | contact_notes_pkey | btree | id | sim | sim |  |
| public.contact_notes | idx_contact_notes_contact_id | btree | contact_id | não | sim |  |
| public.contact_notes | idx_contact_notes_user_id | btree | user_id | não | sim |  |
| public.contact_objection_scripts | contact_objection_scripts_pkey | btree | id | sim | sim |  |
| public.contact_personality | contact_personality_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_personality | contact_personality_pkey | btree | id | sim | sim |  |
| public.contact_phones | contact_phones_contact_id_numero_norm_unique | btree | contact_id, numero_normalizado | sim | sim |  |
| public.contact_phones | contact_phones_pkey | btree | id | sim | sim |  |
| public.contact_phones | idx_contact_phones_normalizado | btree | numero_normalizado | não | sim |  |
| public.contact_phones | idx_contact_phones_primary | btree | contact_id | não | sim | `(is_primary = true)` |
| public.contact_phones | idx_contact_phones_whatsapp | btree | contact_id | não | sim | `(is_whatsapp = true)` |
| public.contact_predictive_roadmap | contact_predictive_roadmap_pkey | btree | id | sim | sim |  |
| public.contact_predictive_roadmap | idx_contact_roadmap_month | btree | contact_id, forecast_month | sim | sim |  |
| public.contact_preferences | contact_preferences_pkey | btree | id | sim | sim |  |
| public.contact_preferences | contact_preferences_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| public.contact_preferences | idx_cont_pref_contact | btree | contact_id | não | sim |  |
| public.contact_preferences_audit | contact_preferences_audit_pkey | btree | id | sim | sim |  |
| public.contact_rapport_strategy | contact_rapport_strategy_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_rapport_strategy | contact_rapport_strategy_pkey | btree | id | sim | sim |  |
| public.contact_relatives | contact_relatives_pkey | btree | id | sim | sim |  |
| public.contact_relatives | idx_contact_relatives_user_id | btree | user_id | não | sim |  |
| public.contact_relatives | idx_relatives_contact | btree | contact_id | não | sim |  |
| public.contact_relatives_audit | contact_relatives_audit_pkey | btree | id | sim | sim |  |
| public.contact_report_overrides | contact_report_overrides_contact_id_key | btree | contact_id | sim | sim |  |
| public.contact_report_overrides | contact_report_overrides_pkey | btree | id | sim | sim |  |
| public.contact_social_media | contact_social_media_pkey | btree | id | sim | sim |  |
| public.contact_social_media | idx_contact_social_contact | btree | contact_id | não | sim |  |
| public.contact_social_media | uq_contact_social_media | btree | contact_id, plataforma | sim | sim |  |
| public.contact_time_analysis | contact_time_analysis_pkey | btree | id | sim | sim |  |
| public.contact_time_analysis | contact_time_analysis_user_id_contact_id_day_of_week_hour_o_key | btree | user_id, contact_id, day_of_week, hour_of_day | sim | sim |  |
| public.contact_time_analysis | idx_time_analysis_contact | btree | contact_id | não | sim |  |
| public.contact_time_analysis_audit | contact_time_analysis_audit_pkey | btree | id | sim | sim |  |
| public.contacts | contacts_pkey | btree | id | sim | sim |  |
| public.contacts | idx_contacts_active | btree | id | não | sim | `(deleted_at IS NULL)` |
| public.contacts | idx_contacts_assigned_by_id | btree | assigned_by_id | não | sim |  |
| public.contacts | idx_contacts_company | btree | company_id | não | sim |  |
| public.contacts | idx_contacts_company_deleted | btree | company_id | não | sim | `(deleted_at IS NULL)` |
| public.contacts | idx_contacts_company_id | btree | company_id | não | sim | `(company_id IS NOT NULL)` |
| public.contacts | idx_contacts_company_user | btree | company_id, user_id | não | sim |  |
| public.contacts | idx_contacts_created_at | btree | created_at | não | sim |  |
| public.contacts | idx_contacts_duplicate_of | btree | duplicate_of | não | sim |  |
| public.contacts | idx_contacts_email_trgm | gin | email | não | sim | `(email IS NOT NULL)` |
| public.contacts | idx_contacts_first_name_trgm | gin | first_name | não | sim | `(first_name IS NOT NULL)` |
| public.contacts | idx_contacts_is_duplicate | btree | is_duplicate | não | sim | `(deleted_at IS NULL)` |
| public.contacts | idx_contacts_last_name_trgm | gin | last_name | não | sim | `(last_name IS NOT NULL)` |
| public.contacts | idx_contacts_relationship_score | btree | relationship_score | não | sim |  |
| public.contacts | idx_contacts_relationship_stage | btree | relationship_stage | não | sim |  |
| public.contacts | idx_contacts_sem_apelido | btree | company_id, full_name | não | sim | `((apelido IS NULL) AND (deleted_at IS NULL))` |
| public.contacts | idx_contacts_sentiment | btree | sentiment | não | sim |  |
| public.contacts | idx_contacts_updated_at | btree | updated_at | não | sim |  |
| public.contacts | idx_contacts_user_created | btree | user_id, created_at | não | sim |  |
| public.contacts | idx_contacts_user_id | btree | user_id | não | sim |  |
| public.conversation_analyses | conversation_analyses_pkey | btree | id | sim | sim |  |
| public.conversation_analyses | conversation_analyses_user_id_interaction_id_key | btree | user_id, interaction_id | sim | sim |  |
| public.conversation_analyses | idx_conv_analyses_user | btree | user_id, analyzed_at | não | sim |  |
| public.conversation_topics_catalog | conversation_topics_catalog_pkey | btree | id | sim | sim |  |
| public.conversation_topics_catalog | conversation_topics_catalog_user_id_topic_key_key | btree | user_id, topic_key | sim | sim |  |
| public.conversation_topics_catalog | idx_conv_topics_user | btree | user_id, active, category | não | sim |  |
| public.conversational_search_cache | conversational_search_cache_pkey | btree | id | sim | sim |  |
| public.conversational_search_cache | conversational_search_cache_user_id_query_hash_key | btree | user_id, query_hash | sim | sim |  |
| public.conversational_search_cache | idx_conv_search_cache_expires | btree | expires_at | não | sim |  |
| public.conversational_search_cache | idx_conv_search_cache_user_hash | btree | user_id, query_hash | não | sim |  |
| public.coop_sistemas | coop_sistemas_pkey | btree | id | sim | sim |  |
| public.coop_sistemas | coop_sistemas_sigla_key | btree | sigla | sim | sim |  |
| public.coop_sistemas | idx_coop_sistemas_grupo_economico_id | btree | grupo_economico_id | não | sim |  |
| public.crm_alerts | crm_alerts_pkey | btree | id | sim | sim |  |
| public.crm_automation_logs | crm_automation_logs_pkey | btree | id | sim | sim |  |
| public.crm_automation_reprocess_queue | crm_automation_reprocess_queue_pkey | btree | id | sim | sim |  |
| public.crm_cadence_rules | crm_cadence_rules_pkey | btree | id | sim | sim |  |
| public.crm_cadence_rules | crm_cadence_rules_user_id_relationship_stage_version_key | btree | user_id, relationship_stage, version | sim | sim |  |
| public.crm_consent_audit_logs | crm_consent_audit_logs_pkey | btree | id | sim | sim |  |
| public.crm_consent_audit_logs | idx_crm_consent_audit_contact_id | btree | contact_id | não | sim |  |
| public.crm_consent_audit_logs | idx_crm_consent_audit_user_id | btree | user_id | não | sim |  |
| public.crm_metric_overrides | crm_metric_overrides_pkey | btree | id | sim | sim |  |
| public.crm_objection_intelligence | crm_objection_intelligence_pkey | btree | id | sim | sim |  |
| public.crm_objection_intelligence | idx_objection_contact_id | btree | contact_id | não | sim |  |
| public.crm_objection_intelligence | idx_objection_type | btree | objection_type | não | sim |  |
| public.crm_relationship_audit_logs | crm_relationship_audit_logs_pkey | btree | id | sim | sim |  |
| public.cron_secrets | cron_secrets_pkey | btree | name | sim | sim |  |
| public.cs_accounts | cs_accounts_pkey | btree | id | sim | sim |  |
| public.cs_accounts | idx_cs_accounts_health | btree | user_id, health_score | não | sim |  |
| public.cs_accounts | idx_cs_accounts_lifecycle | btree | user_id, lifecycle_stage | não | sim |  |
| public.cs_accounts | idx_cs_accounts_renewal | btree | user_id, renewal_date | não | sim |  |
| public.cs_accounts | idx_cs_accounts_user | btree | user_id | não | sim |  |
| public.cs_health_signals | cs_health_signals_pkey | btree | id | sim | sim |  |
| public.cs_health_signals | idx_cs_signals_account | btree | account_id, signal_type | não | sim |  |
| public.cs_health_signals | idx_cs_signals_captured | btree | user_id, captured_at | não | sim |  |
| public.cs_nps_responses | cs_nps_responses_pkey | btree | id | sim | sim |  |
| public.cs_nps_responses | idx_cs_nps_account | btree | account_id, surveyed_at | não | sim |  |
| public.cs_nps_responses | idx_cs_nps_user | btree | user_id, surveyed_at | não | sim |  |
| public.cs_qbrs | cs_qbrs_pkey | btree | id | sim | sim |  |
| public.cs_renewals | cs_renewals_pkey | btree | id | sim | sim |  |
| public.csat_surveys | csat_surveys_pkey | btree | id | sim | sim |  |
| public.csat_surveys | csat_surveys_public_token_key | btree | public_token | sim | sim |  |
| public.csat_surveys | idx_csat_surveys_user_id | btree | user_id | não | sim |  |
| public.custom_field_values | custom_field_values_custom_field_id_entity_id_key | btree | custom_field_id, entity_id | sim | sim |  |
| public.custom_field_values | custom_field_values_pkey | btree | id | sim | sim |  |
| public.custom_field_values | idx_custom_field_values_custom_field_id | btree | custom_field_id | não | sim |  |
| public.custom_field_values | idx_custom_field_values_user_id | btree | user_id | não | sim |  |
| public.custom_fields | custom_fields_entity_type_field_name_key | btree | entity_type, field_name | sim | sim |  |
| public.custom_fields | custom_fields_pkey | btree | id | sim | sim |  |
| public.custom_fields | custom_fields_user_id_entity_type_field_name_key | btree | user_id, entity_type, field_name | sim | sim |  |
| public.customer_events | customer_events_pkey | btree | id | sim | sim |  |
| public.customer_events | idx_customer_events_executado_por_id | btree | executado_por_id | não | sim |  |
| public.customer_events | idx_customer_events_vendedor_id | btree | vendedor_id | não | sim |  |
| public.customer_events | idx_events_company | btree | company_id | não | sim |  |
| public.customer_events | idx_events_customer | btree | customer_id | não | sim |  |
| public.customer_health_scores | customer_health_scores_company_id_score_date_key | btree | company_id, score_date | sim | sim |  |
| public.customer_health_scores | customer_health_scores_pkey | btree | id | sim | sim |  |
| public.customer_health_scores | idx_customer_health_scores_company_id | btree | company_id | não | sim |  |
| public.customer_ownership_history | customer_ownership_history_pkey | btree | id | sim | sim |  |
| public.customer_ownership_history | idx_customer_ownership_history_company_id | btree | company_id | não | sim |  |
| public.customer_ownership_history | idx_customer_ownership_history_customer_id | btree | customer_id | não | sim |  |
| public.customer_ownership_history | idx_customer_ownership_history_registrado_por_id | btree | registrado_por_id | não | sim |  |
| public.customer_ownership_history | idx_customer_ownership_history_vendedor_id | btree | vendedor_id | não | sim |  |
| public.customer_purchases | customer_purchases_origem_origem_pedido_id_key | btree | origem, origem_pedido_id | sim | sim |  |
| public.customer_purchases | customer_purchases_pkey | btree | id | sim | sim |  |
| public.customer_purchases | idx_customer_purchases_customer_data | btree | customer_id, data_pedido | não | sim |  |
| public.customer_rotation_state | customer_rotation_state_pkey | btree | customer_id | sim | sim |  |
| public.customer_rotation_state | idx_rotation_state_segmento_closer | btree | segmento, proxima_rotacao_closer | não | sim |  |
| public.customer_rotation_state | idx_rotation_state_segmento_sdr | btree | segmento, proxima_rotacao_sdr | não | sim |  |
| public.customer_sdr_history | customer_sdr_history_pkey | btree | id | sim | sim |  |
| public.customer_sdr_history | idx_customer_sdr_history_closer_destino_id | btree | closer_destino_id | não | sim |  |
| public.customer_sdr_history | idx_customer_sdr_history_customer_id | btree | customer_id | não | sim |  |
| public.customer_sdr_history | idx_customer_sdr_history_sdr_id | btree | sdr_id | não | sim |  |
| public.customer_sdr_history | idx_sdr_history_company | btree | company_id | não | sim |  |
| public.customer_surveys | customer_surveys_pkey | btree | id | sim | sim |  |
| public.customer_surveys | idx_customer_surveys_contact_id_fk | btree | contact_id | não | sim |  |
| public.customer_surveys | idx_customer_surveys_sent_by | btree | sent_by | não | sim |  |
| public.customer_surveys | idx_surveys_company | btree | company_id | não | sim |  |
| public.customers | customers_company_id_key | btree | company_id | sim | sim |  |
| public.customers | customers_pkey | btree | id | sim | sim |  |
| public.customers | idx_customers_active | btree | id | não | sim | `(deleted_at IS NULL)` |
| public.customers | idx_customers_ativado | btree | id | não | sim | `(cliente_ativado = true)` |
| public.customers | idx_customers_ja_comprou | btree | id | não | sim | `(ja_comprou = true)` |
| public.customers | idx_customers_sdr_id | btree | sdr_id | não | sim |  |
| public.customers | idx_customers_updated_at | btree | updated_at | não | sim |  |
| public.customers | idx_customers_vendedor | btree | vendedor_id | não | sim |  |
| public.customers | idx_customers_vendedor_ativo | btree | vendedor_id, cliente_ativado | não | sim | `(deleted_at IS NULL)` |
| public.daily_challenges | daily_challenges_pkey | btree | id | sim | sim |  |
| public.data_quality_audits | data_quality_audits_pkey | btree | id | sim | sim |  |
| public.deal_competitors | deal_competitors_deal_id_competitor_id_key | btree | deal_id, competitor_id | sim | sim |  |
| public.deal_competitors | deal_competitors_pkey | btree | id | sim | sim |  |
| public.deal_competitors | idx_deal_competitors_competitor_id | btree | competitor_id | não | sim |  |
| public.deal_competitors | idx_deal_competitors_deal_id | btree | deal_id | não | sim |  |
| public.deal_forecasts | deal_forecasts_deal_id_period_id_key | btree | deal_id, period_id | sim | sim |  |
| public.deal_forecasts | deal_forecasts_pkey | btree | id | sim | sim |  |
| public.deal_items | deal_items_pkey | btree | id | sim | sim |  |
| public.deal_items | idx_deal_items_deal_id | btree | deal_id | não | sim |  |
| public.deal_items | idx_deal_items_product_id | btree | product_id | não | sim |  |
| public.deal_room_activities | deal_room_activities_pkey | btree | id | sim | sim |  |
| public.deal_room_activities | idx_dr_activities_room | btree | room_id, created_at | não | sim |  |
| public.deal_room_comments | deal_room_comments_pkey | btree | id | sim | sim |  |
| public.deal_room_comments | idx_dr_comments_room | btree | room_id, created_at | não | sim |  |
| public.deal_room_documents | deal_room_documents_pkey | btree | id | sim | sim |  |
| public.deal_room_documents | idx_dr_docs_room | btree | room_id | não | sim |  |
| public.deal_room_documents | idx_dr_docs_user | btree | user_id | não | sim |  |
| public.deal_room_milestones | deal_room_milestones_pkey | btree | id | sim | sim |  |
| public.deal_room_milestones | idx_dr_milestones_room | btree | room_id, sort_order | não | sim |  |
| public.deal_room_milestones | idx_dr_milestones_user | btree | user_id | não | sim |  |
| public.deal_room_stakeholders | deal_room_stakeholders_pkey | btree | id | sim | sim |  |
| public.deal_room_stakeholders | idx_dr_stakeholders_room | btree | room_id | não | sim |  |
| public.deal_room_stakeholders | idx_dr_stakeholders_user | btree | user_id | não | sim |  |
| public.deal_rooms | deal_rooms_pkey | btree | id | sim | sim |  |
| public.deal_rooms | deal_rooms_share_token_key | btree | share_token | sim | sim |  |
| public.deal_rooms | idx_deal_rooms_company | btree | company_id | não | sim |  |
| public.deal_rooms | idx_deal_rooms_status | btree | user_id, status | não | sim |  |
| public.deal_rooms | idx_deal_rooms_token | btree | share_token | não | sim |  |
| public.deal_rooms | idx_deal_rooms_user | btree | user_id | não | sim |  |
| public.deal_velocity_analysis | deal_velocity_analysis_pkey | btree | id | sim | sim |  |
| public.deal_velocity_analysis | idx_deal_velocity_analysis_company_id | btree | company_id | não | sim |  |
| public.deal_velocity_analysis | idx_deal_velocity_analysis_contact_id | btree | contact_id | não | sim |  |
| public.deal_velocity_analysis | idx_deal_velocity_analysis_user_id | btree | user_id | não | sim |  |
| public.deals | deals_pkey | btree | id | sim | sim |  |
| public.deals | idx_deals_company | btree | company_id | não | sim |  |
| public.deals | idx_deals_contact_id | btree | contact_id | não | sim |  |
| public.deals | idx_deals_created | btree | created_at | não | sim |  |
| public.deals | idx_deals_loss_reason_id | btree | loss_reason_id | não | sim |  |
| public.deals | idx_deals_status | btree | status | não | sim |  |
| public.deals | idx_deals_user | btree | user_id | não | sim |  |
| public.decision_criteria | decision_criteria_pkey | btree | id | sim | sim |  |
| public.decision_criteria | idx_decision_criteria_contact | btree | contact_id | não | sim |  |
| public.decision_criteria | idx_decision_criteria_user_id | btree | user_id | não | sim |  |
| public.device_login_notifications | device_login_notifications_pkey | btree | id | sim | sim |  |
| public.device_login_notifications | idx_device_login_notifications_user_id | btree | user_id | não | sim |  |
| public.disc_analysis_history | disc_analysis_history_pkey | btree | id | sim | sim |  |
| public.disc_analysis_history | idx_disc_analysis_history_analyzed_at | btree | analyzed_at | não | sim |  |
| public.disc_analysis_history | idx_disc_analysis_history_contact | btree | contact_id | não | sim |  |
| public.disc_analysis_history | idx_disc_analysis_history_interaction_id | btree | interaction_id | não | sim |  |
| public.disc_analysis_history | idx_disc_analysis_history_user | btree | user_id | não | sim |  |
| public.disc_analysis_history_audit | disc_analysis_history_audit_pkey | btree | id | sim | sim |  |
| public.disc_approach_recommendations | disc_approach_recommendations_pkey | btree | id | sim | sim |  |
| public.disc_communication_logs | disc_communication_logs_pkey | btree | id | sim | sim |  |
| public.disc_communication_logs | idx_disc_communication_logs_contact | btree | contact_id | não | sim |  |
| public.disc_communication_logs | idx_disc_communication_logs_interaction_id | btree | interaction_id | não | sim |  |
| public.disc_communication_logs | idx_disc_communication_logs_user_id | btree | user_id | não | sim |  |
| public.disc_conversion_metrics | disc_conversion_metrics_pkey | btree | id | sim | sim |  |
| public.disc_conversion_metrics | disc_conversion_metrics_user_id_disc_profile_period_start_p_key | btree | user_id, disc_profile, period_start, period_end | sim | sim |  |
| public.disc_conversion_metrics | idx_disc_conversion_metrics_user | btree | user_id | não | sim |  |
| public.disc_profile_config | disc_profile_config_pkey | btree | id | sim | sim |  |
| public.disc_profile_config | disc_profile_config_profile_type_key | btree | profile_type | sim | sim |  |
| public.disc_templates | disc_templates_pkey | btree | id | sim | sim |  |
| public.disc_templates | idx_disc_templates_created_by | btree | created_by | não | sim |  |
| public.document_signatures | document_signatures_pkey | btree | id | sim | sim |  |
| public.document_signatures | document_signatures_signature_token_key | btree | signature_token | sim | sim |  |
| public.document_signatures | idx_document_signatures_status | btree | user_id, status | não | sim |  |
| public.document_signatures | idx_document_signatures_token | btree | signature_token | não | sim |  |
| public.document_signatures | idx_document_signatures_user | btree | user_id | não | sim |  |
| public.document_templates | document_templates_pkey | btree | id | sim | sim |  |
| public.document_templates | idx_document_templates_user | btree | user_id | não | sim |  |
| public.document_templates | idx_document_templates_user_id | btree | user_id | não | sim |  |
| public.document_views | document_views_pkey | btree | id | sim | sim |  |
| public.document_views | idx_document_views_signature | btree | signature_id | não | sim |  |
| public.document_views | idx_document_views_user_id | btree | user_id | não | sim |  |
| public.documents | documents_pkey | btree | id | sim | sim |  |
| public.documents | idx_documents_entity | btree | entity_type, entity_id | não | sim |  |
| public.documents | idx_documents_user_id | btree | user_id | não | sim |  |
| public.duplicate_candidates | duplicate_candidates_entity_type_entity_1_id_entity_2_id_key | btree | entity_type, entity_1_id, entity_2_id | sim | sim |  |
| public.duplicate_candidates | duplicate_candidates_pkey | btree | id | sim | sim |  |
| public.duplicate_candidates | idx_duplicate_candidates_reviewed_by | btree | reviewed_by | não | sim |  |
| public.economic_group_members | economic_group_members_group_id_company_id_key | btree | group_id, company_id | sim | sim |  |
| public.economic_group_members | economic_group_members_pkey | btree | id | sim | sim |  |
| public.economic_group_members | idx_econ_group_members_company | btree | company_id | não | sim |  |
| public.economic_group_members | idx_economic_group_members_group_id | btree | group_id | não | sim |  |
| public.economic_groups | economic_groups_pkey | btree | id | sim | sim |  |
| public.economic_groups | idx_economic_groups_main_company_id_fk | btree | main_company_id | não | sim |  |
| public.email_campaigns | email_campaigns_pkey | btree | id | sim | sim |  |
| public.email_campaigns | idx_email_campaigns_user_id | btree | user_id | não | sim |  |
| public.email_finder_results | email_finder_results_pkey | btree | id | sim | sim |  |
| public.email_finder_results | idx_efr_contact | btree | contact_id | não | sim |  |
| public.email_finder_results | idx_efr_domain | btree | domain | não | sim |  |
| public.email_finder_results | idx_efr_user | btree | user_id | não | sim |  |
| public.email_logs | email_logs_pkey | btree | id | sim | sim |  |
| public.email_logs | idx_email_logs_company | btree | company_id | não | sim |  |
| public.email_logs | idx_email_logs_contact_id_fk | btree | contact_id | não | sim |  |
| public.email_thread_summaries | email_thread_summaries_pkey | btree | id | sim | sim |  |
| public.email_thread_summaries | email_thread_summaries_user_id_thread_key_key | btree | user_id, thread_key | sim | sim |  |
| public.email_thread_summaries | idx_ets_user_created | btree | user_id, created_at | não | sim |  |
| public.email_thread_summaries | idx_ets_user_thread | btree | user_id, thread_key | não | sim |  |
| public.email_verifications | email_verifications_pkey | btree | id | sim | sim |  |
| public.email_verifications | idx_email_verif_contact | btree | contact_id | não | sim |  |
| public.email_verifications | idx_email_verif_email | btree |  | não | sim |  |
| public.email_verifications | idx_email_verif_user | btree | user_id | não | sim |  |
| public.email_verifications | idx_email_verif_verified_at | btree | verified_at | não | sim |  |
| public.embedding_configs | embedding_configs_pkey | btree | id | sim | sim |  |
| public.emotional_anchors | emotional_anchors_pkey | btree | id | sim | sim |  |
| public.emotional_anchors | idx_emotional_anchors_contact | btree | contact_id | não | sim |  |
| public.emotional_anchors | idx_emotional_anchors_user_id | btree | user_id | não | sim |  |
| public.emotional_states_history | emotional_states_history_pkey | btree | id | sim | sim |  |
| public.emotional_states_history | idx_emotional_states_contact | btree | contact_id | não | sim |  |
| public.emotional_states_history | idx_emotional_states_created | btree | created_at | não | sim |  |
| public.emotional_states_history | idx_emotional_states_history_interaction_id | btree | interaction_id | não | sim |  |
| public.emotional_states_history | idx_emotional_states_history_user_id | btree | user_id | não | sim |  |
| public.entity_relationships | entity_relationships_pkey | btree | id | sim | sim |  |
| public.entity_relationships | entity_relationships_unique | btree | from_type, from_id, to_type, to_id, role | sim | sim |  |
| public.entity_relationships | idx_entity_rel_from | btree | from_type, from_id | não | sim |  |
| public.entity_relationships | idx_entity_rel_primary | btree | from_type, from_id, role | não | sim | `is_primary` |
| public.entity_relationships | idx_entity_rel_role | btree | role | não | sim |  |
| public.entity_relationships | idx_entity_rel_to | btree | to_type, to_id | não | sim |  |
| public.eq_analysis_history | eq_analysis_history_pkey | btree | id | sim | sim |  |
| public.eq_analysis_history | idx_eq_analysis_contact | btree | contact_id | não | sim |  |
| public.eq_analysis_history | idx_eq_analysis_history_analyzed_at | btree | analyzed_at | não | sim |  |
| public.eq_analysis_history | idx_eq_analysis_history_interaction_id | btree | interaction_id | não | sim |  |
| public.eq_analysis_history | idx_eq_analysis_history_user_id | btree | user_id | não | sim |  |
| public.eq_assessment_questions | eq_assessment_questions_pkey | btree | id | sim | sim |  |
| public.error_logs | error_logs_pkey | btree | id | sim | sim |  |
| public.estados | estados_pkey | btree | ibge_code | sim | sim |  |
| public.estados | estados_uf_key | btree | uf | sim | sim |  |
| public.external_data_audit_log | external_data_audit_log_pkey | btree | id | sim | sim |  |
| public.external_data_audit_log | idx_external_data_audit_outcome | btree | outcome, created_at | não | sim | `(outcome = ANY (ARRAY['denied'::text, 'error'::text]))` |
| public.external_data_audit_log | idx_external_data_audit_user | btree | user_id, created_at | não | sim |  |
| public.favorite_templates | favorite_templates_pkey | btree | id | sim | sim |  |
| public.favorite_templates | idx_fav_templates_unique | btree | user_id, template_id | sim | sim |  |
| public.favorites | favorites_pkey | btree | id | sim | sim |  |
| public.favorites | favorites_user_id_entity_type_entity_id_key | btree | user_id, entity_type, entity_id | sim | sim |  |
| public.favorites | idx_favorites_user_id | btree | user_id | não | sim |  |
| public.feature_flags | feature_flags_pkey | btree | name | sim | sim |  |
| public.ficha360_conversation_summaries | ficha360_conversation_summaries_pkey | btree | id | sim | sim |  |
| public.follow_up_approvals | follow_up_approvals_pkey | btree | id | sim | sim |  |
| public.follow_up_approvals_v2 | follow_up_approvals_v2_pkey | btree | id | sim | sim |  |
| public.forecast_categories_history | forecast_categories_history_pkey | btree | id | sim | sim |  |
| public.forecast_categories_history | idx_forecast_cat_history_df | btree | deal_forecast_id, changed_at | não | sim |  |
| public.forecast_periods | forecast_periods_pkey | btree | id | sim | sim |  |
| public.forecast_periods | forecast_periods_user_id_period_type_period_start_key | btree | user_id, period_type, period_start | sim | sim |  |
| public.forecast_periods | idx_forecast_periods_user | btree | user_id, status, period_start | não | sim |  |
| public.forecast_quota_settings | forecast_quota_settings_pkey | btree | id | sim | sim |  |
| public.forecast_quota_settings | forecast_quota_settings_user_id_key | btree | user_id | sim | sim |  |
| public.forecast_snapshots | forecast_snapshots_period_id_snapshot_date_key | btree | period_id, snapshot_date | sim | sim |  |
| public.forecast_snapshots | forecast_snapshots_pkey | btree | id | sim | sim |  |
| public.forecast_snapshots | idx_forecast_snapshots_period | btree | period_id, snapshot_date | não | sim |  |
| public.form_submissions | form_submissions_pkey | btree | id | sim | sim |  |
| public.form_submissions | idx_fs_contact | btree | contact_id | não | sim |  |
| public.form_submissions | idx_fs_form | btree | form_id | não | sim |  |
| public.form_submissions | idx_fs_user | btree | user_id | não | sim |  |
| public.forms | forms_pkey | btree | id | sim | sim |  |
| public.forms | forms_slug_key | btree | slug | sim | sim |  |
| public.forms | idx_forms_slug | btree | slug | não | sim |  |
| public.forms | idx_forms_user | btree | user_id | não | sim |  |
| public.geo_allowed_countries | geo_allowed_countries_pkey | btree | id | sim | sim |  |
| public.geo_allowed_countries | unique_country_per_user | btree | user_id, country_code | sim | sim |  |
| public.grupos_economicos | grupos_economicos_pkey | btree | id | sim | sim |  |
| public.grupos_economicos | idx_grupo_nome | btree | nome | sim | sim |  |
| public.guardrail_ml_logs | guardrail_ml_logs_pkey | btree | id | sim | sim |  |
| public.handoff_requests | handoff_requests_pkey | btree | id | sim | sim |  |
| public.handoff_requests | idx_handoff_created | btree | created_at | não | sim |  |
| public.handoff_requests | idx_handoff_from | btree | from_member_id | não | sim |  |
| public.handoff_requests | idx_handoff_requests_user_id | btree | user_id | não | sim |  |
| public.handoff_requests | idx_handoff_status | btree | status | não | sim |  |
| public.handoff_requests | idx_handoff_to | btree | to_member_id | não | sim |  |
| public.health_alert_settings | health_alert_settings_pkey | btree | id | sim | sim |  |
| public.health_alert_settings | idx_health_settings_user | btree | user_id | sim | sim |  |
| public.health_alerts | health_alerts_pkey | btree | id | sim | sim |  |
| public.health_alerts | idx_health_alerts_contact | btree | contact_id | não | sim |  |
| public.health_alerts | idx_health_alerts_user_id | btree | user_id | não | sim |  |
| public.hidden_objections | hidden_objections_pkey | btree | id | sim | sim |  |
| public.hidden_objections | idx_hidden_objections_contact | btree | contact_id | não | sim |  |
| public.hidden_objections | idx_hidden_objections_interaction_id | btree | interaction_id | não | sim |  |
| public.hidden_objections | idx_hidden_objections_resolved | btree | resolved | não | sim |  |
| public.hidden_objections | idx_objections_user | btree | user_id | não | sim |  |
| public.import_jobs | idx_import_jobs_created_by | btree | created_by | não | sim |  |
| public.import_jobs | import_jobs_pkey | btree | id | sim | sim |  |
| public.inactivity_alerts | idx_inactivity_alerts_company | btree | company_id | não | sim |  |
| public.inactivity_alerts | idx_inactivity_alerts_contact | btree | contact_id | não | sim |  |
| public.inactivity_alerts | idx_inactivity_alerts_resolved_by | btree | resolved_by | não | sim |  |
| public.inactivity_alerts | idx_inactivity_alerts_status | btree | status | não | sim |  |
| public.inactivity_alerts | inactivity_alerts_pkey | btree | id | sim | sim |  |
| public.incoming_webhook_dlq | idx_dlq_status_retry | btree | status, next_retry_at | não | sim |  |
| public.incoming_webhook_dlq | idx_dlq_webhook_id | btree | webhook_id | não | sim |  |
| public.incoming_webhook_dlq | incoming_webhook_dlq_pkey | btree | id | sim | sim |  |
| public.incoming_webhook_logs | incoming_webhook_logs_pkey | btree | id | sim | sim |  |
| public.incoming_webhook_nonces | idx_incoming_webhook_nonces_expires_at | btree | expires_at | não | sim |  |
| public.incoming_webhook_nonces | incoming_webhook_nonces_pkey | btree | webhook_id, idempotency_key | sim | sim |  |
| public.incoming_webhooks | incoming_webhooks_pkey | btree | id | sim | sim |  |
| public.incoming_webhooks | incoming_webhooks_token_key | btree | token | sim | sim |  |
| public.insights | idx_insights_active | btree | contact_id, user_id | não | sim | `(dismissed = false)` |
| public.insights | idx_insights_contact | btree | contact_id | não | sim |  |
| public.insights | idx_insights_contact_id | btree | contact_id | não | sim |  |
| public.insights | idx_insights_user_id | btree | user_id | não | sim |  |
| public.insights | insights_pkey | btree | id | sim | sim |  |
| public.integration_logs | idx_integration_logs_integration_id | btree | integration_id | não | sim |  |
| public.integration_logs | integration_logs_pkey | btree | id | sim | sim |  |
| public.integrations | idx_integrations_created_by | btree | created_by | não | sim |  |
| public.integrations | integrations_pkey | btree | id | sim | sim |  |
| public.intent_scores | intent_scores_pkey | btree | id | sim | sim |  |
| public.intent_scores | intent_scores_user_id_scope_scope_id_key | btree | user_id, scope, scope_id | sim | sim |  |
| public.intent_signals | intent_signals_pkey | btree | id | sim | sim |  |
| public.intent_tracking_pixels | intent_tracking_pixels_pixel_key_key | btree | pixel_key | sim | sim |  |
| public.intent_tracking_pixels | intent_tracking_pixels_pkey | btree | id | sim | sim |  |
| public.interaction_summaries | interaction_summaries_pkey | btree | id | sim | sim |  |
| public.interaction_templates | idx_interaction_templates_user_id | btree | user_id | não | sim |  |
| public.interaction_templates | interaction_templates_pkey | btree | id | sim | sim |  |
| public.interactions | idx_interactions_channel | btree | channel | não | sim |  |
| public.interactions | idx_interactions_company | btree | company_id | não | sim |  |
| public.interactions | idx_interactions_company_created | btree | company_id, created_at | não | sim |  |
| public.interactions | idx_interactions_contact | btree | contact_id | não | sim |  |
| public.interactions | idx_interactions_contact_created | btree | contact_id, created_at | não | sim |  |
| public.interactions | idx_interactions_contact_id | btree | contact_id | não | sim |  |
| public.interactions | idx_interactions_created_at | btree | created_at | não | sim |  |
| public.interactions | idx_interactions_data | btree | data_interacao | não | sim |  |
| public.interactions | idx_interactions_followup_pending | btree | follow_up_date | não | sim | `((follow_up_date IS NOT NULL) AND (COALESCE(followup_concluido, false) = false))` |
| public.interactions | idx_interactions_followup_required_modern | btree | user_id, follow_up_date | não | sim | `((follow_up_required = true) AND (follow_up_date IS NOT NULL))` |
| public.interactions | idx_interactions_initiated_by | btree | initiated_by | não | sim |  |
| public.interactions | idx_interactions_pending_followup | btree | data_followup | não | sim | `((requer_followup = true) AND (followup_concluido = false))` |
| public.interactions | idx_interactions_status | btree | status | não | sim |  |
| public.interactions | idx_interactions_type | btree | type | não | sim |  |
| public.interactions | idx_interactions_updated_at | btree | updated_at | não | sim |  |
| public.interactions | idx_interactions_user_created | btree | user_id, created_at | não | sim |  |
| public.interactions | idx_interactions_user_id | btree | user_id | não | sim |  |
| public.interactions | idx_interactions_usuario_responsavel_id | btree | usuario_responsavel_id | não | sim |  |
| public.interactions | interactions_pkey | btree | id | sim | sim |  |
| public.interactions_audit | interactions_audit_pkey | btree | id | sim | sim |  |
| public.ip_whitelist | idx_ip_whitelist_user_id | btree | user_id | não | sim |  |
| public.ip_whitelist | ip_whitelist_pkey | btree | id | sim | sim |  |
| public.knowledge_base_articles | knowledge_base_articles_pkey | btree | id | sim | sim |  |
| public.knowledge_base_articles | unique_slug_per_user | btree | user_id, slug | sim | sim |  |
| public.landing_page_submissions | idx_landing_page_submissions_user_id | btree | user_id | não | sim |  |
| public.landing_page_submissions | landing_page_submissions_pkey | btree | id | sim | sim |  |
| public.landing_pages | landing_pages_pkey | btree | id | sim | sim |  |
| public.landing_pages | landing_pages_slug_key | btree | slug | sim | sim |  |
| public.landing_pages | unique_slug_lp | btree | user_id, slug | sim | sim |  |
| public.lead_assignments | idx_assignments_contact | btree | contact_id | não | sim |  |
| public.lead_assignments | idx_assignments_created | btree | created_at | não | sim |  |
| public.lead_assignments | idx_assignments_status | btree | status | não | sim |  |
| public.lead_assignments | idx_assignments_type | btree | assignment_type | não | sim |  |
| public.lead_assignments | idx_lead_assignments_user_id | btree | user_id | não | sim |  |
| public.lead_assignments | lead_assignments_pkey | btree | id | sim | sim |  |
| public.lead_magnet_downloads | idx_lmd_magnet | btree | magnet_id | não | sim |  |
| public.lead_magnet_downloads | idx_lmd_user | btree | user_id | não | sim |  |
| public.lead_magnet_downloads | lead_magnet_downloads_pkey | btree | id | sim | sim |  |
| public.lead_magnets | idx_lm_slug | btree | slug | não | sim |  |
| public.lead_magnets | idx_lm_user | btree | user_id | não | sim |  |
| public.lead_magnets | lead_magnets_pkey | btree | id | sim | sim |  |
| public.lead_magnets | lead_magnets_slug_key | btree | slug | sim | sim |  |
| public.lead_routing_rules | idx_lead_routing_rules_user_id | btree | user_id | não | sim |  |
| public.lead_routing_rules | idx_routing_rules_active | btree | is_active | não | sim |  |
| public.lead_routing_rules | idx_routing_rules_priority | btree | priority | não | sim |  |
| public.lead_routing_rules | lead_routing_rules_pkey | btree | id | sim | sim |  |
| public.lead_score_config | lead_score_config_pkey | btree | id | sim | sim |  |
| public.lead_score_config | lead_score_config_user_id_key | btree | user_id | sim | sim |  |
| public.lead_score_history | idx_lead_score_history_company_id | btree | company_id | não | sim |  |
| public.lead_score_history | idx_lead_score_history_contact | btree | contact_id, recorded_at | não | sim |  |
| public.lead_score_history | idx_lead_score_history_user | btree | user_id, recorded_at | não | sim |  |
| public.lead_score_history | idx_lead_score_history_user_id | btree | user_id | não | sim |  |
| public.lead_score_history | lead_score_history_company_id_score_date_key | btree | company_id, score_date | sim | sim |  |
| public.lead_score_history | lead_score_history_pkey | btree | id | sim | sim |  |
| public.lead_score_recompute_queue | idx_lead_score_queue_pending | btree | enqueued_at | não | sim | `(processed_at IS NULL)` |
| public.lead_score_recompute_queue | idx_lead_score_queue_user_contact | btree | user_id, contact_id | não | sim | `(processed_at IS NULL)` |
| public.lead_score_recompute_queue | lead_score_recompute_queue_pkey | btree | id | sim | sim |  |
| public.lead_score_rules | idx_lead_score_rules_user | btree | user_id, active | não | sim |  |
| public.lead_score_rules | lead_score_rules_pkey | btree | id | sim | sim |  |
| public.lead_score_rules | lead_score_rules_user_id_dimension_signal_key_key | btree | user_id, dimension, signal_key | sim | sim |  |
| public.lead_score_threshold_automations | idx_lsta_user_active | btree | user_id, active | não | sim |  |
| public.lead_score_threshold_automations | lead_score_threshold_automations_pkey | btree | id | sim | sim |  |
| public.lead_score_threshold_log | lead_score_threshold_log_pkey | btree | id | sim | sim |  |
| public.lead_score_thresholds | lead_score_thresholds_pkey | btree | id | sim | sim |  |
| public.lead_score_thresholds | lead_score_thresholds_user_id_grade_key | btree | user_id, grade | sim | sim |  |
| public.lead_scores | lead_scores_contact_id_user_id_key | btree | contact_id, user_id | sim | sim |  |
| public.lead_scores | lead_scores_pkey | btree | id | sim | sim |  |
| public.lead_scores | unique_lead_score_contact | btree | user_id, contact_id | sim | sim |  |
| public.lead_sources | lead_sources_nome_key | btree | nome | sim | sim |  |
| public.lead_sources | lead_sources_pkey | btree | id | sim | sim |  |
| public.life_events | idx_life_events_contact | btree | contact_id | não | sim |  |
| public.life_events | idx_life_events_user_id | btree | user_id | não | sim |  |
| public.life_events | life_events_pkey | btree | id | sim | sim |  |
| public.life_events_history | life_events_history_pkey | btree | id | sim | sim |  |
| public.login_attempts | login_attempts_pkey | btree | id | sim | sim |  |
| public.loss_reasons | loss_reasons_nome_key | btree | nome | sim | sim |  |
| public.loss_reasons | loss_reasons_pkey | btree | id | sim | sim |  |
| public.lux_intelligence | idx_lux_entity | btree | entity_id, entity_type | não | sim |  |
| public.lux_intelligence | idx_lux_user | btree | user_id | não | sim |  |
| public.lux_intelligence | lux_intelligence_pkey | btree | id | sim | sim |  |
| public.lux_webhook_config | idx_lux_webhook_config_one_default_per_user | btree | user_id | sim | sim | `(is_default = true)` |
| public.lux_webhook_config | lux_webhook_config_entity_type_key | btree | entity_type | sim | sim |  |
| public.lux_webhook_config | lux_webhook_config_pkey | btree | id | sim | sim |  |
| public.marketing_campaign_stats | marketing_campaign_stats_pkey | btree | id | sim | sim |  |
| public.marketing_roi_data | marketing_roi_data_pkey | btree | id | sim | sim |  |
| public.mcp_tool_calls | mcp_tool_calls_pkey | btree | id | sim | sim |  |
| public.meeting_summaries | idx_meeting_summaries_interaction | btree | interaction_id | sim | sim |  |
| public.meeting_summaries | idx_meeting_summaries_user_id | btree | user_id | não | sim |  |
| public.meeting_summaries | meeting_summaries_pkey | btree | id | sim | sim |  |
| public.meetings | idx_meetings_company | btree | company_id | não | sim |  |
| public.meetings | idx_meetings_contact_id_fk | btree | contact_id | não | sim |  |
| public.meetings | idx_meetings_deal_id | btree | deal_id | não | sim |  |
| public.meetings | idx_meetings_user_id | btree | user_id | não | sim |  |
| public.meetings | meetings_pkey | btree | id | sim | sim |  |
| public.message_templates | message_templates_pkey | btree | id | sim | sim |  |
| public.metaprogram_analysis | idx_meta_contact | btree | contact_id | não | sim |  |
| public.metaprogram_analysis | idx_metaprogram_analysis_interaction_id | btree | interaction_id | não | sim |  |
| public.metaprogram_analysis | idx_metaprogram_analysis_user_id | btree | user_id | não | sim |  |
| public.metaprogram_analysis | metaprogram_analysis_pkey | btree | id | sim | sim |  |
| public.model_pricing_v2 | model_pricing_v2_model_provider_key | btree | model, provider | sim | sim |  |
| public.model_pricing_v2 | model_pricing_v2_pkey | btree | id | sim | sim |  |
| public.mql_classifications | idx_mqlcls_contact | btree | contact_id | não | sim |  |
| public.mql_classifications | idx_mqlcls_status | btree | status | não | sim |  |
| public.mql_classifications | idx_mqlcls_user | btree | user_id | não | sim |  |
| public.mql_classifications | mql_classifications_pkey | btree | id | sim | sim |  |
| public.mql_criteria | idx_mqlc_user | btree | user_id | não | sim |  |
| public.mql_criteria | mql_criteria_pkey | btree | id | sim | sim |  |
| public.neuro_behavioral_history | idx_neuro_history_contact_id | btree | contact_id | não | sim |  |
| public.neuro_behavioral_history | neuro_behavioral_history_pkey | btree | id | sim | sim |  |
| public.neuro_pnl_sessions | idx_neuro_pnl_contact_id | btree | contact_id | não | sim |  |
| public.neuro_pnl_sessions | neuro_pnl_sessions_pkey | btree | id | sim | sim |  |
| public.nlp_extractions | nlp_extractions_pkey | btree | id | sim | sim |  |
| public.nlp_feedback | nlp_feedback_pkey | btree | id | sim | sim |  |
| public.notification_logs | notification_logs_pending_expiration_idx | btree | claim_expires_at | não | sim | `(delivery_status = 'pending'::text)` |
| public.notification_logs | notification_logs_pkey | btree | id | sim | sim |  |
| public.notification_logs | notification_logs_reminder_id_channel_key | btree | reminder_id, channel | sim | sim |  |
| public.notification_preferences | notification_preferences_pkey | btree | user_id | sim | sim |  |
| public.notifications | idx_notifications_user_id | btree | user_id | não | sim |  |
| public.notifications | idx_notifications_user_unread | btree | user_id, is_read | não | sim | `(is_read = false)` |
| public.notifications | notifications_pkey | btree | id | sim | sim |  |
| public.nps_surveys | idx_nps_surveys_company | btree | company_id | não | sim |  |
| public.nps_surveys | idx_nps_surveys_contact_id_fk | btree | contact_id | não | sim |  |
| public.nps_surveys | idx_nps_surveys_created_by | btree | created_by | não | sim |  |
| public.nps_surveys | nps_surveys_pkey | btree | id | sim | sim |  |
| public.nurturing_enrollments | idx_nurturing_enrollments_user_id | btree | user_id | não | sim |  |
| public.nurturing_enrollments | nurturing_enrollments_pkey | btree | id | sim | sim |  |
| public.nurturing_enrollments | uq_nurturing_enrollments_workflow_contact | btree | workflow_id, contact_id | sim | sim |  |
| public.nurturing_executions | idx_ne_next_action | btree | next_action_at | não | sim | `(status = 'active'::text)` |
| public.nurturing_executions | idx_ne_user | btree | user_id | não | sim |  |
| public.nurturing_executions | idx_ne_workflow | btree | workflow_id | não | sim |  |
| public.nurturing_executions | nurturing_executions_pkey | btree | id | sim | sim |  |
| public.nurturing_executions | nurturing_executions_workflow_id_contact_id_key | btree | workflow_id, contact_id | sim | sim |  |
| public.nurturing_workflows | idx_nurturing_workflows_user_id | btree | user_id | não | sim |  |
| public.nurturing_workflows | nurturing_workflows_pkey | btree | id | sim | sim |  |
| public.oauth_tokens | oauth_tokens_pkey | btree | service | sim | sim |  |
| public.objection_example_feedback | idx_objection_example_feedback_user_objection | btree | user_id, objection | não | sim |  |
| public.objection_example_feedback | objection_example_feedback_pkey | btree | id | sim | sim |  |
| public.objection_example_feedback | objection_example_feedback_unique | btree | user_id, objection, interaction_id | sim | sim |  |
| public.offer_suggestions | idx_offer_suggestions_contact | btree | contact_id | não | sim |  |
| public.offer_suggestions | idx_offer_suggestions_status | btree | status | não | sim |  |
| public.offer_suggestions | idx_offer_suggestions_user_id | btree | user_id | não | sim |  |
| public.offer_suggestions | offer_suggestions_pkey | btree | id | sim | sim |  |
| public.password_reset_requests | password_reset_requests_pkey | btree | id | sim | sim |  |
| public.people_intelligence_events | idx_pie_contact | btree | contact_id, detected_at | não | sim |  |
| public.people_intelligence_events | idx_pie_type | btree | event_type | não | sim |  |
| public.people_intelligence_events | idx_pie_user | btree | user_id | não | sim |  |
| public.people_intelligence_events | people_intelligence_events_pkey | btree | id | sim | sim |  |
| public.permissions | permissions_name_key | btree | name | sim | sim |  |
| public.permissions | permissions_pkey | btree | id | sim | sim |  |
| public.permissions | permissions_resource_action_key | btree | resource, action | sim | sim |  |
| public.phone_validations | idx_phone_val_contact | btree | contact_id | não | sim |  |
| public.phone_validations | idx_phone_val_e164 | btree | phone_e164 | não | sim |  |
| public.phone_validations | idx_phone_val_user | btree | user_id | não | sim |  |
| public.phone_validations | idx_phone_val_validated_at | btree | validated_at | não | sim |  |
| public.phone_validations | phone_validations_pkey | btree | id | sim | sim |  |
| public.pipeline_stage_transitions | pipeline_stage_transitions_from_to_idx | btree | from_stage, to_stage | sim | sim |  |
| public.pipeline_stage_transitions | pipeline_stage_transitions_pkey | btree | id | sim | sim |  |
| public.pipeline_stages | idx_pipeline_stages_pipeline_id | btree | pipeline_id | não | sim |  |
| public.pipeline_stages | pipeline_stages_pipeline_id_ordem_key | btree | pipeline_id, ordem | sim | sim |  |
| public.pipeline_stages | pipeline_stages_pkey | btree | id | sim | sim |  |
| public.pipelines | pipelines_pkey | btree | id | sim | sim |  |
| public.playbook_usage_log | idx_playbook_usage_battle_card | btree | battle_card_id, opened_at | não | sim |  |
| public.playbook_usage_log | idx_playbook_usage_playbook | btree | playbook_id, opened_at | não | sim |  |
| public.playbook_usage_log | idx_playbook_usage_user | btree | user_id, opened_at | não | sim |  |
| public.playbook_usage_log | playbook_usage_log_pkey | btree | id | sim | sim |  |
| public.portfolio_settings | portfolio_settings_pkey | btree | id | sim | sim |  |
| public.portfolio_settings | portfolio_settings_setting_key_key | btree | setting_key | sim | sim |  |
| public.product_novelties | idx_product_novelties_supplier_id | btree | supplier_id | não | sim |  |
| public.product_novelties | product_novelties_pkey | btree | id | sim | sim |  |
| public.product_novelties | product_novelties_product_id_unique | btree | product_id | sim | sim |  |
| public.products | products_pkey | btree | id | sim | sim |  |
| public.products | products_sku_key | btree | sku | sim | sim |  |
| public.profiles | idx_profiles_bitrix_user_id | btree | bitrix_user_id | não | sim |  |
| public.profiles | profiles_email_key | btree | email | sim | sim |  |
| public.profiles | profiles_pkey | btree | id | sim | sim |  |
| public.proposals | idx_proposals_company_id | btree | company_id | não | sim |  |
| public.proposals | idx_proposals_contact_id | btree | contact_id | não | sim |  |
| public.proposals | idx_proposals_deal | btree | deal_id | não | sim |  |
| public.proposals | idx_proposals_status | btree | status | não | sim |  |
| public.proposals | idx_proposals_user_id | btree | user_id | não | sim |  |
| public.proposals | proposals_pkey | btree | id | sim | sim |  |
| public.proximo_passo_feedback | idx_ppf_user_contact_passo | btree | user_id, contact_id, passo_id, executed_at | não | sim |  |
| public.proximo_passo_feedback | proximo_passo_feedback_pkey | btree | id | sim | sim |  |
| public.psychographic_audit_log | psychographic_audit_log_pkey | btree | id | sim | sim |  |
| public.purchase_history | idx_purchase_history_user_id | btree | user_id | não | sim |  |
| public.purchase_history | purchase_history_pkey | btree | id | sim | sim |  |
| public.push_subscriptions | push_subscriptions_pkey | btree | id | sim | sim |  |
| public.push_subscriptions | push_subscriptions_user_id_endpoint_key | btree | user_id, endpoint | sim | sim |  |
| public.query_telemetry | idx_query_telemetry_user_id | btree | user_id | não | sim |  |
| public.query_telemetry | query_telemetry_pkey | btree | id | sim | sim |  |
| public.quick_notes | idx_quick_notes_company | btree | company_id | não | sim |  |
| public.quick_notes | idx_quick_notes_user_id | btree | user_id | não | sim |  |
| public.quick_notes | quick_notes_pkey | btree | id | sim | sim |  |
| public.ragas_scores | ragas_scores_pkey | btree | id | sim | sim |  |
| public.redistribution_log | idx_redistribution_log_user_id | btree | user_id | não | sim |  |
| public.redistribution_log | redistribution_log_pkey | btree | id | sim | sim |  |
| public.reframing_analysis | reframing_analysis_pkey | btree | id | sim | sim |  |
| public.reframing_analysis_audit | reframing_analysis_audit_pkey | btree | id | sim | sim |  |
| public.relationship_score_history | idx_relationship_score_history_contact_id | btree | contact_id | não | sim |  |
| public.relationship_score_history | idx_relationship_score_history_contact_measured | btree | contact_id, measured_at | não | sim |  |
| public.relationship_score_history | idx_relationship_score_history_user_id | btree | user_id | não | sim |  |
| public.relationship_score_history | relationship_score_history_pkey | btree | id | sim | sim |  |
| public.reminders | idx_reminders_company | btree | company_id | não | sim |  |
| public.reminders | idx_reminders_user_date | btree | user_id, reminder_date | não | sim |  |
| public.reminders | idx_reminders_user_id | btree | user_id | não | sim |  |
| public.reminders | reminders_pkey | btree | id | sim | sim |  |
| public.report_executions | idx_report_executions_scheduled_report_id | btree | scheduled_report_id | não | sim |  |
| public.report_executions | report_executions_pkey | btree | id | sim | sim |  |
| public.revops_alerts | idx_revops_alerts_user_active | btree | user_id, dismissed, created_at | não | sim |  |
| public.revops_alerts | revops_alerts_pkey | btree | id | sim | sim |  |
| public.revops_benchmarks | idx_revops_benchmarks_user_metric | btree | user_id, metric_key | não | sim |  |
| public.revops_benchmarks | revops_benchmarks_pkey | btree | id | sim | sim |  |
| public.revops_benchmarks | revops_benchmarks_user_id_metric_key_key | btree | user_id, metric_key | sim | sim |  |
| public.revops_snapshots | idx_revops_snapshots_user_period | btree | user_id, period | não | sim |  |
| public.revops_snapshots | revops_snapshots_pkey | btree | id | sim | sim |  |
| public.revops_snapshots | revops_snapshots_user_id_period_funnel_stage_key | btree | user_id, period, funnel_stage | sim | sim |  |
| public.rfm_analysis | idx_rfm_analysis_contact | btree | contact_id | não | sim |  |
| public.rfm_analysis | idx_rfm_analysis_scores | btree | recency_score, frequency_score, monetary_score | não | sim |  |
| public.rfm_analysis | idx_rfm_analysis_segment | btree | segment | não | sim |  |
| public.rfm_analysis | idx_rfm_analysis_user | btree | user_id | não | sim |  |
| public.rfm_analysis | rfm_analysis_pkey | btree | id | sim | sim |  |
| public.rfm_analysis | rfm_analysis_user_id_contact_id_key | btree | user_id, contact_id | sim | sim |  |
| public.rfm_analysis | unique_rfm_analysis_company | btree | user_id, company_id | sim | sim |  |
| public.rfm_history | idx_rfm_history_contact | btree | contact_id | não | sim |  |
| public.rfm_history | idx_rfm_history_user_id | btree | user_id | não | sim |  |
| public.rfm_history | rfm_history_pkey | btree | id | sim | sim |  |
| public.rfm_metrics | rfm_metrics_pkey | btree | id | sim | sim |  |
| public.rfm_metrics | rfm_metrics_user_id_period_start_period_end_period_type_key | btree | user_id, period_start, period_end, period_type | sim | sim |  |
| public.rfm_segment_config | rfm_segment_config_pkey | btree | id | sim | sim |  |
| public.rfm_segment_config | rfm_segment_config_segment_code_key | btree | segment_code | sim | sim |  |
| public.rfm_segment_config | rfm_segment_config_user_id_segment_key_key | btree | user_id, segment_key | sim | sim |  |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_onda_customer_id_key | btree | onda, customer_id | sim | sim |  |
| public.rodizio_distribuicao_staging | rodizio_distribuicao_staging_pkey | btree | id | sim | sim |  |
| public.rodizio_execucoes | rodizio_execucoes_pkey | btree | id | sim | sim |  |
| public.role_permissions | idx_role_permissions_permission_id | btree | permission_id | não | sim |  |
| public.role_permissions | role_permissions_pkey | btree | id | sim | sim |  |
| public.role_permissions | role_permissions_role_permission_id_key | btree | role, permission_id | sim | sim |  |
| public.rpc_perf_samples | rpc_perf_samples_name_time_idx | btree | rpc_name, created_at | não | sim |  |
| public.rpc_perf_samples | rpc_perf_samples_pkey | btree | id | sim | sim |  |
| public.rpc_plan_snapshots | idx_rpc_plan_snapshots_changed | btree | rpc_name, captured_at | não | sim | `plan_changed` |
| public.rpc_plan_snapshots | idx_rpc_plan_snapshots_name_time | btree | rpc_name, captured_at | não | sim |  |
| public.rpc_plan_snapshots | rpc_plan_snapshots_pkey | btree | id | sim | sim |  |
| public.sales | idx_sales_created | btree | created_at | não | sim |  |
| public.sales | idx_sales_deleted_by | btree | deleted_by | não | sim |  |
| public.sales | idx_sales_salesperson_id | btree | salesperson_id | não | sim |  |
| public.sales | sales_pkey | btree | id | sim | sim |  |
| public.sales_activities | idx_sales_activities_deleted_by | btree | deleted_by | não | sim |  |
| public.sales_activities | idx_sales_activities_sale_id | btree | sale_id | não | sim |  |
| public.sales_activities | idx_sales_activities_salesperson_id | btree | salesperson_id | não | sim |  |
| public.sales_activities | sales_activities_pkey | btree | id | sim | sim |  |
| public.sales_cadences | idx_sales_cadences_created_by | btree | created_by | não | sim |  |
| public.sales_cadences | sales_cadences_pkey | btree | id | sim | sim |  |
| public.sales_forecasts | idx_sales_forecasts_user_id | btree | user_id | não | sim |  |
| public.sales_forecasts | sales_forecasts_forecast_month_user_id_forecast_type_key | btree | forecast_month, user_id, forecast_type | sim | sim |  |
| public.sales_forecasts | sales_forecasts_pkey | btree | id | sim | sim |  |
| public.sales_goals | idx_sales_goals_user_id | btree | user_id | não | sim |  |
| public.sales_goals | sales_goals_pkey | btree | id | sim | sim |  |
| public.sales_opportunities | idx_opportunities_company | btree | company_id | não | sim |  |
| public.sales_opportunities | idx_sales_opportunities_assigned_to | btree | assigned_to | não | sim |  |
| public.sales_opportunities | idx_sales_opportunities_identified_by | btree | identified_by | não | sim |  |
| public.sales_opportunities | sales_opportunities_pkey | btree | id | sim | sim |  |
| public.sales_playbooks | sales_playbooks_pkey | btree | id | sim | sim |  |
| public.sales_scripts | sales_scripts_pkey | btree | id | sim | sim |  |
| public.sales_scripts | sales_scripts_script_code_key | btree | script_code | sim | sim |  |
| public.sales_tasks | idx_sales_tasks_client_id | btree | client_id | não | sim |  |
| public.sales_tasks | idx_sales_tasks_deleted_by | btree | deleted_by | não | sim |  |
| public.sales_tasks | idx_sales_tasks_sale_id | btree | sale_id | não | sim |  |
| public.sales_tasks | idx_sales_tasks_sp | btree | salesperson_id | não | sim |  |
| public.sales_tasks | sales_tasks_pkey | btree | id | sim | sim |  |
| public.sales_team_members | idx_sales_team_user | btree | user_id | não | sim |  |
| public.sales_team_members | sales_team_members_pkey | btree | id | sim | sim |  |
| public.sales_team_members | unique_member_per_user | btree | user_id, member_user_id | sim | sim |  |
| public.salespeople | salespeople_auth_user_id_key | btree | auth_user_id | sim | sim |  |
| public.salespeople | salespeople_email_key | btree | email | sim | sim |  |
| public.salespeople | salespeople_pkey | btree | id | sim | sim |  |
| public.scheduled_reports | idx_scheduled_reports_created_by | btree | created_by | não | sim |  |
| public.scheduled_reports | scheduled_reports_pkey | btree | id | sim | sim |  |
| public.scheduled_visits | idx_scheduled_visits_company_id | btree | company_id | não | sim |  |
| public.scheduled_visits | idx_scheduled_visits_user_id | btree | user_id | não | sim |  |
| public.scheduled_visits | idx_visits_user_date | btree | user_id, visit_date | não | sim |  |
| public.scheduled_visits | scheduled_visits_pkey | btree | id | sim | sim |  |
| public.schema_drift_alerts | idx_schema_drift_alerts_user_id | btree | user_id | não | sim |  |
| public.schema_drift_alerts | schema_drift_alerts_pkey | btree | id | sim | sim |  |
| public.score_history | idx_score_history_user_id | btree | user_id | não | sim |  |
| public.score_history | score_history_pkey | btree | id | sim | sim |  |
| public.script_sections | idx_script_sections_script_id | btree | script_id | não | sim |  |
| public.script_sections | script_sections_pkey | btree | id | sim | sim |  |
| public.sdr_alert_history | sdr_alert_history_pkey | btree | id | sim | sim |  |
| public.sdr_closer_assignments | idx_sdr_closer_assignments_criado_por_id | btree | criado_por_id | não | sim |  |
| public.sdr_closer_assignments | idx_sdr_closer_closer | btree | closer_id | não | sim |  |
| public.sdr_closer_assignments | idx_sdr_closer_sdr | btree | sdr_id | não | sim |  |
| public.sdr_closer_assignments | sdr_closer_assignments_pkey | btree | id | sim | sim |  |
| public.search_products_cache | idx_search_products_cache_user_id | btree | user_id | não | sim |  |
| public.search_products_cache | idx_search_products_name_trgm | gin | name | não | sim |  |
| public.search_products_cache | idx_search_products_user | btree | user_id | não | sim |  |
| public.search_products_cache | search_products_cache_pkey | btree | id | sim | sim |  |
| public.search_products_cache | unique_query_cache | btree | query_hash, source | sim | sim |  |
| public.secret_rotation_log | idx_secret_rotation_name | btree | secret_name, rotated_at | não | sim |  |
| public.secret_rotation_log | secret_rotation_log_pkey | btree | id | sim | sim |  |
| public.seller_daily_metrics | idx_seller_daily_metrics_user_id | btree | user_id | não | sim |  |
| public.seller_daily_metrics | seller_daily_metrics_pkey | btree | id | sim | sim |  |
| public.seller_daily_metrics | seller_daily_metrics_user_id_metric_date_key | btree | user_id, metric_date | sim | sim |  |
| public.semantic_search_cache | idx_semantic_cache_lookup | btree | user_id, query_hash, expires_at | não | sim |  |
| public.semantic_search_cache | semantic_search_cache_pkey | btree | id | sim | sim |  |
| public.semantic_search_cache | semantic_search_cache_user_id_query_hash_key | btree | user_id, query_hash | sim | sim |  |
| public.semantic_search_cache | unique_semantic_cache | btree | query_embedding_hash, entity_type | sim | sim |  |
| public.sentiment_annotations | idx_sentiment_annotations_contact_week | btree | contact_id, week_start | não | sim |  |
| public.sentiment_annotations | sentiment_annotations_pkey | btree | id | sim | sim |  |
| public.sequence_email_reservations | sequence_email_reservations_enrollment_id_key | btree | enrollment_id | sim | sim |  |
| public.sequence_email_reservations | sequence_email_reservations_pkey | btree | contact_id | sim | sim |  |
| public.sequence_email_reservations | sequence_email_reservations_token_key | btree | token | sim | sim |  |
| public.sequence_enrollments | idx_sequence_enrollments_contact_active | btree | contact_id, user_id, status | não | sim | `(status = 'active'::text)` |
| public.sequence_enrollments | idx_sequence_enrollments_user_id | btree | user_id | não | sim |  |
| public.sequence_enrollments | sequence_enrollments_pkey | btree | id | sim | sim |  |
| public.sequence_enrollments | unique_enrollment | btree | sequence_id, contact_id | sim | sim |  |
| public.sequence_events | idx_seq_events_contact | btree | contact_id, event_type | não | sim |  |
| public.sequence_events | idx_seq_events_enrollment | btree | enrollment_id, created_at | não | sim |  |
| public.sequence_events | idx_seq_events_user | btree | user_id, created_at | não | sim |  |
| public.sequence_events | sequence_events_pkey | btree | id | sim | sim |  |
| public.sequence_send_log | idx_seq_send_log_enrollment | btree | enrollment_id | não | sim |  |
| public.sequence_send_log | idx_seq_send_log_token | btree | tracking_token | não | sim |  |
| public.sequence_send_log | idx_seq_send_log_user | btree | user_id, sent_at | não | sim |  |
| public.sequence_send_log | sequence_send_log_pkey | btree | id | sim | sim |  |
| public.sequence_send_log | sequence_send_log_tracking_token_key | btree | tracking_token | sim | sim |  |
| public.sequence_steps | idx_sequence_steps_user_id | btree | user_id | não | sim |  |
| public.sequence_steps | sequence_steps_pkey | btree | id | sim | sim |  |
| public.sequence_steps | sequence_steps_sequence_id_step_order_key | btree | sequence_id, step_order | sim | sim |  |
| public.sequence_steps | unique_step_per_sequence | btree | sequence_id, step_number | sim | sim |  |
| public.sequences | idx_sequences_user_id | btree | user_id | não | sim |  |
| public.sequences | sequences_pkey | btree | id | sim | sim |  |
| public.sla_rules | sla_rules_pkey | btree | id | sim | sim |  |
| public.sla_violations | idx_sla_violations_sla_rule_id | btree | sla_rule_id | não | sim |  |
| public.sla_violations | idx_sla_violations_user_id | btree | user_id | não | sim |  |
| public.sla_violations | sla_violations_pkey | btree | id | sim | sim |  |
| public.sleight_of_mouth_examples | idx_sleight_of_mouth_examples_pattern_id | btree | pattern_id | não | sim |  |
| public.sleight_of_mouth_examples | sleight_of_mouth_examples_pkey | btree | id | sim | sim |  |
| public.sleight_of_mouth_patterns | sleight_of_mouth_patterns_pattern_code_key | btree | pattern_code | sim | sim |  |
| public.sleight_of_mouth_patterns | sleight_of_mouth_patterns_pkey | btree | id | sim | sim |  |
| public.sm_upload_mapping | sm_upload_mapping_pkey | btree | request_id | sim | sim |  |
| public.smart_notifications | idx_smart_notif_bundle | btree | user_id, bundle_key, created_at | não | sim | `(bundle_key IS NOT NULL)` |
| public.smart_notifications | idx_smart_notif_urgency | btree | user_id, urgency, status | não | sim |  |
| public.smart_notifications | idx_smart_notif_user_status | btree | user_id, status, scheduled_for | não | sim |  |
| public.smart_notifications | smart_notifications_pkey | btree | id | sim | sim |  |
| public.smart_segments | idx_smart_segments_created_by | btree | created_by | não | sim |  |
| public.smart_segments | smart_segments_pkey | btree | id | sim | sim |  |
| public.sms_campaign_recipients | idx_sms_campaign_recipients_user_id | btree | user_id | não | sim |  |
| public.sms_campaign_recipients | idx_sms_recipients_campaign | btree | campaign_id, status | não | sim |  |
| public.sms_campaign_recipients | sms_campaign_recipients_campaign_id_contact_id_key | btree | campaign_id, contact_id | sim | sim |  |
| public.sms_campaign_recipients | sms_campaign_recipients_pkey | btree | id | sim | sim |  |
| public.sms_campaign_recipients | uq_sms_campaign_recipients_campaign_phone | btree | campaign_id, phone_number | sim | sim |  |
| public.sms_campaigns | idx_sms_campaigns_user_id | btree | user_id | não | sim |  |
| public.sms_campaigns | idx_sms_campaigns_user_status | btree | user_id, status, created_at | não | sim |  |
| public.sms_campaigns | sms_campaigns_pkey | btree | id | sim | sim |  |
| public.sms_opt_outs | idx_sms_opt_outs_user_phone | btree | user_id, phone | não | sim |  |
| public.sms_opt_outs | sms_opt_outs_pkey | btree | id | sim | sim |  |
| public.sms_opt_outs | unique_opt_out | btree | user_id, phone_number | sim | sim |  |
| public.sms_templates | idx_sms_templates_user | btree | user_id, created_at | não | sim |  |
| public.sms_templates | idx_sms_templates_user_id | btree | user_id | não | sim |  |
| public.sms_templates | sms_templates_pkey | btree | id | sim | sim |  |
| public.social_behavior_analysis | idx_social_behavior_analysis_contact | btree | contact_id | não | sim |  |
| public.social_behavior_analysis | idx_social_behavior_analysis_user_id | btree | user_id | não | sim |  |
| public.social_behavior_analysis | social_behavior_analysis_pkey | btree | id | sim | sim |  |
| public.social_consent_audit | idx_consent_audit_contact | btree | contact_id | não | sim |  |
| public.social_consent_audit | social_consent_audit_pkey | btree | id | sim | sim |  |
| public.social_life_events | idx_social_life_events_contact | btree | contact_id | não | sim |  |
| public.social_life_events | idx_social_life_events_date | btree | event_date | não | sim |  |
| public.social_life_events | idx_social_life_events_type | btree | event_type | não | sim |  |
| public.social_life_events | idx_social_life_events_user_id | btree | user_id | não | sim |  |
| public.social_life_events | social_life_events_pkey | btree | id | sim | sim |  |
| public.social_profiles | idx_social_profiles_contact | btree | contact_id | não | sim |  |
| public.social_profiles | idx_social_profiles_platform | btree | platform | não | sim |  |
| public.social_profiles | idx_social_profiles_user_id | btree | user_id | não | sim |  |
| public.social_profiles | social_profiles_pkey | btree | id | sim | sim |  |
| public.social_profiles | uq_social_profiles_contact_platform | btree | contact_id, platform | sim | sim |  |
| public.social_scraping_schedule | idx_social_scraping_schedule_next | btree | next_run_at | não | sim | `(enabled = true)` |
| public.social_scraping_schedule | idx_social_scraping_schedule_user_id | btree | user_id | não | sim |  |
| public.social_scraping_schedule | social_scraping_schedule_contact_id_platform_key | btree | contact_id, platform | sim | sim |  |
| public.social_scraping_schedule | social_scraping_schedule_pkey | btree | id | sim | sim |  |
| public.social_sync_queue | idx_social_sync_queue_status | btree | status | não | sim |  |
| public.social_sync_queue | social_sync_queue_pkey | btree | id | sim | sim |  |
| public.staging_portal_sicoob | idx_staging_portal_chave | btree | numero_cooperativa, num_pac | não | sim |  |
| public.staging_portal_sicoob | staging_portal_sicoob_pkey | btree | id | sim | sim |  |
| public.stakeholder_alerts | idx_stakeholder_alerts_dismissed | btree | user_id, dismissed | não | sim |  |
| public.stakeholder_alerts | idx_stakeholder_alerts_user_contact | btree | user_id, contact_id | não | sim |  |
| public.stakeholder_alerts | idx_stakeholder_alerts_user_id | btree | user_id | não | sim |  |
| public.stakeholder_alerts | stakeholder_alerts_pkey | btree | id | sim | sim |  |
| public.suggested_life_events | idx_suggested_life_events_contact_id | btree | contact_id | não | sim |  |
| public.suggested_life_events | idx_suggested_life_events_status | btree | status | não | sim |  |
| public.suggested_life_events | suggested_life_events_pkey | btree | id | sim | sim |  |
| public.suggested_rapport_intel | idx_suggested_rapport_contact | btree | contact_id, status | não | sim |  |
| public.suggested_rapport_intel | suggested_rapport_intel_pkey | btree | id | sim | sim |  |
| public.supplier_evaluations | idx_supplier_evaluations_avaliador_id | btree | avaliador_id | não | sim |  |
| public.supplier_evaluations | idx_supplier_evaluations_data | btree | data_avaliacao | não | sim |  |
| public.supplier_evaluations | idx_supplier_evaluations_supplier_data | btree | supplier_id, data_avaliacao | não | sim |  |
| public.supplier_evaluations | idx_supplier_evaluations_supplier_id | btree | supplier_id | não | sim |  |
| public.supplier_evaluations | supplier_evaluations_pkey | btree | id | sim | sim |  |
| public.supplier_homologations | idx_supplier_homologations_avaliador_id | btree | avaliador_id | não | sim |  |
| public.supplier_homologations | idx_supplier_homologations_status | btree | status | não | sim |  |
| public.supplier_homologations | idx_supplier_homologations_supplier | btree | supplier_id | não | sim |  |
| public.supplier_homologations | idx_supplier_homologations_supplier_created | btree | supplier_id, created_at | não | sim |  |
| public.supplier_homologations | supplier_homologations_pkey | btree | id | sim | sim |  |
| public.supplier_qualification_config | supplier_qualification_config_pkey | btree | id | sim | sim |  |
| public.supplier_qualification_config | supplier_qualification_config_segment_code_key | btree | segment_code | sim | sim |  |
| public.supplier_score_history | idx_supplier_score_history_supplier | btree | supplier_id, measured_at | não | sim |  |
| public.supplier_score_history | idx_supplier_score_history_supplier_id | btree | supplier_id | não | sim |  |
| public.supplier_score_history | supplier_score_history_pkey | btree | id | sim | sim |  |
| public.supplier_scores | idx_supplier_scores_score_geral | btree | score_geral | não | sim |  |
| public.supplier_scores | idx_supplier_scores_segment_code | btree | segment_code | não | sim |  |
| public.supplier_scores | supplier_scores_pkey | btree | id | sim | sim |  |
| public.supplier_scores | supplier_scores_supplier_id_key | btree | supplier_id | sim | sim |  |
| public.suppliers | idx_suppliers_homologado | btree | homologado | não | sim |  |
| public.suppliers | idx_suppliers_homologado_score | btree | homologado, score_geral | não | sim |  |
| public.suppliers | idx_suppliers_score_geral | btree | score_geral | não | sim |  |
| public.suppliers | suppliers_company_id_key | btree | company_id | sim | sim |  |
| public.suppliers | suppliers_pkey | btree | id | sim | sim |  |
| public.support_tickets | idx_support_tickets_user_id | btree | user_id | não | sim |  |
| public.support_tickets | support_tickets_pkey | btree | id | sim | sim |  |
| public.sync_log | idx_sync_log_created | btree | created_at | não | sim |  |
| public.sync_log | idx_sync_log_status | btree | status | não | sim |  |
| public.sync_log | idx_sync_log_type | btree | sync_type, direction | não | sim |  |
| public.sync_log | sync_log_pkey | btree | id | sim | sim |  |
| public.system_alerts | idx_system_alerts_active_by_type | btree | alert_type, created_at | não | sim | `(acknowledged_at IS NULL)` |
| public.system_alerts | idx_system_alerts_real_unack | btree | alert_type, created_at | não | sim | `((is_simulated = false) AND (acknowledged_at IS NULL))` |
| public.system_alerts | idx_system_alerts_simulated | btree | created_at | não | sim | `(is_simulated = true)` |
| public.system_alerts | idx_system_alerts_type_created | btree | alert_type, created_at | não | sim |  |
| public.system_alerts | idx_system_alerts_unack | btree | created_at | não | sim | `(acknowledged_at IS NULL)` |
| public.system_alerts | system_alerts_pkey | btree | id | sim | sim |  |
| public.system_config | system_config_pkey | btree | key | sim | sim |  |
| public.system_health_snapshots | idx_health_snapshots_timestamp_desc | btree | timestamp | não | sim |  |
| public.system_health_snapshots | idx_system_health_snapshots_timestamp | btree | timestamp | não | sim |  |
| public.system_health_snapshots | system_health_snapshots_pkey | btree | id | sim | sim |  |
| public.tags | tags_nome_key | btree | nome | sim | sim |  |
| public.tags | tags_pkey | btree | id | sim | sim |  |
| public.tasks | idx_tasks_company | btree | company_id | não | sim |  |
| public.tasks | idx_tasks_contact_id_fk | btree | contact_id | não | sim |  |
| public.tasks | idx_tasks_deal_id | btree | deal_id | não | sim |  |
| public.tasks | idx_tasks_parent_task_id | btree | parent_task_id | não | sim |  |
| public.tasks | idx_tasks_pending | btree | user_id, due_date | não | sim | `(status = 'pending'::text)` |
| public.tasks | idx_tasks_status | btree | status | não | sim |  |
| public.tasks | idx_tasks_user_id | btree | user_id | não | sim |  |
| public.tasks | tasks_pkey | btree | id | sim | sim |  |
| public.territories | idx_territories_manager_id | btree | manager_id | não | sim |  |
| public.territories | territories_pkey | btree | id | sim | sim |  |
| public.territory_assignments | idx_territory_assignments_territory_id | btree | territory_id | não | sim |  |
| public.territory_assignments | idx_territory_assignments_user_id | btree | user_id | não | sim |  |
| public.territory_assignments | territory_assignments_pkey | btree | id | sim | sim |  |
| public.territory_assignments | territory_assignments_territory_id_user_id_key | btree | territory_id, user_id | sim | sim |  |
| public.ticket_comments | idx_ticket_comments_user_id | btree | user_id | não | sim |  |
| public.ticket_comments | ticket_comments_pkey | btree | id | sim | sim |  |
| public.trigger_ab_tests | idx_trigger_ab_tests_active | btree | is_active | não | sim | `(is_active = true)` |
| public.trigger_ab_tests | idx_trigger_ab_tests_disc | btree | disc_profile | não | sim |  |
| public.trigger_ab_tests | idx_trigger_ab_tests_user_contact | btree | user_id, contact_id | não | sim |  |
| public.trigger_ab_tests | idx_trigger_ab_tests_user_id | btree | user_id | não | sim |  |
| public.trigger_ab_tests | trigger_ab_tests_pkey | btree | id | sim | sim |  |
| public.trigger_bundles | idx_trigger_bundles_scenario | btree | scenario | não | sim |  |
| public.trigger_bundles | idx_trigger_bundles_system | btree | is_system_bundle | não | sim | `(is_system_bundle = true)` |
| public.trigger_bundles | idx_trigger_bundles_user_id | btree | user_id | não | sim |  |
| public.trigger_bundles | trigger_bundles_code_key | btree | code | sim | sim |  |
| public.trigger_bundles | trigger_bundles_pkey | btree | id | sim | sim |  |
| public.trigger_channel_effectiveness | idx_trigger_channel_effectiveness_trigger_channel | btree | trigger_type, channel | não | sim |  |
| public.trigger_channel_effectiveness | idx_trigger_channel_effectiveness_user_contact | btree | user_id, contact_id | não | sim |  |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_pkey | btree | id | sim | sim |  |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_user_id_channel_trigger_type__key | btree | user_id, channel, trigger_type, period_start, period_end | sim | sim |  |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_user_id_contact_id_trigger_ty_key | btree | user_id, contact_id, trigger_type, channel | sim | sim |  |
| public.trigger_intensity_history | idx_trigger_intensity_history_trigger | btree | trigger_type | não | sim |  |
| public.trigger_intensity_history | idx_trigger_intensity_history_user_id | btree | user_id | não | sim |  |
| public.trigger_intensity_history | trigger_intensity_history_pkey | btree | id | sim | sim |  |
| public.trigger_types | trigger_types_code_key | btree | code | sim | sim |  |
| public.trigger_types | trigger_types_pkey | btree | id | sim | sim |  |
| public.trigger_usage_history | idx_trigger_usage_history_user_id | btree | user_id | não | sim |  |
| public.trigger_usage_history | trigger_usage_history_pkey | btree | id | sim | sim |  |
| public.uapi_sessions | idx_uapi_sessions_active | btree | provider, label | sim | sim | `(is_active = true)` |
| public.uapi_sessions | uapi_sessions_pkey | btree | id | sim | sim |  |
| public.user_badges | idx_user_badges_badge_id | btree | badge_id | não | sim |  |
| public.user_badges | idx_user_badges_user | btree | user_id | não | sim |  |
| public.user_badges | user_badges_pkey | btree | id | sim | sim |  |
| public.user_badges | user_badges_user_id_badge_id_key | btree | user_id, badge_id | sim | sim |  |
| public.user_goals | idx_user_goals_period | btree | period_start, period_end | não | sim |  |
| public.user_goals | idx_user_goals_user_id | btree | user_id | não | sim |  |
| public.user_goals | user_goals_pkey | btree | id | sim | sim |  |
| public.user_known_devices | unique_user_device | btree | user_id, device_fingerprint | sim | sim |  |
| public.user_known_devices | user_known_devices_pkey | btree | id | sim | sim |  |
| public.user_roles | user_roles_pkey | btree | id | sim | sim |  |
| public.user_roles | user_roles_user_id_role_key | btree | user_id, role | sim | sim |  |
| public.user_ui_preferences | user_ui_preferences_pkey | btree | id | sim | sim |  |
| public.user_ui_preferences | user_ui_preferences_user_id_scope_key | btree | user_id, scope | sim | sim |  |
| public.users | users_pkey | btree | id | sim | sim |  |
| public.vak_analysis_history | idx_vak_analysis_history_user_id | btree | user_id | não | sim |  |
| public.vak_analysis_history | idx_vak_kinesthetic_score | btree | kinesthetic_score | não | sim |  |
| public.vak_analysis_history | idx_vak_visual_score | btree | visual_score | não | sim |  |
| public.vak_analysis_history | vak_analysis_history_pkey | btree | id | sim | sim |  |
| public.vak_keywords | vak_keywords_pkey | btree | id | sim | sim |  |
| public.validation_queue | idx_validation_queue_contact | btree | contact_id | não | sim |  |
| public.validation_queue | idx_validation_queue_status_created | btree | status, created_at | não | sim |  |
| public.validation_queue | idx_validation_queue_user | btree | user_id | não | sim |  |
| public.validation_queue | validation_queue_pkey | btree | id | sim | sim |  |
| public.visit_checkins | idx_visit_checkins_user_id | btree | user_id | não | sim |  |
| public.visit_checkins | visit_checkins_pkey | btree | id | sim | sim |  |
| public.webauthn_credentials | idx_webauthn_credentials_user_id | btree | user_id | não | sim |  |
| public.webauthn_credentials | webauthn_credentials_credential_id_key | btree | credential_id | sim | sim |  |
| public.webauthn_credentials | webauthn_credentials_pkey | btree | id | sim | sim |  |
| public.webhook_logs | idx_webhook_logs_webhook_id | btree | webhook_id | não | sim |  |
| public.webhook_logs | webhook_logs_pkey | btree | id | sim | sim |  |
| public.webhooks | idx_webhooks_created_by | btree | created_by | não | sim |  |
| public.webhooks | webhooks_pkey | btree | id | sim | sim |  |
| public.weekly_challenges | weekly_challenges_pkey | btree | id | sim | sim |  |
| public.weekly_report_settings | weekly_report_settings_pkey | btree | id | sim | sim |  |
| public.weekly_report_settings | weekly_report_settings_user_id_key | btree | user_id | sim | sim |  |
| public.weekly_reports | idx_weekly_reports_user_id | btree | user_id | não | sim |  |
| public.weekly_reports | weekly_reports_pkey | btree | id | sim | sim |  |
| public.whatsapp_ingestion_logs | whatsapp_ingestion_logs_pkey | btree | id | sim | sim |  |
| public.whatsapp_instances | idx_whatsapp_instances_user | btree | user_id | não | sim |  |
| public.whatsapp_instances | whatsapp_instances_pkey | btree | id | sim | sim |  |
| public.whatsapp_instances | whatsapp_instances_user_id_instance_name_key | btree | user_id, instance_name | sim | sim |  |
| public.whatsapp_kpis | idx_whatsapp_kpis_user_id | btree | user_id | não | sim |  |
| public.whatsapp_kpis | whatsapp_kpis_pkey | btree | id | sim | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_company_id | btree | company_id | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_contact_id | btree | contact_id | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_instance | btree | instance_name | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_msg_id | btree | message_id | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_remote_jid | btree | remote_jid | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_timestamp | btree | timestamp | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_user_company_ts | btree | user_id, company_id, timestamp | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_user_contact | btree | user_id, contact_id | não | sim |  |
| public.whatsapp_messages | idx_whatsapp_messages_user_id | btree | user_id | não | sim |  |
| public.whatsapp_messages | whatsapp_messages_pkey | btree | id | sim | sim |  |
| public.whatsapp_messages_index | whatsapp_messages_index_message_sid_key | btree | message_sid | sim | sim |  |
| public.whatsapp_messages_index | whatsapp_messages_index_pkey | btree | id | sim | sim |  |
| public.whatsapp_transcriptions | whatsapp_transcriptions_pkey | btree | id | sim | sim |  |
| public.win_loss_insights | idx_win_loss_insights_user_generated | btree | user_id, generated_at | não | sim |  |
| public.win_loss_insights | win_loss_insights_pkey | btree | id | sim | sim |  |
| public.win_loss_reasons | idx_win_loss_reasons_user | btree | user_id, active | não | sim |  |
| public.win_loss_reasons | win_loss_reasons_pkey | btree | id | sim | sim |  |
| public.win_loss_reasons | win_loss_reasons_user_id_category_label_key | btree | user_id, category, label | sim | sim |  |
| public.win_loss_records | idx_win_loss_records_competitor | btree | competitor_id | não | sim |  |
| public.win_loss_records | idx_win_loss_records_primary_reason | btree | primary_reason_id | não | sim |  |
| public.win_loss_records | idx_win_loss_records_user_outcome | btree | user_id, outcome, recorded_at | não | sim |  |
| public.win_loss_records | win_loss_records_pkey | btree | id | sim | sim |  |
| public.win_loss_records | win_loss_records_user_id_deal_id_key | btree | user_id, deal_id | sim | sim |  |
| public.workspace_accounts | workspace_accounts_email_key | btree | email | sim | sim |  |
| public.workspace_accounts | workspace_accounts_google_id_key | btree | google_id | sim | sim |  |
| public.workspace_accounts | workspace_accounts_pkey | btree | id | sim | sim |  |
| public.xbz_upload_mapping | xbz_upload_mapping_pkey | btree | id | sim | sim |  |
| reporting.mv_daily_kpis | idx_mv_daily_kpis_date | btree | snapshot_date | sim | sim |  |
| reporting.mv_daily_stats | idx_mv_daily_stats_date | btree | stats_date | sim | sim |  |
| singu_migration._checklist | _checklist_pkey | btree | id | sim | sim |  |
| singu_migration._errors | _errors_pkey | btree | id | sim | sim |  |
| singu_migration._source_schema | _source_schema_pkey | btree | table_name | sim | sim |  |
| zapp_history.admin_grants | admin_grants_pkey | btree | user_id | sim | sim |  |
| zapp_history.ai_cost_log | ai_cost_log_pkey | btree | id | sim | sim |  |
| zapp_history.ai_cost_log | idx_acl_occurred | btree | occurred_at | não | sim |  |
| zapp_history.ai_cost_log | idx_ai_cost_contact | btree | contact_id | não | sim |  |
| zapp_history.ai_training_dataset | ai_training_dataset_pkey | btree | id | sim | sim |  |
| zapp_history.ai_training_dataset | idx_ai_training_contact | btree | contact_id | não | sim |  |
| zapp_history.ai_training_dataset | idx_ai_training_conv | btree | conversation_id | não | sim |  |
| zapp_history.async_request_log | async_request_log_pkey | btree | id | sim | sim |  |
| zapp_history.async_request_log | idx_arl_entity | btree | entity_type, entity_id | não | sim |  |
| zapp_history.async_request_log | idx_arl_kind_time | btree | request_kind, triggered_at | não | sim |  |
| zapp_history.contact_message_stats | idx_cms_contact_id | btree | contact_id | sim | sim |  |
| zapp_history.conversation_daily_summaries | conversation_daily_summaries_pkey | btree | id | sim | sim |  |
| zapp_history.conversation_daily_summaries | idx_cds_contact_date | btree | contact_id, summary_date | não | sim |  |
| zapp_history.conversation_daily_summaries | idx_cds_date | btree | summary_date | não | sim |  |
| zapp_history.conversation_daily_summaries | idx_cds_embedding | ivfflat | embedding | não | sim |  |
| zapp_history.conversation_daily_summaries | idx_cds_embedding_1024 | ivfflat | embedding_1024 | não | sim | `(embedding_1024 IS NOT NULL)` |
| zapp_history.conversation_daily_summaries | idx_cds_pending_sync | btree | created_at | não | sim | `(synced_to_interactions = false)` |
| zapp_history.conversation_daily_summaries | idx_daily_summaries_company | btree | company_id | não | sim |  |
| zapp_history.conversation_daily_summaries | idx_daily_summaries_conv | btree | conversation_id | não | sim |  |
| zapp_history.conversation_daily_summaries | idx_daily_summaries_interaction | btree | interaction_id | não | sim |  |
| zapp_history.conversation_daily_summaries | unique_contact_day | btree | contact_id, summary_date | sim | sim |  |
| zapp_history.conversations | conversations_pkey | btree | id | sim | sim |  |
| zapp_history.conversations | idx_conv_wpp_conn | btree | whatsapp_connection_id | não | sim |  |
| zapp_history.conversations | idx_conversations_company | btree | company_id, last_message_at | não | sim |  |
| zapp_history.conversations | idx_conversations_contact | btree | contact_id, last_message_at | não | sim |  |
| zapp_history.conversations | idx_conversations_remote_jid | btree | remote_jid | não | sim |  |
| zapp_history.conversations | idx_conversations_status | btree | status, last_message_at | não | sim |  |
| zapp_history.conversations | unique_contact_connection | btree | contact_id, whatsapp_connection_id, remote_jid | sim | sim |  |
| zapp_history.disc_playbook | disc_playbook_pkey | btree | profile | sim | sim |  |
| zapp_history.edge_function_templates | edge_function_templates_pkey | btree | slug | sim | sim |  |
| zapp_history.location_dictionary | location_dictionary_city_state_key | btree | city, state | sim | sim |  |
| zapp_history.location_dictionary | location_dictionary_pkey | btree | id | sim | sim |  |
| zapp_history.message_audio | idx_audio_conv | btree | conversation_id | não | sim |  |
| zapp_history.message_audio | idx_ma_contact_created | btree | contact_id, created_at | não | sim |  |
| zapp_history.message_audio | idx_ma_embedding | ivfflat | embedding | não | sim |  |
| zapp_history.message_audio | idx_ma_embedding_1024 | ivfflat | embedding_1024 | não | sim | `(embedding_1024 IS NOT NULL)` |
| zapp_history.message_audio | idx_ma_pending_transcription | btree | created_at | não | sim | `((transcription_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (transcription_attempts < 5))` |
| zapp_history.message_audio | message_audio_message_id_key | btree | message_id | sim | sim |  |
| zapp_history.message_audio | message_audio_pkey | btree | id | sim | sim |  |
| zapp_history.message_embeddings | idx_me_contact | btree | contact_id | não | sim |  |
| zapp_history.message_embeddings | idx_me_vector | ivfflat | embedding | não | sim |  |
| zapp_history.message_embeddings | idx_me_vector_1024 | ivfflat | embedding_1024 | não | sim | `(embedding_1024 IS NOT NULL)` |
| zapp_history.message_embeddings | message_embeddings_pkey | btree | message_id | sim | sim |  |
| zapp_history.message_links | idx_ml_contact | btree | contact_id, created_at | não | sim |  |
| zapp_history.message_links | idx_ml_conversation | btree | conversation_id | não | sim |  |
| zapp_history.message_links | idx_ml_domain | btree | domain | não | sim |  |
| zapp_history.message_links | idx_ml_message | btree | message_id | não | sim |  |
| zapp_history.message_links | idx_ml_pending | btree | created_at | não | sim | `((fetch_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (fetch_attempts < 3))` |
| zapp_history.message_links | message_links_pkey | btree | id | sim | sim |  |
| zapp_history.message_media | idx_media_conv | btree | conversation_id | não | sim |  |
| zapp_history.message_media | idx_mm_contact_created | btree | contact_id, created_at | não | sim |  |
| zapp_history.message_media | idx_mm_message | btree | message_id | não | sim |  |
| zapp_history.message_media | idx_mm_pending_download | btree | created_at | não | sim | `((download_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (download_attempts < 5))` |
| zapp_history.message_media | idx_mm_type | btree | media_type, created_at | não | sim |  |
| zapp_history.message_media | message_media_pkey | btree | id | sim | sim |  |
| zapp_history.messages | idx_messages_auth | btree |  | não | sim | `(decision_authority IS NOT NULL)` |
| zapp_history.messages | idx_messages_bant | btree |  | não | sim | `(bant_score IS NOT NULL)` |
| zapp_history.messages | idx_messages_budget | btree | budget_detected | não | sim | `(budget_detected IS NOT NULL)` |
| zapp_history.messages | idx_messages_budget_sens | btree |  | não | sim | `(budget_sensitivity IS NOT NULL)` |
| zapp_history.messages | idx_messages_business_hours | btree | in_business_hours | não | sim |  |
| zapp_history.messages | idx_messages_buying_triggers | gin | buying_triggers | não | sim | `((buying_triggers IS NOT NULL) AND (array_length(buying_triggers, 1) > 0))` |
| zapp_history.messages | idx_messages_churn_risk | btree |  | não | sim | `((churn_risk IS NOT NULL) AND ((churn_risk ->> 'risk'::text) <> 'none'::text))` |
| zapp_history.messages | idx_messages_company_id | btree | company_id | não | sim |  |
| zapp_history.messages | idx_messages_company_size | btree |  | não | sim | `(company_size IS NOT NULL)` |
| zapp_history.messages | idx_messages_competitor | btree |  | não | sim | `(competitor_mention IS NOT NULL)` |
| zapp_history.messages | idx_messages_complexity | btree |  | não | sim | `(order_complexity IS NOT NULL)` |
| zapp_history.messages | idx_messages_contact_created | btree | contact_id, created_at | não | sim |  |
| zapp_history.messages | idx_messages_contact_info_gin | gin | contact_info_extracted | não | sim | `(contact_info_extracted IS NOT NULL)` |
| zapp_history.messages | idx_messages_content_fts | gin |  | não | sim |  |
| zapp_history.messages | idx_messages_conversation | btree | conversation_id, created_at | não | sim |  |
| zapp_history.messages | idx_messages_credibility | btree |  | não | sim | `(credibility IS NOT NULL)` |
| zapp_history.messages | idx_messages_customization | gin | customization_extracted | não | sim | `(customization_extracted IS NOT NULL)` |
| zapp_history.messages | idx_messages_delivery | btree |  | não | sim | `(delivery_preference IS NOT NULL)` |
| zapp_history.messages | idx_messages_direction | btree | direction, created_at | não | sim |  |
| zapp_history.messages | idx_messages_disc | btree |  | não | sim | `(disc_profile IS NOT NULL)` |
| zapp_history.messages | idx_messages_emotion | btree |  | não | sim | `(emotional_state IS NOT NULL)` |
| zapp_history.messages | idx_messages_event_type | btree | event_type | não | sim | `(event_type IS NOT NULL)` |
| zapp_history.messages | idx_messages_funnel_stage | btree | funnel_stage | não | sim | `(funnel_stage IS NOT NULL)` |
| zapp_history.messages | idx_messages_hesitation | btree |  | não | sim | `(hesitation IS NOT NULL)` |
| zapp_history.messages | idx_messages_intent | btree | primary_intent | não | sim | `(primary_intent IS NOT NULL)` |
| zapp_history.messages | idx_messages_journey | btree | journey_stage | não | sim | `(journey_stage IS NOT NULL)` |
| zapp_history.messages | idx_messages_lang | btree |  | não | sim | `(language_info IS NOT NULL)` |
| zapp_history.messages | idx_messages_lead_score | btree | lead_score | não | sim | `(lead_score IS NOT NULL)` |
| zapp_history.messages | idx_messages_location_gin | gin | location_extracted | não | sim | `(location_extracted IS NOT NULL)` |
| zapp_history.messages | idx_messages_nlp_entities | gin | nlp_entities | não | sim | `(nlp_entities IS NOT NULL)` |
| zapp_history.messages | idx_messages_nlp_order | gin | nlp_structured_order | não | sim | `(nlp_structured_order IS NOT NULL)` |
| zapp_history.messages | idx_messages_nlp_sentiment | btree | nlp_sentiment | não | sim | `(nlp_sentiment IS NOT NULL)` |
| zapp_history.messages | idx_messages_objections | gin | objections | não | sim | `((objections IS NOT NULL) AND (array_length(objections, 1) > 0))` |
| zapp_history.messages | idx_messages_pending_embedding | btree | created_at | não | sim | `((embedding_status = 'pending'::text) AND (content IS NOT NULL))` |
| zapp_history.messages | idx_messages_priority_quad | btree | priority_quadrant | não | sim | `(priority_quadrant IS NOT NULL)` |
| zapp_history.messages | idx_messages_question_type | btree |  | não | sim | `(question_analysis IS NOT NULL)` |
| zapp_history.messages | idx_messages_quoted_msg | btree | quoted_message_id | não | sim | `(quoted_message_id IS NOT NULL)` |
| zapp_history.messages | idx_messages_referral | btree |  | não | sim | `(referral_source IS NOT NULL)` |
| zapp_history.messages | idx_messages_rel_status | btree |  | não | sim | `(relationship_status IS NOT NULL)` |
| zapp_history.messages | idx_messages_speaker_role | btree | speaker_role | não | sim | `(speaker_role IS NOT NULL)` |
| zapp_history.messages | idx_messages_suggested_response | btree | suggested_response_at | não | sim | `(suggested_response_at IS NOT NULL)` |
| zapp_history.messages | idx_messages_tone | btree |  | não | sim | `(communication_tone IS NOT NULL)` |
| zapp_history.messages | idx_messages_topics | gin | topics | não | sim | `((topics IS NOT NULL) AND (array_length(topics, 1) > 0))` |
| zapp_history.messages | idx_messages_type | btree | message_type, created_at | não | sim |  |
| zapp_history.messages | idx_messages_unit | btree | unit_of_measure | não | sim | `(unit_of_measure IS NOT NULL)` |
| zapp_history.messages | idx_msg_bant_classification | btree |  | não | sim |  |
| zapp_history.messages | idx_msg_primary_intent | btree | primary_intent | não | sim | `(nlp_processed_at IS NOT NULL)` |
| zapp_history.messages | idx_msg_quarantined | btree | created_at | não | sim | `(quarantined = true)` |
| zapp_history.messages | idx_msg_sql_qualified_recent | btree | created_at | não | sim | `((lead_score >= 80) AND (quarantined = false))` |
| zapp_history.messages | idx_msg_unprocessed | btree | created_at | não | sim | `(nlp_processed_at IS NULL)` |
| zapp_history.messages | messages_pkey | btree | id | sim | sim |  |
| zapp_history.messages | messages_whatsapp_message_id_key | btree | whatsapp_message_id | sim | sim |  |
| zapp_history.phone_to_contact | idx_ptc_contact | btree | contact_id | não | sim |  |
| zapp_history.phone_to_contact | phone_to_contact_pkey | btree | phone_normalized | sim | sim |  |
| zapp_history.product_dictionary | idx_product_dict_patterns | gin | patterns | não | sim |  |
| zapp_history.product_dictionary | product_dictionary_canonical_name_key | btree | canonical_name | sim | sim |  |
| zapp_history.product_dictionary | product_dictionary_pkey | btree | id | sim | sim |  |
| zapp_history.runtime_config | runtime_config_pkey | btree | key | sim | sim |  |
| zapp_history.whatsapp_connections | whatsapp_connections_instance_name_key | btree | instance_name | sim | sim |  |
| zapp_history.whatsapp_connections | whatsapp_connections_pkey | btree | id | sim | sim |  |
