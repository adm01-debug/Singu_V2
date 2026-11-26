# Tabelas

Um arquivo por tabela em `tables/<schema>/<tabela>.md` (colunas, constraints, índices, RLS/policies, triggers, grants). Métricas de volume em `stats.md`.

| tabela | tipo | RLS | policies | colunas | realtime | comentário |
|---|---|---|---|---|---|---|
| [_dormant.access_denied_logs](tables/dormant/access_denied_logs.md) | table | não | 0 | 9 | não |  |
| [_dormant.active_power_ups](tables/dormant/active_power_ups.md) | table | não | 0 | 7 | não |  |
| [_dormant.active_sessions](tables/dormant/active_sessions.md) | table | não | 0 | 12 | não |  |
| [_dormant.activity_goals](tables/dormant/activity_goals.md) | table | sim | 1 | 9 | não |  |
| [_dormant.activity_log](tables/dormant/activity_log.md) | table | não | 0 | 12 | não | Log de auditoria de todas as ações no sistema |
| [_dormant.alert_log](tables/dormant/alert_log.md) | table | não | 0 | 10 | não | Log de alertas disparados |
| [_dormant.alertas_inativacao](tables/dormant/alertas_inativacao.md) | table | não | 0 | 21 | não | Alertas de risco de inativação de clientes |
| [_dormant.api_usage_log](tables/dormant/api_usage_log.md) | table | sim | 1 | 15 | não | SINGU: Log de consumo de APIs externas |
| [_dormant.automation_logs](tables/dormant/automation_logs.md) | table | sim | 4 | 9 | não |  |
| [_dormant.automation_rules](tables/dormant/automation_rules.md) | table | sim | 4 | 14 | não |  |
| [_dormant.available_spins](tables/dormant/available_spins.md) | table | não | 0 | 6 | não |  |
| [_dormant.battle_participants](tables/dormant/battle_participants.md) | table | não | 0 | 7 | não |  |
| [_dormant.bitrix24_sync_logs](tables/dormant/bitrix24_sync_logs.md) | table | não | 0 | 11 | não |  |
| [_dormant.blocked_ips](tables/dormant/blocked_ips.md) | table | não | 0 | 10 | não |  |
| [_dormant.cadence_steps](tables/dormant/cadence_steps.md) | table | não | 0 | 9 | não |  |
| [_dormant.cadence_tasks](tables/dormant/cadence_tasks.md) | table | não | 0 | 8 | não |  |
| [_dormant.cadences](tables/dormant/cadences.md) | table | sim | 1 | 6 | não |  |
| [_dormant.carrier_contacts](tables/dormant/carrier_contacts.md) | table | não | 0 | 10 | não |  |
| [_dormant.category_metrics](tables/dormant/category_metrics.md) | table | sim | 1 | 5 | não |  |
| [_dormant.challenge_progress](tables/dormant/challenge_progress.md) | table | não | 0 | 8 | não |  |
| [_dormant.chat_conversations](tables/dormant/chat_conversations.md) | table | não | 0 | 5 | não |  |
| [_dormant.chat_messages](tables/dormant/chat_messages.md) | table | não | 0 | 8 | não |  |
| [_dormant.circuit_breaker_events](tables/dormant/circuit_breaker_events.md) | table | não | 0 | 6 | não |  |
| [_dormant.client_portfolio](tables/dormant/client_portfolio.md) | table | não | 0 | 10 | não |  |
| [_dormant.client_values](tables/dormant/client_values.md) | table | sim | 4 | 11 | não |  |
| [_dormant.closing_moment_analysis](tables/dormant/closing_moment_analysis.md) | table | não | 0 | 26 | não | Análise do melhor momento para fechamento |
| [_dormant.cognitive_bias_history](tables/dormant/cognitive_bias_history.md) | table | sim | 4 | 13 | não |  |
| [_dormant.cognitive_biases](tables/dormant/cognitive_biases.md) | table | sim | 1 | 12 | não | SINGU: Vieses cognitivos detectados por contato |
| [_dormant.collectible_badges](tables/dormant/collectible_badges.md) | table | sim | 1 | 10 | não |  |
| [_dormant.communication_cadence](tables/dormant/communication_cadence.md) | table | sim | 1 | 18 | não | SINGU: Gestão de cadência de comunicação por contato |
| [_dormant.communication_preferences](tables/dormant/communication_preferences.md) | table | sim | 1 | 28 | não | SINGU: Preferências de comunicação por contato |
| [_dormant.company_tags](tables/dormant/company_tags.md) | table | sim | 0 | 3 | não |  |
| [_dormant.compatibility_alerts](tables/dormant/compatibility_alerts.md) | table | sim | 4 | 11 | não |  |
| [_dormant.compatibility_settings](tables/dormant/compatibility_settings.md) | table | sim | 4 | 8 | não |  |
| [_dormant.competitive_chat_messages](tables/dormant/competitive_chat_messages.md) | table | não | 0 | 5 | não |  |
| [_dormant.competitive_seasons](tables/dormant/competitive_seasons.md) | table | não | 0 | 7 | não |  |
| [_dormant.contact_availability](tables/dormant/contact_availability.md) | table | sim | 1 | 12 | não | SINGU: Mapa de disponibilidade semanal do contato |
| [_dormant.contact_cadence](tables/dormant/contact_cadence.md) | table | sim | 4 | 11 | não |  |
| [_dormant.contact_communication_style](tables/dormant/contact_communication_style.md) | table | não | 0 | 20 | não |  |
| [_dormant.contact_compatibility](tables/dormant/contact_compatibility.md) | table | sim | 1 | 15 | não | SINGU: Análise de compatibilidade DISC entre usuário e contato |
| [_dormant.contact_eq_scores](tables/dormant/contact_eq_scores.md) | table | não | 0 | 25 | não | Scores de Inteligência Emocional (EQ) dos contatos - 4 pilares de Goleman |
| [_dormant.contact_metaprograms](tables/dormant/contact_metaprograms.md) | table | sim | 1 | 22 | não | SINGU: Metaprogramas de PNL identificados por contato |
| [_dormant.contact_preferences](tables/dormant/contact_preferences.md) | table | sim | 4 | 13 | não |  |
| [_dormant.contact_relationships](tables/dormant/contact_relationships.md) | table | sim | 1 | 17 | não | SINGU: Mapeamento de relacionamentos entre contatos |
| [_dormant.contact_relatives](tables/dormant/contact_relatives.md) | table | sim | 4 | 15 | não |  |
| [_dormant.contact_rfm_scores](tables/dormant/contact_rfm_scores.md) | table | sim | 1 | 21 | não | SINGU: Scores RFM calculados para cada contato |
| [_dormant.contact_tags](tables/dormant/contact_tags.md) | table | não | 0 | 3 | não |  |
| [_dormant.contact_time_analysis](tables/dormant/contact_time_analysis.md) | table | sim | 4 | 9 | não |  |
| [_dormant.contact_trigger_preferences](tables/dormant/contact_trigger_preferences.md) | table | sim | 1 | 16 | não | SINGU: Preferências de gatilhos mentais aprendidas por contato |
| [_dormant.contact_values](tables/dormant/contact_values.md) | table | sim | 1 | 11 | não | SINGU: Valores pessoais e profissionais identificados |
| [_dormant.custom_field_values](tables/dormant/custom_field_values.md) | table | não | 0 | 11 | não |  |
| [_dormant.custom_fields](tables/dormant/custom_fields.md) | table | não | 0 | 10 | não |  |
| [_dormant.customer_contacts](tables/dormant/customer_contacts.md) | table | não | 0 | 10 | não |  |
| [_dormant.daily_challenge_progress](tables/dormant/daily_challenge_progress.md) | table | não | 0 | 8 | não |  |
| [_dormant.daily_metrics](tables/dormant/daily_metrics.md) | table | sim | 1 | 9 | não |  |
| [_dormant.daily_streak_achievements](tables/dormant/daily_streak_achievements.md) | table | não | 0 | 7 | não |  |
| [_dormant.dashboard_layouts](tables/dormant/dashboard_layouts.md) | table | não | 0 | 7 | não |  |
| [_dormant.dashboard_widgets](tables/dormant/dashboard_widgets.md) | table | sim | 1 | 11 | não | SINGU: Configuração personalizada do dashboard |
| [_dormant.deal_chat_history](tables/dormant/deal_chat_history.md) | table | sim | 1 | 6 | não |  |
| [_dormant.deal_history](tables/dormant/deal_history.md) | table | não | 0 | 10 | não |  |
| [_dormant.deal_outcomes](tables/dormant/deal_outcomes.md) | table | sim | 1 | 7 | não |  |
| [_dormant.deal_products](tables/dormant/deal_products.md) | table | não | 0 | 11 | não |  |
| [_dormant.deal_products_catalog](tables/dormant/deal_products_catalog.md) | table | não | 0 | 10 | não |  |
| [_dormant.deal_stage_history](tables/dormant/deal_stage_history.md) | table | sim | 1 | 5 | não |  |
| [_dormant.deals](tables/dormant/deals.md) | table | não | 0 | 37 | não |  |
| [_dormant.decision_criteria](tables/dormant/decision_criteria.md) | table | sim | 1 | 13 | não | SINGU: Critérios de decisão de compra por contato |
| [_dormant.demand_forecasts](tables/dormant/demand_forecasts.md) | table | não | 0 | 10 | não |  |
| [_dormant.digest_history](tables/dormant/digest_history.md) | table | não | 0 | 21 | não | Histórico de digests enviados |
| [_dormant.digital_signatures](tables/dormant/digital_signatures.md) | table | não | 0 | 10 | não |  |
| [_dormant.disc_analysis_history](tables/dormant/disc_analysis_history.md) | table | sim | 4 | 23 | não |  |
| [_dormant.disc_assessments](tables/dormant/disc_assessments.md) | table | sim | 1 | 20 | não | SINGU: Avaliações DISC realizadas para contatos |
| [_dormant.disc_communication_logs](tables/dormant/disc_communication_logs.md) | table | sim | 4 | 12 | não |  |
| [_dormant.disc_compatibility](tables/dormant/disc_compatibility.md) | table | sim | 1 | 13 | não | SINGU: Matriz de compatibilidade entre perfis DISC |
| [_dormant.disc_conversion_metrics](tables/dormant/disc_conversion_metrics.md) | table | sim | 1 | 17 | não |  |
| [_dormant.disc_interaction_signals](tables/dormant/disc_interaction_signals.md) | table | sim | 1 | 11 | não | SINGU: Sinais de perfil DISC detectados em interações |
| [_dormant.disc_questions](tables/dormant/disc_questions.md) | table | sim | 1 | 9 | não | SINGU: Perguntas do questionário DISC |
| [_dormant.document_signers](tables/dormant/document_signers.md) | table | não | 0 | 8 | não |  |
| [_dormant.email_tracking_events](tables/dormant/email_tracking_events.md) | table | não | 0 | 5 | não |  |
| [_dormant.emotional_anchors](tables/dormant/emotional_anchors.md) | table | sim | 1 | 15 | não | SINGU: Âncoras emocionais identificadas por contato |
| [_dormant.emotional_states](tables/dormant/emotional_states.md) | table | sim | 1 | 16 | não | SINGU: Estados emocionais detectados em interações |
| [_dormant.emotional_states_history](tables/dormant/emotional_states_history.md) | table | sim | 4 | 9 | não |  |
| [_dormant.emotional_trend_snapshots](tables/dormant/emotional_trend_snapshots.md) | table | não | 0 | 21 | não | Snapshots periódicos de tendência emocional |
| [_dormant.entity_versions](tables/dormant/entity_versions.md) | table | sim | 1 | 8 | não |  |
| [_dormant.eq_analysis_history](tables/dormant/eq_analysis_history.md) | table | sim | 4 | 16 | não |  |
| [_dormant.eq_pillar_details](tables/dormant/eq_pillar_details.md) | table | não | 0 | 10 | não | Detalhamento dos 4 pilares do EQ |
| [_dormant.favorite_templates](tables/dormant/favorite_templates.md) | table | sim | 3 | 4 | não |  |
| [_dormant.feed_comments](tables/dormant/feed_comments.md) | table | não | 0 | 5 | não |  |
| [_dormant.feed_reactions](tables/dormant/feed_reactions.md) | table | não | 0 | 5 | não |  |
| [_dormant.health_alert_settings](tables/dormant/health_alert_settings.md) | table | sim | 4 | 12 | não |  |
| [_dormant.health_alerts](tables/dormant/health_alerts.md) | table | sim | 1 | 18 | não | SINGU: Alertas de saúde do relacionamento |
| [_dormant.hidden_objections](tables/dormant/hidden_objections.md) | table | sim | 4 | 14 | não |  |
| [_dormant.icp_data](tables/dormant/icp_data.md) | table | não | 0 | 10 | não |  |
| [_dormant.inactivity_alerts](tables/dormant/inactivity_alerts.md) | table | sim | 1 | 22 | não | Alertas de inatividade e queda de engajamento |
| [_dormant.influence_network](tables/dormant/influence_network.md) | table | sim | 1 | 12 | não | SINGU: Métricas de influência de cada contato na rede |
| [_dormant.insights](tables/dormant/insights.md) | table | sim | 1 | 21 | não | SINGU: Insights gerados por análise de IA |
| [_dormant.interaction_participants](tables/dormant/interaction_participants.md) | table | não | 0 | 7 | não |  |
| [_dormant.inventory_levels](tables/dormant/inventory_levels.md) | table | não | 0 | 10 | não |  |
| [_dormant.ip_whitelist](tables/dormant/ip_whitelist.md) | table | não | 0 | 6 | não |  |
| [_dormant.known_devices](tables/dormant/known_devices.md) | table | não | 0 | 10 | não |  |
| [_dormant.kudos](tables/dormant/kudos.md) | table | não | 0 | 6 | não |  |
| [_dormant.lead_history](tables/dormant/lead_history.md) | table | não | 0 | 10 | não |  |
| [_dormant.lead_routing_log](tables/dormant/lead_routing_log.md) | table | não | 0 | 7 | não |  |
| [_dormant.lead_scores](tables/dormant/lead_scores.md) | table | não | 0 | 7 | não |  |
| [_dormant.leads](tables/dormant/leads.md) | table | não | 0 | 39 | não |  |
| [_dormant.life_events](tables/dormant/life_events.md) | table | sim | 1 | 19 | não | SINGU: Eventos de vida importantes dos contatos |
| [_dormant.login_alerts](tables/dormant/login_alerts.md) | table | não | 0 | 7 | não |  |
| [_dormant.login_attempts](tables/dormant/login_attempts.md) | table | não | 0 | 7 | não |  |
| [_dormant.lux_intelligence](tables/dormant/lux_intelligence.md) | table | sim | 4 | 21 | não |  |
| [_dormant.metaprogram_analysis](tables/dormant/metaprogram_analysis.md) | table | sim | 4 | 18 | não |  |
| [_dormant.metaprogram_templates](tables/dormant/metaprogram_templates.md) | table | não | 0 | 15 | não | Templates adaptados por metaprograma de PNL |
| [_dormant.mfa_verification_attempts](tables/dormant/mfa_verification_attempts.md) | table | não | 0 | 6 | não |  |
| [_dormant.notes](tables/dormant/notes.md) | table | sim | 1 | 11 | não | Notas e observações livres |
| [_dormant.notification_preferences](tables/dormant/notification_preferences.md) | table | não | 0 | 12 | não |  |
| [_dormant.notification_settings](tables/dormant/notification_settings.md) | table | não | 0 | 29 | não | Configurações de notificação por usuário |
| [_dormant.notifications](tables/dormant/notifications.md) | table | não | 0 | 30 | não | Notificações e alertas do sistema |
| [_dormant.objection_templates](tables/dormant/objection_templates.md) | table | sim | 1 | 16 | não | SINGU: Templates de resposta para objeções comuns |
| [_dormant.objections](tables/dormant/objections.md) | table | sim | 1 | 17 | não | SINGU: Registro de objeções levantadas por contatos |
| [_dormant.objections_library](tables/dormant/objections_library.md) | table | não | 0 | 9 | não |  |
| [_dormant.offer_suggestions](tables/dormant/offer_suggestions.md) | table | sim | 1 | 22 | não | SINGU: Sugestões de ofertas personalizadas |
| [_dormant.password_reset_requests](tables/dormant/password_reset_requests.md) | table | não | 0 | 9 | não |  |
| [_dormant.performance_bets](tables/dormant/performance_bets.md) | table | não | 0 | 9 | não |  |
| [_dormant.personalized_message_templates](tables/dormant/personalized_message_templates.md) | table | não | 0 | 18 | não |  |
| [_dormant.pix_accounts](tables/dormant/pix_accounts.md) | table | não | 0 | 10 | não |  |
| [_dormant.playbook_items](tables/dormant/playbook_items.md) | table | não | 0 | 7 | não |  |
| [_dormant.playbook_progress](tables/dormant/playbook_progress.md) | table | não | 0 | 5 | não |  |
| [_dormant.playbooks](tables/dormant/playbooks.md) | table | sim | 1 | 6 | não |  |
| [_dormant.pre_contact_briefings](tables/dormant/pre_contact_briefings.md) | table | não | 0 | 30 | não |  |
| [_dormant.price_alerts](tables/dormant/price_alerts.md) | table | não | 0 | 9 | não |  |
| [_dormant.price_history](tables/dormant/price_history.md) | table | não | 0 | 8 | não |  |
| [_dormant.prize_wheel_spins](tables/dormant/prize_wheel_spins.md) | table | não | 0 | 6 | não |  |
| [_dormant.products](tables/dormant/products.md) | table | sim | 1 | 9 | não |  |
| [_dormant.progressive_goals](tables/dormant/progressive_goals.md) | table | não | 0 | 9 | não |  |
| [_dormant.prospect_cadences](tables/dormant/prospect_cadences.md) | table | não | 0 | 11 | não |  |
| [_dormant.purchase_history](tables/dormant/purchase_history.md) | table | sim | 1 | 23 | não | SINGU: Histórico de compras dos contatos/empresas |
| [_dormant.push_subscriptions](tables/dormant/push_subscriptions.md) | table | não | 0 | 7 | não |  |
| [_dormant.quote_sync_logs](tables/dormant/quote_sync_logs.md) | table | não | 0 | 8 | não |  |
| [_dormant.quotes](tables/dormant/quotes.md) | table | não | 0 | 16 | não |  |
| [_dormant.rank_change_notifications](tables/dormant/rank_change_notifications.md) | table | não | 0 | 7 | não |  |
| [_dormant.rapport_score_history](tables/dormant/rapport_score_history.md) | table | não | 0 | 15 | não |  |
| [_dormant.rate_limit_logs](tables/dormant/rate_limit_logs.md) | table | não | 0 | 9 | não |  |
| [_dormant.rate_limit_settings](tables/dormant/rate_limit_settings.md) | table | não | 0 | 8 | não |  |
| [_dormant.reauthentication_requests](tables/dormant/reauthentication_requests.md) | table | não | 0 | 8 | não |  |
| [_dormant.rfm_analysis](tables/dormant/rfm_analysis.md) | table | sim | 1 | 30 | não |  |
| [_dormant.rfm_calculations](tables/dormant/rfm_calculations.md) | table | sim | 1 | 13 | não | SINGU: Log de execução dos cálculos RFM |
| [_dormant.rfm_history](tables/dormant/rfm_history.md) | table | sim | 1 | 13 | não | SINGU: Histórico de mudanças nos scores RFM |
| [_dormant.rfm_metrics](tables/dormant/rfm_metrics.md) | table | sim | 1 | 22 | não |  |
| [_dormant.sales_battles](tables/dormant/sales_battles.md) | table | não | 0 | 10 | não |  |
| [_dormant.sales_goals](tables/dormant/sales_goals.md) | table | sim | 1 | 5 | não |  |
| [_dormant.sales_streaks](tables/dormant/sales_streaks.md) | table | não | 0 | 8 | não |  |
| [_dormant.sales_territories](tables/dormant/sales_territories.md) | table | não | 0 | 10 | não |  |
| [_dormant.salesperson_badges](tables/dormant/salesperson_badges.md) | table | não | 0 | 5 | não |  |
| [_dormant.salesperson_leagues](tables/dormant/salesperson_leagues.md) | table | não | 0 | 7 | não |  |
| [_dormant.salesperson_preferences](tables/dormant/salesperson_preferences.md) | table | não | 0 | 8 | não |  |
| [_dormant.salesperson_xp](tables/dormant/salesperson_xp.md) | table | sim | 1 | 7 | não |  |
| [_dormant.satisfaction_scores](tables/dormant/satisfaction_scores.md) | table | não | 0 | 16 | não | Scores de satisfação e NPS dos clientes |
| [_dormant.saved_filters](tables/dormant/saved_filters.md) | table | sim | 4 | 8 | não |  |
| [_dormant.score_history](tables/dormant/score_history.md) | table | sim | 4 | 10 | não |  |
| [_dormant.script_usage_log](tables/dormant/script_usage_log.md) | table | não | 0 | 16 | não |  |
| [_dormant.security_alert_history](tables/dormant/security_alert_history.md) | table | não | 0 | 8 | não |  |
| [_dormant.security_alert_settings](tables/dormant/security_alert_settings.md) | table | não | 0 | 10 | não |  |
| [_dormant.shared_interests](tables/dormant/shared_interests.md) | table | não | 0 | 14 | não |  |
| [_dormant.sla_configs](tables/dormant/sla_configs.md) | table | não | 0 | 9 | não |  |
| [_dormant.smart_reminders](tables/dormant/smart_reminders.md) | table | não | 0 | 25 | não | Lembretes inteligentes com contexto |
| [_dormant.sms_verification_codes](tables/dormant/sms_verification_codes.md) | table | não | 0 | 8 | não |  |
| [_dormant.social_behavior_analysis](tables/dormant/social_behavior_analysis.md) | table | sim | 4 | 21 | não |  |
| [_dormant.social_life_events](tables/dormant/social_life_events.md) | table | sim | 4 | 15 | não |  |
| [_dormant.social_mentions](tables/dormant/social_mentions.md) | table | sim | 1 | 12 | não | SINGU: Registro de quando um contato menciona outro |
| [_dormant.social_profiles](tables/dormant/social_profiles.md) | table | sim | 4 | 24 | não |  |
| [_dormant.social_scraping_schedule](tables/dormant/social_scraping_schedule.md) | table | sim | 4 | 14 | não |  |
| [_dormant.stakeholder_alerts](tables/dormant/stakeholder_alerts.md) | table | sim | 4 | 14 | não |  |
| [_dormant.stock_movements](tables/dormant/stock_movements.md) | table | não | 0 | 8 | não |  |
| [_dormant.supplier_contacts](tables/dormant/supplier_contacts.md) | table | não | 0 | 10 | não |  |
| [_dormant.supplier_order_items](tables/dormant/supplier_order_items.md) | table | não | 0 | 7 | não |  |
| [_dormant.supplier_orders](tables/dormant/supplier_orders.md) | table | não | 0 | 12 | não |  |
| [_dormant.supplier_products](tables/dormant/supplier_products.md) | table | não | 0 | 10 | não |  |
| [_dormant.supplier_risk_assessments](tables/dormant/supplier_risk_assessments.md) | table | não | 0 | 12 | não |  |
| [_dormant.tasks](tables/dormant/tasks.md) | table | não | 0 | 24 | não |  |
| [_dormant.team_closers](tables/dormant/team_closers.md) | table | sim | 1 | 4 | não |  |
| [_dormant.teams](tables/dormant/teams.md) | table | sim | 1 | 7 | não |  |
| [_dormant.template_performance](tables/dormant/template_performance.md) | table | não | 0 | 14 | não | Registro de uso e performance de templates para melhoria contínua |
| [_dormant.territory_history](tables/dormant/territory_history.md) | table | não | 0 | 6 | não |  |
| [_dormant.time_analysis](tables/dormant/time_analysis.md) | table | sim | 1 | 15 | não | SINGU: Análise de melhores horários para contato |
| [_dormant.tournament_matches](tables/dormant/tournament_matches.md) | table | não | 0 | 13 | não |  |
| [_dormant.tournament_participants](tables/dormant/tournament_participants.md) | table | não | 0 | 8 | não |  |
| [_dormant.tournaments](tables/dormant/tournaments.md) | table | não | 0 | 14 | não |  |
| [_dormant.trigger_ab_tests](tables/dormant/trigger_ab_tests.md) | table | sim | 4 | 22 | não |  |
| [_dormant.trigger_channel_effectiveness](tables/dormant/trigger_channel_effectiveness.md) | table | sim | 4 | 11 | não |  |
| [_dormant.trigger_intensity_history](tables/dormant/trigger_intensity_history.md) | table | sim | 4 | 9 | não |  |
| [_dormant.trigger_suggestions](tables/dormant/trigger_suggestions.md) | table | sim | 1 | 18 | não | SINGU: Sugestões de gatilhos mentais geradas por IA |
| [_dormant.trigger_templates](tables/dormant/trigger_templates.md) | table | não | 0 | 14 | não | Templates prontos utilizando gatilhos mentais de Cialdini |
| [_dormant.trigger_usage_history](tables/dormant/trigger_usage_history.md) | table | sim | 4 | 14 | não |  |
| [_dormant.trigger_usage_log](tables/dormant/trigger_usage_log.md) | table | sim | 1 | 15 | não | SINGU: Log de uso de gatilhos mentais e seus resultados |
| [_dormant.user_companies_link](tables/dormant/user_companies_link.md) | table | sim | 1 | 6 | não | SINGU: Vínculo de permissão entre usuários e empresas compartilhadas |
| [_dormant.user_contacts_link](tables/dormant/user_contacts_link.md) | table | sim | 1 | 6 | não | SINGU: Vínculo de permissão entre usuários e contatos compartilhados |
| [_dormant.user_disc_profile](tables/dormant/user_disc_profile.md) | table | sim | 1 | 13 | não | SINGU: Perfil DISC do próprio usuário/vendedor |
| [_dormant.user_favorite_templates](tables/dormant/user_favorite_templates.md) | table | não | 0 | 8 | não | Templates favoritos salvos por cada usuário |
| [_dormant.user_mfa_settings](tables/dormant/user_mfa_settings.md) | table | não | 0 | 13 | não |  |
| [_dormant.user_roles](tables/dormant/user_roles.md) | table | não | 0 | 5 | não |  |
| [_dormant.vak_analysis_history](tables/dormant/vak_analysis_history.md) | table | sim | 4 | 14 | não |  |
| [_dormant.vak_profiles](tables/dormant/vak_profiles.md) | table | sim | 1 | 16 | não | SINGU: Perfis VAK (Visual, Auditivo, Cinestésico) dos contatos |
| [_dormant.vak_templates](tables/dormant/vak_templates.md) | table | não | 0 | 14 | não | Templates adaptados por modalidade sensorial VAK |
| [_dormant.victory_feed](tables/dormant/victory_feed.md) | table | sim | 1 | 8 | não |  |
| [_dormant.webauthn_challenges](tables/dormant/webauthn_challenges.md) | table | não | 0 | 5 | não |  |
| [_dormant.webauthn_credentials](tables/dormant/webauthn_credentials.md) | table | não | 0 | 8 | não |  |
| [_dormant.weekly_matchups](tables/dormant/weekly_matchups.md) | table | não | 0 | 10 | não |  |
| [_dormant.weekly_report_settings](tables/dormant/weekly_report_settings.md) | table | sim | 4 | 15 | não |  |
| [_dormant.weekly_reports](tables/dormant/weekly_reports.md) | table | sim | 1 | 26 | não | SINGU: Relatórios semanais de atividade e performance |
| [_dormant.whatsapp_instances](tables/dormant/whatsapp_instances.md) | table | sim | 1 | 15 | não |  |
| [_dormant.whatsapp_kpis](tables/dormant/whatsapp_kpis.md) | table | sim | 1 | 14 | não |  |
| [_dormant.whatsapp_messages](tables/dormant/whatsapp_messages.md) | table | sim | 1 | 21 | não |  |
| [_dormant.workflow_action_logs](tables/dormant/workflow_action_logs.md) | table | não | 0 | 7 | não |  |
| [_dormant.workflow_actions](tables/dormant/workflow_actions.md) | table | não | 0 | 8 | não |  |
| [_dormant.workflow_executions](tables/dormant/workflow_executions.md) | table | não | 0 | 12 | não |  |
| [_dormant.workflow_rules](tables/dormant/workflow_rules.md) | table | não | 0 | 11 | não |  |
| [_dormant.workflow_triggers](tables/dormant/workflow_triggers.md) | table | não | 0 | 9 | não |  |
| [_dormant.workflows](tables/dormant/workflows.md) | table | não | 0 | 11 | não |  |
| [_dormant.xp_history](tables/dormant/xp_history.md) | table | sim | 1 | 7 | não |  |
| [ops_backup.acl_snapshot](tables/ops_backup/acl_snapshot.md) | table | não | 0 | 5 | não |  |
| [public._stg_pac_nums](tables/public/stg_pac_nums.md) | table | sim | 0 | 2 | não |  |
| [public.abm_account_plans](tables/public/abm_account_plans.md) | table | sim | 3 | 15 | não |  |
| [public.abm_accounts](tables/public/abm_accounts.md) | table | sim | 4 | 15 | não |  |
| [public.abm_buying_committee](tables/public/abm_buying_committee.md) | table | sim | 4 | 13 | não |  |
| [public.abm_campaigns](tables/public/abm_campaigns.md) | table | sim | 4 | 14 | não |  |
| [public.abm_whitespace_opportunities](tables/public/abm_whitespace_opportunities.md) | table | sim | 4 | 12 | não |  |
| [public.access_blocked_log](tables/public/access_blocked_log.md) | table | sim | 3 | 17 | não | SINGU: Log append-only de bloqueios de acesso (brute force, IP, geo, device). Base para dashboards de segurança. |
| [public.access_security_settings](tables/public/access_security_settings.md) | table | sim | 5 | 23 | não | SINGU: Config de segurança por usuário (MFA, IP whitelist, device trust, password policy, brute force thresholds). |
| [public.achievements](tables/public/achievements.md) | table | sim | 1 | 6 | não |  |
| [public.activities](tables/public/activities.md) | table | sim | 9 | 16 | não | SINGU: Log de atividades dos usuários no sistema |
| [public.activity_feed](tables/public/activity_feed.md) | table | sim | 4 | 9 | não |  |
| [public.ai_chat_messages](tables/public/ai_chat_messages.md) | table | sim | 5 | 13 | não | SINGU: Mensagens do Ask CRM Chat. Role user/assistant/system/tool. Mensagens assistant podem carregar generated_sql + query_result para auditoria. |
| [public.ai_chat_threads](tables/public/ai_chat_threads.md) | table | sim | 5 | 17 | não | SINGU: Threads do Ask CRM Chat (IA flutuante para consultar dados em linguagem natural via SQL gerado). Cada thread mantém contexto. |
| [public.ai_gateway_metrics](tables/public/ai_gateway_metrics.md) | partitioned | sim | 1 | 12 | não |  |
| [public.ai_gateway_metrics_2026_08](tables/public/ai_gateway_metrics_2026_08.md) | table (partição) | sim | 0 | 12 | não |  |
| [public.ai_gateway_metrics_2026_09](tables/public/ai_gateway_metrics_2026_09.md) | table (partição) | sim | 0 | 12 | não |  |
| [public.ai_gateway_metrics_2026_10](tables/public/ai_gateway_metrics_2026_10.md) | table (partição) | sim | 0 | 12 | não |  |
| [public.ai_gateway_metrics_2026_11](tables/public/ai_gateway_metrics_2026_11.md) | table (partição) | sim | 0 | 12 | não |  |
| [public.ai_gateway_metrics_2026_12](tables/public/ai_gateway_metrics_2026_12.md) | table (partição) | sim | 0 | 12 | não |  |
| [public.ai_gateway_metrics_2027_01](tables/public/ai_gateway_metrics_2027_01.md) | table (partição) | sim | 0 | 12 | não |  |
| [public.ai_recommendation_audit_logs](tables/public/ai_recommendation_audit_logs.md) | table | sim | 3 | 9 | não |  |
| [public.ai_recommendation_audit_logs_v2](tables/public/ai_recommendation_audit_logs_v2.md) | table | sim | 1 | 9 | não |  |
| [public.ai_recommendation_logs](tables/public/ai_recommendation_logs.md) | table | sim | 3 | 9 | não |  |
| [public.ai_tone_preferences](tables/public/ai_tone_preferences.md) | table | sim | 1 | 6 | não |  |
| [public.alert_rules](tables/public/alert_rules.md) | table | sim | 2 | 18 | não | Regras configuráveis de alerta |
| [public.alerts](tables/public/alerts.md) | table | sim | 9 | 22 | sim | Sistema de alertas e notificações |
| [public.applied_objection_responses](tables/public/applied_objection_responses.md) | table | sim | 3 | 10 | não |  |
| [public.asia_upload_mapping](tables/public/asia_upload_mapping.md) | table | sim | 1 | 8 | não | Rastreia requisições pg_net para upload de imagens Asia Import ao Cloudflare Images |
| [public.attribution_models_cache](tables/public/attribution_models_cache.md) | table | sim | 1 | 7 | não |  |
| [public.attribution_touchpoints](tables/public/attribution_touchpoints.md) | table | sim | 1 | 15 | não |  |
| [public.audit_log](tables/public/audit_log.md) | table | sim | 3 | 13 | não | Log de auditoria para alterações em tabelas críticas |
| [public.automation_executions](tables/public/automation_executions.md) | table | sim | 1 | 11 | não |  |
| [public.automation_logs](tables/public/automation_logs.md) | table | sim | 8 | 10 | não | SINGU: Log de cada execução de regra de automação. Audit trail completo. |
| [public.automation_rules](tables/public/automation_rules.md) | table | sim | 8 | 14 | não | SINGU: Regras configuráveis de automação (trigger → condition → action). |
| [public.automations](tables/public/automations.md) | table | sim | 4 | 14 | não |  |
| [public.badges](tables/public/badges.md) | table | sim | 1 | 9 | não |  |
| [public.battle_cards](tables/public/battle_cards.md) | table | sim | 4 | 17 | não |  |
| [public.behavioral_insight_feedback](tables/public/behavioral_insight_feedback.md) | table | sim | 5 | 9 | não |  |
| [public.behavioral_profile_regen_queue](tables/public/behavioral_profile_regen_queue.md) | table | sim | 4 | 11 | não |  |
| [public.brain_dominance_analysis](tables/public/brain_dominance_analysis.md) | table | sim | 3 | 11 | não |  |
| [public.cadence_enrollments](tables/public/cadence_enrollments.md) | table | sim | 4 | 10 | não |  |
| [public.calendar_events](tables/public/calendar_events.md) | table | sim | 1 | 18 | não |  |
| [public.call_logs](tables/public/call_logs.md) | table | sim | 1 | 13 | não |  |
| [public.campaign_members](tables/public/campaign_members.md) | table | sim | 1 | 10 | não |  |
| [public.campaign_recipients](tables/public/campaign_recipients.md) | table | sim | 5 | 19 | não | SINGU: Destinatários individuais de email_campaigns com tracking granular (opens, clicks, bounces). |
| [public.campaigns](tables/public/campaigns.md) | table | sim | 1 | 12 | não |  |
| [public.canned_responses](tables/public/canned_responses.md) | table | sim | 5 | 12 | não | SINGU: Respostas prontas/templates curtos acessíveis por shortcut (/ola, /encerrar, etc). is_shared=true para disponibilizar ao time. |
| [public.carrier_evaluations](tables/public/carrier_evaluations.md) | table | sim | 1 | 13 | não | Avaliações de transportadoras (append-only). 5 critérios: pontualidade, conservação, preço_frete, rastreamento, cobertura. Notas 1-5. |
| [public.carrier_homologations](tables/public/carrier_homologations.md) | table | sim | 1 | 12 | não | Histórico de homologação de transportadoras. Homologador: Logística (Thiago id=80). Status via enum carrier_homologation_status. |
| [public.carrier_qualification_config](tables/public/carrier_qualification_config.md) | table | sim | 2 | 13 | não | Segmentos de classificação de transportadoras (Excelente a Crítico) com faixas de score e ações recomendadas |
| [public.carrier_score_history](tables/public/carrier_score_history.md) | table | sim | 1 | 17 | não | Histórico de evolução do score de transportadoras. Append-only, 1 registro por recálculo. |
| [public.carrier_scores](tables/public/carrier_scores.md) | table | sim | 1 | 17 | não | Score consolidado de transportadoras (1 registro por carrier). Recalculado via trigger após cada avaliação. |
| [public.carriers](tables/public/carriers.md) | table | sim | 1 | 19 | não | Transportadoras vinculadas a companies (1:1 via company_id UNIQUE). 112 registros. Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Logística (Thiago id=80). 5 critérios: pontualidade(30%), conservação(25%), preço_frete(20%), cobertura(15%), rastreamento(10%). |
| [public.churn_predictions](tables/public/churn_predictions.md) | table | sim | 2 | 18 | não | Previsões de probabilidade de churn por contato |
| [public.churn_risk_factors](tables/public/churn_risk_factors.md) | table | sim | 2 | 12 | não | Configuração dos fatores que indicam risco de churn |
| [public.churn_risk_scores](tables/public/churn_risk_scores.md) | table | sim | 6 | 22 | não | SINGU: Histórico de scores de risco de churn (análise local, 5 fatores). Espelha feature churn-risk-detection das memories. is_current=true para score atual. |
| [public.cidades](tables/public/cidades.md) | table | sim | 2 | 11 | não | Catálogo oficial de municípios brasileiros. Fonte: IBGE. Lat/lon para dashboards geográficos. |
| [public.city_whitelist](tables/public/city_whitelist.md) | table | sim | 5 | 9 | não | SINGU: Cidades permitidas (mais granular que country). Para ambientes corporativos restritos. |
| [public.client_values](tables/public/client_values.md) | table | sim | 8 | 11 | não | SINGU: Valores pessoais/profissionais do contato para personalizar abordagem comercial. |
| [public.clients](tables/public/clients.md) | table | sim | 1 | 11 | não |  |
| [public.closing_score_config](tables/public/closing_score_config.md) | table | sim | 2 | 10 | não | Configuração dos fatores que compõem o score de fechamento |
| [public.cnaes](tables/public/cnaes.md) | table | sim | 2 | 8 | não | Catálogo oficial de CNAEs da Receita Federal. Fonte de verdade para códigos e descrições. |
| [public.cnpj_cache](tables/public/cnpj_cache.md) | table | sim | 1 | 22 | não |  |
| [public.coaching_scorecards](tables/public/coaching_scorecards.md) | table | sim | 4 | 9 | não |  |
| [public.cognitive_bias_history](tables/public/cognitive_bias_history.md) | table | sim | 8 | 13 | não | SINGU: Vieses cognitivos detectados em contatos para estratégias de vendas. |
| [public.commission_rules](tables/public/commission_rules.md) | table | sim | 1 | 10 | não |  |
| [public.commissions](tables/public/commissions.md) | table | sim | 4 | 11 | não |  |
| [public.communication_preferences](tables/public/communication_preferences.md) | table | sim | 8 | 13 | não | SINGU: Dados analíticos de comunicação com taxas de resposta por canal. |
| [public.companies](tables/public/companies.md) | table | sim | 9 | 81 | sim | Cadastro mestre de organizações do CRM. Uma linha representa uma empresa, que pode atuar como cliente, fornecedor e/ou transportadora conforme os indicadores de papel. Centraliza identificação cadastral, vínculo com Bitrix24, hierarquia empresarial/cooperativista, dados de contato e atributos de qualificação comercial. PK: id. Relacionamentos confirmados: company_addresses.company_id, company_phones.company_id, company_emails.company_id, contacts.company_id, customers.company_id, suppliers.company_id, carriers.company_id e diversas tabelas operacionais apontam para companies.id. Valores monetários e métricas textuais devem ser interpretados conforme a unidade de origem; não inferir moeda ou escala quando não explicitadas. |
| [public.company_addresses](tables/public/company_addresses.md) | table | sim | 6 | 24 | não | Endereços associados a empresas do CRM. Cada registro pertence a uma empresa e pode incluir tipo, endereço postal, coordenadas geográficas e referências de geocodificação. company_id referencia public.companies.id; cidade_ibge referencia public.cidades.ibge_code. A coluna tipo tem um DEFAULT legado cujo conteúdo é ambíguo; não interpretá-lo como lista oficial de categorias sem validar os dados. |
| [public.company_cadences](tables/public/company_cadences.md) | table | sim | 4 | 11 | não |  |
| [public.company_cnaes](tables/public/company_cnaes.md) | table | sim | 1 | 7 | não | Vínculo empresa ↔ CNAEs. Cada empresa tem 1 principal (is_principal=true) e N secundários. |
| [public.company_emails](tables/public/company_emails.md) | table | sim | 6 | 14 | não | Endereços de e-mail associados a empresas, com finalidade, sinalização de principal/verificado e metadados de origem/contexto. Cada registro referencia public.companies.id. |
| [public.company_phones](tables/public/company_phones.md) | table | sim | 6 | 16 | não | Telefones de empresas com tipo, número normalizado, ramal, departamento e indicadores de principal/WhatsApp. Cada registro referencia public.companies.id. |
| [public.company_rfm_scores](tables/public/company_rfm_scores.md) | table | sim | 4 | 18 | não | SINGU: Scores RFM agregados por empresa |
| [public.company_social_media](tables/public/company_social_media.md) | table | sim | 1 | 16 | não |  |
| [public.company_stakeholder_map](tables/public/company_stakeholder_map.md) | table | sim | 4 | 16 | não | SINGU: Mapa de stakeholders por empresa (poder/interesse) |
| [public.company_territories](tables/public/company_territories.md) | table | sim | 1 | 4 | não |  |
| [public.compatibility_alerts](tables/public/compatibility_alerts.md) | table | sim | 8 | 11 | não | SINGU: Alertas quando compatibilidade DISC vendedor↔contato está abaixo do threshold. |
| [public.compatibility_settings](tables/public/compatibility_settings.md) | table | sim | 8 | 8 | não | SINGU: Config do módulo de compatibilidade DISC por usuário. 1 registro por user. |
| [public.competitive_losses](tables/public/competitive_losses.md) | table | sim | 1 | 10 | não |  |
| [public.competitors](tables/public/competitors.md) | table | sim | 1 | 12 | não |  |
| [public.config_regras_negocio](tables/public/config_regras_negocio.md) | table | sim | 2 | 5 | não |  |
| [public.connection_anomalies](tables/public/connection_anomalies.md) | table | sim | 4 | 15 | não |  |
| [public.connection_configs](tables/public/connection_configs.md) | table | sim | 1 | 18 | não |  |
| [public.connection_quotas](tables/public/connection_quotas.md) | table | sim | 2 | 9 | não |  |
| [public.connection_test_logs](tables/public/connection_test_logs.md) | table | sim | 2 | 8 | não |  |
| [public.connector_log](tables/public/connector_log.md) | table | sim | 1 | 13 | não | Log de integrações WhatsApp/Bitrix (auditoria) |
| [public.contact_addresses](tables/public/contact_addresses.md) | table | sim | 1 | 25 | não | Endereços de pessoas/contatos. Cada registro pertence a public.contacts e possui categoria residencial, profissional, cobrança ou outro. Guarda dados postais e coordenadas opcionais. PK: id; contact_id → public.contacts.id; created_by e updated_by → public.users.id. |
| [public.contact_analytical_profile_versions](tables/public/contact_analytical_profile_versions.md) | table | sim | 2 | 16 | não |  |
| [public.contact_analytical_profiles](tables/public/contact_analytical_profiles.md) | table | sim | 2 | 13 | não |  |
| [public.contact_automation_settings](tables/public/contact_automation_settings.md) | table | sim | 1 | 11 | não |  |
| [public.contact_behavior](tables/public/contact_behavior.md) | table | sim | 4 | 35 | não |  |
| [public.contact_business_context](tables/public/contact_business_context.md) | table | sim | 4 | 9 | não |  |
| [public.contact_cadence](tables/public/contact_cadence.md) | table | sim | 8 | 11 | não | SINGU: Cadência ideal de contato por lead/cliente. Auto-remind e next_contact_due. |
| [public.contact_cadence_audit](tables/public/contact_cadence_audit.md) | table | sim | 1 | 9 | não |  |
| [public.contact_decision_making](tables/public/contact_decision_making.md) | table | sim | 4 | 9 | não |  |
| [public.contact_emails](tables/public/contact_emails.md) | table | sim | 5 | 12 | não | Endereços de e-mail associados a contatos, permitindo múltiplos e-mails tipados e sinalização de principal/verificado. Cada registro referencia public.contacts.id. |
| [public.contact_family_history](tables/public/contact_family_history.md) | table | sim | 2 | 5 | não |  |
| [public.contact_influence](tables/public/contact_influence.md) | table | sim | 4 | 8 | não |  |
| [public.contact_metaprograms](tables/public/contact_metaprograms.md) | table | sim | 4 | 15 | não |  |
| [public.contact_next_actions](tables/public/contact_next_actions.md) | table | sim | 4 | 23 | não |  |
| [public.contact_notes](tables/public/contact_notes.md) | table | sim | 4 | 9 | não | ZAPP WEB: Notas rápidas de contato. Criadas pelo painel Contact 360° durante atendimento. FK contacts(id). |
| [public.contact_objection_scripts](tables/public/contact_objection_scripts.md) | table | sim | 2 | 9 | não |  |
| [public.contact_personality](tables/public/contact_personality.md) | table | sim | 3 | 21 | não |  |
| [public.contact_phones](tables/public/contact_phones.md) | table | sim | 6 | 15 | não | Telefones associados a contatos, com tipo, normalização, sinalizadores de principal/WhatsApp/verificação e metadados de origem. Cada registro referencia public.contacts.id. |
| [public.contact_predictive_roadmap](tables/public/contact_predictive_roadmap.md) | table | sim | 5 | 10 | não |  |
| [public.contact_preferences](tables/public/contact_preferences.md) | table | sim | 8 | 13 | não | SINGU: Preferências pessoais de comunicação (canal, horários, restrições). |
| [public.contact_preferences_audit](tables/public/contact_preferences_audit.md) | table | sim | 1 | 9 | não |  |
| [public.contact_rapport_strategy](tables/public/contact_rapport_strategy.md) | table | sim | 4 | 15 | não |  |
| [public.contact_relatives](tables/public/contact_relatives.md) | table | sim | 8 | 15 | não | SINGU: Familiares e relacionados do contato para estratégias de rapport. |
| [public.contact_relatives_audit](tables/public/contact_relatives_audit.md) | table | sim | 1 | 9 | não |  |
| [public.contact_report_overrides](tables/public/contact_report_overrides.md) | table | sim | 3 | 6 | não |  |
| [public.contact_social_media](tables/public/contact_social_media.md) | table | sim | 1 | 17 | não |  |
| [public.contact_time_analysis](tables/public/contact_time_analysis.md) | table | sim | 8 | 9 | não | SINGU: Heatmap de melhores horários/dias para contatar cada lead. Grid 7x24. |
| [public.contact_time_analysis_audit](tables/public/contact_time_analysis_audit.md) | table | sim | 1 | 9 | não |  |
| [public.contacts](tables/public/contacts.md) | table | sim | 10 | 65 | sim | Cadastro de pessoas/contatos comerciais vinculados opcionalmente a uma empresa. Reúne identificação, canais de contato, papéis de compra, atributos comportamentais e dados derivados. PK: id. company_id referencia public.companies.id; duplicate_of referencia public.contacts.id; assigned_by_id referencia public.users.id. Preferir as tabelas contact_emails, contact_phones e contact_social_media para múltiplos canais quando apropriado; não assumir que os campos legados equivalem a essas tabelas. |
| [public.conversation_analyses](tables/public/conversation_analyses.md) | table | sim | 4 | 23 | não |  |
| [public.conversation_topics_catalog](tables/public/conversation_topics_catalog.md) | table | sim | 4 | 10 | não |  |
| [public.conversational_search_cache](tables/public/conversational_search_cache.md) | table | sim | 4 | 8 | não |  |
| [public.coop_sistemas](tables/public/coop_sistemas.md) | table | sim | 1 | 14 | não |  |
| [public.crm_alerts](tables/public/crm_alerts.md) | table | sim | 1 | 10 | não |  |
| [public.crm_automation_logs](tables/public/crm_automation_logs.md) | table | sim | 1 | 10 | não |  |
| [public.crm_automation_reprocess_queue](tables/public/crm_automation_reprocess_queue.md) | table | sim | 1 | 8 | não |  |
| [public.crm_cadence_rules](tables/public/crm_cadence_rules.md) | table | sim | 1 | 11 | não |  |
| [public.crm_consent_audit_logs](tables/public/crm_consent_audit_logs.md) | table | sim | 1 | 10 | não |  |
| [public.crm_metric_overrides](tables/public/crm_metric_overrides.md) | table | sim | 1 | 8 | não |  |
| [public.crm_objection_intelligence](tables/public/crm_objection_intelligence.md) | table | sim | 1 | 9 | não |  |
| [public.crm_relationship_audit_logs](tables/public/crm_relationship_audit_logs.md) | table | sim | 1 | 10 | não |  |
| [public.cron_secrets](tables/public/cron_secrets.md) | table | sim | 1 | 4 | não |  |
| [public.cs_accounts](tables/public/cs_accounts.md) | table | sim | 4 | 17 | não |  |
| [public.cs_health_signals](tables/public/cs_health_signals.md) | table | sim | 4 | 10 | não |  |
| [public.cs_nps_responses](tables/public/cs_nps_responses.md) | table | sim | 4 | 9 | não |  |
| [public.cs_qbrs](tables/public/cs_qbrs.md) | table | sim | 4 | 14 | não |  |
| [public.cs_renewals](tables/public/cs_renewals.md) | table | sim | 4 | 12 | não |  |
| [public.csat_surveys](tables/public/csat_surveys.md) | table | sim | 6 | 21 | não | SINGU: Pesquisas de satisfação (CSAT 1-5, NPS 0-10, CES 1-7). Vinculadas opcionalmente a ticket/contact/company. |
| [public.custom_field_values](tables/public/custom_field_values.md) | table | sim | 5 | 12 | não |  |
| [public.custom_fields](tables/public/custom_fields.md) | table | sim | 5 | 13 | não |  |
| [public.customer_events](tables/public/customer_events.md) | table | sim | 3 | 13 | não | Todos os eventos do ciclo de vida do cliente |
| [public.customer_health_scores](tables/public/customer_health_scores.md) | table | sim | 1 | 13 | não |  |
| [public.customer_ownership_history](tables/public/customer_ownership_history.md) | table | sim | 5 | 17 | não | Histórico de qual vendedor foi dono de cada cliente |
| [public.customer_purchases](tables/public/customer_purchases.md) | table | sim | 1 | 12 | não |  |
| [public.customer_rotation_state](tables/public/customer_rotation_state.md) | table | sim | 4 | 15 | não |  |
| [public.customer_sdr_history](tables/public/customer_sdr_history.md) | table | sim | 5 | 21 | não | Histórico de prospecção SDR ↔ Cliente |
| [public.customer_surveys](tables/public/customer_surveys.md) | table | sim | 1 | 13 | não |  |
| [public.customers](tables/public/customers.md) | table | sim | 4 | 37 | não | Extensão comercial de public.companies para empresas qualificadas como clientes. Armazena carteira, responsável comercial, ativação, histórico agregado de compras e métricas de valor. company_id é UNIQUE e referencia public.companies.id; id é a PK. O soft delete é representado por deleted_at. |
| [public.daily_challenges](tables/public/daily_challenges.md) | table | sim | 1 | 10 | não |  |
| [public.data_quality_audits](tables/public/data_quality_audits.md) | table | sim | 2 | 15 | não | Registro permanente de auditorias de qualidade de dados por sistema cooperativo |
| [public.deal_competitors](tables/public/deal_competitors.md) | table | sim | 1 | 6 | não |  |
| [public.deal_forecasts](tables/public/deal_forecasts.md) | table | sim | 4 | 21 | não |  |
| [public.deal_items](tables/public/deal_items.md) | table | sim | 1 | 10 | não | Linhas de produto/serviço associadas a uma oportunidade de public.deals. Registra quantidade, preço, desconto e total calculado. deal_id referencia public.deals.id; product_id referencia public.products.id. |
| [public.deal_room_activities](tables/public/deal_room_activities.md) | table | sim | 1 | 8 | não |  |
| [public.deal_room_comments](tables/public/deal_room_comments.md) | table | sim | 1 | 7 | não |  |
| [public.deal_room_documents](tables/public/deal_room_documents.md) | table | sim | 1 | 11 | não |  |
| [public.deal_room_milestones](tables/public/deal_room_milestones.md) | table | sim | 1 | 13 | não |  |
| [public.deal_room_stakeholders](tables/public/deal_room_stakeholders.md) | table | sim | 1 | 13 | não |  |
| [public.deal_rooms](tables/public/deal_rooms.md) | table | sim | 1 | 19 | não |  |
| [public.deal_velocity_analysis](tables/public/deal_velocity_analysis.md) | table | sim | 2 | 15 | não | Análise de velocidade de fechamento de deals |
| [public.deals](tables/public/deals.md) | table | sim | 8 | 17 | não | Registro de oportunidade de venda do CRM. Cada linha representa um negócio vinculado opcionalmente a uma empresa e a um contato, com valor, etapa, probabilidade e previsão de fechamento. O status possui domínio fechado e os itens do negócio são relacionados em public.deal_items. Chaves principais: id; company_id → public.companies.id; contact_id → public.contacts.id; user_id → public.profiles.id; loss_reason_id → public.loss_reasons.id. |
| [public.decision_criteria](tables/public/decision_criteria.md) | table | sim | 8 | 10 | não | SINGU: Critérios que o contato usa para decidir compras (preço, qualidade, confiança). |
| [public.device_login_notifications](tables/public/device_login_notifications.md) | table | sim | 5 | 14 | não | SINGU: Notificações enviadas em eventos de login anômalos. Trackeia resposta do usuário (trusted/reported_fraud). |
| [public.disc_analysis_history](tables/public/disc_analysis_history.md) | table | sim | 8 | 23 | não | SINGU: Histórico de análises DISC por contato. Cada registro = 1 análise (manual ou IA). FK contacts(id). |
| [public.disc_analysis_history_audit](tables/public/disc_analysis_history_audit.md) | table | sim | 1 | 9 | não |  |
| [public.disc_approach_recommendations](tables/public/disc_approach_recommendations.md) | table | sim | 2 | 13 | não | Recomendações estratégicas de abordagem por perfil DISC |
| [public.disc_communication_logs](tables/public/disc_communication_logs.md) | table | sim | 8 | 12 | não | SINGU: Logs de comunicação adaptada ao perfil DISC. Registra se vendedor seguiu as dicas. |
| [public.disc_conversion_metrics](tables/public/disc_conversion_metrics.md) | table | sim | 9 | 17 | não | SINGU: Métricas agregadas de conversão por perfil DISC. Dados periódicos. |
| [public.disc_profile_config](tables/public/disc_profile_config.md) | table | sim | 2 | 51 | não | SINGU: Configuração e características de cada perfil DISC |
| [public.disc_templates](tables/public/disc_templates.md) | table | sim | 2 | 15 | não | Templates de comunicação adaptados por perfil DISC |
| [public.document_signatures](tables/public/document_signatures.md) | table | sim | 8 | 36 | não | SINGU: Assinaturas eletrônicas de documentos com multi-signer, ordering, tracking completo (IP, device, location) e métodos variados. |
| [public.document_templates](tables/public/document_templates.md) | table | sim | 8 | 16 | não | SINGU: Templates reutilizáveis de documentos (contratos, propostas, NDAs) com variáveis substituíveis. |
| [public.document_views](tables/public/document_views.md) | table | sim | 6 | 21 | não | SINGU: Rastreamento granular de visualizações de documentos (páginas vistas, duração, downloads, geo). |
| [public.documents](tables/public/documents.md) | table | sim | 5 | 17 | não |  |
| [public.duplicate_candidates](tables/public/duplicate_candidates.md) | table | sim | 1 | 10 | não |  |
| [public.economic_group_members](tables/public/economic_group_members.md) | table | sim | 1 | 5 | não |  |
| [public.economic_groups](tables/public/economic_groups.md) | table | sim | 1 | 8 | não |  |
| [public.email_campaigns](tables/public/email_campaigns.md) | table | sim | 5 | 33 | não | SINGU: Campanhas de email marketing com Email Builder Visual (blocos), A/B test, agendamento e métricas full-funnel. |
| [public.email_finder_results](tables/public/email_finder_results.md) | table | sim | 4 | 14 | não |  |
| [public.email_logs](tables/public/email_logs.md) | table | sim | 2 | 14 | não |  |
| [public.email_thread_summaries](tables/public/email_thread_summaries.md) | table | sim | 4 | 12 | não |  |
| [public.email_verifications](tables/public/email_verifications.md) | table | sim | 4 | 17 | não |  |
| [public.embedding_configs](tables/public/embedding_configs.md) | table | sim | 4 | 11 | não |  |
| [public.emotional_anchors](tables/public/emotional_anchors.md) | table | sim | 8 | 10 | não | SINGU: Palavras/temas gatilho que desencadeiam reações emocionais específicas. |
| [public.emotional_states_history](tables/public/emotional_states_history.md) | table | sim | 8 | 9 | não | SINGU: Evolução emocional do contato ao longo das interações. |
| [public.entity_relationships](tables/public/entity_relationships.md) | table | sim | 4 | 14 | não |  |
| [public.eq_analysis_history](tables/public/eq_analysis_history.md) | table | sim | 8 | 16 | não | SINGU: Histórico de análises de Inteligência Emocional (EQ). 5 pilares: self_awareness, self_regulation, motivation, empathy, social_skills. |
| [public.eq_assessment_questions](tables/public/eq_assessment_questions.md) | table | sim | 2 | 12 | não | Perguntas para avaliação de EQ |
| [public.error_logs](tables/public/error_logs.md) | table | sim | 2 | 9 | não |  |
| [public.estados](tables/public/estados.md) | table | sim | 2 | 6 | não | Catálogo oficial de estados brasileiros. Fonte: IBGE. |
| [public.external_data_audit_log](tables/public/external_data_audit_log.md) | table | sim | 1 | 7 | não |  |
| [public.favorite_templates](tables/public/favorite_templates.md) | table | sim | 7 | 4 | não | SINGU: Templates de mensagem favoritos do usuário. Unique(user_id, template_id). |
| [public.favorites](tables/public/favorites.md) | table | sim | 4 | 5 | não |  |
| [public.feature_flags](tables/public/feature_flags.md) | table | sim | 4 | 6 | não |  |
| [public.ficha360_conversation_summaries](tables/public/ficha360_conversation_summaries.md) | table | sim | 3 | 10 | não |  |
| [public.follow_up_approvals](tables/public/follow_up_approvals.md) | table | sim | 5 | 10 | não |  |
| [public.follow_up_approvals_v2](tables/public/follow_up_approvals_v2.md) | table | sim | 2 | 9 | não |  |
| [public.forecast_categories_history](tables/public/forecast_categories_history.md) | table | sim | 2 | 8 | não |  |
| [public.forecast_periods](tables/public/forecast_periods.md) | table | sim | 4 | 12 | não |  |
| [public.forecast_quota_settings](tables/public/forecast_quota_settings.md) | table | sim | 3 | 12 | não |  |
| [public.forecast_snapshots](tables/public/forecast_snapshots.md) | table | sim | 3 | 11 | não |  |
| [public.form_submissions](tables/public/form_submissions.md) | table | sim | 2 | 15 | não |  |
| [public.forms](tables/public/forms.md) | table | sim | 3 | 15 | não |  |
| [public.geo_allowed_countries](tables/public/geo_allowed_countries.md) | table | sim | 5 | 6 | não | SINGU: Países permitidos por usuário (ISO 3166-1 alpha-2). Usado se access_security_settings.geo_restriction_enabled=true. |
| [public.grupos_economicos](tables/public/grupos_economicos.md) | table | sim | 1 | 9 | não | Grupos econômicos (Sicoob, Sicredi, Cresol, etc) |
| [public.guardrail_ml_logs](tables/public/guardrail_ml_logs.md) | table | sim | 2 | 10 | não |  |
| [public.handoff_requests](tables/public/handoff_requests.md) | table | sim | 9 | 31 | não | SINGU: Fila de handoff SDR→Closer com qualificação BANT (Budget/Authority/Need/Timing), SLA de aceite de 4h (configurável) e tracking completo. Estados: pending → accepted/rejected/expired. |
| [public.health_alert_settings](tables/public/health_alert_settings.md) | table | sim | 8 | 12 | não | SINGU: Config de alertas de saúde por usuário. Thresholds e canais de notificação. |
| [public.health_alerts](tables/public/health_alerts.md) | table | sim | 8 | 12 | sim | SINGU: Alertas quando saúde do relacionamento com contato cai (score drop). |
| [public.hidden_objections](tables/public/hidden_objections.md) | table | sim | 8 | 14 | não | SINGU: Objeções não verbalizadas detectadas por IA. Inclui sonda sugerida e templates de resolução. |
| [public.import_jobs](tables/public/import_jobs.md) | table | sim | 1 | 17 | não |  |
| [public.inactivity_alerts](tables/public/inactivity_alerts.md) | table | sim | 1 | 16 | não |  |
| [public.incoming_webhook_dlq](tables/public/incoming_webhook_dlq.md) | table | sim | 1 | 13 | não |  |
| [public.incoming_webhook_logs](tables/public/incoming_webhook_logs.md) | table | sim | 2 | 11 | não |  |
| [public.incoming_webhook_nonces](tables/public/incoming_webhook_nonces.md) | table | sim | 1 | 4 | não |  |
| [public.incoming_webhooks](tables/public/incoming_webhooks.md) | table | sim | 1 | 17 | não |  |
| [public.insights](tables/public/insights.md) | table | sim | 8 | 13 | sim | Insights de IA sobre contatos/empresas |
| [public.integration_logs](tables/public/integration_logs.md) | table | sim | 1 | 10 | não |  |
| [public.integrations](tables/public/integrations.md) | table | sim | 1 | 13 | não |  |
| [public.intent_scores](tables/public/intent_scores.md) | table | sim | 4 | 11 | não |  |
| [public.intent_signals](tables/public/intent_signals.md) | table | sim | 4 | 11 | não |  |
| [public.intent_tracking_pixels](tables/public/intent_tracking_pixels.md) | table | sim | 4 | 10 | não |  |
| [public.interaction_summaries](tables/public/interaction_summaries.md) | table | sim | 2 | 11 | não |  |
| [public.interaction_templates](tables/public/interaction_templates.md) | table | sim | 4 | 14 | não |  |
| [public.interactions](tables/public/interactions.md) | table | sim | 10 | 43 | sim | Histórico de interações comerciais e de relacionamento com contatos e/ou empresas. Registra canal, direção, estado, conteúdo, agendamento, responsável e metadados. Uma interação pode referenciar contato, empresa e usuário responsável; as tabelas de análise podem referenciar interactions.id. PK: id. |
| [public.interactions_audit](tables/public/interactions_audit.md) | table | sim | 1 | 9 | não |  |
| [public.ip_whitelist](tables/public/ip_whitelist.md) | table | sim | 5 | 12 | não | SINGU: IPs/CIDRs permitidos por usuário. Usado se access_security_settings.ip_whitelist_enabled=true. |
| [public.knowledge_base_articles](tables/public/knowledge_base_articles.md) | table | sim | 5 | 20 | não | SINGU: Artigos da base de conhecimento público/interno. search_vector para busca full-text. Workflow draft→published→archived. |
| [public.landing_page_submissions](tables/public/landing_page_submissions.md) | table | sim | 6 | 29 | não | SINGU: Submissões capturadas via landing pages com UTMs, geolocalização e anti-spam scoring. |
| [public.landing_pages](tables/public/landing_pages.md) | table | sim | 7 | 29 | não | SINGU: Landing pages (rota pública /lp/:slug) com builder visual, captura de leads e UTMs. Mem: features/landing-pages-module. |
| [public.lead_assignments](tables/public/lead_assignments.md) | table | sim | 9 | 23 | não | SINGU: Histórico completo de atribuições de leads. Cada atribuição (automática via regra, manual, ou handoff SDR→Closer) gera um registro com SLA tracking, status e motivo de rejeição se aplicável. Append-only via convenção. |
| [public.lead_magnet_downloads](tables/public/lead_magnet_downloads.md) | table | sim | 2 | 10 | não |  |
| [public.lead_magnets](tables/public/lead_magnets.md) | table | sim | 2 | 16 | não |  |
| [public.lead_routing_rules](tables/public/lead_routing_rules.md) | table | sim | 9 | 16 | não | SINGU: Regras configuráveis de roteamento de leads (round-robin, ponderado, por território/indústria/fonte). Prioridade define ordem de avaliação. role_filter e team_pool definem o universo elegível. |
| [public.lead_score_config](tables/public/lead_score_config.md) | table | sim | 7 | 16 | não | SINGU: Config de pesos e thresholds do lead scoring por usuário. Soma dos 4 pesos = 1.00. Thresholds ordenados crescente. |
| [public.lead_score_history](tables/public/lead_score_history.md) | table | sim | 3 | 16 | não |  |
| [public.lead_score_recompute_queue](tables/public/lead_score_recompute_queue.md) | table | sim | 2 | 6 | não |  |
| [public.lead_score_rules](tables/public/lead_score_rules.md) | table | sim | 4 | 9 | não |  |
| [public.lead_score_threshold_automations](tables/public/lead_score_threshold_automations.md) | table | sim | 4 | 15 | não |  |
| [public.lead_score_threshold_log](tables/public/lead_score_threshold_log.md) | table | sim | 2 | 11 | não |  |
| [public.lead_score_thresholds](tables/public/lead_score_thresholds.md) | table | sim | 4 | 6 | não |  |
| [public.lead_scores](tables/public/lead_scores.md) | table | sim | 8 | 23 | não | SINGU: Score atual de lead por contato. 4 dimensões ponderadas (Engagement 30%, Fit 20%, Intent 25%, Relationship 25%). Grade automática. 1 registro por contato. Série temporal em lead_score_history. |
| [public.lead_sources](tables/public/lead_sources.md) | table | sim | 2 | 7 | não | Catálogo de origens de leads utilizado por entidades comerciais que guardam source_id. Mantém nome, categoria, descrição, custo por lead e estado ativo. PK: id; nome é UNIQUE. |
| [public.life_events](tables/public/life_events.md) | table | sim | 8 | 13 | não | SINGU: Eventos importantes (aniversários, promoções) para oportunidades de rapport. |
| [public.life_events_history](tables/public/life_events_history.md) | table | sim | 1 | 12 | não |  |
| [public.login_attempts](tables/public/login_attempts.md) | table | sim | 4 | 15 | não | SINGU: Log de TODAS as tentativas de login (success=true/false) para detecção de brute force via query nos últimos N minutos. |
| [public.loss_reasons](tables/public/loss_reasons.md) | table | sim | 2 | 7 | não | Catálogo de motivos de perda de oportunidades. Usado por public.deals.loss_reason_id; nome é UNIQUE. Pode indicar se o usuário deve fornecer detalhes adicionais. |
| [public.lux_intelligence](tables/public/lux_intelligence.md) | table | sim | 8 | 21 | não | Inteligência Lux (análise comportamental) |
| [public.lux_webhook_config](tables/public/lux_webhook_config.md) | table | sim | 8 | 36 | não | SINGU: Configurações de webhooks do módulo Lux Intelligence. Cada linha = 1 endpoint n8n/externo para enriquecimento profundo (redes sociais, CNPJ, LinkedIn). Inclui auth, retry exponencial, rate limiting e estatísticas. Admin UI: /admin/lux-config. |
| [public.marketing_campaign_stats](tables/public/marketing_campaign_stats.md) | table | sim | 3 | 13 | não |  |
| [public.marketing_roi_data](tables/public/marketing_roi_data.md) | table | sim | 2 | 10 | não |  |
| [public.mcp_tool_calls](tables/public/mcp_tool_calls.md) | table | sim | 2 | 8 | não |  |
| [public.meeting_summaries](tables/public/meeting_summaries.md) | table | sim | 8 | 29 | não | SINGU: Resumos de reuniões gerados por IA. Edge Function meeting-summary extrai decisões, action items, participantes e next steps de transcript/audio/video. |
| [public.meetings](tables/public/meetings.md) | table | sim | 4 | 18 | não |  |
| [public.message_templates](tables/public/message_templates.md) | table | sim | 1 | 12 | não |  |
| [public.metaprogram_analysis](tables/public/metaprogram_analysis.md) | table | sim | 8 | 20 | não | SINGU: Análise de metaprogramas PNL (Toward/Away, Internal/External, Options/Procedures). |
| [public.model_pricing_v2](tables/public/model_pricing_v2.md) | table | sim | 1 | 11 | não |  |
| [public.mql_classifications](tables/public/mql_classifications.md) | table | sim | 1 | 14 | não |  |
| [public.mql_criteria](tables/public/mql_criteria.md) | table | sim | 1 | 11 | não |  |
| [public.neuro_behavioral_history](tables/public/neuro_behavioral_history.md) | table | sim | 2 | 10 | não |  |
| [public.neuro_pnl_sessions](tables/public/neuro_pnl_sessions.md) | table | sim | 3 | 13 | não |  |
| [public.nlp_extractions](tables/public/nlp_extractions.md) | table | sim | 2 | 12 | não |  |
| [public.nlp_feedback](tables/public/nlp_feedback.md) | table | sim | 2 | 10 | não |  |
| [public.notification_logs](tables/public/notification_logs.md) | table | sim | 1 | 9 | não |  |
| [public.notification_preferences](tables/public/notification_preferences.md) | table | sim | 3 | 10 | não |  |
| [public.notifications](tables/public/notifications.md) | table | sim | 4 | 11 | não |  |
| [public.nps_surveys](tables/public/nps_surveys.md) | table | sim | 1 | 12 | não |  |
| [public.nurturing_enrollments](tables/public/nurturing_enrollments.md) | table | sim | 5 | 13 | não | SINGU: Contatos em workflows de nurturing. Context carrega estado entre steps. |
| [public.nurturing_executions](tables/public/nurturing_executions.md) | table | sim | 1 | 14 | não |  |
| [public.nurturing_workflows](tables/public/nurturing_workflows.md) | table | sim | 5 | 17 | não | SINGU: Fluxos de nutrição long-term (mais complexos que sequences). Trigger-based (score/segment/inactivity/event). |
| [public.oauth_tokens](tables/public/oauth_tokens.md) | table | sim | 1 | 5 | não | Tokens OAuth para integrações externas |
| [public.objection_example_feedback](tables/public/objection_example_feedback.md) | table | sim | 4 | 8 | não |  |
| [public.offer_suggestions](tables/public/offer_suggestions.md) | table | sim | 8 | 14 | não | SINGU: Ofertas personalizadas sugeridas pela IA com base no perfil comportamental. |
| [public.password_reset_requests](tables/public/password_reset_requests.md) | table | sim | 3 | 18 | não | SINGU: Tokens de reset de senha (armazenados como hash). Single-use com expiração. |
| [public.people_intelligence_events](tables/public/people_intelligence_events.md) | table | sim | 3 | 12 | não |  |
| [public.permissions](tables/public/permissions.md) | table | sim | 4 | 7 | não |  |
| [public.phone_validations](tables/public/phone_validations.md) | table | sim | 4 | 17 | não |  |
| [public.pipeline_stage_transitions](tables/public/pipeline_stage_transitions.md) | table | sim | 2 | 6 | não |  |
| [public.pipeline_stages](tables/public/pipeline_stages.md) | table | sim | 2 | 14 | não | Etapas pertencentes a um pipeline comercial. Registra nome, ordem, probabilidade, estados de início/ganho/perda e SLA. pipeline_id referencia public.pipelines.id; outras entidades de negócio podem referenciar a etapa conforme suas FKs. |
| [public.pipelines](tables/public/pipelines.md) | table | sim | 2 | 12 | não | Configuração de pipelines comerciais. Cada registro define um fluxo de trabalho de vendas, suas opções de múltiplas oportunidades, meta mensal e ordenação. PK: id. As etapas são relacionadas por public.pipeline_stages.pipeline_id. |
| [public.playbook_usage_log](tables/public/playbook_usage_log.md) | table | sim | 2 | 9 | não |  |
| [public.portfolio_settings](tables/public/portfolio_settings.md) | table | sim | 2 | 5 | não |  |
| [public.product_novelties](tables/public/product_novelties.md) | table | sim | 2 | 13 | não | Ciclo de vida do selo NOVO. Pipeline popula via fn_populate_novelties_from_supplier. Trigger sincroniza products.is_new automaticamente. |
| [public.products](tables/public/products.md) | table | sim | 1 | 14 | não | Catálogo de produtos/serviços comercializados. Contém SKU, preço, custo, estoque e metadados. PK: id; SKU é opcional e UNIQUE. Relaciona-se a itens de oportunidade por public.deal_items.product_id e a novidades por public.product_novelties.product_id. |
| [public.profiles](tables/public/profiles.md) | table | sim | 8 | 26 | não | SINGU: Perfis de usuários do sistema, vinculados ao Supabase Auth |
| [public.proposals](tables/public/proposals.md) | table | sim | 4 | 22 | não | Propostas comerciais/orçamentos vinculados opcionalmente a empresa, contato e oportunidade. Mantém totais, desconto, estado do ciclo de envio/resposta, validade e itens em JSONB. PK: id. Relacionamentos: company_id → public.companies.id; contact_id → public.contacts.id; deal_id → public.deals.id; user_id → public.profiles.id. |
| [public.proximo_passo_feedback](tables/public/proximo_passo_feedback.md) | table | sim | 3 | 9 | não |  |
| [public.psychographic_audit_log](tables/public/psychographic_audit_log.md) | table | sim | 1 | 8 | não |  |
| [public.purchase_history](tables/public/purchase_history.md) | table | sim | 8 | 17 | não |  |
| [public.push_subscriptions](tables/public/push_subscriptions.md) | table | sim | 10 | 7 | não |  |
| [public.query_telemetry](tables/public/query_telemetry.md) | table | sim | 7 | 13 | não |  |
| [public.quick_notes](tables/public/quick_notes.md) | table | sim | 4 | 9 | não |  |
| [public.ragas_scores](tables/public/ragas_scores.md) | table | sim | 2 | 15 | não |  |
| [public.redistribution_log](tables/public/redistribution_log.md) | table | sim | 5 | 19 | não | SINGU: Log append-only de redistribuições de carteira. Cada linha = 1 transferência de lead de um vendedor para outro, com motivo (inatividade, férias, cap excedido, manual, etc). Base para auditoria e analytics de rotação. |
| [public.reframing_analysis](tables/public/reframing_analysis.md) | table | sim | 3 | 13 | não |  |
| [public.reframing_analysis_audit](tables/public/reframing_analysis_audit.md) | table | sim | 1 | 9 | não |  |
| [public.relationship_score_history](tables/public/relationship_score_history.md) | table | sim | 4 | 18 | não | SINGU: Histórico de evolução do score de relacionamento |
| [public.reminders](tables/public/reminders.md) | table | sim | 4 | 12 | não |  |
| [public.report_executions](tables/public/report_executions.md) | table | sim | 1 | 9 | não |  |
| [public.revops_alerts](tables/public/revops_alerts.md) | table | sim | 4 | 10 | não |  |
| [public.revops_benchmarks](tables/public/revops_benchmarks.md) | table | sim | 4 | 9 | não |  |
| [public.revops_snapshots](tables/public/revops_snapshots.md) | table | sim | 3 | 10 | não |  |
| [public.rfm_analysis](tables/public/rfm_analysis.md) | table | sim | 5 | 41 | não | SINGU: Análise RFM corrente por empresa (1 registro por company_id). Snapshot atual. Série histórica vai em rfm_history. Configuração de segmentos em rfm_segment_config. Segments typical: Champions, Loyal, At Risk, Lost, New, Promising, Need Attention, About to Sleep, Cannot Lose Them, Hibernating. |
| [public.rfm_history](tables/public/rfm_history.md) | table | sim | 5 | 10 | não |  |
| [public.rfm_metrics](tables/public/rfm_metrics.md) | table | sim | 5 | 22 | não |  |
| [public.rfm_segment_config](tables/public/rfm_segment_config.md) | table | sim | 5 | 28 | não | SINGU: Configuração dos segmentos RFM |
| [public.rodizio_distribuicao_staging](tables/public/rodizio_distribuicao_staging.md) | table | sim | 4 | 12 | não |  |
| [public.rodizio_execucoes](tables/public/rodizio_execucoes.md) | table | sim | 3 | 12 | não |  |
| [public.role_permissions](tables/public/role_permissions.md) | table | sim | 4 | 4 | não |  |
| [public.rpc_perf_samples](tables/public/rpc_perf_samples.md) | table | sim | 1 | 4 | não |  |
| [public.rpc_plan_snapshots](tables/public/rpc_plan_snapshots.md) | table | sim | 2 | 9 | não |  |
| [public.sales](tables/public/sales.md) | table | sim | 2 | 13 | não | Registro simplificado de venda/atividade comercial legado, com nome de cliente e produto como snapshots textuais, valor e estado do ciclo comercial. Não confundir com public.deals, que é a entidade de oportunidade vinculada a company/contact. PK: id; salesperson_id → public.salespeople.id; deleted_by → auth.users.id. |
| [public.sales_activities](tables/public/sales_activities.md) | table | sim | 2 | 12 | não |  |
| [public.sales_cadences](tables/public/sales_cadences.md) | table | sim | 1 | 9 | não |  |
| [public.sales_forecasts](tables/public/sales_forecasts.md) | table | sim | 1 | 10 | não |  |
| [public.sales_goals](tables/public/sales_goals.md) | table | sim | 4 | 9 | não |  |
| [public.sales_opportunities](tables/public/sales_opportunities.md) | table | sim | 1 | 17 | não |  |
| [public.sales_playbooks](tables/public/sales_playbooks.md) | table | sim | 4 | 15 | não |  |
| [public.sales_scripts](tables/public/sales_scripts.md) | table | sim | 2 | 17 | não |  |
| [public.sales_tasks](tables/public/sales_tasks.md) | table | sim | 1 | 16 | não |  |
| [public.sales_team_members](tables/public/sales_team_members.md) | table | sim | 9 | 28 | não | SINGU: Membros do time de vendas com role (sdr/closer/manager), peso para round-robin ponderado (1-10), caps diário/total e controle de férias. Usado pelo módulo Lead Routing & Portfolio Rotation. |
| [public.salespeople](tables/public/salespeople.md) | table | sim | 2 | 10 | não | Cadastro de vendedores |
| [public.scheduled_reports](tables/public/scheduled_reports.md) | table | sim | 1 | 12 | não |  |
| [public.scheduled_visits](tables/public/scheduled_visits.md) | table | sim | 4 | 12 | não |  |
| [public.schema_drift_alerts](tables/public/schema_drift_alerts.md) | table | sim | 7 | 11 | não |  |
| [public.score_history](tables/public/score_history.md) | table | sim | 8 | 10 | não | Historical record of all calculated scores for contacts |
| [public.script_sections](tables/public/script_sections.md) | table | sim | 2 | 18 | não |  |
| [public.sdr_alert_history](tables/public/sdr_alert_history.md) | table | sim | 2 | 8 | não |  |
| [public.sdr_closer_assignments](tables/public/sdr_closer_assignments.md) | table | sim | 2 | 13 | não | Histórico de vínculo SDR ↔ CLOSER |
| [public.search_products_cache](tables/public/search_products_cache.md) | table | sim | 5 | 20 | não | SINGU: Cache de buscas de produtos por fornecedor (XBZ/Stricker/SPOT). TTL 6h. query_hash para dedup. |
| [public.secret_rotation_log](tables/public/secret_rotation_log.md) | table | sim | 1 | 9 | não |  |
| [public.seller_daily_metrics](tables/public/seller_daily_metrics.md) | table | sim | 1 | 16 | não |  |
| [public.semantic_search_cache](tables/public/semantic_search_cache.md) | table | sim | 5 | 13 | não | SINGU: Cache de buscas semânticas (embedding-based) com TTL 24h. query_embedding_hash para matching determinístico. |
| [public.sentiment_annotations](tables/public/sentiment_annotations.md) | table | sim | 4 | 9 | não |  |
| [public.sequence_email_reservations](tables/public/sequence_email_reservations.md) | table | sim | 1 | 9 | não |  |
| [public.sequence_enrollments](tables/public/sequence_enrollments.md) | table | sim | 6 | 19 | não | SINGU: Matrículas de contatos em sequências. Pause automático on reply / on meeting_booked. 1 por contato por sequência (unique). |
| [public.sequence_events](tables/public/sequence_events.md) | table | sim | 3 | 9 | não |  |
| [public.sequence_send_log](tables/public/sequence_send_log.md) | table | sim | 2 | 16 | não |  |
| [public.sequence_steps](tables/public/sequence_steps.md) | table | sim | 5 | 22 | não | SINGU: Passos individuais de uma sequência. Ordem via step_number. Delay em dias+horas. Canal: email/whatsapp/sms/call/linkedin/task/wait. |
| [public.sequences](tables/public/sequences.md) | table | sim | 5 | 20 | não | SINGU: Sequências (cadências) multi-canal de contato. Mãe dos steps individuais em sequence_steps. |
| [public.sla_rules](tables/public/sla_rules.md) | table | sim | 1 | 9 | não |  |
| [public.sla_violations](tables/public/sla_violations.md) | table | sim | 4 | 10 | não |  |
| [public.sleight_of_mouth_examples](tables/public/sleight_of_mouth_examples.md) | table | sim | 2 | 11 | não |  |
| [public.sleight_of_mouth_patterns](tables/public/sleight_of_mouth_patterns.md) | table | sim | 2 | 16 | não |  |
| [public.sm_upload_mapping](tables/public/sm_upload_mapping.md) | table | sim | 1 | 7 | não |  |
| [public.smart_notifications](tables/public/smart_notifications.md) | table | sim | 4 | 21 | sim |  |
| [public.smart_segments](tables/public/smart_segments.md) | table | sim | 1 | 11 | não |  |
| [public.sms_campaign_recipients](tables/public/sms_campaign_recipients.md) | table | sim | 8 | 18 | não | SINGU: Destinatários individuais de sms_campaigns. |
| [public.sms_campaigns](tables/public/sms_campaigns.md) | table | sim | 5 | 21 | não | SINGU: Campanhas de SMS com provider configurável, segmentação e tracking de custo. |
| [public.sms_opt_outs](tables/public/sms_opt_outs.md) | table | sim | 5 | 10 | não | SINGU: Lista de telefones que fizeram opt-out de SMS (compliance LGPD). Check obrigatório antes de envio. |
| [public.sms_templates](tables/public/sms_templates.md) | table | sim | 5 | 12 | não | SINGU: Templates reutilizáveis de SMS com placeholders de variáveis. |
| [public.social_behavior_analysis](tables/public/social_behavior_analysis.md) | table | sim | 8 | 21 | não |  |
| [public.social_consent_audit](tables/public/social_consent_audit.md) | table | sim | 2 | 9 | não |  |
| [public.social_insights](tables/public/social_insights.md) | table | sim | 4 | 12 | não |  |
| [public.social_life_events](tables/public/social_life_events.md) | table | sim | 8 | 15 | não |  |
| [public.social_profiles](tables/public/social_profiles.md) | table | sim | 8 | 24 | não |  |
| [public.social_scraping_schedule](tables/public/social_scraping_schedule.md) | table | sim | 8 | 14 | não |  |
| [public.social_sync_queue](tables/public/social_sync_queue.md) | table | sim | 1 | 9 | não |  |
| [public.staging_portal_sicoob](tables/public/staging_portal_sicoob.md) | table | sim | 1 | 22 | não |  |
| [public.stakeholder_alerts](tables/public/stakeholder_alerts.md) | table | sim | 8 | 14 | não |  |
| [public.suggested_life_events](tables/public/suggested_life_events.md) | table | sim | 5 | 13 | não |  |
| [public.suggested_rapport_intel](tables/public/suggested_rapport_intel.md) | table | sim | 4 | 9 | não |  |
| [public.supplier_evaluations](tables/public/supplier_evaluations.md) | table | sim | 1 | 12 | não | Avaliações de fornecedores por entrega ou período. Notas de 1-5 em 4 critérios. Trigger recalcula score automaticamente. |
| [public.supplier_homologations](tables/public/supplier_homologations.md) | table | sim | 1 | 12 | não | Homologação de fornecedores pelo Depto de Compras. Cada registro = uma solicitação/decisão. Histórico completo mantido. |
| [public.supplier_qualification_config](tables/public/supplier_qualification_config.md) | table | sim | 2 | 13 | não | Configuração dos segmentos de classificação (Excelente/Bom/Regular/Insuficiente/Crítico) com faixas de score e cores. |
| [public.supplier_score_history](tables/public/supplier_score_history.md) | table | sim | 2 | 16 | não | Histórico de evolução do score. Cada recálculo gera 1 registro. Permite rastrear tendências ao longo do tempo. |
| [public.supplier_scores](tables/public/supplier_scores.md) | table | sim | 1 | 16 | não | Score consolidado do fornecedor (0-100). Atualizado automaticamente a cada avaliação. 1 registro por fornecedor. |
| [public.suppliers](tables/public/suppliers.md) | table | sim | 1 | 23 | não | Fornecedores vinculados a companies (1:1 via company_id UNIQUE). Campos de qualificação: homologado, data_homologacao, score_geral (caches atualizados por triggers). Homologação: Compras (Thaina id=30, Elen id=31, Stephanie id=32). 4 critérios: preço(25%), prazo(25%), qualidade(30%), entrega(20%). |
| [public.support_tickets](tables/public/support_tickets.md) | table | sim | 5 | 27 | não | SINGU: Tickets de suporte com SLA automático por prioridade, canal multi (email/whatsapp/phone/chat), categorização e CSAT integrado. ticket_number sequential. |
| [public.sync_log](tables/public/sync_log.md) | table | sim | 2 | 14 | não | Log de sincronização com Bitrix24 |
| [public.system_alerts](tables/public/system_alerts.md) | table | sim | 2 | 11 | não |  |
| [public.system_config](tables/public/system_config.md) | table | sim | 2 | 5 | não |  |
| [public.system_health_snapshots](tables/public/system_health_snapshots.md) | table | sim | 2 | 6 | não |  |
| [public.tags](tables/public/tags.md) | table | sim | 2 | 6 | não | Tags/etiquetas para categorização |
| [public.tasks](tables/public/tasks.md) | table | sim | 4 | 17 | não |  |
| [public.territories](tables/public/territories.md) | table | sim | 1 | 9 | não |  |
| [public.territory_assignments](tables/public/territory_assignments.md) | table | sim | 4 | 4 | não |  |
| [public.ticket_comments](tables/public/ticket_comments.md) | table | sim | 5 | 10 | não | SINGU: Comentários/mensagens em tickets. is_internal=true = nota privada (não visível ao cliente). |
| [public.trigger_ab_tests](tables/public/trigger_ab_tests.md) | table | sim | 8 | 33 | não |  |
| [public.trigger_bundles](tables/public/trigger_bundles.md) | table | sim | 8 | 28 | não | SINGU: Combinações pré-configuradas de gatilhos mentais |
| [public.trigger_channel_effectiveness](tables/public/trigger_channel_effectiveness.md) | table | sim | 8 | 23 | não |  |
| [public.trigger_intensity_history](tables/public/trigger_intensity_history.md) | table | sim | 6 | 22 | não | SINGU: Histórico temporal de intensidade dos gatilhos mentais aplicados por contato. Trackeia escalação progressiva (1-5) para analytics de quais níveis converteram. Append-only. is_escalation e reached_max_intensity são computed. |
| [public.trigger_types](tables/public/trigger_types.md) | table | sim | 4 | 18 | não | SINGU: Catálogo de tipos de gatilhos mentais |
| [public.trigger_usage_history](tables/public/trigger_usage_history.md) | table | sim | 8 | 24 | não |  |
| [public.uapi_sessions](tables/public/uapi_sessions.md) | table | sim | 1 | 28 | não | Sessões UAPI Lalamove - tokens e credenciais para integração com br-uapi.lalamove.com |
| [public.user_badges](tables/public/user_badges.md) | table | sim | 4 | 4 | não |  |
| [public.user_goals](tables/public/user_goals.md) | table | sim | 4 | 12 | não |  |
| [public.user_known_devices](tables/public/user_known_devices.md) | table | sim | 5 | 18 | não | SINGU: Dispositivos conhecidos por usuário. Trust flag permite bypass de verificações extras. Revoke imediato em caso de comprometimento. |
| [public.user_roles](tables/public/user_roles.md) | table | sim | 9 | 4 | não |  |
| [public.user_ui_preferences](tables/public/user_ui_preferences.md) | table | sim | 4 | 6 | não |  |
| [public.users](tables/public/users.md) | table | sim | 3 | 16 | não | Usuários/colaboradores sincronizados do Bitrix24 |
| [public.vak_analysis_history](tables/public/vak_analysis_history.md) | table | sim | 8 | 28 | não | SINGU: Histórico de análises VAK (Visual/Auditivo/Cinestésico/Digital) por contato. Cada registro = 1 análise (manual, AI automática via keyword_match em vak_keywords, ou voice_analysis). Espelha o padrão de disc_analysis_history e eq_analysis_history. |
| [public.vak_keywords](tables/public/vak_keywords.md) | table | sim | 2 | 8 | não | Dicionário de palavras-chave por modalidade VAK para detecção automática |
| [public.validation_queue](tables/public/validation_queue.md) | table | sim | 3 | 12 | não |  |
| [public.visit_checkins](tables/public/visit_checkins.md) | table | sim | 5 | 22 | não | SINGU: Check-ins de visitas presenciais com GPS (lat/long/accuracy), duração computada, fotos e outcome. duration_minutes é computed. |
| [public.webauthn_credentials](tables/public/webauthn_credentials.md) | table | sim | 5 | 17 | não | SINGU: Credenciais WebAuthn/Passkeys (FIDO2). counter protege contra replay. public_key em bytea. |
| [public.webhook_logs](tables/public/webhook_logs.md) | table | sim | 1 | 9 | não |  |
| [public.webhooks](tables/public/webhooks.md) | table | sim | 1 | 11 | não |  |
| [public.weekly_challenges](tables/public/weekly_challenges.md) | table | sim | 1 | 11 | não |  |
| [public.weekly_report_settings](tables/public/weekly_report_settings.md) | table | sim | 8 | 15 | não |  |
| [public.weekly_reports](tables/public/weekly_reports.md) | table | sim | 8 | 5 | não |  |
| [public.whatsapp_ingestion_logs](tables/public/whatsapp_ingestion_logs.md) | table | sim | 2 | 8 | não |  |
| [public.whatsapp_instances](tables/public/whatsapp_instances.md) | table | sim | 5 | 15 | não |  |
| [public.whatsapp_kpis](tables/public/whatsapp_kpis.md) | table | sim | 5 | 14 | não |  |
| [public.whatsapp_messages](tables/public/whatsapp_messages.md) | table | sim | 6 | 27 | sim |  |
| [public.whatsapp_messages_index](tables/public/whatsapp_messages_index.md) | table | sim | 2 | 11 | não |  |
| [public.whatsapp_transcriptions](tables/public/whatsapp_transcriptions.md) | table | sim | 1 | 7 | não |  |
| [public.win_loss_insights](tables/public/win_loss_insights.md) | table | sim | 3 | 11 | não |  |
| [public.win_loss_reasons](tables/public/win_loss_reasons.md) | table | sim | 1 | 9 | não |  |
| [public.win_loss_records](tables/public/win_loss_records.md) | table | sim | 1 | 15 | não |  |
| [public.workspace_accounts](tables/public/workspace_accounts.md) | table | sim | 4 | 30 | não |  |
| [public.xbz_upload_mapping](tables/public/xbz_upload_mapping.md) | table | sim | 1 | 8 | não | Rastreia requisições pg_net para upload de imagens XBZ ao Cloudflare Images |
| [singu_migration._checklist](tables/singu_migration/checklist.md) | table | não | 0 | 10 | não | Controle de progresso da migração SINGU. Cada linha = 1 tabela ou 1 operação estrutural. |
| [singu_migration._errors](tables/singu_migration/errors.md) | table | não | 0 | 6 | não |  |
| [singu_migration._source_schema](tables/singu_migration/source_schema.md) | table | não | 0 | 6 | não | Cache do schema capturado do banco SINGU origem. Populado via chat Lovable + colagem manual. |
| [zapp_history.admin_grants](tables/zapp_history/admin_grants.md) | table | sim | 1 | 5 | não | Usuários com acesso total ao histórico (override do ownership). Popular manualmente pelo service_role. |
| [zapp_history.ai_cost_log](tables/zapp_history/ai_cost_log.md) | table | sim | 1 | 17 | não |  |
| [zapp_history.ai_training_dataset](tables/zapp_history/ai_training_dataset.md) | table | sim | 1 | 26 | não |  |
| [zapp_history.async_request_log](tables/zapp_history/async_request_log.md) | table | sim | 1 | 8 | não |  |
| [zapp_history.conversation_daily_summaries](tables/zapp_history/conversation_daily_summaries.md) | table | sim | 1 | 47 | sim | Sumário diário (24h, dia civil BRT) por contato. Idempotente via UNIQUE(contact_id, summary_date). Sync com public.interactions para alimentar SINGU. |
| [zapp_history.conversations](tables/zapp_history/conversations.md) | table | sim | 1 | 29 | sim |  |
| [zapp_history.disc_playbook](tables/zapp_history/disc_playbook.md) | table | sim | 1 | 6 | não |  |
| [zapp_history.edge_function_templates](tables/zapp_history/edge_function_templates.md) | table | sim | 1 | 7 | não |  |
| [zapp_history.location_dictionary](tables/zapp_history/location_dictionary.md) | table | sim | 1 | 6 | não |  |
| [zapp_history.message_audio](tables/zapp_history/message_audio.md) | table | sim | 1 | 38 | sim |  |
| [zapp_history.message_embeddings](tables/zapp_history/message_embeddings.md) | table | sim | 1 | 10 | não |  |
| [zapp_history.message_links](tables/zapp_history/message_links.md) | table | sim | 1 | 28 | não |  |
| [zapp_history.message_media](tables/zapp_history/message_media.md) | table | sim | 1 | 28 | sim |  |
| [zapp_history.messages](tables/zapp_history/messages.md) | table | sim | 1 | 78 | sim |  |
| [zapp_history.phone_to_contact](tables/zapp_history/phone_to_contact.md) | table | sim | 1 | 4 | não |  |
| [zapp_history.product_dictionary](tables/zapp_history/product_dictionary.md) | table | sim | 1 | 5 | não |  |
| [zapp_history.runtime_config](tables/zapp_history/runtime_config.md) | table | sim | 1 | 6 | não |  |
| [zapp_history.whatsapp_connections](tables/zapp_history/whatsapp_connections.md) | table | sim | 1 | 13 | não |  |
