# public.profiles

> SINGU: Perfis de usuários do sistema, vinculados ao Supabase Auth

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 7 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_company_summary, public.v_contact_personality_audit, public.v_contact_relatives_audit, public.v_deal_summary, public.v_life_events_audit, public.vw_churn_risk_ranking, public.vw_closing_score_ranking, public.vw_deal_velocity_benchmark, public.vw_disc_compatibility, public.vw_notification_dashboard, public.vw_pending_followups, public.vw_singu_usage_kpis |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não |  |  |  |
| 2 | `email` | `text` | não |  |  |  |
| 3 | `first_name` | `text` | sim |  |  |  |
| 4 | `last_name` | `text` | sim |  |  |  |
| 5 | `full_name` | `text` | sim | `TRIM(BOTH FROM ((COALESCE(first_name, ''::text) \|\| ' '::text) \|\| COALESCE(last_name, ''::text)))` | s |  |
| 6 | `avatar_url` | `text` | sim |  |  |  |
| 7 | `phone` | `text` | sim |  |  |  |
| 8 | `whatsapp` | `text` | sim |  |  |  |
| 9 | `job_title` | `text` | sim |  |  |  |
| 10 | `company_name` | `text` | sim |  |  |  |
| 11 | `settings` | `jsonb` | sim | `'{"theme": "light", "language": "pt-BR", "timezone": "America/Sao_Paulo", "dashboard": {"showTips": true, "defaultView": "contacts"}, "notifications": {"sms": false, "push": true, "email": true}}'::jsonb` |  |  |
| 12 | `ai_preferences` | `jsonb` | sim | `'{"autoAnalyze": true, "discEnabled": true, "emotionEnabled": true, "suggestionsEnabled": true}'::jsonb` |  |  |
| 13 | `plan` | `text` | sim | `'free'::text` |  |  |
| 14 | `plan_expires_at` | `timestamp with time zone` | sim |  |  |  |
| 15 | `monthly_interactions` | `integer` | sim | `0` |  |  |
| 16 | `monthly_analysis` | `integer` | sim | `0` |  |  |
| 17 | `onboarding_completed` | `boolean` | sim | `false` |  |  |
| 18 | `onboarding_step` | `integer` | sim | `0` |  |  |
| 19 | `is_active` | `boolean` | sim | `true` |  |  |
| 20 | `last_login_at` | `timestamp with time zone` | sim |  |  |  |
| 21 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 22 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 23 | `nlp_profile` | `jsonb` | sim | `'{"vakProfile": null, "discProfile": null, "metaprograms": {"chunkSize": null, "actionFilter": null, "workingStyle": null, "referenceFrame": null, "comparisonStyle": null, "motivationDirection": null}}'::jsonb` |  |  |
| 24 | `preferences` | `jsonb` | sim | `'{"theme": "light", "language": "pt-BR", "notifications": true}'::jsonb` |  |  |
| 25 | `role_title` | `text` | sim |  |  |  |
| 26 | `bitrix_user_id` | `integer` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| profiles_bitrix_user_id_fkey | FOREIGN KEY | `FOREIGN KEY (bitrix_user_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| profiles_email_key | UNIQUE | `UNIQUE (email)` |  |  | sim |
| profiles_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| profiles_plan_check | CHECK | `CHECK (plan = ANY (ARRAY['free'::text, 'pro'::text, 'business'::text, 'enterprise'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.alert_log | alert_log_user_id_fkey | user_id | NO ACTION |
| _dormant.api_usage_log | api_usage_log_user_id_fkey | user_id | SET NULL |
| _dormant.closing_moment_analysis | closing_moment_analysis_user_id_fkey | user_id | NO ACTION |
| _dormant.cognitive_biases | cognitive_biases_user_id_fkey | user_id | CASCADE |
| _dormant.communication_cadence | communication_cadence_user_id_fkey | user_id | CASCADE |
| _dormant.communication_preferences | communication_preferences_user_id_fkey | user_id | CASCADE |
| _dormant.contact_availability | contact_availability_user_id_fkey | user_id | CASCADE |
| _dormant.contact_communication_style | contact_communication_style_user_id_fkey | user_id | NO ACTION |
| _dormant.contact_compatibility | contact_compatibility_user_id_fkey | user_id | CASCADE |
| _dormant.contact_eq_scores | contact_eq_scores_user_id_fkey | user_id | NO ACTION |
| _dormant.contact_metaprograms | contact_metaprograms_user_id_fkey | user_id | CASCADE |
| _dormant.contact_relationships | contact_relationships_user_id_fkey | user_id | CASCADE |
| _dormant.contact_rfm_scores | contact_rfm_scores_user_id_fkey | user_id | CASCADE |
| _dormant.contact_trigger_preferences | contact_trigger_preferences_user_id_fkey | user_id | CASCADE |
| _dormant.contact_values | contact_values_user_id_fkey | user_id | CASCADE |
| _dormant.dashboard_widgets | dashboard_widgets_user_id_fkey | user_id | CASCADE |
| _dormant.decision_criteria | decision_criteria_user_id_fkey | user_id | CASCADE |
| _dormant.digest_history | digest_history_user_id_fkey | user_id | CASCADE |
| _dormant.disc_assessments | disc_assessments_user_id_fkey | user_id | CASCADE |
| _dormant.disc_assessments | disc_assessments_validated_by_fkey | validated_by | NO ACTION |
| _dormant.disc_interaction_signals | disc_interaction_signals_user_id_fkey | user_id | CASCADE |
| _dormant.emotional_anchors | emotional_anchors_user_id_fkey | user_id | CASCADE |
| _dormant.emotional_states | emotional_states_user_id_fkey | user_id | CASCADE |
| _dormant.emotional_trend_snapshots | emotional_trend_snapshots_user_id_fkey | user_id | NO ACTION |
| _dormant.health_alerts | health_alerts_resolved_by_fkey | resolved_by | NO ACTION |
| _dormant.health_alerts | health_alerts_user_id_fkey | user_id | CASCADE |
| _dormant.inactivity_alerts | inactivity_alerts_acknowledged_by_fkey | acknowledged_by | NO ACTION |
| _dormant.influence_network | influence_network_user_id_fkey | user_id | CASCADE |
| _dormant.insights | insights_user_id_fkey | user_id | CASCADE |
| _dormant.life_events | life_events_user_id_fkey | user_id | CASCADE |
| _dormant.metaprogram_templates | metaprogram_templates_created_by_fkey | created_by | NO ACTION |
| _dormant.notification_settings | notification_settings_user_id_fkey | user_id | CASCADE |
| _dormant.notifications | notifications_user_id_fkey | user_id | CASCADE |
| _dormant.objection_templates | objection_templates_user_id_fkey | user_id | CASCADE |
| _dormant.objections | objections_user_id_fkey | user_id | CASCADE |
| _dormant.offer_suggestions | offer_suggestions_user_id_fkey | user_id | CASCADE |
| _dormant.pre_contact_briefings | pre_contact_briefings_user_id_fkey | user_id | NO ACTION |
| _dormant.purchase_history | purchase_history_user_id_fkey | user_id | CASCADE |
| _dormant.rapport_score_history | rapport_score_history_user_id_fkey | user_id | NO ACTION |
| _dormant.rfm_calculations | rfm_calculations_user_id_fkey | user_id | CASCADE |
| _dormant.rfm_history | rfm_history_user_id_fkey | user_id | CASCADE |
| _dormant.satisfaction_scores | satisfaction_scores_user_id_fkey | user_id | NO ACTION |
| _dormant.script_usage_log | script_usage_log_user_id_fkey | user_id | NO ACTION |
| _dormant.shared_interests | shared_interests_user_id_fkey | user_id | NO ACTION |
| _dormant.smart_reminders | smart_reminders_user_id_fkey | user_id | CASCADE |
| _dormant.social_mentions | social_mentions_user_id_fkey | user_id | CASCADE |
| _dormant.template_performance | template_performance_user_id_fkey | user_id | NO ACTION |
| _dormant.time_analysis | time_analysis_user_id_fkey | user_id | CASCADE |
| _dormant.trigger_suggestions | trigger_suggestions_user_id_fkey | user_id | CASCADE |
| _dormant.trigger_templates | trigger_templates_created_by_fkey | created_by | NO ACTION |
| _dormant.trigger_usage_log | trigger_usage_log_user_id_fkey | user_id | CASCADE |
| _dormant.user_companies_link | user_companies_link_shared_by_fkey | shared_by | NO ACTION |
| _dormant.user_companies_link | user_companies_link_user_id_fkey | user_id | CASCADE |
| _dormant.user_contacts_link | user_contacts_link_shared_by_fkey | shared_by | NO ACTION |
| _dormant.user_contacts_link | user_contacts_link_user_id_fkey | user_id | CASCADE |
| _dormant.user_disc_profile | user_disc_profile_user_id_fkey | user_id | CASCADE |
| _dormant.user_favorite_templates | user_favorite_templates_user_id_fkey | user_id | NO ACTION |
| _dormant.vak_profiles | vak_profiles_user_id_fkey | user_id | CASCADE |
| _dormant.vak_templates | vak_templates_created_by_fkey | created_by | NO ACTION |
| _dormant.weekly_reports | weekly_reports_user_id_fkey | user_id | CASCADE |
| public.activities | activities_user_id_fkey | user_id | CASCADE |
| public.activity_feed | activity_feed_user_id_fkey | user_id | CASCADE |
| public.alerts | alerts_user_id_fkey | user_id | CASCADE |
| public.automations | automations_created_by_fkey | created_by | NO ACTION |
| public.cadence_enrollments | cadence_enrollments_user_id_fkey | user_id | SET NULL |
| public.campaigns | campaigns_created_by_fkey | created_by | NO ACTION |
| public.churn_predictions | churn_predictions_user_id_fkey | user_id | NO ACTION |
| public.commissions | commissions_user_id_fkey | user_id | CASCADE |
| public.company_cadences | company_cadences_user_id_fkey | user_id | NO ACTION |
| public.company_rfm_scores | company_rfm_scores_user_id_fkey | user_id | CASCADE |
| public.company_stakeholder_map | company_stakeholder_map_user_id_fkey | user_id | CASCADE |
| public.competitive_losses | competitive_losses_reported_by_fkey | reported_by | NO ACTION |
| public.customer_surveys | customer_surveys_sent_by_fkey | sent_by | NO ACTION |
| public.deal_velocity_analysis | deal_velocity_analysis_user_id_fkey | user_id | NO ACTION |
| public.deals | deals_user_id_fkey | user_id | SET NULL |
| public.disc_templates | disc_templates_created_by_fkey | created_by | NO ACTION |
| public.documents | documents_user_id_fkey | user_id | NO ACTION |
| public.duplicate_candidates | duplicate_candidates_reviewed_by_fkey | reviewed_by | NO ACTION |
| public.favorites | favorites_user_id_fkey | user_id | NO ACTION |
| public.import_jobs | import_jobs_created_by_fkey | created_by | NO ACTION |
| public.inactivity_alerts | inactivity_alerts_resolved_by_fkey | resolved_by | NO ACTION |
| public.integrations | integrations_created_by_fkey | created_by | NO ACTION |
| public.interaction_templates | interaction_templates_user_id_fkey | user_id | NO ACTION |
| public.meetings | meetings_user_id_fkey | user_id | SET NULL |
| public.notifications | notifications_user_id_fkey | user_id | CASCADE |
| public.nps_surveys | nps_surveys_created_by_fkey | created_by | NO ACTION |
| public.proposals | proposals_user_id_fkey | user_id | SET NULL |
| public.quick_notes | quick_notes_user_id_fkey | user_id | NO ACTION |
| public.relationship_score_history | relationship_score_history_user_id_fkey | user_id | CASCADE |
| public.reminders | reminders_user_id_fkey | user_id | NO ACTION |
| public.sales_cadences | sales_cadences_created_by_fkey | created_by | NO ACTION |
| public.sales_forecasts | sales_forecasts_user_id_fkey | user_id | NO ACTION |
| public.sales_goals | sales_goals_user_id_fkey | user_id | NO ACTION |
| public.sales_opportunities | sales_opportunities_assigned_to_fkey | assigned_to | NO ACTION |
| public.sales_opportunities | sales_opportunities_identified_by_fkey | identified_by | NO ACTION |
| public.scheduled_reports | scheduled_reports_created_by_fkey | created_by | NO ACTION |
| public.scheduled_visits | scheduled_visits_user_id_fkey | user_id | NO ACTION |
| public.seller_daily_metrics | seller_daily_metrics_user_id_fkey | user_id | NO ACTION |
| public.sla_violations | sla_violations_user_id_fkey | user_id | NO ACTION |
| public.smart_segments | smart_segments_created_by_fkey | created_by | NO ACTION |
| public.tasks | tasks_user_id_fkey | user_id | CASCADE |
| public.territories | territories_manager_id_fkey | manager_id | NO ACTION |
| public.territory_assignments | territory_assignments_user_id_fkey | user_id | CASCADE |
| public.user_badges | user_badges_user_id_fkey | user_id | CASCADE |
| public.user_goals | user_goals_user_id_fkey | user_id | CASCADE |
| public.webhooks | webhooks_created_by_fkey | created_by | NO ACTION |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_profiles_bitrix_user_id | btree | bitrix_user_id | não | sim |  | `CREATE INDEX idx_profiles_bitrix_user_id ON public.profiles USING btree (bitrix_user_id)` |
| profiles_email_key | btree | email | sim | sim |  | `CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email)` |
| profiles_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id)` |


## Policies (RLS)

### `Users can insert their own profile`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | public |
| USING |  |
| WITH CHECK | `(auth.uid() = id)` |

### `Users can update their own profile`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = id)` |
| WITH CHECK |  |

### `Users can view their own profile`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(auth.uid() = id)` |
| WITH CHECK |  |

### `service_role_full_profiles`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `singu_profiles_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = id)` |

### `singu_profiles_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = id)` |
| WITH CHECK |  |

### `singu_profiles_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| on_profile_created_singu | AFTER | INSERT | ROW | enabled | public.handle_new_singu_profile |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_profiles | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| tr_profiles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_profiles_updated_at |
| update_profiles_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
