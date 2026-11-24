# 11 · GLOSSÁRIO, DADOS DE REFERÊNCIA E LACUNAS

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `de9c0c7abf` · branch `main` · 2026-11-24 16:38 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Glossário do domínio (entidades do sistema)

| Termo | Significado / valores | Tamanho | Origem |
|---|---|---|---|
| `_dormant.inactivity_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 22 colunas | migration |
| `_fk_orphans` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `_migration_cdc_checkpoint` | _(sem COMMENT ON TABLE — significado não documentado)_ | 2 colunas | migration |
| `_migration_schema_snapshot` | _(sem COMMENT ON TABLE — significado não documentado)_ | 3 colunas | migration |
| `_seq_gap_report` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `_stg_pac_nums` | _(sem COMMENT ON TABLE — significado não documentado)_ | 2 colunas | migration |
| `abm_account_plans` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `abm_accounts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `abm_buying_committee` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `abm_campaigns` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `abm_whitespace_opportunities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `access_blocked_log` | SINGU: Log append-only de bloqueios de acesso (brute force, IP, geo, device). Base para dashboards de segurança. | 16 colunas | migration |
| `access_denied_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `access_security_settings` | SINGU: Config de segurança por usuário (MFA, IP whitelist, device trust, password policy, brute force thresholds). | 19 colunas | migration |
| `achievements` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `active_power_ups` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `active_sessions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `activities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `activity_feed` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `activity_goals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_chat_messages` | SINGU: Mensagens do Ask CRM Chat. Role user/assistant/system/tool. Mensagens assistant podem carregar generated_sql + query_result para auditoria. | 13 colunas | migration |
| `ai_chat_threads` | SINGU: Threads do Ask CRM Chat (IA flutuante para consultar dados em linguagem natural via SQL gerado). Cada thread mantém contexto. | 14 colunas | migration |
| `ai_gateway_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `ai_recommendation_audit_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_recommendation_audit_logs_v2` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_recommendation_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `ai_tone_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `alert_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `applied_objection_responses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `asia_upload_mapping` | Rastreia requisições pg_net para upload de imagens Asia Import ao Cloudflare Images | 8 colunas | migration |
| `attribution_models_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `attribution_touchpoints` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `audit_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `automation_executions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `automation_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `automation_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `automations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `available_spins` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `badges` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `battle_cards` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `battle_participants` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `behavioral_insight_feedback` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `behavioral_profile_regen_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `bitrix24_sync_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `blocked_ips` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `brain_dominance_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `cadence_enrollments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `cadence_steps` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `cadence_tasks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `cadences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `calendar_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `call_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `campaign_members` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `campaign_recipients` | SINGU: Destinatários individuais de email_campaigns com tracking granular (opens, clicks, bounces). | 19 colunas | migration |
| `campaigns` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `canned_responses` | SINGU: Respostas prontas/templates curtos acessíveis por shortcut (/ola, /encerrar, etc). is_shared=true para disponibilizar ao time. | 12 colunas | migration |
| `carrier_evaluations` | Avaliações de transportadoras (append-only). 5 critérios: pontualidade, conservação, preço_frete, rastreamento, cobertura. Notas 1-5. | 13 colunas | migration |
| `carrier_homologations` | Histórico de homologação de transportadoras. Homologador: Logística (Thiago id=80). Status via enum carrier_homologation_status. | 12 colunas | migration |
| `carrier_qualification_config` | Segmentos de classificação de transportadoras (Excelente a Crítico) com faixas de score e ações recomendadas | 13 colunas | migration |
| `carrier_score_history` | Histórico de evolução do score de transportadoras. Append-only, 1 registro por recálculo. | 17 colunas | migration |
| `carrier_scores` | Score consolidado de transportadoras (1 registro por carrier). Recalculado via trigger após cada avaliação. | 17 colunas | migration |
| `carriers` | Transportadoras vinculadas a companies (1:1 via company_id UNIQUE). 112 registros. Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Logística (Thiago id=80). 5 critérios: pontualidade(30%), conservação(25%), preço_frete(20%), cobertura(15%), rastreamento(10%). | 19 colunas | migration |
| `category_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `challenge_progress` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `chat_conversations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `chat_messages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `churn_predictions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `churn_risk_scores` | SINGU: Histórico de scores de risco de churn (análise local, 5 fatores). Espelha feature churn-risk-detection das memories. is_current=true para score atual. | 15 colunas | migration |
| `cidades` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `circuit_breaker_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `city_whitelist` | SINGU: Cidades permitidas (mais granular que country). Para ambientes corporativos restritos. | 8 colunas | migration |
| `client_portfolio` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `client_values` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `clients` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `cnaes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `coaching_scorecards` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `cognitive_bias_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `collectible_badges` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `commission_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `commissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `communication_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `companies` | _(sem COMMENT ON TABLE — significado não documentado)_ | 33 colunas | migration |
| `company_addresses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 24 colunas | migration |
| `company_cadences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `company_cnaes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `company_emails` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `company_phones` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `company_rfm_scores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `company_social_media` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `company_stakeholder_map` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `compatibility_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `compatibility_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `competitive_chat_messages` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `competitive_seasons` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `competitors` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `config_regras_negocio` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `connection_anomalies` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `connection_configs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `connection_quotas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `connection_test_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `connector_log` | Log de cada chamada do evolution-bitrix-connector. Preexistia como referência sem tabela criada — agora existe e dispara trigger que popula zapp_history. | 13 colunas | migration |
| `contact_addresses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 25 colunas | migration |
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
| `contact_next_actions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `contact_notes` | ZAPP WEB: Notas rápidas de contato. Criadas pelo painel Contact 360° durante atendimento. FK contacts(id). | 9 colunas | migration |
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
| `contact_social_media` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `contact_time_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contact_time_analysis_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `contacts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 39 colunas | migration |
| `conversation_analyses` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `conversation_topics_catalog` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `conversational_search_cache` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `coop_sistemas` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
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
| `csat_surveys` | SINGU: Pesquisas de satisfação (CSAT 1-5, NPS 0-10, CES 1-7). Vinculadas opcionalmente a ticket/contact/company. | 16 colunas | migration |
| `custom_field_values` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `custom_fields` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `customer_ownership_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `customer_purchases` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `customer_rotation_state` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `customer_sdr_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `customers` | _(sem COMMENT ON TABLE — significado não documentado)_ | 37 colunas | migration |
| `daily_challenge_progress` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `daily_challenges` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `daily_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `daily_streak_achievements` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `dashboard_layouts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `data_quality_audits` | Registro permanente de auditorias de qualidade de dados por sistema cooperativo | 15 colunas | migration |
| `data_retention_policies` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `deal_chat_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `deal_competitors` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `deal_forecasts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `deal_outcomes` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `deal_room_activities` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `deal_room_comments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `deal_room_documents` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `deal_room_milestones` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `deal_room_stakeholders` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `deal_rooms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `deal_stage_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `deal_velocity_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `deals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `decision_criteria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `demand_forecasts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `device_login_notifications` | SINGU: Notificações enviadas em eventos de login anômalos. Trackeia resposta do usuário (trusted/reported_fraud). | 12 colunas | migration |
| `digital_signatures` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `disc_analysis_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 23 colunas | migration |
| `disc_analysis_history_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `disc_communication_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `disc_conversion_metrics` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `disc_profile_config` | _(sem COMMENT ON TABLE — significado não documentado)_ | 26 colunas | migration |
| `disc_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `document_signatures` | SINGU: Assinaturas eletrônicas de documentos com multi-signer, ordering, tracking completo (IP, device, location) e métodos variados. | 25 colunas | migration |
| `document_signers` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `document_templates` | SINGU: Templates reutilizáveis de documentos (contratos, propostas, NDAs) com variáveis substituíveis. | 14 colunas | migration |
| `document_views` | SINGU: Rastreamento granular de visualizações de documentos (páginas vistas, duração, downloads, geo). | 17 colunas | migration |
| `documents` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `economic_group_members` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `economic_groups` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `email_campaigns` | SINGU: Campanhas de email marketing com Email Builder Visual (blocos), A/B test, agendamento e métricas full-funnel. | 33 colunas | migration |
| `email_finder_results` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `email_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `email_thread_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `email_tracking_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `email_verifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 17 colunas | migration |
| `embedding_configs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `emotional_anchors` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `emotional_states_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `entity_relationships` | Relacionamentos polimórficos entre Empresa/Pessoa com papel (comprador, gerente, proprietário, ...). | 14 colunas | migration |
| `entity_versions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `eq_analysis_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `error_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `estados` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `external_data_audit_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `favorite_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `favorites` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `feature_flags` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `feed_comments` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `feed_reactions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| `ficha360_conversation_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `follow_up_approvals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `follow_up_approvals_v2` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `forecast_categories_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `forecast_periods` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `forecast_quota_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `forecast_snapshots` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `form_submissions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `forms` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `geo_allowed_countries` | SINGU: Países permitidos por usuário (ISO 3166-1 alpha-2). Usado se access_security_settings.geo_restriction_enabled=true. | 6 colunas | migration |
| `grupos_economicos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `guardrail_ml_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `handoff_requests` | SINGU: Fila de handoff SDR→Closer com qualificação BANT (Budget/Authority/Need/Timing), SLA de aceite de 4h (configurável) e tracking completo. Estados: pending → accepted/rejected/expired. | 26 colunas | migration |
| `health_alert_settings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `health_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `hidden_objections` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `icp_data` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `inactivity_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `incoming_webhook_dlq` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `incoming_webhook_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `incoming_webhook_nonces` | _(sem COMMENT ON TABLE — significado não documentado)_ | 4 colunas | migration |
| `incoming_webhooks` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `insights` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `integrations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `intent_scores` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `intent_signals` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `intent_tracking_pixels` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `interaction_summaries` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `interaction_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `interactions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 26 colunas | migration |
| `interactions_audit` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `inventory_levels` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `ip_whitelist` | SINGU: IPs/CIDRs permitidos por usuário. Usado se access_security_settings.ip_whitelist_enabled=true. | 12 colunas | migration |
| `knowledge_base_articles` | SINGU: Artigos da base de conhecimento público/interno. search_vector para busca full-text. Workflow draft→published→archived. | 19 colunas | migration |
| `known_devices` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `kudos` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `lalamove_dead_letter` | LALAMOVE PLUS: Eventos webhook sem match no B24 para reprocessamento | 9 colunas | migration |
| `lalamove_drivers` | LALAMOVE PLUS: Histórico de motoristas com service_times e avg_rating | 14 colunas | migration |
| `lalamove_position_log` | LALAMOVE PLUS: Posições do motorista em tempo real para proximidade e parada | 14 colunas | migration |
| `lalamove_route_cache` | LALAMOVE PLUS: Cache de rotas esperadas para detecção fora da rota | 10 colunas | migration |
| `landing_page_submissions` | SINGU: Submissões capturadas via landing pages com UTMs, geolocalização e anti-spam scoring. | 26 colunas | migration |
| `landing_pages` | SINGU: Landing pages (rota pública /lp/:slug) com builder visual, captura de leads e UTMs. Mem: features/landing-pages-module. | 25 colunas | migration |
| `lead_assignments` | SINGU: Histórico completo de atribuições de leads. Cada atribuição (automática via regra, manual, ou handoff SDR→Closer) gera um registro com SLA tracking, status e motivo de rejeição se aplicável. Append-only via convenção. | 21 colunas | migration |
| `lead_magnet_downloads` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `lead_magnets` | _(sem COMMENT ON TABLE — significado não documentado)_ | 16 colunas | migration |
| `lead_routing_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `lead_routing_rules` | SINGU: Regras configuráveis de roteamento de leads (round-robin, ponderado, por território/indústria/fonte). Prioridade define ordem de avaliação. role_filter e team_pool definem o universo elegível. | 16 colunas | migration |
| `lead_score_config` | SINGU: Config de pesos e thresholds do lead scoring por usuário. Soma dos 4 pesos = 1.00. Thresholds ordenados crescente. | 16 colunas | migration |
| `lead_score_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `lead_score_recompute_queue` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `lead_score_rules` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `lead_score_threshold_automations` | _(sem COMMENT ON TABLE — significado não documentado)_ | 15 colunas | migration |
| `lead_score_threshold_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `lead_score_thresholds` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `lead_scores` | SINGU: Score atual de lead por contato. 4 dimensões ponderadas (Engagement 30%, Fit 20%, Intent 25%, Relationship 25%). Grade automática. 1 registro por contato. Série temporal em lead_score_history. | 19 colunas | migration |
| `lead_sources` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `life_events` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `life_events_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `login_alerts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `login_attempts` | SINGU: Log de TODAS as tentativas de login (success=true/false) para detecção de brute force via query nos últimos N minutos. | 14 colunas | migration |
| `loss_reasons` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `lux_intelligence` | _(sem COMMENT ON TABLE — significado não documentado)_ | 21 colunas | migration |
| `lux_webhook_config` | SINGU: Configurações de webhooks do módulo Lux Intelligence. Cada linha = 1 endpoint n8n/externo para enriquecimento profundo (redes sociais, CNPJ, LinkedIn). Inclui auth, retry exponencial, rate limiting e estatísticas. Admin UI: /admin/lux-config. | 31 colunas | migration |
| `marketing_campaign_stats` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `marketing_roi_data` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `mcp_tool_calls` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `meeting_summaries` | SINGU: Resumos de reuniões gerados por IA. Edge Function meeting-summary extrai decisões, action items, participantes e next steps de transcript/audio/video. | 26 colunas | migration |
| `meetings` | _(sem COMMENT ON TABLE — significado não documentado)_ | 18 colunas | migration |
| `message_templates` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `metaprogram_analysis` | _(sem COMMENT ON TABLE — significado não documentado)_ | 19 colunas | migration |
| `mfa_verification_attempts` | _(sem COMMENT ON TABLE — significado não documentado)_ | 6 colunas | migration |
| `migration_password_reset_log` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `model_pricing_v2` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `mql_classifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `mql_criteria` | _(sem COMMENT ON TABLE — significado não documentado)_ | 11 colunas | migration |
| `neuro_behavioral_history` | _(sem COMMENT ON TABLE — significado não documentado)_ | 8 colunas | migration |
| `neuro_pnl_sessions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 13 colunas | migration |
| `nlp_extractions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 12 colunas | migration |
| `nlp_feedback` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `notification_logs` | _(sem COMMENT ON TABLE — significado não documentado)_ | 7 colunas | migration |
| `notification_preferences` | _(sem COMMENT ON TABLE — significado não documentado)_ | 10 colunas | migration |
| `notifications` | _(sem COMMENT ON TABLE — significado não documentado)_ | 9 colunas | migration |
| `nurturing_enrollments` | SINGU: Contatos em workflows de nurturing. Context carrega estado entre steps. | 12 colunas | migration |
| `nurturing_executions` | _(sem COMMENT ON TABLE — significado não documentado)_ | 14 colunas | migration |
| `nurturing_workflows` | SINGU: Fluxos de nutrição long-term (mais complexos que sequences). Trigger-based (score/segment/inactivity/event). | 14 colunas | migration |
| `oauth_tokens` | _(sem COMMENT ON TABLE — significado não documentado)_ | 5 colunas | migration |
| … +460 linhas — lista completa em `context.json` | | | |

## Dados de referência (seed — planos, categorias, perfis fixos)

_nenhum item encontrado_

## Auditoria de consistência (código × schema) — trate como NÃO VERIFICADO

> `status`: inclui estados só de UI/realtime (ex.: `uploading`, `SUBSCRIBED`) que nunca vão ao banco — confira o arquivo antes de concluir que falta valor no enum.

| Tipo | Problema | Onde |
|---|---|---|
| status | valor `queued` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/admin/conexoes/IncomingWebhookLogsDialog.tsx` |
| status | valor `ganho` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/contact-detail/commercial-tab/DealsCard.tsx`<br>`compara:src/hooks/useDealsAtRisk.ts`<br>`compara:src/hooks/useReportWidgets.ts` |
| status | valor `reprocessing` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/CRMAutomationAuditLog.tsx`<br>`escreve:src/components/crm/CRMAutomationAuditLog.tsx` |
| status | valor `presented` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/commercial/OfferSuggestionsElite.tsx`<br>`escreve:src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| status | valor `granted` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/consent/ConsentAuditLog.tsx` |
| status | valor `Inativo` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/components/crm/copywriting/PerformanceHistory.tsx` |
| status | valor `Ativo` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/crm/copywriting/PerformanceHistory.tsx`<br>`escreve:src/components/crm/copywriting/PerformanceHistory.tsx` |
| status | valor `answered` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/csat/CSATPanel.tsx`<br>`compara:src/hooks/useCSATSurveys.ts`<br>`compara:src/hooks/useNpsSurveys.ts`<br>`compara:src/pages/NPS.tsx` |
| status | valor `fulfilled` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/enrichment/ValidateAllButton.tsx`<br>`compara:src/hooks/useMarkObjectionHandled.ts`<br>`compara:supabase/functions/process-behavioral-regen-queue/index.ts`<br>`compara:supabase/functions/sequence-processor/index.ts` |
| status | valor `loading` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/feedback/LoadingStates.tsx` |
| status | valor `online` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/micro-interactions/StatusIndicators.tsx`<br>`compara:src/components/pwa/NetworkComponents.tsx`<br>`escreve:src/components/micro-interactions/StatusIndicators.tsx` |
| status | valor `used` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/nlp/SleightOfMouthPanel.tsx`<br>`escreve:src/components/nlp/SleightOfMouthPanel.tsx` |
| status | valor `offline` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/components/pwa/NetworkComponents.tsx` |
| status | valor `unverified` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/use2FA.ts` |
| status | valor `overdue` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:src/hooks/useContactCadence.ts` |
| status | valor `on_track` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useContactCadence.ts` |
| status | valor `perdido` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDealsAtRisk.ts`<br>`compara:src/hooks/useReportWidgets.ts` |
| status | valor `declined` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:src/hooks/useDocumentTemplates.ts`<br>`compara:src/pages/PublicSignaturePage.tsx`<br>`escreve:src/hooks/useDocumentTemplates.ts`<br>`escreve:supabase/functions/submit-signature/index.ts` |
| status | valor `ignored` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`escreve:supabase/functions/bitrix24-webhook/index.ts`<br>`escreve:supabase/functions/evolution-webhook/events.ts`<br>`escreve:supabase/functions/evolution-webhook/index.ts` |
| status | valor `logged` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`escreve:supabase/functions/evolution-webhook/events.ts` |
| status | valor `recebida` para `status` usado no código não existe em nenhum enum do banco/TS | `escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts` |
| status | valor `READ` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/evolution-webhook/messages.ts`<br>`escreve:supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`escreve:supabase/functions/_shared/evolution-ownership-contract_test.ts` |
| status | valor `fechado` para `status` usado no código não existe em nenhum enum do banco/TS | `compara:supabase/functions/abm-account-scorer/index.ts` |
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
| coluna | coluna `metaprogram_profile` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `objection_patterns` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `status` usada no código não existe no schema de `contacts` |  |
| coluna | coluna `difference_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `general_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `proactive_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `reactive_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `sameness_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `specific_score` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `user_feedback` usada no código não existe no schema de `metaprogram_analysis` |  |
| coluna | coluna `average_order_value` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `churn_probability` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `communication_priority` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `days_since_last_interaction` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `frequency_trend` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `monetary_trend` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `overall_trend` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `predicted_lifetime_value` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `predicted_next_purchase_date` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `recency_trend` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `recommended_offers` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `segment` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `segment_color` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `segment_description` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `total_interactions` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `total_monetary_value` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `total_purchases` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `total_score` usada no código não existe no schema de `rfm_analysis` |  |
| coluna | coluna `assunto` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `direction` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `duracao_segundos` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `metadata` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `outcome` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `resumo` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `tipo` usada no código não existe no schema de `interactions` |  |
| coluna | coluna `language_complexity_score` usada no código não existe no schema de `neuro_behavioral_history` |  |
| coluna | coluna `response_synchronicity` usada no código não existe no schema de `neuro_behavioral_history` |  |
| coluna | coluna `auditory_words` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `digital_words` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `kinesthetic_words` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `user_feedback` usada no código não existe no schema de `vak_analysis_history` |  |
| coluna | coluna `resolution_summary` usada no código não existe no schema de `contact_automation_settings` |  |
| coluna | coluna `user_id` usada no código não existe no schema de `contact_predictive_roadmap` |  |
| coluna | coluna `updated_at` usada no código não existe no schema de `crm_objection_intelligence` |  |
| coluna | coluna `enable_device_detection` usada no código não existe no schema de `access_security_settings` |  |
| coluna | coluna `enable_geo_blocking` usada no código não existe no schema de `access_security_settings` |  |
| coluna | coluna `max_sessions` usada no código não existe no schema de `access_security_settings` |  |
| coluna | coluna `notify_new_device` usada no código não existe no schema de `access_security_settings` |  |
| coluna | coluna `archived` usada no código não existe no schema de `ai_chat_threads` |  |
| coluna | coluna `context_entity_id` usada no código não existe no schema de `ai_chat_threads` |  |
| coluna | coluna `pinned` usada no código não existe no schema de `ai_chat_threads` |  |
| coluna | coluna `based_on_count` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `model` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `summary` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `tone` usada no código não existe no schema de `contact_analytical_profiles` |  |
| coluna | coluna `answered_at` usada no código não existe no schema de `csat_surveys` |  |
| coluna | coluna `expires_at` usada no código não existe no schema de `csat_surveys` |  |
| coluna | coluna `public_token` usada no código não existe no schema de `csat_surveys` |  |
| coluna | coluna `status` usada no código não existe no schema de `csat_surveys` |  |
| coluna | coluna `updated_at` usada no código não existe no schema de `csat_surveys` |  |
| coluna | coluna `analyzed_at` usada no código não existe no schema de `churn_risk_scores` |  |
| coluna | coluna `days_since_last_interaction` usada no código não existe no schema de `churn_risk_scores` |  |
| coluna | coluna `recommendations` usada no código não existe no schema de `churn_risk_scores` |  |
| coluna | coluna `score_trend` usada no código não existe no schema de `churn_risk_scores` |  |
| coluna | coluna `sentiment_trend` usada no código não existe no schema de `churn_risk_scores` |  |
| coluna | coluna `discovered_at` usada no código não existe no schema de `connection_configs` |  |
| coluna | coluna `content_html` usada no código não existe no schema de `document_templates` |  |
| coluna | coluna `merge_fields` usada no código não existe no schema de `document_templates` |  |
| coluna | coluna `company_id` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `contact_id` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `declined_at` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `merge_data` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `rendered_html` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `signature_token` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `signature_typed` usada no código não existe no schema de `document_signatures` |  |
| coluna | coluna `file_name` usada no código não existe no schema de `documents` |  |
| coluna | coluna `file_type` usada no código não existe no schema de `documents` |  |
| coluna | coluna `content_text` usada no código não existe no schema de `email_campaigns` |  |
| coluna | coluna `tags` usada no código não existe no schema de `email_campaigns` |  |
| coluna | coluna `scheduled_at` usada no código não existe no schema de `follow_up_approvals_v2` |  |
| coluna | coluna `check_frequency_hours` usada no código não existe no schema de `health_alert_settings` |  |
| coluna | coluna `replay_window_seconds` usada no código não existe no schema de `incoming_webhooks` |  |
| coluna | coluna `require_signature` usada no código não existe no schema de `incoming_webhooks` |  |
| coluna | coluna `views_count` usada no código não existe no schema de `knowledge_base_articles` |  |
| coluna | coluna `is_published` usada no código não existe no schema de `landing_pages` |  |
| coluna | coluna `submission_count` usada no código não existe no schema de `landing_pages` |  |
| coluna | coluna `theme` usada no código não existe no schema de `landing_pages` |  |
| coluna | coluna `view_count` usada no código não existe no schema de `landing_pages` |  |
| coluna | coluna `email` usada no código não existe no schema de `landing_page_submissions` |  |
| coluna | coluna `name` usada no código não existe no schema de `landing_page_submissions` |  |
| coluna | coluna `phone` usada no código não existe no schema de `landing_page_submissions` |  |
| coluna | coluna `last_calculated_at` usada no código não existe no schema de `lead_scores` |  |
| coluna | coluna `factors` usada no código não existe no schema de `lead_score_history` |  |
| coluna | coluna `headers` usada no código não existe no schema de `lux_webhook_config` |  |
| coluna | coluna `last_test_at` usada no código não existe no schema de `lux_webhook_config` |  |
| coluna | coluna `last_test_status` usada no código não existe no schema de `lux_webhook_config` |  |
| coluna | coluna `max_retries` usada no código não existe no schema de `lux_webhook_config` |  |
| coluna | coluna `timeout_ms` usada no código não existe no schema de `lux_webhook_config` |  |
| coluna | coluna `generated_by_model` usada no código não existe no schema de `meeting_summaries` |  |
| coluna | coluna `sentiment_overview` usada no código não existe no schema de `meeting_summaries` |  |
| coluna | coluna `topics` usada no código não existe no schema de `meeting_summaries` |  |
| coluna | coluna `completed_at` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `completion_notes` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `contextual_tone` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `was_successful` usada no código não existe no schema de `contact_next_actions` |  |
| coluna | coluna `completed_count` usada no código não existe no schema de `nurturing_workflows` |  |
| coluna | coluna `enrolled_count` usada no código não existe no schema de `nurturing_workflows` |  |
| coluna | coluna `steps` usada no código não existe no schema de `nurturing_workflows` |  |
| coluna | coluna `approved_by` usada no código não existe no schema de `password_reset_requests` |  |
| coluna | coluna `created_at` usada no código não existe no schema de `password_reset_requests` |  |
| coluna | coluna `reason` usada no código não existe no schema de `password_reset_requests` |  |
| coluna | coluna `resolved_at` usada no código não existe no schema de `password_reset_requests` |  |
| coluna | coluna `stage` usada no código não existe no schema de `deals` |  |
| coluna | coluna `branch_on_no_step` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `branch_on_yes_step` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `condition_wait_hours` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `message_template` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `notes` usada no código não existe no schema de `sequence_steps` |  |
| coluna | coluna `max_enrollments` usada no código não existe no schema de `sequences` |  |
| coluna | coluna `pause_on_meeting` usada no código não existe no schema de `sequences` |  |
| coluna | coluna `total_completed` usada no código não existe no schema de `sequences` |  |
| coluna | coluna `total_replied` usada no código não existe no schema de `sequences` |  |
| coluna | coluna `cost_estimate_cents` usada no código não existe no schema de `sms_campaigns` |  |
| coluna | coluna `cost_cents` usada no código não existe no schema de `sms_campaign_recipients` |  |
| coluna | coluna `error_message` usada no código não existe no schema de `sms_campaign_recipients` |  |
| coluna | coluna `replied_at` usada no código não existe no schema de `sms_campaign_recipients` |  |
| coluna | coluna `sla_deadline` usada no código não existe no schema de `support_tickets` |  |
| coluna | coluna `manager_id` usada no código não existe no schema de `sales_team_members` |  |
| coluna | coluna `name` usada no código não existe no schema de `sales_team_members` |  |
| coluna | coluna `territories` usada no código não existe no schema de `sales_team_members` |  |
| coluna | coluna `claim_token` usada no código não existe no schema de `validation_queue` |  |
| coluna | coluna `check_in_at` usada no código não existe no schema de `visit_checkins` |  |
| coluna | coluna `check_out_at` usada no código não existe no schema de `visit_checkins` |  |
| coluna | coluna `visit_type` usada no código não existe no schema de `visit_checkins` |  |
| coluna | coluna `unique_contacts` usada no código não existe no schema de `whatsapp_kpis` |  |
| coluna | coluna `is_active` usada no código não existe no schema de `competitors` |  |
| coluna | coluna `metadata` usada no código não existe no schema de `competitors` |  |
| coluna | coluna `claim_expires_at` usada no código não existe no schema de `notification_logs` |  |
| coluna | coluna `claim_token` usada no código não existe no schema de `notification_logs` |  |
| tabela | tabela `__proto__` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `a` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs` |
| tabela | tabela `alfa` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `anexos` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `com_rls` usada no código não existe nas migrations/types do repo | `scripts/inventario/banco.test.mjs`<br>`scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `constructor` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-banco.test.mjs` |
| tabela | tabela `contact_fone` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `contacts_extra` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-repo.test.mjs` |
| tabela | tabela `customer_health_scores` usada no código não existe nas migrations/types do repo | `src/pages/mapa/relationshipScores.ts` |
| tabela | tabela `dashboard_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `emails` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs`<br>`scripts/inventario/gerar-repo.test.mjs` |
| tabela | tabela `fantasma` usada no código não existe nas migrations/types do repo | `scripts/ai-context/cenarios.mjs`<br>`scripts/audit-ausentes.test.mjs` |
| tabela | tabela `fixture_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `ghost_table` usada no código não existe nas migrations/types do repo | `scripts/ai-context/gerar.unit.mjs` |
| tabela | tabela `grande` usada no código não existe nas migrations/types do repo | `scripts/inventario/banco.test.mjs` |
| tabela | tabela `logs` usada no código não existe nas migrations/types do repo | `supabase/functions/_shared/best-effort-write_test.ts` |
| tabela | tabela `nao_conta_js` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| tabela | tabela `nunca_conta` usada no código não existe nas migrations/types do repo | `scripts/inventario/gerar-edge-tabela.test.mjs` |
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
| tabela | tabela `vw_churn_risk_ranking` usada no código não existe nas migrations/types do repo | `src/hooks/useReportWidgets.ts` |
| tabela | tabela `vw_communication_dashboard` usada no código não existe nas migrations/types do repo | `src/hooks/useNLPClosingProbability.ts` |
| tabela | tabela `x` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.mjs`<br>`scripts/audit-ausentes.test.mjs`<br>`scripts/diff-tables.mjs`<br>`scripts/inventario/gerar-edge-tabela.mjs` |
| tabela | tabela `zeta` usada no código não existe nas migrations/types do repo | `scripts/audit-ausentes.test.mjs` |
| rls | `config_regras_negocio`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useRodizioEquipe.ts` |
| rls | `crm_automation_logs`: front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| rls | `crm_automation_reprocess_queue`: front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| rls | `neuro_behavioral_history`: front faz SELECT mas nenhuma política RLS permite SELECT → vai falhar/retornar vazio para usuários | `src/components/contact-detail/NeuroEvolutionChart.tsx`<br>`src/components/crm/behavior/NeuromarketingTimeline.tsx`<br>`src/hooks/useUnifiedTimeline.ts` |
| rls | `rodizio_distribuicao_staging`: RLS ligado sem nenhuma política → só service_role acessa | `src/hooks/useRodizioOndas.ts` |
| rls | `territories`: acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useTerritories.ts` |
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
| … +54 linhas — lista completa em `context.json` | | |

## Lacunas — o que este contexto NÃO consegue responder (perguntas para o dono do negócio)

- Nenhuma regra manual em `manual/`: prazos, limites, exceções comerciais, quem aprova o quê — só o negócio sabe.
- `abm_account_plans.status` tem valores ['active', 'archived', 'completed', 'draft'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `abm_accounts.status` tem valores ['active', 'closed_lost', 'closed_won', 'nurture', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `abm_campaigns.status` tem valores ['active', 'archived', 'completed', 'draft', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `abm_whitespace_opportunities.status` tem valores ['dismissed', 'identified', 'lost', 'pursuing', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `call_logs.status` tem valores ['busy', 'completed', 'failed', 'missed', 'no-answer'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `campaign_recipients.status` tem valores ['bounced', 'clicked', 'complained', 'delivered', 'failed', 'opened', 'pending', 'sent', 'unsubscribed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
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
- `deal_forecasts.stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `deal_room_milestones.status` tem valores ['blocked', 'done', 'in_progress', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deal_rooms.status` tem valores ['active', 'lost', 'paused', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `document_signatures.status` tem valores ['cancelled', 'expired', 'pending', 'rejected', 'sent', 'signed', 'viewed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `documents.status` tem valores ['active', 'archived', 'draft'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `email_campaigns.status` tem valores ['cancelled', 'draft', 'failed', 'paused', 'scheduled', 'sending', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
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
- `interactions.status` tem valores ['agendado', 'cancelado', 'concluido', 'pendente'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `knowledge_base_articles.status` tem valores ['archived', 'draft', 'published'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `landing_pages.status` tem valores ['archived', 'draft', 'published'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `lead_assignments.status` tem valores ['accepted', 'active', 'completed', 'expired', 'reassigned', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `lead_assignments.sla_status` tem valores ['breached', 'na', 'warning', 'within'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `lux_intelligence.status` tem valores ['completed', 'error', 'pending', 'processing'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `mcp_tool_calls.status` tem valores ['denied', 'error', 'success'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `mql_classifications.status` tem valores ['customer', 'disqualified', 'mql', 'sql'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `neuro_pnl_sessions.emotional_state_before` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `neuro_pnl_sessions.emotional_state_after` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `notification_logs.delivery_status` tem valores ['pending', 'rejected', 'sent', 'unknown'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `nurturing_enrollments.status` tem valores ['active', 'cancelled', 'completed', 'failed', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `nurturing_enrollments.current_step_index` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nurturing_enrollments.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nurturing_executions.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `nurturing_executions.status` tem valores ['active', 'cancelled', 'completed', 'failed', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `offer_suggestions.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `phone_validations.status` tem valores ['invalid', 'unknown', 'unreachable', 'valid'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `reframing_analysis.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `revops_snapshots.funnel_stage` tem valores ['customer', 'lead', 'mql', 'opportunity', 'sql', 'visitor'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sales_playbooks.stage_target` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_enrollments.status` tem valores ['active', 'cancelled', 'completed', 'failed', 'meeting_booked', 'paused', 'replied'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sequence_enrollments.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_enrollments.last_step_completed_at` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_enrollments.last_step_sent_at` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_events.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_send_log.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_send_log.status` tem valores ['bounced', 'failed', 'sent', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sequence_steps.step_number` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_steps.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequences.status` tem valores ['active', 'archived', 'draft', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `smart_notifications.status` tem valores ['clicked', 'delivered', 'dismissed', 'pending', 'snoozed', 'suppressed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sms_campaign_recipients.status` tem valores ['delivered', 'failed', 'opted_out', 'pending', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sms_campaigns.status` tem valores ['cancelled', 'draft', 'failed', 'paused', 'scheduled', 'sending', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `social_sync_queue.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `suggested_life_events.status` tem valores ['accepted', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `suggested_rapport_intel.status` tem valores ['approved', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `support_tickets.status` tem valores ['cancelled', 'closed', 'in_progress', 'open', 'resolved', 'waiting_customer', 'waiting_internal'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `system_health_snapshots.status` tem valores ['degraded', 'healthy', 'unhealthy'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `validation_queue.status` tem valores ['pending', 'processing', 'done', 'error'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `whatsapp_ingestion_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `whatsapp_instances.status` tem valores ['connected', 'connecting', 'disconnected', 'error', 'qr_code'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `whatsapp_messages.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `migration_password_reset_log.status` tem valores ['failed', 'pending', 'sent', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `calendar_events.status` tem valores ['cancelled', 'completed', 'confirmed', 'scheduled', 'tentative'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `campaigns.status` tem valores ['active', 'archived', 'cancelled', 'completed', 'draft', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `commissions.status` tem valores ['approved', 'cancelled', 'paid', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `company_addresses.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `deal_competitors.status` tem valores ['competing', 'lost_to', 'won_against'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deal_velocity_analysis.stage_velocity` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `deal_velocity_analysis.bottleneck_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `interaction_templates.for_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `meetings.status` tem valores ['cancelled', 'completed', 'confirmed', 'no_show', 'scheduled'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `proposals.status` tem valores ['aceita', 'enviada', 'expirada', 'rascunho', 'rejeitada', 'visualizada'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `relationship_score_history.stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `relationship_score_history.previous_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `scheduled_visits.status` tem valores ['cancelled', 'completed', 'no_show', 'rescheduled', 'scheduled'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sync_log.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `cadence_enrollments.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `cadence_enrollments.status` tem valores ['active', 'bounced', 'completed', 'opted_out', 'paused', 'replied'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `campaign_members.status` tem valores ['active', 'bounced', 'completed', 'opted_out', 'pending', 'unsubscribed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `company_cadences.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `company_cadences.status` tem valores ['active', 'archived', 'completed', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `contact_addresses.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `stg_portal_sicoob.match_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `stg_bcb_sicoob.match_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `stg_site_sicoob_pacs.match_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sales.status` tem valores ['cancelled', 'completed', 'discovery', 'lead', 'negotiation', 'pending', 'proposal', 'qualification'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `products.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `deal_stage_history.stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `playbooks.stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sales_tasks.status` tem valores ['pending', 'in_progress', 'completed', 'cancelled'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `cadence_steps.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `prospect_cadences.status` tem valores ['active', 'cancelled', 'completed', 'paused'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `prospect_cadences.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `cadence_tasks.status` tem valores ['completed', 'pending', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `sales_battles.status` tem valores ['active', 'completed', 'upcoming'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `competitive_seasons.status` tem valores ['active', 'completed', 'upcoming'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `weekly_matchups.status` tem valores ['active', 'completed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `tournaments.status` tem valores ['active', 'cancelled', 'completed', 'registration'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `tournament_participants.status` tem valores ['active', 'eliminated', 'runner_up', 'winner'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `tournament_matches.status` tem valores ['active', 'completed', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `performance_bets.status` tem valores ['active', 'cancelled', 'lost', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `reauthentication_requests.status` tem valores ['expired', 'failed', 'pending', 'verified'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `webauthn_credentials.backup_state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `password_reset_requests.status` tem valores ['approved', 'expired', 'pending', 'rejected'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `client_portfolio.status` tem valores ['active', 'inactive'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `bitrix24_sync_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `email_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `quotes.status` tem valores ['approved', 'draft', 'expired', 'rejected', 'sent'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `quote_sync_logs.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `supplier_orders.status` tem valores ['cancelled', 'confirmed', 'delivered', 'pending', 'shipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `digital_signatures.status` tem valores ['draft', 'expired', 'pending', 'rejected', 'signed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `document_signers.status` tem valores ['pending', 'rejected', 'signed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `stg_pesquisa_singulares.situacao_cadastral_rfb` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `stg_pesquisa_singulares.status_pesquisa` tem valores ['CLONE_MERGEADO', 'CNPJ_TERCEIRO', 'INCORPORADA', 'INVESTIGAR', 'PAC_DISFARÇADO', 'RECLASSIFICADO', 'SINGULAR_LEGÍTIMA'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `data_quality_audits.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `staging_portal_sicoob.estado` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `supplier_homologations.status` tem valores ['pendente', 'em_analise', 'homologado', 'reprovado', 'suspenso', 'vencido'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `carrier_homologations.status` tem valores ['pendente', 'em_analise', 'homologado', 'reprovado', 'suspenso', 'vencido'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.whatsapp_connections.status` tem valores ['banned', 'connected', 'connecting', 'disconnected', 'error', 'qr_pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.conversations.status` tem valores ['archived', 'closed', 'open', 'pending', 'resolved', 'spam'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.messages.embedding_status` tem valores ['done', 'failed', 'pending', 'processing', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.messages.delivery_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `zapp_history.messages.funnel_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `zapp_history.messages.journey_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `zapp_history.messages.emotional_state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `zapp_history.messages.relationship_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `zapp_history.message_media.download_status` tem valores ['downloaded', 'downloading', 'expired', 'failed', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.message_audio.transcription_status` tem valores ['done', 'failed', 'pending', 'processing', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.message_links.fetch_status` tem valores ['blocked', 'done', 'failed', 'fetching', 'pending', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `zapp_history.async_request_log.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `zapp_history.location_dictionary.state` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `singu_migration._checklist.step_number` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `singu_migration._checklist.step_name` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `singu_migration._checklist.status` tem valores ['done', 'error', 'in_progress', 'pending', 'skipped'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deals.status` tem valores ['lost', 'on_hold', 'open', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `deals.pipeline_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `pipeline_stage_transitions.from_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `pipeline_stage_transitions.to_stage` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sm_upload_mapping.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `xbz_upload_mapping.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `asia_upload_mapping.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `tasks.status` tem valores ['cancelled', 'completed', 'in_progress', 'pending'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `inactivity_alerts.status` tem valores ['active', 'dismissed', 'resolved', 'snoozed'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `automation_executions.status` tem valores ['cancelled', 'completed', 'failed', 'pending', 'running'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `integrations.sync_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sales_opportunities.status` tem valores ['identified', 'lost', 'negotiation', 'on_hold', 'proposal', 'qualified', 'won'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `ai_gateway_metrics.status` tem valores ['error', 'rate_limited', 'success', 'timeout'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `ai_gateway_metrics.http_status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `rodizio_distribuicao_staging.status` tem valores ['APLICADO', 'APROVADO', 'RASCUNHO', 'REJEITADO'] mas nenhum mapa de transições foi encontrado no código — a ordem permitida (ex.: pago → cancelado?) não está declarada.
- `cidades.estado_ibge` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `_dormant.inactivity_alerts.status` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_email_reservations.current_step` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- `sequence_email_reservations.step_order` é uma coluna de status sem enum/CHECK — os valores válidos e as transições permitidas não estão no banco.
- 422/502 tabelas sem `COMMENT ON TABLE` — o significado de negócio não está no schema: `_migration_cdc_checkpoint`, `abm_account_plans`, `abm_accounts`, `abm_buying_committee`, `abm_campaigns`, `abm_whitespace_opportunities`, `activities`, `ai_recommendation_audit_logs`, `ai_recommendation_audit_logs_v2`, `ai_recommendation_logs`, `ai_tone_preferences`, `alerts` …
- Há tabelas usadas no código sem migration no repo — o schema real pode ter sido alterado pelo painel.

## Regras manuais presentes

_nenhuma — copie `manual/TEMPLATE-regras-de-negocio.md`_
