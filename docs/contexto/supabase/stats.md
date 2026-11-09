# Métricas (voláteis — mudam sem alteração de schema)

Valores aproximados de propósito, para não gerar commits a cada coleta. Fora de `snapshot.json`; o bruto está em `stats.json`.

## Banco

| métrica | valor |
|---|---|
| tamanho | 2.9 GB |
| schema public | 2.8 GB |
| schema zapp_history | 13.4 MB |
| schema _dormant | 4.2 MB |
| schema ops_backup | 344.0 KB |
| schema singu_migration | 96.0 KB |
| schema reporting | 80.0 KB |


## Tabelas (ordenadas por tamanho)

| tabela | linhas (~) | total | heap | índices | linhas mortas (~) | seq scans (~) | idx scans (~) | último autovacuum |
|---|---|---|---|---|---|---|---|---|
| public.audit_log | ~401k | 1.6 GB | 585.5 MB | 37.5 MB | ~14.4k | ~3.1k | ~2k | 2026-10-14 |
| public.companies | ~57.5k | 886.7 MB | 117.4 MB | 769.2 MB | ~9.4k | ~260.1k | ~35.6M | 2026-10-19 |
| public.company_cnaes | ~287.5k | 61.3 MB | 28.5 MB | 32.8 MB | ~160 | ~150 | ~325k | 2026-10-19 |
| public.company_addresses | ~95.7k | 47.0 MB | 27.0 MB | 19.9 MB | ~420 | ~1.5k | ~2.6M | 2026-10-31 |
| public.customers | ~78.7k | 39.0 MB | 24.9 MB | 14.0 MB | ~660 | ~2.7k | ~6.4M | 2026-09-25 |
| public.company_social_media | ~99.1k | 32.3 MB | 18.0 MB | 14.3 MB | ~390 | ~140 | ~182.5k | 2026-03-21 |
| public.company_phones | ~87.5k | 30.5 MB | 14.5 MB | 16.0 MB | ~110 | ~204.3k | ~16.3M | 2026-11-08 |
| public.company_emails | ~57.1k | 27.1 MB | 9.5 MB | 17.6 MB | ~180 | ~380 | ~16.2M | 2026-11-08 |
| public.customer_rotation_state | ~48.6k | 17.5 MB | 11.1 MB | 6.4 MB | 6 | ~742.1k | ~7.5M | 2026-11-09 |
| public.contacts | ~1.8k | 15.8 MB | 11.1 MB | 4.7 MB | 9 | ~9.9k | ~710.8k | 2026-11-09 |
| public.company_rfm_scores | ~48.6k | 14.0 MB | 7.8 MB | 6.1 MB | ~3.2k | ~330 | ~165.7k |  |
| public.error_logs | ~12.6k | 9.8 MB | 9.2 MB | 568.0 KB | ~100 | ~20 | 4 | 2026-10-13 |
| public.activities | ~8.6k | 9.2 MB | 8.4 MB | 856.0 KB | ~1.2k | ~15.4k | ~5.3k | 2026-10-13 |
| public.interactions | ~9.9k | 7.8 MB | 4.0 MB | 3.7 MB | ~680 | ~28.7k | ~34.9M | 2026-10-22 |
| zapp_history.conversation_daily_summaries | 0 | 3.3 MB | 8.0 KB | 3.2 MB | 7 | ~520 | ~6.7k |  |
| zapp_history.message_audio | 0 | 3.2 MB | 8.0 KB | 3.2 MB | 7 | ~410 | ~680 |  |
| zapp_history.message_embeddings | 0 | 3.2 MB | 0 B | 3.2 MB | 0 | ~20 | ~510 |  |
| public.staging_portal_sicoob | ~4.4k | 1.5 MB | 1.1 MB | 296.0 KB | 0 | ~330 | ~9.9k | 2026-03-22 |
| public.contact_emails | ~3.1k | 1.4 MB | 552.0 KB | 824.0 KB | ~340 | ~180 | ~2.5M | 2026-11-08 |
| zapp_history.messages | 0 | 1.2 MB | 0 B | 1.1 MB | 0 | ~636.7k | ~1.2M | 2026-04-10 |
| public.contact_phones | ~3.1k | 1.1 MB | 472.0 KB | 664.0 KB | ~50 | ~6.2k | ~344.4k | 2026-11-08 |
| public.cidades | ~5.6k | 1.1 MB | 720.0 KB | 344.0 KB | 0 | ~20 | ~33.4k |  |
| public.sync_log | ~1.5k | 688.0 KB | 360.0 KB | 232.0 KB | 4 | ~20 | ~20 |  |
| public.customer_events | ~40 | 608.0 KB | 24.0 KB | 544.0 KB | 3 | ~10.4k | ~4.4k | 2026-09-27 |
| zapp_history.phone_to_contact | ~3k | 584.0 KB | 280.0 KB | 264.0 KB | ~220 | ~50 | ~4k | 2026-04-08 |
| public.contact_social_media | ~1k | 552.0 KB | 312.0 KB | 200.0 KB | 4 | ~50 | ~6.4k | 2026-03-21 |
| public.suppliers | ~750 | 552.0 KB | 152.0 KB | 360.0 KB | ~10 | ~470 | ~1.9k | 2026-03-31 |
| public.customer_purchases | 0 | 352.0 KB | 0 B | 328.0 KB | 0 | ~1.6M | ~2.7M | 2026-09-25 |
| ops_backup.acl_snapshot | ~1.9k | 344.0 KB | 304.0 KB | 0 B | 0 | ~10 |  | 2026-10-06 |
| public.grupos_economicos | ~1.3k | 336.0 KB | 136.0 KB | 160.0 KB | ~60 | ~190 | ~4.3k |  |
| public.cnaes | ~1.3k | 280.0 KB | 184.0 KB | 56.0 KB | 2 | ~20 | ~589k |  |
| public.interactions_audit | ~20 | 184.0 KB | 96.0 KB | 16.0 KB | ~30 | ~2.3k | 4 | 2026-11-09 |
| public.rpc_plan_snapshots | 6 | 176.0 KB | 32.0 KB | 48.0 KB | 3 | ~3.9k | ~18.9k | 2026-11-09 |
| public.deals | 3 | 160.0 KB | 8.0 KB | 112.0 KB | ~10 | ~110.5M | ~30 | 2026-11-09 |
| public.disc_profile_config | 4 | 160.0 KB | 48.0 KB | 32.0 KB | ~20 | ~300 | 0 |  |
| public.disc_analysis_history | 0 | 144.0 KB | 8.0 KB | 112.0 KB | 6 | ~3.1k | ~5.7k | 2026-11-09 |
| public.rfm_analysis | 0 | 144.0 KB | 8.0 KB | 112.0 KB | 9 | ~2.8k | ~1.1k | 2026-11-09 |
| public.sales_activities | 5 | 144.0 KB | 8.0 KB | 96.0 KB | ~20 | ~1.4k | ~650 | 2026-11-08 |
| public.tasks | 0 | 144.0 KB | 8.0 KB | 128.0 KB | ~10 | ~60 | ~3.4k |  |
| public.carriers | ~110 | 136.0 KB | 32.0 KB | 64.0 KB | ~10 | ~480 | ~2k | 2026-03-31 |
| public.profiles | ~20 | 136.0 KB | 48.0 KB | 48.0 KB | ~40 | ~8.4k | ~13.5k | 2026-11-08 |
| zapp_history.conversations | 0 | 136.0 KB | 0 B | 112.0 KB | 0 | ~4.3k | ~1.2M | 2026-04-10 |
| zapp_history.product_dictionary | ~100 | 136.0 KB | 24.0 KB | 80.0 KB | ~10 | ~250 | ~160 |  |
| public.activity_feed | 1 | 128.0 KB | 8.0 KB | 80.0 KB | ~10 | ~2.9k | 0 | 2026-11-09 |
| public.customer_ownership_history | ~10 | 128.0 KB | 8.0 KB | 80.0 KB | ~30 | ~16.6k | 0 | 2026-09-24 |
| public.email_verifications | 0 | 128.0 KB | 16.0 KB | 80.0 KB | ~40 | ~1.5k | ~4k | 2026-11-08 |
| public.lead_score_history | 0 | 128.0 KB | 8.0 KB | 96.0 KB | ~30 | ~3.1k | ~1.4k | 2026-11-08 |
| public.email_logs | ~180 | 120.0 KB | 40.0 KB | 48.0 KB | 0 | ~51.8k | ~4.9k |  |
| public.people_intelligence_events | ~10 | 120.0 KB | 16.0 KB | 64.0 KB | ~50 | ~1.4k | ~2.6k | 2026-11-08 |
| public.system_alerts | 0 | 120.0 KB | 8.0 KB | 88.0 KB | ~20 | ~5.5k | ~160 | 2026-11-09 |
| public.alerts | 1 | 112.0 KB | 8.0 KB | 96.0 KB | ~20 | ~41.6k | 2 |  |
| public.churn_predictions | 6 | 112.0 KB | 16.0 KB | 64.0 KB | ~20 | ~16.8k | ~10 |  |
| public.company_stakeholder_map | ~10 | 112.0 KB | 8.0 KB | 96.0 KB | ~10 | ~22.6k | 0 |  |
| public.connector_log | 0 | 112.0 KB | 24.0 KB | 48.0 KB | ~30 | ~300 | ~570 | 2026-04-10 |
| public.cs_accounts | 0 | 112.0 KB | 8.0 KB | 80.0 KB | ~10 | ~4.4k | ~80 | 2026-11-08 |
| public.nurturing_executions | 0 | 112.0 KB | 8.0 KB | 80.0 KB | ~10 | ~1.5k | ~370 | 2026-11-08 |
| public.phone_validations | 0 | 112.0 KB | 8.0 KB | 80.0 KB | ~20 | ~1.6k | ~3.3k | 2026-11-08 |
| public.proposals | 1 | 112.0 KB | 8.0 KB | 96.0 KB | ~10 | ~3.1k | 2 |  |
| public.sales | 0 | 112.0 KB | 8.0 KB | 80.0 KB | ~40 | ~1.5k | ~1.5k | 2026-11-08 |
| public.sequence_send_log | 0 | 112.0 KB | 8.0 KB | 80.0 KB | ~20 | ~3.8k | ~170 | 2026-11-09 |
| public.workspace_accounts | ~30 | 112.0 KB | 32.0 KB | 48.0 KB | ~30 | ~1.1k | ~260 |  |
| zapp_history.message_links | 2 | 112.0 KB | 8.0 KB | 96.0 KB | ~10 | ~600 | ~880 |  |
| zapp_history.message_media | 0 | 112.0 KB | 8.0 KB | 96.0 KB | 9 | ~610 | ~680 |  |
| public.whatsapp_messages | 0 | 104.0 KB | 0 B | 96.0 KB | 0 | ~80 | ~2.8k |  |
| public.automation_rules | ~50 | 96.0 KB | 24.0 KB | 32.0 KB | ~20 | ~40 | ~2.6k | 2026-11-09 |
| public.behavioral_profile_regen_queue | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~40 | ~16.7k | ~6.2k | 2026-11-09 |
| public.contact_behavior | 0 | 96.0 KB | 8.0 KB | 64.0 KB | 8 | ~2.5k | ~2.1k | 2026-11-09 |
| public.custom_field_values | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~20 | ~2.6k | ~710 | 2026-11-09 |
| public.custom_fields | 9 | 96.0 KB | 8.0 KB | 48.0 KB | ~20 | ~1.8k | ~20 | 2026-11-08 |
| public.customer_sdr_history | 5 | 96.0 KB | 8.0 KB | 80.0 KB | ~40 | ~17.4k | ~40 |  |
| public.favorites | 1 | 96.0 KB | 8.0 KB | 48.0 KB | ~20 | ~2.9k | 5 | 2026-11-09 |
| public.lead_score_recompute_queue | 0 | 96.0 KB | 8.0 KB | 48.0 KB | ~40 | ~3.7k | ~620 | 2026-11-08 |
| public.lead_scores | 0 | 96.0 KB | 8.0 KB | 48.0 KB | 4 | ~3.6k | ~1.4k | 2026-11-09 |
| public.metaprogram_analysis | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~20 | ~2.2k | ~520 | 2026-11-08 |
| public.mql_classifications | 0 | 96.0 KB | 8.0 KB | 64.0 KB | 6 | ~2.1k | ~720 | 2026-11-09 |
| public.salespeople | ~10 | 96.0 KB | 8.0 KB | 48.0 KB | ~20 | ~4.6k | ~4.9k | 2026-11-09 |
| public.sequence_enrollments | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~40 | ~19.4k | ~15.1k | 2026-11-09 |
| public.sequence_events | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~30 | ~5k | ~2.1k | 2026-11-09 |
| public.sequence_steps | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~40 | ~6.4k | ~4.3k | 2026-11-09 |
| public.vak_analysis_history | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~40 | ~2k | ~70 | 2026-11-08 |
| public.validation_queue | 0 | 96.0 KB | 8.0 KB | 64.0 KB | ~20 | ~5.9k | ~790 | 2026-11-09 |
| public.crm_relationship_audit_logs | 7 | 88.0 KB | 32.0 KB | 16.0 KB | 8 | ~3.2k | 4 | 2026-11-09 |
| public.daily_challenges | ~260 | 88.0 KB | 40.0 KB | 16.0 KB | ~10 | ~30 | ~260 |  |
| public.sales_tasks | 0 | 88.0 KB | 0 B | 64.0 KB | 0 | ~100 | ~90 | 2026-06-16 |
| public.supplier_homologations | 0 | 88.0 KB | 8.0 KB | 72.0 KB | ~20 | ~40 | ~30.3k |  |
| public.trigger_bundles | 6 | 88.0 KB | 8.0 KB | 72.0 KB | 2 | ~60 | 0 |  |
| _dormant.alertas_inativacao | 0 | 80.0 KB | 16.0 KB | 32.0 KB | ~40 | ~13.9k | 0 |  |
| public.achievements | ~60 | 80.0 KB | 16.0 KB | 32.0 KB | ~50 | ~180 | ~80 |  |
| public.carrier_evaluations | 0 | 80.0 KB | 8.0 KB | 64.0 KB | ~20 | ~60 | ~270 |  |
| public.carrier_homologations | 0 | 80.0 KB | 8.0 KB | 64.0 KB | ~20 | ~60 | ~5k |  |
| public.carrier_scores | 0 | 80.0 KB | 8.0 KB | 64.0 KB | ~30 | ~80 | ~620 |  |
| public.contact_addresses | ~20 | 80.0 KB | 8.0 KB | 64.0 KB | ~20 | ~5.7k | 8 |  |
| public.contact_analytical_profile_versions | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~20 | ~3.2k | ~170 | 2026-11-09 |
| public.contact_cadence | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~40 | ~2.4k | ~2.2k | 2026-11-09 |
| public.conversation_topics_catalog | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~40 | ~30 | ~3.8k | 2026-11-09 |
| public.deal_velocity_analysis | 1 | 80.0 KB | 8.0 KB | 64.0 KB | ~20 | ~16.8k | 0 |  |
| public.forecast_periods | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~10 | ~560 | ~420 | 2026-11-08 |
| public.health_alert_settings | ~20 | 80.0 KB | 8.0 KB | 32.0 KB | ~40 | ~320 | ~1.5k | 2026-11-08 |
| public.notifications | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~20 | ~1.6k | ~80 | 2026-11-08 |
| public.relationship_score_history | 7 | 80.0 KB | 8.0 KB | 64.0 KB | 8 | ~29k | 4 |  |
| public.reminders | 3 | 80.0 KB | 8.0 KB | 64.0 KB | 8 | ~1.4k | ~70 |  |
| public.rfm_history | 0 | 80.0 KB | 8.0 KB | 48.0 KB | 6 | ~1.9k | ~100 | 2026-11-09 |
| public.sales_opportunities | 0 | 80.0 KB | 8.0 KB | 64.0 KB | 7 | ~60 | ~1.5k |  |
| public.scheduled_visits | 3 | 80.0 KB | 8.0 KB | 64.0 KB | 3 | ~1.5k | 8 |  |
| public.sdr_alert_history | ~90 | 80.0 KB | 32.0 KB | 16.0 KB | 0 | ~20 | ~90 |  |
| public.sdr_closer_assignments | 4 | 80.0 KB | 8.0 KB | 64.0 KB | ~30 | ~80 | ~90 |  |
| public.sequence_email_reservations | 0 | 80.0 KB | 8.0 KB | 48.0 KB | ~30 | ~4.2k | ~1.8k | 2026-11-08 |
| public.supplier_evaluations | 0 | 80.0 KB | 8.0 KB | 64.0 KB | ~20 | ~60 | ~60 |  |
| public.trigger_types | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | 1 | ~60 | 0 |  |
| public.uapi_sessions | ~20 | 80.0 KB | 16.0 KB | 32.0 KB | 5 | ~580 | ~100 |  |
| public.compatibility_settings | ~20 | 72.0 KB | 8.0 KB | 32.0 KB | ~40 | ~590 | ~1.5k | 2026-11-08 |
| public.contact_cadence_audit | 0 | 72.0 KB | 24.0 KB | 16.0 KB | ~40 | ~2.3k | 4 | 2026-11-09 |
| public.csat_surveys | 0 | 72.0 KB | 0 B | 48.0 KB | 0 | ~17.5k | ~1.7k | 2026-11-09 |
| public.disc_approach_recommendations | ~10 | 72.0 KB | 24.0 KB | 16.0 KB | ~10 | ~40 | 0 |  |
| public.supplier_scores | 0 | 72.0 KB | 8.0 KB | 56.0 KB | ~40 | ~80 | ~1.8k |  |
| public.system_health_snapshots | 0 | 72.0 KB | 0 B | 48.0 KB | 0 | ~20 | 0 | 2026-11-09 |
| public.user_roles | 1 | 72.0 KB | 8.0 KB | 32.0 KB | 3 | ~47.3k | ~1M | 2026-11-09 |
| zapp_history.async_request_log | 0 | 72.0 KB | 0 B | 48.0 KB | 0 | ~100 | ~20 | 2026-04-10 |
| _dormant.inactivity_alerts | 0 | 64.0 KB | 8.0 KB | 16.0 KB | ~20 | ~14.6k | ~1.2k | 2026-11-08 |
| _dormant.pix_accounts | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~30 | ~5.1k |  |
| public.ai_recommendation_audit_logs_v2 | ~60 | 64.0 KB | 16.0 KB | 16.0 KB | 1 | ~2.4k | ~30 |  |
| public.behavioral_insight_feedback | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~30 | ~3.4k | ~120 | 2026-11-09 |
| public.contact_analytical_profiles | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~10 | ~5.1k | ~1.4k | 2026-11-09 |
| public.contact_automation_settings | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~40 | ~3.1k | ~290 | 2026-11-09 |
| public.coop_sistemas | 8 | 64.0 KB | 8.0 KB | 48.0 KB | ~20 | ~70 | 0 |  |
| public.data_quality_audits | 0 | 64.0 KB | 16.0 KB | 16.0 KB | 0 | ~40 | 7 |  |
| public.documents | 1 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~2.8k | 1 |  |
| public.landing_pages | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 1 | ~550 | ~1.7k |  |
| public.lead_score_threshold_automations | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~20 | ~720 | ~150 | 2026-11-08 |
| public.mql_criteria | 0 | 64.0 KB | 8.0 KB | 32.0 KB | 9 | ~560 | ~100 | 2026-11-08 |
| public.notification_logs | 0 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~1.6k | ~20 |  |
| public.nurturing_workflows | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~20 | ~1.8k | ~260 | 2026-11-08 |
| public.permissions | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 0 | ~280 | ~90 |  |
| public.pipeline_stages | 8 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~120 | 0 |  |
| public.quick_notes | 1 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~1.5k | 1 |  |
| public.rfm_segment_config | ~10 | 64.0 KB | 8.0 KB | 48.0 KB | 2 | ~50 | 0 |  |
| public.rodizio_distribuicao_staging | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~20 | ~2.2k | ~890 | 2026-11-08 |
| public.rpc_perf_samples | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~50 | ~13.8k | ~2k | 2026-11-06 |
| public.sales_team_members | 0 | 64.0 KB | 8.0 KB | 48.0 KB | 3 | ~900 | ~50 |  |
| public.sequences | 0 | 64.0 KB | 8.0 KB | 32.0 KB | ~20 | ~41.3k | ~300 | 2026-11-09 |
| public.user_goals | 6 | 64.0 KB | 8.0 KB | 48.0 KB | ~10 | ~130 | ~310 |  |
| singu_migration._checklist | ~50 | 64.0 KB | 16.0 KB | 16.0 KB | 7 | ~40 | ~20 |  |
| public.abm_accounts | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~40 | ~2.1k |  |
| public.cadence_enrollments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~30 | ~3.9k |  |
| public.campaign_members | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~30 | ~4.8k |  |
| public.carrier_score_history | 0 | 56.0 KB | 8.0 KB | 40.0 KB | ~30 | ~70 | ~10 |  |
| public.company_cadences | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~50 | ~1.6k |  |
| public.deal_rooms | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~40 | ~2.5k |  |
| public.document_signatures | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~1.9k | ~1.1k |  |
| public.emotional_states_history | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~240 | ~3k |  |
| public.entity_relationships | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~290 | 0 |  |
| public.handoff_requests | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~1.9k | ~910 |  |
| public.hidden_objections | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~240 | ~3.1k |  |
| public.lead_assignments | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~350 | ~2.4k |  |
| public.lead_routing_rules | 0 | 56.0 KB | 8.0 KB | 40.0 KB | 1 | ~40 | 1 |  |
| public.meeting_summaries | 0 | 56.0 KB | 8.0 KB | 40.0 KB | 1 | ~1.9k | ~910 |  |
| public.role_permissions | ~60 | 56.0 KB | 8.0 KB | 48.0 KB | 0 | ~280 | ~60 |  |
| public.search_products_cache | 0 | 56.0 KB | 0 B | 48.0 KB | 0 | ~40 | 0 |  |
| public.supplier_score_history | 0 | 56.0 KB | 8.0 KB | 40.0 KB | ~40 | ~40 | 8 |  |
| _dormant.disc_compatibility | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~20 | 0 |  |
| public.alert_rules | 6 | 48.0 KB | 8.0 KB | 32.0 KB | 3 | ~150 | 0 |  |
| public.automations | 3 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~120 | 4 |  |
| public.badges | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~20 | ~80 |  |
| public.calendar_events | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~3.9k |  |
| public.carrier_qualification_config | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~80 | ~60 |  |
| public.churn_risk_factors | 4 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~80 | 0 |  |
| public.churn_risk_scores | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~340 | ~9.9k |  |
| public.closing_score_config | 5 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~80 | 0 |  |
| public.competitive_losses | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | ~1.6k |  |
| public.config_regras_negocio | ~30 | 48.0 KB | 8.0 KB | 32.0 KB | ~20 | ~5.1M | ~60 |  |
| public.contact_decision_making | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~40 | ~3.3k |  |
| public.contact_influence | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~40 | ~3.4k |  |
| public.contact_metaprograms | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~40 | ~3.3k |  |
| public.contact_next_actions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~2.5k |  |
| public.contact_personality | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~40 | ~3.2k |  |
| public.contact_rapport_strategy | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 2 | ~30 | ~2.6k |  |
| public.disc_analysis_history_audit | 0 | 48.0 KB | 8.0 KB | 16.0 KB | 6 | ~2.3k | 1 | 2026-11-09 |
| public.disc_communication_logs | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~240 | ~2.8k |  |
| public.disc_templates | 5 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~60 | 0 |  |
| public.eq_analysis_history | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~250 | ~7.9k |  |
| public.geo_allowed_countries | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~20 | 4 |  |
| public.inactivity_alerts | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~4.9k |  |
| public.interaction_templates | 4 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | 7 |  |
| public.knowledge_base_articles | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~30 | 3 |  |
| public.lead_score_threshold_log | 0 | 48.0 KB | 8.0 KB | 16.0 KB | ~20 | ~2.5k | 0 | 2026-11-08 |
| public.lead_sources | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.loss_reasons | 8 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.meetings | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~3.8k |  |
| public.model_pricing_v2 | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~70 | ~20 |  |
| public.offer_suggestions | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~1.4k |  |
| public.portfolio_settings | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~40 | 4 |  |
| public.products | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~40 | ~20 |  |
| public.rodizio_execucoes | 0 | 48.0 KB | 8.0 KB | 16.0 KB | ~40 | ~440 | ~190 | 2026-09-24 |
| public.sales_goals | 1 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~60 | 0 |  |
| public.sales_scripts | 3 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~60 | 0 |  |
| public.script_sections | 1 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 0 |  |
| public.sleight_of_mouth_examples | 2 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 0 |  |
| public.sleight_of_mouth_patterns | ~10 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| public.smart_segments | 4 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~50 | 4 |  |
| public.sms_campaign_recipients | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | ~1.2k |  |
| public.sms_templates | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 1 | ~30 | 1 |  |
| public.social_life_events | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~30 | ~1.2k |  |
| public.social_profiles | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~1.2k |  |
| public.supplier_qualification_config | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~90 | ~40 |  |
| public.trigger_ab_tests | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~1.2k |  |
| public.trigger_channel_effectiveness | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | ~1.2k |  |
| public.user_ui_preferences | 0 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~30 | ~3.2k |  |
| public.win_loss_records | 0 | 48.0 KB | 0 B | 40.0 KB | 0 | ~40 | 0 |  |
| zapp_history.edge_function_templates | 0 | 48.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~20 |  |
| zapp_history.location_dictionary | 0 | 48.0 KB | 8.0 KB | 32.0 KB | 0 | ~260 | ~40 |  |
| zapp_history.whatsapp_connections | 1 | 48.0 KB | 8.0 KB | 32.0 KB | ~10 | ~670 | ~390 |  |
| public.ai_chat_threads | 0 | 40.0 KB | 8.0 KB | 24.0 KB | 1 | ~30 | ~90 |  |
| public.automation_logs | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | ~140 |  |
| public.campaign_recipients | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | ~2.4k |  |
| public.client_values | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~2.7k |  |
| public.cognitive_bias_history | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~250 | ~3.1k |  |
| public.commissions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~70 |  |
| public.conversational_search_cache | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.customer_surveys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | ~4.7k |  |
| public.deal_competitors | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~10 |  |
| public.decision_criteria | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~2.6k |  |
| public.economic_group_members | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~1.5k |  |
| public.email_campaigns | 0 | 40.0 KB | 8.0 KB | 24.0 KB | 1 | ~40 | 3 |  |
| public.email_finder_results | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~2.3k |  |
| public.email_thread_summaries | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | 0 |  |
| public.emotional_anchors | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | ~2.5k |  |
| public.estados | ~30 | 40.0 KB | 8.0 KB | 32.0 KB | 0 | ~40 | 0 |  |
| public.form_submissions | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | ~2.3k |  |
| public.forms | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~660 | ~980 |  |
| public.insights | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | ~18.4k |  |
| public.lead_magnets | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~610 | ~650 |  |
| public.nps_surveys | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~30 | ~3.2k |  |
| public.playbook_usage_log | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~790 | ~380 |  |
| public.semantic_search_cache | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~20 | 3 |  |
| public.smart_notifications | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~1.1k | ~7.4k |  |
| public.social_scraping_schedule | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~40 | ~1.2k |  |
| public.stakeholder_alerts | 0 | 40.0 KB | 0 B | 32.0 KB | 0 | ~1k | ~1.3k |  |
| public.support_tickets | 0 | 40.0 KB | 8.0 KB | 24.0 KB | 1 | ~1.8k | ~540 |  |
| public.tags | ~10 | 40.0 KB | 8.0 KB | 32.0 KB | 0 | ~30 | 0 |  |
| _dormant.client_values | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~3k |  |
| _dormant.rfm_analysis | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~3k |  |
| _dormant.trigger_channel_effectiveness | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~3k |  |
| public.abm_buying_committee | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | ~30 |  |
| public.ai_gateway_metrics_2026_08 | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~7.4k |  |
| public.ai_gateway_metrics_2026_09 | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~7.4k |  |
| public.ai_gateway_metrics_2026_10 | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~24.1k |  |
| public.ai_gateway_metrics_2026_11 | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~29.8k |  |
| public.ai_gateway_metrics_2026_12 | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~29.8k |  |
| public.ai_gateway_metrics_2027_01 | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~29.8k |  |
| public.automation_executions | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~2.8k | ~70 |  |
| public.campaigns | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~100 |  |
| public.commission_rules | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | ~50 |  |
| public.communication_preferences | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~2.7k |  |
| public.compatibility_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~240 | ~2.4k |  |
| public.competitors | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~40 | ~20 |  |
| public.connection_anomalies | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.connection_configs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 1 |  |
| public.contact_notes | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~2.3k |  |
| public.contact_objection_scripts | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~2.5k | 2 |  |
| public.contact_preferences | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | ~2.8k |  |
| public.contact_relatives | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | ~2.9k |  |
| public.conversation_analyses | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.6k | ~760 |  |
| public.crm_consent_audit_logs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~2.3k |  |
| public.crm_objection_intelligence | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~2.3k |  |
| public.cs_health_signals | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~640 |  |
| public.cs_nps_responses | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.6k | ~760 |  |
| public.customer_health_scores | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~1.4k |  |
| public.deal_items | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~10 |  |
| public.deal_room_documents | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.deal_room_milestones | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 0 |  |
| public.deal_room_stakeholders | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.6k | ~760 |  |
| public.disc_conversion_metrics | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~20 |  |
| public.document_templates | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 5 |  |
| public.document_views | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 4 |  |
| public.duplicate_candidates | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 3 |  |
| public.embedding_configs | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~70 | 4 |  |
| public.eq_assessment_questions | ~10 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 0 |  |
| public.follow_up_approvals | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 8 | ~2.3k | 8 |  |
| public.forecast_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.health_alerts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | ~18.1k |  |
| public.incoming_webhook_dlq | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.lead_magnet_downloads | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.5k | ~760 |  |
| public.lead_score_rules | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.life_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~50 | ~3.4k |  |
| public.lux_intelligence | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~2.9k |  |
| public.lux_webhook_config | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 4 |  |
| public.neuro_behavioral_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~1.3k |  |
| public.nurturing_enrollments | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~1.2k |  |
| public.oauth_tokens | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 6 | ~30 | ~4.4k |  |
| public.objection_example_feedback | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.pipelines | 1 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~60 | 0 |  |
| public.product_novelties | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~300 | 2 |  |
| public.revops_benchmarks | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.revops_snapshots | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.sales_forecasts | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 4 |  |
| public.seller_daily_metrics | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | 2 |  |
| public.sla_rules | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 5 |  |
| public.sla_violations | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.1k | ~540 |  |
| public.sms_campaigns | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| public.sms_opt_outs | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~830 | ~390 |  |
| public.social_behavior_analysis | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~1.2k |  |
| public.suggested_life_events | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | ~1.2k |  |
| public.territory_assignments | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 1 |  |
| public.trigger_intensity_history | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~1.1k | ~390 |  |
| public.user_badges | 0 | 32.0 KB | 0 B | 32.0 KB | 0 | ~20 | 7 |  |
| public.users | ~20 | 32.0 KB | 8.0 KB | 16.0 KB | ~20 | ~4.3M | ~330 |  |
| public.vak_keywords | ~40 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~30 | 0 |  |
| public.webauthn_credentials | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 2 |  |
| public.weekly_challenges | 0 | 32.0 KB | 8.0 KB | 16.0 KB | ~10 | ~40 | 5 |  |
| public.whatsapp_instances | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~40 | 1 |  |
| public.win_loss_reasons | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~30 | 0 |  |
| zapp_history.admin_grants | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~60 | 8 |  |
| zapp_history.ai_cost_log | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~150 | ~120 |  |
| zapp_history.ai_training_dataset | 0 | 32.0 KB | 0 B | 24.0 KB | 0 | ~270 | ~200 |  |
| zapp_history.disc_playbook | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 0 | ~20 | 9 |  |
| zapp_history.runtime_config | 0 | 32.0 KB | 8.0 KB | 16.0 KB | 2 | ~20 | ~31.4k |  |
| _dormant.blocked_ips | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.carrier_contacts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.category_metrics | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.client_portfolio | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | ~30 |  |
| _dormant.cognitive_bias_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.collectible_badges | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.communication_cadence | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.communication_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.contact_cadence | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.contact_compatibility | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.contact_metaprograms | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.contact_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.contact_relationships | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~6.3k | 0 |  |
| _dormant.contact_rfm_scores | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.contact_time_analysis | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~20 | ~3k |  |
| _dormant.contact_trigger_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.custom_field_values | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.custom_fields | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.customer_contacts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.daily_streak_achievements | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.dashboard_layouts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.deal_products_catalog | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.deals | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~13.8k | 0 |  |
| _dormant.disc_analysis_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.disc_communication_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.disc_conversion_metrics | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.emotional_states_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.entity_versions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.eq_analysis_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.favorite_templates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.feed_reactions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.health_alert_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| _dormant.hidden_objections | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.icp_data | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.influence_network | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.lead_scores | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~20 |  |
| _dormant.leads | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~13.8k | 0 |  |
| _dormant.notification_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.password_reset_requests | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.personalized_message_templates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.progressive_goals | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.prospect_cadences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | ~20 |  |
| _dormant.push_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.quotes | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | 0 |  |
| _dormant.rate_limit_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.rfm_metrics | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.sales_streaks | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.salesperson_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.saved_filters | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.score_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.social_behavior_analysis | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.social_life_events | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.social_profiles | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.social_scraping_schedule | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.stakeholder_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~2.9k | ~3k |  |
| _dormant.supplier_contacts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.supplier_products | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| _dormant.tournament_participants | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.trigger_ab_tests | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| _dormant.trigger_intensity_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.user_companies_link | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~10.6k | 0 |  |
| _dormant.user_contacts_link | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.3k | 0 |  |
| _dormant.user_disc_profile | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| _dormant.user_favorite_templates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| _dormant.user_mfa_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.vak_analysis_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~540 | ~3k |  |
| _dormant.vak_profiles | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.webauthn_credentials | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| _dormant.weekly_report_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| _dormant.weekly_reports | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.whatsapp_instances | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| _dormant.whatsapp_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~3k |  |
| public.abm_account_plans | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~50 |  |
| public.abm_campaigns | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~1.1k |  |
| public.access_security_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~140 |  |
| public.ai_chat_messages | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~100 |  |
| public.ai_tone_preferences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~460 |  |
| public.attribution_models_cache | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 6 |  |
| public.brain_dominance_analysis | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~2.3k |  |
| public.call_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.5k | 0 |  |
| public.canned_responses | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~110 |  |
| public.city_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~20 |  |
| public.clients | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~50 | ~40 |  |
| public.cnpj_cache | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~40 |  |
| public.company_territories | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~30 | ~1.7k |  |
| public.connection_quotas | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~20 | 0 |  |
| public.connection_test_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~320 |  |
| public.contact_business_context | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | ~2.4k |  |
| public.contact_family_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~280 | ~2.4k |  |
| public.contact_predictive_roadmap | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~2.4k |  |
| public.contact_report_overrides | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~2.3k |  |
| public.contact_time_analysis | 0 | 24.0 KB | 0 B | 24.0 KB | 0 | ~50 | ~2.7k |  |
| public.crm_cadence_rules | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.deal_forecasts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~3.4k | 0 |  |
| public.deal_room_activities | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.deal_room_comments | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.device_login_notifications | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 6 |  |
| public.economic_groups | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~1.5k |  |
| public.favorite_templates | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.forecast_categories_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.forecast_quota_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~320 |  |
| public.import_jobs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.incoming_webhooks | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 0 |  |
| public.integration_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.integrations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 2 |  |
| public.intent_scores | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~2.1k |  |
| public.intent_tracking_pixels | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.1k | 0 |  |
| public.ip_whitelist | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 2 |  |
| public.landing_page_submissions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.5k | ~760 |  |
| public.lead_score_config | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 1 |  |
| public.lead_score_thresholds | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 0 |  |
| public.neuro_pnl_sessions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.3k | ~1.6k |  |
| public.pipeline_stage_transitions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~280 | ~320 |  |
| public.proximo_passo_feedback | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.purchase_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.1k | ~540 |  |
| public.push_subscriptions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 5 |  |
| public.query_telemetry | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 3 |  |
| public.redistribution_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.1k | ~540 |  |
| public.report_executions | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.revops_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~320 |  |
| public.rfm_metrics | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.sales_cadences | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~40 | 2 |  |
| public.scheduled_reports | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.schema_drift_alerts | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.score_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~800 | ~470 |  |
| public.secret_rotation_log | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 3 |  |
| public.sentiment_annotations | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | ~770 |  |
| public.social_consent_audit | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~1.2k |  |
| public.social_sync_queue | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.2k | 0 |  |
| public.suggested_rapport_intel | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~290 | ~1.3k |  |
| public.territories | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.2k | 0 |  |
| public.ticket_comments | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 5 |  |
| public.trigger_usage_history | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~790 | ~390 |  |
| public.user_known_devices | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 1 |  |
| public.visit_checkins | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~1.8k | ~540 |  |
| public.webhook_logs | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.webhooks | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| public.weekly_report_settings | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~30 | 1 |  |
| public.weekly_reports | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 1 |  |
| public.whatsapp_kpis | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| public.whatsapp_messages_index | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~790 | 0 |  |
| public.win_loss_insights | 0 | 24.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.access_denied_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.active_power_ups | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~50 | 1 |  |
| _dormant.active_sessions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.activity_goals | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.activity_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.alert_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.api_usage_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.automation_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.automation_rules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 2 |  |
| _dormant.available_spins | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.battle_participants | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.bitrix24_sync_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.cadence_steps | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.cadence_tasks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.cadences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.challenge_progress | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.chat_conversations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.chat_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.circuit_breaker_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.closing_moment_analysis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~8k | 0 |  |
| _dormant.cognitive_biases | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.compatibility_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3k | 0 |  |
| _dormant.compatibility_settings | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 7 |  |
| _dormant.competitive_chat_messages | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.competitive_seasons | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.contact_availability | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.contact_communication_style | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.4k | 0 |  |
| _dormant.contact_eq_scores | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~8.2k | 0 |  |
| _dormant.contact_relatives | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.contact_values | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.daily_challenge_progress | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.daily_metrics | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.dashboard_widgets | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.deal_chat_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~60 | 1 |  |
| _dormant.deal_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.deal_outcomes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~60 | 1 |  |
| _dormant.deal_products | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.deal_stage_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.decision_criteria | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.demand_forecasts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.digest_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.digital_signatures | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.disc_assessments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.8k | 0 |  |
| _dormant.disc_interaction_signals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.disc_questions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.document_signers | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.email_tracking_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.emotional_anchors | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.emotional_states | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.emotional_trend_snapshots | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~23.1k | 0 |  |
| _dormant.eq_pillar_details | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.feed_comments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.health_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~13.7k | 0 |  |
| _dormant.insights | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~14.3k | 0 |  |
| _dormant.inventory_levels | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.known_devices | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.kudos | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~80 | 0 |  |
| _dormant.lead_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.lead_routing_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~80 | 0 |  |
| _dormant.life_events | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.login_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.login_attempts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.lux_intelligence | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.metaprogram_analysis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.metaprogram_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.mfa_verification_attempts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.notes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.notification_preferences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.notifications | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~15k | 0 |  |
| _dormant.objection_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.objections | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.objections_library | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.offer_suggestions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.performance_bets | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~80 | 0 |  |
| _dormant.playbook_items | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.playbook_progress | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~50 | ~20 |  |
| _dormant.playbooks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.pre_contact_briefings | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.price_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.price_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.prize_wheel_spins | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.products | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.purchase_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~13.7k | 0 |  |
| _dormant.quote_sync_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.rank_change_notifications | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.rapport_score_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~8.1k | 0 |  |
| _dormant.rate_limit_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.reauthentication_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.rfm_calculations | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.rfm_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.sales_battles | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.sales_goals | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.sales_territories | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.salesperson_badges | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.salesperson_leagues | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.salesperson_xp | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.satisfaction_scores | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~13.7k | 0 |  |
| _dormant.script_usage_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.security_alert_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.security_alert_settings | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 0 |  |
| _dormant.shared_interests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~27.8k | 0 |  |
| _dormant.smart_reminders | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~15k | 0 |  |
| _dormant.sms_verification_codes | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.social_mentions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~6.8k | 0 |  |
| _dormant.stock_movements | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.supplier_orders | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.supplier_risk_assessments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.tasks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~13.7k | 0 |  |
| _dormant.team_closers | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | ~30 |  |
| _dormant.teams | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.template_performance | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.territory_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~80 | 0 |  |
| _dormant.time_analysis | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~3.2k | 0 |  |
| _dormant.tournament_matches | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~100 | 0 |  |
| _dormant.tournaments | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.trigger_suggestions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.trigger_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.trigger_usage_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.trigger_usage_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.7k | 0 |  |
| _dormant.user_roles | 0 | 16.0 KB | 0 B | 16.0 KB | 0 | ~20 | 2 |  |
| _dormant.vak_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.victory_feed | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 0 |  |
| _dormant.webauthn_challenges | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.weekly_matchups | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~100 | 0 |  |
| _dormant.whatsapp_kpis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| _dormant.workflow_action_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.workflow_actions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.workflow_executions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.workflow_rules | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.workflow_triggers | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.workflows | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.xp_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.abm_whitespace_opportunities | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | ~40 |  |
| public.access_blocked_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~60 | ~170 |  |
| public.ai_recommendation_audit_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | ~20 |  |
| public.ai_recommendation_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 7 |  |
| public.applied_objection_responses | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 6 |  |
| public.asia_upload_mapping | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | ~80 |  |
| public.attribution_touchpoints | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.6k | 4 |  |
| public.battle_cards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 2 |  |
| public.coaching_scorecards | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.contact_preferences_audit | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 2 |  |
| public.contact_relatives_audit | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 2 |  |
| public.contact_time_analysis_audit | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 3 |  |
| public.crm_alerts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.4k | 0 |  |
| public.crm_automation_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 0 |  |
| public.crm_automation_reprocess_queue | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.crm_metric_overrides | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 0 |  |
| public.cron_secrets | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.cs_qbrs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| public.cs_renewals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~350 | 0 |  |
| public.feature_flags | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~270 | 1 |  |
| public.ficha360_conversation_summaries | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 0 |  |
| public.follow_up_approvals_v2 | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.guardrail_ml_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.incoming_webhook_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.intent_signals | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~3.8k | 0 |  |
| public.interaction_summaries | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.8k | 0 |  |
| public.life_events_history | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.3k | 1 |  |
| public.login_attempts | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.marketing_campaign_stats | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~2.7k | 0 |  |
| public.marketing_roi_data | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.mcp_tool_calls | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.message_templates | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~30 | 4 |  |
| public.nlp_extractions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~50 | 1 |  |
| public.nlp_feedback | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~1.5k | 0 |  |
| public.notification_preferences | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.password_reset_requests | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 1 |  |
| public.psychographic_audit_log | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~1.2k | 0 |  |
| public.ragas_scores | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~50 | 2 |  |
| public.reframing_analysis | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~1.2k | 1 |  |
| public.reframing_analysis_audit | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~1.2k | 0 |  |
| public.sales_playbooks | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~40 | 1 |  |
| public.sm_upload_mapping | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.system_config | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~270 | 0 |  |
| public.whatsapp_ingestion_logs | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~1.2k | 0 |  |
| public.whatsapp_transcriptions | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.xbz_upload_mapping | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| singu_migration._errors | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 4 |  |
| singu_migration._source_schema | 0 | 16.0 KB | 0 B | 8.0 KB | 0 | ~10 | 4 |  |
| _dormant.company_tags | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~30 | 0 |  |
| _dormant.contact_tags | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.interaction_participants | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.sla_configs | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| _dormant.supplier_order_items | 0 | 8.0 KB | 0 B | 8.0 KB | 0 | ~20 | 0 |  |
| public.ai_gateway_metrics | 0 | 0 B | 0 B | 0 B | 0 | 0 | 0 |  |


## Índices nunca usados (candidatos a remoção; ignore PK/UNIQUE)

| índice | tabela | tamanho |
|---|---|---|
| idx_company_addresses_cidade | public.company_addresses | 1.4 MB |
| idx_company_rfm_scores_segment_id | public.company_rfm_scores | 344.0 KB |
| idx_contacts_last_name_trgm | public.contacts | 344.0 KB |
| idx_cds_embedding | zapp_history.conversation_daily_summaries | 1.6 MB |
| idx_cds_embedding_1024 | zapp_history.conversation_daily_summaries | 1.6 MB |
| idx_ma_embedding | zapp_history.message_audio | 1.6 MB |
| idx_ma_embedding_1024 | zapp_history.message_audio | 1.6 MB |
| idx_me_vector | zapp_history.message_embeddings | 1.6 MB |
| idx_me_vector_1024 | zapp_history.message_embeddings | 1.6 MB |


## Storage

| bucket | objetos (~) | tamanho |
|---|---|---|
| logos | ~49.5k | 6.0 GB |


## Auth (agregados)

| métrica | valor |
|---|---|
| usuários (~) | ~20 |
| confirmados (~) | ~20 |
| criados últimos 30d (~) | 2 |

| provider | usuários (~) |
|---|---|
| email | ~20 |


## Consultas mais custosas (pg_stat_statements, desde o último reset)
| role | chamadas (~) | total ms (~) | média ms | query |
|---|---|---|---|---|
| service_role | ~15.7M | ~320.2M | 20.34 | `WITH pgrst_source AS (UPDATE "public"."companies" SET "cnpj_normalizado_em" = "pgrst_body"."cnpj_normalizado_em" FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "cnpj_normalizado_em" FROM json_to_record(pgrs` |
| service_role | ~15.8M | ~308.6M | 19.56 | `WITH pgrst_source AS (UPDATE "public"."companies" SET "address" = "pgrst_body"."address", "city" = "pgrst_body"."city", "email" = "pgrst_body"."email", "phone" = "pgrst_body"."phone", "state" = "pgrst_body"."state" FROM ` |
| postgres | ~10.6k | ~10.8M | 1014.33 | `SELECT pg_advisory_xact_lock(hashtext($1))` |
| postgres | ~616k | ~10M | 16.18 | `SELECT zapp_history.reconcile_nlp_responses()` |
| postgres | ~5.5k | ~6.4M | 1171.32 | `with f as ( -- CTE with sane arg_modes, arg_names, and arg_types. -- All three are always of the same length. -- All three include all args, including OUT and TABLE args. with functions as ( select *, -- proargmodes is n` |
| service_role | ~4k | ~5.7M | 1406.83 | `WITH pgrst_source AS (SELECT pgrst_call.pgrst_scalar FROM (SELECT $1 AS json_data) pgrst_payload, LATERAL (SELECT "p_phones" FROM json_to_record(pgrst_payload.json_data) AS _("p_phones" text[]) LIMIT $4) pgrst_body , LAT` |
| postgres | ~5.6k | ~4.9M | 877.68 | `SELECT tbl.schemaname, tbl.tablename, tbl.quoted_name, tbl.is_table, json_agg(a) as columns FROM ( SELECT n.nspname as schemaname, c.relname as tablename, (quote_ident(n.nspname) \|\| $1 \|\| quote_ident(c.relname)) as quote` |
| service_role | ~13k | ~3.5M | 270.67 | `WITH pgrst_source AS ( SELECT "public"."companies".* FROM "public"."companies" WHERE "public"."companies"."is_customer" = $1 AND "public"."companies"."deleted_at" IS NULL ORDER BY "public"."companies"."razao_social" ASC ` |
| postgres | ~120 | ~3.4M | 29461.80 | `SELECT string_agg( format($1, id, table_name, record_id, action, CASE WHEN old_data IS NULL THEN $2 ELSE quote_literal(old_data::text) \|\|$3 END, CASE WHEN new_data IS NULL THEN $4 ELSE quote_literal(new_data::text) \|\|$5 ` |
| postgres | ~28.8k | ~2.5M | 86.09 | `WITH rows AS ( SELECT ctid FROM net._http_response WHERE created < now() - $1 ORDER BY created LIMIT $2 ) DELETE FROM net._http_response r USING rows WHERE r.ctid = rows.ctid` |
| service_role | ~11.1k | ~2.3M | 210.80 | `WITH pgrst_source AS ( SELECT "public"."companies"."id", "public"."companies"."razao_social", "public"."companies"."nome_fantasia", "public"."companies"."ramo_atividade", "public"."companies"."cnpj", "public"."companies"` |
| service_role | ~64M | ~2M | 0.03 | `select set_config('?', $1, true), set_config($2, $3, true), set_config('?', $4, true), set_config('?', $5, true), set_config('?', $6, true), set_config('?', $7, true)` |
| postgres | ~5.1k | ~1.7M | 340.26 | `with policies as ( select pol.oid :: int8 as id, n.nspname as schema, c.relname as table, c.oid :: int8 as table_id, pol.polname as name, case when pol.polpermissive then $1::text else $2::text end as action, case when p` |
| postgres | ~8.7k | ~1.7M | 197.90 | `SELECT e.name, n.nspname AS schema, e.default_version, x.extversion AS installed_version, e.comment, ev.schema AS default_version_schema FROM pg_available_extensions e LEFT JOIN pg_extension x ON e.name = x.extname LEFT ` |
| postgres | ~1.9k | ~1.7M | 881.93 | `with table_privileges as ( select c.oid as relation_id, nc.nspname as schema, c.relname as name, case when c.relkind = $1 then $2 when c.relkind = $3 then $4 when c.relkind = $5 then $6 when c.relkind = $7 then $8 when c` |


## Conexões
| usuário | estado | n |
|---|---|---|
| authenticator | idle | 1 |
| pgbouncer | idle | 1 |
| postgres | active | 1 |
| postgres |  | 1 |
| supabase_admin | idle | 2 |
| supabase_admin |  | 1 |
