# 11 · GLOSSÁRIO, DADOS DE REFERÊNCIA E LACUNAS

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `3a76dceb9b` · branch `main` · 2026-11-13 12:09 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Glossário do domínio (entidades do sistema)

| Termo | Significado / valores | Tamanho | Origem |
|---|---|---|---|
| `_dormant.inactivity_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `_fk_orphans` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `_migration_cdc_checkpoint` | _(sem COMMENT ON TABLE — significado não documentado)_ | 2 colunas | migration |
| `_migration_schema_snapshot` | _(sem COMMENT ON TABLE — significado não documentado)_ | 3 colunas | migration |
| `_seq_gap_report` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `abm_account_plans` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `abm_accounts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `abm_buying_committee` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `abm_campaigns` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `abm_whitespace_opportunities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `access_blocked_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `access_security_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `activities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `ai_chat_messages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `ai_chat_threads` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `ai_gateway_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `ai_recommendation_audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_recommendation_audit_logs_v2` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_recommendation_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_tone_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `applied_objection_responses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `attribution_models_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `attribution_touchpoints` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `audit_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `automation_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `automation_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `battle_cards` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `behavioral_insight_feedback` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `behavioral_profile_regen_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `brain_dominance_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `call_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `campaign_recipients` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `canned_responses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `churn_risk_scores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `cidades` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `city_whitelist` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `client_values` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `coaching_scorecards` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `cognitive_bias_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `communication_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `companies` | _(sem COMMENT ON TABLE — significado não documentado)_ | 29 colunas | migration |
| `company_addresses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 24 colunas | migration |
| `company_emails` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `company_phones` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `compatibility_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `compatibility_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `competitors` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `connection_anomalies` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `connection_configs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `connection_quotas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `connection_test_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `contact_analytical_profile_versions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `contact_analytical_profiles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_automation_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `contact_behavior` | _(sem COMMENT ON TABLE — significado não documentado)_ | 20 colunas | migration |
| `contact_business_context` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_cadence` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `contact_cadence_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_decision_making` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_emails` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `contact_family_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `contact_influence` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `contact_metaprograms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `contact_next_actions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `contact_objection_scripts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_personality` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `contact_phones` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `contact_predictive_roadmap` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `contact_preferences_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_rapport_strategy` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `contact_relatives` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `contact_relatives_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_report_overrides` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `contact_time_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_time_analysis_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contacts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 38 colunas | migration |
| `conversation_analyses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `conversation_topics_catalog` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `conversational_search_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `crm_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `crm_automation_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `crm_automation_reprocess_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `crm_cadence_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `crm_consent_audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `crm_metric_overrides` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `crm_objection_intelligence` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `crm_relationship_audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `cron_secrets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `cs_accounts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `cs_health_signals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `cs_nps_responses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `cs_qbrs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `cs_renewals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `csat_surveys` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `custom_field_values` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `custom_fields` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `customer_ownership_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 2 colunas | migration |
| `customer_purchases` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `customer_rotation_state` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `customer_sdr_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 2 colunas | migration |
| `data_retention_policies` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `deal_forecasts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `deal_room_activities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `deal_room_comments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `deal_room_documents` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `deal_room_milestones` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `deal_room_stakeholders` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `deal_rooms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `deals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `decision_criteria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `device_login_notifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `disc_analysis_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `disc_analysis_history_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `disc_communication_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `disc_conversion_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `disc_profile_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 26 colunas | migration |
| `document_signatures` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `document_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `document_views` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `documents` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `email_campaigns` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `email_finder_results` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `email_thread_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `email_verifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `emotional_anchors` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `emotional_states_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `entity_relationships` | Relacionamentos polimórficos entre Empresa/Pessoa com papel (comprador, gerente, proprietário, ...). | 14 colunas | migration |
| `eq_analysis_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `error_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `estados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `favorite_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `feature_flags` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `ficha360_conversation_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `follow_up_approvals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `follow_up_approvals_v2` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `forecast_categories_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `forecast_periods` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `forecast_quota_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `forecast_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `form_submissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `forms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `geo_allowed_countries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `handoff_requests` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `health_alert_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `health_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `hidden_objections` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `incoming_webhook_dlq` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `incoming_webhook_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `incoming_webhook_nonces` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `incoming_webhooks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `insights` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `intent_scores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `intent_signals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `intent_tracking_pixels` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `interaction_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `interactions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 24 colunas | migration |
| `interactions_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ip_whitelist` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `knowledge_base_articles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `landing_page_submissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `landing_pages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `lead_assignments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `lead_magnet_downloads` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `lead_magnets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `lead_routing_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `lead_score_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `lead_score_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `lead_score_recompute_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `lead_score_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `lead_score_threshold_automations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `lead_score_threshold_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `lead_score_thresholds` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `lead_scores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 20 colunas | migration |
| `life_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `life_events_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `login_attempts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `lux_intelligence` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `lux_webhook_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `marketing_campaign_stats` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `marketing_roi_data` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `mcp_tool_calls` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `meeting_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `metaprogram_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `migration_password_reset_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `mql_classifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `mql_criteria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `neuro_behavioral_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `neuro_pnl_sessions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `nlp_feedback` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `notification_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `notification_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `notifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `nurturing_enrollments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `nurturing_executions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `nurturing_workflows` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `objection_example_feedback` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `offer_suggestions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `ops_backup.acl_snapshot` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `password_reset_requests` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `people_intelligence_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `permissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `phone_validations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `pipeline_stage_transitions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `pipeline_stages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `pipelines` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `playbook_usage_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `profiles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `proximo_passo_feedback` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `psychographic_audit_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `purchase_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `push_subscriptions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `query_telemetry` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `redistribution_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `reframing_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `reframing_analysis_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `revops_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `revops_benchmarks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `revops_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `rfm_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 31 colunas | migration |
| `rfm_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `rfm_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `rfm_segment_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `rodizio_distribuicao_staging` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `rodizio_execucoes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `role_permissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `rpc_perf_samples` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `rpc_plan_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `sales` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `sales_activities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `sales_playbooks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `sales_team_members` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `salespeople` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `schema_drift_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `score_history` | Historical record of all calculated scores for contacts | 10 colunas | migration |
| `search_products_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `secret_rotation_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `semantic_search_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `sentiment_annotations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `sequence_email_reservations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `sequence_enrollments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `sequence_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `sequence_send_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `sequence_steps` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `sequences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `smart_notifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `sms_campaign_recipients` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `sms_campaigns` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `sms_opt_outs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `sms_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `social_behavior_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `social_consent_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `social_insights` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `social_life_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `social_profiles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 24 colunas | migration |
| `social_scraping_schedule` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `social_sync_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `stakeholder_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `suggested_life_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `suggested_rapport_intel` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `support_tickets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `system_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `system_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `system_health_snapshots` | Snapshots periódicos do system-health para cálculo de Error Budget. Populado a cada 5 min via cron. Visível apenas para admins. | 6 colunas | migration |
| `tasks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `ticket_comments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `trigger_ab_tests` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `trigger_bundles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `trigger_channel_effectiveness` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `trigger_intensity_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `trigger_usage_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `user_known_devices` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `user_roles` | _(sem COMMENT ON TABLE — significado não documentado)_ | 3 colunas | migration |
| `user_ui_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `users` | _(sem COMMENT ON TABLE — significado não documentado)_ | 1 colunas | migration |
| `vak_analysis_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `validation_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `visit_checkins` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `webauthn_credentials` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `weekly_report_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `weekly_reports` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `whatsapp_ingestion_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `whatsapp_instances` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `whatsapp_kpis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `whatsapp_messages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `whatsapp_messages_index` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `whatsapp_transcriptions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `win_loss_insights` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `win_loss_reasons` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `win_loss_records` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `app_role` (enum) | admin, moderator, user |  | banco |
| `entity_relationship_role` (enum) | buyer, manager, owner, decision_maker, influencer, user, sponsor, partner, supplier, subsidiary, parent, employee_of, other |  | banco |
| `entity_type` (enum) | company, contact |  | banco |
| `error_severity` (enum) | info, warning, error, critical |  | banco |
| `passo_outcome` (enum) | respondeu_positivo, respondeu_neutro, nao_respondeu, nao_atendeu, pulou |  | banco |
| `validation_kind` (enum) | email, phone |  | banco |
| `validation_queue_status` (enum) | pending, processing, done, error |  | banco |
| `email_type` (enum) | corporativo, pessoal, financeiro, nfe, marketing, comercial, compras |  | banco |
| `phone_type` (enum) | celular_corporativo, fixo_comercial, celular_pessoal, invalido |  | banco |
| … +232 linhas — lista completa em `context.json` | | | |

## Dados de referência (seed — planos, categorias, perfis fixos)

_nenhum item encontrado_

## Auditoria de consistência (código × schema) — trate como NÃO VERIFICADO

> `status`: inclui estados só de UI/realtime (ex.: `uploading`, `SUBSCRIBED`) que nunca vão ao banco — confira o arquivo antes de concluir que falta valor no enum.

| Tipo | Problema | Onde |
|---|---|---|
| status | valor `verified` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/RequireAdmin.tsx`<br>`compara:src/components/security/MFAEnrollmentBanner.tsx`<br>`compara:src/hooks/use2FA.ts`<br>`compara:src/hooks/useMFAGuard.ts` |
| status | valor `queued` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/conexoes/IncomingWebhookLogsDialog.tsx` |
| status | valor `ganho` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/contact-detail/commercial-tab/DealsCard.tsx`<br>`compara:src/hooks/useDealsAtRisk.ts` |
| status | valor `reprocessing` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/CRMAutomationAuditLog.tsx`<br>`escreve:src/components/crm/CRMAutomationAuditLog.tsx` |
| status | valor `presented` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/commercial/OfferSuggestionsElite.tsx`<br>`escreve:src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| status | valor `granted` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/consent/ConsentAuditLog.tsx` |
| status | valor `Inativo` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/crm/copywriting/PerformanceHistory.tsx` |
| status | valor `Ativo` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/copywriting/PerformanceHistory.tsx`<br>`escreve:src/components/crm/copywriting/PerformanceHistory.tsx` |
| status | valor `fulfilled` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/enrichment/ValidateAllButton.tsx`<br>`compara:src/hooks/useMarkObjectionHandled.ts`<br>`compara:supabase/functions/process-behavioral-regen-queue/index.ts`<br>`compara:supabase/functions/sequence-processor/index.ts` |
| status | valor `loading` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/feedback/LoadingStates.tsx` |
| status | valor `online` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/micro-interactions/StatusIndicators.tsx`<br>`compara:src/components/pwa/NetworkComponents.tsx`<br>`escreve:src/components/micro-interactions/StatusIndicators.tsx` |
| status | valor `used` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nlp/SleightOfMouthPanel.tsx`<br>`escreve:src/components/nlp/SleightOfMouthPanel.tsx` |
| status | valor `offline` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/pwa/NetworkComponents.tsx` |
| status | valor `unverified` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/use2FA.ts` |
| status | valor `overdue` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/useContactCadence.ts` |
| status | valor `on_track` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useContactCadence.ts` |
| status | valor `perdido` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDealsAtRisk.ts` |
| status | valor `declined` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDocumentTemplates.ts`<br>`compara:src/pages/PublicSignaturePage.tsx`<br>`escreve:src/hooks/useDocumentTemplates.ts`<br>`escreve:supabase/functions/submit-signature/index.ts` |
| status | valor `viewed` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDocumentTemplates.ts`<br>`compara:src/pages/Documentos.tsx`<br>`escreve:supabase/functions/get-signature/index.ts` |
| status | valor `signed` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDocumentTemplates.ts`<br>`compara:src/pages/PublicSignaturePage.tsx`<br>`compara:supabase/functions/submit-signature/index.ts`<br>`escreve:supabase/functions/submit-signature/index.ts` |
| status | valor `fetching` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useSlowQueryDetector.ts` |
| status | valor `ignored` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`escreve:supabase/functions/bitrix24-webhook/index.ts`<br>`escreve:supabase/functions/evolution-webhook/events.ts`<br>`escreve:supabase/functions/evolution-webhook/index.ts` |
| status | valor `logged` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`escreve:supabase/functions/evolution-webhook/events.ts` |
| status | valor `recebida` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts` |
| status | valor `READ` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/messages.ts`<br>`escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`escreve:supabase/functions/_shared/evolution-ownership-contract_test.ts` |
| status | valor `not_found` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/enrich-contacts/index.ts` |
| status | valor `enriched` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/enrich-contacts/index.ts` |
| status | valor `already_complete` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/enrich-contacts/index.ts` |
| status | valor `DELIVERY_ACK` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/messages.ts` |
| status | valor `PLAYED` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/messages.ts` |
| status | valor `ERROR` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/messages.ts` |
| status | valor `PENDING` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/messages.ts` |
| status | valor `not_configured` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/health-aggregate/index.ts`<br>`compara:supabase/functions/system-health/index.ts`<br>`escreve:supabase/functions/health-aggregate/index.ts`<br>`escreve:supabase/functions/health/index.ts` |
| status | valor `retry_scheduled` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/process-webhook-dlq/index.ts` |
| status | valor `recording` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/VoiceAITestPanel.tsx` |
| status | valor `collapsed` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/layout/AppSidebar.tsx`<br>`compara:src/components/ui/sidebar/sidebar-layout.tsx`<br>`compara:src/components/ui/sidebar/sidebar-menu.tsx` |
| status | valor `object` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:src/contexts/NavigationStackContext.tsx` |
| status | valor `Confiança` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Receptividade` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Conexão` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Relaxamento` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Ansiedade` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Defensividade` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Fechamento` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `Confusão` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/anchorTrackingData.ts` |
| status | valor `SP` para `state` usado no código não existe em nenhum enum do banco/TS | `escreve:src/pages/DocsPage.tsx` |
| status | valor `close` para `state` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/events.ts` |
| status | valor `recording` para `phase` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/VoiceAITestPanel.tsx` |
| status | valor `test1` para `phase` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nlp/TOTEModelMapper.tsx` |
| status | valor `test2` para `phase` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nlp/TOTEModelMapper.tsx` |
| status | valor `initial` para `phase` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/carnegieIdentityLabels.ts` |
| status | valor `Estágio` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/crm/relationship/RelationshipAuditPanel.tsx` |
| status | valor `problem` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/copywritingAdvancedData.ts`<br>`escreve:src/types/copywriting.ts` |
| status | valor `agitate` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/copywritingAdvancedData.ts` |
| status | valor `solution` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/copywritingAdvancedData.ts` |
| status | valor `promise` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/copywritingAdvancedData.ts`<br>`escreve:src/types/copywriting.ts` |
| status | valor `picture` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/copywritingAdvancedData.ts` |
| status | valor `proof` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:src/data/copywritingAdvancedData.ts` |
| status | valor `negociando` para `stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDISCConversionData.ts` |
| status | valor `fechado` para `stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDISCConversionData.ts` |
| status | valor `cliente` para `stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDISCConversionData.ts` |
| status | valor `converted` para `stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useProactiveIntelligence.ts` |
| status | valor `engaged` para `stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useProactiveIntelligence.ts` |
| status | valor `new` para `stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useProactiveIntelligence.ts` |
| status | valor `upsert` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/revops-snapshot-builder/index.ts` |
| status | valor `alerts` para `stage` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/revops-snapshot-builder/index.ts` |
| status | valor `fechado` para `relationship_stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nlp/NLPConversionMetrics.tsx` |
| status | valor `cliente` para `relationship_stage` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nlp/NLPConversionMetrics.tsx` |
| status | valor `text-primary` para `next_step` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/conversation-intel/KeyMomentsTimeline.tsx` |
| coluna | coluna `deleted_at` usada no código não existe no schema de `companies` |  |
| coluna | coluna `extra_data_rf` usada no código não existe no schema de `companies` |  |
| coluna | coluna `intent_score` usada no código não existe no schema de `companies` |  |
| coluna | coluna `nome_crm` usada no código não existe no schema de `companies` |  |
| coluna | coluna `nome_fantasia` usada no código não existe no schema de `companies` |  |
| coluna | coluna `ramo_atividade` usada no código não existe no schema de `companies` |  |
| coluna | coluna `razao_social` usada no código não existe no schema de `companies` |  |
| coluna | coluna `status` usada no código não existe no schema de `companies` |  |
| coluna | coluna `cargo` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `full_name` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `lead_score` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `metaprogram_profile` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `objection_patterns` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `status` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `avg_latency_ms` usada no código não existe no schema de `system_health_snapshots` |  |
| coluna | coluna `captured_at` usada no código não existe no schema de `system_health_snapshots` |  |
| coluna | coluna `difference_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `general_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `proactive_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `reactive_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `sameness_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `specific_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `user_feedback` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `channel` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `direction` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `duracao_segundos` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `duration_seconds` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `metadata` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `outcome` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `resumo` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `tipo` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `language_complexity_score` usada no código não existe no schema de `neuro_behavioral_history` |  |
| coluna | coluna `response_synchronicity` usada no código não existe no schema de `neuro_behavioral_history` |  |
| coluna | coluna `analysis_source` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `analyzed_at` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `primary_modality` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `profile_summary` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `user_feedback` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `resolution_summary` usada no código não existe no schema de `contact_automation_settings` |  |
| coluna | coluna `user_id` usada no código não existe no schema de `contact_predictive_roadmap` |  |
| coluna | coluna `updated_at` usada no código não existe no schema de `crm_objection_intelligence` |  |
| coluna | coluna `based_on_count` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `model` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `summary` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `tone` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `nps_score` usada no código não existe no schema de `csat_surveys` |  |
| coluna | coluna `user_id` usada no código não existe no schema de `campaign_recipients` |  |
| coluna | coluna `discovered_at` usada no código não existe no schema de `connection_configs` |  |
| coluna | coluna `file_name` usada no código não existe no schema de `documents` |  |
| coluna | coluna `file_type` usada no código não existe no schema de `documents` |  |
| coluna | coluna `check_frequency_hours` usada no código não existe no schema de `health_alert_settings` |  |
| coluna | coluna `replay_window_seconds` usada no código não existe no schema de `incoming_webhooks` |  |
| coluna | coluna `require_signature` usada no código não existe no schema de `incoming_webhooks` |  |
| coluna | coluna `calculated_at` usada no código não existe no schema de `lead_scores` |  |
| coluna | coluna `factors` usada no código não existe no schema de `lead_score_history` |  |
| coluna | coluna `completed_at` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `completion_notes` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `contextual_tone` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `was_successful` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `id` usada no código não existe no schema de `users` |  |
| coluna | coluna `branch_on_no_step` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `branch_on_yes_step` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `condition_wait_hours` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `paused_reason` usada no código não existe no schema de `sequence_enrollments` |  |
| coluna | coluna `indicator_score` usada no código não existe no schema de `social_insights` |  |
| coluna | coluna `sentiment` usada no código não existe no schema de `social_insights` |  |
| coluna | coluna `source_url` usada no código não existe no schema de `social_insights` |  |
| coluna | coluna `claim_token` usada no código não existe no schema de `validation_queue` |  |
| coluna | coluna `check_in_at` usada no código não existe no schema de `visit_checkins` |  |
| coluna | coluna `check_out_at` usada no código não existe no schema de `visit_checkins` |  |
| coluna | coluna `unique_contacts` usada no código não existe no schema de `whatsapp_kpis` |  |
| coluna | coluna `is_active` usada no código não existe no schema de `competitors` |  |
| coluna | coluna `metadata` usada no código não existe no schema de `competitors` |  |
| coluna | coluna `claim_expires_at` usada no código não existe no schema de `notification_logs` |  |
| coluna | coluna `claim_token` usada no código não existe no schema de `notification_logs` |  |
| coluna | coluna `stage` usada no código não existe no schema de `deals` |  |
| tabela | tabela `__proto__` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `a` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs` |
| tabela | tabela `alfa` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `anexos` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `com_rls` usada no código não existe nas migrations/types do repo | `scripts/inventario/banco.test.mjs`<br>`scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `config_regras_negocio` usada no código não existe nas migrations/types do repo | `src/hooks/useRodizioEquipe.ts` |
| tabela | tabela `connector_log` usada no código não existe nas migrations/types do repo | `supabase/functions/evolution-bitrix-connector/index.ts` |
| tabela | tabela `constructor` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `contact_fone` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `contacts_extra` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-repo.test.mjs` |
| tabela | tabela `customer_health_scores` usada no código não existe nas migrations/types do repo | `src/pages/mapa/relationshipScores.ts` |
| tabela | tabela `dashboard_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `email_logs` usada no código não existe nas migrations/types do repo | `supabase/functions/health-aggregate/index.ts`<br>`supabase/functions/system-health/index.ts` |
| tabela | tabela `emails` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs`<br>`scripts/inventario/gerar-repo.test.mjs` |
| tabela | tabela `fantasma` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs`<br>`scripts/audit-ausentes.test.mjs` |
| tabela | tabela `fixture_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `ghost_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `grande` usada no código não existe nas migrations/types do repo | `scripts/inventario/banco.test.mjs` |
| tabela | tabela `logs` usada no código não existe nas migrations/types do repo | `supabase/functions/_shared/best-effort-write_test.ts` |
| tabela | tabela `nao_conta_js` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `nunca_conta` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-edge-tabela.test.mjs` |
| tabela | tabela `oauth_tokens` usada no código não existe nas migrations/types do repo | `supabase/functions/evolution-bitrix-connector/index.ts` |
| tabela | tabela `oculta` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-edge-tabela.test.mjs` |
| tabela | tabela `orfa` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `payments` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `runtime_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `so_teste` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs` |
| tabela | tabela `t` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs`<br>`scripts/check-edge-cors.test.mjs` |
| tabela | tabela `t1` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs` |
| tabela | tabela `tabela` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.mjs`<br>`scripts/inventario/gerar-banco.mjs`<br>`scripts/inventario/gerar-repo.mjs` |
| tabela | tabela `tabela_de_teste` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-edge-tabela.test.mjs` |
| tabela | tabela `toString` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `tools_runtime` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `tx` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs` |
| tabela | tabela `x` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.mjs`<br>`scripts/audit-ausentes.test.mjs`<br>`scripts/diff-tables.mjs`<br>`scripts/inventario/gerar-edge-tabela.mjs` |
| tabela | tabela `zeta` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| rls | `company_addresses`: acessada do front (3 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useBIAdvanced.ts`<br>`src/hooks/useConversationalSearch.ts`<br>`src/pages/MapaEmpresas.tsx` |
| rls | `company_emails`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useDedupEngine.ts` |
| rls | `company_phones`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useDedupEngine.ts` |
| rls | `crm_automation_logs`: front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| rls | `crm_automation_reprocess_queue`: front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| rls | `incoming_webhook_nonces`: RLS ligado sem nenhuma política → só service_role acessa |  |
| rls | `rodizio_distribuicao_staging`: RLS ligado sem nenhuma política → só service_role acessa | `src/hooks/useRodizioOndas.ts` |
| rls | `users`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useRodizioEquipe.ts` |
| edge | edge function `dashboard-edge` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `envia-email` invocada mas não existe em supabase/functions/ | `scripts/inventario/gerar-repo.test.mjs` |
| edge | edge function `fixture-edge` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `ghost-edge` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `inexistente` invocada mas não existe em supabase/functions/ | `scripts/ai-context/cenarios.mjs` |
| edge | edge function `orphan-fn` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `other` invocada mas não existe em supabase/functions/ | `scripts/ai-context/cenarios.mjs` |
| edge | edge function `runtime-fn` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `runtime-missing` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `send-email` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| edge | edge function `tools-edge` invocada mas não existe em supabase/functions/ | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `dashboard_rpc` chamada mas não definida nas migrations/types | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `demo` chamada mas não definida nas migrations/types | `scripts/supabase_snapshot/test_snapshot.py` |
| rpc | RPC `fixture_rpc` chamada mas não definida nas migrations/types | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `fn` chamada mas não definida nas migrations/types | `scripts/supabase_snapshot/snapshot.py` |
| rpc | RPC `get_territories` chamada mas não definida nas migrations/types | `supabase/functions/territory-optimization/index.ts` |
| rpc | RPC `get_territory_performance` chamada mas não definida nas migrations/types | `supabase/functions/territory-optimization/index.ts` |
| rpc | RPC `ghost_rpc` chamada mas não definida nas migrations/types | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `is_admin` chamada mas não definida nas migrations/types | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `nome` chamada mas não definida nas migrations/types | `scripts/supabase_snapshot/snapshot.py` |
| rpc | RPC `r1` chamada mas não definida nas migrations/types | `scripts/ai-context/cenarios.mjs` |
| rpc | RPC `rpc_fantasma` chamada mas não definida nas migrations/types | `scripts/audit-ausentes.test.mjs` |
| rpc | RPC `runtime_rpc` chamada mas não definida nas migrations/types | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `search_contacts` chamada mas não definida nas migrations/types | `scripts/inventario/gerar-rotas.test.mjs` |
| rpc | RPC `sem_args` chamada mas não definida nas migrations/types | `scripts/audit-ausentes.test.mjs` |
| rpc | RPC `sobrecarga` chamada mas não definida nas migrations/types | `scripts/audit-ausentes.test.mjs` |
| rpc | RPC `soma` chamada mas não definida nas migrations/types | `scripts/audit-ausentes.test.mjs` |
| rpc | RPC `tools_rpc` chamada mas não definida nas migrations/types | `scripts/ai-context/gerar.unit.mjs` |
| rpc | RPC `x` chamada mas não definida nas migrations/types | `scripts/audit-ausentes.test.mjs`<br>`scripts/diff-tables.mjs` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/audit-ausentes.mjs` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/audit-ausentes.test.mjs` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/inventario/gerar-banco.mjs` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/inventario/gerar-rotas.test.mjs` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/migration/reset-passwords.ts` |
| dinâmico | 5 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/migration/cdc/replay.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/migration/compliance/lgpd-snapshot.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/migration/verify/dual-write-diverge.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `scripts/regras_negocio/generate.py` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/components/data-export/AdvancedDataExporter.tsx` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/useBIAdvanced.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `src/hooks/useRealtimeNotifications.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/bulk-revalidate/index.ts` |
| dinâmico | 4 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/dual-write-proxy/index.ts` |
| dinâmico | 2 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/external-data/database.ts` |
| dinâmico | 3 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/external-data/index.ts` |
| dinâmico | 4 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/external-data/mutations.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/incoming-webhook/index.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/lux-webhook/index.ts` |
| dinâmico | 1 chamada(s) `.from(variável)` — tabela só conhecida em runtime | `supabase/functions/process-webhook-dlq/index.ts` |
| segurança | função `aggregate_nlp_to_company` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511191129_8b0d76c4-d9ed-4a6a-9a44-a23f1f423135.sql` |
| segurança | função `audit_life_events` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260510112012_611ae0f0-86ec-4530-afc7-ae325729e024.sql` |
| segurança | função `calculate_interaction_response_time` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511185450_36a92af7-3123-4180-b5cd-32b6964463dd.sql` |
| segurança | função `calculate_next_contact_due` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511185111_1b0fce9e-8228-40ff-9451-7273de1d925f.sql` |
| segurança | função `log_behavioral_change` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509184829_b75919b1-6cac-4063-9d58-88ac9cfec1e1.sql` |
| segurança | função `move_deal` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| segurança | função `process_contact_cadence_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511184933_6a317244-47fb-4f40-bcef-124087073da5.sql` |
| segurança | função `process_contact_preferences_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511184817_6fcb48d7-fb1b-460e-b8d1-be59fe1babd7.sql` |
| segurança | função `process_contact_relatives_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511172410_0b23f30a-e264-4a5d-85c5-2e1bbcd4f576.sql` |
| segurança | função `process_contact_time_analysis_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511185007_82ddf7eb-7630-4eec-a42c-a3b38828f0dc.sql` |
| segurança | função `process_disc_analysis_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511185757_4c83c69c-de91-439f-9c13-7b92d4c14142.sql` |
| segurança | função `process_interactions_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511185221_db922848-ea45-492c-b3f4-f40bf8f2b6db.sql` |
| segurança | função `process_reframing_audit` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511190139_affdb8bf-798b-4f2b-bf9c-f8c9898717e0.sql` |
| segurança | função `record_family_history` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260509154007_718149db-b920-48fb-8d2d-677c9f437fa1.sql` |
| segurança | função `sync_nlp_to_contact` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511191057_b81de04f-8180-4986-b2be-f5d0f9ddfbd0.sql` |
| segurança | função `trigger_aggregate_nlp_to_company` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260511191129_8b0d76c4-d9ed-4a6a-9a44-a23f1f423135.sql` |
| segurança | função `update_deal_amount` é SECURITY DEFINER sem `set search_path` (risco de escalação) | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| webhook | edge function `evolution-bitrix-connector` processa eventos de webhook sem sinal de idempotência (evento duplicado = efeito duplicado) | `supabase/functions/evolution-bitrix-connector/index.ts` |
| webhook | edge function `evolution-webhook` processa eventos de webhook sem sinal de idempotência (evento duplicado = efeito duplicado) | `supabase/functions/evolution-webhook/index.ts` |
| webhook | edge function `external-data` processa eventos de webhook sem sinal de idempotência (evento duplicado = efeito duplicado) | `supabase/functions/external-data/index.ts` |

## Lacunas — o que este contexto NÃO consegue responder (perguntas para o dono do negócio)

- Nenhuma regra manual em `manual/`: prazos, limites, exceções comerciais, quem aprova o quê — só o negócio sabe.
- `abm_account_plans.status` tem valores ['active', 'archived', 'completed', 'draft'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `abm_accounts.status` tem valores ['active', 'closed_lost', 'closed_won', 'nurture', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `abm_campaigns.status` tem valores ['active', 'archived', 'completed', 'draft', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `abm_whitespace_opportunities.status` tem valores ['dismissed', 'identified', 'lost', 'pursuing', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `call_logs.status` tem valores ['busy', 'completed', 'failed', 'missed', 'no-answer'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `campaign_recipients.status` tem valores ['bounced', 'clicked', 'delivered', 'opened', 'pending', 'sent', 'unsubscribed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `city_whitelist.state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `companies.state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `connection_configs.last_test_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `connection_test_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `contact_behavior.career_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `contact_next_actions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `contacts.relationship_stage` tem valores ['advocate', 'at_risk', 'customer', 'lost', 'loyal_customer', 'negotiation', 'opportunity', 'prospect', 'qualified_lead', 'unknown'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `crm_automation_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `crm_automation_reprocess_queue.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `crm_cadence_rules.relationship_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `crm_consent_audit_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `cs_accounts.lifecycle_stage` tem valores ['adopting', 'at_risk', 'churned', 'mature', 'onboarding'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `cs_qbrs.status` tem valores ['cancelled', 'completed', 'no_show', 'scheduled'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `cs_renewals.status` tem valores ['churned', 'downgraded', 'expanded', 'in_negotiation', 'renewed', 'upcoming'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `csat_surveys.status` tem valores ['answered', 'ces', 'csat', 'custom', 'expired', 'nps', 'pending', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deal_forecasts.stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `deal_room_milestones.status` tem valores ['blocked', 'done', 'in_progress', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deal_rooms.status` tem valores ['active', 'lost', 'paused', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `document_signatures.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `documents.status` tem valores ['active', 'archived', 'draft'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `email_campaigns.status` tem valores ['cancelled', 'draft', 'scheduled', 'sending', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `email_verifications.status` tem valores ['catchall', 'invalid', 'risky', 'unknown', 'valid'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `emotional_anchors.emotional_state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `emotional_states_history.emotional_state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `follow_up_approvals.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `follow_up_approvals_v2.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `forecast_periods.status` tem valores ['closed', 'open'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `forecast_quota_settings.health_weight_stage_age` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `handoff_requests.status` tem valores ['accepted', 'cancelled', 'expired', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `incoming_webhook_dlq.status` tem valores ['abandoned', 'failed', 'pending', 'processing', 'succeeded'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `incoming_webhook_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `incoming_webhook_logs.http_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `interaction_summaries.negotiation_stage_summary` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `lead_assignments.status` tem valores ['active', 'completed', 'expired', 'reassigned'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `lux_intelligence.status` tem valores ['completed', 'error', 'pending', 'processing'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `lux_webhook_config.last_test_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `mcp_tool_calls.status` tem valores ['denied', 'error', 'success'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `mql_classifications.status` tem valores ['customer', 'disqualified', 'mql', 'sql'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `neuro_pnl_sessions.emotional_state_before` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `neuro_pnl_sessions.emotional_state_after` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `notification_logs.delivery_status` tem valores ['pending', 'rejected', 'sent', 'unknown'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `nurturing_enrollments.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nurturing_enrollments.status` tem valores ['active', 'cancelled', 'completed', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `nurturing_executions.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nurturing_executions.status` tem valores ['active', 'cancelled', 'completed', 'failed', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `offer_suggestions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `password_reset_requests.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `phone_validations.status` tem valores ['invalid', 'unknown', 'unreachable', 'valid'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `reframing_analysis.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `revops_snapshots.funnel_stage` tem valores ['customer', 'lead', 'mql', 'opportunity', 'sql', 'visitor'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sales_playbooks.stage_target` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_enrollments.status` tem valores ['active', 'bounced', 'completed', 'paused', 'replied', 'unsubscribed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sequence_enrollments.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_enrollments.last_step_executed_at` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_enrollments.last_step_sent_at` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_events.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_send_log.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_send_log.status` tem valores ['bounced', 'failed', 'sent', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sequence_steps.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequences.status` tem valores ['active', 'archived', 'draft', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `smart_notifications.status` tem valores ['clicked', 'delivered', 'dismissed', 'pending', 'snoozed', 'suppressed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sms_campaign_recipients.status` tem valores ['delivered', 'failed', 'opted_out', 'pending', 'replied', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sms_campaigns.status` tem valores ['draft', 'failed', 'paused', 'scheduled', 'sending', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `social_sync_queue.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `suggested_life_events.status` tem valores ['accepted', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `suggested_rapport_intel.status` tem valores ['approved', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `support_tickets.status` tem valores ['closed', 'in_progress', 'open', 'resolved', 'waiting'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `system_health_snapshots.status` tem valores ['degraded', 'healthy', 'unhealthy'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `validation_queue.status` tem valores ['pending', 'processing', 'done', 'error'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `whatsapp_ingestion_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `whatsapp_instances.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `whatsapp_messages.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `migration_password_reset_log.status` tem valores ['failed', 'pending', 'sent', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deals.status` tem valores ['lost', 'on_hold', 'open', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `pipeline_stage_transitions.from_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `pipeline_stage_transitions.to_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `tasks.status` tem valores ['cancelled', 'completed', 'in_progress', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `ai_gateway_metrics.status` tem valores ['error', 'rate_limited', 'success', 'timeout'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `ai_gateway_metrics.http_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `rodizio_distribuicao_staging.status` tem valores ['APLICADO', 'APROVADO', 'RASCUNHO', 'REJEITADO'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `cidades.estado_ibge` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `company_addresses.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sales.status` tem valores ['cancelled', 'completed', 'discovery', 'lead', 'negotiation', 'pending', 'proposal', 'qualification'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `_dormant.inactivity_alerts.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_email_reservations.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_email_reservations.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- 288/291 tabelas sem `COMMENT ON TABLE` — o significado de negócio não está no schema: `_migration_cdc_checkpoint`, `abm_account_plans`, `abm_accounts`, `abm_buying_committee`, `abm_campaigns`, `abm_whitespace_opportunities`, `access_blocked_log`, `access_security_settings`, `activities`, `ai_chat_messages`, `ai_chat_threads`, `ai_recommendation_audit_logs` …
- Há tabelas usadas no código sem migration no repo — o schema real pode ter sido alterado pelo painel.

## Regras manuais presentes

_nenhuma — copie `manual/TEMPLATE-regras-de-negocio.md`_
