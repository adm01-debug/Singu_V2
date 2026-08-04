# Tabelas/views ausentes no Singu (referenciadas pelo código do Lovable)

**Total: 119**

Gerado por `node scripts/audit-ausentes.mjs` — compara o schema do Singu (PostgREST OpenAPI de `pgxfvjmuubtbowutlide.supabase.co`) com as chamadas `.from()` em `src/`.

Ordenado por impacto (mais arquivos dependentes primeiro).

| # | Tabela | # arq | Arquivos |
|---:|---|---:|---|
| 1 | `system_alerts` | 5 | `src/components/admin/BehavioralRegenAlertBanner.tsx`, `src/components/admin/BehavioralRegenAlertsStats.tsx`, `src/components/admin/BehavioralRegenAlertsTrend.tsx` … |
| 2 | `contact_analytical_profiles` | 4 | `src/hooks/useBehavioralProfile.ts`, `src/hooks/useBehavioralProfilesList.ts`, `src/hooks/useCompanyProfileAnalytics.ts` … |
| 3 | `people_intelligence_events` | 4 | `src/hooks/useEnrichmentCoverage.ts`, `src/hooks/useEnrichmentExport.ts`, `src/hooks/useEnrichmentSuite.ts` … |
| 4 | `system_health_snapshots` | 3 | `src/components/admin/MttaAutoAckHeartbeatCard.tsx`, `src/hooks/useMttaSlaBreachSnapshot.ts`, `src/pages/admin/Observability.tsx` |
| 5 | `social_consent_audit` | 3 | `src/components/contact-detail/SocialMediaIntelligenceCard.tsx`, `src/components/contact-detail/data-tab/ConsentAuditCard.tsx`, `src/pages/RelatorioContato.tsx` |
| 6 | `neuro_behavioral_history` | 3 | `src/components/contact-detail/NeuroEvolutionChart.tsx`, `src/components/crm/behavior/NeuromarketingTimeline.tsx`, `src/hooks/useUnifiedTimeline.ts` |
| 7 | `reframing_analysis` | 3 | `src/components/nlp/SleightOfMouthPanel.tsx`, `src/hooks/useFicha360NLP.ts`, `src/hooks/useNLPAnalysisValidation.ts` |
| 8 | `connection_test_logs` | 3 | `src/hooks/useConnectionMetrics.ts`, `src/hooks/useConnections.ts`, `src/pages/AdminConexoesLogs.tsx` |
| 9 | `email_verifications` | 3 | `src/hooks/useEnrichmentCoverage.ts`, `src/hooks/useEnrichmentExport.ts`, `src/hooks/useEnrichmentSuite.ts` |
| 10 | `phone_validations` | 3 | `src/hooks/useEnrichmentCoverage.ts`, `src/hooks/useEnrichmentExport.ts`, `src/hooks/useEnrichmentSuite.ts` |
| 11 | `user_ui_preferences` | 3 | `src/hooks/useFicha360FilterPresets.ts`, `src/hooks/useFicha360PreferencesSync.ts`, `src/hooks/useUiPreferencesSync.ts` |
| 12 | `forms` | 3 | `src/hooks/useForms.ts`, `src/pages/MarketingFormDetail.tsx`, `src/pages/PublicForm.tsx` |
| 13 | `lead_magnets` | 3 | `src/hooks/useLeadMagnets.ts`, `src/pages/MarketingMagnetDetail.tsx`, `src/pages/PublicLeadMagnet.tsx` |
| 14 | `system_config` | 2 | `src/components/admin/MttaSlaThresholdEditor.tsx`, `src/hooks/useMttaSlaThreshold.ts` |
| 15 | `contact_predictive_roadmap` | 2 | `src/components/crm/NextBestAction.tsx`, `src/components/crm/behavior/PredictiveRoadmap.tsx` |
| 16 | `proximo_passo_feedback` | 2 | `src/components/crm/NextBestAction.tsx`, `src/hooks/useProximoPassoFeedback.ts` |
| 17 | `objection_example_feedback` | 2 | `src/components/nlp/NLPRealtimeCoach.tsx`, `src/hooks/useObjectionExampleFeedback.ts` |
| 18 | `suggested_rapport_intel` | 2 | `src/hooks/useAIApprovals.ts`, `src/hooks/useSocialIntelligence.ts` |
| 19 | `conversation_analyses` | 2 | `src/hooks/useConversationIntel.ts`, `src/hooks/useMarkObjectionHandled.ts` |
| 20 | `crm_alerts` | 2 | `src/hooks/useCRMAlerts.ts`, `src/hooks/useUnifiedTimeline.ts` |
| 21 | `call_logs` | 2 | `src/hooks/useEvidenceForLabel.ts`, `src/hooks/useUnifiedHistory.ts` |
| 22 | `feature_flags` | 2 | `src/hooks/useFeatureFlag.ts`, `src/pages/admin/FeatureFlagsPage.tsx` |
| 23 | `incoming_webhook_logs` | 2 | `src/hooks/useIncomingWebhooks.ts`, `src/pages/AdminConexoesLogs.tsx` |
| 24 | `behavioral_insight_feedback` | 2 | `src/hooks/useInsightFeedback.ts`, `src/pages/admin/InsightFeedbackAnalytics.tsx` |
| 25 | `ai_recommendation_audit_logs_v2` | 2 | `src/hooks/useRecommendationAudit.ts`, `src/pages/RecommendationAudit.tsx` |
| 26 | `behavioral_profile_regen_queue` | 2 | `src/pages/admin/BehavioralRegenAudit.tsx`, `src/pages/admin/InsightFeedbackAnalytics.tsx` |
| 27 | `brain_dominance_analysis` | 1 | `src/components/contact-detail/behavioral-tab/NeuroDominanceTab.tsx` |
| 28 | `v_life_events_audit` | 1 | `src/components/contact-detail/life-events/LifeEventsAuditTrail.tsx` |
| 29 | `suggested_life_events` | 1 | `src/components/contact-detail/LifeEventsTab.tsx` |
| 30 | `crm_metric_overrides` | 1 | `src/components/contact-detail/MetricOverrideFlow.tsx` |
| 31 | `crm_cadence_rules` | 1 | `src/components/crm/CadenceRulesConfig.tsx` |
| 32 | `crm_consent_audit_logs` | 1 | `src/components/crm/consent/ConsentAuditLog.tsx` |
| 33 | `crm_automation_logs` | 1 | `src/components/crm/CRMAutomationAuditLog.tsx` |
| 34 | `crm_automation_reprocess_queue` | 1 | `src/components/crm/CRMAutomationAuditLog.tsx` |
| 35 | `contact_automation_settings` | 1 | `src/components/crm/EscalationAutomation.tsx` |
| 36 | `crm_relationship_audit_logs` | 1 | `src/components/crm/relationship/RelationshipAuditPanel.tsx` |
| 37 | `crm_objection_intelligence` | 1 | `src/components/crm/RelationshipKPIsDashboard.tsx` |
| 38 | `follow_up_approvals_v2` | 1 | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| 39 | `whatsapp_messages_index` | 1 | `src/components/whatsapp/WhatsAppDashboard.tsx` |
| 40 | `social_sync_queue` | 1 | `src/hooks/commercial/useSocialSync.ts` |
| 41 | `psychographic_audit_log` | 1 | `src/hooks/commercial/useSocialSync.ts` |
| 42 | `abm_accounts` | 1 | `src/hooks/useABM.ts` |
| 43 | `abm_buying_committee` | 1 | `src/hooks/useABM.ts` |
| 44 | `abm_whitespace_opportunities` | 1 | `src/hooks/useABM.ts` |
| 45 | `abm_account_plans` | 1 | `src/hooks/useABM.ts` |
| 46 | `abm_campaigns` | 1 | `src/hooks/useABM.ts` |
| 47 | `applied_objection_responses` | 1 | `src/hooks/useAppliedResponses.ts` |
| 48 | `attribution_touchpoints` | 1 | `src/hooks/useAttribution.ts` |
| 49 | `battle_cards` | 1 | `src/hooks/useBattleCards.ts` |
| 50 | `contact_analytical_profile_versions` | 1 | `src/hooks/useBehavioralProfileVersions.ts` |
| 51 | `connection_anomalies` | 1 | `src/hooks/useConnectionAnomalies.ts` |
| 52 | `connection_quotas` | 1 | `src/hooks/useConnectionQuota.ts` |
| 53 | `connection_configs` | 1 | `src/hooks/useConnections.ts` |
| 54 | `contact_behavior` | 1 | `src/hooks/useContactBehavior.ts` |
| 55 | `contact_decision_making` | 1 | `src/hooks/useContactBehavior.ts` |
| 56 | `contact_influence` | 1 | `src/hooks/useContactBehavior.ts` |
| 57 | `contact_personality` | 1 | `src/hooks/useContactBehavior.ts` |
| 58 | `contact_metaprograms` | 1 | `src/hooks/useContactBehavior.ts` |
| 59 | `contact_rapport_strategy` | 1 | `src/hooks/useContactBehavior.ts` |
| 60 | `contact_business_context` | 1 | `src/hooks/useContactBehavior.ts` |
| 61 | `v_contact_behavior_audit` | 1 | `src/hooks/useContactBehavior.ts` |
| 62 | `v_contact_personality_audit` | 1 | `src/hooks/useContactBehavior.ts` |
| 63 | `conversation_topics_catalog` | 1 | `src/hooks/useConversationIntel.ts` |
| 64 | `coaching_scorecards` | 1 | `src/hooks/useConversationIntel.ts` |
| 65 | `cs_accounts` | 1 | `src/hooks/useCustomerSuccess.ts` |
| 66 | `cs_health_signals` | 1 | `src/hooks/useCustomerSuccess.ts` |
| 67 | `cs_nps_responses` | 1 | `src/hooks/useCustomerSuccess.ts` |
| 68 | `cs_qbrs` | 1 | `src/hooks/useCustomerSuccess.ts` |
| 69 | `cs_renewals` | 1 | `src/hooks/useCustomerSuccess.ts` |
| 70 | `deal_rooms` | 1 | `src/hooks/useDealRooms.ts` |
| 71 | `deal_room_milestones` | 1 | `src/hooks/useDealRooms.ts` |
| 72 | `deal_room_stakeholders` | 1 | `src/hooks/useDealRooms.ts` |
| 73 | `deal_room_documents` | 1 | `src/hooks/useDealRooms.ts` |
| 74 | `deal_room_activities` | 1 | `src/hooks/useDealRooms.ts` |
| 75 | `deal_room_comments` | 1 | `src/hooks/useDealRooms.ts` |
| 76 | `email_thread_summaries` | 1 | `src/hooks/useEmailThreadSummary.ts` |
| 77 | `email_finder_results` | 1 | `src/hooks/useEnrichmentSuite.ts` |
| 78 | `entity_relationships` | 1 | `src/hooks/useEntityRelationships.ts` |
| 79 | `error_logs` | 1 | `src/hooks/useErrorLogs.ts` |
| 80 | `contact_family_history` | 1 | `src/hooks/useFamilyHistory.ts` |
| 81 | `ficha360_conversation_summaries` | 1 | `src/hooks/useFicha360ConversationSummary.ts` |
| 82 | `forecast_periods` | 1 | `src/hooks/useForecasting.ts` |
| 83 | `deal_forecasts` | 1 | `src/hooks/useForecasting.ts` |
| 84 | `forecast_snapshots` | 1 | `src/hooks/useForecasting.ts` |
| 85 | `forecast_quota_settings` | 1 | `src/hooks/useForecasting.ts` |
| 86 | `form_submissions` | 1 | `src/hooks/useForms.ts` |
| 87 | `incoming_webhooks` | 1 | `src/hooks/useIncomingWebhooks.ts` |
| 88 | `intent_signals` | 1 | `src/hooks/useIntent.ts` |
| 89 | `intent_scores` | 1 | `src/hooks/useIntent.ts` |
| 90 | `intent_tracking_pixels` | 1 | `src/hooks/useIntent.ts` |
| 91 | `lead_magnet_downloads` | 1 | `src/hooks/useLeadMagnets.ts` |
| 92 | `lead_score_rules` | 1 | `src/hooks/useLeadScoring.ts` |
| 93 | `lead_score_thresholds` | 1 | `src/hooks/useLeadScoring.ts` |
| 94 | `marketing_campaign_stats` | 1 | `src/hooks/useMarketingInsights.ts` |
| 95 | `mql_criteria` | 1 | `src/hooks/useMQL.ts` |
| 96 | `mql_classifications` | 1 | `src/hooks/useMQL.ts` |
| 97 | `contact_next_actions` | 1 | `src/hooks/useNextBestAction.ts` |
| 98 | `notification_preferences` | 1 | `src/hooks/useNotificationPreferences.ts` |
| 99 | `nurturing_executions` | 1 | `src/hooks/useNurturingExecutions.ts` |
| 100 | `sales_playbooks` | 1 | `src/hooks/usePlaybooks.ts` |
| 101 | `playbook_usage_log` | 1 | `src/hooks/usePlaybooks.ts` |
| 102 | `revops_snapshots` | 1 | `src/hooks/useRevOps.ts` |
| 103 | `revops_benchmarks` | 1 | `src/hooks/useRevOps.ts` |
| 104 | `revops_alerts` | 1 | `src/hooks/useRevOps.ts` |
| 105 | `lead_score_threshold_automations` | 1 | `src/hooks/useScoreAutomations.ts` |
| 106 | `lead_score_threshold_log` | 1 | `src/hooks/useScoreAutomations.ts` |
| 107 | `sentiment_annotations` | 1 | `src/hooks/useSentimentAnnotations.ts` |
| 108 | `sequence_events` | 1 | `src/hooks/useSequenceEvents.ts` |
| 109 | `sequence_send_log` | 1 | `src/hooks/useSequenceEvents.ts` |
| 110 | `smart_notifications` | 1 | `src/hooks/useSmartNotifications.ts` |
| 111 | `social_insights` | 1 | `src/hooks/useSocialInsights.ts` |
| 112 | `ai_tone_preferences` | 1 | `src/hooks/useTonePersistence.ts` |
| 113 | `validation_queue` | 1 | `src/hooks/useValidationQueue.ts` |
| 114 | `incoming_webhook_dlq` | 1 | `src/hooks/useWebhookDlq.ts` |
| 115 | `win_loss_records` | 1 | `src/hooks/useWinLoss.ts` |
| 116 | `win_loss_reasons` | 1 | `src/hooks/useWinLoss.ts` |
| 117 | `win_loss_insights` | 1 | `src/hooks/useWinLoss.ts` |
| 118 | `slow_queries_audit` | 1 | `src/pages/admin/Observability.tsx` |
| 119 | `contact_report_overrides` | 1 | `src/pages/RelatorioContato.tsx` |

## Artefatos relacionados
- `scripts/tabelas-ausentes.json` — completo, com `exemplos_uso` de cada tabela
- `scripts/tabelas-ausentes.csv` — formato CSV para planilha/importar em outro agente