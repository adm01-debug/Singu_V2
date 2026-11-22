# Lints de segurança e performance

Verificações objetivas feitas no catálogo. Um agente deve ler isto antes de propor mudanças em RLS, functions ou índices.

| severidade | código | objeto | detalhe |
|---|---|---|---|
| ALTA | rls_disabled | public._stg_pac_nums | Tabela exposta pela API sem RLS: qualquer chave anon lê/escreve tudo. |
| ALTA | view_security_definer | public.document_signatures_public | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.forms_public | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.landing_pages_public | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.mv_daily_kpis | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.mv_daily_stats | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.push_subscriptions_safe | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.slow_queries_audit | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.users_public | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.v_contact_personality_audit | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.v_contact_relatives_audit | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| ALTA | view_security_definer | public.v_life_events_audit | View em public sem security_invoker: executa como owner e ignora RLS das tabelas base. |
| BAIXA | extension_in_public | pg_net | Extensão instalada no schema public (recomendado: schema extensions). |
| BAIXA | extension_in_public | plpgsql_check | Extensão instalada no schema public (recomendado: schema extensions). |
| BAIXA | fk_without_index | _dormant.access_denied_logs.access_denied_logs_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.active_power_ups.active_power_ups_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.active_sessions.active_sessions_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.alert_log.alert_log_notification_id_fkey | FK sem índice nas colunas ['notification_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.alert_log.alert_log_rule_id_fkey | FK sem índice nas colunas ['rule_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.alert_log.alert_log_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.alertas_inativacao.alertas_inativacao_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.api_usage_log.api_usage_log_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.automation_logs.automation_logs_rule_id_fkey | FK sem índice nas colunas ['rule_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.battle_participants.battle_participants_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.blocked_ips.blocked_ips_blocked_by_fkey | FK sem índice nas colunas ['blocked_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cadence_steps.cadence_steps_cadence_id_fkey | FK sem índice nas colunas ['cadence_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cadence_tasks.cadence_tasks_cadence_step_id_fkey | FK sem índice nas colunas ['cadence_step_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cadence_tasks.cadence_tasks_prospect_cadence_id_fkey | FK sem índice nas colunas ['prospect_cadence_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.challenge_progress.challenge_progress_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.chat_conversations.chat_conversations_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.chat_messages.chat_messages_conversation_id_fkey | FK sem índice nas colunas ['conversation_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.client_portfolio.client_portfolio_assigned_by_fkey | FK sem índice nas colunas ['assigned_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.client_portfolio.client_portfolio_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.closing_moment_analysis.closing_moment_analysis_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.closing_moment_analysis.closing_moment_analysis_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cognitive_bias_history.cognitive_bias_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cognitive_biases.cognitive_biases_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cognitive_biases.cognitive_biases_detected_in_interaction_id_fkey | FK sem índice nas colunas ['detected_in_interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.cognitive_biases.cognitive_biases_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.communication_cadence.communication_cadence_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.communication_preferences.communication_preferences_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.company_tags.company_tags_tag_id_fkey | FK sem índice nas colunas ['tag_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.compatibility_alerts.compatibility_alerts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.competitive_chat_messages.competitive_chat_messages_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_availability.contact_availability_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_availability.contact_availability_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_cadence.contact_cadence_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_communication_style.contact_communication_style_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_communication_style.contact_communication_style_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_compatibility.contact_compatibility_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_eq_scores.contact_eq_scores_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_eq_scores.contact_eq_scores_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_metaprograms.contact_metaprograms_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_preferences.contact_preferences_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_relationships.contact_relationships_contact_a_id_fkey | FK sem índice nas colunas ['contact_a_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_relationships.contact_relationships_contact_b_id_fkey | FK sem índice nas colunas ['contact_b_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_rfm_scores.contact_rfm_scores_segment_id_fkey | FK sem índice nas colunas ['segment_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_rfm_scores.contact_rfm_scores_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_tags.contact_tags_tag_id_fkey | FK sem índice nas colunas ['tag_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_trigger_preferences.contact_trigger_preferences_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_values.contact_values_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_values.contact_values_discovered_in_interaction_id_fkey | FK sem índice nas colunas ['discovered_in_interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.contact_values.contact_values_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.daily_challenge_progress.daily_challenge_progress_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.dashboard_widgets.dashboard_widgets_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_chat_history.deal_chat_history_deal_id_fkey | FK sem índice nas colunas ['deal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_chat_history.deal_chat_history_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_history.deal_history_deal_id_fkey | FK sem índice nas colunas ['deal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_history.deal_history_stage_anterior_id_fkey | FK sem índice nas colunas ['stage_anterior_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_history.deal_history_stage_novo_id_fkey | FK sem índice nas colunas ['stage_novo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_outcomes.deal_outcomes_sale_id_fkey | FK sem índice nas colunas ['sale_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_outcomes.deal_outcomes_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_products.deal_products_deal_id_fkey | FK sem índice nas colunas ['deal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_products.deal_products_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deal_stage_history.deal_stage_history_sale_id_fkey | FK sem índice nas colunas ['sale_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_lead_id_fkey | FK sem índice nas colunas ['lead_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_loss_reason_id_fkey | FK sem índice nas colunas ['loss_reason_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_pipeline_id_fkey | FK sem índice nas colunas ['pipeline_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_source_id_fkey | FK sem índice nas colunas ['source_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.deals.deals_stage_id_fkey | FK sem índice nas colunas ['stage_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.decision_criteria.decision_criteria_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.decision_criteria.decision_criteria_discovered_in_interaction_id_fkey | FK sem índice nas colunas ['discovered_in_interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.decision_criteria.decision_criteria_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.demand_forecasts.demand_forecasts_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.digest_history.digest_history_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.digital_signatures.digital_signatures_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_analysis_history.disc_analysis_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_assessments.disc_assessments_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_assessments.disc_assessments_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_assessments.disc_assessments_validated_by_fkey | FK sem índice nas colunas ['validated_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_communication_logs.disc_communication_logs_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_interaction_signals.disc_interaction_signals_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_interaction_signals.disc_interaction_signals_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.disc_interaction_signals.disc_interaction_signals_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.document_signers.document_signers_document_id_fkey | FK sem índice nas colunas ['document_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.email_tracking_events.email_tracking_events_email_id_fkey | FK sem índice nas colunas ['email_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_anchors.emotional_anchors_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_anchors.emotional_anchors_discovered_in_interaction_id_fkey | FK sem índice nas colunas ['discovered_in_interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_anchors.emotional_anchors_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_states.emotional_states_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_states.emotional_states_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_states.emotional_states_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_states_history.emotional_states_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_trend_snapshots.emotional_trend_snapshots_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.emotional_trend_snapshots.emotional_trend_snapshots_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.entity_versions.entity_versions_changed_by_fkey | FK sem índice nas colunas ['changed_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.eq_analysis_history.eq_analysis_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.eq_pillar_details.eq_pillar_details_eq_score_id_fkey | FK sem índice nas colunas ['eq_score_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.feed_comments.feed_comments_feed_item_id_fkey | FK sem índice nas colunas ['feed_item_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.feed_comments.feed_comments_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.feed_reactions.feed_reactions_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.health_alerts.health_alerts_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.health_alerts.health_alerts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.health_alerts.health_alerts_resolved_by_fkey | FK sem índice nas colunas ['resolved_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.health_alerts.health_alerts_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.hidden_objections.hidden_objections_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.inactivity_alerts.inactivity_alerts_acknowledged_by_fkey | FK sem índice nas colunas ['acknowledged_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.inactivity_alerts.inactivity_alerts_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.inactivity_alerts.inactivity_alerts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.influence_network.influence_network_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.insights.insights_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.insights.insights_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.insights.insights_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.insights.insights_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.ip_whitelist.ip_whitelist_added_by_fkey | FK sem índice nas colunas ['added_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.known_devices.known_devices_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.kudos.kudos_from_salesperson_id_fkey | FK sem índice nas colunas ['from_salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.kudos.kudos_to_salesperson_id_fkey | FK sem índice nas colunas ['to_salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.lead_history.lead_history_lead_id_fkey | FK sem índice nas colunas ['lead_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.lead_history.lead_history_stage_anterior_id_fkey | FK sem índice nas colunas ['stage_anterior_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.lead_history.lead_history_stage_novo_id_fkey | FK sem índice nas colunas ['stage_novo_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.lead_routing_log.lead_routing_log_client_id_fkey | FK sem índice nas colunas ['client_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.lead_routing_log.lead_routing_log_from_salesperson_id_fkey | FK sem índice nas colunas ['from_salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.lead_routing_log.lead_routing_log_to_salesperson_id_fkey | FK sem índice nas colunas ['to_salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.leads.leads_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.leads.leads_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.leads.leads_pipeline_id_fkey | FK sem índice nas colunas ['pipeline_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.leads.leads_source_id_fkey | FK sem índice nas colunas ['source_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.leads.leads_stage_id_fkey | FK sem índice nas colunas ['stage_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.life_events.life_events_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.life_events.life_events_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.login_alerts.login_alerts_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.metaprogram_templates.metaprogram_templates_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.mfa_verification_attempts.mfa_verification_attempts_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.notifications.notifications_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.notifications.notifications_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.notifications.notifications_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.notifications.notifications_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.objection_templates.objection_templates_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.objections.objections_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.objections.objections_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.objections.objections_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.objections_library.objections_library_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.offer_suggestions.offer_suggestions_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.offer_suggestions.offer_suggestions_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.password_reset_requests.password_reset_requests_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.performance_bets.performance_bets_bettor_id_fkey | FK sem índice nas colunas ['bettor_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.performance_bets.performance_bets_target_id_fkey | FK sem índice nas colunas ['target_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.playbook_items.playbook_items_playbook_id_fkey | FK sem índice nas colunas ['playbook_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.playbook_progress.playbook_progress_completed_by_fkey | FK sem índice nas colunas ['completed_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.playbook_progress.playbook_progress_sale_id_fkey | FK sem índice nas colunas ['sale_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.pre_contact_briefings.pre_contact_briefings_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.pre_contact_briefings.pre_contact_briefings_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.price_alerts.price_alerts_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.price_alerts.price_alerts_supplier_id_fkey | FK sem índice nas colunas ['supplier_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.price_history.price_history_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.price_history.price_history_supplier_id_fkey | FK sem índice nas colunas ['supplier_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.price_history.price_history_supplier_product_id_fkey | FK sem índice nas colunas ['supplier_product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.prize_wheel_spins.prize_wheel_spins_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.prospect_cadences.prospect_cadences_cadence_id_fkey | FK sem índice nas colunas ['cadence_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.prospect_cadences.prospect_cadences_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.purchase_history.purchase_history_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.purchase_history.purchase_history_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.purchase_history.purchase_history_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.quote_sync_logs.quote_sync_logs_quote_id_fkey | FK sem índice nas colunas ['quote_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.quotes.quotes_client_id_fkey | FK sem índice nas colunas ['client_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.quotes.quotes_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.rank_change_notifications.rank_change_notifications_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.rapport_score_history.rapport_score_history_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.rapport_score_history.rapport_score_history_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.reauthentication_requests.reauthentication_requests_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.rfm_calculations.rfm_calculations_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.rfm_history.rfm_history_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.rfm_history.rfm_history_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.sales_territories.sales_territories_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.salesperson_badges.salesperson_badges_badge_id_fkey | FK sem índice nas colunas ['badge_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.salesperson_leagues.salesperson_leagues_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.salesperson_leagues.salesperson_leagues_season_id_fkey | FK sem índice nas colunas ['season_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.satisfaction_scores.satisfaction_scores_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.satisfaction_scores.satisfaction_scores_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.satisfaction_scores.satisfaction_scores_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.script_usage_log.script_usage_log_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.script_usage_log.script_usage_log_script_id_fkey | FK sem índice nas colunas ['script_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.script_usage_log.script_usage_log_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.security_alert_history.security_alert_history_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.shared_interests.shared_interests_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.shared_interests.shared_interests_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.sla_configs.sla_configs_pipeline_stage_id_fkey | FK sem índice nas colunas ['pipeline_stage_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.smart_reminders.smart_reminders_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.smart_reminders.smart_reminders_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.smart_reminders.smart_reminders_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.smart_reminders.smart_reminders_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.sms_verification_codes.sms_verification_codes_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.social_mentions.social_mentions_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.social_mentions.social_mentions_mentioned_contact_id_fkey | FK sem índice nas colunas ['mentioned_contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.social_mentions.social_mentions_mentioner_contact_id_fkey | FK sem índice nas colunas ['mentioner_contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.social_mentions.social_mentions_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.stakeholder_alerts.stakeholder_alerts_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.stakeholder_alerts.stakeholder_alerts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.stock_movements.stock_movements_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.supplier_order_items.supplier_order_items_order_id_fkey | FK sem índice nas colunas ['order_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.supplier_order_items.supplier_order_items_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.supplier_orders.supplier_orders_supplier_id_fkey | FK sem índice nas colunas ['supplier_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.supplier_products.supplier_products_product_id_fkey | FK sem índice nas colunas ['product_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.supplier_risk_assessments.supplier_risk_assessments_supplier_id_fkey | FK sem índice nas colunas ['supplier_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tasks.tasks_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tasks.tasks_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tasks.tasks_deal_id_fkey | FK sem índice nas colunas ['deal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tasks.tasks_lead_id_fkey | FK sem índice nas colunas ['lead_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.team_closers.team_closers_closer_id_fkey | FK sem índice nas colunas ['closer_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.teams.teams_sdr_id_fkey | FK sem índice nas colunas ['sdr_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.template_performance.template_performance_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.template_performance.template_performance_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.territory_history.territory_history_from_salesperson_id_fkey | FK sem índice nas colunas ['from_salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.territory_history.territory_history_territory_id_fkey | FK sem índice nas colunas ['territory_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.territory_history.territory_history_to_salesperson_id_fkey | FK sem índice nas colunas ['to_salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.time_analysis.time_analysis_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tournament_matches.tournament_matches_player1_id_fkey | FK sem índice nas colunas ['player1_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tournament_matches.tournament_matches_player2_id_fkey | FK sem índice nas colunas ['player2_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tournament_matches.tournament_matches_tournament_id_fkey | FK sem índice nas colunas ['tournament_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tournament_matches.tournament_matches_winner_id_fkey | FK sem índice nas colunas ['winner_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.tournament_participants.tournament_participants_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_ab_tests.trigger_ab_tests_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_channel_effectiveness.trigger_channel_effectiveness_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_intensity_history.trigger_intensity_history_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_intensity_history.trigger_intensity_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_suggestions.trigger_suggestions_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_suggestions.trigger_suggestions_used_in_interaction_id_fkey | FK sem índice nas colunas ['used_in_interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_suggestions.trigger_suggestions_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_templates.trigger_templates_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_templates.trigger_templates_trigger_type_id_fkey | FK sem índice nas colunas ['trigger_type_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_usage_log.trigger_usage_log_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_usage_log.trigger_usage_log_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.trigger_usage_log.trigger_usage_log_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.user_companies_link.user_companies_link_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.user_companies_link.user_companies_link_shared_by_fkey | FK sem índice nas colunas ['shared_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.user_contacts_link.user_contacts_link_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.user_contacts_link.user_contacts_link_shared_by_fkey | FK sem índice nas colunas ['shared_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.vak_analysis_history.vak_analysis_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.vak_profiles.vak_profiles_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.vak_templates.vak_templates_created_by_fkey | FK sem índice nas colunas ['created_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.victory_feed.victory_feed_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.webauthn_challenges.webauthn_challenges_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.webauthn_credentials.webauthn_credentials_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.weekly_matchups.weekly_matchups_player1_id_fkey | FK sem índice nas colunas ['player1_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.weekly_matchups.weekly_matchups_player2_id_fkey | FK sem índice nas colunas ['player2_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.weekly_matchups.weekly_matchups_winner_id_fkey | FK sem índice nas colunas ['winner_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.whatsapp_messages.whatsapp_messages_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_action_logs.workflow_action_logs_action_id_fkey | FK sem índice nas colunas ['action_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_action_logs.workflow_action_logs_execution_id_fkey | FK sem índice nas colunas ['execution_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_actions.workflow_actions_workflow_id_fkey | FK sem índice nas colunas ['workflow_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_executions.workflow_executions_deal_id_fkey | FK sem índice nas colunas ['deal_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_executions.workflow_executions_lead_id_fkey | FK sem índice nas colunas ['lead_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_executions.workflow_executions_trigger_id_fkey | FK sem índice nas colunas ['trigger_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_executions.workflow_executions_workflow_id_fkey | FK sem índice nas colunas ['workflow_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_triggers.workflow_triggers_stage_from_id_fkey | FK sem índice nas colunas ['stage_from_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_triggers.workflow_triggers_stage_to_id_fkey | FK sem índice nas colunas ['stage_to_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflow_triggers.workflow_triggers_workflow_id_fkey | FK sem índice nas colunas ['workflow_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.workflows.workflows_pipeline_id_fkey | FK sem índice nas colunas ['pipeline_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | _dormant.xp_history.xp_history_salesperson_id_fkey | FK sem índice nas colunas ['salesperson_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.ai_recommendation_audit_logs_v2.ai_recommendation_audit_logs_v2_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.ai_recommendation_audit_logs_v2.ai_recommendation_audit_logs_v2_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.call_logs.call_logs_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.call_logs.call_logs_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.call_logs.call_logs_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.campaign_recipients.campaign_recipients_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.contact_objection_scripts.contact_objection_scripts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_alerts.crm_alerts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_alerts.crm_alerts_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_automation_logs.crm_automation_logs_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_automation_logs.crm_automation_logs_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_automation_reprocess_queue.crm_automation_reprocess_queue_log_id_fkey | FK sem índice nas colunas ['log_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_metric_overrides.crm_metric_overrides_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_metric_overrides.crm_metric_overrides_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_relationship_audit_logs.crm_relationship_audit_logs_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.crm_relationship_audit_logs.crm_relationship_audit_logs_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cs_accounts.cs_accounts_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cs_accounts.cs_accounts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cs_nps_responses.cs_nps_responses_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cs_qbrs.cs_qbrs_account_id_fkey | FK sem índice nas colunas ['account_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.cs_renewals.cs_renewals_account_id_fkey | FK sem índice nas colunas ['account_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.csat_surveys.csat_surveys_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.csat_surveys.csat_surveys_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.csat_surveys.csat_surveys_ticket_id_fkey | FK sem índice nas colunas ['ticket_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_ownership_history.customer_ownership_history_execucao_id_fkey | FK sem índice nas colunas ['execucao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_purchases.customer_purchases_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_purchases.customer_purchases_sdr_credito_id_fkey | FK sem índice nas colunas ['sdr_credito_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_purchases.customer_purchases_vendedor_credito_id_fkey | FK sem índice nas colunas ['vendedor_credito_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_purchases.customer_purchases_vendedor_id_fkey | FK sem índice nas colunas ['vendedor_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_rotation_state.customer_rotation_state_bloqueado_por_id_fkey | FK sem índice nas colunas ['bloqueado_por_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_rotation_state.customer_rotation_state_bloqueio_aprovado_por_id_fkey | FK sem índice nas colunas ['bloqueio_aprovado_por_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.customer_sdr_history.customer_sdr_history_execucao_id_fkey | FK sem índice nas colunas ['execucao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lead_assignments.lead_assignments_previous_owner_fkey | FK sem índice nas colunas ['previous_owner']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lead_assignments.lead_assignments_routing_rule_id_fkey | FK sem índice nas colunas ['routing_rule_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lead_magnets.lead_magnets_form_id_fkey | FK sem índice nas colunas ['form_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lead_routing_rules.lead_routing_rules_fallback_rule_id_fkey | FK sem índice nas colunas ['fallback_rule_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.lead_score_threshold_log.lead_score_threshold_log_automation_id_fkey | FK sem índice nas colunas ['automation_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.neuro_pnl_sessions.neuro_pnl_sessions_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nlp_feedback.nlp_feedback_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nlp_feedback.nlp_feedback_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.nlp_feedback.nlp_feedback_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.notification_logs.notification_logs_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.notification_logs.notification_logs_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.psychographic_audit_log.psychographic_audit_log_changed_by_fkey | FK sem índice nas colunas ['changed_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.psychographic_audit_log.psychographic_audit_log_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.redistribution_log.redistribution_log_from_member_id_fkey | FK sem índice nas colunas ['from_member_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.redistribution_log.redistribution_log_to_member_id_fkey | FK sem índice nas colunas ['to_member_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_distribuicao_staging.rodizio_distribuicao_staging_aprovado_por_id_fkey | FK sem índice nas colunas ['aprovado_por_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_distribuicao_staging.rodizio_distribuicao_staging_closer_destino_id_fkey | FK sem índice nas colunas ['closer_destino_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_distribuicao_staging.rodizio_distribuicao_staging_criado_por_id_fkey | FK sem índice nas colunas ['criado_por_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_distribuicao_staging.rodizio_distribuicao_staging_customer_id_fkey | FK sem índice nas colunas ['customer_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_distribuicao_staging.rodizio_distribuicao_staging_execucao_id_fkey | FK sem índice nas colunas ['execucao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_distribuicao_staging.rodizio_distribuicao_staging_sdr_destino_id_fkey | FK sem índice nas colunas ['sdr_destino_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_execucoes.rodizio_execucoes_executado_por_id_fkey | FK sem índice nas colunas ['executado_por_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.rodizio_execucoes.rodizio_execucoes_revertida_por_execucao_id_fkey | FK sem índice nas colunas ['revertida_por_execucao_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_email_reservations.sequence_email_reservations_step_id_fkey | FK sem índice nas colunas ['step_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_email_reservations.sequence_email_reservations_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_events.sequence_events_sequence_id_fkey | FK sem índice nas colunas ['sequence_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_send_log.sequence_send_log_sequence_id_fkey | FK sem índice nas colunas ['sequence_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sequence_send_log.sequence_send_log_step_id_fkey | FK sem índice nas colunas ['step_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sms_campaign_recipients.sms_campaign_recipients_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.sms_opt_outs.sms_opt_outs_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.social_consent_audit.social_consent_audit_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.social_sync_queue.social_sync_queue_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.stakeholder_alerts.stakeholder_alerts_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.stakeholder_alerts.stakeholder_alerts_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.suggested_life_events.suggested_life_events_user_id_fkey | FK sem índice nas colunas ['user_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.support_tickets.support_tickets_assigned_to_fkey | FK sem índice nas colunas ['assigned_to']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.support_tickets.support_tickets_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.support_tickets.support_tickets_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.system_alerts.system_alerts_acknowledged_by_fkey | FK sem índice nas colunas ['acknowledged_by']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.ticket_comments.ticket_comments_ticket_id_fkey | FK sem índice nas colunas ['ticket_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.trigger_ab_tests.trigger_ab_tests_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.trigger_channel_effectiveness.trigger_channel_effectiveness_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.trigger_intensity_history.trigger_intensity_history_contact_id_fkey | FK sem índice nas colunas ['contact_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.trigger_intensity_history.trigger_intensity_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.vak_analysis_history.vak_analysis_history_interaction_id_fkey | FK sem índice nas colunas ['interaction_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | fk_without_index | public.visit_checkins.visit_checkins_company_id_fkey | FK sem índice nas colunas ['company_id']: joins e DELETE/UPDATE na tabela pai ficam lentos. |
| BAIXA | policy_auth_fn_not_wrapped | _dormant.inactivity_alerts.dashboard_alert_owner_select | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activities.Users can delete their own activities | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activities.Users can insert their own activities | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activities.Users can update their own activities | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.activities.Users can view their own activities | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.alerts.Users can delete their own alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.alerts.Users can insert their own alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.alerts.Users can update their own alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.alerts.Users can view their own alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.client_values.Users can create their own client values | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.client_values.Users can delete their own client values | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.client_values.Users can update their own client values | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.client_values.Users can view their own client values | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.cognitive_bias_history.Users can create their own cognitive bias history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.cognitive_bias_history.Users can delete their own cognitive bias history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.cognitive_bias_history.Users can update their own cognitive_bias_history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.cognitive_bias_history.Users can view their own cognitive bias history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.communication_preferences.Users can delete their own communication preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.communication_preferences.Users can insert their own communication preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.communication_preferences.Users can update their own communication preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.communication_preferences.Users can view their own communication preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.companies.Users can delete their own companies | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.companies.Users can insert their own companies | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.companies.Users can update their own companies | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.companies.Users can view their own companies | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_alerts.Users can create their own compatibility alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_alerts.Users can delete their own compatibility alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_alerts.Users can update their own compatibility alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_alerts.Users can view their own compatibility alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_settings.Users can create their own compatibility settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_settings.Users can delete their own compatibility_settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_settings.Users can update their own compatibility settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.compatibility_settings.Users can view their own compatibility settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_cadence.Users can create their own contact cadence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_cadence.Users can delete their own contact cadence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_cadence.Users can update their own contact cadence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_cadence.Users can view their own contact cadence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_preferences.Users can create their own contact preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_preferences.Users can delete their own contact preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_preferences.Users can update their own contact preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_preferences.Users can view their own contact preferences | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_relatives.Users can delete their own contact_relatives | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_relatives.Users can insert their own contact_relatives | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_relatives.Users can update their own contact_relatives | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_relatives.Users can view their own contact_relatives | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_time_analysis.Users can delete their own contact time analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_time_analysis.Users can insert their own contact time analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_time_analysis.Users can update their own contact time analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contact_time_analysis.Users can view their own contact time analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contacts.Users can delete their own contacts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contacts.Users can insert their own contacts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contacts.Users can update their own contacts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.contacts.Users can view their own contacts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.decision_criteria.Users can create their own decision criteria | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.decision_criteria.Users can delete their own decision criteria | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.decision_criteria.Users can update their own decision criteria | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.decision_criteria.Users can view their own decision criteria | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_analysis_history.Users can create their own DISC analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_analysis_history.Users can delete their own DISC analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_analysis_history.Users can update their own disc_analysis_history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_analysis_history.Users can view their own DISC analysis history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_communication_logs.Users can create their own DISC communication logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_communication_logs.Users can delete their own disc_communication_logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_communication_logs.Users can update their own DISC communication logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_communication_logs.Users can view their own DISC communication logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_conversion_metrics.Users can manage their own DISC conversion metrics | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.disc_conversion_metrics.Users can view their own DISC conversion metrics | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_anchors.Users can create their own emotional anchors | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_anchors.Users can delete their own emotional anchors | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_anchors.Users can update their own emotional anchors | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_anchors.Users can view their own emotional anchors | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_states_history.Users can create their own emotional states history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_states_history.Users can delete their own emotional states history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_states_history.Users can update their own emotional_states_history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.emotional_states_history.Users can view their own emotional states history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.eq_analysis_history.Users can create their own EQ analysis history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.eq_analysis_history.Users can delete their own EQ analysis history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.eq_analysis_history.Users can update their own eq_analysis_history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.eq_analysis_history.Users can view their own EQ analysis history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.error_logs.Authenticated users can insert error logs | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.external_data_audit_log.admin_only_select_external_data_audit | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.favorite_templates.Users can delete their own favorites | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.favorite_templates.Users can insert their own favorites | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.favorite_templates.Users can view their own favorites | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alert_settings.Users can create their own health settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alert_settings.Users can delete their own health_alert_settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alert_settings.Users can update their own health settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alert_settings.Users can view their own health settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alerts.Users can create their own health alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alerts.Users can delete their own health alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alerts.Users can update their own health alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.health_alerts.Users can view their own health alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.hidden_objections.Users can create their own hidden objections | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.hidden_objections.Users can delete their own hidden objections | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.hidden_objections.Users can update their own hidden objections | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.hidden_objections.Users can view their own hidden objections | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.insights.Users can delete their own insights | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.insights.Users can insert their own insights | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.insights.Users can update their own insights | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.insights.Users can view their own insights | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.interactions.Users can delete their own interactions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.interactions.Users can insert their own interactions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.interactions.Users can update their own interactions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.interactions.Users can view their own interactions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.life_events.Users can delete their own life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.life_events.Users can insert their own life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.life_events.Users can update their own life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.life_events.Users can view their own life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lux_intelligence.Users can delete their own lux intelligence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lux_intelligence.Users can insert their own lux intelligence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lux_intelligence.Users can update their own lux intelligence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.lux_intelligence.Users can view their own lux intelligence | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.metaprogram_analysis.Users can create their own metaprogram analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.metaprogram_analysis.Users can delete their own metaprogram analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.metaprogram_analysis.Users can update their own metaprogram_analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.metaprogram_analysis.Users can view their own metaprogram analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.offer_suggestions.Users can delete their own offer suggestions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.offer_suggestions.Users can insert their own offer suggestions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.offer_suggestions.Users can update their own offer suggestions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.offer_suggestions.Users can view their own offer suggestions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Users can insert their own profile | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Users can update their own profile | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.profiles.Users can view their own profile | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.purchase_history.Users can delete their own purchase history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.purchase_history.Users can insert their own purchase history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.purchase_history.Users can update their own purchase history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.purchase_history.Users can view their own purchase history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_subscriptions.Users can create their own subscriptions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_subscriptions.Users can delete their own subscriptions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_subscriptions.Users can update their own subscriptions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.push_subscriptions.Users can view their own subscriptions | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rfm_analysis.Users can manage their own RFM analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rfm_history.Users can view their own RFM history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rfm_metrics.Users can view their RFM metrics | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rfm_segment_config.Users can manage their RFM segment config | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rpc_perf_samples.Admins read perf samples | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.rpc_plan_snapshots.admins_read_rpc_plan_snapshots | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.score_history.Users can delete their own score history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.score_history.Users can insert their own score history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.score_history.Users can update their own score_history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.score_history.Users can view their own score history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.sequence_enrollments.singu_sequence_enrollment_scope | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_behavior_analysis.Users can delete their own social behavior analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_behavior_analysis.Users can insert their own social behavior analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_behavior_analysis.Users can update their own social behavior analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_behavior_analysis.Users can view their own social behavior analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_life_events.Users can delete their own social life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_life_events.Users can insert their own social life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_life_events.Users can update their own social life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_life_events.Users can view their own social life events | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_profiles.Users can delete their own social profiles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_profiles.Users can insert their own social profiles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_profiles.Users can update their own social profiles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_profiles.Users can view their own social profiles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_scraping_schedule.Users can delete their own scraping schedule | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_scraping_schedule.Users can insert their own scraping schedule | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_scraping_schedule.Users can update their own scraping schedule | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.social_scraping_schedule.Users can view their own scraping schedule | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.stakeholder_alerts.Users can create their own stakeholder alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.stakeholder_alerts.Users can delete their own stakeholder alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.stakeholder_alerts.Users can update their own stakeholder alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.stakeholder_alerts.Users can view their own stakeholder alerts | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_ab_tests.Users can create their own AB tests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_ab_tests.Users can delete their own AB tests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_ab_tests.Users can update their own AB tests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_ab_tests.Users can view their own AB tests | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_bundles.Users can create their own bundles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_bundles.Users can delete their own bundles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_bundles.Users can update their own bundles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_bundles.Users can view their own bundles | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_channel_effectiveness.Users can create their own channel effectiveness | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_channel_effectiveness.Users can delete their own channel effectiveness | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_channel_effectiveness.Users can update their own channel effectiveness | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_channel_effectiveness.Users can view their own channel effectiveness | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_intensity_history.Users can create their own intensity history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_intensity_history.Users can delete their own intensity history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_intensity_history.Users can update their own intensity history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_intensity_history.Users can view their own intensity history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_usage_history.Users can delete their own trigger usage history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_usage_history.Users can insert their own trigger usage history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_usage_history.Users can update their own trigger usage history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.trigger_usage_history.Users can view their own trigger usage history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.vak_analysis_history.Users can delete their own VAK analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.vak_analysis_history.Users can insert their own VAK analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.vak_analysis_history.Users can update their own vak_analysis_history | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.vak_analysis_history.Users can view their own VAK analysis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_report_settings.Users can create their own report settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_report_settings.Users can delete their own weekly_report_settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_report_settings.Users can update their own report settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_report_settings.Users can view their own report settings | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_reports.Users can create their own reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_reports.Users can delete their own weekly_reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_reports.Users can update their own weekly_reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.weekly_reports.Users can view their own reports | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.whatsapp_instances.Users can manage their own whatsapp_instances | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.whatsapp_kpis.Users can manage their own whatsapp_kpis | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | public.whatsapp_messages.Users can manage their own whatsapp_messages | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.am_service_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| BAIXA | policy_auth_fn_not_wrapped | storage.objects.wm_service_all | Policy chama auth.uid()/jwt() sem `(select ...)`: é reavaliada por linha; envolva em subselect. |
| INFO | realtime_replica_identity | public.alerts | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.companies | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.contacts | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.health_alerts | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.insights | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.interactions | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.smart_notifications | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | realtime_replica_identity | public.whatsapp_messages | Publicada no Realtime sem REPLICA IDENTITY FULL: eventos de UPDATE/DELETE não trazem `old` completo. |
| INFO | rpc_anon_executable | public.buyer_add_comment(_token text, _body text, _label text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.buyer_toggle_milestone(_token text, _milestone_id uuid, _done boolean, _label text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_buyer_document_path(_token text, _document_id uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_deal_room_by_token(_token text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.get_public_csat_survey(_token uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.increment_form_view(_slug text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.increment_landing_page_view(page_id uuid) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.increment_magnet_view(_slug text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.record_buyer_view(_token text, _label text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.submit_public_csat_survey(_token uuid, _score integer, _feedback text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.submit_public_form(_slug text, _data jsonb, _utms jsonb, _page_url text, _user_agent text) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
| INFO | rpc_anon_executable | public.track_magnet_download(_slug text, _email text, _name text, _utms jsonb) | SECURITY DEFINER chamável via RPC por anon (sem login): roda com privilégios do owner. Confirme que é intencional (Supabase dá EXECUTE a anon por padrão; revogue se não for API pública). |
