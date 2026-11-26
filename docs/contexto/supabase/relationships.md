# Relacionamentos (chaves estrangeiras)

> ⚠️ Seção `constraints` não pôde ser atualizada nesta coleta (ver errors.md); mostrando a versão anterior.


| de | colunas | para | colunas | on delete | on update |
|---|---|---|---|---|---|
| _dormant.access_denied_logs | user_id | auth.users | id | SET NULL | NO ACTION |
| _dormant.active_power_ups | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.active_sessions | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.activity_goals | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.alert_log | notification_id | _dormant.notifications | id | NO ACTION | NO ACTION |
| _dormant.alert_log | rule_id | public.alert_rules | id | SET NULL | NO ACTION |
| _dormant.alert_log | user_id | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.alertas_inativacao | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.alertas_inativacao | customer_id | public.customers | id | CASCADE | NO ACTION |
| _dormant.api_usage_log | user_id | public.profiles | id | SET NULL | NO ACTION |
| _dormant.automation_logs | rule_id | _dormant.automation_rules | id | CASCADE | NO ACTION |
| _dormant.available_spins | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.battle_participants | battle_id | _dormant.sales_battles | id | CASCADE | NO ACTION |
| _dormant.battle_participants | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.blocked_ips | blocked_by | auth.users | id | NO ACTION | NO ACTION |
| _dormant.cadence_steps | cadence_id | _dormant.cadences | id | CASCADE | NO ACTION |
| _dormant.cadence_tasks | cadence_step_id | _dormant.cadence_steps | id | CASCADE | NO ACTION |
| _dormant.cadence_tasks | prospect_cadence_id | _dormant.prospect_cadences | id | CASCADE | NO ACTION |
| _dormant.carrier_contacts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.challenge_progress | challenge_id | public.weekly_challenges | id | CASCADE | NO ACTION |
| _dormant.challenge_progress | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.chat_conversations | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.chat_messages | conversation_id | _dormant.chat_conversations | id | CASCADE | NO ACTION |
| _dormant.client_portfolio | assigned_by | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.client_portfolio | client_id | public.clients | id | CASCADE | NO ACTION |
| _dormant.client_portfolio | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.client_values | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.cognitive_bias_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.cognitive_bias_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.cognitive_biases | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.cognitive_biases | detected_in_interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| _dormant.cognitive_biases | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.communication_cadence | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.communication_cadence | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.communication_preferences | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.communication_preferences | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.company_tags | tag_id | public.tags | id | CASCADE | NO ACTION |
| _dormant.compatibility_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.competitive_chat_messages | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.contact_availability | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_availability | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.contact_cadence | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_compatibility | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_compatibility | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.contact_metaprograms | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_metaprograms | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.contact_preferences | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_relationships | contact_a_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_relationships | contact_b_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_relationships | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.contact_rfm_scores | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.contact_rfm_scores | segment_id | public.rfm_segment_config | id | NO ACTION | NO ACTION |
| _dormant.contact_rfm_scores | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.contact_tags | tag_id | public.tags | id | CASCADE | NO ACTION |
| _dormant.contact_time_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.custom_field_values | custom_field_id | _dormant.custom_fields | id | CASCADE | NO ACTION |
| _dormant.customer_contacts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.daily_challenge_progress | challenge_id | public.daily_challenges | id | CASCADE | NO ACTION |
| _dormant.daily_challenge_progress | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.daily_streak_achievements | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.dashboard_layouts | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.dashboard_widgets | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.deal_chat_history | deal_id | public.sales | id | CASCADE | NO ACTION |
| _dormant.deal_chat_history | salesperson_id | public.salespeople | id | SET NULL | NO ACTION |
| _dormant.deal_history | deal_id | _dormant.deals | id | CASCADE | NO ACTION |
| _dormant.deal_history | stage_anterior_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.deal_history | stage_novo_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.deal_outcomes | sale_id | public.sales | id | CASCADE | NO ACTION |
| _dormant.deal_outcomes | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.deal_products | deal_id | _dormant.deals | id | CASCADE | NO ACTION |
| _dormant.deal_products | product_id | _dormant.deal_products_catalog | id | NO ACTION | NO ACTION |
| _dormant.deal_stage_history | sale_id | public.sales | id | CASCADE | NO ACTION |
| _dormant.deals | company_id | public.companies | id | NO ACTION | NO ACTION |
| _dormant.deals | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| _dormant.deals | lead_id | public.leads | id | NO ACTION | NO ACTION |
| _dormant.deals | loss_reason_id | public.loss_reasons | id | NO ACTION | NO ACTION |
| _dormant.deals | pipeline_id | public.pipelines | id | NO ACTION | NO ACTION |
| _dormant.deals | source_id | public.lead_sources | id | NO ACTION | NO ACTION |
| _dormant.deals | stage_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.decision_criteria | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.decision_criteria | discovered_in_interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| _dormant.decision_criteria | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.demand_forecasts | product_id | _dormant.products | id | CASCADE | NO ACTION |
| _dormant.digital_signatures | created_by | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.disc_analysis_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.disc_analysis_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.disc_communication_logs | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.disc_communication_logs | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.disc_interaction_signals | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.disc_interaction_signals | interaction_id | public.interactions | id | CASCADE | NO ACTION |
| _dormant.disc_interaction_signals | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.document_signers | document_id | _dormant.digital_signatures | id | CASCADE | NO ACTION |
| _dormant.email_tracking_events | email_id | public.email_logs | id | CASCADE | NO ACTION |
| _dormant.emotional_anchors | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.emotional_anchors | discovered_in_interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| _dormant.emotional_anchors | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.emotional_states | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.emotional_states | interaction_id | public.interactions | id | CASCADE | NO ACTION |
| _dormant.emotional_states | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.emotional_states_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.emotional_states_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.entity_versions | changed_by | auth.users | id | NO ACTION | NO ACTION |
| _dormant.eq_analysis_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.eq_analysis_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.eq_pillar_details | eq_score_id | public.contact_eq_scores | id | CASCADE | NO ACTION |
| _dormant.feed_comments | feed_item_id | _dormant.victory_feed | id | CASCADE | NO ACTION |
| _dormant.feed_comments | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.feed_reactions | feed_item_id | _dormant.victory_feed | id | CASCADE | NO ACTION |
| _dormant.feed_reactions | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.health_alerts | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.health_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.health_alerts | resolved_by | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.health_alerts | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.hidden_objections | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.hidden_objections | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.icp_data | client_id | public.clients | id | CASCADE | NO ACTION |
| _dormant.inactivity_alerts | acknowledged_by | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.inactivity_alerts | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.inactivity_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.influence_network | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.influence_network | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.insights | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.insights | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.insights | interaction_id | public.interactions | id | CASCADE | NO ACTION |
| _dormant.insights | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.inventory_levels | product_id | _dormant.products | id | CASCADE | NO ACTION |
| _dormant.ip_whitelist | added_by | auth.users | id | NO ACTION | NO ACTION |
| _dormant.known_devices | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.kudos | from_salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.kudos | to_salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.lead_history | lead_id | public.leads | id | CASCADE | NO ACTION |
| _dormant.lead_history | stage_anterior_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.lead_history | stage_novo_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.lead_routing_log | client_id | public.clients | id | SET NULL | NO ACTION |
| _dormant.lead_routing_log | from_salesperson_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.lead_routing_log | to_salesperson_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.lead_scores | sale_id | public.sales | id | CASCADE | NO ACTION |
| _dormant.life_events | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.life_events | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.login_alerts | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.metaprogram_templates | created_by | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.mfa_verification_attempts | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.notifications | company_id | public.companies | id | SET NULL | NO ACTION |
| _dormant.notifications | contact_id | public.contacts | id | SET NULL | NO ACTION |
| _dormant.notifications | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.notifications | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.objection_templates | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.objections_library | created_by | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.offer_suggestions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.offer_suggestions | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.password_reset_requests | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.performance_bets | bettor_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.performance_bets | target_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.playbook_items | playbook_id | _dormant.playbooks | id | CASCADE | NO ACTION |
| _dormant.playbook_progress | completed_by | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.playbook_progress | playbook_item_id | _dormant.playbook_items | id | CASCADE | NO ACTION |
| _dormant.playbook_progress | sale_id | public.sales | id | CASCADE | NO ACTION |
| _dormant.price_alerts | product_id | _dormant.products | id | CASCADE | NO ACTION |
| _dormant.price_alerts | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| _dormant.price_history | product_id | _dormant.products | id | CASCADE | NO ACTION |
| _dormant.price_history | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| _dormant.price_history | supplier_product_id | _dormant.supplier_products | id | CASCADE | NO ACTION |
| _dormant.prize_wheel_spins | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.progressive_goals | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.prospect_cadences | cadence_id | _dormant.cadences | id | CASCADE | NO ACTION |
| _dormant.prospect_cadences | sale_id | public.sales | id | CASCADE | NO ACTION |
| _dormant.prospect_cadences | salesperson_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.purchase_history | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.purchase_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.purchase_history | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.push_subscriptions | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.quote_sync_logs | quote_id | _dormant.quotes | id | CASCADE | NO ACTION |
| _dormant.quotes | client_id | public.clients | id | SET NULL | NO ACTION |
| _dormant.quotes | salesperson_id | public.salespeople | id | SET NULL | NO ACTION |
| _dormant.rank_change_notifications | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.reauthentication_requests | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.rfm_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.rfm_calculations | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.rfm_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.rfm_history | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.sales_goals | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.sales_streaks | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.sales_territories | salesperson_id | public.salespeople | id | SET NULL | NO ACTION |
| _dormant.salesperson_badges | badge_id | _dormant.collectible_badges | id | CASCADE | NO ACTION |
| _dormant.salesperson_badges | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.salesperson_leagues | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.salesperson_leagues | season_id | _dormant.competitive_seasons | id | NO ACTION | NO ACTION |
| _dormant.salesperson_preferences | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.salesperson_xp | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.saved_filters | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.score_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.script_usage_log | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| _dormant.script_usage_log | script_id | public.sales_scripts | id | NO ACTION | NO ACTION |
| _dormant.script_usage_log | user_id | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.security_alert_history | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.security_alert_settings | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.sla_configs | pipeline_stage_id | public.pipeline_stages | id | CASCADE | NO ACTION |
| _dormant.sms_verification_codes | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.social_behavior_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.social_life_events | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.social_mentions | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.social_mentions | mentioned_contact_id | public.contacts | id | SET NULL | NO ACTION |
| _dormant.social_mentions | mentioner_contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.social_mentions | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.social_profiles | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.social_scraping_schedule | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.stakeholder_alerts | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.stakeholder_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.stock_movements | product_id | _dormant.products | id | CASCADE | NO ACTION |
| _dormant.supplier_contacts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.supplier_order_items | order_id | _dormant.supplier_orders | id | CASCADE | NO ACTION |
| _dormant.supplier_order_items | product_id | _dormant.products | id | SET NULL | NO ACTION |
| _dormant.supplier_orders | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| _dormant.supplier_products | product_id | _dormant.products | id | CASCADE | NO ACTION |
| _dormant.supplier_products | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| _dormant.supplier_risk_assessments | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| _dormant.tasks | company_id | public.companies | id | SET NULL | NO ACTION |
| _dormant.tasks | contact_id | public.contacts | id | SET NULL | NO ACTION |
| _dormant.tasks | deal_id | _dormant.deals | id | CASCADE | NO ACTION |
| _dormant.tasks | lead_id | public.leads | id | CASCADE | NO ACTION |
| _dormant.team_closers | closer_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.team_closers | team_id | _dormant.teams | id | CASCADE | NO ACTION |
| _dormant.teams | sdr_id | public.salespeople | id | SET NULL | NO ACTION |
| _dormant.template_performance | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| _dormant.template_performance | user_id | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.territory_history | from_salesperson_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.territory_history | territory_id | _dormant.sales_territories | id | CASCADE | NO ACTION |
| _dormant.territory_history | to_salesperson_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.time_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.time_analysis | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.tournament_matches | player1_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.tournament_matches | player2_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.tournament_matches | tournament_id | _dormant.tournaments | id | CASCADE | NO ACTION |
| _dormant.tournament_matches | winner_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.tournament_participants | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.tournament_participants | tournament_id | _dormant.tournaments | id | CASCADE | NO ACTION |
| _dormant.trigger_ab_tests | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.trigger_channel_effectiveness | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.trigger_intensity_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.trigger_intensity_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.trigger_suggestions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.trigger_suggestions | used_in_interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| _dormant.trigger_suggestions | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.user_companies_link | company_id | public.companies | id | CASCADE | NO ACTION |
| _dormant.user_companies_link | shared_by | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.user_companies_link | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.user_favorite_templates | user_id | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.user_mfa_settings | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.user_roles | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.vak_analysis_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| _dormant.vak_analysis_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| _dormant.vak_templates | created_by | public.profiles | id | NO ACTION | NO ACTION |
| _dormant.victory_feed | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.webauthn_challenges | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.webauthn_credentials | user_id | auth.users | id | CASCADE | NO ACTION |
| _dormant.weekly_matchups | player1_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.weekly_matchups | player2_id | public.salespeople | id | CASCADE | NO ACTION |
| _dormant.weekly_matchups | winner_id | public.salespeople | id | NO ACTION | NO ACTION |
| _dormant.weekly_reports | user_id | public.profiles | id | CASCADE | NO ACTION |
| _dormant.whatsapp_messages | contact_id | public.contacts | id | SET NULL | NO ACTION |
| _dormant.workflow_action_logs | action_id | _dormant.workflow_actions | id | NO ACTION | NO ACTION |
| _dormant.workflow_action_logs | execution_id | _dormant.workflow_executions | id | CASCADE | NO ACTION |
| _dormant.workflow_actions | workflow_id | _dormant.workflows | id | CASCADE | NO ACTION |
| _dormant.workflow_executions | deal_id | _dormant.deals | id | SET NULL | NO ACTION |
| _dormant.workflow_executions | lead_id | public.leads | id | SET NULL | NO ACTION |
| _dormant.workflow_executions | trigger_id | _dormant.workflow_triggers | id | NO ACTION | NO ACTION |
| _dormant.workflow_executions | workflow_id | _dormant.workflows | id | NO ACTION | NO ACTION |
| _dormant.workflow_triggers | stage_from_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.workflow_triggers | stage_to_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| _dormant.workflow_triggers | workflow_id | _dormant.workflows | id | CASCADE | NO ACTION |
| _dormant.workflows | pipeline_id | public.pipelines | id | NO ACTION | NO ACTION |
| _dormant.xp_history | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| public.achievements | salesperson_id | public.salespeople | id | CASCADE | NO ACTION |
| public.activities | company_id | public.companies | id | SET NULL | NO ACTION |
| public.activities | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.activities | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.activities | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.activity_feed | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.ai_recommendation_audit_logs_v2 | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.ai_recommendation_audit_logs_v2 | user_id | auth.users | id | CASCADE | NO ACTION |
| public.alerts | company_id | public.companies | id | CASCADE | NO ACTION |
| public.alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.alerts | interaction_id | public.interactions | id | CASCADE | NO ACTION |
| public.alerts | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.automation_executions | rule_id | public.automation_rules | id | NO ACTION | NO ACTION |
| public.automation_logs | automation_id | public.automations | id | NO ACTION | NO ACTION |
| public.automation_logs | rule_id | public.automation_rules | id | NO ACTION | NO ACTION |
| public.automations | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.behavioral_insight_feedback | user_id | auth.users | id | CASCADE | NO ACTION |
| public.behavioral_profile_regen_queue | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.brain_dominance_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.cadence_enrollments | cadence_id | public.sales_cadences | id | CASCADE | NO ACTION |
| public.cadence_enrollments | company_id | public.companies | id | CASCADE | NO ACTION |
| public.cadence_enrollments | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.cadence_enrollments | user_id | public.profiles | id | SET NULL | NO ACTION |
| public.calendar_events | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.calendar_events | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.calendar_events | deal_id | public.deals | id | NO ACTION | NO ACTION |
| public.call_logs | company_id | public.companies | id | SET NULL | NO ACTION |
| public.call_logs | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.call_logs | user_id | auth.users | id | CASCADE | NO ACTION |
| public.campaign_members | campaign_id | public.campaigns | id | CASCADE | NO ACTION |
| public.campaign_members | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.campaign_members | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.campaign_recipients | campaign_id | public.email_campaigns | id | CASCADE | NO ACTION |
| public.campaign_recipients | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.campaigns | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.carrier_evaluations | avaliador_id | public.users | id | NO ACTION | NO ACTION |
| public.carrier_evaluations | carrier_id | public.carriers | id | CASCADE | NO ACTION |
| public.carrier_homologations | avaliador_id | public.users | id | NO ACTION | NO ACTION |
| public.carrier_homologations | carrier_id | public.carriers | id | CASCADE | NO ACTION |
| public.carrier_score_history | carrier_id | public.carriers | id | CASCADE | NO ACTION |
| public.carrier_scores | carrier_id | public.carriers | id | CASCADE | NO ACTION |
| public.carrier_scores | segment_code | public.carrier_qualification_config | segment_code | NO ACTION | NO ACTION |
| public.carriers | company_id | public.companies | id | RESTRICT | NO ACTION |
| public.churn_predictions | company_id | public.companies | id | SET NULL | NO ACTION |
| public.churn_predictions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.churn_predictions | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.cidades | estado_ibge | public.estados | ibge_code | NO ACTION | NO ACTION |
| public.client_values | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.clients | deleted_by | auth.users | id | NO ACTION | NO ACTION |
| public.closing_moment_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.closing_moment_analysis | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.cognitive_bias_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.cognitive_bias_history | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.commissions | deal_id | public.deals | id | SET NULL | NO ACTION |
| public.commissions | rule_id | public.commission_rules | id | NO ACTION | NO ACTION |
| public.commissions | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.communication_preferences | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.companies | central_id | public.companies | id | NO ACTION | NO ACTION |
| public.companies | confederacao_id | public.companies | id | SET NULL | NO ACTION |
| public.companies | created_by_id | public.users | id | NO ACTION | NO ACTION |
| public.companies | grupo_economico_id | public.grupos_economicos | id | NO ACTION | NO ACTION |
| public.companies | matriz_id | public.companies | id | NO ACTION | NO ACTION |
| public.companies | singular_id | public.companies | id | NO ACTION | NO ACTION |
| public.company_addresses | cidade_ibge | public.cidades | ibge_code | NO ACTION | NO ACTION |
| public.company_addresses | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_cadences | cadence_id | public.sales_cadences | id | NO ACTION | NO ACTION |
| public.company_cadences | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.company_cadences | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.company_cnaes | cnae_codigo | public.cnaes | codigo | NO ACTION | NO ACTION |
| public.company_cnaes | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_emails | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_phones | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_rfm_scores | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_rfm_scores | segment_id | public.rfm_segment_config | id | NO ACTION | NO ACTION |
| public.company_rfm_scores | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.company_social_media | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_stakeholder_map | access_via_contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.company_stakeholder_map | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_stakeholder_map | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.company_stakeholder_map | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.company_territories | company_id | public.companies | id | CASCADE | NO ACTION |
| public.company_territories | territory_id | public.territories | id | CASCADE | NO ACTION |
| public.compatibility_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.competitive_losses | company_id | public.companies | id | CASCADE | NO ACTION |
| public.competitive_losses | competitor_id | public.competitors | id | SET NULL | NO ACTION |
| public.competitive_losses | deal_id | public.deals | id | CASCADE | NO ACTION |
| public.competitive_losses | reported_by | public.profiles | id | NO ACTION | NO ACTION |
| public.contact_addresses | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_addresses | created_by | public.users | id | NO ACTION | NO ACTION |
| public.contact_addresses | updated_by | public.users | id | NO ACTION | NO ACTION |
| public.contact_cadence | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_communication_style | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_communication_style | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.contact_decision_making | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_emails | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_eq_scores | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_eq_scores | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.contact_family_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_influence | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_metaprograms | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_next_actions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_notes | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_objection_scripts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_personality | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_phones | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_predictive_roadmap | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_preferences | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_relatives | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_social_media | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_time_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_trigger_preferences | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_trigger_preferences | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.contact_values | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.contact_values | discovered_in_interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.contact_values | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.contacts | assigned_by_id | public.users | id | NO ACTION | NO ACTION |
| public.contacts | company_id | public.companies | id | SET NULL | NO ACTION |
| public.contacts | duplicate_of | public.contacts | id | NO ACTION | NO ACTION |
| public.conversational_search_cache | user_id | auth.users | id | CASCADE | NO ACTION |
| public.coop_sistemas | grupo_economico_id | public.grupos_economicos | id | NO ACTION | NO ACTION |
| public.crm_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.crm_alerts | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.crm_automation_logs | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.crm_automation_logs | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.crm_automation_reprocess_queue | log_id | public.crm_automation_logs | id | CASCADE | NO ACTION |
| public.crm_cadence_rules | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.crm_consent_audit_logs | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.crm_consent_audit_logs | user_id | auth.users | id | CASCADE | NO ACTION |
| public.crm_metric_overrides | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.crm_metric_overrides | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.crm_objection_intelligence | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.crm_relationship_audit_logs | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.crm_relationship_audit_logs | user_id | auth.users | id | CASCADE | NO ACTION |
| public.cs_accounts | company_id | public.companies | id | SET NULL | NO ACTION |
| public.cs_accounts | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.cs_health_signals | account_id | public.cs_accounts | id | CASCADE | NO ACTION |
| public.cs_nps_responses | account_id | public.cs_accounts | id | CASCADE | NO ACTION |
| public.cs_nps_responses | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.cs_qbrs | account_id | public.cs_accounts | id | CASCADE | NO ACTION |
| public.cs_renewals | account_id | public.cs_accounts | id | CASCADE | NO ACTION |
| public.csat_surveys | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.csat_surveys | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.csat_surveys | ticket_id | public.support_tickets | id | SET NULL | NO ACTION |
| public.custom_field_values | custom_field_id | public.custom_fields | id | CASCADE | NO ACTION |
| public.customer_events | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.customer_events | customer_id | public.customers | id | CASCADE | NO ACTION |
| public.customer_events | executado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_events | vendedor_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_health_scores | company_id | public.companies | id | CASCADE | NO ACTION |
| public.customer_ownership_history | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.customer_ownership_history | customer_id | public.customers | id | CASCADE | NO ACTION |
| public.customer_ownership_history | execucao_id | public.rodizio_execucoes | id | NO ACTION | NO ACTION |
| public.customer_ownership_history | registrado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_ownership_history | vendedor_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_purchases | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.customer_purchases | customer_id | public.customers | id | NO ACTION | NO ACTION |
| public.customer_purchases | sdr_credito_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_purchases | vendedor_credito_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_purchases | vendedor_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_rotation_state | bloqueado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_rotation_state | bloqueio_aprovado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_rotation_state | customer_id | public.customers | id | NO ACTION | NO ACTION |
| public.customer_sdr_history | closer_destino_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_sdr_history | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.customer_sdr_history | customer_id | public.customers | id | CASCADE | NO ACTION |
| public.customer_sdr_history | execucao_id | public.rodizio_execucoes | id | NO ACTION | NO ACTION |
| public.customer_sdr_history | sdr_id | public.users | id | NO ACTION | NO ACTION |
| public.customer_surveys | company_id | public.companies | id | CASCADE | NO ACTION |
| public.customer_surveys | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.customer_surveys | sent_by | public.profiles | id | NO ACTION | NO ACTION |
| public.customers | company_id | public.companies | id | RESTRICT | NO ACTION |
| public.customers | sdr_id | public.users | id | NO ACTION | NO ACTION |
| public.customers | vendedor_id | public.users | id | NO ACTION | NO ACTION |
| public.deal_competitors | competitor_id | public.competitors | id | CASCADE | NO ACTION |
| public.deal_competitors | deal_id | public.deals | id | CASCADE | NO ACTION |
| public.deal_items | deal_id | public.deals | id | CASCADE | NO ACTION |
| public.deal_items | product_id | public.products | id | NO ACTION | NO ACTION |
| public.deal_velocity_analysis | company_id | public.companies | id | SET NULL | NO ACTION |
| public.deal_velocity_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.deal_velocity_analysis | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.deals | company_id | public.companies | id | CASCADE | NO ACTION |
| public.deals | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.deals | loss_reason_id | public.loss_reasons | id | NO ACTION | NO ACTION |
| public.deals | user_id | public.profiles | id | SET NULL | NO ACTION |
| public.decision_criteria | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.digest_history | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.disc_analysis_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.disc_analysis_history | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.disc_assessments | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.disc_assessments | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.disc_assessments | validated_by | public.profiles | id | NO ACTION | NO ACTION |
| public.disc_communication_logs | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.disc_communication_logs | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.disc_templates | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.documents | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.duplicate_candidates | reviewed_by | public.profiles | id | NO ACTION | NO ACTION |
| public.economic_group_members | company_id | public.companies | id | CASCADE | NO ACTION |
| public.economic_group_members | group_id | public.economic_groups | id | CASCADE | NO ACTION |
| public.economic_groups | main_company_id | public.companies | id | NO ACTION | NO ACTION |
| public.email_logs | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.email_logs | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.emotional_anchors | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.emotional_states_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.emotional_states_history | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.emotional_trend_snapshots | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.emotional_trend_snapshots | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.eq_analysis_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.eq_analysis_history | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.external_data_audit_log | user_id | auth.users | id | SET NULL | NO ACTION |
| public.favorites | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.health_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.hidden_objections | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.hidden_objections | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.import_jobs | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.inactivity_alerts | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.inactivity_alerts | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.inactivity_alerts | resolved_by | public.profiles | id | NO ACTION | NO ACTION |
| public.incoming_webhook_nonces | webhook_id | public.incoming_webhooks | id | CASCADE | NO ACTION |
| public.insights | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.integration_logs | integration_id | public.integrations | id | CASCADE | NO ACTION |
| public.integrations | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.interaction_templates | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.interactions | company_id | public.companies | id | SET NULL | NO ACTION |
| public.interactions | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.interactions | usuario_responsavel_id | public.users | id | NO ACTION | NO ACTION |
| public.lead_assignments | previous_owner | public.sales_team_members | id | SET NULL | NO ACTION |
| public.lead_assignments | routing_rule_id | public.lead_routing_rules | id | SET NULL | NO ACTION |
| public.lead_magnet_downloads | magnet_id | public.lead_magnets | id | CASCADE | NO ACTION |
| public.lead_magnets | form_id | public.forms | id | SET NULL | NO ACTION |
| public.lead_routing_rules | fallback_rule_id | public.lead_routing_rules | id | SET NULL | NO ACTION |
| public.lead_score_history | company_id | public.companies | id | CASCADE | NO ACTION |
| public.lead_score_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.lead_score_threshold_log | automation_id | public.lead_score_threshold_automations | id | CASCADE | NO ACTION |
| public.lead_scores | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.leads | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.leads | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.leads | pipeline_id | public.pipelines | id | NO ACTION | NO ACTION |
| public.leads | source_id | public.lead_sources | id | NO ACTION | NO ACTION |
| public.leads | stage_id | public.pipeline_stages | id | NO ACTION | NO ACTION |
| public.life_events | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.meetings | company_id | public.companies | id | CASCADE | NO ACTION |
| public.meetings | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.meetings | deal_id | public.deals | id | SET NULL | NO ACTION |
| public.meetings | user_id | public.profiles | id | SET NULL | NO ACTION |
| public.metaprogram_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.metaprogram_analysis | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.neuro_behavioral_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.neuro_pnl_sessions | company_id | public.companies | id | CASCADE | NO ACTION |
| public.neuro_pnl_sessions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.nlp_feedback | contact_id | public.contacts | id | NO ACTION | NO ACTION |
| public.nlp_feedback | interaction_id | public.interactions | id | NO ACTION | NO ACTION |
| public.nlp_feedback | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.notification_logs | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.notification_logs | user_id | auth.users | id | CASCADE | NO ACTION |
| public.notification_settings | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.notifications | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.nps_surveys | company_id | public.companies | id | CASCADE | NO ACTION |
| public.nps_surveys | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.nps_surveys | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.objections | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.objections | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.objections | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.offer_suggestions | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.pipeline_stages | pipeline_id | public.pipelines | id | CASCADE | NO ACTION |
| public.pix_accounts | company_id | public.companies | id | CASCADE | NO ACTION |
| public.pre_contact_briefings | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.pre_contact_briefings | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.product_novelties | product_id | public.products | id | CASCADE | NO ACTION |
| public.product_novelties | supplier_id | public.suppliers | id | SET NULL | NO ACTION |
| public.profiles | bitrix_user_id | public.users | id | NO ACTION | NO ACTION |
| public.proposals | company_id | public.companies | id | CASCADE | NO ACTION |
| public.proposals | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.proposals | deal_id | public.deals | id | SET NULL | NO ACTION |
| public.proposals | user_id | public.profiles | id | SET NULL | NO ACTION |
| public.proximo_passo_feedback | user_id | auth.users | id | CASCADE | NO ACTION |
| public.psychographic_audit_log | changed_by | auth.users | id | NO ACTION | NO ACTION |
| public.psychographic_audit_log | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.purchase_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.quick_notes | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.quick_notes | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.rapport_score_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.rapport_score_history | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.redistribution_log | from_member_id | public.sales_team_members | id | SET NULL | NO ACTION |
| public.redistribution_log | to_member_id | public.sales_team_members | id | SET NULL | NO ACTION |
| public.relationship_score_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.relationship_score_history | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.reminders | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.reminders | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.report_executions | scheduled_report_id | public.scheduled_reports | id | CASCADE | NO ACTION |
| public.rfm_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.rfm_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.rodizio_distribuicao_staging | aprovado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.rodizio_distribuicao_staging | closer_destino_id | public.users | id | NO ACTION | NO ACTION |
| public.rodizio_distribuicao_staging | criado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.rodizio_distribuicao_staging | customer_id | public.customers | id | NO ACTION | NO ACTION |
| public.rodizio_distribuicao_staging | execucao_id | public.rodizio_execucoes | id | NO ACTION | NO ACTION |
| public.rodizio_distribuicao_staging | sdr_destino_id | public.users | id | NO ACTION | NO ACTION |
| public.rodizio_execucoes | executado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.rodizio_execucoes | revertida_por_execucao_id | public.rodizio_execucoes | id | NO ACTION | NO ACTION |
| public.role_permissions | permission_id | public.permissions | id | CASCADE | NO ACTION |
| public.sales | deleted_by | auth.users | id | NO ACTION | NO ACTION |
| public.sales | salesperson_id | public.salespeople | id | NO ACTION | NO ACTION |
| public.sales_activities | deleted_by | auth.users | id | NO ACTION | NO ACTION |
| public.sales_activities | sale_id | public.sales | id | CASCADE | NO ACTION |
| public.sales_activities | salesperson_id | public.salespeople | id | SET NULL | NO ACTION |
| public.sales_cadences | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.sales_forecasts | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.sales_goals | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.sales_opportunities | assigned_to | public.profiles | id | NO ACTION | NO ACTION |
| public.sales_opportunities | company_id | public.companies | id | CASCADE | NO ACTION |
| public.sales_opportunities | identified_by | public.profiles | id | NO ACTION | NO ACTION |
| public.sales_tasks | client_id | public.clients | id | SET NULL | NO ACTION |
| public.sales_tasks | deleted_by | auth.users | id | NO ACTION | NO ACTION |
| public.sales_tasks | sale_id | public.sales | id | CASCADE | NO ACTION |
| public.sales_tasks | salesperson_id | public.salespeople | id | SET NULL | NO ACTION |
| public.satisfaction_scores | company_id | public.companies | id | SET NULL | NO ACTION |
| public.satisfaction_scores | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.satisfaction_scores | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.scheduled_reports | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.scheduled_visits | company_id | public.companies | id | NO ACTION | NO ACTION |
| public.scheduled_visits | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.script_sections | script_id | public.sales_scripts | id | CASCADE | NO ACTION |
| public.sdr_closer_assignments | closer_id | public.users | id | NO ACTION | NO ACTION |
| public.sdr_closer_assignments | criado_por_id | public.users | id | NO ACTION | NO ACTION |
| public.sdr_closer_assignments | sdr_id | public.users | id | NO ACTION | NO ACTION |
| public.seller_daily_metrics | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.sequence_email_reservations | contact_id | public.contacts | id | RESTRICT | NO ACTION |
| public.sequence_email_reservations | enrollment_id | public.sequence_enrollments | id | RESTRICT | NO ACTION |
| public.sequence_email_reservations | step_id | public.sequence_steps | id | RESTRICT | NO ACTION |
| public.sequence_email_reservations | user_id | auth.users | id | RESTRICT | NO ACTION |
| public.sequence_enrollments | sequence_id | public.sequences | id | CASCADE | NO ACTION |
| public.sequence_events | enrollment_id | public.sequence_enrollments | id | CASCADE | NO ACTION |
| public.sequence_events | sequence_id | public.sequences | id | CASCADE | NO ACTION |
| public.sequence_send_log | enrollment_id | public.sequence_enrollments | id | CASCADE | NO ACTION |
| public.sequence_send_log | sequence_id | public.sequences | id | CASCADE | NO ACTION |
| public.sequence_send_log | step_id | public.sequence_steps | id | CASCADE | NO ACTION |
| public.sequence_steps | sequence_id | public.sequences | id | CASCADE | NO ACTION |
| public.sequences | user_id | auth.users | id | CASCADE | NO ACTION |
| public.shared_interests | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.shared_interests | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.sla_violations | sla_rule_id | public.sla_rules | id | NO ACTION | NO ACTION |
| public.sla_violations | user_id | public.profiles | id | NO ACTION | NO ACTION |
| public.sleight_of_mouth_examples | pattern_id | public.sleight_of_mouth_patterns | id | CASCADE | NO ACTION |
| public.smart_notifications | user_id | auth.users | id | CASCADE | NO ACTION |
| public.smart_reminders | company_id | public.companies | id | SET NULL | NO ACTION |
| public.smart_reminders | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.smart_reminders | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.smart_reminders | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.smart_segments | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.sms_campaign_recipients | campaign_id | public.sms_campaigns | id | CASCADE | NO ACTION |
| public.sms_campaign_recipients | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.sms_opt_outs | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.social_behavior_analysis | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.social_consent_audit | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.social_consent_audit | user_id | auth.users | id | NO ACTION | NO ACTION |
| public.social_insights | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.social_insights | user_id | auth.users | id | CASCADE | NO ACTION |
| public.social_life_events | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.social_profiles | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.social_scraping_schedule | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.social_sync_queue | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.stakeholder_alerts | company_id | public.companies | id | CASCADE | NO ACTION |
| public.stakeholder_alerts | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.suggested_life_events | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.suggested_life_events | user_id | auth.users | id | CASCADE | NO ACTION |
| public.suggested_rapport_intel | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.supplier_evaluations | avaliador_id | public.users | id | NO ACTION | NO ACTION |
| public.supplier_evaluations | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| public.supplier_homologations | avaliador_id | public.users | id | NO ACTION | NO ACTION |
| public.supplier_homologations | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| public.supplier_score_history | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| public.supplier_scores | segment_code | public.supplier_qualification_config | segment_code | NO ACTION | NO ACTION |
| public.supplier_scores | supplier_id | public.suppliers | id | CASCADE | NO ACTION |
| public.suppliers | company_id | public.companies | id | RESTRICT | NO ACTION |
| public.support_tickets | assigned_to | public.sales_team_members | id | SET NULL | NO ACTION |
| public.support_tickets | company_id | public.companies | id | SET NULL | NO ACTION |
| public.support_tickets | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.support_tickets | user_id | auth.users | id | CASCADE | NO ACTION |
| public.system_alerts | acknowledged_by | auth.users | id | NO ACTION | NO ACTION |
| public.tasks | company_id | public.companies | id | CASCADE | NO ACTION |
| public.tasks | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.tasks | deal_id | public.deals | id | SET NULL | NO ACTION |
| public.tasks | parent_task_id | public.tasks | id | NO ACTION | NO ACTION |
| public.tasks | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.territories | manager_id | public.profiles | id | NO ACTION | NO ACTION |
| public.territory_assignments | territory_id | public.territories | id | CASCADE | NO ACTION |
| public.territory_assignments | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.ticket_comments | ticket_id | public.support_tickets | id | CASCADE | NO ACTION |
| public.ticket_comments | user_id | auth.users | id | CASCADE | NO ACTION |
| public.trigger_ab_tests | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.trigger_channel_effectiveness | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.trigger_intensity_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.trigger_intensity_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.trigger_templates | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.trigger_templates | trigger_type_id | public.trigger_types | id | NO ACTION | NO ACTION |
| public.trigger_usage_log | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.trigger_usage_log | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.trigger_usage_log | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.user_badges | badge_id | public.badges | id | CASCADE | NO ACTION |
| public.user_badges | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.user_contacts_link | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.user_contacts_link | shared_by | public.profiles | id | NO ACTION | NO ACTION |
| public.user_contacts_link | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.user_disc_profile | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.user_goals | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.user_known_devices | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_roles | user_id | auth.users | id | CASCADE | NO ACTION |
| public.user_ui_preferences | user_id | auth.users | id | CASCADE | NO ACTION |
| public.vak_analysis_history | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.vak_analysis_history | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| public.vak_profiles | contact_id | public.contacts | id | CASCADE | NO ACTION |
| public.vak_profiles | user_id | public.profiles | id | CASCADE | NO ACTION |
| public.visit_checkins | company_id | public.companies | id | SET NULL | NO ACTION |
| public.webhook_logs | webhook_id | public.webhooks | id | CASCADE | NO ACTION |
| public.webhooks | created_by | public.profiles | id | NO ACTION | NO ACTION |
| public.whatsapp_messages | company_id | public.companies | id | CASCADE | NO ACTION |
| public.whatsapp_messages | contact_id | public.contacts | id | SET NULL | NO ACTION |
| public.win_loss_records | competitor_id | public.competitors | id | SET NULL | NO ACTION |
| public.win_loss_records | primary_reason_id | public.win_loss_reasons | id | SET NULL | NO ACTION |
| zapp_history.ai_cost_log | contact_id | public.contacts | id | SET NULL | NO ACTION |
| zapp_history.ai_training_dataset | contact_id | public.contacts | id | SET NULL | NO ACTION |
| zapp_history.ai_training_dataset | conversation_id | zapp_history.conversations | id | SET NULL | NO ACTION |
| zapp_history.conversation_daily_summaries | company_id | public.companies | id | SET NULL | NO ACTION |
| zapp_history.conversation_daily_summaries | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.conversation_daily_summaries | conversation_id | zapp_history.conversations | id | SET NULL | NO ACTION |
| zapp_history.conversation_daily_summaries | interaction_id | public.interactions | id | SET NULL | NO ACTION |
| zapp_history.conversations | company_id | public.companies | id | SET NULL | NO ACTION |
| zapp_history.conversations | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.conversations | whatsapp_connection_id | zapp_history.whatsapp_connections | id | SET NULL | NO ACTION |
| zapp_history.message_audio | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.message_audio | conversation_id | zapp_history.conversations | id | SET NULL | NO ACTION |
| zapp_history.message_audio | message_id | zapp_history.messages | id | CASCADE | NO ACTION |
| zapp_history.message_embeddings | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.message_embeddings | message_id | zapp_history.messages | id | CASCADE | NO ACTION |
| zapp_history.message_links | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.message_links | conversation_id | zapp_history.conversations | id | SET NULL | NO ACTION |
| zapp_history.message_links | message_id | zapp_history.messages | id | CASCADE | NO ACTION |
| zapp_history.message_media | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.message_media | conversation_id | zapp_history.conversations | id | SET NULL | NO ACTION |
| zapp_history.message_media | message_id | zapp_history.messages | id | CASCADE | NO ACTION |
| zapp_history.messages | company_id | public.companies | id | SET NULL | NO ACTION |
| zapp_history.messages | contact_id | public.contacts | id | CASCADE | NO ACTION |
| zapp_history.messages | conversation_id | zapp_history.conversations | id | CASCADE | NO ACTION |
| zapp_history.messages | quoted_message_id | zapp_history.messages | id | SET NULL | NO ACTION |
| zapp_history.phone_to_contact | contact_id | public.contacts | id | CASCADE | NO ACTION |


_Diagrama omitido: mais de 120 tabelas._
