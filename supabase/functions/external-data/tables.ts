export const ALLOWED_RPCS = [
  // ── Dashboard & KPIs ──
  'get_complete_dashboard', 'get_executive_dashboard', 'get_instant_kpis',
  'get_mini_dashboard', 'get_seller_dashboard', 'get_business_alerts',
  'get_daily_summary', 'get_weekly_summary',
  // ── Contact CRUD ──
  'create_contact', 'update_contact', 'soft_delete_contact',
  'merge_contacts', 'merge_duplicate_contacts',
  // ── Contact Search ──
  'search_contacts', 'search_contacts_advanced', 'search_contacts_fuzzy',
  'list_contacts_paginated', 'find_contacts_by_role',
  'get_contacts_by_role',
  // ── Contact Intelligence ──
  'get_contact_360_by_phone', 'get_contact_intelligence',
  'get_contact_intelligence_by_phone', 'get_contact_disc_profile',
  'get_contact_effectiveness', 'get_contact_engagement_score',
  'get_contact_statistics', 'get_contact_timeline',
  'persist_rfm_analysis',
  // ── Timing ──
  'get_best_contact_time', 'get_best_contact_times',
  'get_days_without_contact', 'get_last_contact_date',
  // ── Quality ──
  'get_duplicate_contacts', 'get_orphan_contacts',
  // ── Contact Upserts ──
  'upsert_contact_email', 'upsert_contact_phone', 'upsert_contact_social_media',
  // ── Contact Outros ──
  'export_contacts_csv', 'get_birthday_contacts',
  // ── Company CRUD ──
  'soft_delete_company', 'create_company',
  'merge_companies', 'export_companies_csv',
  // ── Company Intelligence ──
  'get_company_health_score', 'get_company_360_view', 'advanced_company_search',
  'get_company_timeline', 'calculate_company_health_score',
  'get_next_best_action', 'get_account_plan',
  'calculate_churn_risk', 'calculate_propensity_score',
  'get_key_contacts', 'get_touchpoint_summary',
  'get_strategic_accounts',
  // ── Company Tags ──
  'get_all_tags', 'add_company_tag', 'get_companies_by_tag',
  // ── Company Upserts ──
  'upsert_company_email', 'upsert_company_phone', 'upsert_company_social_media', 'upsert_company_address',
  // ── Deals / Pipeline ──
  'create_deal', 'get_deals_pipeline', 'get_pipeline_summary',
  'get_weighted_forecast', 'get_stage_velocity', 'get_stalled_deals',
  'get_velocity_metrics', 'move_deal_to_stage', 'move_deal_atomic', 'mark_deal_lost',
  'predict_close_date',
  // ── Interactions ──
  'create_quick_interaction', 'get_interaction_history', 'get_pending_followups',
  'complete_followup', 'get_activity_heatmap', 'get_optimal_contact_windows',
  'get_unified_communication_history', 'add_quick_note',
  // ── Reports & Analytics ──
  'get_rfm_dashboard', 'get_rfm_segments', 'get_cohort_analysis',
  'get_seasonality_analysis', 'compare_periods', 'get_yoy_comparison',
  'get_conversion_funnel', 'get_pareto_customers', 'get_pareto_summary',
  'generate_monthly_report', 'get_trend_analysis',
  'get_loss_reason_analysis', 'analyze_loss_patterns',
  'get_industry_analysis', 'get_channel_analysis',
  'get_churn_risk_report', 'generate_daily_insights',
  'generate_seller_report', 'generate_pipeline_report',
  // ── Metas & Gamificação ──
  'get_user_goals', 'get_goals_dashboard', 'get_quota_status',
  'get_leaderboard', 'get_user_badges', 'check_and_award_badges',
  // ── Tasks & Reminders ──
  'create_task', 'get_pending_tasks', 'get_overdue_tasks',
  'create_reminder', 'snooze_reminder', 'complete_task',
  'get_tasks_by_contact', 'get_all_tasks',
  // ── Territories ──
  'get_territories', 'create_territory', 'update_territory',
  'get_territory_performance', 'assign_territory',
  // ── Seller / Team ──
  'get_seller_efficiency', 'compare_seller_efficiency',
    'get_performance_benchmark', 'get_coaching_suggestions',
    'prioritize_daily_tasks', 'get_batch_next_actions',
    // ── Search ──
    'unified_search', 'quick_search', 'search_by_cnpj',
    'autocomplete_companies', 'fuzzy_search_companies',
    // ── Data Quality ──
    'find_invalid_cnpjs', 'find_duplicate_emails', 'find_duplicate_companies',
    'get_data_quality_report', 'get_incomplete_companies',
    // ── Logs & Approvals ──
    'get_ai_recommendation_logs', 'approve_follow_up', 'reject_follow_up',
  ] as const;

export type AllowedRpc = typeof ALLOWED_RPCS[number];

export function isAllowedRpc(name: string): name is AllowedRpc {
  return ALLOWED_RPCS.includes(name as AllowedRpc);
}

export const ALLOWED_TABLES = [
  // ── Core tables ──
  'companies', 'contacts', 'interactions', 'insights', 'alerts',
  'activities', 'life_events', 'contact_phones', 'contact_emails',
  'contact_addresses', 'contact_social_media', 'contact_relatives',
  'contact_cadence', 'contact_preferences', 'contact_time_analysis',
  'communication_preferences', 'client_values', 'decision_criteria',
  'disc_analysis_history', 'disc_communication_logs', 'disc_conversion_metrics',
  'disc_profile_config', 'eq_analysis_history', 'cognitive_bias_history',
  'emotional_anchors', 'emotional_states_history', 'hidden_objections',
  'health_alerts', 'health_alert_settings', 'compatibility_alerts',
  'compatibility_settings', 'automation_rules', 'automation_logs',
  'favorite_templates', 'lux_intelligence', 'metaprogram_analysis',
  'vak_analysis_history', 'rfm_analysis', 'offer_suggestions',
  'trigger_bundles', 'trigger_intensity_history',
  'company_phones', 'company_emails', 'company_addresses',
  'company_social_media', 'company_cnaes', 'company_rfm_scores',
  'company_stakeholder_map',
  // ── WhatsApp & Sales ──
  'whatsapp_messages', 'sales_activities',
  // ── Logs & Approvals ──
  'ai_recommendation_logs', 'follow_up_approvals',
  // ── Materialized views & KPIs ──
  'mv_daily_kpis', 'mv_daily_stats', 'v_daily_kpis',
  // ── Contact intelligence & analytics ──
  'churn_predictions', 'deal_velocity_analysis',
  'relationship_score_history', 'workspace_accounts',
  // ── Commercial & CRM ──
  'deals', 'proposals', 'meetings', 'tasks',
  'email_logs', 'nps_surveys', 'cadence_enrollments', 'inactivity_alerts',
  // ── Views (read-only, pre-computed intelligence) ──
  'vw_active_alerts', 'vw_best_closing_moments', 'vw_churn_risk_ranking',
  'vw_closing_score_alerts', 'vw_closing_score_ranking',
  'vw_communication_dashboard', 'vw_contact_social_media',
  'vw_contacts_completo', 'vw_contacts_contato', 'vw_contacts_full',
  'vw_contacts_sem_apelido', 'vw_deal_velocity_benchmark',
  'vw_deals_full', 'vw_disc_compatibility', 'vw_emotional_trend_by_contact',
  'vw_eq_dashboard', 'vw_eq_evolution', 'vw_interacoes_sem_apelido',
  'vw_interaction_timeline', 'vw_leads_full', 'vw_pending_followups',
  'vw_pending_notifications', 'vw_rapport_points', 'vw_satisfaction_trend',
  'vw_search_contacts', 'vw_singu_communication_intel',
  'vw_singu_contact_360', 'vw_singu_emotional_trend',
  'vw_singu_rapport_intel', 'vw_todays_reminders',
  // ── Extended views ──
  'vw_companies_completo', 'vw_companies_duplicatas',
  'vw_companies_stats', 'vw_companies_contato', 'vw_companies_cores',
  'v_company_summary', 'vw_company_addresses', 'vw_company_social_media',
  'vw_singu_data_health', 'vw_singu_disc_dashboard', 'vw_singu_usage_kpis',
  // ── Company cadences ──
  'company_cadences',
] as const;

export type AllowedTable = typeof ALLOWED_TABLES[number];

export const USER_RLS_READ_ONLY_TABLES = new Set<AllowedTable>([
  'sales_activities',
  'vw_active_alerts',
  'vw_contacts_sem_apelido',
  'vw_pending_followups',
  'vw_interacoes_sem_apelido',
  'vw_singu_data_health',
]);

export const GLOBAL_READ_ONLY_TABLES = new Set<AllowedTable>([
  'mv_daily_kpis',
  'mv_daily_stats',
]);

export function isAllowedTable(table: string): table is AllowedTable {
  return ALLOWED_TABLES.includes(table as AllowedTable);
}
