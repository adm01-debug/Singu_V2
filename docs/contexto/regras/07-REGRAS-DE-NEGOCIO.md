# 07 · REGRAS DE NEGÓCIO

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `082f91a7d7` · branch `main` · 2026-11-25 11:16 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## A. Regras escritas por humanos (`manual/` — prioridade máxima, nunca sobrescrito)

_Nenhum arquivo em `manual/`. Copie `manual/TEMPLATE-regras-de-negocio.md` para `manual/regras.md` e preencha._

## B. Quem pode ver/alterar o quê (RLS — conforme migrations do repo; schema real em `06`)

| Tabela | Política | Comando | Roles | Modo | USING | WITH CHECK |
|---|---|---|---|---|---|---|
| `_migration_cdc_checkpoint` | cdc checkpoint service only | ALL | service_role | permissive | `true` | `true` |
| `ai_recommendation_audit_logs_v2` | Users can manage their own recommendation logs v2 | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `audit_log_2026_07` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `audit_log_2026_08` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `audit_log_2026_09` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `audit_log_2026_10` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `audit_log_2026_11` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `audit_log_2026_12` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `audit_log_default` | deny_authenticated_direct_access | ALL | anon, authenticated | restrictive | `false` | `false` |
| `contact_behavior` | Owner or admin can delete contact_behavior | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_behavior` | Owner or admin can insert contact_behavior | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_behavior` | Owner or admin can select contact_behavior | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_behavior` | Owner or admin can update contact_behavior | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_business_context` | Owner or admin can delete contact_business_context | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_business_context` | Owner or admin can insert contact_business_context | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_business_context` | Owner or admin can select contact_business_context | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_business_context` | Owner or admin can update contact_business_context | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_decision_making` | Owner or admin can delete contact_decision_making | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_decision_making` | Owner or admin can insert contact_decision_making | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_decision_making` | Owner or admin can select contact_decision_making | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_decision_making` | Owner or admin can update contact_decision_making | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_influence` | Owner or admin can delete contact_influence | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_influence` | Owner or admin can insert contact_influence | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_influence` | Owner or admin can select contact_influence | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_influence` | Owner or admin can update contact_influence | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_metaprograms` | Owner or admin can delete contact_metaprograms | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_metaprograms` | Owner or admin can insert contact_metaprograms | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_metaprograms` | Owner or admin can select contact_metaprograms | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_metaprograms` | Owner or admin can update contact_metaprograms | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_personality` | Owner or admin can delete contact_personality | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_personality` | Owner or admin can insert contact_personality | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_personality` | Owner or admin can select contact_personality | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_role(auth.uid(), 'admin'::app_role))` |  |
| `contact_personality` | Owner or admin can update contact_personality | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_rapport_strategy` | Owner or admin can delete contact_rapport_strategy | DELETE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_rapport_strategy` | Owner or admin can insert contact_rapport_strategy | INSERT | authenticated | permissive |  | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `contact_rapport_strategy` | Owner or admin can select contact_rapport_strategy | SELECT | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |  |
| `contact_rapport_strategy` | Owner or admin can update contact_rapport_strategy | UPDATE | authenticated | permissive | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` | `((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))))) OR has_role((select auth.uid()), 'admin'::app_role))` |
| `follow_up_approvals_v2` | Users can manage their own follow-up approvals v2 | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_consent_audit` | Users can insert consent logs | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `social_consent_audit` | Users can view their own consent logs | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `whatsapp_messages` | Users can manage their own whatsapp messages | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `migration_password_reset_log` | mprl_admin_read | SELECT | authenticated | permissive | `public.has_role(auth.uid(), 'admin')` |  |
| `profiles` | Users can view their own profile | SELECT | public | permissive | `((select auth.uid()) = id)` |  |
| `profiles` | Users can update their own profile | UPDATE | public | permissive | `((select auth.uid()) = id)` |  |
| `profiles` | Users can insert their own profile | INSERT | public | permissive |  | `((select auth.uid()) = id)` |
| `companies` | Users can view their own companies | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `companies` | Users can insert their own companies | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `companies` | Users can update their own companies | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `companies` | Users can delete their own companies | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `contacts` | Users can view their own contacts | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contacts` | Users can insert their own contacts | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `contacts` | Users can update their own contacts | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contacts` | Users can delete their own contacts | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `interactions` | Users can view their own interactions | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `interactions` | Users can insert their own interactions | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `interactions` | Users can update their own interactions | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `interactions` | Users can delete their own interactions | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `insights` | Users can view their own insights | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `insights` | Users can insert their own insights | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `insights` | Users can update their own insights | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `insights` | Users can delete their own insights | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `alerts` | Users can view their own alerts | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `alerts` | Users can insert their own alerts | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `alerts` | Users can update their own alerts | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `alerts` | Users can delete their own alerts | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `activities` | Users can view their own activities | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `activities` | Users can insert their own activities | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `emotional_anchors` | Users can view their own emotional anchors | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `emotional_anchors` | Users can create their own emotional anchors | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `emotional_anchors` | Users can update their own emotional anchors | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `emotional_anchors` | Users can delete their own emotional anchors | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `decision_criteria` | Users can view their own decision criteria | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `decision_criteria` | Users can create their own decision criteria | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `decision_criteria` | Users can update their own decision criteria | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `decision_criteria` | Users can delete their own decision criteria | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `health_alerts` | Users can view their own health alerts | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `health_alerts` | Users can create their own health alerts | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `health_alerts` | Users can update their own health alerts | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `health_alerts` | Users can delete their own health alerts | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_reports` | Users can view their own reports | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_reports` | Users can create their own reports | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `purchase_history` | Users can view their own purchase history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `purchase_history` | Users can insert their own purchase history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `purchase_history` | Users can update their own purchase history | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `purchase_history` | Users can delete their own purchase history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `communication_preferences` | Users can view their own communication preferences | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `communication_preferences` | Users can insert their own communication preferences | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `communication_preferences` | Users can update their own communication preferences | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `communication_preferences` | Users can delete their own communication preferences | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `life_events` | Users can view their own life events | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `life_events` | Users can insert their own life events | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `life_events` | Users can update their own life events | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `life_events` | Users can delete their own life events | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `offer_suggestions` | Users can view their own offer suggestions | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `offer_suggestions` | Users can insert their own offer suggestions | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `offer_suggestions` | Users can update their own offer suggestions | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `offer_suggestions` | Users can delete their own offer suggestions | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `rfm_history` | Users can view their own RFM history | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `rfm_segment_config` | Users can manage their RFM segment config | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_bundles` | Users can view their own bundles | SELECT | authenticated | permissive | `(((select auth.uid()) = user_id) OR (is_system_bundle = true))` |  |
| `trigger_bundles` | Users can create their own bundles | INSERT | authenticated | permissive |  | `(((select auth.uid()) = user_id) AND (COALESCE(is_system_bundle, false) = false))` |
| `trigger_bundles` | Users can update their own bundles | UPDATE | authenticated | permissive | `(((select auth.uid()) = user_id) AND (is_system_bundle = false))` |  |
| `trigger_bundles` | Users can delete their own bundles | DELETE | authenticated | permissive | `(((select auth.uid()) = user_id) AND (is_system_bundle = false))` |  |
| `activities` | Users can update their own activities | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `activities` | Users can delete their own activities | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_reports` | Users can update their own weekly_reports | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_reports` | Users can delete their own weekly_reports | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_profile_config` | Authenticated users can view DISC profile configs | SELECT | authenticated | permissive | `true` |  |
| `saved_filters` | Users can view own filters | SELECT | public | permissive | `auth.uid() = user_id` |  |
| `saved_filters` | Users can insert own filters | INSERT | public | permissive |  | `auth.uid() = user_id` |
| `saved_filters` | Users can update own filters | UPDATE | public | permissive | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `saved_filters` | Users can delete own filters | DELETE | public | permissive | `auth.uid() = user_id` |  |
| `entity_versions` | Users can view versions | SELECT | public | permissive | `true` |  |
| `salespeople` | Allow public read access to salespeople | SELECT | public | permissive | `true` |  |
| `salespeople` | Allow authenticated insert to salespeople | INSERT | public | permissive |  | `true` |
| `salespeople` | Allow authenticated update to salespeople | UPDATE | public | permissive | `true` |  |
| `sales` | Allow public read access to sales | SELECT | public | permissive | `true` |  |
| `sales` | Allow authenticated insert to sales | INSERT | public | permissive |  | `true` |
| `sales` | Allow authenticated update to sales | UPDATE | public | permissive | `true` |  |
| `sales` | Allow authenticated delete on sales | DELETE | public | permissive | `true` |  |
| `daily_metrics` | Allow public read access to daily_metrics | SELECT | public | permissive | `true` |  |
| `category_metrics` | Allow public read access to category_metrics | SELECT | public | permissive | `true` |  |
| `clients` | clients_all | ALL | public | permissive | `true` |  |
| `products` | products_select | SELECT | public | permissive | `true` |  |
| `teams` | teams_select | SELECT | public | permissive | `true` |  |
| `teams` | teams_all | ALL | public | permissive | `true` |  |
| `team_closers` | team_closers_select | SELECT | public | permissive | `true` |  |
| `team_closers` | team_closers_all | ALL | public | permissive | `true` |  |
| `deal_outcomes` | deal_outcomes_all | ALL | public | permissive | `true` |  |
| `deal_stage_history` | deal_stage_history_all | ALL | public | permissive | `true` |  |
| `deal_chat_history` | deal_chat_all | ALL | public | permissive | `true` |  |
| `sales_activities` | sales_activities_all | ALL | public | permissive | `true` |  |
| `sales_tasks` | sales_tasks_all | ALL | public | permissive | `true` |  |
| `playbooks` | playbooks_all | ALL | public | permissive | `true` |  |
| `cadences` | cadences_all | ALL | public | permissive | `true` |  |
| `activity_goals` | activity_goals_all | ALL | public | permissive | `true` |  |
| `achievements` | achievements_all | ALL | public | permissive | `true` |  |
| `salesperson_xp` | xp_all | ALL | public | permissive | `true` |  |
| `xp_history` | xp_history_all | ALL | public | permissive | `true` |  |
| `weekly_challenges` | challenges_all | ALL | public | permissive | `true` |  |
| `daily_challenges` | daily_challenges_all | ALL | public | permissive | `true` |  |
| `collectible_badges` | badges_all | ALL | public | permissive | `true` |  |
| `victory_feed` | victory_all | ALL | public | permissive | `true` |  |
| `trigger_usage_history` | Users can view their own trigger usage history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_usage_history` | Users can insert their own trigger usage history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `trigger_usage_history` | Users can update their own trigger usage history | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_usage_history` | Users can delete their own trigger usage history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `favorite_templates` | Users can view their own favorites | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `favorite_templates` | Users can insert their own favorites | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `favorite_templates` | Users can delete their own favorites | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `vak_analysis_history` | Users can view their own VAK analysis | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `vak_analysis_history` | Users can insert their own VAK analysis | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `vak_analysis_history` | Users can delete their own VAK analysis | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `vak_analysis_history` | Users can update their own vak_analysis_history | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `metaprogram_analysis` | Users can view their own metaprogram analysis | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `metaprogram_analysis` | Users can create their own metaprogram analysis | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `metaprogram_analysis` | Users can delete their own metaprogram analysis | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `metaprogram_analysis` | Users can update their own metaprogram_analysis | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `compatibility_alerts` | Users can view their own compatibility alerts | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `compatibility_alerts` | Users can create their own compatibility alerts | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `compatibility_alerts` | Users can update their own compatibility alerts | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `compatibility_alerts` | Users can delete their own compatibility alerts | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `compatibility_settings` | Users can view their own compatibility settings | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `compatibility_settings` | Users can create their own compatibility settings | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `compatibility_settings` | Users can update their own compatibility settings | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `compatibility_settings` | Users can delete their own compatibility_settings | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `emotional_states_history` | Users can view their own emotional states history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `emotional_states_history` | Users can create their own emotional states history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `emotional_states_history` | Users can delete their own emotional states history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `emotional_states_history` | Users can update their own emotional_states_history | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `client_values` | Users can view their own client values | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `client_values` | Users can create their own client values | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `client_values` | Users can update their own client values | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `client_values` | Users can delete their own client values | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `hidden_objections` | Users can view their own hidden objections | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `hidden_objections` | Users can create their own hidden objections | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `hidden_objections` | Users can update their own hidden objections | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `hidden_objections` | Users can delete their own hidden objections | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `eq_analysis_history` | Users can view their own EQ analysis history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `eq_analysis_history` | Users can create their own EQ analysis history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `eq_analysis_history` | Users can delete their own EQ analysis history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `eq_analysis_history` | Users can update their own eq_analysis_history | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `cognitive_bias_history` | Users can view their own cognitive bias history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `cognitive_bias_history` | Users can create their own cognitive bias history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `cognitive_bias_history` | Users can delete their own cognitive bias history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `cognitive_bias_history` | Users can update their own cognitive_bias_history | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `stakeholder_alerts` | Users can view their own stakeholder alerts | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `stakeholder_alerts` | Users can create their own stakeholder alerts | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `stakeholder_alerts` | Users can update their own stakeholder alerts | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `stakeholder_alerts` | Users can delete their own stakeholder alerts | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `health_alert_settings` | Users can view their own health settings | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `health_alert_settings` | Users can create their own health settings | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `health_alert_settings` | Users can update their own health settings | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `health_alert_settings` | Users can delete their own health_alert_settings | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_report_settings` | Users can view their own report settings | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_report_settings` | Users can create their own report settings | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `weekly_report_settings` | Users can update their own report settings | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `weekly_report_settings` | Users can delete their own weekly_report_settings | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_time_analysis` | Users can view their own contact time analysis | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_time_analysis` | Users can insert their own contact time analysis | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `contact_time_analysis` | Users can update their own contact time analysis | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_time_analysis` | Users can delete their own contact time analysis | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_cadence` | Users can view their own contact cadence | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_cadence` | Users can create their own contact cadence | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `contact_cadence` | Users can update their own contact cadence | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_cadence` | Users can delete their own contact cadence | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_preferences` | Users can view their own contact preferences | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_preferences` | Users can create their own contact preferences | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `contact_preferences` | Users can update their own contact preferences | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_preferences` | Users can delete their own contact preferences | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `score_history` | Users can view their own score history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `score_history` | Users can insert their own score history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `score_history` | Users can delete their own score history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `score_history` | Users can update their own score_history | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `social_profiles` | Users can view their own social profiles | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_profiles` | Users can insert their own social profiles | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `social_profiles` | Users can update their own social profiles | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_profiles` | Users can delete their own social profiles | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_life_events` | Users can view their own social life events | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_life_events` | Users can insert their own social life events | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `social_life_events` | Users can update their own social life events | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_life_events` | Users can delete their own social life events | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_behavior_analysis` | Users can view their own social behavior analysis | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_behavior_analysis` | Users can insert their own social behavior analysis | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `social_behavior_analysis` | Users can update their own social behavior analysis | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_behavior_analysis` | Users can delete their own social behavior analysis | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_scraping_schedule` | Users can view their own scraping schedule | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_scraping_schedule` | Users can insert their own scraping schedule | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `social_scraping_schedule` | Users can update their own scraping schedule | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `social_scraping_schedule` | Users can delete their own scraping schedule | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `rfm_analysis` | Users can manage their own RFM analysis | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `rfm_metrics` | Users can view their RFM metrics | ALL | public | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_analysis_history` | Users can view their own DISC analysis history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_analysis_history` | Users can create their own DISC analysis | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `disc_analysis_history` | Users can delete their own DISC analysis | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_analysis_history` | Users can update their own disc_analysis_history | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_communication_logs` | Users can view their own DISC communication logs | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_communication_logs` | Users can create their own DISC communication logs | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `disc_communication_logs` | Users can update their own DISC communication logs | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `disc_communication_logs` | Users can delete their own disc_communication_logs | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_ab_tests` | Users can view their own AB tests | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_ab_tests` | Users can create their own AB tests | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `trigger_ab_tests` | Users can update their own AB tests | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_ab_tests` | Users can delete their own AB tests | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_intensity_history` | Users can view their own intensity history | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_intensity_history` | Users can create their own intensity history | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `trigger_intensity_history` | Users can update their own intensity history | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_intensity_history` | Users can delete their own intensity history | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_channel_effectiveness` | Users can view their own channel effectiveness | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_channel_effectiveness` | Users can create their own channel effectiveness | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `trigger_channel_effectiveness` | Users can update their own channel effectiveness | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `trigger_channel_effectiveness` | Users can delete their own channel effectiveness | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_relatives` | Users can view their own contact_relatives | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_relatives` | Users can insert their own contact_relatives | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `contact_relatives` | Users can update their own contact_relatives | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `contact_relatives` | Users can delete their own contact_relatives | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `whatsapp_messages` | Users can manage their own whatsapp_messages | ALL | public | permissive | `((select auth.uid()) = user_id)` | `((select auth.uid()) = user_id)` |
| `whatsapp_instances` | Users can manage their own whatsapp_instances | ALL | public | permissive | `((select auth.uid()) = user_id)` | `((select auth.uid()) = user_id)` |
| `whatsapp_kpis` | Users can manage their own whatsapp_kpis | ALL | public | permissive | `((select auth.uid()) = user_id)` | `((select auth.uid()) = user_id)` |
| `lux_intelligence` | Users can view their own lux intelligence | SELECT | public | permissive | `((select auth.uid()) = user_id)` |  |
| `lux_intelligence` | Users can insert their own lux intelligence | INSERT | public | permissive |  | `((select auth.uid()) = user_id)` |
| `lux_intelligence` | Users can update their own lux intelligence | UPDATE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `lux_intelligence` | Users can delete their own lux intelligence | DELETE | public | permissive | `((select auth.uid()) = user_id)` |  |
| `automation_rules` | Users can view their own automation rules | SELECT | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `automation_rules` | Users can create their own automation rules | INSERT | authenticated | permissive |  | `((select auth.uid()) = user_id)` |
| `automation_rules` | Users can update their own automation rules | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `automation_rules` | Users can delete their own automation rules | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `automation_logs` | Users can view their own automation logs | SELECT | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `automation_logs` | Users can create their own automation logs | INSERT | authenticated | permissive |  | `((select auth.uid()) = user_id)` |
| `automation_logs` | Users can delete their own automation logs | DELETE | authenticated | permissive | `((select auth.uid()) = user_id)` |  |
| `automation_logs` | Users can only update own automation logs | UPDATE | authenticated | permissive | `((select auth.uid()) = user_id)` | `((select auth.uid()) = user_id)` |
| `companies` | companies_select | SELECT | public | permissive | `true` |  |
| `companies` | companies_insert | INSERT | public | permissive |  | `true` |
| `companies` | companies_update | UPDATE | public | permissive | `true` |  |
| `companies` | companies_delete | DELETE | public | permissive | `true` |  |
| `contacts` | contacts_select | SELECT | public | permissive | `true` |  |
| `contacts` | contacts_insert | INSERT | public | permissive |  | `true` |
| `contacts` | contacts_update | UPDATE | public | permissive | `true` |  |
| `contacts` | contacts_delete | DELETE | public | permissive | `true` |  |
| `customers` | customers_select | SELECT | public | permissive | `true` |  |
| `customers` | customers_insert | INSERT | public | permissive |  | `true` |
| `customers` | customers_update | UPDATE | public | permissive | `true` |  |
| `customers` | customers_delete | DELETE | public | permissive | `true` |  |
| `company_phones` | company_phones_select | SELECT | public | permissive | `true` |  |
| `company_phones` | company_phones_insert | INSERT | public | permissive |  | `true` |
| `company_phones` | company_phones_update | UPDATE | public | permissive | `true` |  |
| `company_phones` | company_phones_delete | DELETE | public | permissive | `true` |  |
| `company_emails` | company_emails_select | SELECT | public | permissive | `true` |  |
| `company_emails` | company_emails_insert | INSERT | public | permissive |  | `true` |
| `company_emails` | company_emails_update | UPDATE | public | permissive | `true` |  |
| `company_emails` | company_emails_delete | DELETE | public | permissive | `true` |  |
| `company_addresses` | company_addresses_select | SELECT | public | permissive | `true` |  |
| `company_addresses` | company_addresses_insert | INSERT | public | permissive |  | `true` |
| `company_addresses` | company_addresses_update | UPDATE | public | permissive | `true` |  |
| `company_addresses` | company_addresses_delete | DELETE | public | permissive | `true` |  |
| `company_social_media` | company_social_media_select | SELECT | public | permissive | `true` |  |
| `company_social_media` | company_social_media_insert | INSERT | public | permissive |  | `true` |
| `company_social_media` | company_social_media_update | UPDATE | public | permissive | `true` |  |
| `company_social_media` | company_social_media_delete | DELETE | public | permissive | `true` |  |
| `contact_phones` | contact_phones_select | SELECT | public | permissive | `true` |  |
| … +954 linhas — lista completa em `context.json` | | | | | | |

## C. Restrições de dados (obrigatório / único / default / CHECK / FK / calculada)

| Tabela | Coluna | Regra |
|---|---|---|
| `_migration_cdc_checkpoint` | `lsn` | PK |
| `_migration_cdc_checkpoint` | `applied_at` | default now() |
| `abm_account_plans` | `id` | PK; default gen_random_uuid() |
| `abm_account_plans` | `account_id` | obrigatório; FK → abm_accounts.id ON DELETE CASCADE |
| `abm_account_plans` | `user_id` | obrigatório |
| `abm_account_plans` | `template_type` | default 'strategic'; CHECK template_type IN ('strategic','growth','retention','penetration') |
| `abm_account_plans` | `objectives` | default '[]'::jsonb |
| `abm_account_plans` | `strategies` | default '[]'::jsonb |
| `abm_account_plans` | `key_stakeholders` | default '[]'::jsonb |
| `abm_account_plans` | `milestones` | default '[]'::jsonb |
| `abm_account_plans` | `status` | default 'draft'; CHECK status IN ('draft','active','completed','archived') |
| `abm_account_plans` | `created_at` | default now() |
| `abm_account_plans` | `updated_at` | default now() |
| `abm_accounts` | `id` | PK; default gen_random_uuid() |
| `abm_accounts` | `user_id` | obrigatório |
| `abm_accounts` | `external_company_id` | obrigatório |
| `abm_accounts` | `company_name` | obrigatório |
| `abm_accounts` | `parent_account_id` | FK → abm_accounts.id ON DELETE SET NULL |
| `abm_accounts` | `tier` | default 'mid'; CHECK tier IN ('strategic','enterprise','mid','smb') |
| `abm_accounts` | `account_score` | default 0; CHECK account_score >= 0 AND account_score <= 100 |
| `abm_accounts` | `score_breakdown` | default '{}'::jsonb |
| `abm_accounts` | `status` | default 'active'; CHECK status IN ('active','nurture','closed_won','closed_lost','paused') |
| `abm_accounts` | `created_at` | default now() |
| `abm_accounts` | `updated_at` | default now() |
| `abm_accounts` | `(tabela)` | UNIQUE(user_id, external_company_id) |
| `abm_buying_committee` | `id` | PK; default gen_random_uuid() |
| `abm_buying_committee` | `account_id` | obrigatório; FK → abm_accounts.id ON DELETE CASCADE |
| `abm_buying_committee` | `user_id` | obrigatório |
| `abm_buying_committee` | `contact_name` | obrigatório |
| `abm_buying_committee` | `committee_role` | obrigatório; CHECK committee_role IN ('decision_maker','influencer','champion','blocker','user','technical','economic') |
| `abm_buying_committee` | `influence_level` | default 5; CHECK influence_level BETWEEN 1 AND 10 |
| `abm_buying_committee` | `engagement_score` | default 0; CHECK engagement_score BETWEEN 0 AND 100 |
| `abm_buying_committee` | `created_at` | default now() |
| `abm_buying_committee` | `updated_at` | default now() |
| `abm_campaigns` | `id` | PK; default gen_random_uuid() |
| `abm_campaigns` | `user_id` | obrigatório |
| `abm_campaigns` | `name` | obrigatório |
| `abm_campaigns` | `campaign_type` | obrigatório; CHECK campaign_type IN ('one_to_one','one_to_few','one_to_many') |
| `abm_campaigns` | `target_account_ids` | default ARRAY[]::UUID[] |
| `abm_campaigns` | `channels` | default ARRAY[]::TEXT[] |
| `abm_campaigns` | `status` | default 'draft'; CHECK status IN ('draft','active','paused','completed','archived') |
| `abm_campaigns` | `metrics` | default '{}'::jsonb |
| `abm_campaigns` | `created_at` | default now() |
| `abm_campaigns` | `updated_at` | default now() |
| `abm_whitespace_opportunities` | `id` | PK; default gen_random_uuid() |
| `abm_whitespace_opportunities` | `account_id` | obrigatório; FK → abm_accounts.id ON DELETE CASCADE |
| `abm_whitespace_opportunities` | `user_id` | obrigatório |
| `abm_whitespace_opportunities` | `opportunity_type` | obrigatório; CHECK opportunity_type IN ('cross_sell','up_sell','expansion','renewal') |
| `abm_whitespace_opportunities` | `product_category` | obrigatório |
| `abm_whitespace_opportunities` | `confidence` | default 50; CHECK confidence BETWEEN 0 AND 100 |
| `abm_whitespace_opportunities` | `status` | default 'identified'; CHECK status IN ('identified','pursuing','won','lost','dismissed') |
| `abm_whitespace_opportunities` | `identified_at` | default now() |
| `abm_whitespace_opportunities` | `created_at` | default now() |
| `abm_whitespace_opportunities` | `updated_at` | default now() |
| `access_blocked_log` | `id` | PK; default gen_random_uuid() |
| `access_blocked_log` | `block_reason` | obrigatório; CHECK block_reason IN ('brute_force','ip_not_whitelisted','country_blocked','device_not_trusted','rate_limit','suspicious_pattern','admin_block','other') |
| `access_blocked_log` | `is_resolved` | default false |
| `access_blocked_log` | `metadata` | default '{}'::jsonb |
| `access_blocked_log` | `created_at` | default now() |
| `access_security_settings` | `id` | PK; default gen_random_uuid() |
| `access_security_settings` | `user_id` | obrigatório; único |
| `access_security_settings` | `require_mfa` | default false |
| `access_security_settings` | `mfa_method` | CHECK mfa_method IN ('totp','webauthn','sms','email') |
| `access_security_settings` | `ip_whitelist_enabled` | default false |
| `access_security_settings` | `geo_restriction_enabled` | default false |
| `access_security_settings` | `device_trust_enabled` | default true |
| `access_security_settings` | `session_timeout_minutes` | default 480 |
| `access_security_settings` | `max_concurrent_sessions` | default 3 |
| `access_security_settings` | `password_policy` | default '{"min_length":8 |
| `access_security_settings` | `brute_force_threshold` | default 5 |
| `access_security_settings` | `brute_force_window_minutes` | default 15 |
| `access_security_settings` | `brute_force_lockout_minutes` | default 30 |
| `access_security_settings` | `notify_on_new_device` | default true |
| `access_security_settings` | `notify_on_new_location` | default true |
| `access_security_settings` | `metadata` | default '{}'::jsonb |
| `access_security_settings` | `created_at` | default now() |
| `access_security_settings` | `updated_at` | default now() |
| `access_security_settings` | `enable_ip_restriction` | default false |
| `activities` | `id` | PK; default gen_random_uuid() |
| `activities` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `activities` | `type` | obrigatório; CHECK type IN ('company_created', 'contact_created', 'interaction_added', 'insight_generated', 'tag_added', 'profile_updated', 'alert_triggered') |
| `activities` | `entity_type` | obrigatório; CHECK entity_type IN ('company', 'contact', 'interaction', 'insight', 'alert') |
| `activities` | `created_at` | default NOW() |
| `activities` | `contact_id` | FK → contacts.id |
| `ai_chat_messages` | `id` | PK; default gen_random_uuid() |
| `ai_chat_messages` | `thread_id` | obrigatório |
| `ai_chat_messages` | `user_id` | obrigatório |
| `ai_chat_messages` | `role` | obrigatório; CHECK role IN ('user','assistant','system','function','tool') |
| `ai_chat_messages` | `content` | obrigatório |
| `ai_chat_messages` | `tool_calls` | default '[]'::jsonb |
| `ai_chat_messages` | `metadata` | default '{}'::jsonb |
| `ai_chat_messages` | `created_at` | default now() |
| `ai_chat_threads` | `id` | PK; default gen_random_uuid() |
| `ai_chat_threads` | `user_id` | obrigatório |
| `ai_chat_threads` | `context_type` | default 'crm_data'; CHECK context_type IN ('crm_data','contact','company','deal','general','custom') |
| `ai_chat_threads` | `total_messages` | default 0 |
| `ai_chat_threads` | `total_tokens` | default 0 |
| `ai_chat_threads` | `is_archived` | default false |
| `ai_chat_threads` | `metadata` | default '{}'::jsonb |
| `ai_chat_threads` | `created_at` | default now() |
| `ai_chat_threads` | `updated_at` | default now() |
| `ai_recommendation_audit_logs` | `id` | PK; default gen_random_uuid() |
| `ai_recommendation_audit_logs` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `ai_recommendation_audit_logs` | `contact_id` | obrigatório; FK → contacts.id ON DELETE CASCADE |
| `ai_recommendation_audit_logs` | `score` | obrigatório |
| `ai_recommendation_audit_logs` | `recommendation_type` | obrigatório |
| `ai_recommendation_audit_logs` | `reasons` | default '{}' |
| `ai_recommendation_audit_logs` | `data_used` | default '{}'::jsonb |
| `ai_recommendation_audit_logs` | `created_at` | default now() |
| `ai_recommendation_audit_logs_v2` | `id` | PK; default gen_random_uuid() |
| `ai_recommendation_audit_logs_v2` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `ai_recommendation_audit_logs_v2` | `contact_id` | FK → contacts.id ON DELETE SET NULL |
| `ai_recommendation_audit_logs_v2` | `recommendation_type` | obrigatório |
| `ai_recommendation_audit_logs_v2` | `created_at` | default now() |
| `ai_recommendation_logs` | `id` | PK; default gen_random_uuid() |
| `ai_recommendation_logs` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `ai_recommendation_logs` | `contact_id` | obrigatório |
| `ai_recommendation_logs` | `recommendation_score` | obrigatório |
| `ai_recommendation_logs` | `recommendation_reasons` | obrigatório |
| `ai_recommendation_logs` | `input_data_snapshot` | obrigatório |
| `ai_recommendation_logs` | `created_at` | default now() |
| `ai_tone_preferences` | `id` | PK; default gen_random_uuid() |
| `ai_tone_preferences` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `ai_tone_preferences` | `company_id` | FK → companies.id ON DELETE CASCADE |
| `ai_tone_preferences` | `preferred_tone` | obrigatório |
| `ai_tone_preferences` | `created_at` | default now() |
| `ai_tone_preferences` | `updated_at` | default now() |
| `ai_tone_preferences` | `(tabela)` | UNIQUE(user_id, company_id) |
| `alerts` | `id` | PK; default gen_random_uuid() |
| `alerts` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `alerts` | `contact_id` | FK → contacts.id ON DELETE CASCADE |
| `alerts` | `type` | obrigatório; CHECK type IN ('birthday', 'no_contact', 'sentiment_drop', 'opportunity', 'follow_up', 'life_event') |
| `alerts` | `priority` | default 'medium'; CHECK priority IN ('low', 'medium', 'high') |
| `alerts` | `title` | obrigatório |
| `alerts` | `dismissed` | default FALSE |
| `alerts` | `created_at` | default NOW() |
| `alerts` | `(tabela)` | constraint alerts_type_check CHECK ( type = ANY (ARRAY[ 'relationship_risk'::text, 'follow_up_due'::text, 'birthday_reminder'::text, 'inactivity_warning'::text, 'sentiment_drop'::text, 'opportunity'::text, 'disc_insight'::text, 'life_event'::text, 'engagement_spike'::text, 'churn_risk'::text, 'upsel … |
| `applied_objection_responses` | `id` | PK; default gen_random_uuid() |
| `applied_objection_responses` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `applied_objection_responses` | `objection` | obrigatório |
| `applied_objection_responses` | `applied_at` | default now() |
| `applied_objection_responses` | `created_at` | default now() |
| `applied_objection_responses` | `updated_at` | default now() |
| `attribution_models_cache` | `id` | PK; default gen_random_uuid() |
| `attribution_models_cache` | `user_id` | obrigatório |
| `attribution_models_cache` | `deal_id` | obrigatório |
| `attribution_models_cache` | `model` | obrigatório; CHECK model IN ('first','last','linear','u_shape','w_shape','time_decay') |
| `attribution_models_cache` | `allocations` | default '[]'::jsonb |
| `attribution_models_cache` | `total_value` | default 0 |
| `attribution_models_cache` | `computed_at` | default now() |
| `attribution_models_cache` | `(tabela)` | UNIQUE(user_id, deal_id, model) |
| `attribution_touchpoints` | `id` | PK; default gen_random_uuid() |
| `attribution_touchpoints` | `user_id` | obrigatório |
| `attribution_touchpoints` | `touchpoint_type` | obrigatório; CHECK touchpoint_type IN ('form','email','page_view','magnet','sequence','call','meeting','ad','social','referral','other') |
| `attribution_touchpoints` | `metadata` | default '{}'::jsonb |
| `attribution_touchpoints` | `occurred_at` | default now() |
| `attribution_touchpoints` | `value_attributed` | default 0 |
| `attribution_touchpoints` | `created_at` | default now() |
| `automation_logs` | `id` | PK; default gen_random_uuid() |
| `automation_logs` | `user_id` | obrigatório |
| `automation_logs` | `rule_id` | obrigatório; FK → automation_rules.id ON DELETE CASCADE |
| `automation_logs` | `trigger_entity_type` | obrigatório |
| `automation_logs` | `trigger_entity_id` | obrigatório |
| `automation_logs` | `actions_executed` | default '[]'::jsonb |
| `automation_logs` | `success` | default true |
| `automation_logs` | `executed_at` | default now() |
| `automation_rules` | `id` | PK; default gen_random_uuid() |
| `automation_rules` | `user_id` | obrigatório |
| `automation_rules` | `name` | obrigatório |
| `automation_rules` | `is_active` | default true |
| `automation_rules` | `trigger_type` | obrigatório |
| `automation_rules` | `trigger_config` | default '{}'::jsonb |
| `automation_rules` | `conditions` | default '[]'::jsonb |
| `automation_rules` | `actions` | default '[]'::jsonb |
| `automation_rules` | `execution_count` | default 0 |
| `automation_rules` | `created_at` | default now() |
| `automation_rules` | `updated_at` | default now() |
| `battle_cards` | `id` | PK; default gen_random_uuid() |
| `battle_cards` | `user_id` | obrigatório |
| `battle_cards` | `competitor_name` | obrigatório |
| `battle_cards` | `our_strengths` | default '[]'::jsonb |
| `battle_cards` | `their_strengths` | default '[]'::jsonb |
| `battle_cards` | `weaknesses` | default '[]'::jsonb |
| `battle_cards` | `win_themes` | default ARRAY[]::TEXT[] |
| `battle_cards` | `landmines` | default ARRAY[]::TEXT[] |
| `battle_cards` | `proof_points` | default '[]'::jsonb |
| `battle_cards` | `version` | default 1 |
| `battle_cards` | `active` | default true |
| `battle_cards` | `created_at` | default now() |
| `battle_cards` | `updated_at` | default now() |
| `behavioral_insight_feedback` | `id` | PK; default gen_random_uuid() |
| `behavioral_insight_feedback` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `behavioral_insight_feedback` | `contact_id` | obrigatório |
| `behavioral_insight_feedback` | `insight_kind` | obrigatório; CHECK insight_kind IN ('preference','hobby','tone') |
| `behavioral_insight_feedback` | `insight_label` | obrigatório; CHECK char_length(insight_label) BETWEEN 1 AND 200 |
| `behavioral_insight_feedback` | `vote` | obrigatório; CHECK vote IN (-1, 1) |
| `behavioral_insight_feedback` | `note` | CHECK note IS NULL OR char_length(note) <= 1000 |
| `behavioral_insight_feedback` | `created_at` | default now() |
| `behavioral_insight_feedback` | `updated_at` | default now() |
| `behavioral_insight_feedback` | `(tabela)` | CONSTRAINT behavioral_insight_feedback_unique UNIQUE (user_id, contact_id, insight_kind, insight_label) |
| `behavioral_profile_regen_queue` | `contact_id` | PK; FK → contacts.id ON DELETE CASCADE |
| `behavioral_profile_regen_queue` | `user_id` | obrigatório |
| `behavioral_profile_regen_queue` | `enqueued_at` | default now() |
| `behavioral_profile_regen_queue` | `next_run_at` | default (now() |
| `behavioral_profile_regen_queue` | `attempts` | default 0 |
| `behavioral_profile_regen_queue` | `created_at` | default now() |
| `behavioral_profile_regen_queue` | `updated_at` | default now() |
| `behavioral_profile_regen_queue` | `claim_token` | default gen_random_uuid() |
| `brain_dominance_analysis` | `id` | PK; default gen_random_uuid() |
| `brain_dominance_analysis` | `contact_id` | FK → contacts.id ON DELETE CASCADE |
| `brain_dominance_analysis` | `reptilian_score` | default 0 |
| `brain_dominance_analysis` | `limbic_score` | default 0 |
| `brain_dominance_analysis` | `neocortex_score` | default 0 |
| `brain_dominance_analysis` | `recommendations` | default '[]' |
| `brain_dominance_analysis` | `negotiation_tips` | default '[]' |
| `brain_dominance_analysis` | `analyzed_at` | default now() |
| `brain_dominance_analysis` | `created_at` | default now() |
| `brain_dominance_analysis` | `updated_at` | default now() |
| `call_logs` | `id` | PK; default gen_random_uuid() |
| `call_logs` | `user_id` | obrigatório; FK → users.id ON DELETE CASCADE |
| `call_logs` | `contact_id` | FK → contacts.id ON DELETE SET NULL |
| `call_logs` | `company_id` | FK → companies.id ON DELETE SET NULL |
| `call_logs` | `direction` | CHECK direction IN ('inbound', 'outbound') |
| `call_logs` | `status` | CHECK status IN ('completed', 'missed', 'busy', 'failed', 'no-answer') |
| `call_logs` | `duration_seconds` | default 0 |
| `call_logs` | `external_id` | único |
| `call_logs` | `created_at` | default now() |
| `campaign_recipients` | `id` | PK; default gen_random_uuid() |
| `campaign_recipients` | `campaign_id` | obrigatório |
| `campaign_recipients` | `user_id` | obrigatório |
| `campaign_recipients` | `email` | obrigatório |
| `campaign_recipients` | `status` | default 'pending'; CHECK status IN ('pending','sent','delivered','opened','clicked','bounced','complained','unsubscribed','failed') |
| `campaign_recipients` | `opens_count` | default 0 |
| `campaign_recipients` | `clicks_count` | default 0 |
| `campaign_recipients` | `metadata` | default '{}'::jsonb |
| `campaign_recipients` | `created_at` | default now() |
| `campaign_recipients` | `(tabela)` | constraint uq_campaign_recipients_campaign_email UNIQUE (campaign_id, email) |
| `canned_responses` | `id` | PK; default gen_random_uuid() |
| `canned_responses` | `user_id` | obrigatório |
| `canned_responses` | `shortcut` | obrigatório |
| `canned_responses` | `title` | obrigatório |
| `canned_responses` | `content` | obrigatório |
| `canned_responses` | `tags` | default '{}'::text[] |
| `canned_responses` | `usage_count` | default 0 |
| `canned_responses` | `is_shared` | default false |
| `canned_responses` | `metadata` | default '{}'::jsonb |
| `canned_responses` | `created_at` | default now() |
| `canned_responses` | `updated_at` | default now() |
| `canned_responses` | `(tabela)` | CONSTRAINT unique_shortcut_per_user UNIQUE (user_id, shortcut) |
| `churn_risk_scores` | `id` | PK; default gen_random_uuid() |
| `churn_risk_scores` | `user_id` | obrigatório |
| `churn_risk_scores` | `risk_score` | obrigatório; CHECK risk_score BETWEEN 0 AND 100 |
| `churn_risk_scores` | `risk_level` | obrigatório; CHECK risk_level IN ('low','medium','high','critical') |
| `churn_risk_scores` | `factors_detected` | default '[]'::jsonb |
| `churn_risk_scores` | `factors_breakdown` | default '{}'::jsonb |
| `churn_risk_scores` | `recommended_actions` | default '[]'::jsonb |
| `churn_risk_scores` | `confidence` | default 70; CHECK confidence BETWEEN 0 AND 100 |
| `churn_risk_scores` | `calculated_at` | default now() |
| `churn_risk_scores` | `is_current` | default true |
| `churn_risk_scores` | `created_at` | default now() |
| `churn_risk_scores` | `risk_factors` | default '[]'::jsonb |
| `churn_risk_scores` | `(tabela)` | CONSTRAINT churn_risk_either_contact_or_company CHECK (contact_id IS NOT NULL OR company_id IS NOT NULL) |
| `city_whitelist` | `id` | PK; default gen_random_uuid() |
| `city_whitelist` | `user_id` | obrigatório |
| `city_whitelist` | `country_code` | obrigatório |
| `city_whitelist` | `city_name` | obrigatório |
| `city_whitelist` | `is_active` | default true |
| `city_whitelist` | `created_at` | default now() |
| `client_values` | `id` | PK; default gen_random_uuid() |
| `client_values` | `user_id` | obrigatório |
| `client_values` | `contact_id` | obrigatório; FK → contacts.id ON DELETE CASCADE |
| `client_values` | `category` | obrigatório |
| `client_values` | `value_name` | obrigatório |
| `client_values` | `importance` | default 5; CHECK importance >= 1 AND importance <= 10 |
| `client_values` | `frequency` | default 1 |
| `client_values` | `last_mentioned` | default now() |
| `client_values` | `created_at` | default now() |
| `client_values` | `updated_at` | default now() |
| `client_values` | `(tabela)` | UNIQUE(user_id, contact_id, category, value_name) |
| `coaching_scorecards` | `id` | PK; default gen_random_uuid() |
| `coaching_scorecards` | `user_id` | obrigatório |
| `coaching_scorecards` | `name` | obrigatório |
| `coaching_scorecards` | `criteria` | default '[]'::jsonb |
| `coaching_scorecards` | `active` | default true |
| `coaching_scorecards` | `is_default` | default false |
| `coaching_scorecards` | `created_at` | default now() |
| `coaching_scorecards` | `updated_at` | default now() |
| `cognitive_bias_history` | `id` | PK; default gen_random_uuid() |
| `cognitive_bias_history` | `user_id` | obrigatório |
| `cognitive_bias_history` | `contact_id` | obrigatório; FK → contacts.id ON DELETE CASCADE |
| `cognitive_bias_history` | `interaction_id` | FK → interactions.id ON DELETE SET NULL |
| `cognitive_bias_history` | `detected_biases` | obrigatório |
| `cognitive_bias_history` | `analyzed_at` | default now() |
| `cognitive_bias_history` | `created_at` | default now() |
| `communication_preferences` | `id` | PK; default gen_random_uuid() |
| `communication_preferences` | `user_id` | obrigatório |
| `communication_preferences` | `contact_id` | obrigatório; FK → contacts.id ON DELETE CASCADE |
| `communication_preferences` | `preferred_channel` | default 'whatsapp' |
| `communication_preferences` | `preferred_days` | default '{}' |
| `communication_preferences` | `contact_frequency` | default 'weekly' |
| … +4184 linhas — lista completa em `context.json` | | |

## D. Automações no banco (triggers e funções — regras que rodam sozinhas)

| Trigger | Quando | Tabela | Executa | Condição |
|---|---|---|---|---|
| trg_mprl_touch | BEFORE UPDATE | `migration_password_reset_log` | `tg_mprl_touch_updated_at` |  |
| on_auth_user_created | AFTER INSERT | `auth.users` | `handle_new_user` |  |
| trg_contact_phones_normalizar | BEFORE INSERT OR UPDATE | `contact_phones` | `trg_normalizar_telefone_contact` |  |
| trg_uapi_sessions_updated_at | BEFORE UPDATE | `uapi_sessions` | `update_uapi_sessions_updated_at` |  |
| set_updated_at_companies | BEFORE UPDATE | `companies` | `update_updated_at_column` |  |
| set_updated_at_contacts | BEFORE UPDATE | `contacts` | `update_updated_at_column` |  |
| set_updated_at_profiles | BEFORE UPDATE | `profiles` | `update_updated_at_column` |  |
| pix_accounts_set_updated_at | BEFORE UPDATE | `pix_accounts` | `trg_pix_accounts_updated_at` |  |
| update_sales_updated_at | BEFORE UPDATE | `sales` | `update_updated_at_column` |  |
| set_updated_at_whatsapp_messages | BEFORE UPDATE | `whatsapp_messages` | `update_updated_at_column` |  |
| set_updated_at_automation_rules | BEFORE UPDATE | `automation_rules` | `update_updated_at_column` |  |
| trg_supplier_homologations_updated_at | BEFORE UPDATE | `supplier_homologations` | `update_updated_at_column` |  |
| trg_supplier_qualification_config_updated_at | BEFORE UPDATE | `supplier_qualification_config` | `update_updated_at_column` |  |
| trg_supplier_scores_updated_at | BEFORE UPDATE | `supplier_scores` | `update_updated_at_column` |  |
| trg_supplier_evaluation_recalc_score | AFTER INSERT | `supplier_evaluations` | `trg_fn_recalc_score_after_evaluation` |  |
| trg_homologation_insert_update_flag | BEFORE INSERT | `supplier_homologations` | `trg_fn_update_homologado_flag` |  |
| trg_homologation_update_update_flag | BEFORE UPDATE OF STATUS | `supplier_homologations` | `trg_fn_update_homologado_flag` | `OLD.status IS DISTINCT FROM NEW.status` |
| trg_company_sync_supplier | AFTER UPDATE OF IS_SUPPLIER | `companies` | `trg_fn_sync_company_supplier` | `OLD.is_supplier IS DISTINCT FROM NEW.is_supplier` |
| trg_company_insert_sync_supplier | AFTER INSERT | `companies` | `trg_fn_sync_company_supplier` | `NEW.is_supplier = true` |
| trg_protect_qualification_config_delete | BEFORE DELETE | `supplier_qualification_config` | `trg_fn_protect_qualification_config` |  |
| trg_prevent_evaluation_update | BEFORE UPDATE | `supplier_evaluations` | `trg_fn_prevent_evaluation_update` |  |
| trg_company_sync_carrier | AFTER UPDATE OF IS_CARRIER | `companies` | `trg_fn_sync_company_carrier` | `OLD.is_carrier IS DISTINCT FROM NEW.is_carrier` |
| trg_company_insert_sync_carrier | AFTER INSERT | `companies` | `trg_fn_sync_company_carrier` | `NEW.is_carrier = true` |
| trg_carrier_evaluation_recalc_score | AFTER INSERT | `carrier_evaluations` | `trg_fn_carrier_recalc_score_after_evaluation` |  |
| trg_carrier_homologation_insert_update_flag | BEFORE INSERT | `carrier_homologations` | `trg_fn_carrier_update_homologado_flag` |  |
| trg_carrier_homologation_update_update_flag | BEFORE UPDATE OF STATUS | `carrier_homologations` | `trg_fn_carrier_update_homologado_flag` | `OLD.status IS DISTINCT FROM NEW.status` |
| trg_prevent_carrier_evaluation_update | BEFORE UPDATE | `carrier_evaluations` | `trg_fn_prevent_carrier_evaluation_update` |  |
| trg_protect_carrier_qualification_config_delete | BEFORE DELETE | `carrier_qualification_config` | `trg_fn_protect_carrier_qualification_config` |  |
| trg_carrier_homologations_updated_at | BEFORE UPDATE | `carrier_homologations` | `update_updated_at_column` |  |
| trg_carrier_scores_updated_at | BEFORE UPDATE | `carrier_scores` | `update_updated_at_column` |  |
| trg_carrier_qualification_config_updated_at | BEFORE UPDATE | `carrier_qualification_config` | `update_updated_at_column` |  |
| trg_carriers_updated_at | BEFORE UPDATE | `carriers` | `update_updated_at_column` |  |
| trg_suppliers_updated_at | BEFORE UPDATE | `suppliers` | `update_updated_at_column` |  |
| trg_whatsapp_connections_updated_at | BEFORE UPDATE | `zapp_history.whatsapp_connections` | `update_updated_at_column` |  |
| trg_conversations_updated_at | BEFORE UPDATE | `zapp_history.conversations` | `update_updated_at_column` |  |
| trg_messages_updated_at | BEFORE UPDATE | `zapp_history.messages` | `update_updated_at_column` |  |
| trg_bump_conversation_on_message | AFTER INSERT | `zapp_history.messages` | `bump_conversation_on_message` |  |
| trg_mm_updated_at | BEFORE UPDATE | `zapp_history.message_media` | `update_updated_at_column` |  |
| trg_ma_updated_at | BEFORE UPDATE | `zapp_history.message_audio` | `update_updated_at_column` |  |
| trg_ml_updated_at | BEFORE UPDATE | `zapp_history.message_links` | `update_updated_at_column` |  |
| trg_cds_updated_at | BEFORE UPDATE | `zapp_history.conversation_daily_summaries` | `update_updated_at_column` |  |
| trg_atd_updated_at | BEFORE UPDATE | `zapp_history.ai_training_dataset` | `update_updated_at_column` |  |
| trg_auto_sync_summary | AFTER INSERT OR UPDATE OF SUMMARY_TEXT | `zapp_history.conversation_daily_summaries` | `trg_sync_summary_to_interaction` |  |
| trg_mm_autofill | BEFORE INSERT | `zapp_history.message_media` | `trg_autofill_contact_from_message` |  |
| trg_ma_autofill | BEFORE INSERT | `zapp_history.message_audio` | `trg_autofill_contact_from_message` |  |
| trg_ml_autofill | BEFORE INSERT | `zapp_history.message_links` | `trg_autofill_contact_from_message` |  |
| trg_mm_set_flag | AFTER INSERT | `zapp_history.message_media` | `trg_set_has_media` |  |
| trg_ma_set_flag | AFTER INSERT | `zapp_history.message_audio` | `trg_set_has_audio` |  |
| trg_ml_increment | AFTER INSERT | `zapp_history.message_links` | `trg_increment_link_count` |  |
| trg_parse_connector_log | AFTER INSERT OR UPDATE OF PROCESSED | `connector_log` | `parse_connector_log_to_messages` | `NEW.processed = FALSE` |
| trg_auto_embed_message | AFTER INSERT | `zapp_history.messages` | `trg_auto_request_embedding` |  |
| trg_auto_enqueue_audio | AFTER INSERT | `zapp_history.message_audio` | `trg_auto_enqueue_transcription` |  |
| trg_sync_msg_nlp_to_singu | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `sync_message_nlp_to_interaction` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_msg_periodic_reconcile | AFTER INSERT | `zapp_history.messages` | `trg_periodic_reconcile` |  |
| trg_urgent_order_alert | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `alert_urgent_order_via_bitrix` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_auto_tag_contact | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `auto_tag_contact_from_nlp` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_resolve_company_cnpj | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `resolve_company_from_cnpj` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_lead_score_calc | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `trg_calculate_lead_score` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_response_time_calc | AFTER INSERT | `zapp_history.messages` | `trg_update_response_time` |  |
| trg_set_business_hours | BEFORE INSERT | `zapp_history.messages` | `trg_set_business_hours` |  |
| trg_auto_enrich_contact | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `auto_enrich_contact` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_churn_alert | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `alert_churn_critical` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| zzz_trg_priority_quadrant | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `trg_set_priority_quadrant` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| zzz2_trg_response_window | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `trg_set_response_window` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| zzz3_trg_spam_quarantine | AFTER UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `trg_spam_quarantine` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| trg_short_msg_auto_process | BEFORE INSERT | `zapp_history.messages` | `trg_short_message_auto_process` |  |
| trg_rate_limit_connector_log | BEFORE INSERT | `connector_log` | `trg_connector_log_rate_limit` |  |
| trg_dedup_connector_log | BEFORE INSERT | `connector_log` | `trg_connector_log_dedup` |  |
| trg_validate_secret_connector_log | BEFORE INSERT | `connector_log` | `trg_connector_log_validate_secret` |  |
| trg_content_flood | BEFORE INSERT | `zapp_history.messages` | `trg_detect_content_flood` |  |
| zzz4_trg_technical_interest | BEFORE UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `trg_set_technical_interest` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| zzz5_trg_supplement_urgency | BEFORE UPDATE OF NLP_PROCESSED_AT | `zapp_history.messages` | `trg_supplement_urgency` | `NEW.nlp_processed_at IS NOT NULL AND OLD.nlp_processed_at IS NULL` |
| audit_contacts | AFTER INSERT OR UPDATE OR DELETE | `contacts` | `audit_trigger_fn` |  |
| audit_companies | AFTER INSERT OR UPDATE OR DELETE | `companies` | `audit_trigger_fn` |  |
| audit_interactions | AFTER INSERT OR UPDATE OR DELETE | `interactions` | `audit_trigger_fn` |  |
| update_rfm_analysis_updated_at | BEFORE UPDATE | `rfm_analysis` | `update_updated_at_column` |  |
| update_ai_chat_threads_updated_at | BEFORE UPDATE | `ai_chat_threads` | `update_updated_at_column` |  |
| update_automation_rules_updated_at | BEFORE UPDATE | `automation_rules` | `update_updated_at_column` |  |
| update_churn_risk_scores_updated_at | BEFORE UPDATE | `churn_risk_scores` | `update_updated_at_column` |  |
| set_updated_at_client_values | BEFORE UPDATE | `client_values` | `update_updated_at_column` |  |
| update_client_values_updated_at | BEFORE UPDATE | `client_values` | `update_updated_at_column` |  |
| set_updated_at_communication_preferences | BEFORE UPDATE | `communication_preferences` | `update_updated_at_column` |  |
| update_communication_preferences_updated_at | BEFORE UPDATE | `communication_preferences` | `update_updated_at_column` |  |
| set_updated_at_compatibility_settings | BEFORE UPDATE | `compatibility_settings` | `update_updated_at_column` |  |
| update_compatibility_settings_updated_at | BEFORE UPDATE | `compatibility_settings` | `update_updated_at_column` |  |
| set_updated_at_contact_cadence | BEFORE UPDATE | `contact_cadence` | `update_updated_at_column` |  |
| update_contact_cadence_updated_at | BEFORE UPDATE | `contact_cadence` | `update_updated_at_column` |  |
| set_updated_at_contact_preferences | BEFORE UPDATE | `contact_preferences` | `update_updated_at_column` |  |
| update_contact_preferences_updated_at | BEFORE UPDATE | `contact_preferences` | `update_updated_at_column` |  |
| set_updated_at_contact_relatives | BEFORE UPDATE | `contact_relatives` | `update_updated_at_column` |  |
| update_contact_relatives_updated_at | BEFORE UPDATE | `contact_relatives` | `update_updated_at_column` |  |
| set_updated_at_decision_criteria | BEFORE UPDATE | `decision_criteria` | `update_updated_at_column` |  |
| update_decision_criteria_updated_at | BEFORE UPDATE | `decision_criteria` | `update_updated_at_column` |  |
| set_updated_at_disc_conversion_metrics | BEFORE UPDATE | `disc_conversion_metrics` | `update_updated_at_column` |  |
| update_disc_conversion_metrics_updated_at | BEFORE UPDATE | `disc_conversion_metrics` | `update_updated_at_column` |  |
| set_updated_at_disc_profile_config | BEFORE UPDATE | `disc_profile_config` | `update_updated_at_column` |  |
| trg_document_signatures_updated_at | BEFORE UPDATE | `document_signatures` | `update_updated_at_column` |  |
| trg_document_templates_updated_at | BEFORE UPDATE | `document_templates` | `update_updated_at_column` |  |
| update_handoff_requests_updated_at | BEFORE UPDATE | `handoff_requests` | `update_updated_at_column` |  |
| set_updated_at_health_alert_settings | BEFORE UPDATE | `health_alert_settings` | `update_updated_at_column` |  |
| update_health_alert_settings_updated_at | BEFORE UPDATE | `health_alert_settings` | `update_updated_at_column` |  |
| set_landing_pages_updated_at | BEFORE UPDATE | `landing_pages` | `update_updated_at_column` |  |
| update_lead_assignments_updated_at | BEFORE UPDATE | `lead_assignments` | `update_updated_at_column` |  |
| update_lead_routing_rules_updated_at | BEFORE UPDATE | `lead_routing_rules` | `update_updated_at_column` |  |
| update_lead_score_config_updated_at | BEFORE UPDATE | `lead_score_config` | `update_updated_at_column` |  |
| update_lead_scores_updated_at | BEFORE UPDATE | `lead_scores` | `update_updated_at_column` |  |
| set_updated_at_life_events | BEFORE UPDATE | `life_events` | `update_updated_at_column` |  |
| update_life_events_updated_at | BEFORE UPDATE | `life_events` | `update_updated_at_column` |  |
| set_updated_at_lux_intelligence | BEFORE UPDATE | `lux_intelligence` | `update_updated_at_column` |  |
| update_lux_intelligence_updated_at | BEFORE UPDATE | `lux_intelligence` | `update_updated_at_column` |  |
| update_lux_webhook_config_updated_at | BEFORE UPDATE | `lux_webhook_config` | `update_updated_at_column` |  |
| update_meeting_summaries_updated_at | BEFORE UPDATE | `meeting_summaries` | `update_updated_at_column` |  |
| set_updated_at_purchase_history | BEFORE UPDATE | `purchase_history` | `update_updated_at_column` |  |
| set_updated_at_push_subscriptions | BEFORE UPDATE | `push_subscriptions` | `update_updated_at_column` |  |
| set_updated_at_rfm_analysis | BEFORE UPDATE | `rfm_analysis` | `update_updated_at_column` |  |
| set_updated_at_rfm_segment_config | BEFORE UPDATE | `rfm_segment_config` | `update_updated_at_column` |  |
| trg_auto_reset_leads_daily | BEFORE UPDATE | `sales_team_members` | `auto_reset_leads_on_update` | `(old.leads_today IS DISTINCT FROM new.leads_today)` |
| update_sales_team_members_updated_at | BEFORE UPDATE | `sales_team_members` | `update_updated_at_column` |  |
| trg_update_search_products_cache_updated_at | BEFORE UPDATE | `search_products_cache` | `update_updated_at_column` |  |
| trg_sms_campaigns_updated_at | BEFORE UPDATE | `sms_campaigns` | `update_updated_at_column` |  |
| trg_sms_templates_updated_at | BEFORE UPDATE | `sms_templates` | `update_updated_at_column` |  |
| set_updated_at_social_profiles | BEFORE UPDATE | `social_profiles` | `update_updated_at_column` |  |
| set_updated_at_social_scraping_schedule | BEFORE UPDATE | `social_scraping_schedule` | `update_updated_at_column` |  |
| set_updated_at_trigger_ab_tests | BEFORE UPDATE | `trigger_ab_tests` | `update_updated_at_column` |  |
| set_updated_at_trigger_bundles | BEFORE UPDATE | `trigger_bundles` | `update_updated_at_column` |  |
| set_updated_at_trigger_channel_effectiveness | BEFORE UPDATE | `trigger_channel_effectiveness` | `update_updated_at_column` |  |
| set_updated_at_weekly_report_settings | BEFORE UPDATE | `weekly_report_settings` | `update_updated_at_column` |  |
| set_updated_at_whatsapp_instances | BEFORE UPDATE | `whatsapp_instances` | `update_updated_at_column` |  |
| trg_sequence_pause_on_reply | AFTER INSERT | `interactions` | `sequence_pause_on_interaction_reply` |  |
| abm_accounts_updated_at | BEFORE UPDATE | `abm_accounts` | `update_updated_at_column` |  |
| abm_accounts_audit | AFTER INSERT OR UPDATE OR DELETE | `abm_accounts` | `audit_trigger_fn` |  |
| abm_plans_updated_at | BEFORE UPDATE | `abm_account_plans` | `update_updated_at_column` |  |
| abm_plans_audit | AFTER INSERT OR UPDATE OR DELETE | `abm_account_plans` | `audit_trigger_fn` |  |
| abm_committee_updated_at | BEFORE UPDATE | `abm_buying_committee` | `update_updated_at_column` |  |
| abm_whitespace_updated_at | BEFORE UPDATE | `abm_whitespace_opportunities` | `update_updated_at_column` |  |
| abm_campaigns_updated_at | BEFORE UPDATE | `abm_campaigns` | `update_updated_at_column` |  |
| audit_intent_signals | AFTER INSERT OR UPDATE OR DELETE | `intent_signals` | `audit_trigger_fn` |  |
| update_intent_scores_updated_at | BEFORE UPDATE | `intent_scores` | `update_updated_at_column` |  |
| update_intent_pixels_updated_at | BEFORE UPDATE | `intent_tracking_pixels` | `update_updated_at_column` |  |
| tg_lead_scores_audit | AFTER INSERT OR UPDATE OR DELETE | `lead_scores` | `audit_trigger_fn` |  |
| tg_lead_scores_updated | BEFORE UPDATE | `lead_scores` | `update_updated_at_column` |  |
| tg_lead_score_rules_updated | BEFORE UPDATE | `lead_score_rules` | `update_updated_at_column` |  |
| tg_lead_score_thresholds_updated | BEFORE UPDATE | `lead_score_thresholds` | `update_updated_at_column` |  |
| tg_intent_signals_enqueue_score | AFTER INSERT | `intent_signals` | `trigger_lead_score_recompute` |  |
| trg_win_loss_reasons_updated | BEFORE UPDATE | `win_loss_reasons` | `update_updated_at_column` |  |
| trg_competitors_updated | BEFORE UPDATE | `competitors` | `update_updated_at_column` |  |
| trg_win_loss_records_updated | BEFORE UPDATE | `win_loss_records` | `update_updated_at_column` |  |
| trg_win_loss_records_audit | AFTER INSERT OR UPDATE OR DELETE | `win_loss_records` | `audit_trigger_fn` |  |
| trg_conv_analyses_updated_at | BEFORE UPDATE | `conversation_analyses` | `update_updated_at_column` |  |
| trg_conv_analyses_audit | AFTER INSERT OR UPDATE OR DELETE | `conversation_analyses` | `audit_trigger_fn` |  |
| trg_conv_topics_updated_at | BEFORE UPDATE | `conversation_topics_catalog` | `update_updated_at_column` |  |
| trg_coaching_scorecards_updated_at | BEFORE UPDATE | `coaching_scorecards` | `update_updated_at_column` |  |
| trg_forecast_periods_updated | BEFORE UPDATE | `forecast_periods` | `update_updated_at_column` |  |
| trg_deal_forecasts_updated | BEFORE UPDATE | `deal_forecasts` | `update_updated_at_column` |  |
| trg_deal_forecasts_audit | AFTER INSERT OR UPDATE OR DELETE | `deal_forecasts` | `audit_trigger_fn` |  |
| trg_quota_settings_updated | BEFORE UPDATE | `forecast_quota_settings` | `update_updated_at_column` |  |
| trg_deal_forecasts_cat_history | AFTER UPDATE | `deal_forecasts` | `log_deal_forecast_category_change` |  |
| tr_dr_rooms_updated | BEFORE UPDATE | `deal_rooms` | `update_updated_at_column` |  |
| tr_dr_ms_updated | BEFORE UPDATE | `deal_room_milestones` | `update_updated_at_column` |  |
| tr_dr_sh_updated | BEFORE UPDATE | `deal_room_stakeholders` | `update_updated_at_column` |  |
| tr_dr_rooms_audit | AFTER INSERT OR UPDATE OR DELETE | `deal_rooms` | `audit_trigger_fn` |  |
| tr_dr_ms_audit | AFTER INSERT OR UPDATE OR DELETE | `deal_room_milestones` | `audit_trigger_fn` |  |
| trg_lsta_updated | BEFORE UPDATE | `lead_score_threshold_automations` | `update_updated_at_column` |  |
| trg_lsta_audit | AFTER INSERT OR UPDATE OR DELETE | `lead_score_threshold_automations` | `audit_trigger_fn` |  |
| tg_sequence_events_to_intent | AFTER INSERT | `sequence_events` | `sequence_event_to_intent_signal` |  |
| trg_singu_sync_contact_email | AFTER INSERT OR UPDATE OR DELETE | `contact_emails` | `singu_sync_contact_email` |  |
| trg_singu_sync_contact_phone | AFTER INSERT OR UPDATE OR DELETE | `contact_phones` | `singu_sync_contact_phone` |  |
| update_sales_playbooks_updated_at | BEFORE UPDATE | `sales_playbooks` | `update_updated_at_column` |  |
| audit_sales_playbooks | AFTER INSERT OR UPDATE OR DELETE | `sales_playbooks` | `audit_trigger_fn` |  |
| update_battle_cards_updated_at | BEFORE UPDATE | `battle_cards` | `update_updated_at_column` |  |
| audit_battle_cards | AFTER INSERT OR UPDATE OR DELETE | `battle_cards` | `audit_trigger_fn` |  |
| tg_playbook_usage_increment | AFTER INSERT | `playbook_usage_log` | `increment_playbook_usage` |  |
| trg_forms_updated | BEFORE UPDATE | `forms` | `update_updated_at_column` |  |
| trg_lm_updated | BEFORE UPDATE | `lead_magnets` | `update_updated_at_column` |  |
| trg_mqlc_updated | BEFORE UPDATE | `mql_criteria` | `update_updated_at_column` |  |
| trg_mqlcls_updated | BEFORE UPDATE | `mql_classifications` | `update_updated_at_column` |  |
| trg_ne_updated | BEFORE UPDATE | `nurturing_executions` | `update_updated_at_column` |  |
| trg_singu_sync_company_address | AFTER INSERT OR UPDATE OR DELETE | `company_addresses` | `singu_sync_company_address` |  |
| trg_revops_benchmarks_updated_at | BEFORE UPDATE | `revops_benchmarks` | `update_updated_at_column` |  |
| trg_cs_accounts_updated | BEFORE UPDATE | `cs_accounts` | `update_updated_at_column` |  |
| trg_cs_qbrs_updated | BEFORE UPDATE | `cs_qbrs` | `update_updated_at_column` |  |
| trg_cs_renewals_updated | BEFORE UPDATE | `cs_renewals` | `update_updated_at_column` |  |
| trg_ev_updated_at | BEFORE UPDATE | `email_verifications` | `update_updated_at_column` |  |
| trg_pv_updated_at | BEFORE UPDATE | `phone_validations` | `update_updated_at_column` |  |
| trg_efr_updated_at | BEFORE UPDATE | `email_finder_results` | `update_updated_at_column` |  |
| trg_detect_contact_intel | AFTER UPDATE | `contacts` | `detect_contact_intel_changes` | `OLD.role_title IS DISTINCT FROM NEW.role_title OR OLD.company_id IS DISTINCT FROM NEW.company_id` |
| update_email_thread_summaries_updated_at | BEFORE UPDATE | `email_thread_summaries` | `update_updated_at_column` |  |
| update_contact_next_actions_updated_at | BEFORE UPDATE | `contact_next_actions` | `update_updated_at_column` |  |
| trg_notify_critical_next_action | AFTER INSERT OR UPDATE OF URGENCY | `contact_next_actions` | `notify_critical_next_action` |  |
| trg_notif_prefs_updated_at | BEFORE UPDATE | `notification_preferences` | `update_updated_at_column` |  |
| trg_connection_configs_updated_at | BEFORE UPDATE | `connection_configs` | `update_updated_at_column` |  |
| trg_incoming_webhooks_updated_at | BEFORE UPDATE | `incoming_webhooks` | `update_updated_at_column` |  |
| trg_dlq_updated_at | BEFORE UPDATE | `incoming_webhook_dlq` | `update_updated_at_column` |  |
| trg_notify_connection_failures | AFTER INSERT | `connection_test_logs` | `notify_connection_failures` |  |
| trg_notify_webhook_errors | AFTER INSERT | `incoming_webhook_logs` | `notify_webhook_errors` |  |
| trg_audit_connection_configs | AFTER INSERT OR UPDATE OR DELETE | `connection_configs` | `audit_connection_changes` |  |
| trg_audit_incoming_webhooks | AFTER INSERT OR UPDATE OR DELETE | `incoming_webhooks` | `audit_connection_changes` |  |
| contacts_increment_version | BEFORE UPDATE | `contacts` | `increment_version_column` |  |
| companies_increment_version | BEFORE UPDATE | `companies` | `increment_version_column` |  |
| feature_flags_updated_at | BEFORE UPDATE | `feature_flags` | `update_updated_at_column` |  |
| trg_sentiment_annotations_updated_at | BEFORE UPDATE | `sentiment_annotations` | `update_updated_at_column` |  |
| trg_user_ui_preferences_updated_at | BEFORE UPDATE | `user_ui_preferences` | `set_user_ui_preferences_updated_at` |  |
| update_applied_objection_responses_updated_at | BEFORE UPDATE | `applied_objection_responses` | `update_updated_at_column` |  |
| update_objection_example_feedback_updated_at | BEFORE UPDATE | `objection_example_feedback` | `update_updated_at_column` |  |
| trg_contact_notes_updated_at | BEFORE UPDATE | `contact_notes` | `fn_update_contact_notes_updated_at` |  |
| update_follow_up_approvals_updated_at | BEFORE UPDATE | `follow_up_approvals` | `update_updated_at_column` |  |
| tr_increment_contact_version | BEFORE UPDATE | `contacts` | `increment_contact_version` |  |
| update_suggested_rapport_updated_at | BEFORE UPDATE | `suggested_rapport_intel` | `update_updated_at_column` |  |
| tr_suggested_rapport_updated_at | BEFORE UPDATE | `suggested_rapport_intel` | `handle_updated_at` |  |
| tr_contact_family_history_versioning | AFTER UPDATE OF FAMILY_INFO | `contacts` | `save_contact_family_history` |  |
| trg_record_family_history | AFTER INSERT OR UPDATE | `contacts` | `record_family_history` |  |
| tr_update_relationship_metrics | AFTER INSERT OR UPDATE | `interactions` | `update_contact_relationship_metrics` |  |
| tr_update_contact_metrics | AFTER INSERT OR UPDATE OR DELETE | `interactions` | `calculate_relationship_metrics` |  |
| trigger_log_contact_relationship_changes | AFTER UPDATE | `contacts` | `log_contact_relationship_changes` |  |
| update_contact_behavior_updated_at | BEFORE UPDATE | `contact_behavior` | `update_updated_at_column` |  |
| update_contact_decision_making_updated_at | BEFORE UPDATE | `contact_decision_making` | `update_updated_at_column` |  |
| update_contact_influence_updated_at | BEFORE UPDATE | `contact_influence` | `update_updated_at_column` |  |
| update_contact_business_context_updated_at | BEFORE UPDATE | `contact_business_context` | `update_updated_at_column` |  |
| log_contact_behavior_change | AFTER UPDATE | `contact_behavior` | `log_behavioral_change` |  |
| log_contact_decision_change | AFTER UPDATE | `contact_decision_making` | `log_behavioral_change` |  |
| log_contact_influence_change | AFTER UPDATE | `contact_influence` | `log_behavioral_change` |  |
| log_contact_business_change | AFTER UPDATE | `contact_business_context` | `log_behavioral_change` |  |
| log_contact_personality_change | AFTER UPDATE | `contact_personality` | `log_behavioral_change` |  |
| update_contact_personality_updated_at | BEFORE UPDATE | `contact_personality` | `update_updated_at_column` |  |
| log_contact_metaprograms_change | AFTER UPDATE | `contact_metaprograms` | `log_behavioral_change` |  |
| update_contact_metaprograms_updated_at | BEFORE UPDATE | `contact_metaprograms` | `update_updated_at_column` |  |
| tr_check_mbti_consistency | BEFORE INSERT OR UPDATE | `contact_personality` | `check_mbti_consistency` |  |
| log_contact_rapport_change | AFTER UPDATE | `contact_rapport_strategy` | `log_behavioral_change` |  |
| update_contact_rapport_updated_at | BEFORE UPDATE | `contact_rapport_strategy` | `update_updated_at_column` |  |
| tr_handle_recurring_life_event | BEFORE INSERT OR UPDATE | `life_events` | `handle_recurring_life_event` |  |
| tr_log_life_events_change | AFTER INSERT OR UPDATE OR DELETE | `life_events` | `log_behavioral_change` |  |
| tr_audit_life_events | AFTER INSERT OR UPDATE OR DELETE | `life_events` | `audit_life_events` |  |
| set_updated_at | BEFORE UPDATE | `life_events` | `update_updated_at_column` |  |
| update_suggested_life_events_updated_at | BEFORE UPDATE | `suggested_life_events` | `update_updated_at_column` |  |
| tr_contact_relatives_audit | AFTER INSERT OR UPDATE OR DELETE | `contact_relatives` | `process_contact_relatives_audit` |  |
| on_contact_relatives_change | AFTER INSERT OR UPDATE OR DELETE | `contact_relatives` | `process_contact_relatives_audit` |  |
| on_contact_preferences_change | AFTER INSERT OR UPDATE OR DELETE | `contact_preferences` | `process_contact_preferences_audit` |  |
| on_contact_cadence_change | AFTER INSERT OR UPDATE OR DELETE | `contact_cadence` | `process_contact_cadence_audit` |  |
| on_contact_time_analysis_change | AFTER INSERT OR UPDATE OR DELETE | `contact_time_analysis` | `process_contact_time_analysis_audit` |  |
| on_interaction_created | AFTER INSERT | `interactions` | `sync_contact_last_interaction` |  |
| on_interaction_change | AFTER INSERT OR UPDATE OR DELETE | `interactions` | `process_interactions_audit` |  |
| on_interaction_before_insert | BEFORE INSERT | `interactions` | `calculate_interaction_response_time` |  |
| on_disc_analysis_change | AFTER INSERT OR UPDATE OR DELETE | `disc_analysis_history` | `process_disc_analysis_audit` |  |
| on_reframing_change | AFTER INSERT OR UPDATE OR DELETE | `reframing_analysis` | `process_reframing_audit` |  |
| tr_sync_vak_to_contact | AFTER INSERT OR UPDATE | `vak_analysis_history` | `sync_nlp_to_contact` |  |
| tr_sync_meta_to_contact | AFTER INSERT OR UPDATE | `metaprogram_analysis` | `sync_nlp_to_contact` |  |
| set_updated_at_brain_dominance | BEFORE UPDATE | `brain_dominance_analysis` | `handle_updated_at` |  |
| set_updated_at_neuro_pnl_sessions | BEFORE UPDATE | `neuro_pnl_sessions` | `handle_updated_at` |  |
| update_contact_automation_settings_updated_at | BEFORE UPDATE | `contact_automation_settings` | `update_updated_at_column` |  |
| update_contact_report_overrides_updated_at | BEFORE UPDATE | `contact_report_overrides` | `update_updated_at_column` |  |
| update_crm_objection_intelligence_updated_at | BEFORE UPDATE | `crm_objection_intelligence` | `update_updated_at_column` |  |
| set_updated_at | BEFORE UPDATE | `contact_predictive_roadmap` | `handle_updated_at` |  |
| update_interaction_summaries_updated_at | BEFORE UPDATE | `interaction_summaries` | `update_updated_at_column` |  |
| update_social_sync_queue_updated_at | BEFORE UPDATE | `social_sync_queue` | `update_updated_at_column` |  |
| update_pipelines_updated_at | BEFORE UPDATE | `pipelines` | `update_updated_at_column` |  |
| update_pipeline_stages_updated_at | BEFORE UPDATE | `pipeline_stages` | `update_updated_at_column` |  |
| update_deals_updated_at | BEFORE UPDATE | `deals` | `update_updated_at_column` |  |
| tr_validate_deal_stage_transition | BEFORE UPDATE OF STAGE_ID | `deals` | `fn_validate_deal_stage_transition` |  |
| update_ai_tone_preferences_updated_at | BEFORE UPDATE | `ai_tone_preferences` | `update_updated_at_column` |  |
| trg_novelty_updated_at | BEFORE UPDATE | `product_novelties` | `fn_set_novelty_updated_at` |  |
| trg_sync_novelty_to_product | AFTER INSERT OR UPDATE OR DELETE | `product_novelties` | `fn_sync_novelty_to_product` |  |
| trg_entity_relationships_updated_at | BEFORE UPDATE | `entity_relationships` | `tg_set_updated_at` |  |
| trg_validate_entity_relationship | BEFORE INSERT OR UPDATE | `entity_relationships` | `validate_entity_relationship` |  |
| trg_enqueue_bpr_whatsapp | AFTER INSERT | `whatsapp_messages` | `enqueue_behavioral_profile_regen` |  |
| trg_enqueue_bpr_calls | AFTER INSERT | `call_logs` | `enqueue_behavioral_profile_regen` |  |
| trg_enqueue_bpr_interactions | AFTER INSERT | `interactions` | `enqueue_behavioral_profile_regen` |  |
| trg_bpr_queue_updated_at | BEFORE UPDATE | `behavioral_profile_regen_queue` | `update_bpr_queue_updated_at` |  |
| trg_bif_updated_at | BEFORE UPDATE | `behavioral_insight_feedback` | `update_updated_at_column` |  |
| trg_notify_admins_critical_behavioral | AFTER INSERT | `system_alerts` | `notify_admins_on_critical_behavioral_alert` |  |
| system_config_touch | BEFORE UPDATE | `system_config` | `touch_system_config` |  |
| trg_automations_updated_at | BEFORE UPDATE | `automations` | `update_updated_at_column` |  |
| trg_calendar_events_updated_at | BEFORE UPDATE | `calendar_events` | `update_updated_at_column` |  |
| trg_campaigns_updated_at | BEFORE UPDATE | `campaigns` | `update_updated_at_column` |  |
| trg_company_cadences_updated_at | BEFORE UPDATE | `company_cadences` | `update_updated_at_column` |  |
| trg_csat_surveys_updated_at | BEFORE UPDATE | `csat_surveys` | `update_updated_at_column` |  |
| trg_custom_field_values_updated_at | BEFORE UPDATE | `custom_field_values` | `update_updated_at_column` |  |
| trg_custom_fields_updated_at | BEFORE UPDATE | `custom_fields` | `update_updated_at_column` |  |
| trg_documents_updated_at | BEFORE UPDATE | `documents` | `update_updated_at_column` |  |
| trg_economic_groups_updated_at | BEFORE UPDATE | `economic_groups` | `update_updated_at_column` |  |
| trg_inactivity_alerts_updated_at | BEFORE UPDATE | `inactivity_alerts` | `update_updated_at_column` |  |
| trg_integrations_updated_at | BEFORE UPDATE | `integrations` | `update_updated_at_column` |  |
| trg_interaction_templates_updated_at | BEFORE UPDATE | `interaction_templates` | `update_updated_at_column` |  |
| trg_message_templates_updated_at | BEFORE UPDATE | `message_templates` | `update_updated_at_column` |  |
| trg_products_updated_at | BEFORE UPDATE | `products` | `update_updated_at_column` |  |
| trg_proposals_updated_at | BEFORE UPDATE | `proposals` | `update_updated_at_column` |  |
| trg_quick_notes_updated_at | BEFORE UPDATE | `quick_notes` | `update_updated_at_column` |  |
| trg_sales_cadences_updated_at | BEFORE UPDATE | `sales_cadences` | `update_updated_at_column` |  |
| trg_sales_forecasts_updated_at | BEFORE UPDATE | `sales_forecasts` | `update_updated_at_column` |  |
| trg_sales_goals_updated_at | BEFORE UPDATE | `sales_goals` | `update_updated_at_column` |  |
| trg_sales_opportunities_updated_at | BEFORE UPDATE | `sales_opportunities` | `update_updated_at_column` |  |
| trg_smart_segments_updated_at | BEFORE UPDATE | `smart_segments` | `update_updated_at_column` |  |
| trg_tasks_updated_at | BEFORE UPDATE | `tasks` | `update_updated_at_column` |  |
| trg_user_goals_updated_at | BEFORE UPDATE | `user_goals` | `update_updated_at_column` |  |
| trg_whatsapp_messages_updated_at | BEFORE UPDATE | `whatsapp_messages` | `update_updated_at_column` |  |
| update_data_retention_policies_updated_at | BEFORE UPDATE | `data_retention_policies` | `update_updated_at_column` |  |
| trg_customer_purchases_after_insert | AFTER INSERT | `customer_purchases` | `trg_after_purchase` |  |
| trg_valida_dominio_signup | BEFORE INSERT | `auth.users` | `fn_valida_dominio_signup` |  |
| trg_rpc_plan_changed | BEFORE INSERT | `rpc_plan_snapshots` | `set_rpc_plan_changed` |  |
| a_singu_sync_legacy_company_name | BEFORE INSERT OR UPDATE | `companies` | `singu_sync_legacy_company_name` |  |
| sequence_enrollment_write_guard | BEFORE INSERT OR UPDATE | `sequence_enrollments` | `guard_sequence_enrollment_write` |  |
| … +4 linhas — lista completa em `context.json` | | | | |

Erros lançados por funções SQL (`RAISE EXCEPTION` = regra de negócio no banco):

| Função | Mensagem | Origem |
|---|---|---|
| `trg_normalizar_telefone_contact` | Número de telefone inválido: "%" — deve ter entre 8 e 13 dígitos (recebido: % dígitos) | `supabase/migrations/20260306192439_add_length_validation_phone_triggers.sql` |
| `trg_normalizar_telefone` | Número de telefone inválido: "%" — deve ter entre 8 e 13 dígitos (recebido: % dígitos) | `supabase/migrations/20260306192439_add_length_validation_phone_triggers.sql` |
| `deactivate_social_media` | entity_type inválido: % | `supabase/migrations/20260321134401_remove_google_maps_enum_v2.sql` |
| `trg_fn_protect_qualification_config` | Não é possível deletar segmento "%" pois existem fornecedores classificados nele. | `supabase/migrations/20260329204052_create_trigger_protect_qualification_config_delete.sql` |
| `trg_fn_prevent_evaluation_update` | Avaliações de fornecedor são imutáveis. Não é possível alterar registros existentes. Crie uma nova avaliação. | `supabase/migrations/20260329204121_protect_evaluations_immutable.sql` |
| `trg_fn_prevent_carrier_evaluation_update` | Avaliações de transportadora são imutáveis. Não é possível alterar registros existentes. Crie uma nova avaliação. | `supabase/migrations/20260330122025_create_carrier_triggers.sql` |
| `trg_fn_protect_carrier_qualification_config` | Não é possível deletar segmento "%" pois existem transportadoras classificadas nele. | `supabase/migrations/20260330122025_create_carrier_triggers.sql` |
| `trg_autofill_contact_from_message` | message_id % not found in zapp_history.messages | `supabase/migrations/20260408200845_zapp_history_12_auto_fill_contact_id.sql` |
| `get_contact_intelligence_v2` | access denied to contact % | `supabase/migrations/20260408201038_zapp_history_16_get_contact_intelligence_v2.sql` |
| `trigger_backfill_summaries` | start_date (%) must be <= end_date (%) | `supabase/migrations/20260408201117_zapp_history_18_backfill_summaries_rpc.sql` |
| `trigger_backfill_summaries` | backfill window too large (max 90 days). Requested: % days | `supabase/migrations/20260408201117_zapp_history_18_backfill_summaries_rpc.sql` |
| `sync_summary_to_interaction` | summary % not found | `supabase/migrations/20260408204226_zapp_history_23_fix_sync_type.sql` |
| `webhook_log_message` | invalid direction: % | `supabase/migrations/20260409133218_zapp_history_43_webhook_log_rpc.sql` |
| `webhook_log_message` | whatsapp_number required | `supabase/migrations/20260409133218_zapp_history_43_webhook_log_rpc.sql` |
| `seed_deal_room` | Forbidden | `supabase/migrations/20260417003149_4ff2385c-d333-41c5-9f8f-6a640545f215.sql` |
| `buyer_add_comment` | Invalid comment | `supabase/migrations/20260417003149_4ff2385c-d333-41c5-9f8f-6a640545f215.sql` |
| `submit_public_form` | Form not found or not published | `supabase/migrations/20260417011613_40e57206-6feb-4bd8-a3f0-110e3a2cb8e1.sql` |
| `track_magnet_download` | Magnet not found | `supabase/migrations/20260417011613_40e57206-6feb-4bd8-a3f0-110e3a2cb8e1.sql` |
| `enqueue_smart_notification` | Unauthorized | `supabase/migrations/20260417195323_b84a83b6-e3b8-4d98-be74-9c37a1bdfc21.sql` |
| `encrypt_connection_config` | Apenas administradores podem cifrar configurações | `supabase/migrations/20260420120250_19397a25-edf3-4939-854a-9d4fdc534f65.sql` |
| `decrypt_connection_config` | Apenas administradores podem descriptografar configurações | `supabase/migrations/20260420120250_19397a25-edf3-4939-854a-9d4fdc534f65.sql` |
| `get_connection_metrics` | forbidden | `supabase/migrations/20260420121651_b36d3337-3bfe-4477-b87d-9b3a39c72679.sql` |
| `check_mbti_consistency` | MBTI Type % inconsistent with E/I score % | `supabase/migrations/20260509184111_637bda7b-3924-43cf-80cb-cc4d3094c09d.sql` |
| `fn_validate_deal_stage_transition` | Transição de estágio não permitida: de % para % | `supabase/migrations/20260513143103_c834a03b-5b1e-41c7-a213-eea176782e00.sql` |
| `move_deal` | Deal não encontrado | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| `move_deal` | Sem permissão para mover este negócio | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| `update_deal_amount` | Valor do negócio não pode ser negativo | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| `update_deal_amount` | Deal não encontrado ou sem permissão | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| `fn_cf_collect_sm_legacy` | CF credentials not found in vault | `supabase/migrations/20260607210923_fn_cf_collect_sm_legacy_v1.sql` |
| `validate_entity_relationship` | from entity % % não existe | `supabase/migrations/20260712215719_930fd99a-437f-423c-a6ce-9a3c5c065106.sql` |
| `validate_entity_relationship` | to entity % % não existe | `supabase/migrations/20260712215719_930fd99a-437f-423c-a6ce-9a3c5c065106.sql` |
| `get_behavioral_regen_cron_health` | permission denied | `supabase/migrations/20260713104851_60372e3b-0254-498a-936b-9da1d6741f8e.sql` |
| `simulate_behavioral_regen_alert` | permission denied | `supabase/migrations/20260713105408_4c9c3e79-bf88-4c94-857a-651b4ce922ce.sql` |
| `simulate_behavioral_regen_alert` | invalid alert_type | `supabase/migrations/20260713105408_4c9c3e79-bf88-4c94-857a-651b4ce922ce.sql` |
| `simulate_behavioral_regen_alert` | invalid severity | `supabase/migrations/20260713105408_4c9c3e79-bf88-4c94-857a-651b4ce922ce.sql` |
| `create_deal` | create_deal: unauthenticated call | `supabase/migrations/20260720134409_bd1_deal_ownership_checks.sql` |
| `bulk_reassign_companies` | bulk_reassign_companies: admin role required | `supabase/migrations/20260720135515_bd2_company_contact_ownership_checks.sql` |
| `singu_delete` | Authentication required | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_delete` | Table % not allowed | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_insert` | Authentication required | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_insert` | Table % not allowed | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_update` | Authentication required | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_update` | Table % not allowed | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_query` | Authentication required | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `singu_query` | Table % not allowed | `supabase/migrations/20260721204158_fix_singu_user_impersonation.sql` |
| `assert_self_user_id` | Unauthorized: cannot perform operations on behalf of another user | `supabase/migrations/20260721205654_fix_secdef_impersonation_guard_all.sql` |
| `assert_company_access` | Unauthorized: company % does not belong to the current user | `supabase/migrations/20260721212000_fix_secdef_object_ownership_guard.sql` |
| `assert_contact_access` | Unauthorized: contact % does not belong to the current user | `supabase/migrations/20260721212000_fix_secdef_object_ownership_guard.sql` |
| `assert_deal_access` | Unauthorized: deal % does not belong to the current user | `supabase/migrations/20260721212539_fix_secdef_entity_ownership_guard.sql` |
| `assert_event_access` | Unauthorized: event % does not belong to the current user | `supabase/migrations/20260721212539_fix_secdef_entity_ownership_guard.sql` |
| `assert_interaction_access` | Unauthorized: interaction % does not belong to the current user | `supabase/migrations/20260721212539_fix_secdef_entity_ownership_guard.sql` |
| `assert_note_access` | Unauthorized: note % does not belong to the current user | `supabase/migrations/20260721212539_fix_secdef_entity_ownership_guard.sql` |
| `assert_reminder_access` | Unauthorized: reminder % does not belong to the current user | `supabase/migrations/20260721212539_fix_secdef_entity_ownership_guard.sql` |
| `assert_task_access` | Unauthorized: task % does not belong to the current user | `supabase/migrations/20260721212539_fix_secdef_entity_ownership_guard.sql` |
| `assert_visit_access` | Unauthorized: visit % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_notification_access` | Unauthorized: notification % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_proposal_access` | Unauthorized: proposal % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_goal_access` | Unauthorized: goal % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_violation_access` | Unauthorized: SLA violation % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_alert_access` | Unauthorized: alert % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_customer_access` | Unauthorized: customer % does not belong to the current user | `supabase/migrations/20260721213727_fix_secdef_entity_ownership_guard_2.sql` |
| `assert_cadence_access` | Unauthorized: cadence % does not belong to the current user | `supabase/migrations/20260721214918_fix_secdef_remaining_guards.sql` |
| `assert_opportunity_access` | Unauthorized: opportunity % does not belong to the current user | `supabase/migrations/20260721214918_fix_secdef_remaining_guards.sql` |
| `resolve_alerts_batch` | Unauthorized: one or more alerts do not belong to you | `supabase/migrations/20260721214918_fix_secdef_remaining_guards.sql` |
| `record_nps_response` | Unauthorized: NPS survey % does not belong to the current user | `supabase/migrations/20260721214918_fix_secdef_remaining_guards.sql` |
| `cs_renewal_pipeline` | Forbidden | `supabase/migrations/20260723120839_8d1857f8-929d-453c-9f9b-9ede9fef5d41.sql` |
| `seed_lead_score_defaults` | not authorized | `supabase/migrations/20260723121057_9d1bb7f0-69a6-4197-8656-8dfeb9dfe6bc.sql` |
| `compute_account_health` | Account not found | `supabase/migrations/20260723122017_4576ad54-c38d-4259-9e8d-b3b241622eac.sql` |
| `compute_account_health` | Forbidden | `supabase/migrations/20260723122017_4576ad54-c38d-4259-9e8d-b3b241622eac.sql` |
| `cleanup_behavioral_regen_queue` | acesso negado: requer autenticação | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `cleanup_behavioral_regen_queue` | acesso negado: requer admin | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `execute_readonly_query` | acesso negado: requer autenticação | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `execute_readonly_query` | acesso negado: requer admin | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `execute_readonly_query` | Only SELECT queries are allowed | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `execute_readonly_query` | Query contains forbidden keywords | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `execute_readonly_query` | Access to system schemas is not allowed | `supabase/migrations/20260723123359_20e8aab8-d739-49ad-bc3f-691e7eac539e.sql` |
| `registrar_pedido_erp` | This function is reserved for the service role | `supabase/migrations/20260924153509_rodizio_bloco1_erp_contract.sql` |
| `rodizio_expirar_bloqueios` | This function is reserved for the service role | `supabase/migrations/20260924181919_rodizio_bloco2_motor.sql` |
| `rodizio_segmentar_carteira` | This function is reserved for the service role | `supabase/migrations/20260924181919_rodizio_bloco2_motor.sql` |
| `encerrar_vinculo_sdr_closer` | This function is reserved for the service role | `supabase/migrations/20260924214837_t215_hotfix_vincular_encerrar_sdr_closer_is_ativo.sql` |
| `vincular_sdr_closer` | This function is reserved for the service role | `supabase/migrations/20260924214837_t215_hotfix_vincular_encerrar_sdr_closer_is_ativo.sql` |
| `fn_valida_dominio_signup` | Cadastro não autorizado para este e-mail. Fale com o administrador do Singu. | `supabase/migrations/20260925102411_t219_restringe_signup_por_dominio.sql` |
| `enroll_contact_in_workflow` | Forbidden | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `get_marketing_funnel_stats` | Forbidden | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `get_score_explicability` | Contact not found | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `compute_revops_kpis` | Forbidden | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `evaluate_mql` | Contact not found | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `move_deal_atomic` | Deal não encontrado: % | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `move_deal_atomic` | Transição de % para % não permitida por política de negócio | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `seed_conversation_topics` | Forbidden | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `seed_forecast_period` | Forbidden | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `seed_forecast_period` | Invalid period_type: % | `supabase/migrations/20261006130000_frontend_rpcs_authenticated.sql` |
| `get_ai_gateway_health` | access_denied | `supabase/migrations/20261006140000_ai_gateway_observability.sql` |
| `get_ai_gateway_partition_stats` | forbidden | `supabase/migrations/20261006140000_ai_gateway_observability.sql` |
| `get_rpc_perf_stats` | access_denied | `supabase/migrations/20261006140000_ai_gateway_observability.sql` |
| `get_top_slow_rpcs` | access_denied | `supabase/migrations/20261006140000_ai_gateway_observability.sql` |
| `get_slow_rpc_trend` | forbidden | `supabase/migrations/20261006140000_ai_gateway_observability.sql` |
| `assign_territory` | Unauthorized: user % does not manage a territory covering the requested UFs | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql` |
| `update_territory` | Unauthorized: territory % is not managed by the current user | `supabase/migrations/20261008120000_fix_frontend_rpcs_canonical.sql` |
| `capture_rpc_plan` | RPC % nao esta na allowlist de captura de plano | `supabase/migrations/20261011120000_rpc_plan_structural_hash.sql` |
| `submit_public_csat_survey` | pesquisa ou nota inválida | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `submit_public_csat_survey` | tipo de pesquisa sem escala pública configurada | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `submit_public_csat_survey` | nota fora da escala da pesquisa | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `persist_rfm_analysis` | usuário RFM não autorizado | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `persist_rfm_analysis` | análises RFM devem ser uma lista | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `persist_rfm_analysis` | limite de análises RFM excedido | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `persist_rfm_analysis` | contato RFM não pertence ao usuário | `supabase/migrations/20261011150000_restore_canonical_contracts.sql` |
| `persist_company_composite` | Autenticação e identificação obrigatórias | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Dados inválidos da empresa | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Relações devem ser listas | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Quantidade excessiva de relações | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Empresa indisponível | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | CONCURRENT_EDIT entity=companies id=% | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Empresa indisponível | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Nome da empresa obrigatório | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Empresa indisponível | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Relação inválida | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Relação indisponível | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Identificação da relação obrigatória | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_company_composite` | Número de telefone inválido | `supabase/migrations/20261011202000_atomic_company_composite.sql` |
| `persist_lead_score_results` | Operação reservada ao servidor autenticado | `supabase/migrations/20261011204000_atomic_lead_scores.sql` |
| `persist_lead_score_results` | Lote inválido | `supabase/migrations/20261011204000_atomic_lead_scores.sql` |
| `persist_lead_score_results` | Contato indisponível | `supabase/migrations/20261011204000_atomic_lead_scores.sql` |
| `claim_validation_batch` | Limites inválidos para a fila de validação | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `complete_validation_queue_item` | Confirmação exclusiva do serviço | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `complete_validation_queue_item` | Validação incompleta | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `complete_validation_queue_item` | Proprietário ou alvo da validação divergente | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `complete_validation_queue_item` | Recibo persistido ausente | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `claim_regen_batch` | Limites inválidos para a fila de perfis | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `save_behavioral_profile_if_fresh` | Perfil incompleto | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `save_behavioral_profile_if_fresh` | Contato não pertence ao usuário | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `save_behavioral_profile_if_fresh` | Proprietário do perfil divergente | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `save_behavioral_profile_if_fresh` | Reserva exclusiva do serviço | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `save_behavioral_profile_if_fresh` | Proprietário da reserva divergente | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `claim_behavioral_profile_sla` | Reserva exclusiva do serviço | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `claim_behavioral_profile_sla` | Proprietário do contato divergente | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `claim_behavioral_profile_sla` | Proprietário da reserva divergente | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `claim_behavioral_profile_sla_batch` | Reserva exclusiva do serviço | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `complete_sequence_email_delivery` | Confirmação exclusiva do serviço | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `complete_sequence_email_delivery` | Confirmação incompleta | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `complete_sequence_email_delivery` | Inscrição não pertence ao usuário | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `complete_sequence_email_delivery` | Proprietário ou passo divergente | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `complete_sequence_email_delivery` | Proprietário ou alvo do registro de envio divergente | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `complete_sequence_email_delivery` | Retomada explícita do envio legado obrigatória | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `complete_sequence_email_delivery` | Confirmação anterior divergente | `supabase/migrations/20261012210821_confirm_sequence_email_atomically.sql` |
| `confirm_sequence_manual_step` | Autenticação obrigatória | `supabase/migrations/20261012223000_confirm_manual_sequence_step.sql` |
| `confirm_sequence_manual_step` | Confirmação incompleta | `supabase/migrations/20261012223000_confirm_manual_sequence_step.sql` |
| `confirm_sequence_manual_step` | Inscrição não pertence ao usuário | `supabase/migrations/20261012223000_confirm_manual_sequence_step.sql` |
| `confirm_sequence_manual_step` | Proprietário ou etapa divergente | `supabase/migrations/20261012223000_confirm_manual_sequence_step.sql` |
| `confirm_sequence_manual_step` | Etapa manual não aguarda confirmação | `supabase/migrations/20261012223000_confirm_manual_sequence_step.sql` |
| `resume_sequence_email` | Autenticação obrigatória | `supabase/migrations/20261012234200_resume_paused_sequence_email.sql` |
| `resume_sequence_email` | Retomada incompleta | `supabase/migrations/20261012234200_resume_paused_sequence_email.sql` |
| `resume_sequence_email` | Inscrição não pertence ao usuário | `supabase/migrations/20261012234200_resume_paused_sequence_email.sql` |
| `resume_sequence_email` | Proprietário divergente ou contato excluído | `supabase/migrations/20261012234200_resume_paused_sequence_email.sql` |
| `resume_sequence_email` | Pausa alterada ou indisponível para retomada de email | `supabase/migrations/20261012234200_resume_paused_sequence_email.sql` |
| `resume_sequence_email` | Etapa de email divergente | `supabase/migrations/20261012234200_resume_paused_sequence_email.sql` |
| `dashboard_normalize_contact_phone` | Número de telefone inválido | `supabase/migrations/20261013033427_dashboard_source_contract.sql` |
| `enroll_sequence_contact` | Autenticação obrigatória | `supabase/migrations/20261013033432_live_sequence_contact.sql` |
| `enroll_sequence_contact` | Sequência ou contato indisponível | `supabase/migrations/20261013033432_live_sequence_contact.sql` |
| `enroll_sequence_contact` | Sequência ou contato indisponível | `supabase/migrations/20261013033432_live_sequence_contact.sql` |
| `enroll_sequence_contact` | Limite de inscrições atingido | `supabase/migrations/20261013033432_live_sequence_contact.sql` |
| `enroll_sequence_contact` | Inscrição indisponível | `supabase/migrations/20261013033432_live_sequence_contact.sql` |
| `guard_sequence_enrollment_write` | O destino da inscrição não pode ser alterado | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `guard_sequence_enrollment_write` | Envio pendente de confirmação; revise antes de retomar ou mesclar | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `guard_sequence_enrollment_write` | Contato indisponível para inscrição | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `guard_sequence_enrollment_write` | Sequência indisponível para inscrição | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `guard_sequence_enrollment_write` | Limite de inscrições atingido | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `guard_sequence_status_while_send` | Envio pendente de confirmação; aguarde antes de pausar a sequência | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `reserve_sequence_email_send` | Reserva exclusiva do serviço | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `reserve_sequence_email_send` | Reserva obrigatória | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `reserve_sequence_email_send` | Contato indisponível para envio | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `reserve_sequence_email_send` | Etapa indisponível para envio | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `release_sequence_email_send` | Liberação exclusiva do serviço | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `guard_contact_sequence_archive` | Envio em andamento ou sem confirmação; aguarde a conclusão antes de arquivar | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `enroll_lead_score_contact` | Automação exclusiva do serviço | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `enroll_lead_score_contact` | Automação indisponível | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `enroll_lead_score_contact` | Inscrição indisponível | `supabase/migrations/20261013033433_sequence_write_fences.sql` |
| `create_quick_interaction` | Authentication required | `supabase/migrations/20261028224000_contact_quick_interaction.sql` |
| `create_quick_interaction` | Invalid interaction | `supabase/migrations/20261028224000_contact_quick_interaction.sql` |
| `create_quick_interaction` | Invalid interaction | `supabase/migrations/20261028224000_contact_quick_interaction.sql` |
| `create_quick_interaction` | Invalid interaction | `supabase/migrations/20261028224000_contact_quick_interaction.sql` |
| `create_quick_interaction` | Contact unavailable | `supabase/migrations/20261028224000_contact_quick_interaction.sql` |
| `cleanup_cron_job_run_details` | retencao minima de 1 dia (recebido: %) | `supabase/migrations/20261108190000_cron_job_run_details_retention.sql` |
| `merge_records_atomically` | Autenticação obrigatória | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Entidade ou identificadores inválidos | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Substituições devem ser um objeto | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Override de nome_crm deve ser texto não vazio | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Override de first_name deve ser texto não vazio | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Registros inexistentes ou pertencentes a outro usuário | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Registro principal excluído | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Registro secundário indisponível | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Empresa da substituição indisponível | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Campo não permitido: % | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Campo não encontrado: % | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Nome principal obrigatório | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Vínculo indireto de outro proprietário: %.% | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Vínculo polimórfico sem proprietário: %.% | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Vínculo de outro proprietário: %.% | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Mesclagem criaria relação circular: % | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Ancestral de outro proprietário | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `merge_records_atomically` | Relação pertence a outro usuário | `supabase/migrations/20261109120000_fix_merge_nome_crm_override.sql` |
| `guard_contact_relation_write` | Contact relation write forbidden | `supabase/migrations/20261118182244_guard_contact_relation_write_fn.sql` |
| `guard_contact_relation_write` | Contact relation write forbidden | `supabase/migrations/20261118182244_guard_contact_relation_write_fn.sql` |
| `claim_behavioral_profile_retry` | Reanálise exclusiva de administrador autenticado | `supabase/migrations/20261123200000_fix_claim_behavioral_profile_retry_admin_check.sql` |
| `claim_behavioral_profile_retry` | Contato não encontrado | `supabase/migrations/20261123200000_fix_claim_behavioral_profile_retry_admin_check.sql` |
| `claim_behavioral_profile_retry` | Proprietário da reserva divergente | `supabase/migrations/20261123200000_fix_claim_behavioral_profile_retry_admin_check.sql` |
| `claim_behavioral_profile_retry` | Reanálise recente; aguarde cinco minutos | `supabase/migrations/20261123200000_fix_claim_behavioral_profile_retry_admin_check.sql` |
| `claim_behavioral_profile_retry` | Contato reservado ou em pausa temporária; aguarde para tentar novamente | `supabase/migrations/20261123200000_fix_claim_behavioral_profile_retry_admin_check.sql` |

## E. Estados, máquinas de estado e transições

### E.1 Colunas de status no banco

| Tabela | Coluna | Valores permitidos (enum/CHECK) | Default |
|---|---|---|---|
| `abm_account_plans` | `status` | `active`, `archived`, `completed`, `draft` | `draft` |
| `abm_accounts` | `status` | `active`, `closed_lost`, `closed_won`, `nurture`, `paused` | `active` |
| `abm_campaigns` | `status` | `active`, `archived`, `completed`, `draft`, `paused` | `draft` |
| `abm_whitespace_opportunities` | `status` | `dismissed`, `identified`, `lost`, `pursuing`, `won` | `identified` |
| `call_logs` | `status` | `busy`, `completed`, `failed`, `missed`, `no-answer` |  |
| `campaign_recipients` | `status` | `bounced`, `clicked`, `complained`, `delivered`, `failed`, `opened`, `pending`, `sent`, `unsubscribed` | `pending` |
| `companies` | `state` | **livre (sem enum/CHECK)** |  |
| `connection_configs` | `last_test_status` | **livre (sem enum/CHECK)** |  |
| `connection_test_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `contact_behavior` | `career_stage` | **livre (sem enum/CHECK)** |  |
| `contact_next_actions` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `contacts` | `relationship_stage` | `advocate`, `at_risk`, `customer`, `lost`, `loyal_customer`, `negotiation`, `opportunity`, `prospect`, `qualified_lead`, `unknown` | `unknown` |
| `crm_automation_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `crm_automation_reprocess_queue` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `crm_cadence_rules` | `relationship_stage` | **livre (sem enum/CHECK)** |  |
| `crm_consent_audit_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `cs_accounts` | `lifecycle_stage` | `adopting`, `at_risk`, `churned`, `mature`, `onboarding` | `onboarding` |
| `cs_qbrs` | `status` | `cancelled`, `completed`, `no_show`, `scheduled` | `scheduled` |
| `cs_renewals` | `status` | `churned`, `downgraded`, `expanded`, `in_negotiation`, `renewed`, `upcoming` | `upcoming` |
| `deal_forecasts` | `stage` | **livre (sem enum/CHECK)** |  |
| `deal_room_milestones` | `status` | `blocked`, `done`, `in_progress`, `pending` | `pending` |
| `deal_rooms` | `status` | `active`, `lost`, `paused`, `won` | `active` |
| `document_signatures` | `status` | `cancelled`, `expired`, `pending`, `rejected`, `sent`, `signed`, `viewed` | `pending` |
| `documents` | `status` | `active`, `archived`, `draft` | `active` |
| `email_campaigns` | `status` | `cancelled`, `draft`, `failed`, `paused`, `scheduled`, `sending`, `sent` | `draft` |
| `email_verifications` | `status` | `catchall`, `invalid`, `risky`, `unknown`, `valid` | `unknown` |
| `emotional_anchors` | `emotional_state` | **livre (sem enum/CHECK)** |  |
| `emotional_states_history` | `emotional_state` | **livre (sem enum/CHECK)** |  |
| `follow_up_approvals` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `follow_up_approvals_v2` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `forecast_periods` | `status` | `closed`, `open` | `open` |
| `forecast_quota_settings` | `health_weight_stage_age` | **livre (sem enum/CHECK)** | `25` |
| `handoff_requests` | `status` | `accepted`, `cancelled`, `expired`, `pending`, `rejected` | `pending` |
| `incoming_webhook_dlq` | `status` | `abandoned`, `failed`, `pending`, `processing`, `succeeded` | `pending` |
| `incoming_webhook_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `incoming_webhook_logs` | `http_status` | **livre (sem enum/CHECK)** |  |
| `interaction_summaries` | `negotiation_stage_summary` | **livre (sem enum/CHECK)** |  |
| `interactions` | `status` | `agendado`, `cancelado`, `concluido`, `pendente` |  |
| `knowledge_base_articles` | `status` | `archived`, `draft`, `published` | `draft` |
| `landing_pages` | `status` | `archived`, `draft`, `published` | `draft` |
| `lead_assignments` | `status` | `accepted`, `active`, `completed`, `expired`, `reassigned`, `rejected` | `active` |
| `lead_assignments` | `sla_status` | `breached`, `na`, `warning`, `within` | `within` |
| `lux_intelligence` | `status` | `completed`, `error`, `pending`, `processing` | `pending` |
| `mcp_tool_calls` | `status` | `denied`, `error`, `success` |  |
| `mql_classifications` | `status` | `customer`, `disqualified`, `mql`, `sql` | `mql` |
| `neuro_pnl_sessions` | `emotional_state_before` | **livre (sem enum/CHECK)** |  |
| `neuro_pnl_sessions` | `emotional_state_after` | **livre (sem enum/CHECK)** |  |
| `notification_logs` | `delivery_status` | `pending`, `rejected`, `sent`, `unknown` | `sent` |
| `nurturing_enrollments` | `status` | `active`, `cancelled`, `completed`, `failed`, `paused` | `active` |
| `nurturing_enrollments` | `current_step_index` | **livre (sem enum/CHECK)** | `0` |
| `nurturing_enrollments` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `nurturing_executions` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `nurturing_executions` | `status` | `active`, `cancelled`, `completed`, `failed`, `paused` | `active` |
| `offer_suggestions` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `phone_validations` | `status` | `invalid`, `unknown`, `unreachable`, `valid` | `unknown` |
| `reframing_analysis` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `revops_snapshots` | `funnel_stage` | `customer`, `lead`, `mql`, `opportunity`, `sql`, `visitor` |  |
| `sales_playbooks` | `stage_target` | **livre (sem enum/CHECK)** |  |
| `sequence_enrollments` | `status` | `active`, `cancelled`, `completed`, `failed`, `meeting_booked`, `paused`, `replied` | `active` |
| `sequence_enrollments` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `sequence_enrollments` | `last_step_completed_at` | **livre (sem enum/CHECK)** |  |
| `sequence_enrollments` | `last_step_sent_at` | **livre (sem enum/CHECK)** |  |
| `sequence_events` | `step_order` | **livre (sem enum/CHECK)** |  |
| `sequence_send_log` | `step_order` | **livre (sem enum/CHECK)** |  |
| `sequence_send_log` | `status` | `bounced`, `failed`, `sent`, `skipped` | `sent` |
| `sequence_steps` | `step_number` | **livre (sem enum/CHECK)** |  |
| `sequence_steps` | `step_order` | **livre (sem enum/CHECK)** | `1` |
| `sequences` | `status` | `active`, `archived`, `draft`, `paused` | `draft` |
| `smart_notifications` | `status` | `clicked`, `delivered`, `dismissed`, `pending`, `snoozed`, `suppressed` | `pending` |
| `sms_campaign_recipients` | `status` | `delivered`, `failed`, `opted_out`, `pending`, `sent` | `pending` |
| `sms_campaigns` | `status` | `cancelled`, `draft`, `failed`, `paused`, `scheduled`, `sending`, `sent` | `draft` |
| `social_sync_queue` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `suggested_life_events` | `status` | `accepted`, `pending`, `rejected` | `pending` |
| `suggested_rapport_intel` | `status` | `approved`, `pending`, `rejected` | `pending` |
| `support_tickets` | `status` | `cancelled`, `closed`, `in_progress`, `open`, `resolved`, `waiting_customer`, `waiting_internal` | `open` |
| `system_health_snapshots` | `status` | `degraded`, `healthy`, `unhealthy` |  |
| `validation_queue` | `status` | `pending`, `processing`, `done`, `error` | `pending` |
| `whatsapp_ingestion_logs` | `status` | **livre (sem enum/CHECK)** |  |
| `whatsapp_instances` | `status` | `connected`, `connecting`, `disconnected`, `error`, `qr_code` | `disconnected` |
| `whatsapp_messages` | `status` | `delivered`, `failed`, `pending`, `played`, `read`, `sent` | `pending` |
| `migration_password_reset_log` | `status` | `failed`, `pending`, `sent`, `skipped` |  |
| `calendar_events` | `status` | `cancelled`, `completed`, `confirmed`, `scheduled`, `tentative` | `scheduled` |
| `campaigns` | `status` | `active`, `archived`, `cancelled`, `completed`, `draft`, `paused` | `draft` |
| `commissions` | `status` | `approved`, `cancelled`, `paid`, `pending` | `pending` |
| `company_addresses` | `estado` | **livre (sem enum/CHECK)** |  |
| `deal_competitors` | `status` | `competing`, `lost_to`, `won_against` | `competing` |
| `deal_velocity_analysis` | `stage_velocity` | **livre (sem enum/CHECK)** |  |
| `deal_velocity_analysis` | `bottleneck_stage` | **livre (sem enum/CHECK)** |  |
| `interaction_templates` | `for_stage` | **livre (sem enum/CHECK)** |  |
| `meetings` | `status` | `cancelled`, `completed`, `confirmed`, `no_show`, `scheduled` | `scheduled` |
| `proposals` | `status` | `aceita`, `enviada`, `expirada`, `rascunho`, `rejeitada`, `visualizada` | `rascunho` |
| `relationship_score_history` | `stage` | **livre (sem enum/CHECK)** |  |
| `relationship_score_history` | `previous_stage` | **livre (sem enum/CHECK)** |  |
| `scheduled_visits` | `status` | `cancelled`, `completed`, `no_show`, `rescheduled`, `scheduled` | `scheduled` |
| `sync_log` | `status` | **livre (sem enum/CHECK)** |  |
| `cadence_enrollments` | `current_step` | **livre (sem enum/CHECK)** | `1` |
| `cadence_enrollments` | `status` | `active`, `bounced`, `completed`, `opted_out`, `paused`, `replied` | `active` |
| `campaign_members` | `status` | `active`, `bounced`, `completed`, `opted_out`, `pending`, `unsubscribed` | `pending` |
| `company_cadences` | `current_step` | **livre (sem enum/CHECK)** | `1` |
| `company_cadences` | `status` | `active`, `archived`, `completed`, `paused` | `active` |
| `contact_addresses` | `estado` | **livre (sem enum/CHECK)** |  |
| `stg_portal_sicoob` | `match_status` | **livre (sem enum/CHECK)** | `NEW` |
| `stg_bcb_sicoob` | `match_status` | **livre (sem enum/CHECK)** | `NEW` |
| `stg_site_sicoob_pacs` | `match_status` | **livre (sem enum/CHECK)** | `NEW` |
| `sales` | `status` | `cancelled`, `completed`, `discovery`, `lead`, `negotiation`, `pending`, `proposal`, `qualification` | `pending` |
| `products` | `status` | **livre (sem enum/CHECK)** | `ativo` |
| `deal_stage_history` | `stage` | **livre (sem enum/CHECK)** |  |
| `playbooks` | `stage` | **livre (sem enum/CHECK)** |  |
| `sales_tasks` | `status` | `pending`, `in_progress`, `completed`, `cancelled` | `pending` |
| `cadence_steps` | `step_order` | **livre (sem enum/CHECK)** | `0` |
| `prospect_cadences` | `status` | `active`, `cancelled`, `completed`, `paused` | `active` |
| `prospect_cadences` | `current_step` | **livre (sem enum/CHECK)** | `0` |
| `cadence_tasks` | `status` | `completed`, `pending`, `skipped` | `pending` |
| `sales_battles` | `status` | `active`, `completed`, `upcoming` | `upcoming` |
| `competitive_seasons` | `status` | `active`, `completed`, `upcoming` | `upcoming` |
| `weekly_matchups` | `status` | `active`, `completed` | `active` |
| `tournaments` | `status` | `active`, `cancelled`, `completed`, `registration` | `registration` |
| `tournament_participants` | `status` | `active`, `eliminated`, `runner_up`, `winner` | `active` |
| `tournament_matches` | `status` | `active`, `completed`, `pending` | `pending` |
| `performance_bets` | `status` | `active`, `cancelled`, `lost`, `won` | `active` |
| `reauthentication_requests` | `status` | `expired`, `failed`, `pending`, `verified` | `pending` |
| `webauthn_credentials` | `backup_state` | **livre (sem enum/CHECK)** | `false` |
| `password_reset_requests` | `status` | `approved`, `expired`, `pending`, `rejected` | `pending` |
| `client_portfolio` | `status` | `active`, `inactive` | `inactive` |
| `bitrix24_sync_logs` | `status` | **livre (sem enum/CHECK)** | `success` |
| `email_logs` | `status` | **livre (sem enum/CHECK)** | `sent` |
| `quotes` | `status` | `approved`, `draft`, `expired`, `rejected`, `sent` | `draft` |
| `quote_sync_logs` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `supplier_orders` | `status` | `cancelled`, `confirmed`, `delivered`, `pending`, `shipped` | `pending` |
| `digital_signatures` | `status` | `draft`, `expired`, `pending`, `rejected`, `signed` | `draft` |
| `document_signers` | `status` | `pending`, `rejected`, `signed` | `pending` |
| `stg_pesquisa_singulares` | `situacao_cadastral_rfb` | **livre (sem enum/CHECK)** |  |
| `stg_pesquisa_singulares` | `status_pesquisa` | `CLONE_MERGEADO`, `CNPJ_TERCEIRO`, `INCORPORADA`, `INVESTIGAR`, `PAC_DISFARÇADO`, `RECLASSIFICADO`, `SINGULAR_LEGÍTIMA` |  |
| `data_quality_audits` | `status` | **livre (sem enum/CHECK)** | `CONCLUIDO` |
| `staging_portal_sicoob` | `estado` | **livre (sem enum/CHECK)** |  |
| `supplier_homologations` | `status` | `pendente`, `em_analise`, `homologado`, `reprovado`, `suspenso`, `vencido` | `pendente` |
| `carrier_homologations` | `status` | `pendente`, `em_analise`, `homologado`, `reprovado`, `suspenso`, `vencido` | `pendente` |
| `zapp_history.whatsapp_connections` | `status` | `banned`, `connected`, `connecting`, `disconnected`, `error`, `qr_pending` | `disconnected` |
| `zapp_history.conversations` | `status` | `archived`, `closed`, `open`, `pending`, `resolved`, `spam` | `open` |
| `zapp_history.messages` | `embedding_status` | `done`, `failed`, `pending`, `processing`, `skipped` | `pending` |
| `zapp_history.messages` | `delivery_status` | **livre (sem enum/CHECK)** |  |
| `zapp_history.messages` | `funnel_stage` | **livre (sem enum/CHECK)** |  |
| `zapp_history.messages` | `journey_stage` | **livre (sem enum/CHECK)** |  |
| `zapp_history.messages` | `emotional_state` | **livre (sem enum/CHECK)** |  |
| `zapp_history.messages` | `relationship_status` | **livre (sem enum/CHECK)** |  |
| `zapp_history.message_media` | `download_status` | `downloaded`, `downloading`, `expired`, `failed`, `pending` | `pending` |
| `zapp_history.message_audio` | `transcription_status` | `done`, `failed`, `pending`, `processing`, `skipped` | `pending` |
| `zapp_history.message_links` | `fetch_status` | `blocked`, `done`, `failed`, `fetching`, `pending`, `skipped` | `pending` |
| `zapp_history.async_request_log` | `status` | **livre (sem enum/CHECK)** | `dispatched` |
| `zapp_history.location_dictionary` | `state` | **livre (sem enum/CHECK)** |  |
| `singu_migration._checklist` | `step_number` | **livre (sem enum/CHECK)** |  |
| `singu_migration._checklist` | `step_name` | **livre (sem enum/CHECK)** |  |
| `singu_migration._checklist` | `status` | `done`, `error`, `in_progress`, `pending`, `skipped` | `pending` |
| `deals` | `status` | `lost`, `on_hold`, `open`, `won` | `open` |
| `deals` | `pipeline_stage` | **livre (sem enum/CHECK)** |  |
| `pipeline_stage_transitions` | `from_stage` | **livre (sem enum/CHECK)** |  |
| `pipeline_stage_transitions` | `to_stage` | **livre (sem enum/CHECK)** |  |
| `sm_upload_mapping` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `xbz_upload_mapping` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `asia_upload_mapping` | `status` | **livre (sem enum/CHECK)** | `pending` |
| `tasks` | `status` | `cancelled`, `completed`, `in_progress`, `pending` | `pending` |
| `inactivity_alerts` | `status` | `active`, `dismissed`, `resolved`, `snoozed` |  |
| `automation_executions` | `status` | `cancelled`, `completed`, `failed`, `pending`, `running` |  |
| `integrations` | `sync_status` | **livre (sem enum/CHECK)** |  |
| `sales_opportunities` | `status` | `identified`, `lost`, `negotiation`, `on_hold`, `proposal`, `qualified`, `won` |  |
| `ai_gateway_metrics` | `status` | `error`, `rate_limited`, `success`, `timeout` |  |
| `ai_gateway_metrics` | `http_status` | **livre (sem enum/CHECK)** |  |
| `rodizio_distribuicao_staging` | `status` | `APLICADO`, `APROVADO`, `RASCUNHO`, `REJEITADO` | `RASCUNHO` |
| `cidades` | `estado_ibge` | **livre (sem enum/CHECK)** |  |
| `_dormant.inactivity_alerts` | `status` | **livre (sem enum/CHECK)** | `active` |
| `sequence_email_reservations` | `current_step` | **livre (sem enum/CHECK)** |  |
| `sequence_email_reservations` | `step_order` | **livre (sem enum/CHECK)** |  |

### E.2 Mapas de transição declarados no código

_nenhum mapa explícito encontrado — transições só existem implicitamente nos `if`s (veja E.3)_

### E.3 Valores de status usados no código (escreve / compara / filtra)

| Campo | Valor | Uso | Onde |
|---|---|---|---|
| `type` | `AAAA` | compara | `supabase/functions/_shared/safe-http_test.ts` |
| `type` | `ADD_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `BOOLEAN` | escreve | `src/pages/AdminFieldMapping.tsx` |
| `type` | `DISMISS_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `ENFJ` | escreve | `src/types/mbti.ts` |
| `type` | `ENFP` | escreve | `src/types/mbti.ts` |
| `type` | `ENTJ` | escreve | `src/domain/demoEntities.ts`<br>`src/types/mbti.ts` |
| `type` | `ENTP` | escreve | `src/types/mbti.ts` |
| `type` | `ESFJ` | escreve | `src/types/mbti.ts` |
| `type` | `ESFP` | escreve | `src/types/mbti.ts` |
| `type` | `ESTJ` | escreve | `src/types/mbti.ts` |
| `type` | `ESTP` | escreve | `src/types/mbti.ts` |
| `type` | `INFJ` | escreve | `src/types/mbti.ts` |
| `type` | `INFP` | escreve | `src/types/mbti.ts` |
| `type` | `INTEGER` | escreve | `src/pages/AdminFieldMapping.tsx` |
| `type` | `INTJ` | escreve | `src/types/mbti.ts` |
| `type` | `INTP` | escreve | `src/types/mbti.ts` |
| `type` | `ISFJ` | escreve | `src/types/mbti.ts` |
| `type` | `ISFP` | escreve | `src/types/mbti.ts` |
| `type` | `ISTJ` | escreve | `src/types/mbti.ts` |
| `type` | `ISTP` | escreve | `src/types/mbti.ts` |
| `type` | `NUMERIC` | escreve | `src/pages/AdminFieldMapping.tsx` |
| `type` | `PHONE` | escreve | `supabase/functions/evolution-bitrix-connector/index.ts` |
| `type` | `PUSH_SUBSCRIPTION_CHANGED` | compara, escreve | `public/sw-push.js`<br>`src/hooks/useNotifications.ts` |
| `type` | `RELATIVE` | escreve | `src/hooks/useEntity360.ts` |
| `type` | `REMOVE_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `SKIP_WAITING` | compara | `public/sw-push.js` |
| `type` | `TEXT` | escreve | `src/pages/AdminFieldMapping.tsx` |
| `type` | `UPDATE_TOAST` | compara, escreve | `src/hooks/use-toast.ts` |
| `type` | `UUID` | escreve | `src/pages/AdminFieldMapping.tsx` |
| `type` | `accepting_feedback` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `achievement` | compara | `src/components/contact-detail/life-events/LifeEventsTimeline.tsx` |
| `type` | `acknowledge_more` | compara, escreve | `src/data/carnegieTalkRatio.ts` |
| `type` | `acknowledging_limitation` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `active_listening` | escreve | `src/data/carnegieGenuineInterest.ts` |
| `type` | `add_tag` | compara, escreve | `src/components/automation/ActionConfigForm.tsx`<br>`src/components/automation/AutomationTemplates.tsx` |
| `type` | `admitting_mistake` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `alert` | escreve | `src/hooks/useRealtimeNotifications.ts`<br>`src/hooks/useUnifiedTimeline.ts` |
| `type` | `alignment` | compara, escreve | `src/components/stakeholders/CoalitionDetectionPanel.tsx`<br>`src/hooks/useCoalitionDetection.ts` |
| `type` | `analogy` | escreve | `src/data/carnegieStorytelling.ts` |
| `type` | `analysis_paralysis` | escreve | `src/hooks/useAdvancedTriggers.ts` |
| `type` | `anniversary` | compara, escreve | `src/components/contact-detail/life-events/LifeEventsGapChecklist.tsx`<br>`src/components/dashboard/important-dates/EventCard.tsx`<br>`src/hooks/useImportantDates.ts` |
| `type` | `array` | compara, escreve | `src/hooks/useContactSegmentation.ts`<br>`supabase/functions/_shared/validate.ts`<br>`supabase/functions/_shared/validate_test.ts`<br>`supabase/functions/abm-whitespace-analyzer/index.ts`<br>`supabase/functions/ai-writing-assistant/index.ts`<br>… +13 |
| `type` | `ask_more` | compara, escreve | `src/data/carnegieTalkRatio.ts`<br>`src/types/carnegie.ts` |
| `type` | `asking_for_help` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `at_risk` | compara, escreve, filtra | `src/components/contact-detail/CRMAlertsWidget.tsx`<br>`src/hooks/useCRMAlerts.ts`<br>`src/hooks/useUnifiedTimeline.ts`<br>`supabase/functions/client-notifications/index.ts` |
| `type` | `audio` | compara | `src/hooks/useUnifiedHistory.ts` |
| `type` | `before_after` | escreve | `src/data/carnegieStorytelling.ts` |
| `type` | `behavior` | escreve | `src/components/crm/RelationshipKPIsDashboard.tsx` |
| `type` | `birthday` | compara, escreve | `public/sw-push.js`<br>`src/components/contact-detail/life-events/LifeEventsGapChecklist.tsx`<br>`src/components/contact-detail/life-events/LifeEventsTimeline.tsx`<br>`src/components/dashboard/important-dates/EventCard.tsx`<br>`src/hooks/useImportantDates.ts`<br>… +5 |
| `type` | `birthday-wished` | escreve | `src/components/smart-reminders/SmartRemindersPanel.tsx` |
| `type` | `blocker` | compara | `src/components/analytics/churn/ChurnHelpers.tsx` |
| `type` | `boolean` | compara, escreve | `src/lib/reports/reportEngine.ts`<br>`supabase/functions/_shared/validate.ts`<br>`supabase/functions/_shared/validate_test.ts`<br>`supabase/functions/conversation-analyzer/index.ts`<br>`supabase/functions/conversational-search/index.ts`<br>… +6 |
| `type` | `brain` | compara, escreve | `src/components/neuromarketing/NeuroABTracker.tsx`<br>`src/components/neuromarketing/NeuroTooltipSystem.tsx` |
| `type` | `brain_shift` | escreve | `src/components/neuromarketing/NeuroAlerts.tsx` |
| `type` | `breakthrough` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `button` | compara, escreve | `src/components/email-builder/EmailBuilder.tsx`<br>`src/components/email-builder/types.ts`<br>`src/lib/emailBuilderRenderer.ts`<br>`src/pages/PublicLandingPage.tsx` |
| `type` | `call` | compara, escreve, filtra | `src/components/company-detail/timeline/UnifiedTimelineSection.tsx`<br>`src/components/contact-detail/ContactInteractionsTab.tsx`<br>`src/components/dashboard/DashboardCharts.tsx`<br>`src/components/dashboard/RecentActivityCard.tsx`<br>`src/components/interactions/UnifiedCommunicationHistory.tsx`<br>… +5 |
| `type` | `caring` | compara | `src/hooks/useCarnegieAnalysis.ts` |
| `type` | `celebration` | compara | `public/sw-push.js` |
| `type` | `challenge_overcome` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `champion` | compara | `src/components/analytics/churn/ChurnHelpers.tsx` |
| `type` | `change` | escreve | `src/components/pwa/NetworkComponents.tsx` |
| `type` | `checkbox` | compara | `src/components/marketing/PublicFormRenderer.tsx` |
| `type` | `chemical` | compara, escreve | `src/components/neuromarketing/NeuroABTracker.tsx`<br>`src/components/neuromarketing/NeuroTooltipSystem.tsx` |
| `type` | `chemical_spike` | escreve | `src/components/neuromarketing/NeuroAlerts.tsx` |
| `type` | `choose_approach` | compara, escreve | `src/components/neuromarketing/NeuroTrainingMode.tsx`<br>`src/data/neuroTrainingQuestions.ts` |
| `type` | `churn_risk` | compara, escreve | `public/sw-push.js`<br>`src/hooks/usePortfolioHealth.ts` |
| `type` | `closing` | escreve | `src/components/triggers/ProfileBasedSuggestions.tsx` |
| `type` | `closing_score` | filtra | `src/hooks/useClosingScoreAlerts.ts` |
| `type` | `collaboration` | compara, escreve | `src/components/stakeholders/StakeholderInfluenceNetwork.tsx` |
| `type` | `combined` | escreve | `src/data/nlpTrainingScenarios.ts` |
| `type` | `command` | escreve | `src/data/copywritingData.ts` |
| `type` | `communication_gap` | escreve | `src/hooks/useBehaviorAlerts.ts` |
| `type` | `company` | compara, escreve | `src/components/intelligence/Entity360Tab.tsx`<br>`src/components/network/NetworkVisualization.tsx`<br>`src/components/network/network-parts/NetworkSelectedNodePanel.tsx`<br>`src/components/quick-add/QuickAddButton.tsx`<br>`src/components/recently-viewed/RecentlyViewedSection.tsx`<br>… +6 |
| `type` | `company_created` | escreve | `src/types/index.ts` |
| `type` | `confetti` | compara | `src/hooks/useSuccessCelebration.ts` |
| `type` | `conflict` | compara, escreve | `src/components/stakeholders/CoalitionDetectionPanel.tsx`<br>`src/components/stakeholders/StakeholderInfluenceNetwork.tsx`<br>`src/hooks/useCoalitionDetection.ts` |
| `type` | `connected` | escreve | `src/hooks/useNetworkGraph.ts` |
| `type` | `consistency` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `contact` | compara, escreve | `src/components/intelligence/CrossRefTab.tsx`<br>`src/components/intelligence/Entity360Tab.tsx`<br>`src/components/network/NetworkVisualization.tsx`<br>`src/components/quick-add/QuickAddButton.tsx`<br>`src/components/recently-viewed/RecentlyViewedSection.tsx`<br>… +8 |
| `type` | `contacts` | escreve | `src/hooks/useSavedFilters.ts` |
| `type` | `contract_renewal` | compara | `src/components/dashboard/important-dates/EventCard.tsx` |
| `type` | `contrast` | escreve | `src/data/carnegieStorytelling.ts` |
| `type` | `create_alert` | compara, escreve | `src/components/automation/ActionConfigForm.tsx`<br>`src/components/automation/AutomationTemplates.tsx`<br>`src/pages/automacoes/RuleFormDialog.tsx` |
| `type` | `create_task` | compara, escreve | `src/components/automation/ActionConfigForm.tsx`<br>`src/components/automation/AutomationTemplates.tsx` |
| `type` | `created` | escreve | `src/hooks/useCompanies.ts`<br>`src/hooks/useContacts.ts`<br>`src/hooks/useInteractions.ts` |
| `type` | `critical_health` | escreve | `src/hooks/usePortfolioHealth.ts` |
| `type` | `cs_health_drop` | escreve | `supabase/functions/cs-health-recalc/index.ts` |
| `type` | `custom` | compara, escreve | `src/components/neuromarketing/NeuroTooltipSystem.tsx`<br>`src/hooks/useImportantDates.ts` |
| `type` | `date` | compara, escreve | `src/components/inline-edit/InlineEdit.tsx`<br>`src/lib/reports/reportEngine.ts` |
| `type` | `deal` | compara, escreve, filtra | `src/components/lead-score/LeadScoreWidget.tsx`<br>`src/hooks/useEntity360.ts` |
| `type` | `decay` | compara, escreve | `src/components/smart-reminders/smart-reminders-parts/ReminderCard.tsx`<br>`supabase/functions/smart-reminders/index.ts` |
| `type` | `decision_made` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `delay_tactic` | escreve | `src/hooks/useAdvancedTriggers.ts` |
| `type` | `deleted` | escreve | `src/hooks/useInteractions.ts` |
| `type` | `direct_judgment` | escreve | `src/types/carnegie-extended.ts` |
| `type` | `disc` | escreve | `src/components/nlp/CommunicationCoherencePanel.tsx`<br>`src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `divider` | compara, escreve | `src/components/email-builder/EmailBuilder.tsx`<br>`src/components/email-builder/types.ts`<br>`src/lib/emailBuilderRenderer.ts`<br>`src/pages/PublicLandingPage.tsx` |
| `type` | `ebook` | escreve | `src/hooks/useLeadMagnets.ts`<br>`src/pages/MarketingHub.tsx` |
| `type` | `email` | compara, escreve, filtra | `src/components/contact-detail/ContactEmailThreadsSection.tsx`<br>`src/components/dashboard/DashboardCharts.tsx`<br>`src/components/dashboard/RecentActivityCard.tsx`<br>`src/hooks/useNurturingWorkflows.ts`<br>`src/hooks/useUnifiedTimeline.ts`<br>… +3 |
| `type` | `emotion_content` | escreve | `src/components/nlp/IncongruenceDetector.tsx` |
| `type` | `empathy` | compara | `src/hooks/useCarnegieAnalysis.ts` |
| `type` | `enroll_in_sequence` | escreve | `src/components/automation/AutomationTemplates.tsx` |
| `type` | `enum` | escreve | `src/lib/reports/reportEngine.ts` |
| `type` | `eq` | compara, escreve | `src/components/contact-detail/ContactBehavioralTab.tsx`<br>`src/components/contact-detail/ContactCommercialTab.tsx`<br>`src/components/contact-detail/DuplicateManagementPanel.tsx`<br>`src/components/contact-detail/behavioral-tab/EqDashboardCard.tsx`<br>`src/components/contacts/ExternalContactLookupDialog.tsx`<br>… +64 |
| `type` | `error` | compara | `src/lib/queryErrorReporter.ts` |
| `type` | `error_budget_100` | escreve | `supabase/functions/error-budget/index.ts` |
| `type` | `error_budget_50` | escreve | `supabase/functions/error-budget/index.ts` |
| `type` | `error_budget_75` | escreve | `supabase/functions/error-budget/index.ts` |
| `type` | `error_spike` | escreve | `supabase/functions/connection-anomaly-detector/index.ts` |
| `type` | `event` | escreve | `src/hooks/useUnifiedTimeline.ts` |
| `type` | `exclusive` | compara, escreve | `src/components/nlp/CopywritingSalesTools.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `exists` | escreve | `src/hooks/useContactSegmentation.ts` |
| `type` | `expressing_uncertainty` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `family` | escreve | `src/components/contact-detail/life-events/LifeEventsGapChecklist.tsx` |
| `type` | `financial` | compara | `src/components/neuromarketing/PainClaimGainBuilder.tsx` |
| `type` | `fireworks` | compara | `src/hooks/useSuccessCelebration.ts` |
| `type` | `first_purchase` | compara | `src/components/dashboard/important-dates/EventCard.tsx` |
| `type` | `follow-up-complete` | escreve | `src/components/smart-reminders/SmartRemindersPanel.tsx`<br>`src/pages/Calendario.tsx` |
| `type` | `follow_up` | compara, escreve | `src/data/carnegieGenuineInterest.ts`<br>`src/hooks/useSmartReminders.ts`<br>`supabase/functions/smart-reminders/index.ts` |
| `type` | `followup` | compara, escreve | `public/sw-push.js`<br>`src/components/triggers/ProfileBasedSuggestions.tsx`<br>`src/hooks/useNotifications.ts`<br>`supabase/functions/check-notifications/index.ts` |
| `type` | `formal` | escreve | `src/types/carnegie.ts` |
| `type` | `frequent` | escreve | `src/components/ficha-360/TagsInteresseCard.tsx` |
| `type` | `function` | escreve | `supabase/functions/abm-whitespace-analyzer/index.ts`<br>`supabase/functions/ai-writing-assistant/index.ts`<br>`supabase/functions/conversation-analyzer/index.ts`<br>`supabase/functions/conversational-search/index.ts`<br>`supabase/functions/deal-room-health/index.ts`<br>… +14 |
| `type` | `generic` | compara | `src/components/feedback/ErrorState.tsx` |
| `type` | `goal-achieved` | escreve | `src/components/onboarding/steps/CompletionStep.tsx`<br>`src/components/smart-reminders/SmartRemindersPanel.tsx` |
| `type` | `goal_achieved` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `greeting` | compara, escreve | `src/hooks/useCarnegieAnalysis.ts`<br>`src/types/carnegie-extended.ts`<br>`src/types/carnegie.ts` |
| `type` | `guarantee` | compara, escreve | `src/components/nlp/CopywritingSalesTools.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `habit_formed` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `heading` | compara, escreve | `src/components/email-builder/EmailBuilder.tsx`<br>`src/components/email-builder/types.ts`<br>`src/lib/emailBuilderRenderer.ts`<br>`src/pages/PublicLandingPage.tsx` |
| `type` | `health_alert` | compara, escreve | `public/sw-push.js`<br>`src/hooks/useRealtimeNotifications.ts`<br>`supabase/functions/check-health-alerts/index.ts`<br>`supabase/functions/client-notifications/index.ts` |
| `type` | `hero_journey` | escreve | `src/data/carnegieStorytelling.ts` |
| `type` | `hobby` | compara, escreve | `src/components/contact-detail/behavioral-tab/RapportCard.tsx`<br>`src/components/dashboard/widgets/AIApprovalsWidget.tsx`<br>`src/components/ficha-360/DadosPessoaisCard.tsx`<br>`src/components/ficha-360/TagsInteresseCard.tsx`<br>`src/hooks/useAIApprovals.ts`<br>… +1 |
| `type` | `how_to` | escreve | `src/data/copywritingData.ts` |
| `type` | `identify_brain` | compara, escreve | `src/components/neuromarketing/NeuroTrainingMode.tsx`<br>`src/data/neuroTrainingQuestions.ts` |
| `type` | `image` | compara, escreve | `src/components/email-builder/EmailBuilder.tsx`<br>`src/components/email-builder/types.ts`<br>`src/lib/emailBuilderRenderer.ts`<br>`src/pages/PublicLandingPage.tsx` |
| `type` | `image_url` | escreve | `supabase/functions/visual-search/index.ts` |
| `type` | `impersonal` | escreve | `src/data/carnegieWarmth.ts` |
| `type` | `improvement_noted` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `in` | compara, escreve | `src/components/intelligence/CrossRefTab.tsx`<br>`src/hooks/useCrossReference.ts`<br>`src/hooks/useExternalInteractions.ts`<br>`src/pages/cadastro/RelationshipList.tsx`<br>`supabase/functions/_shared/tenant-guard_test.ts`<br>… +1 |
| `type` | `influence` | compara, escreve | `src/components/stakeholders/CoalitionDetectionPanel.tsx`<br>`src/components/stakeholders/StakeholderInfluenceNetwork.tsx`<br>`src/components/stakeholders/stakeholder-network/NetworkHelpers.ts`<br>`src/hooks/useCoalitionDetection.ts` |
| `type` | `input_file` | escreve | `supabase/functions/voice-to-text/index.ts` |
| `type` | `insight` | compara, escreve | `public/sw-push.js`<br>`src/hooks/useRealtimeNotifications.ts`<br>`supabase/functions/check-notifications/index.ts` |
| `type` | `integer` | compara, escreve | `supabase/functions/_shared/validate.ts`<br>`supabase/functions/_shared/validate_test.ts`<br>`supabase/functions/conversation-analyzer/index.ts`<br>`supabase/functions/conversation-coaching-digest/index.ts`<br>`supabase/functions/lead-scorer/index.ts`<br>… +2 |
| `type` | `interacted` | compara, escreve | `src/components/network/NetworkVisualization.tsx`<br>`src/hooks/useNetworkGraph.ts` |
| `type` | `interaction` | compara, escreve | `src/components/contact-detail/RelationshipTimeline.tsx`<br>`src/components/crm/RelationshipKPIsDashboard.tsx`<br>`src/components/quick-add/QuickAddButton.tsx`<br>`src/components/search/GlobalSearch.tsx`<br>`src/components/search/global-search/SearchLocalGroups.tsx` |
| `type` | `interest` | escreve | `src/components/ficha-360/TagsInteresseCard.tsx`<br>`src/hooks/useSocialIntelligence.ts`<br>`supabase/functions/social-profile-scraper/index.ts` |
| `type` | `invalido` | compara | `src/components/contact-detail/data-tab/PhonesCard.tsx` |
| `type` | `is` | escreve | `src/components/enroll/EnrollContactDialog.tsx`<br>`src/components/sequences/SequenceEnrollDialog.tsx`<br>`src/hooks/useCompanies.ts`<br>`src/hooks/useContacts.ts` |
| `type` | `json_object` | escreve | `supabase/functions/ai-email-refine/index.ts`<br>`supabase/functions/email-thread-summary/index.ts` |
| `type` | `latency_degradation` | escreve | `supabase/functions/connection-anomaly-detector/index.ts` |
| `type` | `lead_score_threshold` | escreve | `supabase/functions/lead-score-threshold-runner/index.ts` |
| `type` | `life_event` | escreve | `src/components/contact-detail/RelationshipTimeline.tsx`<br>`supabase/functions/check-notifications/index.ts`<br>`supabase/functions/client-notifications/index.ts` |
| `type` | `listen_more` | compara, escreve | `src/data/carnegieTalkRatio.ts` |
| `type` | `match_stimulus` | compara, escreve | `src/components/neuromarketing/NeuroTrainingMode.tsx`<br>`src/data/neuroTrainingQuestions.ts` |
| `type` | `meeting` | compara, escreve | `public/sw-push.js`<br>`src/components/dashboard/DashboardCharts.tsx`<br>`src/components/dashboard/RecentActivityCard.tsx`<br>`src/hooks/useDashboardStats.ts`<br>`src/hooks/useUnifiedTimeline.ts` |
| `type` | `meeting_reminder` | compara | `public/sw-push.js` |
| `type` | `memory_reference` | escreve | `src/data/carnegieGenuineInterest.ts` |
| `type` | `message` | compara, escreve | `src/components/crm/CadenceRulesConfig.tsx`<br>`src/components/dashboard/StrategicNextStepsCard.tsx`<br>`src/hooks/useDashboardStats.ts` |
| `type` | `meta_detection` | escreve | `src/data/nlpTrainingScenarios.ts` |
| `type` | `metaprogram` | escreve | `src/components/nlp/CommunicationCoherencePanel.tsx`<br>`src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `milestone` | compara, escreve | `src/components/dashboard/important-dates/EventCard.tsx`<br>`src/hooks/useImportantDates.ts`<br>`supabase/functions/smart-reminders/index.ts` |
| `type` | `milestone_reached` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `milton` | escreve | `src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `mirroring` | escreve | `src/data/carnegieEmpathyTemplates.ts` |
| `type` | `month` | escreve | `src/hooks/useForecasting.ts` |
| `type` | `must_have` | escreve | `src/types/nlp-advanced.ts` |
| `type` | `nba_escalation` | escreve | `supabase/functions/smart-reminders/index.ts` |
| `type` | `negative` | compara, escreve | `src/components/nlp/AnchorTrackingSystem.tsx` |
| `type` | `neq` | escreve | `src/hooks/useTasks.ts` |
| `type` | `network` | compara | `src/components/feedback/ErrorState.tsx` |
| `type` | `neuro_update` | compara, escreve | `src/components/contact-detail/UnifiedTimeline.tsx`<br>`src/hooks/useUnifiedTimeline.ts` |
| `type` | `neutral` | compara, escreve | `src/components/analytics/churn/ChurnHelpers.tsx`<br>`src/hooks/useCoalitionDetection.ts` |
| `type` | `no_contact` | escreve | `src/hooks/usePortfolioHealth.ts` |
| `type` | `normalization` | escreve | `src/data/carnegieEmpathyTemplates.ts` |
| `type` | `notFound` | compara | `src/components/feedback/ErrorState.tsx` |
| `type` | `note` | escreve | `src/components/dashboard/StrategicNextStepsCard.tsx`<br>`src/components/interactions/insights/SuggestedResponseModal.tsx`<br>`supabase/functions/_shared/validation-contract_test.ts` |
| `type` | `number` | compara, escreve | `src/components/contact-detail/behavioral-tab/PersonalityFrameworkInsights.tsx`<br>`src/components/crm/marketing/components/BehavioralSegmentation.tsx`<br>`src/hooks/useContactSegmentation.ts`<br>`src/lib/reports/reportEngine.ts`<br>`supabase/functions/_shared/validate.ts`<br>… +12 |
| `type` | `number_list` | escreve | `src/data/copywritingData.ts` |
| `type` | `object` | compara, escreve | `supabase/functions/_shared/validate.ts`<br>`supabase/functions/_shared/validate_test.ts`<br>`supabase/functions/abm-whitespace-analyzer/index.ts`<br>`supabase/functions/ai-writing-assistant/index.ts`<br>`supabase/functions/connection-tester/index.ts`<br>… +19 |
| `type` | `objection` | escreve | `src/components/crm/RelationshipKPIsDashboard.tsx`<br>`src/components/triggers/ProfileBasedSuggestions.tsx` |
| `type` | `opening` | escreve | `src/components/triggers/ProfileBasedSuggestions.tsx`<br>`src/components/triggers/profile-based/generateCombinedMessage.ts` |
| `type` | `opportunity` | escreve | `src/components/neuromarketing/NeuroAlerts.tsx` |
| `type` | `opposition` | compara, escreve | `src/hooks/useCoalitionDetection.ts` |
| `type` | `page` | compara, escreve | `src/components/search/GlobalSearch.tsx`<br>`src/components/search/global-search/SearchLocalGroups.tsx` |
| `type` | `password` | escreve | `src/components/admin/conexoes/ConnectionFormDialog.tsx` |
| `type` | `permutation_heuristic` | escreve | `supabase/functions/email-finder/index.ts` |
| `type` | `personal` | compara | `src/components/neuromarketing/PainClaimGainBuilder.tsx`<br>`src/hooks/useCarnegieAnalysis.ts` |
| `type` | `personal_detail` | escreve | `src/data/carnegieGenuineInterest.ts` |
| `type` | `phone` | compara | `src/components/marketing/PublicFormRenderer.tsx` |
| `type` | `positive` | compara, escreve | `src/components/nlp/AnchorTrackingSystem.tsx`<br>`src/hooks/useCarnegieAnalysis.ts`<br>`src/types/nlp-advanced.ts` |
| `type` | `positive_momentum` | compara, escreve | `src/components/analytics/BehaviorAlertsPanel.tsx`<br>`src/hooks/useBehaviorAlerts.ts` |
| `type` | `price_anchor` | escreve | `src/hooks/useAdvancedTriggers.ts` |
| `type` | `primary` | compara, escreve | `src/components/nlp/CopywritingSalesTools.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `problem_solution` | escreve | `src/data/carnegieStorytelling.ts` |
| `type` | `promotion` | compara, escreve | `src/components/contact-detail/life-events/LifeEventsGapChecklist.tsx`<br>`src/components/contact-detail/life-events/LifeEventsTimeline.tsx` |
| `type` | `public-key` | escreve | `src/hooks/useWebAuthn.ts` |
| `type` | `question` | escreve | `src/data/copywritingData.ts` |
| `type` | `question_asked` | escreve | `src/data/carnegieGenuineInterest.ts`<br>`src/types/carnegie-extended.ts` |
| `type` | `rapport` | escreve | `src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `reassign` | escreve | `src/hooks/useTerritoryOptimization.ts`<br>`supabase/functions/territory-optimization/index.ts` |
| `type` | `reduce_interruptions` | escreve | `src/data/carnegieTalkRatio.ts` |
| `type` | `reflect_more` | escreve | `src/data/carnegieTalkRatio.ts` |
| `type` | `reframing` | escreve | `src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `relationship-milestone` | escreve | `src/components/smart-reminders/SmartRemindersPanel.tsx` |
| `type` | `relationship_score_drop` | escreve | `src/hooks/useBehaviorAlerts.ts` |
| `type` | `relative_birthday` | escreve | `supabase/functions/check-notifications/index.ts` |
| `type` | `relative_suggestion` | compara, escreve | `src/components/contact-detail/LifeEventsTab.tsx`<br>`supabase/functions/conversation-analyzer/index.ts` |
| `type` | `renewal` | escreve | `supabase/functions/client-notifications/index.ts` |
| `type` | `round_robin` | escreve | `src/hooks/useForms.ts` |
| `type` | `secret` | escreve | `src/data/copywritingData.ts` |
| `type` | `select` | compara, escreve | `src/components/custom-fields/CustomFieldsManager.tsx`<br>`src/components/marketing/FormBuilder.tsx`<br>`src/components/marketing/PublicFormRenderer.tsx`<br>`src/hooks/useContactSegmentation.ts` |
| `type` | `self_challenge` | escreve | `src/types/carnegie-extended.ts` |
| `type` | `send_notification` | compara, escreve | `src/components/automation/ActionConfigForm.tsx`<br>`src/components/automation/AutomationTemplates.tsx` |
| `type` | `sentiment_drop` | escreve | `src/hooks/useBehaviorAlerts.ts`<br>`src/hooks/usePortfolioHealth.ts` |
| `type` | `server` | compara | `src/components/feedback/ErrorState.tsx` |
| `type` | `shared` | escreve | `src/components/ficha-360/TagsInteresseCard.tsx` |
| `type` | `shared_experience` | escreve | `src/data/carnegieEmpathyTemplates.ts` |
| `type` | `sharing_failure` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `showing_learning` | escreve | `src/data/carnegieVulnerability.ts` |
| `type` | `skepticism` | escreve | `src/types/triggers-advanced.ts` |
| `type` | `skill_developed` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `social` | compara, escreve | `src/components/nlp/CopywritingSalesTools.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `social_event` | escreve | `supabase/functions/social-events-detector/index.ts` |
| `type` | `soft` | compara, escreve | `src/components/nlp/CopywritingSalesTools.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `spacer` | compara, escreve | `src/components/email-builder/EmailBuilder.tsx`<br>`src/components/email-builder/types.ts`<br>`src/lib/emailBuilderRenderer.ts`<br>`src/pages/PublicLandingPage.tsx` |
| `type` | `spring` | escreve | `src/components/bulk-actions/BulkActionsBar.tsx`<br>`src/components/celebrations/CelebrationProvider.tsx`<br>`src/components/celebrations/MiniCelebration.tsx`<br>`src/components/dashboard/YourDaySection.tsx`<br>`src/components/data-export/AdvancedDataExporter.tsx`<br>… +19 |
| `type` | `stakeholder_alert` | escreve | `src/hooks/useNotifications.ts`<br>`src/hooks/useStakeholderAlerts.ts` |
| `type` | `stated_actual` | escreve | `src/components/nlp/IncongruenceDetector.tsx` |
| `type` | `step_completed` | escreve | `src/data/carnegieProgressCelebration.ts` |
| `type` | `stimulus` | compara, escreve | `src/components/neuromarketing/NeuroABTracker.tsx`<br>`src/components/neuromarketing/NeuroTooltipSystem.tsx` |
| `type` | `strategic` | compara | `src/components/neuromarketing/PainClaimGainBuilder.tsx` |
| `type` | `string` | compara, escreve | `src/pages/CRMRelationshipAuditPage.tsx`<br>`supabase/functions/_shared/validate.ts`<br>`supabase/functions/_shared/validate_test.ts`<br>`supabase/functions/abm-account-scorer/index.ts`<br>`supabase/functions/abm-whitespace-analyzer/index.ts`<br>… +45 |
| `type` | `subtle` | compara | `src/hooks/useSuccessCelebration.ts` |
| `type` | `support` | compara, escreve | `src/data/carnegieEmpathyTemplates.ts`<br>`src/hooks/useCoalitionDetection.ts` |
| `type` | `supporter` | compara | `src/components/analytics/churn/ChurnHelpers.tsx` |
| `type` | `task` | compara, escreve | `src/hooks/useUnifiedTimeline.ts`<br>`supabase/functions/_shared/edge-types-contract_test.ts`<br>`supabase/functions/nurturing-runner/index.ts` |
| `type` | `template_success` | escreve | `supabase/functions/template-success-notifications/index.ts` |
| `type` | `test` | escreve | `src/pages/Notificacoes.tsx` |
| `type` | `testimonial` | escreve | `src/data/carnegieStorytelling.ts`<br>`src/data/copywritingData.ts` |
| `type` | `text` | compara, escreve | `src/components/email-builder/EmailBuilder.tsx`<br>`src/components/email-builder/types.ts`<br>`src/components/marketing/FormBuilder.tsx`<br>`src/hooks/useContactSegmentation.ts`<br>`src/hooks/useForms.ts`<br>… +6 |
| `type` | `textarea` | compara | `src/components/marketing/PublicFormRenderer.tsx` |
| `type` | `timeline` | escreve | `src/components/nlp/IncongruenceDetector.tsx` |
| `type` | `timeout` | compara | `src/components/feedback/ErrorState.tsx` |
| `type` | `travel` | escreve | `src/components/contact-detail/life-events/LifeEventsGapChecklist.tsx` |
| `type` | `understanding` | escreve | `src/data/carnegieEmpathyTemplates.ts` |
| `type` | `unhandledrejection` | escreve | `src/lib/errorReporting.ts` |
| `type` | `up` | compara, escreve | `src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `update_score` | compara, escreve | `src/components/automation/ActionConfigForm.tsx`<br>`src/components/automation/AutomationTemplates.tsx` |
| `type` | `update_stage` | compara, escreve | `src/components/automation/ActionConfigForm.tsx`<br>`src/components/automation/AutomationTemplates.tsx` |
| `type` | `updated` | compara, escreve | `src/hooks/useCompanies.ts`<br>`src/hooks/useContacts.ts`<br>`src/hooks/useSlowQueryDetector.ts`<br>`src/lib/queryErrorReporter.ts` |
| `type` | `urgent` | compara, escreve | `src/components/nlp/CopywritingSalesTools.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `vak` | escreve | `src/components/nlp/CommunicationCoherencePanel.tsx`<br>`src/components/nlp/NLPRealtimeCoach.tsx` |
| `type` | `vak_detection` | escreve | `src/data/nlpTrainingScenarios.ts` |
| `type` | `validation` | escreve | `src/data/carnegieEmpathyTemplates.ts` |
| `type` | `value` | escreve | `src/components/ficha-360/TagsInteresseCard.tsx` |
| `type` | `verbal_behavioral` | escreve | `src/components/nlp/IncongruenceDetector.tsx` |
| `type` | `vision` | escreve | `src/data/carnegieStorytelling.ts` |
| `type` | `wait` | compara | `src/pages/Nurturing.tsx` |
| `type` | `warning` | escreve | `src/components/neuromarketing/NeuroAlerts.tsx`<br>`src/data/copywritingData.ts` |
| `type` | `whatsapp` | compara, escreve | `src/components/contact-detail/ContactInteractionsTab.tsx`<br>`src/components/interactions/UnifiedCommunicationHistory.tsx`<br>`src/hooks/useUnifiedTimeline.ts`<br>`supabase/functions/evolution-webhook/messages.ts`<br>`supabase/functions/nurturing-runner/index.ts`<br>… +1 |
| `type` | `window` | escreve | `public/sw-push.js` |
| `type` | `works_at` | compara, escreve | `src/components/network/NetworkVisualization.tsx`<br>`src/hooks/useNetworkGraph.ts` |
| `type` | `you` | compara, escreve | `src/components/network/NetworkVisualization.tsx`<br>`src/hooks/useNetworkGraph.ts` |
| `status` | `101` | compara | `supabase/functions/_shared/safe-http.ts` |
| `status` | `APROVADO` | compara | `src/components/lead-routing/tabs/RoutingRulesTab.tsx` |
| `status` | `ATIVO` | compara | `src/components/lead-routing/tabs/HandoffQueueTab.tsx` |
| `status` | `Ativo` | compara, escreve | `src/components/crm/copywriting/PerformanceHistory.tsx` |
| `status` | `DELIVERY_ACK` | compara | `supabase/functions/evolution-webhook/messages.ts` |
| `status` | `ERROR` | compara | `supabase/functions/evolution-webhook/messages.ts` |
| `status` | `EXPIRADO` | compara | `src/components/lead-routing/tabs/HandoffQueueTab.tsx` |
| `status` | `Inativo` | escreve | `src/components/crm/copywriting/PerformanceHistory.tsx` |
| `status` | `NENHUM` | filtra | `src/hooks/useRodizioBloqueios.ts` |
| `status` | `PENDENTE_APROVACAO` | compara | `src/components/lead-routing/LeadRoutingModule.tsx`<br>`src/components/lead-routing/tabs/HandoffQueueTab.tsx` |
| `status` | `PENDING` | compara | `supabase/functions/evolution-webhook/messages.ts` |
| `status` | `PLAYED` | compara | `supabase/functions/evolution-webhook/messages.ts` |
| `status` | `RASCUNHO` | compara, filtra | `src/components/lead-routing/tabs/RoutingRulesTab.tsx`<br>`src/hooks/useRodizioOndas.ts` |
| `status` | `READ` | compara, escreve | `supabase/functions/_shared/evolution-dispatch-contract_test.ts`<br>`supabase/functions/_shared/evolution-ownership-contract_test.ts`<br>`supabase/functions/evolution-webhook/messages.ts` |
| `status` | `abandoned` | escreve | `supabase/functions/_shared/edge-types-contract_test.ts`<br>`supabase/functions/_shared/webhook-dlq-contract_test.ts`<br>`supabase/functions/process-webhook-dlq/index.ts` |
| `status` | `accepted` | compara, escreve | `src/components/contact-detail/LifeEventsTab.tsx`<br>`src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| `status` | `active` | compara, escreve, filtra | `src/components/sequences/SequenceCard.tsx`<br>`src/components/sequences/SequenceDetailDrawer.tsx`<br>`src/hooks/useNurturingExecutions.ts`<br>`src/hooks/useNurturingWorkflows.ts`<br>`src/hooks/useSequences.ts`<br>… +6 |
| `status` | `added` | compara, escreve | `src/components/admin/RpcPlanDiffDialog.tsx`<br>`src/components/intel/MetadataDiffPanel.tsx`<br>`src/components/search/PresetFiltersDiff.tsx` |
| `status` | `all` | compara | `src/hooks/useDealRooms.ts`<br>`src/pages/AdminConexoesLogs.tsx` |
| `status` | `already_complete` | escreve | `supabase/functions/enrich-contacts/index.ts` |
| `status` | `answered` | compara, escreve | `src/components/csat/CSATPanel.tsx`<br>`src/hooks/useCSATSurveys.ts`<br>`src/hooks/useNpsSurveys.ts`<br>`src/pages/NPS.tsx`<br>`src/pages/PublicSurvey.tsx` |
| `status` | `approved` | compara, escreve | `src/hooks/useAIApprovals.ts`<br>`src/hooks/usePasswordResetRequests.ts`<br>`src/pages/admin/AdminSegurancaPage.tsx` |
| `status` | `archived` | compara | `src/components/sequences/SequenceCard.tsx` |
| `status` | `ativo` | compara | `src/components/company-detail/CompanyProfileCard.tsx` |
| `status` | `bad` | escreve | `src/domain/leadScoring.ts` |
| `status` | `blocked` | escreve | `src/components/deal-rooms/MilestoneKanban.tsx` |
| `status` | `bounced` | compara | `supabase/functions/sequence-processor/index.ts` |
| `status` | `cancelled` | compara | `src/components/company-detail/CompanyCommercialTab.tsx` |
| `status` | `changed` | compara | `src/components/admin/RpcPlanDiffDialog.tsx`<br>`src/components/intel/MetadataDiffPanel.tsx`<br>`src/components/search/PresetFiltersDiff.tsx`<br>`src/lib/rpcPlanDiff.ts` |
| `status` | `clicked` | compara, escreve | `src/hooks/useSmartNotifications.ts` |
| `status` | `closed` | compara, escreve | `src/components/forecasting/PeriodSelector.tsx`<br>`src/components/reports/widgets/ReportWidgets.tsx`<br>`src/hooks/useForecasting.ts`<br>`src/hooks/useSupportTickets.ts`<br>`src/pages/Suporte.tsx` |
| `status` | `closed_lost` | compara | `supabase/functions/abm-account-scorer/index.ts` |
| `status` | `closed_won` | compara | `supabase/functions/abm-account-scorer/index.ts` |
| `status` | `completed` | compara, escreve | `src/components/company-detail/CompanyCommercialTab.tsx`<br>`src/components/contact-detail/ContactTasksPanel.tsx`<br>`src/components/contact-detail/commercial-tab/TasksCard.tsx`<br>`src/components/gamification/UserGoalsWidget.tsx`<br>`src/components/lux/LuxHistoryTimeline.tsx`<br>… +10 |
| … +179 linhas — lista completa em `context.json` | | | |

### E.4 Enums e listas de valores

| Nome | Valores | Onde |
|---|---|---|
| app_role | `admin`, `manager`, `salesperson`, `moderator`, `user` | banco |
| entity_relationship_role | `buyer`, `manager`, `owner`, `decision_maker`, `influencer`, `user`, `sponsor`, `partner`, `supplier`, `subsidiary`, `parent`, `employee_of`, `other` | banco |
| entity_type | `company`, `contact` | banco |
| error_severity | `info`, `warning`, `error`, `critical` | banco |
| passo_outcome | `respondeu_positivo`, `respondeu_neutro`, `nao_respondeu`, `nao_atendeu`, `pulou` | banco |
| validation_kind | `email`, `phone` | banco |
| validation_queue_status | `pending`, `processing`, `done`, `error` | banco |
| phone_type | `celular_corporativo`, `fixo_comercial`, `celular_pessoal`, `invalido` | banco |
| email_type | `corporativo`, `pessoal`, `financeiro`, `nfe`, `marketing`, `comercial`, `compras` | banco |
| social_media_platform | `linkedin`, `instagram`, `facebook`, `x`, `youtube`, `tiktok`, `whatsapp`, `google_business`, `website` | banco |
| workspace_account_type | `user`, `group`, `alias`, `shared_mailbox`, `service_account` | banco |
| data_source | `CRM`, `SPA_CLIENTE`, `SPA_FORNECEDOR`, `SPA_TRANSPORTADORA`, `MERGED`, `MANUAL`, `LINKEDIN`, `LUSHA`, `LEADCONTACT`, `WHATSAPP` | banco |
| company_status | `ativo`, `inativo`, `suspenso` | banco |
| buckettype | `STANDARD`, `PUBLIC`, `PRIVATE` | banco |
| task_priority | `high`, `medium`, `low` | banco |
| task_status | `pending`, `in_progress`, `completed`, `cancelled` | banco |
| task_type | `call`, `meeting`, `follow_up`, `email`, `proposal`, `other` | banco |
| activity_type | `call`, `email`, `meeting`, `linkedin`, `whatsapp`, `other` | banco |
| activity_outcome | `connected`, `no_answer`, `scheduled`, `voicemail`, `busy`, `callback`, `not_interested`, `qualified` | banco |
| salesperson_role | `sdr`, `closer`, `hybrid` | banco |
| supplier_homologation_status | `pendente`, `em_analise`, `homologado`, `reprovado`, `suspenso`, `vencido` | banco |
| supplier_alert_severity | `info`, `atencao`, `critico` | banco |
| carrier_homologation_status | `pendente`, `em_analise`, `homologado`, `reprovado`, `suspenso`, `vencido` | banco |
| EvidenceKind | preference \| hobby \| tone | `src/components/contacts/EvidenceDrillDownSheet.tsx` |
| PeriodFilter | 7d \| 30d \| 90d | `src/components/dashboard/charts/ChartDataUtils.ts` |
| EmailBlockType | heading \| text \| button \| image \| divider \| spacer | `src/components/email-builder/types.ts` |
| EmailBlockAlign | left \| center \| right | `src/components/email-builder/types.ts` |
| WhyScoreDirection | positive \| negative \| neutral | `src/components/intelligence/WhyScoreDrawer.tsx` |
| ScoreBand | low \| mid \| high | `src/components/intelligence/WhyScoreDrawer.tsx` |
| ExplanationFeedbackValue | makes_sense \| does_not_make_sense | `src/components/intelligence/WhyScoreDrawer.tsx` |
| DensityMode | comfortable \| compact | `src/components/interactions/DensityChips.tsx` |
| DirecaoValue | all \| inbound \| outbound | `src/components/interactions/DirecaoQuickFilter.tsx` |
| ViewMode | list \| by-contact \| by-company | `src/components/interactions/ViewModeChips.tsx` |
| EvolutionDirection | up \| stable \| down | `src/components/interactions/insights/EvolutionStatsCard.tsx` |
| SentimentKey | positive \| neutral \| negative \| mixed | `src/components/interactions/insights/SentimentChartTooltip.tsx` |
| RevOpsPeriod | 7d \| 30d \| 90d \| qtd | `src/components/revops/RevOpsPeriodSelector.tsx` |
| Theme | dark \| light \| system | `src/components/theme/themeBootstrap.ts` |
| DISCProfile | D \| I \| S \| C | `src/components/triggers/trigger-analytics/types.ts` |
| CustomValueMode | strict \| flexible \| approval | `src/components/ui/searchable-select.tsx` |
| ViewMode | grid \| list \| table | `src/components/ui/view-mode-switcher.tsx` |
| CHANNEL_PERSISTENCE_VALID_VALUES | 'whatsapp', 'call', 'email', 'meeting', 'video_call', 'note', | `src/config/channelPersistence.config.ts` |
| ListDensity | comfortable \| compact | `src/contexts/DensityContext.tsx` |
| EntityType | contacts \| companies \| interactions | `src/data/exporterConfigs.ts` |
| ExtendedTriggerType | priming \| anchoring \| decoy_effect \| framing \| curiosity_gap \| peak_end_rule \| endowment_effect \| sunk_cost \| bandwagon \| halo_effect \| contrast_principle \| unity | `src/data/triggersExtendedData.ts` |
| TrendDirection | up \| flat \| down | `src/domain/churnRisk.ts` |
| ProntidaoStatus | good \| warn \| bad \| unknown | `src/domain/leadScoring.ts` |
| ProntidaoLevel | frio \| morno \| quente \| pronto | `src/domain/leadScoring.ts` |
| ProximoPassoChannel | whatsapp \| email \| call \| meeting \| linkedin | `src/domain/nextStepLogic.ts` |
| ProximoPassoPriority | alta \| media \| baixa | `src/domain/nextStepLogic.ts` |
| PassoFeedbackOutcomeHint | respondeu_positivo \| respondeu_neutro \| nao_respondeu \| nao_atendeu \| pulou | `src/domain/nextStepLogic.ts` |
| AccountTier | strategic \| enterprise \| mid \| smb | `src/hooks/useABM.ts` |
| AccountStatus | active \| nurture \| closed_won \| closed_lost \| paused | `src/hooks/useABM.ts` |
| CommitteeRole | decision_maker \| influencer \| champion \| blocker \| user \| technical \| economic | `src/hooks/useABM.ts` |
| WhitespaceType | cross_sell \| up_sell \| expansion \| renewal | `src/hooks/useABM.ts` |
| CampaignType | one_to_one \| one_to_few \| one_to_many | `src/hooks/useABM.ts` |
| MessageType | follow_up \| introduction \| proposal \| check_in \| thank_you \| meeting_request \| custom | `src/hooks/useAIWritingAssistant.ts` |
| MessageTone | formal \| casual \| friendly | `src/hooks/useAIWritingAssistant.ts` |
| PersuasionFramework | AIDA \| PAS \| FAB \| 4Ps \| Storytelling \| None | `src/hooks/useAIWritingAssistant.ts` |
| PeriodoAtividade | 7d \| 30d \| 90d \| 365d | `src/hooks/useActivityOverview.ts` |
| AttributionModel | first \| last \| linear \| u_shape \| w_shape \| time_decay | `src/hooks/useAttribution.ts` |
| TriggerType | interaction_created \| contact_stage_changed \| score_changed \| tag_added \| no_contact_days \| sentiment_changed \| follow_up_due | `src/hooks/useAutomationRules.ts` |
| ActionType | create_alert \| create_task \| update_stage \| add_tag \| send_notification \| update_score \| enroll_in_sequence | `src/hooks/useAutomationRules.ts` |
| AlertType | sentiment_drop \| engagement_drop \| churn_risk \| purchase_overdue \| communication_gap \| relationship_score_drop \| positive_momentum | `src/hooks/useBehaviorAlerts.ts` |
| AlertSeverity | low \| medium \| high \| critical | `src/hooks/useBehaviorAlerts.ts` |
| ImportEntityType | contacts \| companies | `src/hooks/useBulkImport.ts` |
| BulkRevalidateKind | email \| phone \| both | `src/hooks/useBulkRevalidate.ts` |
| BulkRevalidateStatus | valid \| invalid \| risky \| unknown \| never | `src/hooks/useBulkRevalidate.ts` |
| Channel | whatsapp \| email \| call \| meeting | `src/hooks/useChannelPerformanceMatrix.ts` |
| STAGES | 'lead', 'qualificacao', 'proposta', 'negociacao', 'fechamento' | `src/hooks/useChannelPerformanceMatrix.ts` |
| ChannelSyncMode | auto \| manual | `src/hooks/useChannelSyncMode.ts` |
| HealthStatus | healthy \| warning \| critical | `src/hooks/useClientHealth.ts` |
| ProbabilityFilter | all \| high \| medium \| low \| very_low | `src/hooks/useClosingScoreRanking.ts` |
| PeriodFilter | 7d \| 30d \| 90d \| all | `src/hooks/useClosingScoreRanking.ts` |
| AnomalyType | error_spike \| latency_degradation \| suspicious_window \| volume_drop \| volume_spike \| schema_drift | `src/hooks/useConnectionAnomalies.ts` |
| AnomalySeverity | low \| medium \| high \| critical | `src/hooks/useConnectionAnomalies.ts` |
| ConnectionType | supabase_external \| bitrix24 \| n8n \| mcp_claude \| custom | `src/hooks/useConnections.ts` |
| TrendDirection | up \| stable \| down | `src/hooks/useContactSentimentTrend.ts` |
| TagCategory | hobbies \| interests | `src/hooks/useContactTagsHistory.ts` |
| ValidationStatus | valid \| invalid \| risky \| unreachable \| catchall \| unknown | `src/hooks/useContactValidationStatus.ts` |
| SentimentOverall | positive \| neutral \| negative \| mixed | `src/hooks/useConversationIntel.ts` |
| ConvEntity | contacts \| companies \| deals \| interactions | `src/hooks/useConversationalSearch.ts` |
| MeetingModality | video \| presencial \| phone | `src/hooks/useCreateMeeting.ts` |
| FieldType | text \| number \| date \| select \| boolean \| url \| email \| phone | `src/hooks/useCustomFields.ts` |
| EntityType | contact \| company \| deal | `src/hooks/useCustomFields.ts` |
| CSTier | strategic \| enterprise \| mid \| smb | `src/hooks/useCustomerSuccess.ts` |
| CSLifecycle | onboarding \| adopting \| mature \| at_risk \| churned | `src/hooks/useCustomerSuccess.ts` |
| SignalType | usage \| support \| engagement \| sentiment \| payment \| nps | `src/hooks/useCustomerSuccess.ts` |
| RenewalStatus | upcoming \| in_negotiation \| renewed \| churned \| downgraded \| expanded | `src/hooks/useCustomerSuccess.ts` |
| ConversionPeriod | 30d \| 90d \| 180d \| 365d | `src/hooks/useDISCConversionData.ts` |
| ConfidenceLevel | low \| medium \| high | `src/hooks/useDealForecastConfidence.ts` |
| DealRoomStatus | active \| won \| lost \| paused | `src/hooks/useDealRooms.ts` |
| MilestoneStatus | pending \| in_progress \| done \| blocked | `src/hooks/useDealRooms.ts` |
| Side | seller \| buyer \| both | `src/hooks/useDealRooms.ts` |
| RiskLevel | healthy \| attention \| high | `src/hooks/useDealSlipRisk.ts` |
| DedupEntity | contacts \| companies | `src/hooks/useDedupEngine.ts` |
| DocumentType | contract \| proposal \| nda \| invoice \| report \| presentation \| spreadsheet \| image \| other | `src/hooks/useDocuments.ts` |
| EmailFilter | any \| valid \| invalid | `src/hooks/useEnrichmentExport.ts` |
| PhoneFilter | any \| valid \| invalid | `src/hooks/useEnrichmentExport.ts` |
| Entity360Type | contact \| company \| deal | `src/hooks/useEntity360.ts` |
| BookmarkType | contact \| company \| deal | `src/hooks/useEntityBookmarks.ts` |
| EntityType | company \| contact | `src/hooks/useEntityRelationships.ts` |
| EntityRelationshipRole | buyer \| manager \| owner \| decision_maker \| influencer \| user \| sponsor \| partner \| supplier \| subsidiary \| parent \| employee_of \| other | `src/hooks/useEntityRelationships.ts` |
| EvidenceSource | whatsapp \| call \| interaction | `src/hooks/useEvidenceForLabel.ts` |
| Ficha360Sort | recente \| relevante | `src/hooks/useFicha360Sort.ts` |
| FollowUpDecision | approved \| rejected | `src/hooks/useFollowUpApprovals.ts` |
| ForecastCategory | commit \| best_case \| pipeline \| omitted | `src/hooks/useForecasting.ts` |
| GlobalDensity | comfortable \| compact | `src/hooks/useGlobalDensity.ts` |
| InboundChannel | all \| whatsapp \| email \| call | `src/hooks/useInboundActivityHeatmap.ts` |
| WebhookTargetEntity | contact \| company \| deal \| interaction \| note \| custom | `src/hooks/useIncomingWebhooks.ts` |
| IntelDensity | compact \| comfortable | `src/hooks/useIntelDensity.ts` |
| IntelTheme | cyan \| amber | `src/hooks/useIntelTheme.ts` |
| IntentScope | contact \| account | `src/hooks/useIntent.ts` |
| IntentTrend | rising \| stable \| falling | `src/hooks/useIntent.ts` |
| DirecaoFilter | all \| inbound \| outbound | `src/hooks/useInteractionsAdvancedFilter.ts` |
| ViewMode | list \| by-contact \| by-company | `src/hooks/useInteractionsAdvancedFilter.ts` |
| DensityMode | comfortable \| compact | `src/hooks/useInteractionsAdvancedFilter.ts` |
| SentimentoFilter | positive \| neutral \| negative \| mixed | `src/hooks/useInteractionsAdvancedFilter.ts` |
| VALID_PER_PAGE | 10, 25, 50, 100 | `src/hooks/useInteractionsAdvancedFilter.ts` |
| Period | 7d \| 30d \| 90d | `src/hooks/useInteractionsInsights.ts` |
| TrendDirection | up \| stable \| down | `src/hooks/useInteractionsInsights.ts` |
| LeadGrade | cold \| warm \| hot \| on_fire | `src/hooks/useLeadScore.ts` |
| LeadScoreGrade | A \| B \| C \| D | `src/hooks/useLeadScoring.ts` |
| MergeEntity | contacts \| companies | `src/hooks/useMergeRecords.ts` |
| PeriodFilter | 7d \| 30d \| 90d \| 365d | `src/hooks/useNLPAnalyticsData.ts` |
| Urgency | critical \| high \| normal \| low | `src/hooks/useNotificationPreferences.ts` |
| DigestMode | immediate \| hourly \| daily | `src/hooks/useNotificationPreferences.ts` |
| Channel | in_app \| email \| push \| whatsapp | `src/hooks/useNotificationPreferences.ts` |
| PlaybookScenario | discovery \| demo \| negotiation \| objection \| closing \| winback \| onboarding \| custom | `src/hooks/usePlaybooks.ts` |
| PlaybookSectionType | talktrack \| questions \| objections \| next_steps \| resources | `src/hooks/usePlaybooks.ts` |
| HealthStatus | healthy \| warning \| critical | `src/hooks/usePortfolioHealth.ts` |
| PassoOutcome | respondeu_positivo \| respondeu_neutro \| nao_respondeu \| nao_atendeu \| pulou | `src/hooks/useProximoPassoFeedback.ts` |
| NbaPriority | alta \| media \| baixa | `src/hooks/useProximosPassosFilters.ts` |
| NbaSort | sugerido \| recomendacao \| prioridade \| canal | `src/hooks/useProximosPassosFilters.ts` |
| FunnelStage | visitor \| lead \| mql \| sql \| opportunity \| customer | `src/hooks/useRevOps.ts` |
| AutomationTrigger | grade_reached \| grade_dropped \| score_above \| score_below | `src/hooks/useScoreAutomations.ts` |
| AutomationAction | notify \| create_task \| enroll_sequence \| webhook \| tag | `src/hooks/useScoreAutomations.ts` |
| PresetSortMode | favoritos \| mais-usados \| recentes \| alfabetica | `src/hooks/useSearchPresets.ts` |
| SemanticEntity | contacts \| companies \| interactions \| products | `src/hooks/useSemanticSearch.ts` |
| AnnotationCategory | campanha \| abordagem \| release \| reuniao \| outro | `src/hooks/useSentimentAnnotations.ts` |
| NotifUrgency | critical \| high \| normal \| low | `src/hooks/useSmartNotifications.ts` |
| NotifStatus | pending \| delivered \| dismissed \| clicked \| suppressed \| snoozed | `src/hooks/useSmartNotifications.ts` |
| TableDensity | comfortable \| compact | `src/hooks/useTableDensity.ts` |
| GroupBy | company \| contact | `src/hooks/useTimelineByEntity.ts` |
| ToneType | friendly \| formal \| casual | `src/hooks/useTonePersistence.ts` |
| SeqChannel | whatsapp \| email \| call \| meeting | `src/hooks/useTouchpointSequences.ts` |
| TriggerResult | success \| neutral \| failure \| pending | `src/hooks/useTriggerHistory.ts` |
| HistoryChannel | whatsapp \| call \| email \| meeting \| note \| social | `src/hooks/useUnifiedHistory.ts` |
| UnifiedEventType | message \| call \| meeting \| note \| task \| event \| score_change \| stage_change \| alert \| neuro_update | `src/hooks/useUnifiedTimeline.ts` |
| DAY_OPTIONS | { value: 'monday', label: 'Segunda-feira' }, { value: 'tuesday', label: 'Terça-feira' }, { value: 'wednesday', label: 'Quarta-feira' }, { value: 'thursday', label: 'Quinta-feira' }, { value: 'friday', label: 'Sexta-feira' }, { value: 'saturday', label: 'Sábado' }, { value: 'sunday', label: 'Domingo' … | `src/hooks/useWeeklyReport.ts` |
| WhatsAppMessageType | text \| audio \| image \| video \| document \| sticker | `src/hooks/useWhatsAppImport.ts` |
| WinLossOutcome | won \| lost \| no_decision \| pending | `src/hooks/useWinLoss.ts` |
| ReasonCategory | price \| product \| timing \| relationship \| competition \| budget \| authority \| need \| other | `src/hooks/useWinLoss.ts` |
| ReasonOutcomeType | won \| lost \| both | `src/hooks/useWinLoss.ts` |
| InsightType | pattern \| recommendation \| alert | `src/hooks/useWinLoss.ts` |
| InsightSeverity | info \| warning \| critical \| success | `src/hooks/useWinLoss.ts` |
| VoiceAgentPhase | idle \| listening \| processing \| speaking \| error | `src/hooks/voice/types.ts` |
| INTERACTION_CHANNELS | 'whatsapp', 'call', 'email', 'meeting', 'video_call', 'note', | `src/lib/canaisInteracao.ts` |
| FICHA360_CHANNELS | 'whatsapp', 'call', 'email', 'meeting', 'note', 'audio', 'transcription' | `src/lib/canaisInteracao.ts` |
| PerfilDisc | D \| I \| S \| C | `src/lib/carnegieMessageReview.ts` |
| CircuitState | CLOSED \| OPEN \| HALF_OPEN | `src/lib/circuitBreaker.ts` |
| IsolatedFilterKey | q \| contact \| company \| direcao \| canais \| de \| ate \| sentimento | `src/lib/computeIsolatedFilterCounts.ts` |
| DealRiskLevel | healthy \| attention \| high | `src/lib/deal-risk-constants.ts` |
| DiffStatus | added \| removed \| changed \| equal | `src/lib/entityDiff.ts` |
| GroupMode | by-contact \| by-company | `src/lib/groupInteractions.ts` |
| IntelExportFormat | csv \| json \| tsv \| markdown | `src/lib/intelExportUniversal.ts` |
| INTEL_STORAGE_KEYS | 'intel-bookmarks-v1', 'intel-saved-views-v1', 'intel-density-v1', 'intel-pres-v1', 'intel-snapshots-v1', 'intel-ask-history', 'intel-graph-layout-v1', | `src/lib/intelHealth.ts` |
| ActionPriority | critical \| high \| medium \| low | `src/lib/proactiveIntelligence.ts` |
| ActionCategory | follow_up \| relationship \| closing \| rescue \| nurture \| celebrate \| intelligence | `src/lib/proactiveIntelligence.ts` |
| MilestoneKind | first-call \| first-whatsapp \| first-email \| first-meeting \| peak | `src/lib/prontidaoTrendMilestones.ts` |
| WeightsHealth | zero \| low \| ok | `src/lib/prontidaoWeightsHealth.ts` |
| RodizioTable | vw_rodizio_carga_closers \| vw_rodizio_carga_sdrs \| vw_rodizio_execucoes \| vw_rodizio_bloqueios \| vw_rodizio_kpis \| rodizio_distribuicao_staging | `src/lib/rodizioRpc.ts` |
| RodizioRpc | rodizio_sugerir_distribuicao \| rodizio_aplicar_onda \| rodizio_bloquear_cliente \| rodizio_aprovar_bloqueio \| rodizio_reverter_execucao \| rodizio_closer_executar \| rodizio_sdr_executar | `src/lib/rodizioRpc.ts` |
| APP_ROLES | 'admin', 'manager', 'salesperson', 'moderator', 'user' | `src/lib/roleAssignment.ts` |
| CHURN_WINDOW_VALUES | '6', '24', '168' | `src/lib/rpcChurn.ts` |
| PlanNodeStatus | unchanged \| changed \| added \| removed | `src/lib/rpcPlanDiff.ts` |
| ScriptChannel | whatsapp \| email \| call | `src/lib/scriptGenerator.ts` |
| SentimentTone | positivo \| neutro \| negativo \| misto | `src/lib/scriptGenerator.ts` |
| SecretHealthStatus | healthy \| warning \| critical | `src/lib/secretRotation.ts` |
| SortKey | recent \| oldest \| relevance \| entity \| channel | `src/lib/sortInteractions.ts` |
| PeriodFilter | 7d \| 30d \| 90d \| 365d \| all | `src/lib/tab-utils.ts` |
| EITabType | overview \| pillars \| sales \| evolution | `src/lib/tab-utils.ts` |
| TriggerAnalyticsTab | overview \| disc \| triggers | `src/lib/tab-utils.ts` |
| FocusType | motivation \| reference \| sorting | `src/lib/tab-utils.ts` |
| TriggerCategoryTab | all \| urgency \| social_proof \| scarcity \| authority \| reciprocity \| commitment \| liking | `src/lib/tab-utils.ts` |
| EITabWithHistory | overview \| pillars \| sales \| history | `src/lib/tab-utils.ts` |
| MetaprogramFocusType | motivation \| reference \| working | `src/lib/tab-utils.ts` |
| PerfilDisc | D \| I \| S \| C | `src/lib/triggerPlaybook.ts` |
| PerfilVak | V \| A \| K | `src/lib/triggerPlaybook.ts` |
| MatchMode | exact \| partial | `src/lib/insights/extractExcerpts.ts` |
| EntityKey | contacts \| companies \| interactions \| deals \| tickets | `src/lib/reports/reportEngine.ts` |
| FieldType | text \| number \| date \| enum \| boolean | `src/lib/reports/reportEngine.ts` |
| FilterOperator | eq \| neq \| gt \| gte \| lt \| lte \| contains \| starts_with \| is_null \| is_not_null | `src/lib/reports/reportEngine.ts` |
| AggregationFn | count \| sum \| avg \| min \| max | `src/lib/reports/reportEngine.ts` |
| SimulationSentiment | positivo \| neutro \| misto \| negativo | `src/stores/useSimulationStore.ts` |
| BigFiveTrait | O \| C \| E \| A \| N | `src/types/big-five.ts` |
| DiscProfileKey | D \| I \| S \| C | `src/types/carnegie-extended.ts` |
| CriticalLanguageType | direct_criticism \| passive_aggressive \| complaint \| condemnation \| blame \| sarcasm \| negative_comparison \| dismissive | `src/types/carnegie-extended.ts` |
| DesireCategory | recognition \| security \| autonomy \| belonging \| achievement \| growth \| pleasure \| meaning | `src/types/carnegie-extended.ts` |
| ArgumentIndicator | contradiction \| defensive_response \| escalation \| absolute_statement \| interruption \| dismissal | `src/types/carnegie-extended.ts` |
| EmpathyType | validation \| mirroring \| normalization \| understanding \| support \| shared_experience | `src/types/carnegie-extended.ts` |
| StoryType | hero_journey \| before_after \| problem_solution \| testimonial \| analogy \| contrast \| vision | `src/types/carnegie-extended.ts` |
| LowMedHigh | low \| medium \| high | `src/types/carnegie.ts` |
| IdentityLabelCategory | achiever \| innovator \| leader \| expert \| pioneer \| caregiver \| visionary \| perfectionist \| problem_solver \| connector \| mentor \| trailblazer | `src/types/carnegie.ts` |
| AppreciationType | sincere_compliment \| specific_recognition \| effort_acknowledgment \| character_praise \| achievement_celebration \| growth_recognition \| contribution_thanks \| quality_admiration | `src/types/carnegie.ts` |
| FaceSavingScenario | price_objection \| product_limitation \| missed_deadline \| service_failure \| misunderstanding \| competitor_comparison \| budget_constraint \| internal_resistance \| changed_requirements \| delayed_decision | `src/types/carnegie.ts` |
| VulnerabilityType | admitting_mistake \| sharing_failure \| acknowledging_limitation \| expressing_uncertainty \| asking_for_help \| showing_learning \| revealing_struggle \| accepting_feedback | `src/types/carnegie.ts` |
| ProgressType | milestone_reached \| goal_achieved \| improvement_noted \| challenge_overcome \| skill_developed \| decision_made \| step_completed \| habit_formed \| breakthrough \| consistency | `src/types/carnegie.ts` |
| LowMedHigh | low \| medium \| high | `src/types/copywriting.ts` |
| AIDAStage | attention \| interest \| desire \| action | `src/types/copywriting.ts` |
| CTAVerb | descobrir \| garantir \| reservar \| acessar \| começar \| aproveitar \| experimentar \| transformar \| conquistar \| dominar \| liberar \| desbloquear \| ativar \| receber \| obter | `src/types/copywriting.ts` |
| DISCAnalysisSource | manual \| ai_analysis \| questionnaire \| behavior_tracking | `src/types/disc.ts` |
| EQLevel | low \| developing \| moderate \| high \| exceptional | `src/types/emotional-intelligence.ts` |
| EnneagramTriad | gut \| heart \| head | `src/types/enneagram.ts` |
| EnneagramCenter | instinctive \| feeling \| thinking | `src/types/enneagram.ts` |
| EnneagramHealthLevel | healthy \| average \| unhealthy | `src/types/enneagram.ts` |
| ContactRole | owner \| manager \| buyer \| contact \| decision_maker \| influencer | `src/types/index.ts` |
| InteractionType | whatsapp \| call \| email \| meeting \| note \| social | `src/types/index.ts` |
| SentimentType | positive \| neutral \| negative | `src/types/index.ts` |
| DISCProfile | D \| I \| S \| C | `src/types/index.ts` |
| CommunicationStyle | formal \| casual \| technical \| emotional | `src/types/index.ts` |
| PreferredChannel | whatsapp \| call \| email \| meeting \| video | `src/types/index.ts` |
| MessageStyle | audio \| short_text \| long_text \| documents | `src/types/index.ts` |
| DecisionSpeed | impulsive \| fast \| moderate \| slow | `src/types/index.ts` |
| DecisionRole | final_decision \| technical \| economic \| user \| blocker \| champion | `src/types/index.ts` |
| CareerStage | early \| growth \| established \| transition \| senior | `src/types/index.ts` |
| CompanyHealth | growing \| stable \| cutting \| unknown | `src/types/index.ts` |
| RelationshipStage | unknown \| prospect \| qualified_lead \| opportunity \| negotiation \| customer \| loyal_customer \| advocate \| at_risk \| lost | `src/types/index.ts` |
| DecisionCriteria | price \| quality \| relationship \| speed \| support \| innovation \| reputation \| referral | `src/types/index.ts` |
| MBTIDichotomy | E \| I \| S \| N \| T \| F \| J \| P | `src/types/mbti.ts` |
| MBTIType | INTJ \| INTP \| ENTJ \| ENTP \| INFJ \| INFP \| ENFJ \| ENFP \| ISTJ \| ISFJ \| ESTJ \| ESFJ \| ISTP \| ISFP \| ESTP \| ESFP | `src/types/mbti.ts` |
| MotivationDirection | toward \| away_from \| balanced | `src/types/metaprograms.ts` |
| ReferenceFrame | internal \| external \| balanced | `src/types/metaprograms.ts` |
| WorkingStyle | options \| procedures \| balanced | `src/types/metaprograms.ts` |
| ChunkSize | general \| specific \| balanced | `src/types/metaprograms.ts` |
| ActionFilter | proactive \| reactive \| balanced | `src/types/metaprograms.ts` |
| ComparisonStyle | sameness \| difference \| balanced | `src/types/metaprograms.ts` |
| PainClaimGainStage | pain \| claim \| gain | `src/types/neuromarketing.ts` |
| LowMedHigh | low \| medium \| high | `src/types/nlp-advanced.ts` |
| EmotionalState | excited \| interested \| curious \| hopeful \| confident | `src/types/nlp-advanced.ts` |
| ValueCategory | security \| freedom \| growth \| recognition \| connection \| achievement \| control \| innovation \| tradition \| balance \| wealth \| impact | `src/types/nlp-advanced.ts` |
| ObjectionType | price \| timing \| authority \| need \| trust \| competition \| change_resistance \| past_experience | `src/types/nlp-advanced.ts` |
| SalesStage | rapport \| discovery \| presentation \| objection_handling \| negotiation \| closing \| follow_up | `src/types/nlp-advanced.ts` |
| RFMSegment | champions \| loyal_customers \| potential_loyalists \| recent_customers \| promising \| needing_attention \| about_to_sleep \| at_risk \| cant_lose \| hibernating \| lost | `src/types/rfm.ts` |
| RFMTrend | improving \| stable \| declining | `src/types/rfm.ts` |
| CommunicationPriority | urgent \| high \| medium \| low | `src/types/rfm.ts` |
| StagingOrigem | MANUAL \| SUGESTAO_MOTOR \| IMPORT_CSV | `src/types/rodizio.ts` |
| StagingStatus | RASCUNHO \| APROVADO \| APLICADO \| REJEITADO | `src/types/rodizio.ts` |
| ExecucaoTipo | CLOSER \| SDR \| SEGMENTAR \| DISTRIBUICAO_INICIAL | `src/types/rodizio.ts` |
| ExecucaoModo | DRY_RUN \| REAL \| ROLLBACK | `src/types/rodizio.ts` |
| BloqueioStatus | NENHUM \| EXPIRADO \| PENDENTE_APROVACAO \| ATIVO | `src/types/rodizio.ts` |
| TemperamentType | sanguine \| choleric \| melancholic \| phlegmatic | `src/types/temperament.ts` |
| VAKType | V \| A \| K \| D | `src/types/vak.ts` |
| AiGatewayStatus | success \| error \| rate_limited \| timeout | `supabase/functions/_shared/aiGatewayLogger.ts` |
| StoredLeadGrade | cold \| warm \| hot \| on_fire | `supabase/functions/_shared/lead-score-contract.ts` |
| DisplayLeadGrade | A \| B \| C \| D | `supabase/functions/_shared/lead-score-contract.ts` |
| PushOutcome | sent \| gone \| rejected \| error \| blocked | `supabase/functions/_shared/push.ts` |
| AuditOperation | select \| insert \| update \| delete \| distinct \| schema \| list_tables | `supabase/functions/external-data/audit.ts` |
| AuditOutcome | success \| denied \| error | `supabase/functions/external-data/audit.ts` |
| UserScopedUnavailableReason | missing_env \| invalid_url \| origin_mismatch | `supabase/functions/external-data/database.ts` |

## F. Validações de entrada

### F.1 Schemas Zod

- **emailSchema** (`src/components/auth/ForgotPasswordForm.tsx`, z.string):
  ```ts
  
  ```
- **contactSchema** (`src/components/forms/ContactForm.tsx`, z.object):
  ```ts
  { first_name: z.string().trim().min(1, 'Nome é obrigatório').max(50), last_name: z.string().trim().min(1, 'Sobrenome é obrigatório').max(50), apelido: z.string().trim().max(50).optional().or(z.literal('')), nome_tratamento: z.string().trim().max(50).optional().or(z.literal('')), sexo: z.string().optional().or(z.literal('')), cpf: z.string().trim().max(14).optional().or(z.literal('')), birthday: z.string().optional(), company_id: z.string().uuid('Selecione uma empresa').optional().nullable(), role: z.string().optional(), role_title: z.string().trim().max(100).optional(), cargo: z.string().trim().max(100).optional().or(z.literal('')), departamento: z.string().trim().max(100).optional().or(z.literal('')), source: z.string().trim().max(100).optional().or(z.literal('')), relationship_stage: z.s …
  ```
- **interactionSchema** (`src/components/forms/InteractionForm.tsx`, z.object):
  ```ts
  { contact_id: z.string().uuid('Selecione um contato'), company_id: z.string().uuid().optional().nullable(), type: z.string().min(1, 'Tipo é obrigatório'), title: z.string().trim().min(1, 'Título é obrigatório').max(200, 'Máximo 200 caracteres'), content: z.string().trim().max(5000, 'Máximo 5000 caracteres').optional().nullable(), sentiment: z.string().optional(), initiated_by: z.string().optional(), duration: z.number().min(0).optional().nullable(), response_time: z.number().min(0).optional().nullable(), follow_up_required: z.boolean().optional(), follow_up_date: z.string().optional().nullable(), tags: z.array(z.string()).optional(), key_insights: z.array(z.string()).optional(), audio_url: z.string().optional().nullable(), transcription: z.string().optional().nullable(), attachments: z.arr …
  ```
- **companyBrandColorsSchema** (`src/components/forms/company/CompanyFormSchema.ts`, z.string, encadeia pipe, transform):
  ```ts
  
  ```
- **companyPhoneSchema** (`src/components/forms/company/CompanyFormSchema.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), tipo: z.enum(['fixo', 'celular', 'whatsapp', 'outros']).default('fixo'), numero: z.string().min(8, 'Número inválido'), ramal: z.string().optional().or(z.literal('')), is_primary: z.boolean().default(false), contato_nome: z.string().optional().or(z.literal('')), }
  ```
- **companyEmailSchema** (`src/components/forms/company/CompanyFormSchema.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), tipo: z.enum(['comercial', 'financeiro', 'suporte', 'outros']).default('comercial'), email: z.string().email('Email inválido'), is_primary: z.boolean().default(false), }
  ```
- **companyAddressSchema** (`src/components/forms/company/CompanyFormSchema.ts`, z.object):
  ```ts
  { id: z.string().uuid().optional(), tipo: z.enum(['comercial', 'entrega', 'cobranca', 'filial', 'deposito']).default('comercial'), cep: z.string().optional().or(z.literal('')), logradouro: z.string().min(1, 'Logradouro é obrigatório'), numero: z.string().optional().or(z.literal('')), complemento: z.string().optional().or(z.literal('')), bairro: z.string().optional().or(z.literal('')), cidade: z.string().min(1, 'Cidade é obrigatória'), estado: z.string().length(2, 'UF deve ter 2 caracteres'), pais: z.string().default('Brasil'), is_primary: z.boolean().default(false), }
  ```
- **companySchema** (`src/components/forms/company/CompanyFormSchema.ts`, z.object):
  ```ts
  { nome_crm: z.string().trim().min(1, 'Nome é obrigatório').max(150, 'Máximo 150 caracteres'), nome_fantasia: z.string().trim().max(150).optional().or(z.literal('')), razao_social: z.string().trim().max(200).optional().or(z.literal('')), ramo_atividade: z.string().trim().max(150).optional().or(z.literal('')), nicho_cliente: z.string().trim().max(100).optional().or(z.literal('')), status: z.string().optional(), notes: z.string().trim().max(2000).optional().or(z.literal('')), website: z.string().trim().max(300).optional().or(z.literal('')), phone: z.string().trim().max(20).optional().or(z.literal('')), email: z.string().trim().max(100).optional().or(z.literal('')), address: z.string().trim().max(300).optional().or(z.literal('')), city: z.string().trim().max(100).optional().or(z.literal('')), …
  ```
  - Regras cruzadas (refine): “Informe cores válidas separadas por vírgula, como azul, branco ou azul marinho”
- **dealSchema** (`src/components/pipeline/DealDetailDrawer.tsx`, z.object):
  ```ts
  { titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'), valor: z.string().or(z.number()).transform(v => Number(v) || 0), pipeline_stage: z.string(), probabilidade: z.string().or(z.number()).transform(v => Number(v) || 0), company_id: z.string().uuid('Selecione uma empresa').nullable(), contact_id: z.string().uuid('Selecione um contato').optional().nullable(), previsao_fechamento: z.date().optional().nullable(), }
  ```
- **dealSchema** (`src/components/pipeline/DealDialog.tsx`, z.object):
  ```ts
  { titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'), valor: z.string().or(z.number()).transform(v => Number(v) || 0), pipeline_stage: z.string(), probabilidade: z.string().or(z.number()).transform(v => Number(v) || 0), company_id: z.string().uuid('Selecione uma empresa'), contact_id: z.string().uuid('Selecione um contato').optional().nullable(), previsao_fechamento: z.date().optional().nullable(), }
  ```
- **dealStageSchema** (`src/domain/dealState.ts`, z.enum):
  ```ts
  [ "lead", "prospect", "qualified", "proposal", "negotiation", "customer", "ed", ]
  ```
- **forecastConfidenceSchema** (`src/domain/dealState.ts`, z.object):
  ```ts
  { stage: dealStageSchema, daysInStage: z.number().min(0), interactionCount: z.number().min(0), sentimentScore: z.number().min(0).max(100), amount: z.number().min(0), }
  ```
- **uuidSchema** (`src/domain/validationSchemas.ts`, z.string):
  ```ts
  
  ```
- **phoneSchema** (`src/domain/validationSchemas.ts`, z.string, encadeia nullable, optional):
  ```ts
  
  ```
- **cnpjSchema** (`src/domain/validationSchemas.ts`, z.string, encadeia nullable, optional):
  ```ts
  
  ```
- **urlSchema** (`src/domain/validationSchemas.ts`, z.string, encadeia nullable, optional):
  ```ts
  
  ```
- **contactFormSchema** (`src/domain/validationSchemas.ts`, z.object):
  ```ts
  { first_name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo").transform((v) => v.trim()), last_name: z.string().min(1, "Sobrenome é obrigatório").max(100, "Sobrenome muito longo").transform((v) => v.trim()), email: emailSchema, phone: phoneSchema, whatsapp: phoneSchema, role_title: z.string().max(100, "Cargo muito longo").optional().nullable(), company_id: uuidSchema.optional().nullable(), birthday: z.string().optional().nullable(), linkedin: urlSchema, instagram: z.string().max(100).optional().nullable(), twitter: z.string().max(100).optional().nullable(), notes: z.string().max(5000, "Notas muito longas").optional().nullable(), personal_notes: z.string().max(5000, "Notas muito longas").optional().nullable(), tags: z.array(z.string().max(50)).max(20, "Máximo 20 tags"). …
  ```
- **companyFormSchema** (`src/domain/validationSchemas.ts`, z.object):
  ```ts
  { name: z.string().min(1, "Nome da empresa é obrigatório").max(200, "Nome muito longo").transform((v) => v.trim()), razao_social: z.string().max(300).optional().nullable(), nome_fantasia: z.string().max(300).optional().nullable(), cnpj: cnpjSchema, industry: z.string().max(100).optional().nullable(), email: emailSchema, phone: phoneSchema, website: urlSchema, address: z.string().max(500).optional().nullable(), city: z.string().max(100).optional().nullable(), state: z.string().max(2).optional().nullable(), status: z.enum(["active", "inactive", "prospect", "lead", ""]).optional().nullable(), employee_count: z.string().max(50).optional().nullable(), annual_revenue: z.string().max(50).optional().nullable(), notes: z.string().max(10000).optional().nullable(), tags: z.array(z.string().max(50)).m …
  ```
- **interactionFormSchema** (`src/domain/validationSchemas.ts`, z.object):
  ```ts
  { title: z.string().min(1, "Título é obrigatório").max(200, "Título muito longo").transform((v) => v.trim()), type: z.string().min(1, "Tipo é obrigatório"), contact_id: uuidSchema, company_id: uuidSchema.optional().nullable(), content: z.string().max(50000, "Conteúdo muito longo").optional().nullable(), sentiment: z.enum(["positive", "neutral", "negative", ""]).optional().nullable(), follow_up_required: z.boolean().optional().nullable(), follow_up_date: z.string().optional().nullable(), tags: z.array(z.string().max(50)).max(20).optional().nullable(), }
  ```
- **insightItemsSchema** (`src/hooks/useBehavioralProfilesList.ts`, z.array):
  ```ts
  z.union([z.string(), z.object({ label: z.string(), evidence: z.string().optional() })])
  ```
- **surveyStatusSchema** (`src/hooks/useCSATSurveys.ts`, z.enum):
  ```ts
  ['pending', 'sent', 'answered', 'expired']
  ```
- **text** (`src/hooks/useCompanies.ts`, z.string, encadeia default, nullable):
  ```ts
  
  ```
- **numeric** (`src/hooks/useCompanies.ts`, z.number, encadeia default, nullable):
  ```ts
  
  ```
- **optionalText** (`src/hooks/useCompanies.ts`, z.string, encadeia nullable, optional):
  ```ts
  
  ```
- **optionalNumeric** (`src/hooks/useCompanies.ts`, z.number, encadeia nullable, optional):
  ```ts
  
  ```
- **strings** (`src/hooks/useCompanies.ts`, z.array, encadeia default, nullable):
  ```ts
  z.string()
  ```
- **companyRowSchema** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  companyShape
  ```
- **addressSummarySchema** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  { id: z.string(), is_primary: boolean, logradouro: text, numero: text, cidade: text, estado: text, latitude: numeric, longitude: numeric, }
  ```
- **companyAliasSchema** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  { name: z.string(), phone: z.string().nullable(), email: z.string().email().nullable().or(z.literal('')), address: z.string().nullable(), city: z.string().nullable(), state: z.string().nullable(), lat: z.number().finite().nullable(), lng: z.number().finite().nullable(), }
  ```
- **phoneInsertSchema** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  { ...relationMetadata, numero: z.string().min(1), numero_normalizado: optionalText, numero_e164: optionalText, phone_type: z.enum(Constants.public.Enums.phone_type).nullable().optional(), ramal: optionalText, is_whatsapp: z.boolean().nullable().optional(), departamento: optionalText, observacao: optionalText, fonte: optionalText, contexto: optionalText, confiabilidade: optionalNumeric, }
  ```
- **emailInsertSchema** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  { ...relationMetadata, email: z.string().email(), email_normalizado: optionalText, email_type: z.enum(Constants.public.Enums.email_type).nullable().optional(), departamento: optionalText, observacao: optionalText, fonte: optionalText, contexto: optionalText, confiabilidade: optionalNumeric, is_verified: z.boolean().nullable().optional(), }
  ```
- **addressInsertSchema** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  { ...relationMetadata, bairro: optionalText, cep: optionalText, cidade: optionalText, cidade_ibge: optionalNumeric, complemento: optionalText, estado: optionalText, google_maps_url: optionalText, google_place_id: optionalText, horario_funcionamento: optionalText, instrucoes_entrega: optionalText, latitude: optionalNumeric, longitude: optionalNumeric, logradouro: optionalText, numero: optionalText, origem: optionalText, pais: optionalText, ponto_referencia: optionalText, tipo: optionalText, tipo_logradouro: optionalText, }
  ```
- **recovered** (`src/hooks/useCompanies.ts`, z.object):
  ```ts
  { _creation_recovered: z.boolean().optional() }
  ```
- **text** (`src/hooks/useContacts.ts`, z.string, encadeia default, nullable):
  ```ts
  
  ```
- **numeric** (`src/hooks/useContacts.ts`, z.number, encadeia default, nullable):
  ```ts
  
  ```
- **contactRowSchema** (`src/hooks/useContacts.ts`, z.object):
  ```ts
  contactShape
  ```
- **sentimentSchema** (`src/hooks/useConversationIntel.ts`, z.enum):
  ```ts
  ['positive', 'neutral', 'negative', 'mixed']
  ```
- **topicsSchema** (`src/hooks/useConversationIntel.ts`, z.array):
  ```ts
  z.object({ topic_key: z.string().optional(), label: z.string(), category: z.string(), mentions: z.number().int().nonnegative(), relevance: z.number().optional(), })
  ```
- **objectionsSchema** (`src/hooks/useConversationIntel.ts`, z.array):
  ```ts
  z.object({ objection: z.string(), category: z.string(), handled: z.boolean(), suggested_response: z.string().optional(), reframing_suggestions: z.array(z.object({ pattern: z.string(), response: z.string() })).optional(), })
  ```
- **timelineSchema** (`src/hooks/useConversationIntel.ts`, z.array):
  ```ts
  z.object({ position_pct: z.number(), sentiment: z.string(), note: z.string().optional() })
  ```
- **actionItemsSchema** (`src/hooks/useConversationIntel.ts`, z.array):
  ```ts
  z.object({ task: z.string(), owner: z.string(), deadline: z.string().optional() })
  ```
- **keyMomentsSchema** (`src/hooks/useConversationIntel.ts`, z.array):
  ```ts
  z.object({ position_pct: z.number(), moment_type: z.string(), description: z.string() })
  ```
- **criteriaSchema** (`src/hooks/useConversationIntel.ts`, z.array):
  ```ts
  z.object({ key: z.string(), label: z.string(), weight: z.number() })
  ```
- **topicCategorySchema** (`src/hooks/useConversationIntel.ts`, z.enum):
  ```ts
  ['product', 'pricing', 'competition', 'objection', 'closing', 'discovery', 'other']
  ```
- **analysisResponseSchema** (`src/hooks/useConversationIntel.ts`, z.union):
  ```ts
  [ z.object({ ok: z.literal(true), id: z.string(), cached: z.literal(true) }), z.object({ ok: z.literal(true), id: z.string(), analysis: z.object({ talk_ratio_rep: z.number(), talk_ratio_customer: z.number(), sentiment_overall: sentimentSchema, topics: topicsSchema, objections: objectionsSchema, action_items: actionItemsSchema, coaching_score: z.number(), coaching_tips: z.array(z.string()), next_best_action: z.string(), }) }), ]
  ```
- **failure** (`src/hooks/useConversationIntel.ts`, z.object):
  ```ts
  { error: z.string() }
  ```
- **rows** (`src/hooks/useConversationalSearch.ts`, z.array):
  ```ts
  z.object({ id: z.string(), nome_crm: z.string(), industry: z.string().nullable() })
  ```
- **lifeEventsSchema** (`src/hooks/useDashboardMappedData.ts`, z.array):
  ```ts
  z.object({ id: z.string(), type: z.enum(['birthday', 'anniversary', 'promotion', 'travel', 'family', 'achievement', 'other']), title: z.string(), date: z.string().datetime({ offset: true }).transform(value => new Date(value)), notes: z.string().optional(), reminder: z.boolean(), })
  ```
- **rows** (`src/hooks/useMarketingInsights.ts`, z.array):
  ```ts
  z.object({ id: z.string(), disc_primary: z.string().nullable(), vak_primary: z.string().nullable(), motivation_primary: z.string().nullable(), })
  ```
- **contactOverridesSchema** (`src/hooks/useMergeRecords.ts`, z.object):
  ```ts
  { first_name: z.string().nullable(), last_name: z.string().nullable(), email: z.string().nullable(), phone: z.string().nullable(), role_title: z.string().nullable(), company_id: z.string().nullable(), whatsapp: z.string().nullable(), linkedin: z.string().nullable(), instagram: z.string().nullable(), notes: z.string().nullable(), family_info: z.string().nullable(), }
  ```
- **companyOverridesSchema** (`src/hooks/useMergeRecords.ts`, z.object):
  ```ts
  { nome_crm: z.string().regex(/\S/, 'Nome principal obrigatório'), cnpj: z.string().nullable(), industry: z.string().nullable(), website: z.string().nullable(), notes: z.string().nullable(), tags: z.array(z.string()).nullable(), }
  ```
- **generatedActionSchema** (`src/hooks/useNextBestAction.ts`, z.object):
  ```ts
  { success: z.literal(true), next_action: z.object({ ...nextActionFields, id: z.string().min(1).optional(), }) }
  ```
- **persistedActionSchema** (`src/hooks/useNextBestAction.ts`, z.object):
  ```ts
  { ...nextActionFields, id: z.string().min(1), expected_outcome: z.string().nullable(), status: z.string().nullish(), completed_at: z.string().nullish(), completion_notes: z.string().nullish(), edited_script: z.string().nullish(), contextual_tone: z.string().nullish(), was_successful: z.boolean().nullish(), }
  ```
- **discProfileSchema** (`src/hooks/usePortfolioCompatibility.ts`, z.enum):
  ```ts
  ['D', 'I', 'S', 'C']
  ```
- **salespersonProfileSchema** (`src/hooks/usePortfolioCompatibility.ts`, z.object):
  ```ts
  { vakProfile: z.enum(['V', 'A', 'K', 'D']).nullish(), discProfile: discProfileSchema.nullish(), metaprograms: z.object({ motivationDirection: z.string().nullish(), referenceFrame: z.string().nullish(), workingStyle: z.string().nullish(), chunkSize: z.string().nullish(), actionFilter: z.string().nullish(), comparisonStyle: z.string().nullish(), }).nullish(), }
  ```
- **behavior** (`src/hooks/usePortfolioCompatibility.ts`, z.object):
  ```ts
  { discProfile: discProfileSchema.nullish(), disc_profile: discProfileSchema.nullish() }
  ```
- **rfmActionsSchema** (`src/hooks/useRFMAnalysis.ts`, z.array):
  ```ts
  z.object({ id: z.string().min(1).nullish(), action: z.string(), description: z.string(), priority: z.number(), channel: z.enum(['email', 'phone', 'whatsapp', 'meeting', 'any']), timing: z.string(), expectedImpact: z.string().nullish(), })
  ```
- **rfmOffersSchema** (`src/hooks/useRFMAnalysis.ts`, z.array):
  ```ts
  z.object({ id: z.string().min(1).nullish(), offerType: z.string(), description: z.string(), discountPercent: z.number().optional(), validDays: z.number(), reason: z.string(), })
  ```
- **pendingManualStepSchema** (`src/hooks/useSequences.ts`, z.object):
  ```ts
  { pending_manual_step: z.object({ step_id: z.string().uuid(), step_order: z.number().int().positive(), channel: z.string(), }), }
  ```
- **result** (`src/hooks/useSequences.ts`, z.object):
  ```ts
  { enrollment_id: z.string().uuid(), receipt_id: z.string().uuid(), status: z.string(), already_resumed: z.boolean(), }
  ```
- **historyChannelSchema** (`src/hooks/useUnifiedHistory.ts`, z.enum):
  ```ts
  ['whatsapp', 'call', 'email', 'meeting', 'note', 'social']
  ```
- **directionSchema** (`src/hooks/useUnifiedHistory.ts`, z.enum):
  ```ts
  ['inbound', 'outbound', 'unknown']
  ```
- **whatsappMetadataSchema** (`src/hooks/useUnifiedHistory.ts`, z.object):
  ```ts
  { duration_seconds: z.number().nonnegative().nullable().optional() }
  ```
- **result** (`src/hooks/useWhatsAppImport.ts`, z.object):
  ```ts
  { inserted_count: z.number().int().nonnegative(), failed_count: z.number().int().nonnegative(), inserted: z.array(z.string()), failed: z.array(z.object({ index: z.number().int().nonnegative(), error: z.string() })), }
  ```
- **metadata** (`src/hooks/useWhatsAppImport.ts`, z.object):
  ```ts
  { duration_seconds: z.number().nonnegative().nullable().optional(), transcription_status: z.enum(['pending', 'processing', 'done', 'failed', 'not_applicable']).optional(), }
  ```
- **competitorMetadataSchema** (`src/hooks/useWinLoss.ts`, z.object):
  ```ts
  { typical_price_range: z.string().nullable().optional(), notes: z.string().nullable().optional(), }
  ```
- **externalResponseSchema** (`src/lib/externalData.ts`, z.object):
  ```ts
  { error: z.string().nullish(), errorCode: z.string().optional(), fallback: z.boolean().optional(), data: z.unknown().optional(), count: z.number().int().nonnegative().nullable().optional(), }
  ```
- **entityId** (`src/lib/externalData.ts`, z.string):
  ```ts
  
  ```
- **emailSchema** (`src/pages/Auth.tsx`, z.string):
  ```ts
  
  ```
- **passwordSchema** (`src/pages/Auth.tsx`, z.string):
  ```ts
  
  ```
- **nameSchema** (`src/pages/Auth.tsx`, z.string):
  ```ts
  
  ```
- **insightsResponseSchema** (`src/pages/Insights.tsx`, z.object):
  ```ts
  { insights: z.array(z.object({ category: z.string(), title: z.string(), description: z.string(), action_suggestion: z.string(), confidence: z.number().finite(), actionable: z.boolean(), contact_id: z.string().optional(), priority: z.string(), })), }
  ```
- **parsedError** (`src/pages/Insights.tsx`, z.object):
  ```ts
  { error: z.string() }
  ```
- **surveySchema** (`src/pages/PublicSurvey.tsx`, z.object):
  ```ts
  { id: z.string().uuid(), score: z.number().int().nullable(), feedback: z.string().nullable(), status: z.enum(['pending', 'sent', 'answered', 'expired']), channel: z.string().nullable(), expires_at: z.string().nullable(), survey_type: z.enum(['csat', 'nps', 'ces']), rating_min: z.number().int().min(0).max(1), rating_max: z.number().int().min(5).max(10), }
  ```
- **pwSchema** (`src/pages/ResetPassword.tsx`, z.string):
  ```ts
  
  ```
- **schema** (`src/pages/cadastro/EmpresaForm.tsx`, z.object):
  ```ts
  { nome_crm: z.string().trim().min(2, 'Informe o nome').max(200), nome_fantasia: z.string().trim().max(200).optional().or(z.literal('')), razao_social: z.string().trim().max(300).optional().or(z.literal('')), cnpj: z.string().trim().max(20).optional().or(z.literal('')), email: z.string().trim().email('E-mail inválido').max(255).optional().or(z.literal('')), phone: z.string().trim().max(30).optional().or(z.literal('')), city: z.string().trim().max(100).optional().or(z.literal('')), state: z.string().trim().max(2).optional().or(z.literal('')), notes: z.string().trim().max(2000).optional().or(z.literal('')), }
  ```
- **schema** (`src/pages/cadastro/PessoaForm.tsx`, z.object):
  ```ts
  { first_name: z.string().trim().min(1, 'Informe o nome').max(100), last_name: z.string().trim().min(1, 'Informe o sobrenome').max(100), email: z.string().trim().email('E-mail inválido').max(255).optional().or(z.literal('')), phone: z.string().trim().max(30).optional().or(z.literal('')), cargo: z.string().trim().max(120).optional().or(z.literal('')), notes: z.string().trim().max(2000).optional().or(z.literal('')), }
  ```
- **relationshipScoreSchema** (`src/pages/mapa/relationshipScores.ts`, z.number, encadeia nullable):
  ```ts
  
  ```
- **taskSchema** (`src/pages/tarefas/CreateTaskDialog.tsx`, z.object, encadeia superRefine):
  ```ts
  { title: z .string() .trim() .min(3, { message: 'Informe um título com pelo menos 3 caracteres.' }) .max(140, { message: 'Título muito longo (máx. 140).' }), description: z .string() .trim() .max(2000, { message: 'Descrição muito longa (máx. 2000).' }) .optional() .or(z.literal('')), priority: z.enum(['urgent', 'high', 'medium', 'low']), dueDate: z .string() .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Data inválida.' }) .optional() .or(z.literal('')), dueTime: z .string() .regex(/^\d{2}:\d{2}$/, { message: 'Hora inválida.' }) .optional() .or(z.literal('')), taskType: z.string().optional().or(z.literal('')), }
  ```
  - Regras cruzadas (refine): “Defina a data ao informar a hora.”
- **taskSchema** (`src/pages/tarefas/TaskDetailDrawer.tsx`, z.object):
  ```ts
  { title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'), description: z.string().optional(), priority: z.enum(['urgent', 'high', 'medium', 'low']), status: z.string(), due_date: z.date().optional().nullable(), task_type: z.string().optional(), company_id: z.string().uuid().optional().nullable(), contact_id: z.string().uuid().optional().nullable(), }
  ```
- **InputSchema** (`supabase/functions/ai-assistant/index.ts`, z.object):
  ```ts
  { thread_id: z.string().uuid(), message: z.string().min(1).max(4000), context_entity_type: z.string().optional(), context_entity_id: z.string().uuid().optional(), }
  ```
- **RefineInput** (`supabase/functions/ai-email-refine/index.ts`, z.object):
  ```ts
  { original: z.string().min(1).max(8000), subject: z.string().max(300).optional(), instruction: z.string().min(1).max(500), tone: z.enum(['formal', 'casual', 'friendly']).optional(), }
  ```
- **InputSchema** (`supabase/functions/ai-suggest-mapping/index.ts`, z.object):
  ```ts
  { example_payload: z.record(z.unknown()), target_entity: z.enum(["contact", "company", "deal", "interaction", "note", "custom"]), source_hint: z.string().max(120).optional(), }
  ```
- **WritingInput** (`supabase/functions/ai-writing-assistant/index.ts`, z.object):
  ```ts
  { contact: z.object({ firstName: z.string().min(1), lastName: z.string().min(1), roleTitle: z.string().optional(), companyName: z.string().optional(), discProfile: z.enum(['D', 'I', 'S', 'C']).nullable().optional(), discNotes: z.string().optional(), preferredChannel: z.string().optional(), messageStyle: z.string().optional(), formalityLevel: z.number().min(1).max(10).optional(), primaryMotivation: z.string().optional(), primaryFear: z.string().optional(), communicationStyle: z.string().optional(), hobbies: z.array(z.string()).optional(), interests: z.array(z.string()).optional(), vakProfile: z.enum(['V', 'A', 'K']).nullable().optional(), }), recentInteractions: z.array(z.object({ type: z.string(), sentiment: z.string(), content: z.string().optional(), createdAt: z.string(), })).default([]) …
  ```
- **InputSchema** (`supabase/functions/ask-crm/index.ts`, z.object):
  ```ts
  { question: z.string().min(3).max(500), }
  ```
- **BodySchema** (`supabase/functions/bulk-revalidate/index.ts`, z.object):
  ```ts
  { kind: z.enum(["email", "phone", "both"]), statuses: z.array(z.enum(["valid", "invalid", "risky", "unknown", "never"])).min(1).max(5), olderThanDays: z.number().int().min(0).max(365), limit: z.number().int().min(1).max(2000), dryRun: z.boolean().default(false), }
  ```
- **BodySchema** (`supabase/functions/connection-introspect/index.ts`, z.object):
  ```ts
  { connection_id: z.string().uuid(), }
  ```
- **bodySchema** (`supabase/functions/conversation-analyzer/index.ts`, z.object):
  ```ts
  { interaction_id: z.string().uuid(), force: z.boolean().optional(), }
  ```
- **InputSchema** (`supabase/functions/conversational-search/index.ts`, z.object):
  ```ts
  { query: z.string().min(3).max(500), }
  ```
- **bodySchema** (`supabase/functions/deal-room-health/index.ts`, z.object):
  ```ts
  { room_id: z.string().uuid() }
  ```
- **bodySchema** (`supabase/functions/detect-new-device/index.ts`, z.object):
  ```ts
  { fingerprint: z.string().min(1).max(512), device_name: z.string().max(200).optional(), browser: z.string().max(100).optional(), os: z.string().max(100).optional(), ip_address: z.string().ip().max(45).optional(), location: z.string().max(200).optional(), }
  ```
- **DiscAnalyzerInput** (`supabase/functions/disc-analyzer/index.ts`, z.object):
  ```ts
  { texts: z.array(z.string().min(1).max(5000)).min(1, 'Pelo menos 1 texto é necessário').max(50), contactId: z.string().uuid('contactId deve ser UUID válido'), interactionId: z.string().uuid().optional(), userId: z.string().uuid().optional(), // F/F19: interno service-role passa userId no body }
  ```
- **dualWriteSchema** (`supabase/functions/dual-write-proxy/index.ts`, z.object, encadeia superRefine):
  ```ts
  { table: z.string().min(1).max(100), op: z.enum(["insert", "update", "upsert", "delete"]), row: z.record(z.unknown()).optional(), match: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(), }
  ```
  - Regras cruzadas (refine): “row é obrigatório para insert/upsert”
- **BodySchema** (`supabase/functions/email-finder/index.ts`, z.object):
  ```ts
  { firstName: z.string().min(1).max(80), lastName: z.string().min(1).max(80), domain: z.string().min(3).max(253), contactId: z.string().uuid().optional().nullable(), }
  ```
- **InputSchema** (`supabase/functions/email-thread-summary/index.ts`, z.union):
  ```ts
  [ z.object({ interaction_id: z.string().uuid() }), z.object({ contact_id: z.string().uuid(), subject: z.string().min(1).max(500), }), ]
  ```
- **BodySchema** (`supabase/functions/email-verifier/index.ts`, z.object, encadeia refine):
  ```ts
  { email: z.string().email().max(255), contactId: z.string().uuid().optional().nullable(), userId: z.string().uuid().optional(), persist: z.boolean().optional().default(true), queueId: z.string().uuid().optional(), claimToken: z.string().uuid().optional(), }
  ```
- **InputSchema** (`supabase/functions/enrichlayer-linkedin/index.ts`, z.object):
  ```ts
  { linkedinUrl: z.string().url("LinkedIn URL inválida").min(1), contactId: z.string().uuid("contactId deve ser UUID válido").optional(), }
  ```
- **EvolutionInput** (`supabase/functions/evolution-api/index.ts`, z.object):
  ```ts
  { action: z.string().min(1).refine(a => ALLOWED_ACTIONS.has(a), { message: "Ação desconhecida ou não permitida" }), instanceName: z.string().optional(), remoteJid: z.string().optional(), message: z.string().optional(), phoneNumber: z.string().optional(), limit: z.number().int().min(1).max(500).default(20), body: z.record(z.unknown()).optional(), }
  ```
  - Regras cruzadas (refine): “Ação desconhecida ou não permitida”
- **text** (`supabase/functions/evolution-webhook/payload.ts`, z.string):
  ```ts
  
  ```
- **object** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  {}
  ```
- **messageKey** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { id: text, remoteJid: text, fromMe: z.boolean().nullish(), }
  ```
- **messageUpsertData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { key: messageKey.nullish(), pushName: text, status: text, messageTimestamp: z.union([ z.number(), z.string().trim().min(1).transform(value => Number(value)), ]).pipe(z.number().finite()).nullish(), messageType: text, participant: text, instanceId: text, message: z.object({ conversation: text, extendedTextMessage: z.object({ text }).passthrough().nullish(), imageMessage: z.object({ caption: text }).passthrough().nullish(), videoMessage: z.object({ caption: text }).passthrough().nullish(), audioMessage: object.nullish(), documentMessage: z.object({ fileName: text }).passthrough().nullish(), stickerMessage: object.nullish(), locationMessage: z.object({ degreesLatitude: z.union([z.number(), z.string()]).nullish(), degreesLongitude: z.union([z.number(), z.string()]).nullish(), }).passthrough() …
  ```
- **messageUpdateData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { key: messageKey.nullish(), update: z.object({ status: z.union([z.number(), z.string()]).nullish() }).passthrough().nullish(), }
  ```
- **connectionUpdateData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { state: text }
  ```
- **contactsUpsertData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { id: text, pushName: text, name: text, profilePictureUrl: text, }
  ```
- **presenceUpdateData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { id: text }
  ```
- **callData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { from: text, isVideo: z.boolean().nullish(), status: text, }
  ```
- **sendMessageData** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { key: messageKey.nullish() }
  ```
- **parsed** (`supabase/functions/evolution-webhook/payload.ts`, z.object):
  ```ts
  { data: z.union([schema, schema.array()]).nullish() }
  ```
- **InteractionItemSchema** (`supabase/functions/ficha360-conversation-summary/index.ts`, z.object):
  ```ts
  { id: z.string().uuid(), channel: z.string().nullable().optional(), direction: z.string().nullable().optional(), data_interacao: z.string().nullable().optional(), assunto: z.string().nullable().optional(), resumo: z.string().nullable().optional(), }
  ```
- **BodySchema** (`supabase/functions/ficha360-conversation-summary/index.ts`, z.object):
  ```ts
  { contact_id: z.string().uuid(), interactions: z.array(InteractionItemSchema).min(0).max(200), contact_snapshot: z.object({ full_name: z.string(), role_title: z.string().nullable().optional(), company_name: z.string().nullable().optional(), disc_profile: z.string().nullable().optional(), hobbies: z.array(z.string()).optional(), interests: z.array(z.string()).optional(), }), filters_summary: z.object({ period_days: z.number().optional(), channels: z.array(z.string()).optional(), tags: z.array(z.string()).optional(), query: z.string().optional(), }).default({}), force_refresh: z.boolean().optional().default(false), }
  ```
- **bodySchema** (`supabase/functions/firecrawl-scrape/index.ts`, z.object):
  ```ts
  { url: z.string().url().max(2048), options: z.object({ formats: z.array(z.enum(["markdown","html","rawHtml","screenshot"])).optional(), onlyMainContent: z.boolean().optional(), waitFor: z.number().int().min(0).max(30000).optional(), location: z.string().max(100).optional(), }).optional(), }
  ```
- **InsightsInput** (`supabase/functions/generate-insights/index.ts`, z.object):
  ```ts
  { contacts: z.array(z.record(z.unknown())).optional().default([]), interactions: z.array(z.record(z.unknown())).optional().default([]), companies: z.array(z.record(z.unknown())).optional().default([]), }
  ```
- **PayloadSchema** (`supabase/functions/intent-tracker/index.ts`, z.object):
  ```ts
  { pixel_key: z.string().min(8).max(128), signal_type: z.enum(SIGNAL_TYPES), url: z.string().url().optional(), referrer: z.string().max(2048).optional().nullable(), contact_email: z.string().email().max(255).optional().nullable(), external_company_id: z.string().max(128).optional().nullable(), utm: z.record(z.string()).optional(), metadata: z.record(z.unknown()).optional(), }
  ```
- **LuxTriggerSchema** (`supabase/functions/lux-trigger/index.ts`, z.object):
  ```ts
  { entityType: z.enum(['contact', 'company']), entityId: z.string().uuid('entityId must be a valid UUID'), entityData: z.record(z.unknown()).optional(), }
  ```
- **JsonRpcSchema** (`supabase/functions/mcp-server/index.ts`, z.object):
  ```ts
  { jsonrpc: z.literal("2.0"), id: z.union([z.string(), z.number(), z.null()]).optional(), method: z.string().min(1).max(64), params: z.record(z.unknown()).optional(), }
  ```
- **ToolsCallSchema** (`supabase/functions/mcp-server/index.ts`, z.object):
  ```ts
  { name: z.string().min(1).max(64), arguments: z.record(z.unknown()).optional().default({}), }
  ```
- **Input** (`supabase/functions/objection-context-summary/index.ts`, z.object):
  ```ts
  { objection: z.string().min(3).max(500), category: z.string().max(80).optional(), interactionIds: z.array(z.string().uuid()).min(1).max(8), /** IDs marcados como "Útil" pelo usuário; recebem prioridade no contexto. */ usefulInteractionIds: z.array(z.string().uuid()).max(8).optional(), }
  ```
- **bodySchema** (`supabase/functions/objection-handler/index.ts`, z.object):
  ```ts
  { contactId: z.string().uuid(), // objectionId is interpolated into AI system prompt — cap at 200 chars to prevent prompt injection objectionId: z.string().min(1).max(200), }
  ```
- **BodySchema** (`supabase/functions/phone-validator/index.ts`, z.object, encadeia refine):
  ```ts
  { phone: z.string().min(5).max(30), defaultCountry: z.string().length(2).optional().default("BR"), contactId: z.string().uuid().optional().nullable(), userId: z.string().uuid().optional(), persist: z.boolean().optional().default(true), queueId: z.string().uuid().optional(), claimToken: z.string().uuid().optional(), }
  ```
- **BodySchema** (`supabase/functions/playbook-generator/index.ts`, z.object):
  ```ts
  { scenario: z.enum(["discovery", "demo", "negotiation", "objection", "closing", "winback", "onboarding", "custom"]), industry: z.string().max(120).optional(), persona: z.string().max(120).optional(), product_context: z.string().max(2000).optional(), prompt: z.string().min(5).max(2000), save: z.boolean().default(true), }
  ```
- **BodySchema** (`supabase/functions/playbook-recommender/index.ts`, z.object):
  ```ts
  { contact_id: z.string().uuid().optional(), deal_id: z.string().optional(), current_stage: z.string().optional(), recent_topics: z.array(z.string()).max(20).optional(), industry: z.string().optional(), persona: z.string().optional(), competitor_mentioned: z.string().optional(), }
  ```
- **RfmInput** (`supabase/functions/rfm-analyzer/index.ts`, z.object):
  ```ts
  { contactId: z.string().uuid("contactId deve ser UUID válido").optional(), userId: z.string().uuid("userId deve ser UUID válido").optional(), }
  ```
- **bodySchema** (`supabase/functions/semantic-search/index.ts`, z.object):
  ```ts
  { query: z.string().min(2).max(500), limit: z.number().int().min(1).max(50).optional(), useAI: z.boolean().optional(), entities: z.array(z.enum(["products","contacts","companies","interactions"])).optional(), }
  ```
- **SocialBehaviorInput** (`supabase/functions/social-behavior-analyzer/index.ts`, z.object):
  ```ts
  { contactId: z.string().uuid('contactId deve ser UUID válido'), userId: z.string().uuid().optional(), }
  ```
- **bodySchema** (`supabase/functions/social-profile-scraper/index.ts`, z.object):
  ```ts
  { contactId: z.string().uuid(), platform: z.enum(["linkedin", "twitter", "instagram"]), profileUrl: z.string().url().max(2048), }
  ```
- **InputSchema** (`supabase/functions/suggest-next-action/index.ts`, z.object):
  ```ts
  { contactId: z.string().optional(), contact: z.record(z.unknown()).optional(), interactions: z.array(z.record(z.unknown())).optional(), company: z.record(z.unknown()).optional(), }
  ```
- **RoadmapItemSchema** (`supabase/functions/suggest-next-action/index.ts`, z.object):
  ```ts
  { months_ahead: z.union([z.literal(1), z.literal(3), z.literal(6)]), predicted_need: z.string().trim().min(10).max(300), suggested_offering: z.string().trim().min(3).max(120), probability: z.number().min(0).max(100), rationale: z.string().trim().min(10).max(500), }
  ```
- **SuggestionSchema** (`supabase/functions/suggest-next-action/index.ts`, z.object):
  ```ts
  { confidence: z.number(), action_type: z.string(), }
  ```
- **roadmapParsed** (`supabase/functions/suggest-next-action/index.ts`, z.array):
  ```ts
  RoadmapItemSchema
  ```
- **bodySchema** (`supabase/functions/validate-access/index.ts`, z.object):
  ```ts
  { ip: z.string().ip().max(45).optional(), country: z.string().length(2).optional(), city: z.string().max(100).optional(), user_agent: z.string().max(512).optional(), }
  ```
- **bodySchema** (`supabase/functions/voice-to-text/index.ts`, z.object):
  ```ts
  { audio: z.string().optional(), whatsappMessageId: z.string().uuid().optional(), autoSave: z.boolean().optional(), contactId: z.string().uuid().optional(), companyId: z.string().uuid().optional(), userId: z.string().uuid().optional(), }
  ```
- **messageSchema** (`supabase/functions/whatsapp-import/index.ts`, z.object):
  ```ts
  { contact_id: z.string().uuid().optional().nullable(), company_id: z.string().uuid().optional().nullable(), instance_name: z.string().min(1).max(100).default('manual'), remote_jid: z.string().min(1).max(100), message_id: z.string().max(200).optional().nullable(), from_me: z.boolean().default(false), message_type: z.enum(['text', 'audio', 'image', 'video', 'document', 'sticker']).default('text'), content: z.string().max(20000).optional().nullable(), media_url: z.string().url().max(2048).optional().nullable(), media_mimetype: z.string().max(100).optional().nullable(), sender_name: z.string().max(200).optional().nullable(), duration_seconds: z.number().int().min(0).max(86400).optional().nullable(), timestamp: z.string().datetime().optional(), transcription: z.string().max(20000).optional().nu …
  ```
- **bodySchema** (`supabase/functions/whatsapp-import/index.ts`, z.object):
  ```ts
  { messages: z.array(messageSchema).min(1).max(200), }
  ```
- **BodySchema** (`supabase/functions/win-loss-record-deal/index.ts`, z.object):
  ```ts
  { deal_id: z.string().min(1).max(255), outcome: z.enum(["won", "lost", "no_decision", "pending"]).default("pending"), deal_value: z.number().nullable().optional(), sales_cycle_days: z.number().int().nullable().optional(), decision_maker_contact_id: z.string().uuid().nullable().optional(), primary_reason_id: z.string().uuid().nullable().optional(), competitor_id: z.string().uuid().nullable().optional(), lessons_learned: z.string().max(4000).nullable().optional(), notes: z.string().max(4000).nullable().optional(), secondary_reasons: z.array(z.string()).nullable().optional(), }
  ```

### F.2 react-hook-form (register/rules)

_nenhum item encontrado_

### F.3 Restrições em inputs HTML (required/min/max/pattern)

| Campo | Restrições | Arquivo |
|---|---|---|
| `sla-min` | min, type=number, min=1, max=1440 | `src/components/admin/MttaSlaThresholdEditor.tsx` |
| `reset-email` | type=email | `src/components/auth/ForgotPasswordForm.tsx` |
| `contact-task-due` | type=date | `src/components/contact-detail/ContactTasksPanel.tsx` |
| `date` | type=date | `src/components/contact-detail/LifeEventsTab.tsx` |
| `completion-date` | type=date | `src/components/contact-detail/NextBestActionCard.tsx` |
| `prontidao-target-input` | type=number, min=0, max=100 | `src/components/ficha-360/ProntidaoTrendChart.tsx` |
| `rel-name` | max | `src/components/ficha-360/SalvarRelatorioDialog.tsx` |
| `rel-desc` | max | `src/components/ficha-360/SalvarRelatorioDialog.tsx` |
| `saved-view-name` | max | `src/components/interactions/SavedViewsMenu.tsx` |
| `objection-date-from` | type=date, max=dateTo \|\| undefined | `src/components/interactions/insights/ObjectionExamplesModal.tsx` |
| `objection-date-to` | type=date, min=dateFrom \|\| undefined | `src/components/interactions/insights/ObjectionExamplesModal.tsx` |
| `key` | type=number, min=0, max=1, step=0.05 | `src/components/lead-score/LeadScoreWeightsEditor.tsx` |
| `f.key` | required=f.required | `src/components/marketing/PublicFormRenderer.tsx` |
| `f.key` | required=f.required | `src/components/marketing/PublicFormRenderer.tsx` |
| `totp-factor` | disabled=isVerifying | `src/components/security/TwoFactorSetup.tsx` |
| `manual-step-note` | step, max | `src/components/sequences/SequenceManualSteps.tsx` |
| `email` | type=email | `src/pages/Auth.tsx` |
| `email` | disabled | `src/pages/Configuracoes.tsx` |
| `lm-email` | type=email, required | `src/pages/PublicLeadMagnet.tsx` |
| `task-due` | type=date, min=minDate | `src/pages/tarefas/CreateTaskDialog.tsx` |
| `ta` | max | `src/pages/tarefas/CreateTaskDialog.tsx` |

## G. Fórmulas e derivações (como valores são calculados)

### G.1 Colunas calculadas no banco

| Tabela | Coluna | Expressão |
|---|---|---|
| `rfm_analysis` | `rfm_score` | `recency_score::text \|\| frequency_score::text \|\| monetary_score::text` |
| `rfm_analysis` | `rfm_total` | `recency_score + frequency_score + monetary_score` |
| `trigger_intensity_history` | `intensity_change` | `intensity_level - COALESCE(previous_intensity, intensity_level)` |
| `trigger_intensity_history` | `is_escalation` | `COALESCE(previous_intensity, 0) < intensity_level` |
| `trigger_intensity_history` | `reached_max_intensity` | `intensity_level = 5` |
| `lead_scores` | `score_change` | `total_score - COALESCE(previous_score, 0)` |
| `supplier_evaluations` | `nota_geral` | `(nota_preco + nota_prazo + nota_qualidade + nota_entrega)::numeric / 4.0` |
| `carrier_evaluations` | `nota_geral` | `(nota_pontualidade + nota_conservacao + nota_preco_frete + nota_rastreamento + nota_cobertura)::numeric / 5.0` |
| `sequence_email_reservations` | `idempotency_key` | `'seq-' \|\| enrollment_id::text \|\| '-step-' \|\| step_order::text` |

### G.2 Views (consultas derivadas)

| View | SELECT |
|---|---|
| `csat_surveys_public` | `SELECT id, channel, status, score, sent_at, expires_at FROM public.csat_surveys WHERE public_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now())` |
| `document_signatures_public` | `SELECT id, signer_name, signer_email, rendered_html, status, viewed_at, signed_at, expires_at FROM public.document_signatures WHERE signature_token IS NOT NULL AND status <> ALL (ARRAY['declined'::text, 'expired'::text]) AND (expires_at IS NULL OR expires_at > now())` |
| `forms_public` | `SELECT id, slug, name, description, fields, redirect_url, success_message FROM public.forms WHERE is_published = true` |
| `landing_pages_public` | `SELECT id, slug, title, description, blocks, theme, redirect_url FROM public.landing_pages WHERE is_published = true` |
| `push_subscriptions_safe` | `SELECT id, user_id, endpoint, created_at FROM public.push_subscriptions WHERE user_id = (SELECT auth.uid())` |
| `slow_queries_audit` | `SELECT query, calls, total_exec_time / 1000 as total_exec_seconds, mean_exec_time as mean_exec_ms, rows FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 50` |
| `v_contact_behavior_audit` | `SELECT id, contact_id, user_id, 'vak' as analysis_type, created_at as timestamp, analyzed_text, is_validated, user_feedback FROM public.vak_analysis_history UNION ALL SELECT id, contact_id, user_id, 'metaprogram' as analysis_type, created_at as timestamp, analyzed_text, is_validated, user_feedback F …` |
| `v_contact_personality_audit` | `SELECT l.id, l.contact_id, l.created_at AS "timestamp", p.first_name \|\| ' ' \|\| p.last_name AS user_name, l.change_source, l.field_name, l.old_value, l.new_value, l.reason FROM (public.crm_relationship_audit_logs l LEFT JOIN public.profiles p ON ((l.user_id = p.id))) WHERE ((l.reason ~~ '%Atualização …` |
| `v_contact_relatives_audit` | `SELECT a.id, a.relative_id, a.contact_id, a.user_id, a.change_type, a.changed_at, COALESCE(a.new_data->>'name', a.old_data->>'name') as relative_name, COALESCE(a.new_data->>'relationship_type', a.old_data->>'relationship_type') as relationship_type, COALESCE(p.first_name \|\| ' ' \|\| p.last_name, 'Sist …` |
| `v_entities` | `SELECT 'company'::public.entity_type AS entity_type, c.id, COALESCE(c.name, c.nome_fantasia, c.razao_social) AS display_name, c.email, c.phone, c.created_at, c.updated_at FROM public.companies c UNION ALL SELECT 'contact'::public.entity_type, p.id, TRIM(BOTH ' ' FROM CONCAT_WS(' ', p.first_name, p.l …` |
| `v_life_events_audit` | `SELECT h.id, h.life_event_id, h.contact_id, h.user_id, COALESCE(p.first_name \|\| ' ' \|\| p.last_name, 'Sistema') as user_name, h.event_type, h.title, h.event_date, h.recurring, h.reminder_days_before, h.change_type, h.reason, h.changed_at FROM public.life_events_history h LEFT JOIN public.profiles p O …` |
| `vw_contacts_nlp` | `SELECT c.id as contact_id, c.first_name, c.last_name, c.vak_dominant, c.motivation_direction, c.working_style, c.user_id FROM public.contacts c` |
| `vw_lalamove_plus_alerts` | `SELECT 'dead_letter' as alert_type, COUNT(*) as count, MAX(created_at) as latest FROM lalamove_dead_letter WHERE resolved = false AND created_at > now() - interval '24 hours' UNION ALL SELECT 'stall_alerts' as alert_type, COUNT(*) as count, MAX(created_at) as latest FROM lalamove_position_log WHERE …` |
| `vw_pix_accounts` | `SELECT p.id AS pix_id, p.company_id, c.razao_social, c.nome_fantasia, c.cnpj, p.pix_tipo, p.pix_chave, p.pix_favorecido, p.is_active, p.created_by, p.updated_by, p.created_at, p.updated_at FROM public.pix_accounts p JOIN public.companies c ON c.id = p.company_id` |
| `vw_suppliers` | `SELECT c.id, c.bitrix_company_id, c.nome_crm AS title, c.cnpj, (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary = true LIMIT 1) AS phone, (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary = true LIMIT 1) AS email, addr.cidade, a …` |
| `vw_carriers` | `SELECT c.id, c.bitrix_company_id, c.nome_crm AS title, c.cnpj, (SELECT cp.numero FROM company_phones cp WHERE cp.company_id = c.id AND cp.is_primary = true LIMIT 1) AS phone, (SELECT ce.email FROM company_emails ce WHERE ce.company_id = c.id AND ce.is_primary = true LIMIT 1) AS email, addr.cidade, a …` |
| `vw_suppliers_completo` | `SELECT s.id, s.company_id, s.categoria, s.tipo_fornecedor, s.ramo_atividade, s.grupo_economico, s.produtos, s.servicos, s.api_url, s.tem_integracao, s.perfil_preco, s.perfil_qualidade, s.perfil_prazo, s.prazo_entrega_medio, s.pedido_minimo, s.forma_pagamento, s.prazo_pagamento, s.homologado, s.data_ …` |
| `vw_company_social_media` | `SELECT c.id AS company_id, c.nome_fantasia, c.razao_social, c.status AS company_status, max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.url::text END) AS linkedin_url, max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.handle::text END) AS linkedin_handle, max(CASE WHEN csm.plataforma = 'instagra …` |
| `vw_contact_social_media` | `SELECT ct.id AS contact_id, ct.full_name, ct.cargo, ct.company_id, co.nome_fantasia AS empresa, max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.url::text END) AS linkedin_url, max(CASE WHEN csm.plataforma = 'linkedin' THEN csm.handle::text END) AS linkedin_handle, max(CASE WHEN csm.plataforma = ' …` |
| `vw_social_media_stats` | `SELECT 'companies'::text AS entidade, count(DISTINCT c.id) AS total_registros, count(DISTINCT CASE WHEN csm.plataforma = 'linkedin' THEN csm.company_id END) AS com_linkedin, count(DISTINCT CASE WHEN csm.plataforma = 'instagram' THEN csm.company_id END) AS com_instagram, count(DISTINCT CASE WHEN csm. …` |
| `vw_supplier_qualification_dashboard` | `SELECT COUNT(*) AS total_fornecedores, COUNT(*) FILTER (WHERE s.homologado = true) AS total_homologados, COUNT(*) FILTER (WHERE s.homologado = false) AS total_nao_homologados, ROUND(100.0 * COUNT(*) FILTER (WHERE s.homologado = true) / NULLIF(COUNT(*), 0), 1) AS pct_homologados, COUNT(*) FILTER (WHE …` |
| `vw_supplier_ranking` | `SELECT RANK() OVER (ORDER BY ss.score_geral DESC NULLS LAST) AS ranking, co.nome_crm AS fornecedor, co.cnpj, s.homologado, ss.score_geral, ss.score_preco, ss.score_prazo, ss.score_qualidade, ss.score_entrega, ss.classificacao, ss.segment_code, ss.trend, ss.total_avaliacoes, ss.ultima_avaliacao, ss.s …` |
| `vw_supplier_homologation_control` | `SELECT co.nome_crm AS fornecedor, co.cnpj, s.homologado, sh.status AS ultimo_status, sh.data_solicitacao, sh.data_decisao, sh.validade, CASE WHEN sh.validade IS NULL THEN NULL WHEN sh.validade < CURRENT_DATE THEN 0 - (CURRENT_DATE - sh.validade) ELSE sh.validade - CURRENT_DATE END AS dias_para_vence …` |
| `vw_supplier_evaluations_history` | `SELECT co.nome_crm AS fornecedor, se.data_avaliacao, se.referencia, se.nota_preco, se.nota_prazo, se.nota_qualidade, se.nota_entrega, se.nota_geral, se.comentario, u.name AS avaliador, u.departamento AS departamento_avaliador, s.id AS supplier_id, s.company_id, se.id AS evaluation_id, se.created_at …` |
| `vw_supplier_alerts` | `SELECT a.id AS alert_id, a.type, a.priority, a.title, a.message, a.status AS alert_status, a.metadata, a.created_at, a.read_at, co.nome_crm AS fornecedor, co.cnpj, s.homologado, s.score_geral FROM alerts a JOIN companies co ON co.id = a.company_id AND co.deleted_at IS NULL LEFT JOIN suppliers s ON s …` |
| `vw_supplier_homologation_queue` | `SELECT co.nome_crm AS fornecedor, co.cnpj, co.razao_social, CASE WHEN co.cnpj IS NOT NULL THEN true ELSE false END AS tem_cnpj, CASE WHEN EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) THEN true ELSE false END AS tem_telefone, CASE WHEN EXISTS(SELECT 1 FROM company_emails ce WHE …` |
| `vw_supplier_data_quality` | `SELECT COUNT(*) AS total_fornecedores, COUNT(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj != '') AS com_cnpj, ROUND(100.0 * COUNT(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj != '') / COUNT(*), 1) AS pct_cnpj, COUNT(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.razao_social != '') AS c …` |
| `vw_supplier_by_state` | `SELECT COALESCE(addr.estado, 'SEM ESTADO') AS estado, COUNT(*) AS total, COUNT(*) FILTER (WHERE s.homologado = true) AS homologados, COUNT(*) FILTER (WHERE s.homologado = false) AS nao_homologados, ROUND(AVG(ss.score_geral), 2) AS score_medio, COUNT(ss.supplier_id) AS com_avaliacao FROM suppliers s …` |
| `vw_carriers_completo` | `SELECT ca.id, ca.company_id, ca.tipo_transporte, ca.grupo_economico, ca.estados_atendidos, ca.cidades_atendidas, ca.prazo_por_trecho, ca.tipo_frete, ca.tabela_frete, ca.homologado, ca.data_homologacao, ca.score_geral, ca.created_at, ca.updated_at, co.razao_social, co.nome_fantasia, co.nome_crm AS co …` |
| `vw_carrier_qualification_dashboard` | `SELECT count(*) AS total_transportadoras, count(*) FILTER (WHERE ca.homologado = true) AS total_homologados, count(*) FILTER (WHERE ca.homologado = false) AS total_nao_homologados, round(100.0 * count(*) FILTER (WHERE ca.homologado = true)::numeric / NULLIF(count(*), 0)::numeric, 1) AS pct_homologad …` |
| `vw_carrier_ranking` | `SELECT rank() OVER (ORDER BY cs.score_geral DESC NULLS LAST) AS ranking, co.nome_crm AS transportadora, co.cnpj, ca.homologado, cs.score_geral, cs.score_pontualidade, cs.score_conservacao, cs.score_preco_frete, cs.score_rastreamento, cs.score_cobertura, cs.classificacao, cs.segment_code, cs.trend, c …` |
| `vw_carrier_homologation_control` | `SELECT co.nome_crm AS transportadora, co.cnpj, ca.homologado, ch.status AS ultimo_status, ch.data_solicitacao, ch.data_decisao, ch.validade, CASE WHEN ch.validade IS NULL THEN NULL WHEN ch.validade < CURRENT_DATE THEN 0 - (CURRENT_DATE - ch.validade) ELSE ch.validade - CURRENT_DATE END AS dias_para_ …` |
| `vw_carrier_homologation_queue` | `SELECT co.nome_crm AS transportadora, co.cnpj, co.razao_social, CASE WHEN co.cnpj IS NOT NULL THEN true ELSE false END AS tem_cnpj, CASE WHEN EXISTS(SELECT 1 FROM company_phones cp WHERE cp.company_id = co.id) THEN true ELSE false END AS tem_telefone, CASE WHEN EXISTS(SELECT 1 FROM company_emails ce …` |
| `vw_carrier_evaluations_history` | `SELECT co.nome_crm AS transportadora, ce.data_avaliacao, ce.referencia, ce.nota_pontualidade, ce.nota_conservacao, ce.nota_preco_frete, ce.nota_rastreamento, ce.nota_cobertura, ce.nota_geral, ce.comentario, u.name AS avaliador, u.departamento AS departamento_avaliador, ca.id AS carrier_id, ca.compan …` |
| `vw_carrier_alerts` | `SELECT a.id AS alert_id, a.type, a.priority, a.title, a.message, a.status AS alert_status, a.metadata, a.created_at, a.read_at, co.nome_crm AS transportadora, co.cnpj, ca.homologado, ca.score_geral FROM alerts a JOIN companies co ON co.id = a.company_id AND co.deleted_at IS NULL LEFT JOIN carriers c …` |
| `vw_carrier_data_quality` | `SELECT count(*) AS total_transportadoras, count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> '') AS com_cnpj, round(100.0 * count(*) FILTER (WHERE co.cnpj IS NOT NULL AND co.cnpj <> '')::numeric / count(*)::numeric, 1) AS pct_cnpj, count(*) FILTER (WHERE co.razao_social IS NOT NULL AND co.raz …` |
| `vw_carrier_by_state` | `SELECT COALESCE(addr.estado, 'SEM ESTADO') AS estado, count(*) AS total, count(*) FILTER (WHERE ca.homologado = true) AS homologados, count(*) FILTER (WHERE ca.homologado = false) AS nao_homologados, round(avg(cs.score_geral), 2) AS score_medio, count(cs.carrier_id) AS com_avaliacao FROM carriers ca …` |
| `v_guardrail_dashboard` | `SELECT date_trunc('day', created_at) as dia, COUNT(*) as total_checks, COUNT(*) FILTER (WHERE all_passed = true) as passed, COUNT(*) FILTER (WHERE all_passed = false) as blocked, ROUND(COUNT(*) FILTER (WHERE all_passed = false)::numeric / NULLIF(COUNT(*),0) * 100, 1) as block_rate_pct, array_agg(DIS …` |
| `v_ragas_by_agent` | `SELECT agent_id, COUNT(*) as evaluations, ROUND(AVG(faithfulness)::numeric, 3) as avg_faithfulness, ROUND(AVG(answer_relevancy)::numeric, 3) as avg_relevancy, ROUND(AVG(context_precision)::numeric, 3) as avg_precision, ROUND(AVG(context_recall)::numeric, 3) as avg_recall, ROUND(AVG(overall_score)::n …` |
| `v_nlp_analytics` | `SELECT date_trunc('day', created_at) as dia, source_type, COUNT(*) as total_extractions, COUNT(*) FILTER (WHERE sentiment_label = 'urgent') as urgent, COUNT(*) FILTER (WHERE sentiment_label = 'negative') as negative, COUNT(*) FILTER (WHERE sentiment_label = 'positive') as positive, COUNT(*) FILTER ( …` |
| `v_model_catalog` | `SELECT tier, model, provider, input_cost_per_1m as cost_input, output_cost_per_1m as cost_output, context_window, capabilities, CASE WHEN input_cost_per_1m <= 0.01 THEN 'ultra-low' WHEN input_cost_per_1m <= 0.05 THEN 'low' WHEN input_cost_per_1m <= 0.20 THEN 'medium' WHEN input_cost_per_1m <= 1.00 T …` |
| `zapp_history.v_daily_cost` | `SELECT date_trunc('day', occurred_at)::date AS day, function_name, model, COUNT(*) AS calls, COUNT(*) FILTER (WHERE success = TRUE) AS successful, COUNT(*) FILTER (WHERE success = FALSE) AS failed, SUM(input_tokens) AS input_tokens_total, SUM(output_tokens) AS output_tokens_total, SUM(cost_cents) / …` |
| `zapp_history.v_pipeline_pending` | `SELECT 'media_download' AS pipeline, COUNT(*) AS pending, COUNT(*) FILTER (WHERE download_attempts >= 3) AS stuck FROM zapp_history.message_media WHERE download_status IN ('pending','failed') AND download_attempts < 5 UNION ALL SELECT 'audio_transcription', COUNT(*), COUNT(*) FILTER (WHERE transcrip …` |
| `zapp_history.v_recent_summaries` | `SELECT s.id, s.contact_id, c.full_name AS contact_name, co.nome_crm AS company_name, s.summary_date, s.message_count, s.audio_count, s.media_count, s.summary_short, s.sentiment_overall, s.sentiment_score, s.conversion_signal, s.customer_mood, s.synced_to_interactions, s.generated_by_model, s.generat …` |
| `zapp_history.contact_message_stats` | `SELECT c.id AS contact_id, c.full_name, c.company_id, co.nome_crm AS company_name, COUNT(m.id) AS total_messages, COUNT(m.id) FILTER (WHERE m.direction = 'inbound') AS inbound_count, COUNT(m.id) FILTER (WHERE m.direction = 'outbound') AS outbound_count, COUNT(DISTINCT mm.id) AS total_media, COUNT(DI …` |
| `zapp_history.v_contact_360` | `SELECT c.id AS contact_id, c.full_name, c.first_name, c.last_name, c.cargo, c.departamento, c.cpf, c.data_nascimento, c.relationship_stage, c.relationship_score, c.sentiment AS contact_sentiment, c.tags_array AS contact_tags, c.behavior, c.notes, c.user_id AS owner_user_id, co.id AS company_id, co.n …` |
| `zapp_history.v_runtime_config_safe` | `SELECT key, CASE WHEN is_secret THEN CASE WHEN value = 'PENDING_MANUAL_INSERT' THEN '⚠️ NOT_SET' WHEN length(value) > 12 THEN substring(value FROM 1 FOR 6) \|\| '...' \|\| substring(value FROM length(value) - 4) ELSE '***' END ELSE value END AS value_safe, is_secret, description, updated_at FROM zapp_hi …` |
| `zapp_history.v_pedidos_detectados` | `SELECT m.id AS message_id, m.created_at AS recebido_em, c.full_name AS contato, c.id AS contact_id, comp.razao_social AS empresa, m.content AS mensagem_original, m.nlp_sentiment AS urgencia, m.nlp_sentiment_score AS confianca, m.lead_score, m.lead_score_breakdown, m.nlp_structured_order->>'product' …` |
| `zapp_history.v_dashboard_atendimento` | `SELECT (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE) AS msgs_hoje, (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::date = CURRENT_DATE AND direction = 'inbound') AS msgs_recebidas_hoje, (SELECT COUNT(*) FROM zapp_history.messages WHERE created_at::d …` |
| `zapp_history.v_funil_origem` | `SELECT COALESCE(discovery_channel, 'nao_identificado') AS canal, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, COUNT(*) FILTER (WHERE lead_score BETWEEN 60 AND 79) AS leads_warm, COUNT(*) FILTER (WHERE lead_score BE …` |
| `zapp_history.v_top_produtos_demanda` | `WITH normalized AS ( SELECT m.*, zapp_history.normalize_product_name(m.nlp_structured_order->>'product') AS produto_canonico FROM zapp_history.messages m WHERE m.nlp_structured_order ? 'product' ) SELECT n.produto_canonico AS produto, pd.category AS categoria, COUNT(*) AS total_pedidos, COUNT(DISTIN …` |
| `zapp_history.v_funil_vendas` | `WITH stages AS ( SELECT 'descoberta' AS stage, 1 AS ordem UNION ALL SELECT 'interesse', 2 UNION ALL SELECT 'cotacao', 3 UNION ALL SELECT 'proposta', 4 UNION ALL SELECT 'negociacao', 5 UNION ALL SELECT 'fechamento', 6 ) SELECT s.stage AS etapa, s.ordem, COUNT(m.id) AS total_mensagens, COUNT(DISTINCT …` |
| `zapp_history.v_objecoes_recorrentes` | `SELECT unnest(objections) AS objecao, COUNT(*) AS total_ocorrencias, COUNT(DISTINCT contact_id) AS contatos_distintos, AVG(lead_score)::numeric(5,2) AS lead_score_medio, COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS apareceu_no_fechamento, COUNT(*) FILTER (WHERE funnel_stage = 'negociacao') …` |
| `zapp_history.v_sla_atendimento` | `SELECT COALESCE(sla_status, 'sem_resposta') AS sla, COUNT(*) AS total_conversas, MIN(first_response_seconds) AS resposta_mais_rapida_seg, MAX(first_response_seconds) AS resposta_mais_lenta_seg, AVG(first_response_seconds)::INT AS resposta_media_seg, AVG(first_response_seconds / 60.0)::numeric(6,2) A …` |
| `zapp_history.v_conversas_aguardando` | `SELECT c.id AS conversation_id, c.contact_id, ct.full_name AS contato, c.remote_jid AS whatsapp, c.last_message_at AS ultima_msg, EXTRACT(EPOCH FROM (NOW() - c.last_message_at))::INT AS aguardando_seg, EXTRACT(EPOCH FROM (NOW() - c.last_message_at))::INT / 60 AS aguardando_min, c.unread_count, c.las …` |
| `zapp_history.v_volume_por_hora` | `SELECT day_of_week AS dia_semana, EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora, COUNT(*) AS total_mensagens, COUNT(*) FILTER (WHERE direction = 'inbound') AS inbound, COUNT(*) FILTER (WHERE direction = 'outbound') AS outbound, COUNT(*) FILTER (WHERE in_business_hours …` |
| `zapp_history.v_melhores_horarios` | `SELECT day_of_week AS dia_semana, EXTRACT(HOUR FROM (created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora, COUNT(*) AS volume, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, AVG(lead_score)::numeric(5,2) AS score_medio FROM zapp_history.messages WHERE direction = 'inbound' AND day_of_w …` |
| `zapp_history.v_top_contatos_potencial` | `SELECT ct.id AS contact_id, ct.full_name AS contato, comp.razao_social AS empresa, COUNT(DISTINCT m.id) AS total_mensagens, COUNT(DISTINCT conv.id) AS total_conversas, MAX(m.lead_score) AS melhor_lead_score, AVG(m.lead_score)::numeric(5,2) AS score_medio, SUM(m.budget_detected)::numeric(14,2) AS bud …` |
| `zapp_history.v_intelligence_360` | `SELECT m.id AS message_id, m.created_at AS recebido_em, m.direction, m.in_business_hours, m.day_of_week, EXTRACT(HOUR FROM (m.created_at AT TIME ZONE 'America/Sao_Paulo'))::INT AS hora_local, ct.id AS contact_id, ct.full_name AS contato, ct.tags_array AS contato_tags, comp.id AS company_id, comp.raz …` |
| `zapp_history.v_demanda_geografica` | `SELECT COALESCE(location_extracted->>'state', 'nao_identificado') AS uf, COALESCE(location_extracted->>'region', 'nao_identificado') AS regiao, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, COUNT(*) FILTER (WHERE le …` |
| `zapp_history.v_demanda_por_cidade` | `SELECT location_extracted->>'city' AS cidade, location_extracted->>'state' AS uf, (location_extracted->>'is_capital')::BOOLEAN AS capital, COUNT(*) AS total_pedidos, COUNT(DISTINCT contact_id) AS contatos, AVG(lead_score)::numeric(5,2) AS score_medio, SUM(budget_detected)::numeric(14,2) AS budget_to …` |
| `zapp_history.v_segmentacao_clientes` | `SELECT COALESCE(customer_type, 'indefinido') AS tipo_cliente, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS lead_score_medio, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, AVG((nlp_structured_order->>'quantity')::INT)::INT AS qt …` |
| `zapp_history.v_eventos_demanda` | `SELECT event_type AS tipo_evento, COUNT(*) AS total_pedidos, COUNT(DISTINCT contact_id) AS contatos, AVG(lead_score)::numeric(5,2) AS score_medio, AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media, SUM(budget_detected)::numeric(14,2) AS budget_total, array_agg(DISTINCT nlp_structured_o …` |
| `zapp_history.v_tom_comunicacao` | `SELECT communication_tone->>'tone' AS tom, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, AVG((communication_tone->>'emoji_count')::INT)::numeric(5,2) AS emojis_medios, AVG((communication_tone->>'word_count')::INT)::numeric(5 …` |
| `zapp_history.v_buying_triggers` | `SELECT unnest(buying_triggers) AS trigger, COUNT(*) AS total_ocorrencias, COUNT(DISTINCT contact_id) AS contatos_distintos, AVG(lead_score)::numeric(5,2) AS lead_score_medio, AVG(budget_detected)::numeric(12,2) AS budget_medio, COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS chegou_no_fechame …` |
| `zapp_history.v_churn_alerts` | `SELECT m.id AS message_id, m.created_at AS detectado_em, ct.full_name AS contato, comp.razao_social AS empresa, conv.remote_jid AS whatsapp, m.churn_risk->>'risk' AS risco, (m.churn_risk->>'score')::INT AS score_risco, m.churn_risk->'signals' AS sinais, LEFT(m.content, 300) AS mensagem, m.nlp_sentim …` |
| `zapp_history.v_disc_distribution` | `SELECT disc_profile->>'profile' AS perfil, disc_profile->>'description' AS descricao, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS lead_score_medio, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, AVG(budget_detected)::numeric(12 …` |
| `zapp_history.v_payment_preferences` | `SELECT unnest(payment_preferences) AS forma_pagamento, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, SUM(budget_detected)::numeric(14,2) AS valor_total_mencionado FROM zapp_history.messages WHERE payment_preferences IS NOT N …` |
| `zapp_history.v_customization_demand` | `WITH expanded AS ( SELECT id, contact_id, lead_score, jsonb_array_elements_text(COALESCE(customization_extracted->'colors', '[]'::jsonb)) AS color, NULL::TEXT AS material, NULL::TEXT AS technique FROM zapp_history.messages WHERE customization_extracted IS NOT NULL UNION ALL SELECT id, contact_id, le …` |
| `zapp_history.v_journey_funnel` | `WITH stages AS ( SELECT 'TOFU' AS stage, 1 AS ordem, 'Topo - descobrindo' AS jdesc UNION ALL SELECT 'MOFU', 2, 'Meio - comparando' UNION ALL SELECT 'BOFU', 3, 'Fundo - pronto pra comprar' ) SELECT s.stage AS etapa, s.ordem, s.jdesc AS descricao, COUNT(m.id) AS total_mensagens, COUNT(DISTINCT m.conta …` |
| `zapp_history.v_disc_funnel_matrix` | `SELECT disc_profile->>'profile' AS perfil_disc, funnel_stage AS etapa_funil, COUNT(*) AS total, AVG(lead_score)::numeric(5,2) AS score_medio FROM zapp_history.messages WHERE disc_profile IS NOT NULL AND funnel_stage IS NOT NULL GROUP BY disc_profile->>'profile', funnel_stage ORDER BY perfil_disc, et …` |
| `zapp_history.v_topicos_recorrentes` | `SELECT unnest(topics) AS topico, COUNT(*) AS total_ocorrencias, COUNT(DISTINCT contact_id) AS contatos_distintos, AVG(lead_score)::numeric(5,2) AS lead_score_medio, array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas_observadas FROM zapp_history.messages WHERE topics I …` |
| `zapp_history.v_intents_distribution` | `SELECT primary_intent AS intencao, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, COUNT(*) FILTER (WHERE churn_risk IS NOT NULL) AS com_churn, array_agg(DISTINCT funnel_s …` |
| `zapp_history.v_speaker_roles` | `SELECT speaker_role AS papel, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, COUNT(*) FILTER (WHERE lead_score >= 80) AS leads_hot, AVG(budget_detected)::numeric(12,2) AS ticket_medio, COUNT(*) FILTER (WHERE funnel_stage = 'f …` |
| `zapp_history.v_complexity_distribution` | `SELECT order_complexity->>'level' AS complexidade, COUNT(*) AS total_pedidos, AVG((order_complexity->>'score')::INT)::numeric(5,2) AS score_complex_medio, AVG(lead_score)::numeric(5,2) AS lead_score_medio, AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media, AVG(budget_detected)::numeric …` |
| `zapp_history.v_priority_matrix` | `WITH quadrants AS ( SELECT 'Q1_FAZER_AGORA' AS q, 1 AS ord, '🔥 Fazer agora' AS label UNION ALL SELECT 'Q2_AGENDAR', 2, '📅 Agendar' UNION ALL SELECT 'Q3_DELEGAR', 3, '⚡ Delegar' UNION ALL SELECT 'Q4_AUTOMACAO', 4, '🤖 Automatizar' ) SELECT q.q AS quadrante, q.ord, q.label, COUNT(m.id) AS total, COUNT( …` |
| `zapp_history.v_emotional_states` | `SELECT emotional_state->>'dominant' AS estado, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS lead_score_medio, COUNT(*) FILTER (WHERE churn_risk IS NOT NULL) AS com_churn_risco, array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage …` |
| `zapp_history.v_question_topics` | `SELECT jsonb_array_elements_text(question_analysis->'topics') AS topico_pergunta, question_analysis->>'type' AS tipo_pergunta, COUNT(*) AS total_perguntas, COUNT(DISTINCT contact_id) AS contatos_distintos, AVG(lead_score)::numeric(5,2) AS score_medio FROM zapp_history.messages WHERE question_analysi …` |
| `zapp_history.v_proximas_respostas` | `SELECT m.id AS message_id, m.created_at AS recebido_em, m.suggested_response_at AS responder_ate, m.suggested_response_label AS prazo_label, EXTRACT(EPOCH FROM (m.suggested_response_at - NOW()))/60 AS minutos_restantes, ct.full_name AS contato, conv.remote_jid AS whatsapp, m.lead_score, m.priority_q …` |
| `zapp_history.v_language_distribution` | `SELECT language_info->>'lang' AS idioma, language_info->>'dialect' AS dialeto, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio FROM zapp_history.messages WHERE language_info IS NOT NULL GROUP BY language_info->>'lang', language …` |
| `zapp_history.v_hesitation_funnel` | `SELECT hesitation->>'level' AS nivel_hesitacao, COUNT(*) AS total, COUNT(DISTINCT contact_id) AS contatos, AVG(lead_score)::numeric(5,2) AS score_medio, array_agg(DISTINCT funnel_stage) FILTER (WHERE funnel_stage IS NOT NULL) AS etapas FROM zapp_history.messages WHERE hesitation IS NOT NULL GROUP BY …` |
| `zapp_history.v_spam_log` | `SELECT m.id, m.created_at, m.content AS mensagem, c.remote_jid AS whatsapp, m.credibility->>'level' AS nivel, (m.credibility->>'score')::INT AS score, m.credibility->'flags' AS flags, m.quarantined, m.quarantine_reason FROM zapp_history.messages m JOIN zapp_history.conversations c ON c.id = m.conver …` |
| `zapp_history.v_company_sizes` | `SELECT company_size->>'size' AS porte, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, AVG(budget_detected)::numeric(14,2) AS ticket_medio, AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media, COUNT(*) FILTER (WHER …` |
| `zapp_history.v_seasonality_demand` | `SELECT unnest(seasonality) AS sazonalidade, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, SUM((nlp_structured_order->>'quantity')::INT) AS qty_total, SUM(budget_detected)::numeric(14,2) AS valor_total FROM zapp_history.messa …` |
| `zapp_history.v_relationship_funnel` | `SELECT relationship_status->>'status' AS status, COUNT(*) AS total_mensagens, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, AVG((relationship_status->>'total_msgs')::INT)::INT AS msgs_medias_por_contato, COUNT(*) FILTER (WHERE funnel_stage = 'fechamento …` |
| `zapp_history.v_budget_sensitivity` | `SELECT budget_sensitivity->>'sensitivity' AS sensibilidade, COUNT(*) AS total, COUNT(DISTINCT contact_id) AS contatos, AVG(lead_score)::numeric(5,2) AS score_medio, AVG(budget_detected)::numeric(14,2) AS ticket_medio, COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou FROM zapp_history.me …` |
| `zapp_history.v_competitor_alerts` | `SELECT m.id AS message_id, m.created_at, ct.full_name AS contato, comp.razao_social AS empresa, m.competitor_mention->>'context' AS contexto, m.competitor_mention->'flags' AS flags, m.lead_score, m.funnel_stage, LEFT(m.content, 200) AS preview, CASE m.competitor_mention->>'context' WHEN 'pressao_pre …` |
| `zapp_history.v_full_intelligence_stream` | `SELECT m.id AS message_id, m.created_at, ct.full_name AS contato, comp.razao_social AS empresa, m.content AS preview, m.lead_score, CASE WHEN m.lead_score >= 80 THEN 'HOT' WHEN m.lead_score >= 60 THEN 'WARM' WHEN m.lead_score >= 40 THEN 'LUKEWARM' ELSE 'COLD' END AS classificacao, m.priority_quadran …` |
| `zapp_history.v_units_distribution` | `SELECT unit_of_measure AS unidade, COUNT(*) AS total, AVG((nlp_structured_order->>'quantity')::INT)::INT AS qty_media FROM zapp_history.messages WHERE unit_of_measure IS NOT NULL GROUP BY unit_of_measure ORDER BY total DESC` |
| `zapp_history.v_delivery_distribution` | `SELECT delivery_preference->>'method' AS metodo, delivery_preference->>'urgency' AS urgencia, COUNT(*) AS total, AVG(lead_score)::numeric(5,2) AS score_medio FROM zapp_history.messages WHERE delivery_preference IS NOT NULL GROUP BY delivery_preference->>'method', delivery_preference->>'urgency' ORDE …` |
| `zapp_history.v_referral_sources` | `SELECT referral_source->>'source' AS fonte, COUNT(*) AS total, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou FROM zapp_history.messages WHERE referral_source IS NOT NULL GROUP BY referral_sou …` |
| `zapp_history.v_bant_distribution` | `SELECT bant_score->>'classification' AS classificacao, COUNT(*) AS total, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG((bant_score->>'bant_total')::INT)::numeric(5,2) AS score_bant_medio, AVG((bant_score->>'budget')::INT)::numeric(5,2) AS budget_medio, AVG((bant_score->>'authority')::INT)::num …` |
| `zapp_history.v_authority_funnel` | `SELECT decision_authority->>'level' AS nivel_autoridade, COUNT(*) AS total, COUNT(DISTINCT contact_id) AS contatos_unicos, AVG(lead_score)::numeric(5,2) AS score_medio, COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') AS fechou, ROUND(100.0 * COUNT(*) FILTER (WHERE funnel_stage = 'fechamento') / …` |
| `zapp_history.v_routing_queue` | `SELECT m.id AS message_id, m.created_at, ct.full_name AS contato, comp.razao_social AS empresa, m.lead_score, m.bant_score->>'classification' AS bant, m.priority_quadrant, (zapp_history.smart_routing(m.id))->>'queue' AS fila, ((zapp_history.smart_routing(m.id))->>'priority')::INT AS prioridade, (zap …` |
| `zapp_history.v_audit_intelligence` | `SELECT m.id, m.created_at, m.contact_id, m.direction, m.content, m.lead_score, m.primary_intent, m.funnel_stage, m.priority_quadrant, m.quarantined, m.bant_score->>'classification' AS bant_class, (m.bant_score->>'bant_total')::INT AS bant_total, m.bant_score->'signals' AS bant_signals, m.bant_score- …` |
| `mv_daily_kpis` | `SELECT * FROM reporting.mv_daily_kpis` |
| `mv_daily_stats` | `SELECT * FROM reporting.mv_daily_stats` |
| `users_public` | `SELECT id, name, email, departamento, is_active, is_vendedor FROM public.users` |
| `vw_rodizio_carga_closers` | `SELECT u.id AS closer_id, u.name AS closer_nome, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate, count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text) AS total_ativo, count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO …` |
| `vw_rodizio_carga_sdrs` | `SELECT u.id AS sdr_id, u.name AS sdr_nome, u.is_active, u.ordem_rodizio, u.capacidade_max, u.afastado_ate, count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado, count(c.id) AS total_carteira FROM users u LEFT JOIN customers c ON c.sdr_id = …` |
| `vw_rodizio_execucoes` | `SELECT e.id, e.tipo, e.modo, e.iniciado_em, e.finalizado_em, e.total_elegiveis, e.total_rotacionados, e.executado_por_id, u.name AS executado_por_nome, e.revertida_por_execucao_id, EXISTS (SELECT 1 FROM public.rodizio_execucoes r2 WHERE r2.revertida_por_execucao_id = e.id) AS foi_revertida, e.parame …` |
| `vw_rodizio_bloqueios` | `SELECT s.customer_id, c.company_id, co.nome_crm AS company_nome, c.vendedor_id, c.vendedor_nome, s.bloqueado_ate, s.bloqueio_motivo, s.bloqueado_por_id, ub.name AS bloqueado_por_nome, s.bloqueio_aprovado_por_id, ua.name AS aprovado_por_nome, CASE WHEN s.bloqueado_ate IS NULL THEN 'NENHUM' WHEN s.blo …` |
| `vw_rodizio_kpis` | `SELECT u.id AS closer_id, u.name AS closer_nome, count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'ATIVO'::text) AS total_ativo, count(c.id) FILTER (WHERE COALESCE(crs.segmento, 'NAO_ATIVADO'::text) = 'NAO_ATIVADO'::text) AS total_nao_ativado, count(c.id) FILTER (WHERE COALESC …` |
| `vw_singu_data_health` | `WITH metrics AS ( SELECT (SELECT count(*) FROM public.companies WHERE user_id IS NOT NULL)::numeric / NULLIF((SELECT count(*) FROM public.companies), 0)::numeric * 100 AS pct_companies_uid, (SELECT count(*) FROM public.contacts WHERE user_id IS NOT NULL AND deleted_at IS NULL)::numeric / NULLIF((SEL …` |
| `vw_active_alerts` | `SELECT ia.id, ia.alert_type, ia.contact_id, COALESCE(c.full_name, (c.first_name \|\| ' ') \|\| c.last_name) AS contact_name, ia.company_id, COALESCE(co.nome_crm, co.razao_social) AS company_name, ia.days_inactive, ia.last_interaction_date, ia.severity, ia.risk_score, ia.recommended_actions, ia.urgency_r …` |
| `vw_contacts_sem_apelido` | `SELECT ct.id AS contact_id, ct.full_name, ct.first_name, ct.nome_tratamento, ct.apelido, ct.cargo, (SELECT ce.email FROM public.contact_emails ce WHERE ce.contact_id = ct.id AND ce.is_primary = true LIMIT 1) AS email, (SELECT cp.numero_normalizado FROM public.contact_phones cp WHERE cp.contact_id = …` |
| `vw_pending_followups` | `SELECT i.id AS interaction_id, i.contact_id, COALESCE(c.full_name, (c.first_name \|\| ' ') \|\| c.last_name) AS contact_name, (SELECT ce.email FROM public.contact_emails ce WHERE ce.contact_id = c.id AND ce.is_primary = true LIMIT 1) AS contact_email, COALESCE(co.nome_crm, co.razao_social) AS company_na …` |
| `vw_interacoes_sem_apelido` | `SELECT i.id AS interaction_id, i.contact_id, (c.first_name \|\| ' ') \|\| COALESCE(c.last_name, '') AS full_name, NULL::text AS nome_tratamento, i.company_id, co.nome_crm AS empresa, i.channel AS canal, i.data_interacao, i.created_by, i.usuario_responsavel_id AS vendedor, i.user_id FROM public.interacti …` |

### G.3 Funções de cálculo/decisão no código

- **formatCurrency(v: number)** — `src/components/analytics/MonthlyReportWidget.tsx`
  ```
  
  ```
- **formatCurrency(v: number)** — `src/components/analytics/ReportsTab.tsx`
  ```
  
  ```
- **ScoreCard({ label, score, detail, color, trend }: { label: string; score: number; detail: string; color: string; trend?: string | )** — `src/components/analytics/rfm/RFMSubComponents.tsx`
  ```
  const colors: Record<string, string> = { blue: 'bg-info text-info', green: 'bg-success text-success', amber: 'bg-warning text-warning', }; const TrendIcon = trend === 'improving' ? ArrowUp : trend === 'declining' ? ArrowDown : Minus; const trendColor = trend === 'improving' ? 'text-success' : trend === 'declining' ? 'text-destructive' : 'text-muted-foreground'; return ( <div className={`p-4 rounded-lg ${colors[color]}`}> <div className="flex items-center justify-between"> <span className="text-s …
  ```
- **ScorecardTooltip({ company, children }: { company: Company; children: React.ReactNode })** — `src/components/company-card/company-card-parts/CompanyCardHelpers.tsx`
  ```
  const cnpjFormatted = formatCnpj(company.cnpj); const capital = formatCapitalSocial(company.capital_social); const leadScore = (company as Record<string, unknown>).lead_score as number | null; const leadStatus = (company as Record<string, unknown>).lead_status as string | null; const hasExtra = cnpjFormatted || company.razao_social || capital || company.situacao_rf || company.porte_rf || leadScore || leadStatus; if (!hasExtra) return <>{children}</>; return ( <TooltipProvider delayDuration={300} …
  ```
- **formatCurrency(v?: number)** — `src/components/company-detail/CompanyCommercialTab.tsx`
  ```
  v != null ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
  ```
- **gerar(escolhido: MessageTone)** — `src/components/company-detail/QuickFollowUpGenerator.tsx`
  ```
  setTom(escolhido); if (!principal) { toast.error('Cadastre ao menos um contato nesta empresa para gerar o roteiro'); return; } const [primeiro, ...resto] = principal.name.trim().split(/\s+/); await generateSuggestions({ contact: { firstName: primeiro, lastName: resto.join(' '), roleTitle: principal.cargo ?? undefined, companyName }, messageType: 'follow_up', tone: escolhido, customContext: proximaAcao ? `${proximaAcao.action}. ${proximaAcao.reason}` : undefined, });
  ```
- **ScoreExplicabilityPanel({ contactId }: Props)** — `src/components/contact-detail/ScoreExplicabilityPanel.tsx`
  ```
  const { data, isLoading } = useQuery({ queryKey: ['score-explicability', contactId], queryFn: async () => { const { data, error } = await supabase.rpc('get_score_explicability', { p_contact_id: contactId }); if (error) throw error; return data; }, staleTime: 5 * 60_000, }); if (isLoading) return <Skeleton className="h-64 w-full" />; if (!data || typeof data !== 'object') return null; interface FactorEntry { value: number; impact: number; days?: number } interface Explicability { current_score: n …
  ```
- **ScoreHistoryChart({ contactId }: Props)** — `src/components/contact-detail/ScoreHistoryChart.tsx`
  ```
  const { history, loading } = useScoreHistory(contactId); const chartData = useMemo<ChartPoint[]>(() => { if (!Array.isArray(history) || history.length === 0) return []; // Group by date, take last entry per day const byDate = new Map<string, ChartPoint>(); const sorted = [...history].sort( (a, b) => new Date(a.calculated_at).getTime() - new Date(b.calculated_at).getTime() ); for (const entry of sorted) { const dateKey = format(new Date(entry.calculated_at), 'yyyy-MM-dd'); byDate.set(dateKey, { d …
  ```
- **ScoreHistoryPanel({ contactId }: Props)** — `src/components/contact-detail/ScoreHistoryPanel.tsx`
  ```
  const { history, loading } = useScoreHistory(contactId); if (!loading && history.length === 0) return null; return ( <Card> <CardHeader className="pb-3"> <CardTitle className="flex items-center gap-2 text-sm"> <History className="h-4 w-4 text-primary" /> Histórico de Scores ({history.length}) </CardTitle> </CardHeader> <CardContent> <div className="space-y-1.5 max-h-64 overflow-y-auto"> {history.map(entry => { const diff = entry.previous_value != null ? Number(entry.score_value) - Number(entry.p …
  ```
- **formatCurrency(val: number | null)** — `src/components/contact-detail/commercial-tab/DealsLeadsPipelineCard.tsx`
  ```
  if (val == null) return '—'; return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);
  ```
- **ScorecardEditor()** — `src/components/conversation-intel/ScorecardEditor.tsx`
  ```
  const { data: cards } = useCoachingScorecards(); const upsert = useUpsertScorecard(); const [name, setName] = useState(""); const [criteria, setCriteria] = useState(""); const save = () => { if (!name.trim()) return; const list = criteria.split("\n").map((line) => { const [label, weightStr] = line.split("|").map((s) => s.trim()); return { key: label?.toLowerCase().replace(/\s+/g, "_") ?? "", label: label ?? "", weight: Number(weightStr ?? 1) }; }).filter((c) => c.label); upsert.mutate({ name: na …
  ```
- **applyTemplate(example: string)** — `src/components/crm/copywriting/CopyAnalyzer.tsx`
  ```
  setText(example);
  ```
- **generateScript()** — `src/components/crm/copywriting/SalesScriptGenerator.tsx`
  ```
  setIsGenerating(true); setTimeout(() => { let content = ""; const vakPrefix = { visual: "Veja bem", auditory: "Ouça o que tenho a dizer", kinesthetic: "Sinta o impacto" }[vakPreference as 'visual'|'auditory'|'kinesthetic'] || "Veja"; if (persona === 'disc-d') { content = channel === 'whatsapp' ? `Olá [Nome], direto ao ponto. ${vakPrefix}: temos uma solução que aumenta [Métrica] em [X]%. Pode falar amanhã às 10h?` : `Assunto: ROI de [X]% em [Métrica]\n\n[Nome],\n\nNotei sua meta. ${vakPrefix}: im …
  ```
- **formatCurrency(v: number)** — `src/components/dashboard/DealsAtRiskCard.tsx`
  ```
  
  ```
- **calcChange(current: number, previous: number)** — `src/components/dashboard/charts/ChartDataUtils.ts`
  ```
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100); return { current, previous, change, changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral' };
  ```
- **formatCurrency(v: number)** — `src/components/dashboard/widgets/DailySummaryWidget.tsx`
  ```
  
  ```
- **formatCurrency(v: number)** — `src/components/dashboard/widgets/ExecutiveKpisWidget.tsx`
  ```
  
  ```
- **formatCurrency(v: number)** — `src/components/dashboard/widgets/StrategicAccountsWidget.tsx`
  ```
  
  ```
- **formatCurrency(v: number)** — `src/components/dashboard/widgets/WeeklySummaryWidget.tsx`
  ```
  
  ```
- **ValidateAllButton({ contactId, fallbackEmail, fallbackPhone }: Props)** — `src/components/enrichment/ValidateAllButton.tsx`
  ```
  const { data } = useContactRelationalData(contactId); const emailVerifier = useEmailVerifier(); const phoneValidator = usePhoneValidator(); const [running, setRunning] = useState(false); const handleValidateAll = async () => { const emails = data?.emails?.map((e) => e.email).filter(Boolean) ?? []; const phones = data?.phones?.map((p) => p.numero_e164 || p.numero).filter(Boolean) ?? []; if (emails.length === 0 && fallbackEmail) emails.push(fallbackEmail); if (phones.length === 0 && fallbackPhone) …
  ```
- **ValidationQueueCard()** — `src/components/enrichment/ValidationQueueCard.tsx`
  ```
  const { data: stats, isLoading } = useValidationQueueStats(); const trigger = useTriggerQueueWorker(); const { isAdmin } = useIsAdmin(); return ( <Card> <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0"> <CardTitle className="text-sm flex items-center gap-2"> <ListChecks className="h-4 w-4 text-primary" /> Fila de validação (24h) </CardTitle> {isAdmin && ( <Button size="sm" variant="outline" onClick={() => trigger.mutate()} disabled={trigger.isPending} > {trigger. …
  ```
- **AplicarFavoritoCompartilhadoDialog({ onApply }: Props)** — `src/components/ficha-360/AplicarFavoritoCompartilhadoDialog.tsx`
  ```
  const [params, setParams] = useSearchParams(); const token = params.get('favorito'); const payload = useMemo<SharedFavoritePayload | null>( () => (token ? decodeFavoriteFromToken(token) : null), [token], ); const { importShared, findMatch } = useFicha360FilterFavorites(); const [open, setOpen] = useState(false); useEffect(() => { if (token && payload) setOpen(true); else setOpen(false); }, [token, payload]); const clearParam = () => { const next = new URLSearchParams(params); next.delete('favori …
  ```
- **applyFavorite(fav: FilterFavorite)** — `src/components/ficha-360/FavoritosFiltrosMenu.tsx`
  ```
  onApply(fav.days, fav.channels); toast.success(`Favorito "${fav.name}" aplicado.`); setOpen(false);
  ```
- **GerarResumoIAButton({ count, onClick, hasRecentCache }: Props)** — `src/components/ficha-360/GerarResumoIAButton.tsx`
  ```
  const disabled = count === 0; const button = ( <Button size="sm" variant="gradient" onClick={onClick} disabled={disabled} className="h-8 gap-1.5" aria-label={`Gerar resumo IA das ${count} interações filtradas`} > <Sparkles className="h-3.5 w-3.5" /> Resumo IA <Badge variant="secondary" className="h-4 px-1.5 text-[10px] bg-background/30 text-primary-foreground border-0" > {count} </Badge> {hasRecentCache && !disabled && ( <RefreshCw className="h-3 w-3 opacity-70" aria-hidden="true" /> )} </Button …
  ```
- **applyPreset(preset: FilterPreset)** — `src/components/ficha-360/ProximosPassosCard.tsx`
  ```
  setPriorities(preset.priorities); setChannels(preset.channels); setSort(preset.sort);
  ```
- **ScoreRing({ score, level }: { score: number; level: ProntidaoLevel })** — `src/components/ficha-360/ScoreProntidaoCard.tsx`
  ```
  const size = 140; const stroke = 12; const r = (size - stroke) / 2; const c = 2 * Math.PI * r; const offset = c - (score / 100) * c; const cls = levelClasses[level]; return ( <div className="relative" style={{ width: size, height: size }}> <svg width={size} height={size} className="-rotate-90"> <circle cx={size / 2} cy={size / 2} r={r} stroke="hsl(var(--border))" strokeWidth={stroke} fill="none" /> <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth={stroke} fill="none" s …
  ```
- **validate(strValue: string)** — `src/components/inline-edit/InlineEdit.tsx`
  ```
  const num = parseFloat(strValue); if (isNaN(num)) return 'Valor inválido'; if (min !== undefined && num < min) return `Mínimo: ${min}`; if (max !== undefined && num > max) return `Máximo: ${max}`; return null;
  ```
- **readFeedback(key: string)** — `src/components/intelligence/WhyScoreDrawer.tsx`
  ```
  readLocalStorage<Record<string, 'up' | 'down'>>(key);
  ```
- **submitFeedback(value: 'up' | 'down')** — `src/components/intelligence/WhyScoreDrawer.tsx`
  ```
  setFeedback(value); const all = readFeedback(feedbackStorageKey); all[scoreKey] = value; writeFeedback(feedbackStorageKey, all); toast.success(value === 'up' ? 'Feedback registrado: score correto' : 'Feedback registrado: score incorreto', { description: 'Usaremos esse sinal para refinar o modelo localmente.', });
  ```
- **applyPreset(preset: typeof presets[number])** — `src/components/interactions/InteracoesPresetsMenu.tsx`
  ```
  const presetFilters = preset.filters; const payload: SerializedPayload = { q: presetFilters.q?.[0] ?? '', contact: presetFilters.contact?.[0] ?? '', company: presetFilters.company?.[0] ?? '', canais: Array.isArray(presetFilters.canais) ? presetFilters.canais : [], de: presetFilters.de?.[0], ate: presetFilters.ate?.[0], sort: presetFilters.sort?.[0], }; const validSorts = ['recent', 'oldest', 'relevance', 'entity'] as const; type SortVal = typeof validSorts[number]; const nextSort: SortVal = (val …
  ```
- **applyView(view: SavedView<SavedViewState>)** — `src/components/interactions/SavedViewsMenu.tsx`
  ```
  const sp = new URLSearchParams(view.state?.query ?? ''); setSearchParams(sp, { replace: false }); toast.success('Visualização aplicada', { description: view.name }); setOpen(false);
  ```
- **AplicarOndaDialog({ onda }: { onda: number })** — `src/components/lead-routing/tabs/RoutingRulesTab.tsx`
  ```
  const aplicar = useAplicarOnda(); const [open, setOpen] = useState(false); return ( <Dialog open={open} onOpenChange={setOpen}> <DialogTrigger asChild> <Button size="sm"> <PlayCircle className="h-4 w-4 mr-1" /> Aplicar Onda </Button> </DialogTrigger> <DialogContent> <DialogHeader> <DialogTitle className="flex items-center gap-2"> <AlertTriangle className="h-5 w-5 text-warning" /> Aplicar Onda {onda} </DialogTitle> </DialogHeader> <p className="text-sm text-muted-foreground"> Rode primeiro em sim …
  ```
- **ScoreDistributionChartInner({ distribution }: Props)** — `src/components/lead-scoring/ScoreDistributionChart.tsx`
  ```
  const data = (['A','B','C','D'] as const).map(g => ({ name: `Grade ${g}`, value: distribution[g], grade: g })); const total = data.reduce((s, d) => s + d.value, 0); return ( <Card> <CardHeader className="pb-2"> <CardTitle className="text-sm">Distribuição por Grade</CardTitle> </CardHeader> <CardContent className="h-64"> {total === 0 ? ( <div className="text-sm text-muted-foreground h-full flex items-center justify-center">Sem leads pontuados</div> ) : ( <ResponsiveContainer width="100%" height=" …
  ```
- **ScoreRulesEditorInner({ rules }: Props)** — `src/components/lead-scoring/ScoreRulesEditor.tsx`
  ```
  const update = useUpdateRule(); const [drafts, setDrafts] = useState<Record<string, Partial<LeadScoreRule>>>({}); const grouped = rules.reduce<Record<string, LeadScoreRule[]>>((acc, r) => { if (!acc[r.dimension]) acc[r.dimension] = []; acc[r.dimension].push(r); return acc; }, {}); const setDraft = (id: string, patch: Partial<LeadScoreRule>) => setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...patch } })); const save = (rule: LeadScoreRule) => { const d = drafts[rule.id] ?? {}; update.mutate( …
  ```
- **ScoreIndicator({ score, maxScore = 100, showPercentage = true, size = 'md', className, }: ScoreIndicatorProps)** — `src/components/micro-interactions/MorphingNumber.tsx`
  ```
  const percentage = (score / maxScore) * 100; const getColor = (pct: number) => { if (pct >= 80) return 'text-success'; if (pct >= 60) return 'text-primary'; if (pct >= 40) return 'text-warning'; return 'text-destructive'; }; const sizeClasses = { sm: 'text-lg font-medium', md: 'text-2xl font-semibold', lg: 'text-4xl font-bold', }; return ( <motion.div className={cn('flex items-baseline gap-1', className)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} > <MorphingNumber value={sco …
  ```
- **compute()** — `src/components/navigation/ScrollToTopButton.tsx`
  ```
  const docHeight = document.documentElement.scrollHeight; const longListCap = docHeight > 4000 ? 300 : densityAdjusted; const effective = Math.min(densityAdjusted, longListCap); setVisible(window.scrollY > effective); rafRef.current = null;
  ```
- **generateScript()** — `src/components/neuromarketing/PainClaimGainBuilder.tsx`
  ```
  if (pains.length === 0 || claims.length === 0 || gains.length === 0) { toast.error('Complete as 3 etapas para gerar o script'); return; } const dominantPain = pains.sort((a, b) => b.intensity - a.intensity)[0]; const script = ` 🎯 SCRIPT NEURO-OTIMIZADO PARA ${contactName.toUpperCase()} ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 📍 ABERTURA (Ativando o Cérebro Reptiliano) "${contactName.split(' ')[0]}, imagino que você também enfrenta ${dominantPain.description}..." ━━━━━━━━━━━━━━━━━━━━━━━━━━━ …
  ```
- **generateIntegration()** — `src/components/nlp/PerceptualPositions.tsx`
  ```
  if (Object.keys(analyses).length < 2) return null; const integration = { commonGround: 'Ambos querem uma solução que funcione', keyTension: analyses.first && analyses.second ? 'Equilibrar suas metas com as necessidades do cliente' : '', strategicAction: 'Use a perspectiva de observador para mediar', communicationShift: `Adapte sua comunicação para ${activeContact.firstName} baseado na 2ª posição` }; return integration;
  ```
- **generateScript(pattern: Omit<SwishPattern, 'id' | 'script'>)** — `src/components/nlp/SwishPatternGenerator.tsx`
  ```
  const intro = vakType === 'V' ? `${contact.firstName}, vou te guiar em uma visualização rápida...` : vakType === 'A' ? `${contact.firstName}, vou te guiar em um processo... ouça com atenção...` : `${contact.firstName}, vou te guiar em uma experiência... sinta cada passo...`; const step1 = vakType === 'V' ? `Primeiro, imagine aquele momento quando ${pattern.triggerImage}... veja essa imagem bem grande e brilhante na sua frente...` : vakType === 'A' ? `Primeiro, ouça o que você diz a si mesmo quan …
  ```
- **generateScript(stage: SalesStage)** — `src/components/nlp/UnifiedScriptGenerator.tsx`
  ```
  const stageInfo = SALES_STAGE_INFO[stage]; const firstName = contact.firstName; const scripts: Record<SalesStage, Record<ScriptStyle, string>> = { rapport: { aggressive: `${firstName}, vou ser direto com você. ${discProfile === 'D' ? 'Sei que você valoriza resultados.' : discProfile === 'I' ? 'Sei que você curte conversas dinâmicas!' : discProfile === 'S' ? 'Quero garantir que você se sinta confortável.' : 'Trouxe os dados que você precisa.'}`, consultative: `${firstName}, ${vakType === 'V' ? 'é …
  ```
- **generateOutcomeStatement()** — `src/components/nlp/WellFormedOutcomeBuilder.tsx`
  ```
  if (completedCount < 3) return null; const positive = criteria.find(c => c.id === 'positive')?.answer || ''; const sensory = criteria.find(c => c.id === 'sensory')?.answer || ''; const firstStep = criteria.find(c => c.id === 'first-step')?.answer || ''; return `${activeContact.firstName} quer ${positive}. Saberá que conseguiu quando ${sensory}. O primeiro passo é ${firstStep}.`;
  ```
- **generateAiScripts()** — `src/components/nlp/copywriting/CopywritingAiGeneratorTab.tsx`
  ```
  setLoading(true); try { const { data, error } = await supabase.functions.invoke('ai-writing-assistant', { body: { contact: { firstName: contact.firstName, lastName: contact.lastName, roleTitle: contact.roleTitle, companyName: contact.companyName, discProfile: contact.behavior?.discProfile, preferredChannel: contact.behavior?.preferredChannel, messageStyle: contact.behavior?.messageStyle, formalityLevel: contact.behavior?.formalityLevel || 3, }, messageType, customContext, tone, framework, storyA …
  ```
- **formatCurrency(v: number)** — `src/components/pipeline/DealConfidenceBadge.tsx`
  ```
  
  ```
- **invalidateDealQueries(companyId?: string | null)** — `src/components/pipeline/DealDetailDrawer.tsx`
  ```
  for (const key of ['deals-pipeline', 'pipeline-summary', 'weighted-forecast', 'velocity-metrics', 'stage-velocity', 'stalled-deals', 'daily-summary', 'channel-analysis', 'seasonality']) { queryClient.invalidateQueries({ queryKey: [key] }); } queryClient.invalidateQueries({ queryKey: ['company-deals', deal?.company_id] }); if (companyId && companyId !== deal?.company_id) { queryClient.invalidateQueries({ queryKey: ['company-deals', companyId] }); }
  ```
- **formatCurrency(v: number)** — `src/components/pipeline/ForecastConfidencePanel.tsx`
  ```
  
  ```
- **computeConfidence(deal: PipelineDeal, list: InteractionRow[],)** — `src/components/pipeline/ForecastConfidencePanel.tsx`
  ```
  if (deal.dias_no_estagio_atual == null) return null; const stage = deal.pipeline_stage || 'lead'; const stageProb = STAGE_PROBABILITY[stage] ?? 20; const benchmark = STAGE_BENCHMARK[stage] ?? 14; const daysInStage = deal.dias_no_estagio_atual; const stagnation = clamp(((daysInStage / benchmark - 1) / 2) * 100); const recent5 = list.slice(0, 5); const avgSent = recent5.length ? recent5.reduce((a, b) => a + sentimentValue(b.sentiment), 0) / recent5.length : 0; const sentimentScore = clamp(((-avgSe …
  ```
- **GeneratePlaybookDialog({ trigger }: { trigger?: React.ReactNode })** — `src/components/playbooks/GeneratePlaybookDialog.tsx`
  ```
  const [open, setOpen] = useState(false); const [scenario, setScenario] = useState<PlaybookScenario>("discovery"); const [industry, setIndustry] = useState(""); const [persona, setPersona] = useState(""); const [productContext, setProductContext] = useState(""); const [prompt, setPrompt] = useState(""); const generate = useGeneratePlaybook(); const navigate = useNavigate(); const handleSubmit = async () => { if (prompt.trim().length < 5) return; const result = await generate.mutateAsync({ scenari …
  ```
- **applyThemeToDocument(theme: Theme)** — `src/components/theme/themeBootstrap.ts`
  ```
  if (typeof document === "undefined") { return theme === "light" ? "light" : "dark"; } const resolvedTheme = resolveTheme(theme); const root = document.documentElement; root.classList.remove("light", "dark"); root.classList.add(resolvedTheme); root.style.colorScheme = resolvedTheme; return resolvedTheme;
  ```
- **generateCombinedMessage(vakProfile: VAKProfile, metaProfile: MetaprogramProfile, discProfile: DISCProfile | undefined, type: 'opening' | 'object)** — `src/components/triggers/profile-based/generateCombinedMessage.ts`
  ```
  const vakWords = { V: { ver: 'ver', mostrar: 'mostrar', claro: 'claro', visualizar: 'visualizar', perspectiva: 'perspectiva' }, A: { ver: 'ouvir', mostrar: 'contar', claro: 'ressoar', visualizar: 'sintonizar', perspectiva: 'harmonia' }, K: { ver: 'sentir', mostrar: 'compartilhar', claro: 'confortável', visualizar: 'experimentar', perspectiva: 'sensação' }, D: { ver: 'analisar', mostrar: 'apresentar dados', claro: 'lógico', visualizar: 'calcular', perspectiva: 'análise' }, }; const vak = vakWords …
  ```
- **calculateOverallHealth(props: CompanyHealthScoreProps)** — `src/components/ui/company-health-score.tsx`
  ```
  let score = 0; let factors = 0; // Financial health factor (0-25 points) if (props.financialHealth === 'growing') score += 25; else if (props.financialHealth === 'stable') score += 20; else if (props.financialHealth === 'cutting') score += 10; else score += 5; factors++; // Relationship score factor (0-25 points) score += (props.avgRelationshipScore / 100) * 25; factors++; // Engagement factor (0-25 points) const engagementScore = Math.min(props.totalInteractions / 20, 1) * 15 + props.positiveIn …
  ```
- **formatCurrency(value: number, currency: 'BRL' | 'USD')** — `src/components/ui/masked-input.tsx`
  ```
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency, }).format(value / 100);
  ```
- **calculatePriority(score: number, daysSinceContact: number | null)** — `src/components/ui/priority-indicator.tsx`
  ```
  // Critical: Low score AND long time without contact if (score < 40 && daysSinceContact !== null && daysSinceContact > 30) { return { level: 'critical', label: 'Crítico', description: `Score baixo (${score}) e sem contato há ${daysSinceContact} dias`, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive', icon: Flame, pulse: true, }; } // High: Either very low score OR very long time without contact if (score < 40 || (daysSinceContact !== null && daysSinceCon …
  ```
- **calcChange(current: number, previous: number)** — `src/data/analyticsData.ts`
  ```
  const change = previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100); return { current, previous, change, changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral', };
  ```
- **taxaPositiva(dados?: ResumoAtividade)** — `src/data/analyticsData.ts`
  ```
  const total = dados?.totais.interacoes ?? 0; if (total === 0) return 0; const positivas = (dados?.por_sentimento ?? []) .filter(s => s.sentimento === 'positivo' || s.sentimento === 'positive') .reduce((soma, s) => soma + s.total, 0); return Math.round((positivas / total) * 100);
  ```
- **generateAppreciationSuggestion(contactName: string, discProfile: DiscProfileKey, daysSinceLast: number)** — `src/data/carnegieAppreciation.ts`
  ```
  const profile = APPRECIATION_BY_DISC[discProfile]; const preferredType = profile.preferredTypes[0]; const template = APPRECIATION_TEMPLATES[preferredType]; if (!template) return null; const urgency: 'low' | 'medium' | 'high' = daysSinceLast > APPRECIATION_GAP_THRESHOLDS.critical ? 'high' : daysSinceLast > APPRECIATION_GAP_THRESHOLDS.warning ? 'medium' : 'low'; return { contactId: '', // To be filled by caller contactName, type: preferredType, reason: `${contactName} não recebe apreciação há ${da …
  ```
- **calculateCriticismScore(text: string)** — `src/data/carnegieCriticismDetector.ts`
  ```
  const criticalPhrases = detectCriticalLanguage(text); if (criticalPhrases.length === 0) return 100; let penalty = 0; for (const phrase of criticalPhrases) { switch (phrase.severity) { case 'high': penalty += 25; break; case 'medium': penalty += 15; break; case 'low': penalty += 8; break; } } return Math.max(0, 100 - penalty);
  ```
- **generateEagerWantScript(category: DesireCategory, context?: string)** — `src/data/carnegieEagerWant.ts`
  ```
  const want = getEagerWantByCategory(category); if (!want) return ''; const techniques = want.arousalTechniques; // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness const tech = techniques[Math.floor(Math.random() * techniques.length)]; return `${tech.technique}\n\nExemplo: "${tech.example}"`;
  ```
- **generateEncouragementScript(discProfile: 'D' | 'I' | 'S' | 'C', context: string)** — `src/data/carnegieEncouragement.ts`
  ```
  const template = getEncouragementForContext(context); if (!template) return ''; return template.discVariation[discProfile];
  ```
- **calculateEncouragementScore(text: string)** — `src/data/carnegieEncouragement.ts`
  ```
  let score = 50; // Start neutral const textLower = text.toLowerCase(); // Check for minimization (positive) - use fuzzy matching with key words for (const phrases of Object.values(MINIMIZATION_PHRASES)) { for (const phrase of phrases) { const phraseLower = phrase.toLowerCase(); // Direct match if (textLower.includes(phraseLower)) { score += 15; continue; } // Fuzzy match: extract key words (3+ chars) and check if most are present const keyWords = phraseLower.split(/\s+/).filter(w => w.length >= …
  ```
- **calculateInterestScore(counts: Record<string, number>)** — `src/data/carnegieGenuineInterest.ts`
  ```
  let score = 0; for (const [key, config] of Object.entries(INTEREST_SCORING.components)) { const count = counts[key] || 0; const normalizedCount = Math.min(count, config.max) / config.max; score += normalizedCount * config.weight * 100; } return Math.round(score);
  ```
- **generateStoryOutline(type: StoryType, context: { problem: string; solution: string; result: string })** — `src/data/carnegieStorytelling.ts`
  ```
  const template = getStoryTemplateByType(type); if (!template) return ''; return ` ## ${template.name} **Hook:** ${template.structure.hook} **Conflict:** ${context.problem} **Journey:** ${template.structure.journey} **Resolution:** ${context.result} **Lesson:** ${template.structure.lesson} `.trim();
  ```
- **calculateQuality(deviation: number)** — `src/data/carnegieTalkRatio.ts`
  ```
  if (deviation <= 20) return 'excellent'; if (deviation <= 35) return 'good'; if (deviation <= 50) return 'needs_improvement'; return 'poor';
  ```
- **calculateWarmthScore(text: string)** — `src/data/carnegieWarmth.ts`
  ```
  const warmIndicators = detectWarmthIndicators(text); const coldIndicators = detectColdIndicators(text); const warmScore = warmIndicators.reduce((sum, ind) => sum + ind.impact, 0); const coldScore = coldIndicators.reduce((sum, ind) => sum + Math.abs(ind.impact), 0); // Base score of 50, modified by indicators const rawScore = 50 + (warmScore * 2) - (coldScore * 3); // Clamp between 0-100 return Math.max(0, Math.min(100, rawScore));
  ```
- **calculateYesReadiness(yesCount: number)** — `src/data/carnegieYesLadder.ts`
  ```
  // Based on research: after 3-4 yeses, closing probability increases significantly if (yesCount >= 5) return 95; if (yesCount >= 4) return 85; if (yesCount >= 3) return 70; if (yesCount >= 2) return 50; if (yesCount >= 1) return 30; return 10;
  ```
- **generateScenarios(sellerDISC: DISCProfile | null)** — `src/data/communicationTrainingData.ts`
  ```
  const allDISC: DISCProfile[] = ['D', 'I', 'S', 'C']; const scenarios: TrainingScenario[] = []; allDISC.forEach((disc) => { if (disc !== sellerDISC) { scenarios.push({ id: `scenario-${disc}`, title: `Cliente ${DISC_LABELS[disc ?? 'D'].name}`, description: `Como abordar um cliente com perfil ${disc}?`, clientProfile: { disc, vak: disc === 'D' ? 'V' : disc === 'I' ? 'A' : disc === 'S' ? 'K' : 'D', motivation: disc === 'D' || disc === 'I' ? 'toward' : 'away_from', }, situation: getSituation(disc), o …
  ```
- **calculateBlendCode(dScore: number, iScore: number, sScore: number, cScore: number)** — `src/data/discAdvancedData.ts`
  ```
  primary: Exclude<DISCProfile, null>; secondary: Exclude<DISCProfile, null> | null; blend: string | null;
  ```
- **score(s)** — `src/data/discAdvancedData.ts`
  ```
  type: Exclude<DISCProfile, null>; score: number
  ```
- **generatePillarInsights(pillar: EQPillar, score: number)** — `src/data/emotionalIntelligenceData.ts`
  ```
  const level = getEQLevel(score); const info = EQ_PILLAR_INFO[pillar]; const insights: string[] = []; if (level === 'high' || level === 'exceptional') { insights.push(`${info.namePt} é um ponto forte natural`); insights.push(`Use como base para influenciar positivamente`); info.characteristics.high.slice(0, 2).forEach(c => insights.push(c)); } else if (level === 'moderate') { insights.push(`${info.namePt} está em nível adequado`); insights.push(`Há espaço para desenvolvimento`); } else { insights …
  ```
- **generateScriptSections(goal: ScriptGoal, dominantBrain: BrainSystem, firstName: string)** — `src/data/neuroScriptSections.ts`
  ```
  const scripts: Record<ScriptGoal, ScriptSection[]> = { discovery: [ { name: 'Abertura (Hook)', brainTarget: 'reptilian', stimuliUsed: ['self_centered', 'contrast'], timing: '0-30 segundos', content: dominantBrain === 'reptilian' ? `${firstName}, antes de falarmos sobre [produto], preciso entender: qual é o maior risco que você enfrenta hoje se nada mudar nos próximos 3 meses?` : dominantBrain === 'limbic' ? `${firstName}, eu estava pensando em você... Como você tem se sentido em relação a [área] …
  ```
- **computeProntidaoTrend({ interactions, profile, intelligence, weights, weeks = 8, }: ComputeTrendArgs)** — `src/domain/churnRisk.ts`
  ```
  const list = Array.isArray(interactions) ? interactions : []; // Pré-ordenar por data ascendente (mais antigo primeiro) const sorted = [...list] .map((it) => ({ it, t: refDate(it) })) .filter((x): x is { it: ExternalInteraction; t: number } => x.t != null) .sort((a, b) => a.t - b.t); const todayMonday = startOfWeek(new Date()); const points: ProntidaoTrendPoint[] = []; for (let i = weeks - 1; i >= 0; i--) { const wStart = new Date(todayMonday); wStart.setDate(wStart.getDate() - i * 7); const wEn …
  ```
- **computeTrendSlope(points: ProntidaoTrendPoint[], n = 4)** — `src/domain/churnRisk.ts`
  ```
  const valid = points.filter((p) => p.hasData).slice(-n); if (valid.length < 2) return 0; const xs = valid.map((_, i) => i); const ys = valid.map((p) => p.score); const meanX = xs.reduce((a, b) => a + b, 0) / xs.length; const meanY = ys.reduce((a, b) => a + b, 0) / ys.length; let num = 0; let den = 0; for (let i = 0; i < xs.length; i++) { num += (xs[i] - meanX) * (ys[i] - meanY); den += (xs[i] - meanX) ** 2; } return den === 0 ? 0 : num / den;
  ```
- **calculateEngagementScore(recentInteractionCount: number, daysSinceLastContact: number)** — `src/domain/closingScore.ts`
  ```
  const recencyScore = daysSinceLastContact <= 3 ? 50 : daysSinceLastContact <= 7 ? 45 : daysSinceLastContact <= 14 ? 35 : daysSinceLastContact <= 21 ? 25 : daysSinceLastContact <= 30 ? 15 : 5; const frequencyScore = Math.min(50, recentInteractionCount * 10); return recencyScore + frequencyScore;
  ```
- **calculateObjectionScore(unresolvedCount: number)** — `src/domain/closingScore.ts`
  ```
  if (unresolvedCount <= 0) return 80; return Math.max(20, 80 - (unresolvedCount * 15));
  ```
- **calculateValuesScore(importantValuesCount: number)** — `src/domain/closingScore.ts`
  ```
  return Math.min(100, 40 + (importantValuesCount * 15));
  ```
- **calculateDISCScore(discProfile: string | null)** — `src/domain/closingScore.ts`
  ```
  const factor = DISC_CLOSING_FACTORS[discProfile ?? '']; if (!factor) return 50; return 60 + (factor.speed * 40);
  ```
- **calculateConfidence(dataPoints: boolean[])** — `src/domain/closingScore.ts`
  ```
  return Math.round((dataPoints.filter(Boolean).length / dataPoints.length) * 100);
  ```
- **calculateWeightedScore(factors: { score: number; weight: number }[])** — `src/domain/closingScore.ts`
  ```
  return Math.round(factors.reduce((sum, f) => sum + (f.score * f.weight), 0));
  ```
- **computeForecastConfidence(input: ForecastConfidenceInput)** — `src/domain/dealState.ts`
  ```
  let baseConfidence = 0; // 1. Stage baseline const stageWeights: Record<DealStage, number> = { lead: 10, prospect: 20, qualified: 40, proposal: 60, negotiation: 80, customer: 100, ed: 0, }; baseConfidence = stageWeights[input.stage]; // 2. Activity bonus (up to +15) const activityBonus = Math.min(input.interactionCount * 2, 15); // 3. Sentiment factor (modifies total by ±10%) const sentimentFactor = (input.sentimentScore - 50) / 500; // -0.1 to +0.1 // 4. Stagnation penalty (over 30 days in stag …
  ```
- **scoreCadence(cadence: number | null | undefined, lastDays: number | null, weight: number)** — `src/domain/leadScoring.ts`
  ```
  if (cadence == null || lastDays == null) { return { score: 50, weight, label: 'Cadência', status: 'unknown', detail: 'Cadência não definida', }; } const ratio = lastDays / Math.max(1, cadence); let score = 10; let status: ProntidaoStatus = 'bad'; let detail = `Atrasado (${lastDays}d / cadência ${cadence}d)`; if (ratio <= 1.0) { score = 100; status = 'good'; detail = `Em dia (${lastDays}d / ${cadence}d)`; } else if (ratio <= 1.5) { score = 60; status = 'warn'; detail = `Próximo do limite (${lastD …
  ```
- **scoreRecency(lastDays: number | null, weight: number)** — `src/domain/leadScoring.ts`
  ```
  if (lastDays == null) { return { score: 30, weight, label: 'Recência', status: 'unknown', detail: 'Sem registro de contato' }; } let score = 5; let status: ProntidaoStatus = 'bad'; const detail = `Há ${lastDays} dias`; if (lastDays <= 3) { score = 100; status = 'good'; } else if (lastDays <= 7) { score = 80; status = 'good'; } else if (lastDays <= 14) { score = 60; status = 'warn'; } else if (lastDays <= 30) { score = 40; status = 'warn'; } else if (lastDays <= 60) { score = 20; } return { score …
  ```
- **scoreSentiment(sentiment: string | null | undefined, weight: number)** — `src/domain/leadScoring.ts`
  ```
  const v = (sentiment || '').toLowerCase(); if (!v) return { score: 50, weight, label: 'Sentimento', status: 'unknown', detail: 'Sem dados' }; if (v.includes('pos')) return { score: 100, weight, label: 'Sentimento', status: 'good', detail: 'Positivo' }; if (v.includes('neg')) return { score: 20, weight, label: 'Sentimento', status: 'bad', detail: 'Negativo' }; if (v.includes('mix')) return { score: 50, weight, label: 'Sentimento', status: 'warn', detail: 'Misto' }; return { score: 60, weight, lab …
  ```
- **scoreChannel(channel: string | null | undefined, time: string | null | undefined, weight: number)** — `src/domain/leadScoring.ts`
  ```
  const hasCh = !!(channel && channel.trim()); const hasTime = !!(time && time.trim()); if (hasCh && hasTime) return { score: 100, weight, label: 'Canal preferido', status: 'good', detail: `${channel} · ${time}` }; if (hasCh) return { score: 60, weight, label: 'Canal preferido', status: 'warn', detail: `${channel} (sem horário)` }; if (hasTime) return { score: 60, weight, label: 'Canal preferido', status: 'warn', detail: `Horário: ${time}` }; return { score: 30, weight, label: 'Canal preferido', s …
  ```
- **computeProntidaoScore({ profile, intelligence, weights }: ComputeInput)** — `src/domain/leadScoring.ts`
  ```
  const w0 = weights ?? DEFAULT_PRONTIDAO_WEIGHTS; const sum = w0.cadence + w0.recency + w0.sentiment + w0.channel; const w: ProntidaoWeights = sum > 0 ? w0 : DEFAULT_PRONTIDAO_WEIGHTS; const lastDays = daysSince(profile?.last_contact_at); const breakdown: ProntidaoBreakdown = { cadence: scoreCadence(profile?.cadence_days, lastDays, w.cadence), recency: scoreRecency(lastDays, w.recency), sentiment: scoreSentiment(profile?.sentiment ?? intelligence?.sentiment, w.sentiment), channel: scoreChannel(in …
  ```
- **computeProximosPassos(input: ComputeProximosPassosInput)** — `src/domain/nextStepLogic.ts`
  ```
  const { profile, intelligence, recentInteractions, prontidao, birthday, email, feedbackHints } = input; const hintsById = new Map<string, FeedbackHint>(); for (const h of feedbackHints ?? []) { if (!hintsById.has(h.passoId)) hintsById.set(h.passoId, h); } const interactions = Array.isArray(recentInteractions) ? recentInteractions : []; const passos: ProximoPasso[] = []; const bestChannel = normalizeChannel(intelligence?.best_channel); const bestTime = intelligence?.best_time?.trim() || null; con …
  ```
- **applyBehavioralFilters(items: BehavioralProfileListItem[], filters: BehavioralProfilesFilters,)** — `src/hooks/useBehavioralProfilesList.ts`
  ```
  let out = items; if (filters.companyId) out = out.filter((m) => m.company_id === filters.companyId); if (filters.tone) out = out.filter((m) => (m.tone ?? '') === filters.tone); if (filters.search?.trim()) { const q = filters.search.trim().toLowerCase(); out = out.filter( (m) => (m.contact_name ?? '').toLowerCase().includes(q) || (m.company_name ?? '').toLowerCase().includes(q) || (m.summary ?? '').toLowerCase().includes(q), ); } return out;
  ```
- **hourScore(s)** — `src/hooks/useBestTimeToContact.ts`
  ```
  total: number; count: number
  ```
- **sentimentScore(s: string)** — `src/hooks/useClientHealth.ts`
  ```
  s === 'positive' ? 1 : s === 'neutral' ? 0 : -1;
  ```
- **generateNegotiationTips(discProfile: DISCProfile, stage: RelationshipStage, contact: Contact)** — `src/hooks/useClientTriggers.ts`
  ```
  const tips: string[] = []; switch (discProfile) { case 'D': tips.push('🎯 Seja direto e objetivo - Dominantes não gostam de enrolação'); tips.push('📊 Foque em resultados e números concretos'); tips.push('⚡ Ofereça opções e deixe ele escolher - gostam de controle'); tips.push('❌ Evite detalhes excessivos ou histórias longas'); break; case 'I': tips.push('😊 Comece com conversa leve e conexão pessoal'); tips.push('🌟 Use entusiasmo e energia na comunicação'); tips.push('👥 Mencione pessoas conhecidas …
  ```
- **calculateSimilarity(a: StakeholderData, b: StakeholderData)** — `src/hooks/useCoalitionDetection.ts`
  ```
  const supportDiff = Math.abs(a.metrics.support - b.metrics.support); const quadrantMatch = a.quadrant === b.quadrant ? 20 : 0; const riskMatch = a.riskLevel === b.riskLevel ? 10 : 0; // Similar power and interest suggest similar organizational level const powerDiff = Math.abs(a.metrics.power - b.metrics.power); const interestDiff = Math.abs(a.metrics.interest - b.metrics.interest); // Calculate similarity score (0-100) let similarity = 100; similarity -= supportDiff * 10; // Support difference i …
  ```
- **calculatePowerBalance(stakeholders: StakeholderData[])** — `src/hooks/useCoalitionDetection.ts`
  ```
  let supportPower = 0; let oppositionPower = 0; let neutralPower = 0; stakeholders.forEach(s => { const power = s.metrics.power * s.metrics.influence; if (s.metrics.support >= 2) { supportPower += power; } else if (s.metrics.support <= -2) { oppositionPower += power; } else { neutralPower += power; } }); const total = supportPower + oppositionPower + neutralPower; const normalizedSupport = total > 0 ? Math.round((supportPower / total) * 100) : 0; const normalizedOpposition = total > 0 ? Math.roun …
  ```
- **generateInsights(coalitions: Coalition[], clusters: InfluenceCluster[], powerBalance: CoalitionAnalysis['powerBalance'], stakeholders: St)** — `src/hooks/useCoalitionDetection.ts`
  ```
  const insights: string[] = []; // Coalition insights const supportCoalition = coalitions.find(c => c.type === 'support'); const oppositionCoalition = coalitions.find(c => c.type === 'opposition'); if (supportCoalition && supportCoalition.members.length >= 3) { insights.push(`✅ Coalizão de apoio forte com ${supportCoalition.members.length} membros. Use ${supportCoalition.leader?.contact.first_name} como líder informal.`); } if (oppositionCoalition && oppositionCoalition.risk === 'high') { insight …
  ```
- **convertDetectedBiases(json: Json | null)** — `src/hooks/useCognitiveBiasPersistence.ts`
  ```
  if (!json || !Array.isArray(json)) return []; return json as unknown as DetectedBias[];
  ```
- **convertCategoryDistribution(json: Json | null)** — `src/hooks/useCognitiveBiasPersistence.ts`
  ```
  if (!json || typeof json !== 'object' || Array.isArray(json)) { return { decision_making: 0, social: 0, memory: 0, probability: 0, self_perception: 0 }; } return json as unknown as Record<BiasCategory, number>;
  ```
- **generateProfileSummary(contact: Contact, dominantBiases: CognitiveBiasType[], vulnerabilities: { bias: CognitiveBiasType; strength: number }[],)** — `src/hooks/useCognitiveBiases.ts`
  ```
  if (dominantBiases.length === 0) { return `Ainda não há dados suficientes para traçar o perfil de vieses cognitivos de ${contact.firstName}.`; } const topBias = dominantBiases[0]; const topBiasInfo = COGNITIVE_BIAS_INFO[topBias]; let summary = `${contact.firstName} demonstra predominantemente ${topBiasInfo.namePt}`; if (dominantBiases.length > 1) { summary += ` combinado com ${COGNITIVE_BIAS_INFO[dominantBiases[1]].namePt}`; } summary += '. '; if (vulnerabilities.length > 0) { const topVuln = CO …
  ```
- **shouldRetryContactDetail(failureCount: number, error: unknown)** — `src/hooks/useContactDetail.ts`
  ```
  if (failureCount >= 3 || !error || typeof error !== 'object') return false; const { code, status, name, message } = error as { code?: unknown; status?: unknown; name?: unknown; message?: unknown; }; if (name === 'AbortError') return false; if (typeof code === 'string' && /^(?:[0-9A-Z]{5}|PGRST\d{3})$/.test(code)) { if (code === '08P01') return false; return /^(?:08|53)/.test(code) || ['40001', '40P01', '55P03', '57014', '57P01', '57P02', '57P03', 'PGRST000', 'PGRST001', 'PGRST002', 'PGRST003'].i …
  ```
- **invalidate()** — `src/hooks/useContactRelationalData.ts`
  ```
  queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
  ```
- **generateFingerprint()** — `src/hooks/useDeviceDetection.ts`
  ```
  const parts = [ navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset().toString(), navigator.hardwareConcurrency?.toString() ?? '0', ]; let hash = 0; const str = parts.join('|'); for (let i = 0; i < str.length; i++) { const char = str.charCodeAt(i); hash = ((hash << 5) - hash) + char; hash |= 0; } return Math.abs(hash).toString(36);
  ```
- **computeThreadKey(contactId: string, subject: string)** — `src/hooks/useEmailThreadSummary.ts`
  ```
  const norm = subject.toLowerCase().replace(/^(re:|fw:|fwd:)\s*/gi, '').trim(); const data = new TextEncoder().encode(`${contactId}::${norm}`); const hash = await crypto.subtle.digest('SHA-256', data); return Array.from(new Uint8Array(hash)) .slice(0, 16) .map((b) => b.toString(16).padStart(2, '0')) .join('');
  ```
- **generateProfileSummary(contact: Contact, scores: Record<EQPillar, EQPillarScore>, overallScore: number)** — `src/hooks/useEmotionalIntelligence.ts`
  ```
  const level = getEQLevel(overallScore); const sortedPillars = Object.entries(scores) .sort((a, b) => b[1].score - a[1].score); const strongest = sortedPillars[0]; const weakest = sortedPillars[sortedPillars.length - 1]; const levelDescriptions = { low: 'demonstra oportunidades significativas de desenvolvimento em inteligência emocional', developing: 'está em processo de desenvolvimento de sua inteligência emocional', moderate: 'apresenta inteligência emocional adequada para maioria das situações …
  ```
- **invalidate()** — `src/hooks/useExternalRelationalMutations.ts`
  ```
  queryClient.invalidateQueries({ queryKey: ['contact-relational-data', contactId] });
  ```
- **applyClass(theme: IntelTheme)** — `src/hooks/useIntelTheme.ts`
  ```
  if (typeof document === 'undefined') return; const root = document.documentElement; root.classList.remove(`${CLASS_PREFIX}cyan`, `${CLASS_PREFIX}amber`); root.classList.add(`${CLASS_PREFIX}${theme}`);
  ```
- **generatePixelKey()** — `src/hooks/useIntent.ts`
  ```
  const arr = new Uint8Array(16); crypto.getRandomValues(arr); return "px_" + Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
  ```
- **calculateEngagement(data: ContactData)** — `src/hooks/useLeadScore.ts`
  ```
  score: number; factors: ScoreFactor[]
  ```
- **calculateFit(data: ContactData)** — `src/hooks/useLeadScore.ts`
  ```
  score: number; factors: ScoreFactor[]
  ```
- **calculateIntent(data: ContactData)** — `src/hooks/useLeadScore.ts`
  ```
  score: number; factors: ScoreFactor[]
  ```
- **calculateRelationship(data: ContactData)** — `src/hooks/useLeadScore.ts`
  ```
  score: number; factors: ScoreFactor[]
  ```
- **computeLeadScore(data: ContactData, weights = { engagement: 0.30, fit: 0.20, intent: 0.25, relationship: 0.25 }, thresholds = { cold: 0, )** — `src/hooks/useLeadScore.ts`
  ```
  const engagement = calculateEngagement(data); const fit = calculateFit(data); const intent = calculateIntent(data); const relationship = calculateRelationship(data); const total = Math.round( engagement.score * weights.engagement + fit.score * weights.fit + intent.score * weights.intent + relationship.score * weights.relationship ); return { total_score: Math.min(100, total), grade: getGrade(total, thresholds), engagement_score: Math.round(engagement.score), fit_score: Math.round(fit.score), int …
  ```
- **revalidationKey(userId: string)** — `src/hooks/useMFAGuard.ts`
  ```
  `singu:mfa-revalidar:${userId}`;
  ```
- **generateOpeningTips(vakProfile: VAKProfile, discProfile: { type: string })** — `src/hooks/usePreContactBriefing.ts`
  ```
  const tips: string[] = []; if (vakProfile.dominant === 'Visual') { tips.push('📊 Use gráficos ou apresentações visuais'); tips.push('🎨 Descreva cenários e "pinte o quadro"'); } else if (vakProfile.dominant === 'Auditory') { tips.push('🎵 Mantenha tom de voz agradável e ritmado'); tips.push('💬 Use histórias e exemplos verbais'); } else if (vakProfile.dominant === 'Kinesthetic') { tips.push('🤝 Crie conexão pessoal primeiro'); tips.push('💪 Fale de resultados práticos e tangíveis'); } else { tips.push …
  ```
- **generateRecommendedActions(segment: RFMSegment)** — `src/hooks/useRFMAnalysis.ts`
  ```
  const segmentActions: Record<RFMSegment, RFMAction[]> = { champions: [ { id: '1', action: 'Oferecer programa VIP', description: 'Convidar para programa de fidelidade exclusivo', priority: 1, channel: 'email', timing: 'Esta semana', expectedImpact: 'Aumentar retenção em 20%' }, { id: '2', action: 'Pedir indicações', description: 'Solicitar recomendações para novos clientes', priority: 2, channel: 'whatsapp', timing: 'Após próxima compra', expectedImpact: '2-3 novos leads' }, { id: '3', action: 'F …
  ```
- **generateRecommendedOffers(segment: RFMSegment, metrics: PurchaseData)** — `src/hooks/useRFMAnalysis.ts`
  ```
  const offers: RFMOffer[] = []; if (['champions', 'loyal_customers'].includes(segment)) { offers.push({ id: '1', offerType: 'loyalty', description: 'Acesso antecipado + descontos exclusivos', discountPercent: 10, validDays: 30, reason: 'Cliente fiel merece reconhecimento' }); } if (['at_risk', 'about_to_sleep', 'cant_lose'].includes(segment)) { offers.push({ id: '2', offerType: 'win_back', description: 'Desconto progressivo baseado no histórico', discountPercent: 20, validDays: 7, reason: 'Reativ …
  ```
- **calculateChurnProbability(recency: RFMScore, frequency: RFMScore, daysSince: number)** — `src/hooks/useRFMAnalysis.ts`
  ```
  let base = 0; if (recency <= 2) base += 30; if (frequency <= 2) base += 20; if (daysSince > 90) base += 25; else if (daysSince > 60) base += 15; else if (daysSince > 30) base += 5; return Math.min(95, base);
  ```
- **invalidate()** — `src/hooks/useSentimentAnnotations.ts`
  ```
  qc.invalidateQueries({ queryKey: QK(contactId, user?.id) });
  ```
- **calculatePower(contact: Contact)** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  const behavior = contact.behavior as { decisionRole?: DecisionRole; decisionPower?: number; budgetAuthority?: string; } | null; let power = ROLE_POWER_MAP[contact.role || 'contact'] || 3; // Add decision power if available if (behavior?.decisionPower) { power = Math.max(power, behavior.decisionPower); } // Boost for budget authority if (behavior?.budgetAuthority) { const budgetValue = behavior.budgetAuthority.toLowerCase(); if (budgetValue.includes('ilimitado') || budgetValue.includes('total')) …
  ```
- **calculateInterest(contact: Contact, interactions: Interaction[])** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  const contactInteractions = interactions.filter(i => i.contact_id === contact.id); const recentInteractions = contactInteractions.filter(i => { const date = new Date(i.created_at ?? 0); const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24); return daysSince <= 30; }); // Base interest from relationship score let interest = Math.round((contact.relationship_score || 50) / 10); // Boost for recent interactions interest += Math.min(3, recentInteractions.length); // Boost for positi …
  ```
- **calculateInfluence(contact: Contact, allContacts: Contact[])** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  const behavior = contact.behavior as { decisionRole?: DecisionRole; influencesIds?: string[]; supportLevel?: number; } | null; let influence = 3; // Base influence // Decision role influence if (behavior?.decisionRole) { influence = DECISION_ROLE_INFLUENCE[behavior.decisionRole] || influence; } // Number of people they influence const influenceCount = behavior?.influencesIds?.length || 0; influence += Math.min(3, influenceCount); // Support level contribution if (behavior?.supportLevel) { influe …
  ```
- **calculateSupport(contact: Contact)** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  const behavior = contact.behavior as { decisionRole?: DecisionRole; supportLevel?: number; } | null; // Base support from sentiment let support = contact.sentiment === 'positive' ? 2 : contact.sentiment === 'negative' ? -2 : 0; // Support level if available if (behavior?.supportLevel) { support = Math.round((behavior.supportLevel - 5.5) * 0.9); } // Decision role impact if (behavior?.decisionRole === 'champion') { support = Math.max(support, 4); } else if (behavior?.decisionRole === 'blocker') { …
  ```
- **calculateEngagement(contact: Contact, interactions: Interaction[])** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  const contactInteractions = interactions.filter(i => i.contact_id === contact.id); // Recency factor const lastInteraction = contactInteractions[0]; let recencyScore = 1; if (lastInteraction) { const daysSince = (Date.now() - new Date(lastInteraction.created_at ?? 0).getTime()) / (1000 * 60 * 60 * 24); if (daysSince <= 7) recencyScore = 10; else if (daysSince <= 14) recencyScore = 8; else if (daysSince <= 30) recencyScore = 6; else if (daysSince <= 60) recencyScore = 4; else recencyScore = 2; } …
  ```
- **calculateRiskLevel(metrics: StakeholderMetrics, quadrant: StakeholderData['quadrant'])** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  // High power blockers are high risk if (metrics.power >= 7 && metrics.support <= -2) { return 'high'; } // Manage closely stakeholders with low support are medium-high risk if (quadrant === 'manage_closely' && metrics.support <= 0) { return 'medium'; } // Low engagement from important stakeholders if (metrics.power >= 6 && metrics.engagement <= 3) { return 'medium'; } return 'low';
  ```
- **calculatePriority(metrics: StakeholderMetrics, quadrant: StakeholderData['quadrant'], riskLevel: StakeholderData['riskLevel'])** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  let priority = 0; // Quadrant weight const quadrantWeight: Record<typeof quadrant, number> = { manage_closely: 40, keep_satisfied: 30, keep_informed: 20, monitor: 10, }; priority += quadrantWeight[quadrant]; // Risk weight const riskWeight: Record<typeof riskLevel, number> = { high: 30, medium: 15, low: 0, }; priority += riskWeight[riskLevel]; // Power and influence weight priority += (metrics.power + metrics.influence) * 1.5; // Support negative weight (blockers get higher priority to address) …
  ```
- **generateRecommendations(stakeholders: StakeholderData[])** — `src/hooks/useStakeholderAnalysis.ts`
  ```
  const recommendations: string[] = []; // Check for high-risk blockers const highRiskBlockers = stakeholders.filter(s => s.riskLevel === 'high' && s.metrics.support < 0); if (highRiskBlockers.length > 0) { const names = highRiskBlockers.map(s => s.contact.first_name).join(', '); recommendations.push(`⚠️ Prioridade crítica: ${names} são bloqueadores de alto risco. Desenvolva plano de conversão.`); } // Check for champions const champions = stakeholders.filter(s => s.metrics.support >= 4 && s.metri …
  ```
- **calculatePowerBalance(stakeholders: StakeholderData[])** — `src/hooks/useStakeholderSimulator.ts`
  ```
  let supportPower = 0; let oppositionPower = 0; let neutralPower = 0; stakeholders.forEach(s => { const power = s.metrics.power * s.metrics.influence; if (s.metrics.support >= 2) { supportPower += power; } else if (s.metrics.support <= -2) { oppositionPower += power; } else { neutralPower += power; } }); const total = supportPower + oppositionPower + neutralPower; const normalizedSupport = total > 0 ? Math.round((supportPower / total) * 100) : 0; const normalizedOpposition = total > 0 ? Math.roun …
  ```
- **calculateRiskScore(stakeholders: StakeholderData[])** — `src/hooks/useStakeholderSimulator.ts`
  ```
  const blockers = stakeholders.filter(s => s.metrics.support <= -2); const highPowerBlockers = blockers.filter(s => s.metrics.power >= 7); const champions = stakeholders.filter(s => s.metrics.support >= 3); let riskScore = 0; riskScore += blockers.length * 15; riskScore += highPowerBlockers.length * 25; riskScore -= champions.length * 10; return Math.min(100, Math.max(0, riskScore));
  ```
- **applyChangesToStakeholders(stakeholders: StakeholderData[], changes: SimulatedChange[])** — `src/hooks/useStakeholderSimulator.ts`
  ```
  return stakeholders.map(s => { const change = changes.find(c => c.contactId === s.contact.id); if (!change) return s; return { ...s, metrics: { ...s.metrics, ...change.newMetrics, }, }; });
  ```
- **calculateEffort(changes: SimulatedChange[])** — `src/hooks/useStakeholderSimulator.ts`
  ```
  const totalSupportChange = changes.reduce((sum, c) => { const originalSupport = c.originalMetrics.support; const newSupport = c.newMetrics.support ?? originalSupport; return sum + Math.abs(newSupport - originalSupport); }, 0); if (totalSupportChange <= 3) return 'low'; if (totalSupportChange <= 8) return 'medium'; return 'high';
  ```
- **calculateSuccessProbability(changes: SimulatedChange[], stakeholders: StakeholderData[])** — `src/hooks/useStakeholderSimulator.ts`
  ```
  let probability = 70; // Base probability changes.forEach(change => { const stakeholder = stakeholders.find(s => s.contact.id === change.contactId); if (!stakeholder) return; const supportChange = (change.newMetrics.support ?? stakeholder.metrics.support) - stakeholder.metrics.support; // Converting blockers is harder if (stakeholder.metrics.support <= -3 && supportChange > 0) { probability -= 15; } // High power stakeholders are harder to change if (stakeholder.metrics.power >= 8) { probability …
  ```
- **generateImprovements(original: PowerBalance, simulated: PowerBalance, originalRisk: number, simulatedRisk: number)** — `src/hooks/useStakeholderSimulator.ts`
  ```
  const improvements: string[] = []; if (simulated.supportPower > original.supportPower) { improvements.push(`Aumento de ${simulated.supportPower - original.supportPower}% no poder de apoio`); } if (simulated.oppositionPower < original.oppositionPower) { improvements.push(`Redução de ${original.oppositionPower - simulated.oppositionPower}% no poder de oposição`); } if (simulated.balance === 'favorable' && original.balance !== 'favorable') { improvements.push('Balanço de poder se torna favorável'); …
  ```
- **generateRisks(changes: SimulatedChange[], stakeholders: StakeholderData[])** — `src/hooks/useStakeholderSimulator.ts`
  ```
  const risks: string[] = []; changes.forEach(change => { const stakeholder = stakeholders.find(s => s.contact.id === change.contactId); if (!stakeholder) return; // Aggressive conversion of blockers if (stakeholder.metrics.support <= -3 && (change.newMetrics.support ?? 0) >= 2) { risks.push(`Conversão agressiva de ${change.contactName} pode gerar resistência`); } // High power stakeholder manipulation if (stakeholder.metrics.power >= 8) { risks.push(`${change.contactName} tem alto poder - mudança …
  ```
- **generateRecommendation(result: Omit<SimulationResult, 'recommendation'>)** — `src/hooks/useStakeholderSimulator.ts`
  ```
  if (result.successProbability >= 70 && result.effortRequired !== 'high') { return 'Cenário viável com boa probabilidade de sucesso. Recomendado prosseguir com a estratégia.'; } if (result.successProbability >= 50 && result.improvements.length > 0) { return 'Cenário moderadamente viável. Considere dividir em etapas menores para aumentar chances de sucesso.'; } if (result.successProbability < 50) { return 'Cenário de alto risco. Recomenda-se revisar a estratégia ou focar em alvos mais acessíveis p …
  ```
- **calculateRiskLevel(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  let riskScore = 0; if (ctx.hiddenObjections.length > 2) riskScore += 30; else if (ctx.hiddenObjections.length > 0) riskScore += 15; if (ctx.biasResult && ctx.biasResult.resistances.length > 2) riskScore += 25; if (ctx.contact.sentiment === 'negative') riskScore += 25; else if (ctx.contact.sentiment === 'neutral') riskScore += 10; if (ctx.rapportScore < 30) riskScore += 20; else if (ctx.rapportScore < 50) riskScore += 10; if (ctx.overallConfidence < 40) riskScore += 15; if (riskScore >= 50) retur …
  ```
- **calculateSuccessRate(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  let rate = 50; if (ctx.overallConfidence > 70) rate += 15; else if (ctx.overallConfidence > 50) rate += 8; if (ctx.rapportScore > 70) rate += 12; else if (ctx.rapportScore > 50) rate += 6; if (ctx.contact.sentiment === 'positive') rate += 10; if (ctx.contact.relationshipScore && ctx.contact.relationshipScore > 70) rate += 8; if (ctx.activeTriggers.length > 2) rate += 8; if (ctx.topValues.length > 2) rate += 5; if (ctx.hiddenObjections.length > 2) rate -= 15; else if (ctx.hiddenObjections.length …
  ```
- **generatePhases(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  const { vakType, discProfile, topValues, metaprogramProfile, hiddenObjections, biasResult, rapportScore } = ctx; const phases: ApproachPhase[] = []; // Phase 1: Rapport const rapportActions: string[] = []; const rapportTechniques: string[] = []; const rapportScripts: string[] = []; if (vakType === 'V') { rapportActions.push('Compartilhe conteúdo visual relevante'); rapportTechniques.push('Espelhamento visual'); rapportScripts.push('Quero mostrar algo que vai te interessar...'); } else if (vakTyp …
  ```
- **generateChannels(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  const { vakType, discProfile, contact } = ctx; const channels: CommunicationChannel[] = []; const bestWindow = (contact.behavior as unknown as Record<string, unknown> | null)?.bestContactWindow as string || 'Manhã'; if (vakType === 'A' || discProfile === 'I') channels.push({ channel: 'Ligação telefônica', effectiveness: 90, reason: 'Perfil auditivo/influente valoriza comunicação verbal', bestTimeSlot: bestWindow, tips: ['Varie o tom de voz', 'Use pausas estratégicas', 'Demonstre entusiasmo'] }); …
  ```
- **generateMessages(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  const { discProfile, firstName, metaprogramProfile } = ctx; const messages: PersonalizedMessage[] = []; if (discProfile === 'D') messages.push({ context: 'Abertura', message: `${firstName}, tenho algo que pode acelerar seus resultados. Posso te mostrar em 5 minutos?`, tone: 'Direto e objetivo', keyPhrases: ['resultados', 'acelerar', 'rápido'] }); else if (discProfile === 'I') messages.push({ context: 'Abertura', message: `${firstName}! Lembrei de você quando vi isso - acho que vai adorar!`, tone …
  ```
- **generateDoAndDont(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  do: string[]; dont: string[]
  ```
- **generateObjectionHandling(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  objection: string; response: string; technique: string
  ```
- **generateClosingTechniques(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  technique: string; script: string; effectiveness: number; bestFor: string
  ```
- **generateUrgencyTriggers(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  const triggers: string[] = []; if (ctx.metaprogramProfile?.motivationDirection === 'toward') { triggers.push('Destaque oportunidade limitada', 'Mostre early adopters obtendo resultados'); } else { triggers.push('Destaque riscos de esperar', 'Mostre custo da inação'); } if (ctx.discProfile === 'D') triggers.push('Competidores já estão usando'); else if (ctx.discProfile === 'I') triggers.push('Outros estão falando sobre isso'); triggers.push('Preço promocional por tempo limitado', 'Disponibilidade …
  ```
- **generateTrustBuilders(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  const builders: string[] = []; if (ctx.metaprogramProfile?.referenceFrame === 'external') { builders.push('Apresente depoimentos de clientes', 'Mostre logos de empresas conhecidas', 'Cite estatísticas de mercado'); } else { builders.push('Respeite a experiência dele', 'Pergunte sua opinião antes de sugerir', 'Valide intuições dele'); } if (ctx.eqResult?.strengths?.includes('empathy')) builders.push('Demonstre compreensão genuína'); builders.push('Seja transparente sobre limitações', 'Cumpra prom …
  ```
- **generateDecisionAccelerators(ctx: ApproachContext)** — `src/hooks/approach/generators.ts`
  ```
  const accelerators: string[] = []; if (ctx.discProfile === 'D') { accelerators.push('Elimine burocracia', 'Ofereça decisão imediata'); } else if (ctx.discProfile === 'I') { accelerators.push('Torne divertido e social', 'Envolva pessoas importantes'); } else if (ctx.discProfile === 'S') { accelerators.push('Ofereça período de teste', 'Garanta suporte contínuo'); } else if (ctx.discProfile === 'C') { accelerators.push('Forneça documentação completa', 'Dê tempo, mas defina deadline'); } if (ctx.act …
  ```
- **calculateTimeout(textLength: number)** — `src/hooks/voice/playTtsAudio.ts`
  ```
  const base = 10000; const perHundredChars = 2000; const extra = Math.ceil(textLength / 100) * perHundredChars; return Math.min(base + extra, 30000);
  ```
- **validateAction(action: VoiceAgentAction)** — `src/hooks/voice/processTranscript.ts`
  ```
  if (!action?.action || !action?.response || !VALID_ACTIONS.has(action.action)) { return { action: "answer", response: action?.response || "Desculpe, não entendi. Pode repetir?", data: {}, }; } return action;
  ```
- **computeAlertStats(rows: readonly AlertRowLike[])** — `src/lib/behavioralAlertStats.ts`
  ```
  const real = rows.filter((r) => !r.is_simulated); const sim = rows.filter((r) => r.is_simulated); const acked = real.filter((r) => r.acknowledged_at); const ackDeltasMs = acked.map((r) => { const created = new Date(r.created_at).getTime(); const ack = new Date(r.acknowledged_at as string).getTime(); return Math.max(0, ack - created); }); const mttaMs = ackDeltasMs.length ? ackDeltasMs.reduce((s, v) => s + v, 0) / ackDeltasMs.length : null; const p95Ms = percentile(ackDeltasMs, 0.95); const realC …
  ```
- **computeIsolatedFilterCounts(interactions: Interaction[] | null | undefined, filters: AdvancedFilters, debouncedQ: string, contactLabel?: string | nu)** — `src/lib/computeIsolatedFilterCounts.ts`
  ```
  if (!Array.isArray(interactions) || interactions.length === 0) return []; const out: IsolatedFilterCount[] = []; const qTrim = (debouncedQ ?? '').trim(); if (qTrim) { const q = normalize(qTrim); let n = 0; for (const i of interactions) { const hay = normalize(`${i.title ?? ''} ${i.content ?? ''} ${(i.tags ?? []).join(' ')}`); if (hay.includes(q)) n += 1; } const qTrimmed = qTrim.length > 20 ? `${qTrim.slice(0, 20)}…` : qTrim; out.push({ key: 'q', label: `Busca “${qTrimmed}”`, count: n }); } if ( …
  ```
- **computeMetadataDiff(before: Record<string, unknown>, after: Record<string, unknown>, limit = 30,)** — `src/lib/entityDiff.ts`
  ```
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort(); const rows: DiffRow[] = []; for (const key of keys) { const b = normalize(before[key]); const a = normalize(after[key]); let status: DiffStatus; if (b === '' && a !== '') status = 'added'; else if (b !== '' && a === '') status = 'removed'; else if (b !== a) status = 'changed'; else status = 'equal'; rows.push({ key, status, before: b.slice(0, 80), after: a.slice(0, 80) }); } // prioriza mudanças no topo row …
  ```
- **generateFingerprint(error: Error)** — `src/lib/errorReporting.ts`
  ```
  const stack = error.stack || ''; const firstStackLine = stack.split('\n')[1] || ''; return btoa(`${error.name}:${error.message}:${firstStackLine}`).slice(0, 32);
  ```
- **validateFileMagicBytes(file: File)** — `src/lib/fileValidation.ts`
  ```
  // More compatible way to read first bytes const buffer = await new Promise<ArrayBuffer>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as ArrayBuffer); reader.onerror = reject; reader.readAsArrayBuffer(file.slice(0, 8)); // Read first 8 bytes }); const view = new Uint8Array(buffer); const header = Array.from(view).map(b => b.toString(16).padStart(2, '0')).join('')
  ```
- **validateFileUpload(file: File, options?: { maxSizeMB: number })** — `src/lib/fileValidation.ts`
  ```
  valid: boolean; error?: string
  ```
- **scorePasso(passo: ProximoPasso, ctx: RecommendationContext = {},)** — `src/lib/filterProximosPassos.ts`
  ```
  let score = PRIORITY_SCORE[passo.priority] ?? 0; const preferred = normalizeChannel(ctx.preferredChannel); if (preferred && preferred === passo.channel) { score += 20; } if (Array.isArray(ctx.feedbacks) && ctx.feedbacks.length > 0) { // Pega o feedback mais recente cujo passo_id começa com este id const matching = ctx.feedbacks .filter((f) => f.passo_id === passo.id || f.passo_id?.startsWith(`${passo.id}:`)) .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); co …
  ```
- **relevanceScore(item: GroupableInteraction, q: string)** — `src/lib/groupInteractions.ts`
  ```
  if (!q) return 0; const title = item.title ?? ''; const content = item.content ?? ''; const tags = Array.isArray(item.tags) ? item.tags.join(' ') : ''; return countOccurrences(title, q) * 3 + countOccurrences(tags, q) * 2 + countOccurrences(content, q);
  ```
- **generateRequestId()** — `src/lib/logger.ts`
  ```
  // eslint-disable-next-line sonarjs/pseudo-random -- non-security UI/animation/mock/test randomness return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  ```
- **computeTrendMilestones(interactions: ExternalInteraction[], points: ProntidaoTrendPoint[],)** — `src/lib/prontidaoTrendMilestones.ts`
  ```
  if (!Array.isArray(interactions) || !Array.isArray(points) || points.length === 0) return []; // Ordena ascendente para detectar "primeira" ocorrência const sorted = [...interactions] .map((it) => ({ it, t: refDate(it) })) .filter((x): x is { it: ExternalInteraction; t: number } => x.t != null) .sort((a, b) => a.t - b.t); const milestones: TrendMilestone[] = []; const seenChannels = new Set<string>(); // Limites visuais: o gráfico só desenha as semanas em `points` const firstWeekStart = new Date …
  ```
- **round1(n: number)** — `src/lib/prontidaoWeightsHealth.ts`
  ```
  Math.round(n * 10) / 10;
  ```
- **validateProviderOrder(currentOrder: string[])** — `src/lib/providerGuard.ts`
  ```
  const violations: string[] = []; const seen = new Set<string>(); for (const name of currentOrder) { const def = PROVIDER_ORDER.find(p => p.name === name); if (def) { for (const req of def.requires) { if (!seen.has(req)) { violations.push( `❌ ${name} requer ${req} como provider pai, mas ${req} não foi encontrado acima na árvore.` ); } } } seen.add(name); } return violations;
  ```
- **computeSuggestedDate(passo: ProximoPasso, now: Date)** — `src/lib/proximoPassoDefaults.ts`
  ```
  date: Date; locked: boolean
  ```
- **computeSuggestedTime(passo: ProximoPasso, bestTime: BestTimeHint | null | undefined,)** — `src/lib/proximoPassoDefaults.ts`
  ```
  hour: number; minute: number; bestTimeApplied: boolean
  ```
- **canRemoveRole(actingUserId: string | undefined, targetUserId: string, role: AppRole,)** — `src/lib/roleAssignment.ts`
  ```
  return !(actingUserId === targetUserId && role === 'admin');
  ```
- **canAccessRoute(url: string, hasPermission: (permission: string)** — `src/lib/routePermissions.ts`
  ```
  boolean,
  ```
- **generateMeetingInvite(ctx: MeetingInviteContext)** — `src/lib/scriptGenerator.ts`
  ```
  whatsapp: string; email: { subject: string; body: string };
  ```
- **generateScripts(ctx: ScriptContext)** — `src/lib/scriptGenerator.ts`
  ```
  const tone = toneFromSentiment(ctx.sentiment); const t = templatesFor(ctx.passoId, ctx); const label = toneLabel(tone); // Garante subject sempre preenchido (template > catálogo de fallback > genérico) const emailSubject = t.email.subject[tone] || buildEmailSubject(ctx.passoId, ctx.firstName, ctx.sentiment); return [ { channel: 'whatsapp', body: t.whatsapp[tone], toneLabel: label }, { channel: 'email', subject: emailSubject, body: t.email.body[tone], toneLabel: label, }, { channel: 'call', body: …
  ```
- **generateSecureSecret(length: number = 48, includeSpecial: boolean = true)** — `src/lib/secretRotation.ts`
  ```
  const effectiveLength = Math.max(length, 32); const charset = includeSpecial ? CHARSET : CHARSET_ALPHANUM; const array = new Uint8Array(effectiveLength); crypto.getRandomValues(array); return Array.from(array, (byte) => charset[byte % charset.length]).join('');
  ```
- **relevanceScore(item: SortableItem, q: string)** — `src/lib/sortInteractions.ts`
  ```
  const title = item.title ?? ''; const content = item.content ?? ''; const tags = Array.isArray(item.tags) ? item.tags.join(' ') : ''; const legacy = countOccurrences(title, q) * 3 + countOccurrences(tags, q) * 2 + countOccurrences(content, q); if (legacy > 0) return legacy; // Fallback para ExternalInteraction (assunto 3×, resumo/canal/direction 1×) const assunto = item.assunto ?? ''; const resumo = item.resumo ?? ''; const channel = item.channel ?? ''; const direction = item.direction ?? ''; re …
  ```
- **trackScoreChange(params: { userId: string; contactId: string; scoreType: string; newValue: number; previousValue?: number | null; factors)** — `src/lib/trackScoreChange.ts`
  ```
  try { const { error } = await supabase.from('score_history').insert([{ user_id: params.userId, contact_id: params.contactId, score_type: params.scoreType, score_value: params.newValue, previous_value: params.previousValue ?? null, factors: (params.factors ?? null) as Json, }]); if (error) logger.warn('Failed to track score change', { error: error.message }); } catch (error) { const msg = error instanceof Error ? error.message : 'Unknown error'; logger.warn('Failed to track score change', { error …
  ```
- **scoreSentence(s: string)** — `src/lib/insights/pickTopPassages.ts`
  ```
  const len = s.length; if (len < 30 || len > 400) return -1; let score = 0; // Sweet spot 60–280 if (len >= 60 && len <= 280) score += 3; else score += 1; // Question / dialogue markers if (/[?]/.test(s)) score += 2; if (/[":]/.test(s)) score += 1; // Significant words (>3 letters) const words = s.split(/\s+/).filter((w) => w.length > 3); score += Math.min(words.length / 5, 4); // Penalty for mostly digits/punctuation
  ```
- **applyFilters(rows: Record<string, unknown>[], filters: ReportFilter[])** — `src/lib/reports/reportEngine.ts`
  ```
  return rows.filter(row => filters.every(f => { const v = getValue(row, f.fieldKey); switch (f.operator) { case 'eq': return v == f.value; case 'neq': return v != f.value; case 'gt': return typeof v === 'number' && typeof f.value === 'number' && v > f.value; case 'gte': return typeof v === 'number' && typeof f.value === 'number' && v >= f.value; case 'lt': return typeof v === 'number' && typeof f.value === 'number' && v < f.value; case 'lte': return typeof v === 'number' && typeof f.value === 'nu …
  ```
- **generateMarkdown(sections: KnowledgeSection[])** — `src/pages/AdminKnowledgeExport.tsx`
  ```
  const grouped = new Map<string, KnowledgeSection[]>(); for (const s of sections) { const arr = grouped.get(s.category) || []; arr.push(s); grouped.set(s.category, arr); } let md = `# SINGU CRM — Knowledge Base Export\n\n`; md += `> Exportado em: ${new Date().toISOString()}\n`; md += `> Total de seções: ${sections.length}\n\n`; md += `## Índice\n\n`; for (const [cat, items] of grouped) { md += `### ${CATEGORY_LABELS[cat] || cat}\n`; for (const item of items) { md += `- [${item.title}](#${item.id} …
  ```
- **generateJSON(sections: KnowledgeSection[])** — `src/pages/AdminKnowledgeExport.tsx`
  ```
  return JSON.stringify({ exportedAt: new Date().toISOString(), totalSections: sections.length, sections, }, null, 2);
  ```
- **applyPrompt(prompt: string)** — `src/pages/Assistente.tsx`
  ```
  setInput(prompt.replace(/^[^\s]+\s/, ''));
  ```
- **validateForm()** — `src/pages/Auth.tsx`
  ```
  const newErrors: Record<string, string> = {}; try { emailSchema.parse(email); } catch (e) { if (e instanceof z.ZodError) newErrors.email = e.issues[0].message; } try { passwordSchema.parse(password); } catch (e) { if (e instanceof z.ZodError) newErrors.password = e.issues[0].message; } if (mode === 'signup') { try { nameSchema.parse(firstName); } catch (e) { if (e instanceof z.ZodError) newErrors.firstName = e.issues[0].message; } try { nameSchema.parse(lastName); } catch (e) { if (e instanceof …
  ```
- **applyDraftFilters()** — `src/pages/Ficha360.tsx`
  ```
  setDays(draftDays); setChannels(draftChannels);
  ```
- **applyFavoriteFilters(favDays: number, favChannels: string[])** — `src/pages/Ficha360.tsx`
  ```
  const validDays = ([7, 30, 90, 365] as const).includes(favDays as Ficha360Period) ? (favDays as Ficha360Period) : 90; setDays(validDays); setChannels(favChannels); setDraftDays(validDays); setDraftChannels(favChannels);
  ```
- **applyRelatorio(preset: FilterFavorite)** — `src/pages/Ficha360.tsx`
  ```
  const validDays = ([7, 30, 90, 365] as const).includes(preset.days as Ficha360Period) ? (preset.days as Ficha360Period) : 90; setDays(validDays); setChannels(preset.channels); setTags(preset.tags); setQ(preset.q ?? ''); setSearchInput(preset.q ?? ''); setDraftDays(validDays); setDraftChannels(preset.channels); if (preset.autoOpenSummary !== false) { // Aguarda recompute de filteredInteractions antes de abrir setTimeout(() => setResumoIAOpen(true), 0); } toast.success(`Relatório aplicado: "${pres …
  ```
- **generateInsights(contactsData: Contact[], interactionsData: Interaction[], companiesData: Company[], signal?: AbortSignal)** — `src/pages/Insights.tsx`
  ```
  if (!session?.access_token) { toast.error('Você precisa estar logado para gerar insights'); return; } setGenerating(true); try { const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-insights`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, signal, body: JSON.stringify({ contacts: contactsData.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}`, role: c.role_title, relationship_scor …
  ```
- **formatCurrency(value: number)** — `src/pages/Pipeline.tsx`
  ```
  
  ```
- **invalidarPapeis()** — `src/pages/RolesPage.tsx`
  ```
  void queryClient.invalidateQueries({ queryKey: ['all-user-roles'] }); void queryClient.invalidateQueries({ queryKey: ['user-roles'] }); void queryClient.invalidateQueries({ queryKey: ['user-permissions'] });
  ```
- **RankingTable({ items, sort }: { items: LabelAgg[]; sort: 'down' | 'up' })** — `src/pages/admin/InsightFeedbackAnalytics.tsx`
  ```
  const sorted = useMemo(() => { return [...items].sort((a, b) => { if (sort === 'down') return b.down - a.down || b.total - a.total; return b.up - a.up || b.total - a.total; }).slice(0, 30); }, [items, sort]); if (sorted.length === 0) { return ( <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground"> Sem dados ainda. Os feedbacks aparecerão aqui conforme os usuários avaliarem insights. </div> ); } return ( <Table> <TableHeader> <TableRow> <TableHead>Rótulo< …
  ```
- **validate()** — `src/pages/tarefas/CreateTaskDialog.tsx`
  ```
  ok: boolean; data?: z.infer<typeof taskSchema>
  ```
- **calculateRFMScore(value: number, percentiles: number[], isRecency: boolean = false)** — `src/types/rfm.ts`
  ```
  // For recency, lower is better (more recent) if (isRecency) { if (value <= percentiles[0]) return 5; if (value <= percentiles[1]) return 4; if (value <= percentiles[2]) return 3; if (value <= percentiles[3]) return 2; return 1; } // For frequency and monetary, higher is better if (value >= percentiles[3]) return 5; if (value >= percentiles[2]) return 4; if (value >= percentiles[1]) return 3; if (value >= percentiles[0]) return 2; return 1;
  ```
- **applyOpenRouterAuth(opts: RequestInit, key: string | undefined)** — `supabase/functions/_shared/fetch-utils.ts`
  ```
  if (!key) return opts; const headers = new Headers(opts.headers as HeadersInit | undefined); if (!headers.has('authorization')) return opts; headers.set('Authorization', `Bearer ${key}`); return { ...opts, headers };
  ```
- **scorePayloads(input: { userId: string; contactId: string; dimensions: Record<string, number>; total: number; grade: string; previousSc)** — `supabase/functions/_shared/lead-score-contract.ts`
  ```
  const integerScore = (score: number) => { if (!Number.isFinite(score)) throw new Error('Pontuação inválida'); return Math.round(Math.min(100, Math.max(0, score))); }; const total = integerScore(input.total); const dimensions = { fit_score: integerScore(input.dimensions.fit), engagement_score: integerScore(input.dimensions.engagement), intent_score: integerScore(input.dimensions.intent), relationship_score: integerScore(input.dimensions.relationship), }; const factors = { dimensions: input.dimens …
  ```
- **integerScore(score: number)** — `supabase/functions/_shared/lead-score-contract.ts`
  ```
  if (!Number.isFinite(score)) throw new Error('Pontuação inválida'); return Math.round(Math.min(100, Math.max(0, score)));
  ```
- **validate(fields: string, level: number)** — `supabase/functions/_shared/select-projection.ts`
  ```
  if (level > 8) return false; const parts: string[] = []; let depth = 0; let start = 0; for (let index = 0; index < fields.length; index++) { if (fields[index] === '(') depth++; else if (fields[index] === ')') { if (--depth < 0) return false; } else if (fields[index] === ',' && depth === 0) { parts.push(fields.slice(start, index).trim()); start = index + 1; } } if (depth !== 0) return false; parts.push(fields.slice(start).trim()); for (const part of parts) { const opening = part.indexOf('('); if …
  ```
- **canEmbed(table: string)** — `supabase/functions/_shared/select-projection_test.ts`
  ```
  allowed.has(table);
  ```
- **resolveValidationOwner(req: Request, requestedUserId: string | undefined, contactId: string | null | undefined,)** — `supabase/functions/_shared/validation-owner.ts`
  ```
  userId: string; admin: SupabaseClient; internal: boolean
  ```
- **calcFitScore(tier: string, hasRevenue: boolean)** — `supabase/functions/abm-account-scorer/index.ts`
  ```
  const tierPoints: Record<string, number> = { strategic: 30, enterprise: 25, mid: 18, smb: 10 }; return Math.min(30, (tierPoints[tier] ?? 15) + (hasRevenue ? 0 : -5));
  ```
- **calcEngagementScore(committeeSize: number, dealsCount: number, interactionsCount: number)** — `supabase/functions/abm-account-scorer/index.ts`
  ```
  const committeePts = Math.min(10, committeeSize * 2); const dealsPts = Math.min(10, dealsCount * 3); const interactionPts = Math.min(10, Math.floor(interactionsCount / 5)); return committeePts + dealsPts + interactionPts;
  ```
- **calcIntentScore(recentInteractions: number, hasOpenDeal: boolean)** — `supabase/functions/abm-account-scorer/index.ts`
  ```
  const recencyPts = Math.min(15, recentInteractions * 2); const dealPts = hasOpenDeal ? 10 : 0; return recencyPts + dealPts;
  ```
- **calcInfluenceScore(committeeSize: number, hasChampion: boolean, hasDecisionMaker: boolean)** — `supabase/functions/abm-account-scorer/index.ts`
  ```
  const sizePts = Math.min(10, committeeSize * 2); return Math.min(25, sizePts + (hasChampion ? 8 : 0) + (hasDecisionMaker ? 7 : 0));
  ```
- **calculateHealthScore(contact: Contact, interactions: Interaction[])** — `supabase/functions/check-health-alerts/index.ts`
  ```
  const contactInteractions = interactions.filter(i => i.contact_id === contact.id); const now = new Date(); let lastInteractionDays = 999; if (contactInteractions.length > 0) { const lastInteraction = new Date(contactInteractions[0].created_at); lastInteractionDays = Math.floor((now.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)); } const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); const recentInteractions = contactInteractions.filter(i => new Date(i.create …
  ```
- **calculateBlendCode(D: number, I: number, S: number, C: number)** — `supabase/functions/disc-analyzer/index.ts`
  ```
  primary: string; secondary: string | null; blend: string
  ```
- **computeDailySeries(snapshots: Snapshot[])** — `supabase/functions/error-budget/index.ts`
  ```
  const buckets = new Map<string, { down: number; degraded: number; total: number }>(); for (const s of snapshots) { const date = s.timestamp.slice(0, 10); const b = buckets.get(date) ?? { down: 0, degraded: 0, total: 0 }; b.total += 1; if (s.status === "unhealthy") b.down += 1; else if (s.status === "degraded") b.degraded += 1; buckets.set(date, b); } // Garantir 30 pontos contíguos (preencher dias sem amostra com 100%) const days: DailyPoint[] = []; const now = new Date(); for (let i = 29; i >= …
  ```
- **calcHealthScore(d: DealInput, weights: { activity: number; stage_age: number; engagement: number; relationship: number }, inactivityDays)** — `supabase/functions/forecast-analyzer/index.ts`
  ```
  score: number; risks: string[]
  ```
- **compute(scope: "contact" | "account", id: string, items: SignalRow[])** — `supabase/functions/intent-aggregator/index.ts`
  ```
  const totalWeight = items.reduce((s, r) => s + r.weight, 0); const score = Math.min(100, Math.round((totalWeight / 80) * 100)); const recent = items.filter((r) => new Date(r.occurred_at).getTime() >= midpoint); const older = items.filter((r) => new Date(r.occurred_at).getTime() < midpoint); const recentW = recent.reduce((s, r) => s + r.weight, 0); const olderW = older.reduce((s, r) => s + r.weight, 0); const trend: "rising" | "stable" | "falling" = recentW > olderW * 1.2 ? "rising" : recentW < o …
  ```
- **shouldFire(a: Automation, p: Payload)** — `supabase/functions/lead-score-threshold-runner/index.ts`
  ```
  switch (a.trigger_type) { case 'grade_reached': if (!a.grade_target || !p.to_grade) return false; return p.to_grade === a.grade_target && p.from_grade !== a.grade_target; case 'grade_dropped': if (!a.grade_target || !p.to_grade) return false; return ( (GRADE_RANK[p.to_grade] ?? -1) < (GRADE_RANK[a.grade_target] ?? -1) && (GRADE_RANK[p.from_grade ?? ''] ?? -1) >= (GRADE_RANK[a.grade_target] ?? -1) ); case 'score_above': if (a.score_target == null) return false; return p.to_score >= a.score_target …
  ```
- **computeForContact(supabase: ScoringClient, userId: string, contactId: string, rules: Rule[], thresholds: Threshold[],)** — `supabase/functions/lead-scorer/index.ts`
  ```
  const now = Date.now(); const since60d = new Date(now - 60 * DAY_MS).toISOString(); const ruleMap = new Map(rules.filter(r => r.active).map(r => [`${r.dimension}:${r.signal_key}`, r])); const dimScores: Record<string, number> = { fit: 0, engagement: 0, intent: 0, relationship: 0 }; // Parallelize all 4 independent reads const reads = await Promise.all([ supabase.from('contacts') .select('id, email, phone, role_title, company_id, relationship_score') .eq('id', contactId).eq('user_id', userId).may …
  ```
- **scorePlaybook(pb: Playbook, ctx: PlaybookContext)** — `supabase/functions/playbook-recommender/index.ts`
  ```
  score: number; reasons: string[]
  ```
- **calculateScore(value: number, percentiles: number[], isRecency = false)** — `supabase/functions/rfm-analyzer/index.ts`
  ```
  if (isRecency) { if (value <= percentiles[0]) return 5; if (value <= percentiles[1]) return 4; if (value <= percentiles[2]) return 3; if (value <= percentiles[3]) return 2; return 1; } if (value >= percentiles[3]) return 5; if (value >= percentiles[2]) return 4; if (value >= percentiles[1]) return 3; if (value >= percentiles[0]) return 2; return 1;
  ```
- **generateActions(segment: string)** — `supabase/functions/rfm-analyzer/index.ts`
  ```
  const actions: Record<string, object[]> = { champions: [ { action: 'Oferecer programa VIP', description: 'Convidar para programa de fidelidade exclusivo', priority: 1, channel: 'email', timing: 'Esta semana' }, { action: 'Pedir indicações', description: 'Solicitar recomendações para novos clientes', priority: 2, channel: 'whatsapp', timing: 'Após próxima compra' } ], loyal_customers: [ { action: 'Upsell premium', description: 'Apresentar produtos de maior valor', priority: 1, channel: 'email', t …
  ```
- **generateOffers(segment: string)** — `supabase/functions/rfm-analyzer/index.ts`
  ```
  const offers: Record<string, object[]> = { champions: [ { offerType: 'Acesso VIP', description: 'Acesso antecipado a novos produtos', validDays: 30, reason: 'Recompensar lealdade' } ], at_risk: [ { offerType: 'Win-Back', description: 'Desconto agressivo + brinde', discountPercent: 30, validDays: 3, reason: 'Recuperar cliente' } ], cant_lose: [ { offerType: 'VIP Especial', description: 'Condições exclusivas personalizadas', discountPercent: 35, validDays: 7, reason: 'Salvar relacionamento' } ] }; …
  ```
- **generateAiRecommendations(payload: { territories: TerritoryRow[]; performance: TerritoryPerformanceRow[]; underserved: TerritoryRow[]; overserved:)** — `supabase/functions/territory-optimization/index.ts`
  ```
  const apiKey = Deno.env.get("DEEPSEEK_API_KEY"); if (!apiKey) { console.warn("[territory-optimization] DEEPSEEK_API_KEY missing — heuristic only"); return []; } const summary = { total_territories: payload.territories.length, coverage_pct: Math.round(payload.coverage * 100), gini: Number(payload.giniIndex.toFixed(2)), territories: payload.territories.slice(0, 25).map((t) => ({ id: t.id, name: t.name, state: t.state, assigned_to_name: t.assigned_to_name, companies: t.company_count ?? 0, contacts: …
  ```
- **generateEmailHtml(digest: WeeklyDigestData)** — `supabase/functions/weekly-digest/index.ts`
  ```
  return ` <!DOCTYPE html> <html> <head> <style> body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; } .container { max-width: 600px; margin: 0 auto; padding: 20px; } .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 30px; border-radius: 12px 12px 0 0; } .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; } .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; } …
  ```

### G.4 Percentuais e multiplicadores no código

| Trecho | Arquivo |
|---|---|
| `transition={{ delay: i * 0.05 }}` | `src/components/abm/WhitespaceOpportunities.tsx` |
| `if (p95 >= SLOW_P95_MS * 0.6) return 'warning';` | `src/components/admin/RpcPerfCard.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/ai/AIMessageGenerator.tsx` |
| `: `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,` | `src/components/analytics/AdvancedAnalyticsTab.tsx` |
| `transition={{ duration: 0.6, delay: i * 0.1 }}` | `src/components/analytics/AdvancedAnalyticsTab.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/analytics/BehaviorAlertsPanel.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/analytics/BestTimeToContactPanel.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/analytics/ChurnPredictionPanel.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/analytics/ClosingScoreAlertsList.tsx` |
| `transition={{ delay: index * 0.03 }}` | `src/components/analytics/ClosingScoreRanking.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/analytics/DealVelocityPanel.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/analytics/DealVelocityPanel.tsx` |
| `transition={{ delay: index * 0.1, duration: 0.5 }}` | `src/components/analytics/DealVelocityPanel.tsx` |
| `delay: 0.2 + i * 0.05,` | `src/components/celebrations/CelebrationProvider.tsx` |
| `delay: Math.random() * 0.3,` | `src/components/celebrations/CelebrationProvider.tsx` |
| `transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}` | `src/components/company-card/CompanyInteractionsModal.tsx` |
| `* `total_contacts * 10`, que estoura 100% com dez contatos.` | `src/components/company-detail/CompanyBenchmarkRadar.tsx` |
| `<span>0%</span><span>100%</span>` | `src/components/company-detail/CompanyInsightsTab.tsx` |
| `transition={{ duration: 0.3, delay: index * 0.05 }}` | `src/components/company-detail/CompanyInteractionsTab.tsx` |
| `transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3) }}` | `src/components/contact-card/ContactCardWithContext.tsx` |
| `weight: 0.0625, // 4 fatores qualitativos compõem ~25%` | `src/components/contact-detail/ChurnRiskWidget.tsx` |
| `transition={{ delay: i * 0.03 }}` | `src/components/contact-detail/ContactInteractionsTab.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/contact-detail/behavioral-tab/NeuroDominanceTab.tsx` |
| `transition={{ delay: index * 0.2 }}` | `src/components/crm/behavior/PredictiveRoadmap.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/crm/commercial/ClientValuesElite.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/crm/commercial/DecisionCriteriaElite.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/crm/commercial/PurchaseHistoryElite.tsx` |
| `const cognitiveEase = Math.round(readability * 0.8 + (triggersFound.length * 4));` | `src/components/crm/copywriting/CopyAnalyzer.tsx` |
| `94% de score médio` | `src/components/crm/copywriting/PerformanceHistory.tsx` |
| `<span>+15% vs mês anterior</span>` | `src/components/crm/copywriting/PerformanceHistory.tsx` |
| `<span>+8.2% vs meta</span>` | `src/components/crm/copywriting/PerformanceHistory.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/crm/marketing/components/MarketingStats.tsx` |
| `transition={{ duration: 0.2, delay: idx * 0.04 }}` | `src/components/dashboard/OnboardingChecklist.tsx` |
| `transition={{ duration: 0.3, delay: 0.2 + index * 0.1 }}` | `src/components/dashboard/RelationshipStatsPanel.tsx` |
| `transition={{ duration: 0.3, delay: index * 0.1 }}` | `src/components/dashboard/RelationshipStatsPanel.tsx` |
| `transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}` | `src/components/dashboard/RelationshipStatsPanel.tsx` |
| `transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}` | `src/components/dashboard/RelationshipStatsPanel.tsx` |
| `transition={{ duration: 0.2, delay: idx * 0.05 }}` | `src/components/dashboard/YourDaySection.tsx` |
| `transition={{ duration: 0.2, delay: index * 0.05 }}` | `src/components/dashboard/your-day/FollowUpItem.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/disc/DISCCompatibilityAlerts.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/disc/DISCConversionMetrics.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/disc/DISCEvolutionTimeline.tsx` |
| `delay: i * 0.15,` | `src/components/feedback/LoadingStates.tsx` |
| `delay: i * 0.4,` | `src/components/feedback/LoadingStates.tsx` |
| `transition={{ duration: 0.2, delay: index * 0.05 }}` | `src/components/feedback/NotificationGroup.tsx` |
| `: `hsl(var(--intel-accent) / ${0.18 + intensity * 0.7})`;` | `src/components/intel/TemporalHeatmap.tsx` |
| `transition={{ delay: index * 0.02 }}` | `src/components/interactions/InteractionCardMemo.tsx` |
| `ao score normalizado (0..1), com mínimo de 8% para visibilidade. */}` | `src/components/interactions/TimelineGroupCard.tsx` |
| `transition={{ duration: 0.15, delay: index * 0.02 }}` | `src/components/keyboard/KeyboardShortcutsCheatsheet.tsx` |
| `transition={{ duration: 0.2, delay: categoryIndex * 0.05 }}` | `src/components/keyboard/KeyboardShortcutsCheatsheet.tsx` |
| `transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}` | `src/components/lux/LuxButton.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/lux/LuxHistoryTimeline.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/lux/LuxSharedComponents.tsx` |
| `delay: i * 0.1,` | `src/components/micro-interactions/SuccessCheckmark.tsx` |
| `// Data is loading — slow asymptotic progress to 85%` | `src/components/navigation/RouteProgressBar.tsx` |
| `const next = prev + (85 - prev) * 0.08;` | `src/components/navigation/RouteProgressBar.tsx` |
| `setProgress(20); // Instant jump to 20% on route change` | `src/components/navigation/RouteProgressBar.tsx` |
| `* `compact`. Em listas compactas cabem ~50% mais itens por viewport, então` | `src/components/navigation/ScrollToTopButton.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/navigation/SmartBreadcrumbs.tsx` |
| `else if (node.type === 'you') { ctx.arc(node.x!, node.y!, nodeRadius * 0.4, 0, 2 * Math.PI); ctx.fill(); }` | `src/components/network/NetworkVisualization.tsx` |
| `else { ctx.arc(node.x!, node.y!, nodeRadius * 0.5, 0, 2 * Math.PI); ctx.fill(); }` | `src/components/network/NetworkVisualization.tsx` |
| `if (node.type === 'company') { const iconSize = nodeRadius * 0.6; ctx.fillRect(node.x! - iconSize / 2, node.y! - iconSize / 2, iconSize, iconSize); }` | `src/components/network/NetworkVisualization.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/neuromarketing/NeuroABTracker.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/neuromarketing/NeuroAlerts.tsx` |
| `transition={{ duration: 0.5, delay: index * 0.2 }}` | `src/components/neuromarketing/NeuroAlerts.tsx` |
| `transition={{ delay: i * 0.1 }}` | `src/components/neuromarketing/NeuroBriefingCard.tsx` |
| `return 0.3 + (score / 100) * 0.7;` | `src/components/neuromarketing/NeuroHeatmapCalendar.tsx` |
| `transition={{ delay: (dayIndex + TIME_BLOCKS.indexOf(block)) * 0.02 }}` | `src/components/neuromarketing/NeuroHeatmapCalendar.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/neuromarketing/NeuroHeatmapCalendar.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/neuromarketing/NeuroRadarChart.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/neuromarketing/NeuroScore.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/neuromarketing/NeuroScriptGenerator.tsx` |
| `transition={{ delay: 0.5 + index * 0.1 }}` | `src/components/neuromarketing/NeuroTimeline.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/neuromarketing/NeuroTimeline.tsx` |
| `Complete pelo menos 50% para gerar o script` | `src/components/neuromarketing/PainClaimGainBuilder.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/nlp/ChunkingNavigator.tsx` |
| `const overallScore = Math.round((vakScore * 0.4 + discScore * 0.3 + metaprogramScore * 0.3));` | `src/components/nlp/CommunicationCoherencePanel.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/nlp/IncongruenceDetector.tsx` |
| `transition={{ delay: idx * 0.03 }}` | `src/components/nlp/MiltonianCalibration.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/nlp/NLPConversionMetrics.tsx` |
| `<span>Score de Calibração: 85%</span>` | `src/components/nlp/NLPInsightsDashboard.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/nlp/NLPInsightsDashboard.tsx` |
| `<span>98%</span>` | `src/components/nlp/NeuroCommunicationHub.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/nlp/NeuroCommunicationHub.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/nlp/NeuroCommunicationHub.tsx` |
| `transition={{ delay: idx * 0.1 }}` | `src/components/nlp/RapportRealtimeCoach.tsx` |
| `transition={{ delay: idx * 0.05 }}` | `src/components/nlp/StateElicitationToolkit.tsx` |
| `transition={{ delay: 0.5 + index * 0.1 }}` | `src/components/onboarding/steps/CompletionStep.tsx` |
| `transition={{ delay: 0.5 + index * 0.1 }}` | `src/components/onboarding/steps/WelcomeStep.tsx` |
| `(100 - slip) * 0.3 +` | `src/components/pipeline/ForecastConfidencePanel.tsx` |
| `momentumScore * 0.2 +` | `src/components/pipeline/ForecastConfidencePanel.tsx` |
| `stageProb * 0.35 +` | `src/components/pipeline/ForecastConfidencePanel.tsx` |
| `stagnation * 0.4 + sentimentScore * 0.25 + engagement * 0.25 + ageScore * 0.1;` | `src/components/pipeline/ForecastConfidencePanel.tsx` |
| `velocityScore * 0.15,` | `src/components/pipeline/ForecastConfidencePanel.tsx` |
| `/** probabilidade acima de 70% */` | `src/components/pipeline/pipelineFilters.ts` |
| `transition: { delay: i * 0.05 },` | `src/components/quick-actions/FloatingQuickActions.tsx` |
| `transition={{ delay: (actions.length - 1 - index) * 0.05 + 0.1 }}` | `src/components/quick-actions/FloatingQuickActions.tsx` |
| `delay: (menuItems.length - 1 - index) * 0.03,` | `src/components/quick-add/QuickAddButton.tsx` |
| `const lineAlpha = (1 - dist / CONNECTION_DIST) * Math.min(alphas[i], alphas[j]) * 0.6;` | `src/components/search/voice/FloatingParticles.tsx` |
| `const speed = (Math.random() * 0.5 + 0.5) * cfg.speed;` | `src/components/search/voice/FloatingParticles.tsx` |
| `ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);` | `src/components/search/voice/FloatingParticles.tsx` |
| `p.vx += (Math.random() - 0.5) * 0.02;` | `src/components/search/voice/FloatingParticles.tsx` |
| `p.vy += (Math.random() - 0.5) * 0.02;` | `src/components/search/voice/FloatingParticles.tsx` |
| `const waveOffset = Math.sin(angle * (3 + w) + w * 1.5) * amplitude * (1 + w * 0.25);` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `delay: i * 0.05,` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `delay: i * 0.12,` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `dist: radius * 0.4 + rand() * radius * 0.65,` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `duration: 1.2 + (i % 4) * 0.3,` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `return Array.from({ length: barCount }).map(() => rand() * 0.25);` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `transition={{ duration: 2.5 + w * 0.6, repeat: Infinity, ease: "easeInOut" }}` | `src/components/search/voice/VoiceVisualEffects.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/smart-reminders/smart-reminders-parts/ReminderCard.tsx` |
| `const influenceRadius = (node.influence / 10) * nodeRadius * 0.6;` | `src/components/stakeholders/StakeholderInfluenceNetwork.tsx` |
| `transition={{ duration: 0.25, delay: index * 0.05 }}` | `src/components/territory-optimization/TerritoryRecommendationCard.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/triggers/AdvancedTriggersPanel.tsx` |
| `"A compatibilidade com <strong>João Silva</strong> está em <strong>45%</strong>,` | `src/components/triggers/CompatibilityAlertSettings.tsx` |
| `<span>20% (muitos alertas)</span>` | `src/components/triggers/CompatibilityAlertSettings.tsx` |
| `<span>80% (poucos alertas)</span>` | `src/components/triggers/CompatibilityAlertSettings.tsx` |
| `matchScore += (vakProfile.confidence + metaprogramProfile.overallConfidence) * 0.1;` | `src/components/triggers/ProfileBasedSuggestions.tsx` |
| `matchScore += vakProfile.confidence * 0.3;` | `src/components/triggers/ProfileBasedSuggestions.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/triggers/advanced-triggers/AdvancedTriggersTabContent.tsx` |
| `transition={{ delay: index * 0.1 }}` | `src/components/triggers/advanced-triggers/AdvancedTriggersTabContent.tsx` |
| `<p>Os motores de IA estão operando com 100% de capacidade para gerar insights e briefings.</p>` | `src/components/ui/SystemStatusBadge.tsx` |
| `transition={{ duration: 0.3, delay: index * 0.1 }}` | `src/components/ui/company-health-score.tsx` |
| `transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}` | `src/components/ui/company-health-score.tsx` |
| `delay: idx * 0.05,` | `src/components/ui/prompt-chips.tsx` |
| `const diff = Math.max(0, (currentY - startY.current) * 0.4); // Dampen` | `src/components/ui/pull-to-refresh.tsx` |
| `transition={{ delay: index * 0.05 }}` | `src/components/ui/relationship-stage.tsx` |
| `* API pública 100% compatível com a versão monolítica anterior.` | `src/components/ui/sidebar.tsx` |
| `transition={{ duration: 0.25, delay: delay * 0.04 }}` | `src/components/ui/stat-card.tsx` |
| `// Use ~60% of keyword length (min 5, max 8) to catch Portuguese morphological variants` | `src/data/carnegieEagerWant.ts` |
| `const stemLen = Math.min(8, Math.max(5, Math.floor(keyword.length * 0.6)));` | `src/data/carnegieEagerWant.ts` |
| `if (matchCount >= Math.ceil(keyWords.length * 0.6)) {` | `src/data/carnegieEncouragement.ts` |
| `score: label.discAlignment[discProfile] * 0.6 + label.vakAlignment[vakProfile] * 0.4` | `src/data/carnegieIdentityLabels.ts` |
| `O que descobrimos é que 80% dessas inconsistências vêm de processos manuais.` | `src/data/carnegieStorytelling.ts` |
| `Três meses depois? Faturamento 40% maior e equipe mais engajada do que nunca.` | `src/data/carnegieStorytelling.ts` |
| `fullScript: `Vou ser transparente sobre minha perspectiva... Não tenho 100% de certeza sobre [aspecto específico].` | `src/data/carnegieVulnerability.ts` |
| `* Função pura, sem side effects, 100% testável.` | `src/domain/leadScoring.ts` |
| `} else if (last30Days < previous30Days * 0.5 && previous30Days > 0) {` | `src/hooks/useAccountChurnPrediction.ts` |
| `roi_score: Math.round((c.relationship_score \|\| 0) * 0.6 + (stats.count > 0 ? Math.min(stats.count * 5, 40) : 0)),` | `src/hooks/useBIAdvanced.ts` |
| `score: (slot.positiveRate * 0.6 + slot.responseRate * 0.4) * Math.log(slot.interactionCount + 1)` | `src/hooks/useBestTimeToContact.ts` |
| `// `acknowledgments * 0.3` e `interruptionIndicators: 0` — nenhum lia o texto.` | `src/hooks/useCarnegieAnalysis.ts` |
| `// `closedQuestions * 0.7`, `reflectiveStatements * 0.2`,` | `src/hooks/useCarnegieAnalysis.ts` |
| `// `idealRatio = 35`, `openEndedQuestions = questionCount * 0.3`,` | `src/hooks/useCarnegieAnalysis.ts` |
| `} else if (last30Days < previous30Days * 0.5) {` | `src/hooks/useChurnPrediction.ts` |
| `stagnation * 0.4 + sentimentScore * 0.25 + engagement * 0.25 + age * 0.1` | `src/hooks/useDealsAtRisk.ts` |
| `value: Math.min(1 + interactionCount * 0.5, 5),` | `src/hooks/useNetworkGraph.ts` |
| `const score = Math.round((brainAlignment * 0.3 + stimuliMatch * 0.3 + chemicalBalance * 0.2 + communicationFit * 0.2));` | `src/hooks/useNeuromarketing.ts` |
| `intensity: Math.round(brainScores.limbic * 0.8),` | `src/hooks/useNeuromarketing.ts` |
| `intensity: Math.round(brainScores.reptilian * 0.8),` | `src/hooks/useNeuromarketing.ts` |
| `* Trabalho 100% client-side: não há fetch envolvido — apenas evitamos pagar` | `src/hooks/useNextPagePrefetch.ts` |
| `if (criticalClients.length > totalClients * 0.2 \|\| overallScore < 40) {` | `src/hooks/usePortfolioHealth.ts` |
| `} else if (warningClients.length + criticalClients.length > totalClients * 0.3 \|\| overallScore < 60) {` | `src/hooks/usePortfolioHealth.ts` |
| `const getPercentiles = (arr: number[]) => { const len = arr.length; return [arr[Math.floor(len * 0.2)] \|\| 0, arr[Math.floor(len * 0.4)] \|\| 0, arr[Math.floor(len …` | `src/hooks/useRFMAnalysis.ts` |
| `(getDISCConfidence(contact) \|\| 50) * 0.4 +` | `src/hooks/useRapportGenerator.ts` |
| `50 * 0.2` | `src/hooks/useRapportGenerator.ts` |
| `50 * 0.4 +` | `src/hooks/useRapportGenerator.ts` |
| `score += Math.min(20, triggerSuggestion.matchScore * 0.2);` | `src/hooks/useSmartTemplateSuggestions.ts` |
| `score += Math.min(30, discRate * 0.3);` | `src/hooks/useSmartTemplateSuggestions.ts` |
| `score += Math.min(40, stats.successRate * 0.4);` | `src/hooks/useSmartTemplateSuggestions.ts` |
| `score = 10 + (triggerSuggestion?.matchScore \|\| 0) * 0.1;` | `src/hooks/useSmartTemplateSuggestions.ts` |
| `support = Math.round((behavior.supportLevel - 5.5) * 0.9);` | `src/hooks/useStakeholderAnalysis.ts` |
| `y: Math.random() * 0.4,` | `src/hooks/useSuccessCelebration.ts` |
| `scores: avgScores, confidence: Math.round(Math.min(100, Math.max(0, (totals.count * 15) + ((sortedTypes[0][1] - sortedTypes[1][1]) * 1.5) + (totals.totalWords * …` | `src/hooks/useVAKAnalysis.ts` |
| `if (max > 0 && max >= Math.ceil(interactions.length * 0.3)) {` | `src/lib/crossRefInsights.ts` |
| `if (top && top[1] >= Math.ceil(interactions.length * 0.5)) {` | `src/lib/crossRefInsights.ts` |
| `* schema — extração 100% client-side, normalizando acentos e caixa.` | `src/lib/interactionTags.ts` |
| `* Sem chamadas de IA, sem queries de rede — 100% client-side, instantâneo.` | `src/lib/scriptGenerator.ts` |
| `<span>100%</span>` | `src/pages/NLPAnalytics.tsx` |
| `Hoje, sua base está <strong>42% Visiva</strong>. Priorize o envio de propostas visuais para aumentar o engajamento subconsciente.` | `src/pages/NLPAnalytics.tsx` |
| `<AlertTitle>Atenção — Budget &gt;50% consumido</AlertTitle>` | `src/pages/admin/ErrorBudget.tsx` |
| `Consumo ≥100% do orçamento mensal. Conforme RUNBOOK §Error Budget Policy: pause feature` | `src/pages/admin/ErrorBudget.tsx` |
| `{data.sample_interval_minutes} min — degradado vale 50%, unhealthy vale 100%.` | `src/pages/admin/ErrorBudget.tsx` |
| `idealRatio: number \| null; // Target ratio (usually 30-40% speaking)` | `src/types/carnegie.ts` |
| `\| 'visual' // 50% brain dedicated to visual` | `src/types/neuromarketing.ts` |
| `probability: number; // 0-100%` | `src/types/nlp-advanced.ts` |
| `engagementLevel * 0.25 +` | `supabase/functions/check-health-alerts/index.ts` |
| `interactionFrequency * 0.35 +` | `supabase/functions/check-health-alerts/index.ts` |
| `recencyScore * 0.15` | `supabase/functions/check-health-alerts/index.ts` |
| `sentimentScore * 0.25 +` | `supabase/functions/check-health-alerts/index.ts` |
| `const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] ?? avg : 0;` | `supabase/functions/connection-anomaly-detector/index.ts` |
| `// retorna série temporal diária e dispara alertas em 50/75/100% do consumo.` | `supabase/functions/error-budget/index.ts` |
| `const downtime = b.down * SAMPLE_INTERVAL_MIN + b.degraded * SAMPLE_INTERVAL_MIN * 0.5;` | `supabase/functions/error-budget/index.ts` |
| `const downtimeMinutes = downSamples * SAMPLE_INTERVAL_MIN + degradedSamples * SAMPLE_INTERVAL_MIN * 0.5;` | `supabase/functions/error-budget/index.ts` |
| `const relationshipScore = d.contact_score ? Math.min(100, d.contact_score * 0.8 + 20) : 50;` | `supabase/functions/forecast-analyzer/index.ts` |
| `recentW > olderW * 1.2 ? "rising" : recentW < olderW * 0.8 ? "falling" : "stable";` | `supabase/functions/intent-aggregator/index.ts` |
| `score += Math.min((pb.usage_count \|\| 0) * 0.5, 10);` | `supabase/functions/playbook-recommender/index.ts` |
| `arr[Math.floor(len * 0.2)] \|\| 0,` | `supabase/functions/rfm-analyzer/index.ts` |
| `arr[Math.floor(len * 0.4)] \|\| 0,` | `supabase/functions/rfm-analyzer/index.ts` |
| `arr[Math.floor(len * 0.6)] \|\| 0,` | `supabase/functions/rfm-analyzer/index.ts` |
| `arr[Math.floor(len * 0.8)] \|\| 0` | `supabase/functions/rfm-analyzer/index.ts` |
| `else if (daysSince >= decayThreshold * 0.75 && relScore >= 70) { shouldAlert = true; }` | `supabase/functions/smart-reminders/index.ts` |
| `// ─── Health score (0-100) ─── coverage 40% + balance (1-gini) 40% + conversion 20%` | `supabase/functions/territory-optimization/index.ts` |
| `else if (avgCompanies > 0 && companies < avgCompanies * 0.5 && isAssigned) status = "overserved";` | `supabase/functions/territory-optimization/index.ts` |
| `return avgCompanies > 0 && c < avgCompanies * 0.5 && (t.assigned_to \|\| assignedTerritoryIds.has(t.id));` | `supabase/functions/territory-optimization/index.ts` |

## H. Parâmetros de negócio (constantes, prazos, limites)

### H.1 Constantes

| Constante | Valor | Arquivo |
|---|---|---|
| `REF` | `'pgxfvjmuubtbowutlide'` | `tmp_view_check.js` |
| `STALE_WARN_MIN` | `90` | `src/components/admin/MttaAutoAckHeartbeatCard.tsx` |
| `STALE_CRIT_MIN` | `150` | `src/components/admin/MttaAutoAckHeartbeatCard.tsx` |
| `ALERT_TYPE` | `"mtta_critical_sla_breach"` | `src/components/admin/MttaSlaBreachHistoryCard.tsx` |
| `SLOW_P95_MS` | `800` | `src/components/admin/RpcPerfCard.tsx` |
| `ALL_RPCS` | `'__all__'` | `src/components/admin/RpcPlanChurnCard.tsx` |
| `CHURN_WINDOW_HOURS` | `6` | `src/components/admin/RpcPlanChurnCard.tsx` |
| `P95_THRESHOLD_MS` | `800` | `src/components/admin/RpcPlanChurnTimelineChart.tsx` |
| `RECENT_LIMIT` | `5` | `src/components/command/commandRegistry.ts` |
| `APP_VERSION` | `'2.8.0'` | `src/components/docs/VersionBadge.tsx` |
| `CURRENT_VERSION` | `'2.0.0'` | `src/components/features/WhatsNewModal.tsx` |
| `NAO_RESPONDEU_COOLDOWN_HOURS` | `24` | `src/components/ficha-360/PassoFeedbackMenu.tsx` |
| `MAX_VISIBLE` | `4` | `src/components/ficha-360/RelatoriosFixosBar.tsx` |
| `MAX_DESC` | `200` | `src/components/ficha-360/SalvarRelatorioDialog.tsx` |
| `STALE_MS` | `60` | `src/components/intel/IntelDataSourceBadge.tsx` |
| `SCHEMA_VERSION` | `'intel-hub-v5'` | `src/components/intel/IntelHealthPanel.tsx` |
| `LIMIT` | `20` | `src/components/intel/IntelLatencyBadge.tsx` |
| `MAX_HISTORY` | `10` | `src/components/intelligence/AskTab.tsx` |
| `MAX_INLINE` | `3` | `src/components/interactions/ActiveFiltersBar.tsx` |
| `MAX_BYTES` | `50` | `src/components/interactions/ImportPresetsDialog.tsx` |
| `PAGE_SIZE` | `20` | `src/components/interactions/insights/ObjectionExamplesModal.tsx` |
| `AFFORDANCE_HINT` | `"Clique para ver conversas"` | `src/components/interactions/insights/SentimentDistributionChart.tsx` |
| `MAX_EXAMPLES` | `20` | `src/components/interactions/insights/SentimentExamplesDrawer.tsx` |
| `MIN_WINDOW_VOLUME` | `3` | `src/components/interactions/insights/SentimentTrendChart.tsx` |
| `LOW_WINDOW_VOLUME` | `8` | `src/components/interactions/insights/SentimentTrendChart.tsx` |
| `THEME_DRAWER_PREFS_SCOPE` | `"insights:theme-drawer"` | `src/components/interactions/insights/ThemeExamplesDrawer.tsx` |
| `EDGE_WIDTH` | `45` | `src/components/navigation/SwipeBackIndicator.tsx` |
| `DEAD_ZONE` | `10` | `src/components/navigation/SwipeBackIndicator.tsx` |
| `THRESHOLD` | `80` | `src/components/navigation/SwipeBackIndicator.tsx` |
| `MAX_RECENT_ITEMS` | `5` | `src/components/search/GlobalSearch.tsx` |
| `MAX_IMAGE_SIZE_MB` | `5` | `src/components/search/VisualSearchButton.tsx` |
| `CONNECTION_DIST` | `120` | `src/components/search/voice/FloatingParticles.tsx` |
| `SIZE` | `200` | `src/components/search/voice/VoiceOrb.tsx` |
| `DISMISS_TTL_MS` | `7` | `src/components/security/MFAEnrollmentBanner.tsx` |
| `BASE_TITLE` | `'SINGU - CRM Inteligente'` | `src/components/seo/SEOHead.tsx` |
| `SIDEBAR_COOKIE_MAX_AGE` | `60` | `src/components/ui/sidebar/sidebar-context.tsx` |
| `SIDEBAR_WIDTH` | `"16rem"` | `src/components/ui/sidebar/sidebar-context.tsx` |
| `SIDEBAR_WIDTH_MOBILE` | `"18rem"` | `src/components/ui/sidebar/sidebar-context.tsx` |
| `CHANNEL_PERSISTENCE_TTL_DAYS` | `30` | `src/config/channelPersistence.config.ts` |
| `MAX_STACK_SIZE` | `20` | `src/contexts/NavigationStackContext.tsx` |
| `TOTAL_CANAIS` | `5` | `src/data/analyticsData.ts` |
| `DAY_MS` | `86` | `src/domain/forecastSimulation.ts` |
| `MOBILE_BREAKPOINT` | `768` | `src/hooks/use-mobile.tsx` |
| `TOAST_LIMIT` | `1` | `src/hooks/use-toast.ts` |
| `TOAST_REMOVE_DELAY` | `1000000` | `src/hooks/use-toast.ts` |
| `REFRESH_THRESHOLD_MS` | `5` | `src/hooks/useAuth.tsx` |
| `MIN_ATTEMPTS_TOTAL` | `20` | `src/hooks/useBestTimeHeatmap.ts` |
| `MIN_ATTEMPTS_PER_SLOT` | `5` | `src/hooks/useBestTimeHeatmap.ts` |
| `RESPONSE_WINDOW_MS` | `48` | `src/hooks/useBestTimeHeatmap.ts` |
| `HOUR_START` | `6` | `src/hooks/useBestTimeHeatmap.ts` |
| `HOUR_END` | `22` | `src/hooks/useBestTimeHeatmap.ts` |
| `BATCH_SIZE` | `50` | `src/hooks/useBulkImport.ts` |
| `MAX` | `5` | `src/hooks/useChannelHistory.ts` |
| `COMPANIES_PAGE_SIZE` | `500` | `src/hooks/useCompanies.ts` |
| `MAX_COMPANIES_TOTAL` | `60000` | `src/hooks/useCompanies.ts` |
| `INITIAL_FAST_LOAD` | `100` | `src/hooks/useCompanies.ts` |
| `MAX_LOOKUP_OPTIONS` | `60` | `src/hooks/useCompanyFilterOptions.ts` |
| `MS_POR_DIA` | `24` | `src/hooks/useContactDaysWithout.ts` |
| `PAGE_SIZE` | `50` | `src/hooks/useContacts.ts` |
| `MAX_HISTORY` | `10` | `src/hooks/useConversationalSearch.ts` |
| `AVG_CYCLE_DAYS` | `60` | `src/hooks/useDealForecastConfidence.ts` |
| `MS_PER_DAY` | `1000` | `src/hooks/useDealVelocity.ts` |
| `PAGE` | `1000` | `src/hooks/useEmailCampaigns.ts` |
| `BATCH` | `500` | `src/hooks/useEmailCampaigns.ts` |
| `FORCA_BASE_POSITIVA` | `7` | `src/hooks/useEmotionalIntelligence.ts` |
| `FORCA_TETO_POSITIVA` | `10` | `src/hooks/useEmotionalIntelligence.ts` |
| `FORCA_BASE_NEGATIVA` | `4` | `src/hooks/useEmotionalIntelligence.ts` |
| `FORCA_TETO_NEGATIVA` | `7` | `src/hooks/useEmotionalIntelligence.ts` |
| `MAX` | `10` | `src/hooks/useEntityBookmarks.ts` |
| `DEBOUNCE_MS` | `500` | `src/hooks/useEntityNotes.ts` |
| `MAX_FAVORITES` | `10` | `src/hooks/useFicha360FilterFavorites.ts` |
| `MAX_DESCRIPTION` | `200` | `src/hooks/useFicha360FilterFavorites.ts` |
| `SCOPE` | `'ficha360:presets'` | `src/hooks/useFicha360FilterPresets.ts` |
| `DEFAULT_DAYS` | `90` | `src/hooks/useFicha360Filters.ts` |
| `SCOPE` | `'ficha360'` | `src/hooks/useFicha360PreferencesSync.ts` |
| `DEFAULT` | `'recente'` | `src/hooks/useFicha360Sort.ts` |
| `PARAM` | `'ordem'` | `src/hooks/useFicha360Sort.ts` |
| `PROBABILIDADE_BASE` | `60` | `src/hooks/useHiddenObjections.ts` |
| `PROBABILIDADE_POR_REPETICAO` | `10` | `src/hooks/useHiddenObjections.ts` |
| `PROBABILIDADE_TETO` | `95` | `src/hooks/useHiddenObjections.ts` |
| `HOUR_START` | `6` | `src/hooks/useInboundActivityHeatmap.ts` |
| `HOUR_END` | `22` | `src/hooks/useInboundActivityHeatmap.ts` |
| `MIN_TOTAL` | `10` | `src/hooks/useInboundActivityHeatmap.ts` |
| `MAX_EVENTS` | `100` | `src/hooks/useIntelTelemetry.ts` |
| `VERSION` | `1` | `src/hooks/useIntelTour.ts` |
| `STALE` | `5` | `src/hooks/useIntent.ts` |
| `PAGE_SIZE` | `50` | `src/hooks/useInteractions.ts` |
| `DEFAULT_PER_PAGE` | `25` | `src/hooks/useInteractionsAdvancedFilter.ts` |
| `STALE` | `5` | `src/hooks/useLeadScoring.ts` |
| `SLA_MINUTES` | `30` | `src/hooks/useMttaSlaBreachSnapshot.ts` |
| `DEFAULT_SLA_MIN` | `30` | `src/hooks/useMttaSlaThreshold.ts` |
| `MIN_TEXT_LENGTH` | `100` | `src/hooks/useNLPAutoAnalysis.ts` |
| `AJUSTE_MAXIMO` | `10` | `src/hooks/useNLPClosingProbability.ts` |
| `TETO` | `98` | `src/hooks/useNLPClosingProbability.ts` |
| `ACAO_GENERICA` | `'Seguir perfil'` | `src/hooks/useNLPClosingProbability.ts` |
| `STALE_24H` | `24` | `src/hooks/useNextBestAction.ts` |
| `DEFAULT_SORT` | `'sugerido'` | `src/hooks/useProximosPassosFilters.ts` |
| `RAGE_THRESHOLD` | `5` | `src/hooks/useRageClickDetector.ts` |
| `TIME_WINDOW` | `1000` | `src/hooks/useRageClickDetector.ts` |
| `DISTANCE_THRESHOLD` | `50` | `src/hooks/useRageClickDetector.ts` |
| `MAX_ITEMS` | `10` | `src/hooks/useRecentlyViewed.ts` |
| `INFINITE_SCROLL_PROGRESS_EVENT` | `'infinite-scroll-progress'` | `src/hooks/useReportInfiniteScrollProgress.ts` |
| `INFINITE_SCROLL_CLEAR_EVENT` | `'infinite-scroll-clear'` | `src/hooks/useReportInfiniteScrollProgress.ts` |
| `CINCO_MIN` | `5` | `src/hooks/useReportWidgets.ts` |
| `MAX` | `20` | `src/hooks/useSavedAskViews.ts` |
| `STALE` | `60` | `src/hooks/useScoreAutomations.ts` |
| `SLOW_THRESHOLD_MS` | `3000` | `src/hooks/useSlowQueryDetector.ts` |
| `CRITICAL_THRESHOLD_MS` | `8000` | `src/hooks/useSlowQueryDetector.ts` |
| `CLEAR_DELAY_MS` | `5000` | `src/hooks/useSlowQueryDetector.ts` |
| `SESSION_START_TIMEOUT_MS` | `8000` | `src/hooks/useVoiceAgent.ts` |
| `COMPANY_LIGHT_SELECT` | `'id, nome_crm'` | `src/hooks/useYourDay.ts` |
| `PROCESSING_ERROR_RESET_DELAY_MS` | `3000` | `src/hooks/voice/useTranscriptProcessor.ts` |
| `ERROR_RESET_DELAY_MS` | `5000` | `src/hooks/voice/useVoiceState.ts` |
| `BASE_NEUTRA` | `50` | `src/lib/carnegieMessageReview.ts` |
| `MAX_ENTRIES` | `32` | `src/lib/channelCountsCache.ts` |
| `DEAL_RISK_LOOKBACK_DAYS` | `60` | `src/lib/deal-risk-constants.ts` |
| `DEAL_ENGAGEMENT_GAP_DAYS` | `30` | `src/lib/deal-risk-constants.ts` |
| `DEAL_RISK_HIGH_THRESHOLD` | `61` | `src/lib/deal-risk-constants.ts` |
| `DEAL_RISK_ATTENTION_THRESHOLD` | `31` | `src/lib/deal-risk-constants.ts` |
| `DEFAULT_FALLBACK` | `'Ocorreu um erro inesperado. Tente novamente.'` | `src/lib/errorMessages.ts` |
| `MAX_BUFFER_SIZE` | `10` | `src/lib/errorReporting.ts` |
| `FLUSH_INTERVAL` | `30000` | `src/lib/errorReporting.ts` |
| `UNIDENTIFIED_LABEL` | `'Sem identificação'` | `src/lib/groupInteractions.ts` |
| `MAX_RECENT` | `5` | `src/lib/intelSnapshot.ts` |
| `PLACEHOLDER` | `'—'` | `src/lib/ipMasking.ts` |
| `MFA_STATUS_CHANGED_EVENT` | `'singu:mfa-status-changed'` | `src/lib/mfaEvents.ts` |
| `MFA_VERIFIED_EVENT` | `'singu:mfa-verified'` | `src/lib/mfaEvents.ts` |
| `PEAK_THRESHOLD` | `3` | `src/lib/prontidaoTrendMilestones.ts` |
| `SW_READY_TIMEOUT_MS` | `10` | `src/lib/pushNotifications.ts` |
| `WINDOW_MS` | `15` | `src/lib/rateLimiter.ts` |
| `MAX_ATTEMPTS` | `5` | `src/lib/rateLimiter.ts` |
| `TRACE_HEADER` | `"x-trace-id"` | `src/lib/requestId.ts` |
| `DEFAULT_CHURN_WINDOW` | `'24'` | `src/lib/rpcChurn.ts` |
| `PRESET_KIND` | `'interacoes-search-preset'` | `src/lib/searchPresetTransport.ts` |
| `PRESET_VERSION` | `1` | `src/lib/searchPresetTransport.ts` |
| `MS_DAY` | `86` | `src/lib/suggestPresetName.ts` |
| `FALLBACK_WINDOW_RATIO` | `1.6` | `src/lib/insights/excerptWindow.ts` |
| `DEFAULT_EXCERPT_PRESET` | `"medium"` | `src/lib/insights/excerptWindow.ts` |
| `MAX_TOTAL_CAP` | `5` | `src/lib/insights/pickTopPassages.ts` |
| `CONCURRENCY` | `5` | `src/pages/CRMRelationshipAuditPage.tsx` |
| `GEOCODING_BATCH_SIZE` | `50` | `src/pages/MapaEmpresas.tsx` |
| `SMS_LIMIT` | `160` | `src/pages/SmsMarketing.tsx` |
| `PAGE_SIZE` | `50` | `src/pages/admin/BehavioralRegenAudit.tsx` |
| `JANELA_DIAS` | `7` | `src/pages/admin/Observability.tsx` |
| `RENDER_BATCH` | `100` | `src/pages/contatos/ContatosContent.tsx` |
| `RENDER_BATCH` | `60` | `src/pages/empresas/EmpresasContent.tsx` |
| `PAGE_SIZE` | `500` | `src/pages/mapa/companyQueries.ts` |
| `PAGE_SIZE` | `500` | `src/pages/mapa/relationshipScores.ts` |
| `PAST_TOLERANCE_MS` | `60` | `src/pages/tarefas/CreateTaskDialog.tsx` |
| `CHANNEL_NOTE_MAX` | `200` | `src/pages/tarefas/CreateTaskDialog.tsx` |
| `DEFAULT_TARGET` | `70` | `src/stores/useProntidaoTargetStore.ts` |
| `SERVICE_ROLE_SENTINEL` | `"__SERVICE_ROLE__"` | `supabase/functions/_shared/auth.ts` |
| `AI_TIMEOUT_MS` | `45` | `supabase/functions/_shared/fetch-utils.ts` |
| `SCRAPE_TIMEOUT_MS` | `90` | `supabase/functions/_shared/fetch-utils.ts` |
| `API_TIMEOUT_MS` | `30` | `supabase/functions/_shared/fetch-utils.ts` |
| `HEALTH_TIMEOUT_MS` | `10` | `supabase/functions/_shared/fetch-utils.ts` |
| `CLEANUP_INTERVAL` | `5` | `supabase/functions/_shared/rate-limit.ts` |
| `MAX_SEARCH_TERMS` | `10` | `supabase/functions/_shared/search-filter.ts` |
| `TRACE_HEADER` | `"x-trace-id"` | `supabase/functions/_shared/tracing.ts` |
| `NEXUS_BLUE` | `"#4D96FF"` | `supabase/functions/_shared/email-templates/password-migration-reset.tsx` |
| `DOWN_THRESHOLD` | `3` | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| `BATCH_SIZE` | `20` | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| `MIN_INTERVAL_MIN` | `30` | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| `DELAY_MS` | `800` | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| `MAX_BATCH` | `5` | `supabase/functions/auto-regen-behavioral-profiles/index.ts` |
| `ERROR_RATE_THRESHOLD` | `10` | `supabase/functions/auto-regen-behavioral-profiles/index.ts` |
| `MIN_SAMPLE` | `5` | `supabase/functions/auto-regen-behavioral-profiles/index.ts` |
| `MAX_BYTES` | `512` | `supabase/functions/bitrix24-webhook/index.ts` |
| `PAGE` | `1000` | `supabase/functions/bulk-revalidate/index.ts` |
| `SLO_TARGET` | `99.5` | `supabase/functions/error-budget/index.ts` |
| `WINDOW_HOURS` | `720` | `supabase/functions/error-budget/index.ts` |
| `SAMPLE_INTERVAL_MIN` | `5` | `supabase/functions/error-budget/index.ts` |
| `SERVICE_ROLE_SENTINEL` | `"__SERVICE_ROLE__"` | `supabase/functions/external-data/audit.ts` |
| `MAX_PAGE_SIZE` | `500` | `supabase/functions/external-data/index.ts` |
| `DEFAULT_PAGE_SIZE` | `50` | `supabase/functions/external-data/index.ts` |
| `DAY_MS` | `86` | `supabase/functions/lead-scorer/index.ts` |
| `MAX_CONTENT_PER_INTERACTION` | `1200` | `supabase/functions/objection-context-summary/index.ts` |
| `MAX_TOTAL_CONTEXT` | `6000` | `supabase/functions/objection-context-summary/index.ts` |
| `CACHE_TTL_MINUTES` | `10` | `supabase/functions/semantic-search/index.ts` |
| `TWILIO_GATEWAY` | `"https://connector-gateway.lovable.dev/twilio"` | `supabase/functions/send-sms-campaign/index.ts` |
| `BATCH_SIZE` | `10` | `supabase/functions/validation-queue-worker/index.ts` |
| `MAX_ATTEMPTS` | `3` | `supabase/functions/validation-queue-worker/index.ts` |

### H.2 Prazos, expirações e janelas de tempo

| Trecho | Arquivo |
|---|---|
| `globalTimeout: process.env.CI ? 30 * 60 * 1000 : undefined,` | `playwright.config.ts` |
| `timeout: 30000,` | `tmp_view_check.js` |
| `gcTime: 30 * 60 * 1000,` | `src/app/queryClient.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/app/queryClient.ts` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/admin/AuditDiffViewer.tsx` |
| `const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();` | `src/components/admin/BehavioralRegenAlertsStats.tsx` |
| `const d = new Date(Date.now() - i * 24 * 60 * 60_000);` | `src/components/admin/BehavioralRegenAlertsTrend.tsx` |
| `const since = new Date(Date.now() - 30 * 24 * 60 * 60_000);` | `src/components/admin/BehavioralRegenAlertsTrend.tsx` |
| `const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();` | `src/components/admin/MttaAutoAckHeartbeatCard.tsx` |
| `const since = new Date(Date.now() - 30 * 24 * 60 * 60_000).toISOString();` | `src/components/admin/MttaSlaBreachHistoryCard.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/components/admin/RequireAdmin.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/admin/RequireAdmin.tsx` |
| `setTimeout(() => recorder.stop(), 5000);` | `src/components/admin/VoiceAITestPanel.tsx` |
| `case "1h": return 5 * 60 * 1000; // 5 min` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `case "24h": return 60 * 60 * 1000; // 1 hora` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `case "6h": return 30 * 60 * 1000; // 30 min` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `default: return 6 * 60 * 60 * 1000; // 6 horas (7d)` | `src/components/admin/telemetry/TelemetryCharts.tsx` |
| `setTimeout(() => setCopiedIdx(null), 2000);` | `src/components/ai/AIMessageGenerator.tsx` |
| `const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));` | `src/components/analytics/AdvancedAnalyticsTab.tsx` |
| `setTimeout(() => setCopiedItem(null), 2000);` | `src/components/analytics/ApproachRecommendationPanel.tsx` |
| `const timer = setTimeout(() => setAutoSaved(false), 3000);` | `src/components/analytics/CognitiveBiasesPanel.tsx` |
| `supabase.from('disc_analysis_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('analyzed_at', new Date(Date.now() - 7 * 24 * 60 * …` | `src/components/analytics/DISCAnalyticsPanel.tsx` |
| `setTimeout(() => setCopiedId(null), 2000);` | `src/components/bi/EmbeddableDashboards.tsx` |
| `const handleCopy = (text: string, id: string) => { navigator.clipboard.writeText(text).then(() => { setCopiedText(id); setTimeout(() => setCopiedText(null), 200 …` | `src/components/briefing/PreContactBriefing.tsx` |
| `const daysSince = Math.floor((Date.now() - new Date(c.updated_at ?? 0).getTime()) / (1000 * 60 * 60 * 24));` | `src/components/companies/CompaniesStatsBar.tsx` |
| `const daysSince = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));` | `src/components/company-card/company-card-parts/CompanyCardHelpers.tsx` |
| `const daysSince = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));` | `src/components/contact-card/ContactCardWithContext.tsx` |
| `gcTime: 10 * 60 * 1000,` | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| `gcTime: 10 * 60 * 1000,` | `src/components/contact-detail/ContactCommercialTab.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/contact-detail/ContactCommercialTab.tsx` |
| `.then(() => { setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); })` | `src/components/contact-detail/ContactDataTab.tsx` |
| `.then(() => { setCopiedField(field); setTimeout(() => setCopiedField(null), 2000); })` | `src/components/contact-detail/ContactDetailHeader.tsx` |
| `const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();` | `src/components/contact-detail/ContactEmailThreadsSection.tsx` |
| `gcTime: 10 * 60 * 1000,` | `src/components/contact-detail/ContactIntelligenceTab.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/contact-detail/ContactIntelligenceTab.tsx` |
| `const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);` | `src/components/contact-detail/UnifiedTimeline.tsx` |
| `const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);` | `src/components/contact-detail/UnifiedTimeline.tsx` |
| `gcTime: 20 * 60 * 1000,` | `src/components/contact-detail/behavioral-tab/EqDashboardCard.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/components/contact-detail/behavioral-tab/EqDashboardCard.tsx` |
| `if (!lastSync \|\| new Date(lastSync).getTime() < Date.now() - 24 * 60 * 60 * 1000) {` | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/crm/copywriting/PersuasionFrameworks.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/crm/copywriting/SalesScriptGenerator.tsx` |
| `const day = startOfDay(new Date(now.getTime() - i * 24 * 60 * 60 * 1000));` | `src/components/dashboard/DashboardCharts.tsx` |
| `const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);` | `src/components/dashboard/DashboardCharts.tsx` |
| `<Button variant="ghost" size="icon" aria-label="Anterior" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className …` | `src/components/dashboard/ImportantDatesCalendar.tsx` |
| `<Button variant="ghost" size="icon" aria-label="Próximo" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className …` | `src/components/dashboard/ImportantDatesCalendar.tsx` |
| `const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));` | `src/components/dashboard/RecentActivityCard.tsx` |
| `const ageA = (now - dateA) / (1000 * 60 * 60 * 24);` | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| `const ageB = (now - dateB) / (1000 * 60 * 60 * 24);` | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| `const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&dates=${new Date().toISOString().replace(/-\|: …` | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| `follow_up_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow` | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| `const timer = setTimeout(() => setVisible(false), 5000);` | `src/components/dashboard/WelcomeGreetingPopup.tsx` |
| `const daysSince = followUpDate ? Math.floor((Date.now() - followUpDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;` | `src/components/dashboard/YourDaySection.tsx` |
| `const daysSince = Math.floor((Date.now() - followUpDate.getTime()) / (1000 * 60 * 60 * 24));` | `src/components/dashboard/your-day/FollowUpItem.tsx` |
| `setTimeout(() => { setExportComplete(false); setOpen(false); }, 2000);` | `src/components/data-export/AdvancedDataExporter.tsx` |
| `setTimeout(() => setCopiedId(null), 2000);` | `src/components/disc/DISCTemplateLibrary.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/docs/CodeExample.tsx` |
| `return Math.max(0, Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24)));` | `src/components/ficha-360/FrequenciaContatoCard.tsx` |
| `const timer = setTimeout(() => setCreatedIds(new Set()), 4000);` | `src/components/ficha-360/ProximosPassosCard.tsx` |
| `window.setTimeout(() => setHighlightId(null), 2400);` | `src/components/ficha-360/UltimasInteracoesCard.tsx` |
| `setTimeout(() => { reset(); setOpen(false); }, 1500);` | `src/components/import/BulkImportDialog.tsx` |
| `window.setTimeout(() => el.classList.remove('intel-aside-flash'), 1200);` | `src/components/intel/IntelBookmarksNotesBadge.tsx` |
| `.then(() => { setCopiedKey(key); toast.success("Snippet copiado"); setTimeout(() => setCopiedKey(null), 2000); })` | `src/components/intent/PixelSetupCard.tsx` |
| `window.setTimeout(() => el.classList.remove('search-focus-flash'), 1000);` | `src/components/interactions/AdvancedSearchBar.tsx` |
| `window.setTimeout(() => setJustReverted(false), 1400);` | `src/components/interactions/CanaisQuickFilter.tsx` |
| `{ key: 'last30', label: 'Últimos 30 dias', build: (n) => ({ de: startOfDay(subDays(n, 29)), ate: endOfDay(n) }) },` | `src/components/interactions/DateRangePopover.tsx` |
| `{ key: 'last7', label: 'Últimos 7 dias', build: (n) => ({ de: startOfDay(subDays(n, 6)), ate: endOfDay(n) }) },` | `src/components/interactions/DateRangePopover.tsx` |
| `{ key: 'lastMonth', label: 'Mês passado', build: (n) => { const prev = subMonths(n, 1); return { de: startOfMonth(prev), ate: endOfMonth(prev) }; } },` | `src/components/interactions/DateRangePopover.tsx` |
| `window.setTimeout(() => { setRecentlyAppliedId((cur) => (cur === preset.id ? null : cur)); }, 1500);` | `src/components/interactions/InteracoesPresetsMenu.tsx` |
| `setTimeout(() => setCopiedId((prev) => (prev === interactionId ? null : prev)), 2000);` | `src/components/interactions/insights/ObjectionExamplesModal.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/interactions/insights/ObjectionExamplesModal.tsx` |
| `setTimeout(() => setCopied(false), 1800);` | `src/components/interactions/insights/ObjectionsSpotlight.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/interactions/insights/SentimentExamplesDrawer.tsx` |
| `setTimeout(() => setCopied(false), 1800);` | `src/components/interactions/insights/SuggestedResponseModal.tsx` |
| `? (cb: () => void) => w.requestIdleCallback!(cb, { timeout: 2000 })` | `src/components/layout/AppLayout.tsx` |
| `? Math.floor((Date.now() - new Date(lastInteractionDate).getTime()) / (1000 * 60 * 60 * 24))` | `src/components/lead-score/LeadScoreWidget.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/lead-score/LeadScoreWidget.tsx` |
| `.then(() => { setCopiedField(field); toast.success('Copiado para área de transferência'); setTimeout(() => setCopiedField(null), 2000); })` | `src/components/lux/CompanyIntelligence.tsx` |
| `hideTimer = setTimeout(() => setShowHint(false), 2500);` | `src/components/navigation/SwipeBackIndicator.tsx` |
| `const handleCopy = async (text: string, id: string) => { try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2 …` | `src/components/neuromarketing/NeuroObjectionHandler.tsx` |
| `const daysAgo = (Date.now() - new Date(i.created_at).getTime()) / (1000 * 60 * 60 * 24);` | `src/components/neuromarketing/NeuroScore.tsx` |
| `.then(() => { setCopiedSection(section); setTimeout(() => setCopiedSection(null), 2000); })` | `src/components/neuromarketing/NeuroScriptGenerator.tsx` |
| `setTimeout(() => setCopiedIndex(null), 2000);` | `src/components/nlp/ChunkingNavigator.tsx` |
| `.then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Mensagem copiada!'); })` | `src/components/nlp/CommunicationCoherencePanel.tsx` |
| `.then(() => { setCopiedId(id); toast.success('Copiado!'); setTimeout(() => setCopiedId(null), 2000); })` | `src/components/nlp/CopywritingSalesTools.tsx` |
| `setTimeout(() => setCopiedId(null), 2000);` | `src/components/nlp/MiltonianCalibration.tsx` |
| `setTimeout(() => setCopiedScript(null), 2000);` | `src/components/nlp/StateElicitationToolkit.tsx` |
| `setTimeout(() => setCopiedScript(null), 2000);` | `src/components/nlp/SwishPatternGenerator.tsx` |
| `.then(() => { setCopiedSection(id); setTimeout(() => setCopiedSection(null), 2000); toast.success('Script copiado!'); })` | `src/components/nlp/UnifiedScriptGenerator.tsx` |
| `.then(() => { setCopiedId(id); toast.success('Copiado!'); setTimeout(() => setCopiedId(null), 2000); })` | `src/components/nlp/copywriting/CopywritingAiGeneratorTab.tsx` |
| `.then(() => { setCopied(true); toast.success('Copiado!'); setTimeout(() => setCopied(false), 2000); })` | `src/components/nlp/copywriting/CopywritingObjectionTab.tsx` |
| `setTimeout(() => setCopied(false), 2000);` | `src/components/nps/SendSurveyDialog.tsx` |
| `staleTime: 5 * 60 * 1000,` | `src/components/pipeline/ForecastConfidencePanel.tsx` |
| `setTimeout(() => setCopied(false), 1800);` | `src/components/playbooks/PlaybookSectionRenderer.tsx` |
| `.then(() => { setCopied(true); toast.success('Script completo copiado!'); setTimeout(() => setCopied(false), 2000); })` | `src/components/proactive-intelligence/ProactiveIntelligencePanel.tsx` |
| `.then(() => { setCopied(true); toast.success('Script copiado!'); setTimeout(() => setCopied(false), 2000); })` | `src/components/proactive-intelligence/ProactiveIntelligencePanel.tsx` |
| `promptTimerRef.current = setTimeout(() => setShowPrompt(true), 30000);` | `src/components/pwa/InstallPrompt.tsx` |
| `timer = setTimeout(() => { setIsOnline(true); setShowReconnecting(false); }, 1000);` | `src/components/pwa/NetworkComponents.tsx` |
| `const timer = setTimeout(() => setShow(true), 10000);` | `src/components/pwa/NotificationAndMisc.tsx` |
| `const timer = setTimeout(() => setShow(true), 60000);` | `src/components/pwa/NotificationAndMisc.tsx` |
| `window.setTimeout(() => { setRecentlyAppliedId((cur) => (cur === preset.id ? null : cur)); }, 1500);` | `src/components/search/SearchPresetsMenu.tsx` |
| `const timer = setTimeout(() => setBootingTimedOut(true), 10000);` | `src/components/search/VoiceSearchOverlay.tsx` |
| `const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias` | `src/components/security/MFAEnrollmentBanner.tsx` |
| `const diffHours = diffMs / (1000 * 60 * 60);` | `src/components/support/SLABadge.tsx` |
| `.then(() => { setCopied(true); toast.success('Mensagem copiada!'); onUse(template); setTimeout(() => setCopied(false), 2000); })` | `src/components/triggers/SmartTemplateSuggestions.tsx` |
| `.then(() => { setCopied(true); toast.success('Mensagem copiada!'); onCopy(); setTimeout(() => setCopied(false), 2000); })` | `src/components/triggers/profile-based/TemplatePreviewDialog.tsx` |
| `.then(() => { setCopied(true); toast.success('Mensagem copiada!'); onUse(template); setTimeout(() => setCopied(false), 2000); })` | `src/components/triggers/smart-template/TemplatePreviewContent.tsx` |
| `const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);` | `src/components/triggers/trigger-analytics/useTriggerAnalyticsData.ts` |
| `CHANNEL_PERSISTENCE_TTL_DAYS * 24 * 60 * 60 * 1000;` | `src/config/channelPersistence.config.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useABM.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useABM.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useActiveAlerts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useActiveAlerts.ts` |
| `const fim = new Date(Date.now() - deslocamento * dias * 24 * 60 * 60 * 1000);` | `src/hooks/useActivityOverview.ts` |
| `const inicio = new Date(fim.getTime() - dias * 24 * 60 * 60 * 1000);` | `src/hooks/useActivityOverview.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useActivityOverview.ts` |
| `? new Date(parseISO(exposure.lastExposedAt).getTime() + SATURATION_CONFIG.COOLDOWN_HOURS * 60 * 60 * 1000).toISOString()` | `src/hooks/useAdvancedTriggers.ts` |
| `const windowStart = new Date(now.getTime() - SATURATION_CONFIG.EXPOSURE_WINDOW_DAYS * 24 * 60 * 60 * 1000);` | `src/hooks/useAdvancedTriggers.ts` |
| `const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();` | `src/hooks/useAiGatewayCriticalToast.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useAiGatewayPartitionStats.ts` |
| `const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;` | `src/hooks/useAuth.tsx` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useBIAdvanced.ts` |
| `(new Date().getTime() - lastInteractionDate.getTime()) / (1000 * 60 * 60 * 24)` | `src/hooks/useBehaviorAlerts.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useBehaviorAlerts.ts` |
| `staleTime: 3 * 60 * 1000,` | `src/hooks/useBehaviorAlerts.ts` |
| `return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useBehavioralProfilesList.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useBestClosingMoments.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useBestClosingMoments.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useBestContactTime.ts` |
| `const RESPONSE_WINDOW_MS = 48 * 60 * 60 * 1000;` | `src/hooks/useBestTimeHeatmap.ts` |
| `const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useBestTimeHeatmap.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useBestTimeHeatmap.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useBestTimeHeatmap.ts` |
| `const diff = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));` | `src/hooks/useBirthdayContacts.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useBirthdayContacts.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useBusinessAlerts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useBusinessAlerts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCadenceEnrollments.ts` |
| `const days = Math.max(0, (updatedAt - intDate) / (1000 * 60 * 60 * 24));` | `src/hooks/useChannelPerformanceMatrix.ts` |
| `const since = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useChannelPerformanceMatrix.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useChannelPerformanceMatrix.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/useChannelPerformanceMatrix.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useChurnRisk.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useChurnRisk.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useChurnRisk.ts` |
| `const threeMonthsAgo = subDays(now, 90);` | `src/hooks/useClientHealth.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useClosingScoreAlerts.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useClosingScoreAlertsView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useClosingScoreAlertsView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useClosingScoreRanking.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useClosingScoreView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useClosingScoreView.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useCommunicationDashboard.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCommunicationDashboard.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCommunicationIntelView.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useCommunicationPreferences.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCommunicationPreferences.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useCompanies.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCompanies.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCompaniesCompletoView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCompaniesDuplicatasView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCompanyCommercial.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCompanyIntelligence.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/useCompanyIntelligence.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useCompanyIntelligence.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCompanyIntelligence.ts` |
| `const sinceIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useCompanyProfileAnalytics.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useCompanyProfileAnalytics.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCompanyProfileAnalytics.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCompanyRelatedData.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useCompanyViews.ts` |
| `idleId = window.requestIdleCallback(scheduleCheck, { timeout: 5000 });` | `src/hooks/useCompatibilityAlerts.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useCompleteDashboard.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCompleteDashboard.ts` |
| `const MS_POR_DIA = 24 * 60 * 60 * 1000;` | `src/hooks/useContactDaysWithout.ts` |
| `gcTime: 60 * 60 * 1000,` | `src/hooks/useContactDaysWithout.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useContactDaysWithout.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactDeals.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactDetail.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useContactEffectiveness.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactEffectiveness.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactEmailLogs.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useContactEngagement.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactEngagement.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactMeetings.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactNpsSurveys.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactProposals.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useContactRelationalData.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactRelationalData.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useContactSocialMediaView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactSocialMediaView.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useContactStatistics.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactStatistics.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useContactTagsHistory.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactTagsHistory.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactTasks.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useContactTimeAnalysis.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactTimeAnalysis.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useContactTimeline.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactTimeline.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useContactView360.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContactView360.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useContacts.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useContacts.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useContactsCompletoView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactsCompletoView.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useContactsContatoView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactsContatoView.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useContactsFullView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactsFullView.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useContactsSemApelidoView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useContactsSemApelidoView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useCrossReference.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useDISCCommunicationLogs.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDISCCommunicationLogs.ts` |
| `const cycleDays = Math.round((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));` | `src/hooks/useDISCConversionData.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/useDailyKpis.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useDailySummary.ts` |
| `const lastWeekEnd = subWeeks(thisWeekEnd, 1);` | `src/hooks/useDashboardStats.ts` |
| `const lastWeekStart = subWeeks(thisWeekStart, 1);` | `src/hooks/useDashboardStats.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/useDataHealthView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDealForecastConfidence.ts` |
| `? Math.floor((Date.now() - lastInbound.getTime()) / (1000 * 60 * 60 * 24))` | `src/hooks/useDealSlipRisk.ts` |
| `const totalAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));` | `src/hooks/useDealSlipRisk.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDealSlipRisk.ts` |
| `const MS_PER_DAY = 1000 * 60 * 60 * 24;` | `src/hooks/useDealVelocity.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useDealVelocity.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useDealVelocityBenchmark.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useDealVelocityBenchmark.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDealsAtRisk.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useDealsFullView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDealsFullView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useDedupEngine.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useDiscCompatibility.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useDiscCompatibility.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useDiscDashboardView.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useDuplicateContacts.ts` |
| `const timer = setTimeout(() => setKeySequence([]), 2000);` | `src/hooks/useEasterEggs.ts` |
| `gcTime: 15 * 60 * 1000,` | `src/hooks/useEmailPipelineHealth.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useEmailPipelineHealth.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useEmotionalAnchors.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useEmotionalAnchors.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useEmotionalTrend.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useEmotionalTrend.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useEmotionalTrendView.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useEntity360.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useEqEvolution.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useEqEvolution.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useErpData.ts` |
| `const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;` | `src/hooks/useExternalInteractions.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useExternalInteractions.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useExternalInteractions.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useExternalLookup.ts` |
| `gcTime: 60 * 60 * 1000, // 1 hour` | `src/hooks/useExternalLookup.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useExternalLookup.ts` |
| `staleTime: 30 * 60 * 1000, // 30 min — filter options rarely change` | `src/hooks/useExternalLookup.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useFavoriteTemplates.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useFeatureFlag.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useForecasting.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useGamification.ts` |
| `nextAnniversary = addYears(nextAnniversary, 1);` | `src/hooks/useImportantDates.ts` |
| `nextBday = addYears(nextBday, 1);` | `src/hooks/useImportantDates.ts` |
| `nextBirthday = addYears(nextBirthday, 1);` | `src/hooks/useImportantDates.ts` |
| `nextEventDate = addYears(nextEventDate, 1);` | `src/hooks/useImportantDates.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useInactivityAlerts.ts` |
| `const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();` | `src/hooks/useInboundActivityHeatmap.ts` |
| `gcTime: 30 * 60 * 1000,` | `src/hooks/useInboundActivityHeatmap.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useInboundActivityHeatmap.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useInstantKpis.ts` |
| `staleTime: 2 * 60 * 1000,` | `src/hooks/useInstantKpis.ts` |
| `const STALE = 5 * 60 * 1000;` | `src/hooks/useIntent.ts` |
| `gcTime: 20 * 60 * 1000,` | `src/hooks/useInteracoesSemApelidoView.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useInteracoesSemApelidoView.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/useInteractionsRpc.ts` |
| `staleTime: 3 * 60 * 1000,` | `src/hooks/useInteractionsRpc.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useInteractionsRpc.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useLeadScore.ts` |
| `staleTime: 30 * 60 * 1000,` | `src/hooks/useLeadScore.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useLeadScore.ts` |
| `const STALE = 5 * 60 * 1000;` | `src/hooks/useLeadScoring.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/useLeadScoring.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useLeadsFullView.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useLeadsFullView.ts` |
| `const start = startDate \|\| new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];` | `src/hooks/useMarketingInsights.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/useNLPAnalyticsData.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/useNLPAnalyticsData.ts` |
| `const STALE_24H = 24 * 60 * 60 * 1000;` | `src/hooks/useNextBestAction.ts` |
| `function scheduleIdle(cb: IdleCallback, timeout = 200): number {` | `src/hooks/useNextPagePrefetch.ts` |
| `}, 60 * 60 * 1000);` | `src/hooks/useNotifications.ts` |
| `expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),` | `src/hooks/useNpsSurveys.ts` |
| `gcTime: 60 * 60 * 1000,` | `src/hooks/useObjectionContextSummary.ts` |
| `staleTime: 30 * 60 * 1000, // 30 min — resumo estável dentro do período` | `src/hooks/useObjectionContextSummary.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/useOrphanContacts.ts` |
| `gcTime: 10 * 60 * 1000,` | `src/hooks/usePendingFollowups.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/usePendingFollowups.ts` |
| `staleTime: 5 * 60 * 1000,` | `src/hooks/usePendingNotifications.ts` |
| `staleTime: 10 * 60 * 1000,` | `src/hooks/usePipeline.ts` |
| `staleTime: 15 * 60 * 1000,` | `src/hooks/usePipeline.ts` |
| … +235 linhas — lista completa em `context.json` | |

### H.3 Limites de paginação

| Limite | Arquivo |
|---|---|
| 1 | `src/components/admin/AdminQuickActions.tsx` |
| 500 | `src/components/admin/AdminQuickActions.tsx` |
| 20 | `src/components/admin/BehavioralRegenAlertBanner.tsx` |
| 5000 | `src/components/admin/BehavioralRegenAlertsStats.tsx` |
| 5000 | `src/components/admin/BehavioralRegenAlertsTrend.tsx` |
| 1 | `src/components/admin/MttaAutoAckHeartbeatCard.tsx` |
| 50 | `src/components/admin/MttaSlaBreachHistoryCard.tsx` |
| 5000 | `src/components/analytics/DISCAnalyticsPanel.tsx` |
| 1 | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| 5 | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| 1 | `src/components/contact-detail/ContactCommercialTab.tsx` |
| 20 | `src/components/contact-detail/ContactCommercialTab.tsx` |
| 100 | `src/components/contact-detail/ContactEmailThreadsSection.tsx` |
| 50 | `src/components/contact-detail/ContactIntelligenceTab.tsx` |
| 100 | `src/components/contact-detail/ContactOverviewTab.tsx` |
| 100 | `src/components/contact-detail/LifeEventsTab.tsx` |
| 50 | `src/components/contact-detail/LifeEventsTab.tsx` |
| 200 | `src/components/contact-detail/NeuroEvolutionChart.tsx` |
| 1 | `src/components/contact-detail/behavioral-tab/MetaprogramsSubTab.tsx` |
| 1 | `src/components/contact-detail/behavioral-tab/NeuroDominanceTab.tsx` |
| 1 | `src/components/contact-detail/behavioral-tab/VakSubTab.tsx` |
| 100 | `src/components/contact-detail/data-tab/ConsentAuditCard.tsx` |
| 100 | `src/components/contact-detail/life-events/LifeEventsAuditTrail.tsx` |
| 2 | `src/components/contacts/MergeContactsDialog.tsx` |
| 30 | `src/components/crm/CRMAutomationAuditLog.tsx` |
| 100 | `src/components/crm/CadenceRulesConfig.tsx` |
| 24 | `src/components/crm/NextBestAction.tsx` |
| 5 | `src/components/crm/RelationshipKPIsDashboard.tsx` |
| 10 | `src/components/crm/behavior/NeuromarketingTimeline.tsx` |
| 200 | `src/components/crm/behavior/NeuromarketingTimeline.tsx` |
| 24 | `src/components/crm/behavior/PredictiveRoadmap.tsx` |
| 50 | `src/components/crm/commercial/ClientValuesElite.tsx` |
| 50 | `src/components/crm/commercial/DecisionCriteriaElite.tsx` |
| 50 | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| 100 | `src/components/crm/commercial/PurchaseHistoryElite.tsx` |
| 500 | `src/components/crm/consent/ConsentAuditLog.tsx` |
| 100 | `src/components/crm/relationship/RelationshipAuditPanel.tsx` |
| 100 | `src/components/disc/DISCCompatibilityAlerts.tsx` |
| 50 | `src/components/disc/DISCEvolutionTimeline.tsx` |
| 500 | `src/components/interactions/insights/ObjectionExamplesModal.tsx` |
| 500 | `src/components/interactions/insights/SentimentExamplesDrawer.tsx` |
| 500 | `src/components/interactions/insights/ThemeExamplesDrawer.tsx` |
| 1 | `src/components/lead-score/LeadScoreWidget.tsx` |
| 10 | `src/components/lead-score/LeadScoreWidget.tsx` |
| 50 | `src/components/lead-score/LeadScoreWidget.tsx` |
| 100 | `src/components/nlp/SleightOfMouthPanel.tsx` |
| 100 | `src/components/pipeline/DealDetailDrawer.tsx` |
| 100 | `src/components/pipeline/DealDialog.tsx` |
| 100 | `src/components/whatsapp/WhatsAppDashboard.tsx` |
| 100 | `src/hooks/useABM.ts` |
| 20 | `src/hooks/useABM.ts` |
| 200 | `src/hooks/useABM.ts` |
| 50 | `src/hooks/useABM.ts` |
| 500 | `src/hooks/useAIApprovals.ts` |
| 100 | `src/hooks/useAiAssistant.ts` |
| 500 | `src/hooks/useAiAssistant.ts` |
| 10 | `src/hooks/useAiGatewayCriticalToast.ts` |
| 200 | `src/hooks/useAllowedIPs.ts` |
| 500 | `src/hooks/useAppliedResponses.ts` |
| 1000 | `src/hooks/useAttribution.ts` |
| 200 | `src/hooks/useAutomationRules.ts` |
| 50 | `src/hooks/useAutomationRules.ts` |
| 100 | `src/hooks/useBIAdvanced.ts` |
| 500 | `src/hooks/useBIAdvanced.ts` |
| 5000 | `src/hooks/useBIAdvanced.ts` |
| 100 | `src/hooks/useBattleCards.ts` |
| 3000 | `src/hooks/useBehaviorAlerts.ts` |
| 500 | `src/hooks/useBehaviorAlerts.ts` |
| 5000 | `src/hooks/useBehaviorAlerts.ts` |
| 5000 | `src/hooks/useBestTimeHeatmap.ts` |
| 50 | `src/hooks/useCRMAlerts.ts` |
| 100 | `src/hooks/useCSATSurveys.ts` |
| 500 | `src/hooks/useCampaignRecipients.ts` |
| 200 | `src/hooks/useCannedResponses.ts` |
| 5000 | `src/hooks/useChannelPerformanceMatrix.ts` |
| 200 | `src/hooks/useChurnRisk.ts` |
| 20 | `src/hooks/useClosingScoreAlerts.ts` |
| 50 | `src/hooks/useClosingScoreRanking.ts` |
| 50 | `src/hooks/useCognitiveBiasPersistence.ts` |
| 1 | `src/hooks/useCommunicationPreferences.ts` |
| 1000 | `src/hooks/useCompanyProfileAnalytics.ts` |
| 2000 | `src/hooks/useCompatibilityAlerts.ts` |
| 5000 | `src/hooks/useCompatibilityAlerts.ts` |
| 50 | `src/hooks/useConnectionAnomalies.ts` |
| 30 | `src/hooks/useConnectionMetrics.ts` |
| 100 | `src/hooks/useConnections.ts` |
| 20 | `src/hooks/useConnections.ts` |
| 500 | `src/hooks/useContactBehavior.ts` |
| 1 | `src/hooks/useContactCadence.ts` |
| 500 | `src/hooks/useContactCadence.ts` |
| 1 | `src/hooks/useContactDaysWithout.ts` |
| 10 | `src/hooks/useContactDetail.ts` |
| 20 | `src/hooks/useContactDetail.ts` |
| 50 | `src/hooks/useContactDetail.ts` |
| 100 | `src/hooks/useContactRelationalData.ts` |
| 30 | `src/hooks/useContactTagsHistory.ts` |
| 100 | `src/hooks/useConversationIntel.ts` |
| 50 | `src/hooks/useConversationIntel.ts` |
| 200 | `src/hooks/useCustomFields.ts` |
| 200 | `src/hooks/useCustomerSuccess.ts` |
| 1 | `src/hooks/useDISCAnalysis.ts` |
| 10 | `src/hooks/useDISCAnalysis.ts` |
| 20 | `src/hooks/useDISCAnalysis.ts` |
| 50 | `src/hooks/useDISCAnalysis.ts` |
| 5000 | `src/hooks/useDISCAnalysis.ts` |
| 5 | `src/hooks/useDISCAutoAnalysis.ts` |
| 20 | `src/hooks/useDISCCommunicationLogs.ts` |
| 5000 | `src/hooks/useDISCConversionData.ts` |
| 200 | `src/hooks/useDISCConversionMetrics.ts` |
| 200 | `src/hooks/useDealForecastConfidence.ts` |
| 100 | `src/hooks/useDealRooms.ts` |
| 200 | `src/hooks/useDealRooms.ts` |
| 50 | `src/hooks/useDealRooms.ts` |
| 20 | `src/hooks/useDealSlipRisk.ts` |
| 2000 | `src/hooks/useDedupEngine.ts` |
| 500 | `src/hooks/useDedupEngine.ts` |
| 200 | `src/hooks/useDocumentTemplates.ts` |
| 100 | `src/hooks/useDocuments.ts` |
| 100 | `src/hooks/useEmailCampaigns.ts` |
| 10000 | `src/hooks/useEmailCampaigns.ts` |
| 50 | `src/hooks/useEmotionalAnchors.ts` |
| 10000 | `src/hooks/useEnrichmentExport.ts` |
| 30 | `src/hooks/useEnrichmentSuite.ts` |
| 50 | `src/hooks/useEnrichmentSuite.ts` |
| 10 | `src/hooks/useEntity360.ts` |
| 20 | `src/hooks/useEntity360.ts` |
| 200 | `src/hooks/useEntityRelationships.ts` |
| 200 | `src/hooks/useErrorLogs.ts` |
| 50 | `src/hooks/useFamilyHistory.ts` |
| 200 | `src/hooks/useFavoriteTemplates.ts` |
| 100 | `src/hooks/useFeatureFlag.ts` |
| 5 | `src/hooks/useFicha360ConversationSummary.ts` |
| 5 | `src/hooks/useFicha360NLP.ts` |
| 100 | `src/hooks/useForms.ts` |
| 200 | `src/hooks/useForms.ts` |
| 300 | `src/hooks/useGeoBlocking.ts` |
| 20 | `src/hooks/useHealthAlerts.ts` |
| 500 | `src/hooks/useImportantDates.ts` |
| 5000 | `src/hooks/useInboundActivityHeatmap.ts` |
| 100 | `src/hooks/useIncomingWebhooks.ts` |
| 50 | `src/hooks/useIncomingWebhooks.ts` |
| 500 | `src/hooks/useIntent.ts` |
| 200 | `src/hooks/useKnowledgeBase.ts` |
| 100 | `src/hooks/useLandingPages.ts` |
| 500 | `src/hooks/useLandingPages.ts` |
| 200 | `src/hooks/useLeadMagnets.ts` |
| 30 | `src/hooks/useLeadScore.ts` |
| 100 | `src/hooks/useLeadScoring.ts` |
| 20 | `src/hooks/useLeadScoring.ts` |
| 5000 | `src/hooks/useLeadScoring.ts` |
| 10 | `src/hooks/useLuxIntelligence.ts` |
| 20 | `src/hooks/useLuxWebhookConfig.ts` |
| 100 | `src/hooks/useMQL.ts` |
| 200 | `src/hooks/useMQL.ts` |
| 500 | `src/hooks/useMarkObjectionHandled.ts` |
| 1000 | `src/hooks/useMarketingInsights.ts` |
| 200 | `src/hooks/useMetaprogramAnalysis.ts` |
| 5000 | `src/hooks/useNLPAnalyticsData.ts` |
| 20 | `src/hooks/useNLPAutoAnalysis.ts` |
| 200 | `src/hooks/useNLPAutoAnalysis.ts` |
| 3000 | `src/hooks/useNetworkGraph.ts` |
| 5000 | `src/hooks/useNetworkGraph.ts` |
| 1 | `src/hooks/useNextBestAction.ts` |
| 5 | `src/hooks/useNotifications.ts` |
| 500 | `src/hooks/useNotifications.ts` |
| 500 | `src/hooks/useNpsSurveys.ts` |
| 200 | `src/hooks/useNurturingExecutions.ts` |
| 200 | `src/hooks/useNurturingWorkflows.ts` |
| 100 | `src/hooks/useObjectionExampleFeedback.ts` |
| 200 | `src/hooks/usePasswordResetRequests.ts` |
| 200 | `src/hooks/usePlaybooks.ts` |
| 2000 | `src/hooks/usePortfolioCompatibility.ts` |
| 5000 | `src/hooks/usePortfolioCompatibility.ts` |
| 100 | `src/hooks/usePreContactBriefing.ts` |
| 200 | `src/hooks/usePreContactBriefing.ts` |
| 50 | `src/hooks/usePreContactBriefing.ts` |
| 20 | `src/hooks/usePrefetch.ts` |
| 100 | `src/hooks/useProximoPassoFeedback.ts` |
| 20 | `src/hooks/useRBAC.tsx` |
| 200 | `src/hooks/useRBAC.tsx` |
| 10000 | `src/hooks/useRFMAnalysis.ts` |
| 12 | `src/hooks/useRFMAnalysis.ts` |
| 1 | `src/hooks/useRFMSegmentConfig.ts` |
| 20 | `src/hooks/useRFMSegmentConfig.ts` |
| 10 | `src/hooks/useRealtimeNotifications.ts` |
| 20 | `src/hooks/useRealtimeNotifications.ts` |
| 20 | `src/hooks/useRevOps.ts` |
| 500 | `src/hooks/useRodizioBloqueios.ts` |
| 500 | `src/hooks/useRodizioEquipe.ts` |
| 200 | `src/hooks/useRodizioOndas.ts` |
| 2000 | `src/hooks/useRodizioOndas.ts` |
| 500 | `src/hooks/useRoutingMetrics.ts` |
| 200 | `src/hooks/useSchemaDriftAlerts.ts` |
| 100 | `src/hooks/useScoreAutomations.ts` |
| 200 | `src/hooks/useScoreAutomations.ts` |
| 50 | `src/hooks/useScoreHistory.ts` |
| 200 | `src/hooks/useSecretRotation.ts` |
| 200 | `src/hooks/useSentimentAnnotations.ts` |
| 200 | `src/hooks/useSequenceEvents.ts` |
| 500 | `src/hooks/useSequenceEvents.ts` |
| 200 | `src/hooks/useSequences.ts` |
| 50 | `src/hooks/useSequences.ts` |
| 50 | `src/hooks/useSmartNotifications.ts` |
| 2000 | `src/hooks/useSmartTemplateSuggestions.ts` |
| 5000 | `src/hooks/useSmartTemplateSuggestions.ts` |
| 100 | `src/hooks/useSmsCampaigns.ts` |
| 200 | `src/hooks/useSmsCampaigns.ts` |
| 500 | `src/hooks/useSmsCampaigns.ts` |
| 100 | `src/hooks/useSocialInsights.ts` |
| 1 | `src/hooks/useSocialIntelligence.ts` |
| 10 | `src/hooks/useSocialIntelligence.ts` |
| 20 | `src/hooks/useSocialIntelligence.ts` |
| 50 | `src/hooks/useSocialIntelligence.ts` |
| 500 | `src/hooks/useStakeholderAlerts.ts` |
| 200 | `src/hooks/useSupportTickets.ts` |
| 200 | `src/hooks/useTeamDashboard.ts` |
| 5000 | `src/hooks/useTeamDashboard.ts` |
| 50000 | `src/hooks/useTeamDashboard.ts` |
| 500 | `src/hooks/useTimelineByEntity.ts` |
| 5000 | `src/hooks/useTouchpointSequences.ts` |
| 20 | `src/hooks/useTriggerAnalytics.ts` |
| 30 | `src/hooks/useTriggerAnalytics.ts` |
| 50 | `src/hooks/useTriggerAnalytics.ts` |
| 500 | `src/hooks/useTriggerHistory.ts` |
| 10 | `src/hooks/useUnifiedNotifications.ts` |
| 20 | `src/hooks/useUnifiedNotifications.ts` |
| 100 | `src/hooks/useUnifiedTimeline.ts` |
| 50 | `src/hooks/useUnifiedTimeline.ts` |
| 100 | `src/hooks/useUpcomingLifeEvents.ts` |
| 200 | `src/hooks/useVAKAnalysis.ts` |
| 50 | `src/hooks/useVAKAnalysis.ts` |
| 200 | `src/hooks/useValidationQueue.ts` |
| 20 | `src/hooks/useWebAuthn.ts` |
| 100 | `src/hooks/useWebhookDlq.ts` |
| 10 | `src/hooks/useWeeklyReport.ts` |
| 1 | `src/hooks/useWhatsAppData.ts` |
| 20 | `src/hooks/useWhatsAppData.ts` |
| 50 | `src/hooks/useWhatsAppData.ts` |
| 100 | `src/hooks/useWinLoss.ts` |
| 20 | `src/hooks/useWinLoss.ts` |
| 200 | `src/hooks/useWinLoss.ts` |
| 100 | `src/hooks/useYourDay.ts` |
| 200 | `src/hooks/useYourDay.ts` |
| 5 | `src/hooks/useYourDay.ts` |
| 50 | `src/hooks/useYourDay.ts` |
| 1 | `src/hooks/commercial/useSocialSync.ts` |
| 100 | `src/hooks/commercial/useSocialSync.ts` |
| 500 | `src/lib/contactBehaviorAudit.ts` |
| 400 | `src/pages/AdminAuditTrail.tsx` |
| 200 | `src/pages/AdminConexoesLogs.tsx` |
| 100 | `src/pages/AdminLuxConfig.tsx` |
| 500 | `src/pages/AdminTelemetria.tsx` |
| 100 | `src/pages/CRMRelationshipAuditPage.tsx` |
| 500 | `src/pages/Calendario.tsx` |
| 1000 | `src/pages/DocsPage.tsx` |
| 100 | `src/pages/Insights.tsx` |
| 20 | `src/pages/Insights.tsx` |
| 50 | `src/pages/Insights.tsx` |
| 5 | `src/pages/NLPAnalytics.tsx` |
| 200 | `src/pages/PermissionsPage.tsx` |
| 100 | `src/pages/RecommendationAudit.tsx` |
| 100 | `src/pages/RelatorioContato.tsx` |
| 50 | `src/pages/RelatorioContato.tsx` |
| 500 | `src/pages/RelatorioContato.tsx` |
| 200 | `src/pages/RolePermissionsPage.tsx` |
| 500 | `src/pages/RolesPage.tsx` |
| 500 | `src/pages/admin/BehavioralRegenAudit.tsx` |
| 500 | `src/pages/admin/InsightFeedbackAnalytics.tsx` |
| 10 | `src/pages/admin/Observability.tsx` |
| 100 | `src/pages/tarefas/CreateTaskDialog.tsx` |
| 100 | `src/pages/tarefas/TaskDetailDrawer.tsx` |
| 20 | `supabase/functions/ai-assistant/index.ts` |
| 1 | `supabase/functions/auto-regen-behavioral-profiles/index.ts` |
| 1 | `supabase/functions/bitrix24-webhook/index.ts` |
| 100 | `supabase/functions/client-notifications/index.ts` |
| 2000 | `supabase/functions/client-notifications/index.ts` |
| 100 | `supabase/functions/connection-anomaly-detector/index.ts` |
| 100 | `supabase/functions/connection-introspect/index.ts` |
| 4000 | `supabase/functions/connection-introspect/index.ts` |
| 200 | `supabase/functions/conversation-coaching-digest/index.ts` |
| 500 | `supabase/functions/demand-forecast/index.ts` |
| 500 | `supabase/functions/detect-churn-risk/index.ts` |
| 20 | `supabase/functions/email-thread-summary/index.ts` |
| 1000 | `supabase/functions/enrich-contacts/index.ts` |
| 1 | `supabase/functions/error-budget/index.ts` |
| 10000 | `supabase/functions/error-budget/index.ts` |
| 20 | `supabase/functions/error-budget/index.ts` |
| 1 | `supabase/functions/evolution-webhook/helpers.ts` |
| 2 | `supabase/functions/evolution-webhook/helpers.ts` |
| 5000 | `supabase/functions/external-data/index.ts` |
| 1 | `supabase/functions/ficha360-conversation-summary/index.ts` |
| 50 | `supabase/functions/forecast-narrative/index.ts` |
| 30 | `supabase/functions/generate-behavioral-profile/index.ts` |
| 50 | `supabase/functions/generate-behavioral-profile/index.ts` |
| 80 | `supabase/functions/generate-behavioral-profile/index.ts` |
| 100 | `supabase/functions/generate-offer-suggestions/index.ts` |
| 1 | `supabase/functions/health/index.ts` |
| 1 | `supabase/functions/health-aggregate/index.ts` |
| 5000 | `supabase/functions/intent-aggregator/index.ts` |
| 1000 | `supabase/functions/mql-evaluator/index.ts` |
| … +21 linhas — lista completa em `context.json` | |

## I. Regras implícitas em mensagens de erro/validação

| Mensagem | Arquivo |
|---|---|
| SUPABASE_ACCESS_TOKEN obrigatório; forneça pelo ambiente seguro | `tmp_view_check.js` |
| ) {     targetUrl =  | `public/sw-push.js` |
| :       return [         { action:  | `public/sw-push.js` |
| :     case  | `public/sw-push.js` |
| ${flag} exige um caminho | `scripts/audit-ausentes.mjs` |
| ${join(raiz, exigido)} não existe (use --raiz) | `scripts/audit-ausentes.mjs` |
| nenhuma tabela reconhecida em src/integrations/supabase/types.ts (o formato mudou?) | `scripts/audit-ausentes.mjs` |
| ${join(raiz, exigido)} não existe (use --raiz) | `scripts/diff-tables.mjs` |
| --raiz exige um caminho | `scripts/diff-tables.mjs` |
| nenhuma tabela reconhecida em src/integrations/supabase/types.ts (o formato mudou?) | `scripts/diff-tables.mjs` |
| não consegui resolver ${host} (${e.code ?? e.message}) | `scripts/gen-supabase-types.mjs` |
| ${msg}: esperado ${JSON.stringify(b)} obtido ${JSON.stringify(a)} | `scripts/ai-context/cenarios.mjs` |
| não é um objeto JSON | `scripts/ai-context/gerar.mjs` |
| falha fixture | `scripts/automation-tests/dispatch.mjs` |
| arquivo de terceiro | `scripts/automation-tests/snapshot.mjs` |
| entrypoint original não deve executar | `scripts/automation-tests/snapshot.mjs` |
| ${metodo} ${caminho} -> ${r.status} | `scripts/ci/actions-kpi.mjs` |
| PR sem headRefName | `scripts/ci/branch-podaveis.mjs` |
| a lista de PRs abertas não é um array | `scripts/ci/branch-podaveis.mjs` |
| a lista de PRs abertas veio cheia (${dados.length} >= limite ${limite}); pode haver PR que não veio | `scripts/ci/branch-podaveis.mjs` |
| argumento inválido: ${chave} | `scripts/ci/branch-podaveis.mjs` |
| falta --${obrigatorio} | `scripts/ci/branch-podaveis.mjs` |
| ${arquivo}: bloco  | `scripts/ci/render-workflow-docs.mjs` |
| SQL de cenário falhou: ${r.stderr \|\| r.erro} | `scripts/hardening/_pg-teste.mjs` |
| ${flag} exige o caminho de um arquivo | `scripts/inventario/gerar-banco.mjs` |
| --functions: o arquivo nao e JSON | `scripts/inventario/gerar-banco.mjs` |
| Management API ${caminho} nao devolveu JSON | `scripts/inventario/gerar-banco.mjs` |
| Management API ${caminho} respondeu HTTP ${res.status} | `scripts/inventario/gerar-banco.mjs` |
| SUPABASE_API_URL so aceita 127.0.0.1/localhost (e para teste). | `scripts/inventario/gerar-banco.mjs` |
| SUPABASE_PROJECT_REF=${ref} nao e o banco oficial (${PROJETO_OFICIAL}). | `scripts/inventario/gerar-banco.mjs` |
| a lista de edge functions publicadas nao e uma lista de { slug, ... } | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao parece ser do banco oficial: ${comuns} tabelas em comum com o manifesto  | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao parece ser do banco oficial: ledger com ${registros} registros e maior versao ${max};  | `scripts/inventario/gerar-banco.mjs` |
| a resposta nao traz resumo.ledger_versao_max/ledger_registros; rode o banco.sql atual. | `scripts/inventario/gerar-banco.mjs` |
| a saida tem algo com cara de credencial; nada foi gravado. Revise banco.sql. | `scripts/inventario/gerar-banco.mjs` |
| entrada fora do formato do banco.sql atual: ${ruins.join( | `scripts/inventario/gerar-banco.mjs` |
| entrada sem as chaves: ${faltando.join( | `scripts/inventario/gerar-banco.mjs` |
| entrada sem tabelas | `scripts/inventario/gerar-banco.mjs` |
| format_version ${dado.format_version} desconhecido (esperado 1) | `scripts/inventario/gerar-banco.mjs` |
| nao consegui ler o arquivo de ${flag} (${arquivo}): ${e.code ?? e.message} | `scripts/inventario/gerar-banco.mjs` |
| sem --entrada e sem SUPABASE_ACCESS_TOKEN: nada para ler (veja o cabecalho do script). | `scripts/inventario/gerar-banco.mjs` |
| sem supabase/schema-manifest.json e sem migrations em supabase/migrations/  | `scripts/inventario/gerar-banco.mjs` |
| ${DIR_FUNCOES_REL} nao existe neste repositorio. | `scripts/inventario/gerar-edge-tabela.mjs` |
| ${FDIR} não existe: rode a partir do repositório (ou confira INVENTARIO_RAIZ). | `scripts/inventario/gerar-repo.mjs` |
| --saida exige o caminho de uma pasta | `scripts/inventario/gerar-repo.mjs` |
| ripgrep (rg) falhou com exit ${status}; o inventário não foi gerado. | `scripts/inventario/gerar-repo.mjs` |
| ripgrep (rg) não encontrado; o inventário não pode ser gerado com segurança. | `scripts/inventario/gerar-repo.mjs` |
| ${FONTES.rotas}: nao achei o bloco <Routes>...</Routes>. | `scripts/inventario/gerar-rotas.mjs` |
| ${FONTES.sidebar}: nao achei  | `scripts/inventario/gerar-rotas.mjs` |
| caminho de  | `scripts/lib/seguranca-processo.mjs` |
| comando nao encontrado no PATH:  | `scripts/lib/seguranca-processo.mjs` |
| dividirSql espera uma string | `scripts/lib/sql-split.mjs` |
| enum ${nome} sem valores | `scripts/lib/sql-split.mjs` |
| nome de enum inválido: ${nome} | `scripts/lib/sql-split.mjs` |
| failed | `scripts/maintenance/common.mjs` |
| missing_dependencies | `scripts/maintenance/configuration.mjs` |
| missing_dependencies | `scripts/maintenance/dependencies.mjs` |
| skipped_busy | `scripts/maintenance/locking.mjs` |
| blocked_network_sandbox | `scripts/maintenance/sandbox.mjs` |
| pending_patch | `scripts/maintenance/session.mjs` |
| Bucket not found | `scripts/migration/_mock_supabase.ts` |
| invalid_grant | `scripts/migration/_mock_supabase.ts` |
| banco de teste precisa do prefixo g7_ | `scripts/migration/_pg_teste.ts` |
| psql falhou em ${db}: ${r.err} | `scripts/migration/_pg_teste.ts` |
| gravar ${TAB} (user ${l.user_id}, status ${l.status}): ${error.message} | `scripts/migration/reset-passwords.ts` |
| ler ${TAB}: ${error.message} (rodou sql/create-reset-log.sql no destino?) | `scripts/migration/reset-passwords.ts` |
| listUsers página ${page}: ${error.message} | `scripts/migration/reset-passwords.ts` |
| LSN inválido:  | `scripts/migration/cdc/order-guard.ts` |
| ${e.origem}: ${err instanceof SyntaxError ?  | `scripts/migration/cdc/replay.ts` |
| ${u.origem}: LSN inválido  | `scripts/migration/cdc/replay.ts` |
| DELETE em ${m.tabela} sem chave (REPLICA IDENTITY ausente) — recusado para não apagar a tabela inteira | `scripts/migration/cdc/replay.ts` |
| TRUNCATE em ${schema}.${tabela} não é reproduzível via API — trate manualmente e remova a linha | `scripts/migration/cdc/replay.ts` |
| ação desconhecida  | `scripts/migration/cdc/replay.ts` |
| falha ao aplicar ${m.acao} em ${m.tabela} (lsn ${u.lsn}): ${(err as Error).message} | `scripts/migration/cdc/replay.ts` |
| gravar checkpoint ${lsn}: ${error.message} | `scripts/migration/cdc/replay.ts` |
| ler checkpoint: ${error.message} (rodou cdc/checkpoint.sql no destino?) | `scripts/migration/cdc/replay.ts` |
| linha não é objeto JSON | `scripts/migration/cdc/replay.ts` |
| mudança sem LSN fora de transação (drene com include-lsn=true) | `scripts/migration/cdc/replay.ts` |
| mudança sem schema/table | `scripts/migration/cdc/replay.ts` |
| transação sem LSN (drene com include-lsn=true) | `scripts/migration/cdc/replay.ts` |
| transação v1 sem lsn/nextlsn (drene com include-lsn=true) | `scripts/migration/cdc/replay.ts` |
| ${tabela}: ${error.message} | `scripts/migration/compliance/lgpd-snapshot.ts` |
| ${tabela}: paginação não avançou (id repetido) | `scripts/migration/compliance/lgpd-snapshot.ts` |
| HTTP ${r.status} | `scripts/migration/cutover/smoke-tests.ts` |
| HTTP ${r.status}: ${corpo.slice(0, 120)} | `scripts/migration/cutover/smoke-tests.ts` |
| HTTP 200 com corpo vazio | `scripts/migration/cutover/smoke-tests.ts` |
| resposta não é lista | `scripts/migration/cutover/smoke-tests.ts` |
| sem access_token | `scripts/migration/cutover/smoke-tests.ts` |
| sem sessão (login falhou) | `scripts/migration/cutover/smoke-tests.ts` |
| ::text]))),   CONSTRAINT activities_type_check CHECK ((type = ANY (ARRAY[ | `scripts/migration/ddl/02_tables.sql` |
| ::text]))),   CONSTRAINT win_loss_insights_severity_check CHECK ((severity = ANY (ARRAY[ | `scripts/migration/ddl/02_tables.sql` |
| ,        | `scripts/migration/ddl/08_functions.sql` |
| ,       NEW.id::text,       notif_title,       NEW.message,       jsonb_build_object(          | `scripts/migration/ddl/08_functions.sql` |
| Protocolo inválido | `scripts/migration/dr/create-drill-backup.mjs` |
| login ${r.status} | `scripts/migration/monitoring/synthetic-checks.ts` |
| login sem access_token | `scripts/migration/monitoring/synthetic-checks.ts` |
| HTTP ${res.status} | `scripts/migration/storage/_lib.ts` |
| list ${bucket}/${prefix} HTTP ${res.status}: ${redact(await res.text())} | `scripts/migration/storage/_lib.ts` |
| list ${bucket}/${prefix}: resposta inesperada (não é lista) | `scripts/migration/storage/_lib.ts` |
| list ${bucket}/${prefix}: servidor ignorou offset=${offset} (página repetida) — abortando para não entrar em loop | `scripts/migration/storage/_lib.ts` |
| listBuckets falhou: HTTP ${res.status} ${redact(await res.text())} | `scripts/migration/storage/_lib.ts` |
| listBuckets: resposta inesperada (não é lista) | `scripts/migration/storage/_lib.ts` |
| timeout em ${rotulo} | `scripts/migration/storage/_lib.ts` |
| list falhou | `scripts/migration/storage/_lib_test.ts` |
| INFO da origem falhou: HTTP ${r.status} | `scripts/migration/storage/copy-large.ts` |
| INFO da origem não trouxe tamanho válido | `scripts/migration/storage/copy-large.ts` |
| chunk ${start}-${end} falhou: HTTP ${r.status} (esperado 206 Partial Content) | `scripts/migration/storage/copy-large.ts` |
| chunk ${start}-${end} veio com ${pedaco.length} bytes | `scripts/migration/storage/copy-large.ts` |
| upload destino falhou: HTTP ${upR.status} ${redact((await upR.text()).slice(0, 300))} | `scripts/migration/storage/copy-large.ts` |
| verificação pós-upload falhou: destino HTTP ${d.status} com ${d.size} bytes (esperado ${origem.size}) — checkpoint mantido | `scripts/migration/storage/copy-large.ts` |
| GET ${bucket}/${key} HTTP ${src.status} | `scripts/migration/storage/copy-objects.ts` |
| PUT ${bucket}/${key} HTTP ${put.status}: ${redact((await put.text()).slice(0, 300))} | `scripts/migration/storage/copy-objects.ts` |
| conteúdo baixado de ${bucket}/${key} não bate com o ETag da origem (md5=${md5Local} etag=${etagOrigem}) | `scripts/migration/storage/copy-objects.ts` |
| download truncado de ${bucket}/${key}: origem diz ${size} bytes, vieram ${baixados} | `scripts/migration/storage/copy-objects.ts` |
| verificação pós-upload de ${bucket}/${key}: ETag ${d.etag} ≠ MD5 ${md5Local} | `scripts/migration/storage/copy-objects.ts` |
| verificação pós-upload de ${bucket}/${key}: HEAD HTTP ${d.status} | `scripts/migration/storage/copy-objects.ts` |
| verificação pós-upload de ${bucket}/${key}: destino tem ${d.size} bytes, enviados ${baixados} | `scripts/migration/storage/copy-objects.ts` |
| não deveria dormir | `scripts/migration/storage/copy-objects_test.ts` |
| HTTP ${res.status}: ${redact((await res.text()).slice(0, 300))} | `scripts/migration/storage/create-buckets.ts` |
| ${tabela}: ${error.message} | `scripts/migration/verify/dual-write-diverge.ts` |
| ${tabela}: mais de ${maxLinhas} linhas na janela — reduza WINDOW_MIN | `scripts/migration/verify/dual-write-diverge.ts` |
| destino: ${e instanceof Error ? e.message : e} | `scripts/migration/verify/storage-bytes.ts` |
| download HTTP ${r.status} | `scripts/migration/verify/storage-bytes.ts` |
| origem: ${e instanceof Error ? e.message : e} | `scripts/migration/verify/storage-bytes.ts` |
| storage list falhou: HTTP ${res.status} | `scripts/migration/verify/storage-public-guard.ts` |
| storage list: resposta inesperada (não é lista) | `scripts/migration/verify/storage-public-guard.ts` |
| baseline ${ARQ} sem  | `scripts/rls-matrix/check-rls-baseline.mjs` |
| baseline:  | `scripts/rls-matrix/check-rls-baseline.mjs` |
| baseline: ${tabela}.${perfil} = ${JSON.stringify(n)} (esperado inteiro >= -1) | `scripts/rls-matrix/check-rls-baseline.mjs` |
| nao consegui ler o baseline ${ARQ}: ${e.message} | `scripts/rls-matrix/check-rls-baseline.mjs` |
| O teste offline não permite consultas ao banco | `scripts/supabase_snapshot/test_snapshot.py` |
| banco indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| catálogo indisponível na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| permission denied for schema auth | `scripts/supabase_snapshot/test_snapshot.py` |
| relation  | `scripts/supabase_snapshot/test_snapshot.py` |
| statement timeout simulado | `scripts/supabase_snapshot/test_snapshot.py` |
| view removida depois da consulta ao catálogo | `scripts/supabase_snapshot/test_snapshot.py` |
| view sem permissão na fixture | `scripts/supabase_snapshot/test_snapshot.py` |
| Conexão perdida | `src/app/AppRoutes.tsx` |
| Erro ao exportar logs | `src/components/admin/AdminQuickActions.tsx` |
| Erro ao rodar testes | `src/components/admin/AdminQuickActions.tsx` |
| Erro ao verificar saúde do sistema | `src/components/admin/AdminQuickActions.tsx` |
| ⚠️ ${passed}/${results.length} — Falhas: ${failed.map(f => f.name).join( | `src/components/admin/AdminQuickActions.tsx` |
| ⚠️ Status: ${status} | `src/components/admin/AdminQuickActions.tsx` |
| ; import { Sparkles, AlertTriangle, ShieldAlert, CheckCircle2, Timer } from  | `src/components/admin/AiGatewayHealthCard.tsx` |
| ; import { Database, AlertTriangle } from  | `src/components/admin/AiGatewayPartitionsCard.tsx` |
| ; import { Badge } from  | `src/components/admin/BehavioralRegenAlertBanner.tsx` |
| Falha ao reconhecer alerta | `src/components/admin/BehavioralRegenAlertBanner.tsx` |
| ,         { _alert_type:  | `src/components/admin/BehavioralRegenCronHealth.tsx` |
| Falha ao simular alerta | `src/components/admin/BehavioralRegenCronHealth.tsx` |
| ; import { ShieldAlert } from  | `src/components/admin/RequireAdmin.tsx` |
| ; import { Gauge, AlertTriangle, TrendingUp, TrendingDown, Minus } from  | `src/components/admin/RpcPerfCard.tsx` |
| ; import {   Select,   SelectContent,   SelectItem,   SelectTrigger,   SelectValue, } from  | `src/components/admin/RpcPlanChurnCard.tsx` |
| ; import { AlertTriangle } from  | `src/components/admin/RpcPlanChurnTimelineChart.tsx` |
| ; import { ScrollArea } from  | `src/components/admin/RpcPlanDiffDialog.tsx` |
| ; import { AlertTriangle, GitCompare } from  | `src/components/admin/RpcPlanSnapshotsCard.tsx` |
| NLU: ${nluError.message} | `src/components/admin/VoiceAITestPanel.tsx` |
| STT: ${sttError.message} | `src/components/admin/VoiceAITestPanel.tsx` |
| ; import { useConnections, type ConnectionType, type ConnectionConfig } from  | `src/components/admin/conexoes/ConnectionFormDialog.tsx` |
| Não foi possível copiar | `src/components/admin/conexoes/IncomingWebhookCard.tsx` |
| ; import { useIncomingWebhooks, type WebhookTargetEntity } from  | `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx` |
| Cole um JSON de exemplo válido | `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx` |
| Falha IA: ${parseApiError(e)} | `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx` |
| O webhook secret deve ter ao menos 32 caracteres | `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx` |
| ; import { Button } from  | `src/components/admin/conexoes/McpInstructionsCard.tsx` |
| Não foi possível copiar | `src/components/admin/conexoes/McpInstructionsCard.tsx` |
| Erro: ${parseApiError(e)} | `src/components/admin/conexoes/SchemaDiscoveryCard.tsx` |
| Falha: ${parseApiError(e)} | `src/components/admin/conexoes/WebhookReplayButton.tsx` |
| Sessão expirada | `src/components/admin/conexoes/WebhookReplayButton.tsx` |
| Não foi possível copiar | `src/components/ai/AIEmailComposer.tsx` |
| Selecione um contato | `src/components/ai/AIEmailComposer.tsx` |
| Não foi possível copiar | `src/components/ai/AIMessageGenerator.tsx` |
| Não foi possível copiar | `src/components/analytics/ApproachRecommendationPanel.tsx` |
| Não foi possível detectar novos alertas. Tente novamente. | `src/components/analytics/BehaviorAlertsPanel.tsx` |
|  className= | `src/components/analytics/DISCAnalyticsPanel.tsx` |
| ;  /**  * Aviso de modo demonstração.  *  * Os painéis de PNL e de gatilhos avançados aceitam  | `src/components/analytics/DemoContactNotice.tsx` |
| Não foi possível salvar a análise RFM. Tente novamente. | `src/components/analytics/RFMAnalysisPanel.tsx` |
| Erro ao enviar email de recuperação. | `src/components/auth/ForgotPasswordForm.tsx` |
|  className= | `src/components/auth/MFAGuard.tsx` |
| :       return (         <div className= | `src/components/automation/ActionConfigForm.tsx` |
| ,     name:  | `src/components/automation/AutomationTemplates.tsx` |
| , config: { title:  | `src/components/automation/AutomationTemplates.tsx` |
| Falha ao copiar | `src/components/bi/EmbeddableDashboards.tsx` |
| Não foi possível copiar | `src/components/carnegie/AppreciationPanel.tsx` |
| Nao foi possivel copiar | `src/components/carnegie/CarnegieExtendedLibrary.tsx` |
| Não foi possível copiar | `src/components/carnegie/FaceSavingPanel.tsx` |
| Não foi possível copiar | `src/components/carnegie/IdentityLabelingPanel.tsx` |
| Não foi possível copiar | `src/components/carnegie/NobleCausePanel.tsx` |
| Não foi possível copiar | `src/components/carnegie/ProgressCelebrationPanel.tsx` |
| Não foi possível copiar | `src/components/carnegie/VulnerabilityPanel.tsx` |
| useCelebration must be used within CelebrationProvider | `src/components/celebrations/CelebrationProvider.tsx` |
| Erro ao registrar interação | `src/components/company-detail/QuickActionsWidget.tsx` |
| Informe um resumo | `src/components/company-detail/QuickActionsWidget.tsx` |
| Cadastre ao menos um contato nesta empresa para gerar o roteiro | `src/components/company-detail/QuickFollowUpGenerator.tsx` |
| Não foi possível copiar | `src/components/company-detail/QuickFollowUpGenerator.tsx` |
| Não autenticado | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| Erro ao atualizar estágio | `src/components/contact-detail/ContactDetailHeader.tsx` |
| Erro ao registrar interação | `src/components/contact-detail/ContactInteractionsTab.tsx` |
| Erro ao marcar como duplicado | `src/components/contact-detail/DuplicateManagementPanel.tsx` |
| Erro ao remover flag de duplicação | `src/components/contact-detail/DuplicateManagementPanel.tsx` |
| Erro ao aceitar | `src/components/contact-detail/LifeEventsTab.tsx` |
| Erro ao adicionar | `src/components/contact-detail/LifeEventsTab.tsx` |
| Erro ao atualizar | `src/components/contact-detail/LifeEventsTab.tsx` |
| Erro ao criar evento | `src/components/contact-detail/LifeEventsTab.tsx` |
| Erro ao rejeitar | `src/components/contact-detail/LifeEventsTab.tsx` |
| Erro ao remover evento | `src/components/contact-detail/LifeEventsTab.tsx` |
| Marco adicionado, mas falha ao marcar sugestão. | `src/components/contact-detail/LifeEventsTab.tsx` |
| Não autenticado | `src/components/contact-detail/LifeEventsTab.tsx` |
| Relacionado adicionado, mas falha ao marcar sugestão. | `src/components/contact-detail/LifeEventsTab.tsx` |
| Erro ao corrigir: ${parseApiError(err)} | `src/components/contact-detail/MetricOverrideFlow.tsx` |
| Usuário não autenticado | `src/components/contact-detail/MetricOverrideFlow.tsx` |
| Não foi possível copiar | `src/components/contact-detail/NextBestActionCard.tsx` |
|  className= | `src/components/contact-detail/SocialInsightsError.tsx` |
| Arquivamento não confirmado | `src/components/contact-detail/SoftDeletePanel.tsx` |
| Erro ao mover para lixeira | `src/components/contact-detail/SoftDeletePanel.tsx` |
| Erro ao restaurar contato | `src/components/contact-detail/SoftDeletePanel.tsx` |
| Restauração não confirmada | `src/components/contact-detail/SoftDeletePanel.tsx` |
| Por favor, insira um e-mail válido | `src/components/contact-detail/data-tab/RelativeDialog.tsx` |
| ;  interface LifeEventsGapChecklistProps {   lifeEvents: Tables< | `src/components/contact-detail/life-events/LifeEventsGapChecklist.tsx` |
| Erro ao importar contato | `src/components/contacts/ExternalContactLookupDialog.tsx` |
| Falha ao buscar na base externa | `src/components/contacts/ExternalContactLookupDialog.tsx` |
| Erro ao enviar feedback | `src/components/contacts/InsightFeedbackControls.tsx` |
| Erro ao remover feedback | `src/components/contacts/InsightFeedbackControls.tsx` |
| Erro ao salvar observação | `src/components/contacts/InsightFeedbackControls.tsx` |
| Não foi possível copiar | `src/components/context-menu/QuickActionsMenu.tsx` |
| Erro ao reprocessar: ${parseApiError(error)} | `src/components/crm/CRMAutomationAuditLog.tsx` |
| Não autenticado | `src/components/crm/CRMAutomationAuditLog.tsx` |
| Erro ao remover regra: ${parseApiError(e)} | `src/components/crm/CadenceRulesConfig.tsx` |
| Erro ao salvar regra: ${parseApiError(error)} | `src/components/crm/CadenceRulesConfig.tsx` |
| Não autenticado | `src/components/crm/CadenceRulesConfig.tsx` |
| Erro ao salvar configurações:  | `src/components/crm/EscalationAutomation.tsx` |
| User not authenticated | `src/components/crm/EscalationAutomation.tsx` |
| Erro ao processar objeção | `src/components/crm/NextBestAction.tsx` |
| Não foi possível copiar | `src/components/crm/NextBestAction.tsx` |
|  className= | `src/components/crm/behavior/BehavioralAuditSubTab.tsx` |
|  className= | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| Erro ao atualizar status da oferta | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| Não autenticado | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| Não foi possível copiar | `src/components/crm/commercial/OfferSuggestionsElite.tsx` |
| Não foi possível copiar | `src/components/crm/copywriting/PersuasionFrameworks.tsx` |
| Não foi possível copiar | `src/components/crm/copywriting/SalesScriptGenerator.tsx` |
| Erro ao abrir a impressão:  | `src/components/crm/relationship/RelationshipReportExport.tsx` |
| Erro ao exportar CSV:  | `src/components/crm/relationship/RelationshipReportExport.tsx` |
| >           <p className= | `src/components/dashboard/RelationshipStatsPanel.tsx` |
| Erro ao agendar | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| Erro ao gerar follow-up | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| Erro na exportação | `src/components/dashboard/StrategicNextStepsCard.tsx` |
| >         <p className= | `src/components/dashboard/YourDaySection.tsx` |
|  className= | `src/components/dashboard/widgets/PendingFollowupsWidget.tsx` |
| Nenhum dado para exportar | `src/components/data-export/AdvancedDataExporter.tsx` |
| Selecione pelo menos uma coluna para exportar | `src/components/data-export/AdvancedDataExporter.tsx` |
| Não foi possível copiar | `src/components/deal-rooms/ShareDialog.tsx` |
| Não foi possível copiar | `src/components/disc/DISCSalesScriptGenerator.tsx` |
| Não foi possível copiar | `src/components/disc/DISCTemplateLibrary.tsx` |
|  className= | `src/components/enroll/EnrollContactDialog.tsx` |
|  className= | `src/components/erp/CompanyErpProposalsWidget.tsx` |
|          aria-live= | `src/components/feedback/AriaLiveRegion.tsx` |
| useAriaLiveRegion must be used within an AriaLiveProvider | `src/components/feedback/AriaLiveRegion.tsx` |
|        aria-live= | `src/components/feedback/ErrorState.tsx` |
|      >       <AlertCircle className= | `src/components/feedback/ErrorState.tsx` |
| Algumas operações estão mais lentas que o normal | `src/components/feedback/SlowQueryIndicator.tsx` |
| A data/hora deve ser no futuro | `src/components/ficha-360/AgendarReuniaoForm.tsx` |
| Informe data e hora | `src/components/ficha-360/AgendarReuniaoForm.tsx` |
| Não foi possível copiar | `src/components/ficha-360/AgendarReuniaoForm.tsx` |
| Filtro aplicado, mas não foi possível salvar (limite atingido). | `src/components/ficha-360/AplicarFavoritoCompartilhadoDialog.tsx` |
| Não foi possível copiar o link | `src/components/ficha-360/CopiarLinkFiltrosButton.tsx` |
|              className= | `src/components/ficha-360/CopyScriptMenu.tsx` |
| Não foi possível copiar | `src/components/ficha-360/CopyScriptMenu.tsx` |
| Erro na sincronização social. Verifique as configurações. | `src/components/ficha-360/DadosPessoaisCard.tsx` |
| Nenhum link de rede social encontrado para sincronizar. | `src/components/ficha-360/DadosPessoaisCard.tsx` |
| Não foi possível copiar o link. | `src/components/ficha-360/FavoritosFiltrosMenu.tsx` |
| Aguarde antes de repetir | `src/components/ficha-360/PassoFeedbackMenu.tsx` |
| Não foi possível registrar | `src/components/ficha-360/PassoFeedbackMenu.tsx` |
| ; import {   Tooltip,   TooltipContent,   TooltipProvider,   TooltipTrigger, } from  | `src/components/ficha-360/ProntidaoWeightsEditor.tsx` |
| Erro ao registrar interação | `src/components/ficha-360/ProximaAcaoCTA.tsx` |
| Informe um resumo | `src/components/ficha-360/ProximaAcaoCTA.tsx` |
| Não foi possível copiar | `src/components/ficha-360/ProximaAcaoCTA.tsx` |
| ; import {   Select,   SelectContent,   SelectItem,   SelectTrigger,   SelectValue, } from  | `src/components/ficha-360/ProximoPassoQuickForm.tsx` |
| Informe data e hora | `src/components/ficha-360/ProximoPassoQuickForm.tsx` |
| Dê um nome ao filtro. | `src/components/ficha-360/ProximosPassosPresets.tsx` |
| Não foi possível remover. | `src/components/ficha-360/ProximosPassosPresets.tsx` |
| Não foi possível salvar. | `src/components/ficha-360/ProximosPassosPresets.tsx` |
| Não foi possível atualizar o relatório. | `src/components/ficha-360/RelatoriosFixosBar.tsx` |
| Falha ao copiar | `src/components/ficha-360/ResumoConversaIADialog.tsx` |
| Dê um nome ao preset. | `src/components/ficha-360/SimulationModePanel.tsx` |
| Já existe um preset com esse nome. | `src/components/ficha-360/SimulationModePanel.tsx` |
| Apenas imagens são permitidas | `src/components/forms/CompanyLogoUpload.tsx` |
| Erro ao enviar logo | `src/components/forms/CompanyLogoUpload.tsx` |
| Imagem deve ter no máximo 2MB | `src/components/forms/CompanyLogoUpload.tsx` |
| Usuário não autenticado | `src/components/forms/CompanyLogoUpload.tsx` |
| Apenas imagens são permitidas | `src/components/forms/ContactAvatarUpload.tsx` |
| Erro ao enviar foto | `src/components/forms/ContactAvatarUpload.tsx` |
| Imagem deve ter no máximo 2MB | `src/components/forms/ContactAvatarUpload.tsx` |
| Usuário não autenticado | `src/components/forms/ContactAvatarUpload.tsx` |
| Erro ao enviar anexo | `src/components/forms/InteractionForm.tsx` |
| Erro ao verificar badges | `src/components/gamification/BadgesWidget.tsx` |
|        className= | `src/components/intel/IntelErrorState.tsx` |
| Falha ao copiar link. | `src/components/intel/RecentSnapshotsPanel.tsx` |
| Comando desconhecido: ${cmd} | `src/components/intelligence/AskTab.tsx` |
| Nenhuma tabela disponível para exportar. | `src/components/intelligence/AskTab.tsx` |
| … +809 linhas — lista completa em `context.json` | |

## J. Controle de acesso no código (checagens de perfil/permissão)

| Valor comparado | Arquivo |
|---|---|
| `role` | `src/components/abm/BuyingCommitteeBoard.tsx` |
| `user` | `src/components/ask-crm/AskCrmChat.tsx` |
| `contact` | `src/components/company-detail/InteracoesPessoaCargoBar.tsx` |
| `assistant` | `src/components/intelligence/AskTab.tsx` |
| `user` | `src/components/intelligence/AskTab.tsx` |
| `default` | `src/components/pwa/NotificationAndMisc.tsx` |
| `default` | `src/components/settings/TourPreferencesPanel.tsx` |
| `denied` | `src/components/settings/TourPreferencesPanel.tsx` |
| `granted` | `src/components/settings/TourPreferencesPanel.tsx` |
| `contact` | `src/components/ui/role-badge.tsx` |
| `admin` | `src/hooks/useMttaSlaBreachSnapshot.ts` |
| `granted` | `src/hooks/useNotifications.ts` |
| `granted` | `src/hooks/useStakeholderAlerts.ts` |
| `decision_maker` | `src/hooks/useYourDay.ts` |
| `owner` | `src/hooks/useYourDay.ts` |
| `granted` | `src/lib/pushNotifications.ts` |
| `admin` | `src/lib/roleAssignment.ts` |
| `user` | `src/pages/Assistente.tsx` |
| `denied` | `src/pages/Notificacoes.tsx` |
| `papel` | `src/pages/RolesPage.tsx` |
| `champion` | `supabase/functions/abm-account-scorer/index.ts` |
| `decision_maker` | `supabase/functions/abm-account-scorer/index.ts` |
| `decision_maker` | `supabase/functions/generate-offer-suggestions/index.ts` |
| `owner` | `supabase/functions/generate-offer-suggestions/index.ts` |
| `admin` | `supabase/migrations/20260513143442_29ae388a-6dff-4a07-b25c-8d2b70aec893.sql` |
| `admin` | `supabase/migrations/20261012194307_recover_atomic_queue_claims.sql` |
| `admin` | `supabase/migrations/20261027220000_serialize_contact_relation_writes.sql` |
| `admin` | `supabase/migrations/20261118182244_guard_contact_relation_write_fn.sql` |
| `admin` | `supabase/migrations/20261123200000_fix_claim_behavioral_profile_retry_admin_check.sql` |

## K. Testes como especificação (3273 testes em 256 arquivos — nomes completos em `context.json`)

| Arquivo | Testes | Exemplos do que o sistema DEVE fazer |
|---|---|---|
| `src/__tests__/ui-improvements-verification.test.ts` | 80 | toTitleCase — Title Case Formatting · converts uppercase to title case · keeps state abbreviations uppercase · keeps PAC uppercase … |
| `src/__tests__/validate-dashboard-improvements.test.ts` | 80 | Dashboard Layout Improvements Validation · Sticky Tabs Implementation · should have sticky positioning on tabs container · should have correct mobile offset for MobileHeader … |
| `src/hooks/voice/__tests__/voice-system-exhaustive.test.ts` | 80 | Voice Auth Module · getAuthToken — Session states · returns access_token from active session · refreshes when session is null … |
| `src/data/__tests__/carnegieFunctions.test.ts` | 77 | Criticism Detector: detectCriticalLanguage · detects direct criticism · detects passive aggressive language · detects complaints … |
| `src/test/company-filters-audit.test.ts` | 76 | Company Filters — Boolean Fields · is_customer=true filters only true customers · is_customer=false includes null as false · is_matriz=true filters only explicit true … |
| `src/test/telemetry/telemetry-helpers.test.ts` | 74 | formatDuration · should format milliseconds below 1000 · should format seconds for values >= 1000 · should handle large values … |
| `src/data/__tests__/carnegieVulnerabilityYesLadderInterest.test.ts` | 69 | VULNERABILITY_TEMPLATES — Data Integrity · has 7+ templates · each template has required fields · has unique IDs … |
| `src/data/__tests__/carnegieCriticismEmpathy.test.ts` | 65 | CRITICAL_PATTERNS — Data Integrity · has 8 critical language types · each type has required fields · patterns are valid RegExp … |
| `src/test/telemetry/external-data-telemetry.test.ts` | 65 | Request validation · should reject missing table · should reject empty table · should reject invalid table names … |
| `src/test/company-form-exhaustive.test.tsx` | 61 | CompanyForm — Rendering · renders create mode with correct title · renders edit mode with correct title · renders all 7 tabs in edit mode … |
| `src/__tests__/design-system-audit.test.ts` | 60 | Design System Audit - Semantic Token Compliance · text-white usage · bg-gray-* usage · text-black usage … |
| `src/data/__tests__/carnegieProgressStorytellingQuestions.test.ts` | 59 | PROGRESS_CELEBRATIONS — Data Integrity · has 10 celebration types · each celebration has required fields · has unique IDs … |
| `src/test/telemetry/telemetry-data-integrity.test.ts` | 56 | Schema validation · should validate a correct row · should detect missing id · should detect missing operation … |
| `src/data/__tests__/carnegieDataIntegrity.test.ts` | 51 | Face Saving Techniques · has at least 8 techniques · covers multiple scenarios · every technique has DISC variations … |
| `src/__tests__/e2e-regression-suite.test.ts` | 49 | Route & Page Integrity · AppRoutes.tsx exists and is valid · AppRoutes.tsx imports React Router · AppRoutes.tsx has route definitions … |
| `src/__tests__/integration/data-validation.test.ts` | 46 | Data Validation Integration · CNPJ Validation · accepts valid formatted CNPJ · 11.222.333/0001-81 … |
| `src/data/__tests__/carnegieEagerWantNobleCauses.test.ts` | 43 | Eager Wants: Data Integrity · has exactly 8 desire categories · covers all 8 categories · unique IDs … |
| `src/data/__tests__/carnegieModules.test.ts` | 40 | Carnegie Criticism Detector · has at least 3 criticism types · all types have required fields · all types have valid severity … |
| `src/data/__tests__/communicationTrainingData.test.ts` | 40 | DISC_TRAINING Matrix Completeness · has all 4 seller profiles · Seller %s · has tips for all 4 target profiles … |
| `src/components/interactions/__tests__/CanaisQuickFilter.test.tsx` | 39 | CanaisQuickFilter · auto mode: clicking a chip calls onChange immediately · manual mode: clicking a chip does NOT call onChange and shows Apply button · manual mode: Apply button calls onChange with pending selection … |
| `src/components/interactions/insights/__tests__/weekUtils.test.ts` | 39 | normalizeWeek · trunca formato com hora local · trunca formato ISO completo com Z · mantém YYYY-MM-DD inalterado … |
| `src/data/__tests__/carnegieWarmth.test.ts` | 37 | Warmth: Data Integrity · has 6 pattern categories · every category has warm patterns · every category has cold patterns … |
| `src/data/__tests__/carnegieIdentityOwnership.test.ts` | 36 | IDENTITY_LABELS — Data Integrity · has 15+ labels · each label has required fields · has unique IDs … |
| `src/data/__tests__/carnegieInterestTalkRatio.test.ts` | 35 | Genuine Interest: Data Integrity · has at least 5 interest indicators · indicators have positive weights · patterns cover personal, follow_up, exploratory questions … |
| `src/data/__tests__/carnegieEncouragementFaceSaving.test.ts` | 34 | ENCOURAGEMENT_TEMPLATES — Data Integrity · has 7+ templates · each template has required fields · has unique IDs … |
| `src/data/__tests__/metaprogramTemplates.test.ts` | 30 | Metaprogram Templates · has at least 5 templates · all templates have unique IDs · all templates have valid category … |
| `src/components/interactions/insights/__tests__/SentimentDistributionChart.a11y.test.tsx` | 29 | SentimentDistributionChart — acessibilidade da legenda · renderiza um botão acessível por bucket clicável com aria-label e aria-pressed · destaca o bucket ativo com aria-pressed=true e sufixo (selecionado) no aria-label · Enter dispara onSelectBucket no item focado … |
| `scripts/lib/supabase-mgmt.test.mjs` | 28 | config: padrões seguros e ref canônico igual ao do AGENTS.md · config: ref, URL e números vêm do ambiente e são validados · config: token com caractere inválido é recusado sem aparecer na mensagem · args: o padrão é simulação; --apply é explícito … |
| `src/data/__tests__/triggerConflictsSynergiesMatrix.test.ts` | 25 | Trigger Conflicts Matrix: Data · has at least 40 conflicts · all conflicts have valid severity levels · all conflicts have reason and resolution … |
| `src/test/telemetry/telemetry-charts.test.ts` | 25 | computeTimelineData · should return empty for empty rows · should bucket by 10-minute intervals for 1h filter · should bucket by 10-minute intervals for 6h filter … |
| `src/data/__tests__/triggersAdvancedExtended.test.ts` | 24 | Advanced Mental Triggers · has at least 5 triggers · all triggers have matching id and key · all triggers have required fields … |
| `scripts/check-edge-cors.test.mjs` | 23 | check-edge-cors: passes when no wildcard is present · check-edge-cors: fails when wildcard is present and function is NOT allowlisted · check-edge-cors: passes when wildcard function IS in the allowlist · check-edge-cors: comments and blank lines in allowlist are ignored … |
| `scripts/apply-falhas.test.mjs` | 22 | 429 (com Retry-After) e 500/502/503 são repetidos com backoff e a execução termina bem · 5xx persistente: desiste após as retentativas, aborta, não envia o resto e sai 1 · timeout: requisição pendurada é abortada e repetida; a instrução acaba aplicada · timeout permanente: aborta com mensagem de timeout e sai 1 … |
| `scripts/sql-raiz.test.mjs` | 21 | SQL da raiz: verificações estáticas · nenhum UUID real gravado e cabeçalho com propósito, uso e risco · scripts que alteram o banco: transação, ensaio por padrão e sem CASCADE · recreate_data_health_view.sql traz a MESMA definição da migration vigente … |
| `src/__tests__/architecture-compliance.test.ts` | 21 | File Size Limits · no component file exceeds ${MAX_COMPONENT_LINES} lines · refactored CommunicationTrainingMode is under 250 lines · training subcomponents exist … |
| `src/data/__tests__/nlpAdvancedCopywritingAdvanced.test.ts` | 21 | NLP Advanced - Emotional States · has at least 10 emotional states · keywords and info keys match · all states have at least 5 keywords … |
| `src/types/__tests__/rfm.test.ts` | 21 | determineRFMSegment · classifica R=5 F=5 M=5 como champions · classifica R=4 F=4 M=4 como champions (limiar) · classifica alta frequência+monetário mas recência média como loyal_customers … |
| `src/data/__tests__/carnegieExtended.test.ts` | 20 | Carnegie Yes-Ladder Templates · has at least 3 templates · all templates have unique IDs · all templates have at least 2 steps … |
| `scripts/hardening/hardening.test.mjs` | 19 | hardening: checks de catálogo · banco limpo: todos passam, com cabeçalho e linha final padronizados · objetos legítimos que a versão antiga acusava não geram achado · somente leitura: todos rodam com default_transaction_read_only=on … |
| `scripts/inventario/gerar-banco.test.mjs` | 19 | extrairInventario: aceita psql, objeto, linhas da API, resposta e envelope do MCP · extrairInventario: entradas degeneradas dão erro claro (nunca TypeError) · contarUsoNoCodigo: conta src e edges, ignora testes, storage.from e rpc; nomes hostis não poluem · versoesDoRepo, edgesNoRepo e edgesExternasCatalogadas leem só o que vale … |
| `src/lib/__tests__/roleAssignment.test.ts` | 19 | isAppRole · aceita os cinco papeis do enum app_role · rejeita papel fora do enum · hasPermissionsMapped … |
| `scripts/inventario/mudou-conteudo.test.mjs` | 18 | PADRAO cobre os cinco arquivos do inventário · carimbos de data e telemetria rolante não contam como mudança · texto dos alertas: porcentagem e horas rolam sem contar; entrar/sair da lista conta · mudança de verdade conta … |
| `src/components/interactions/__tests__/SortChips.test.tsx` | 18 | SortChips · renderiza os 4 chips · chip ativo recebe aria-pressed=true · click em chip inativo chama onChange … |
| `src/hooks/__tests__/canonical-communication-contracts.test.tsx` | 18 | Contratos canônicos da comunicação WhatsApp · consulta mensagens e transcrições reais e normaliza os aliases virtuais · rejeita metadados de duração incompatíveis · não converte erro da consulta de transcrições em lista vazia … |
| `src/hooks/__tests__/contact-cache-concurrency.test.tsx` | 17 | Confirmações de contato não regridem com respostas concorrentes · descarta refetch anterior à gravação da ficha · descarta SELECT paginado anterior à gravação da lista · falha de A preserva confirmação posterior de B e o contrato paginado … |
| `src/hooks/__tests__/contact-cache-revalidation.test.tsx` | 17 | Carga inicial e paginação reais do hook durante gravações · recarrega a primeira página completa quando a criação cancela a leitura inicial · mantém a leitura inicial enquanto o INSERT está pendente e quando ele falha · não duplica um contato já incluído na primeira leitura que terminou durante o INSERT … |
| `src/lib/__tests__/sanitize.test.ts` | 17 | Sanitize Lib · sanitizeHtml · should keep allowed tags · should remove dangerous tags and attributes … |
| `scripts/check-bundle-size.test.mjs` | 16 | aprova build dentro do budget e marca o entry do index.html · falha quando o entry passa de 350 KB gzip · falha quando um chunk comum passa de 500 KB gzip · entry com nome fora do padrão (app-*.js) recebe o limite de entry … |
| `src/__tests__/performance-and-a11y.test.ts` | 16 | Performance Optimizations · CompanyListItem uses React.memo · CompaniesTableView uses React.memo · ContactsTableView uses React.memo … |
| `src/__tests__/integration/auth-flow.test.ts` | 16 | should handle parallel refresh session requests (race condition simulation) · Auth Flow Integration · Session Management · should retrieve existing session on init … |
| `src/hooks/__tests__/canonical-conversation-contracts.test.tsx` | 16 | Análises de conversa usam JSON validado, sem cast de compatibilidade · normaliza os campos JSON e preserva nulabilidade e sugestões reais · preserva a ausência legítima de análise · propaga JSON incompatível: %j … |
| `src/hooks/__tests__/canonical-side-effect-contracts.test.tsx` | 16 | Operações secundárias não geram sucesso quando falham · a leitura de destinatários existentes não é tratada como lista vazia · expõe erro da consulta de campanhas · a inscrição não anuncia sucesso se a contagem falhar … |
| `scripts/gen-supabase-types.test.mjs` | 15 | jsonSchemaToTs: mapeia os tipos do PostgREST para TypeScript válido · chaveTs: identificador fica cru, o resto vai entre aspas · gerarTypes: tabelas x views, nulabilidade, ordem estável e sem carimbo de data · gerarTypes: OpenAPI vazio ou torto é recusado (não grava types vazio) … |
| `scripts/ci/branch-podaveis.test.mjs` | 15 | branch patch-equivalente, antiga e sem PR é elegível e vira comando · branch com PR aberta fica fora do comando · branch recente (7 dias ou menos) fica fora; o corte é estritamente maior que 7 dias · epoch ausente, zero ou inválido não prova idade: fica fora … |
| `src/__tests__/integration/resilience-patterns.test.ts` | 15 | Circuit Breaker Pattern · should open after threshold failures · Rate Limiter Pattern · should allow requests within limit … |
| `src/data/__tests__/triggerBundles.test.ts` | 15 | Trigger Bundles Integrity · has at least 5 bundles · all bundles have unique IDs · has name in PT and EN … |
| `src/hooks/useSocialInsights.test.tsx` | 15 | Histórico social sem dados fabricados · retorna vazio somente quando a consulta confirma ausência: %j · propaga uma rejeição de transporte sem gerar registros · não repete automaticamente consultas rejeitadas, mesmo com retry global … |
| `scripts/apply-cli.test.mjs` | 14 | ${script}: importar não executa nada e expõe main/definicao · ${script}: cabeçalho documenta que o padrão é simulação e que aplicar exige --apply · ${script}: --help sai 0, explica as flags e não chama a API (mesmo sem token) · ${script}: sem flags (e com --dry-run) só simula — nenhuma requisição, mesmo com token no ambiente … |
| `scripts/audit-ausentes.test.mjs` | 14 | chamadasFrom: aspas, crase,  · chamadasFrom: o exemplo é a linha de CADA ocorrência, inclusive a última linha sem \\n · tabelasDoTypes e funcoesDoTypes leem o formato do supabase gen types · chamadasRpc pega rpc com e sem argumentos … |
| `scripts/ci/actions-kpi.test.mjs` | 14 | E79: agregar conta runs, cancelados, falhas e minutos por workflow · E79: a janela corta run velho — o KPI e dos ultimos N dias, nao de sempre · E79: duracao vem dos carimbos e nunca e negativa · E79: os 5 jobs mais lentos saem ordenados e limitados … |
| `scripts/lib/sql-split.test.mjs` | 14 | divisor: ${nome} · divisor: ${CASOS.length} casos declarados (dezenas, por exigência) · divisor: informa a linha (base 1) em que cada instrução começa · divisor: ${nome} sem fechamento lança ErroSqlMalformado com a linha … |
| `src/components/interactions/__tests__/ActiveFiltersBar.onAfterRemove.test.tsx` | 14 | ActiveFiltersBar — contrato onAfterRemove · chip de busca: chama onAfterRemove uma única vez e setFilter( · chip de direção (inbound): uma única chamada e seta direcao=all · chip de pessoa: uma única chamada e limpa contact … |
| `src/contexts/NavigationStackContext.test.tsx` | 14 | Histórico e retorno de navegação · percorre os índices reais do navegador sem apagar o avançar · usa uma visita anterior filtrada da seção, mesmo após visitar outra rota · prioriza o retorno contextual quando a seção é apenas um fallback … |
| `src/data/__tests__/discAdvancedData.test.ts` | 14 | DISC Advanced Data Integrity · has exactly 4 DISC profiles · includes D, I, S, C · Profile %s … |
| `src/hooks/__tests__/company-contracts.test.ts` | 14 | contrato canônico de empresas · produz aliases reais exclusivamente de colunas e relações canônicas · escolhe relação primária deterministicamente sem depender da ordem do payload · usa nome fantasia/razão social e mantém fallback de localização do nome … |
| `tests/rls/prepare-sql.node-test.mjs` | 14 | preserva BEGIN/COMMIT em funções e comentários, removendo só o wrapper externo · preserva blocos DO, dollar tags Unicode e transações dentro de strings · preserva comentários aninhados e aspas duplicadas/escapadas · remove wrapper BEGIN/ROLLBACK da fixture mesmo na mesma linha … |
| `scripts/lib/seguranca-processo.test.mjs` | 13 | resolverExecutavel devolve caminho absoluto existente igual ao do shell · resolverExecutavel lanca para comando inexistente · estaDentro aceita a raiz e subpastas · estaDentro recusa  … |
| `scripts/rls-matrix/check-rls-baseline.test.mjs` | 13 | aprova quando o que cada perfil enxerga bate com o baseline · reprova: ${nome} · exposição menor: aprova, avisa e --update fixa o novo patamar · --update com piora grava, mas deixa a regressão aceita escrita no stderr … |
| `src/data/__tests__/sleightOfMouth.test.ts` | 13 | Sleight of Mouth Patterns · has exactly 14 patterns (Robert Dilts) · all patterns have matching id and key · all patterns have required string fields … |
| `src/data/__tests__/vakTemplates.test.ts` | 13 | VAK Adapted Templates · has at least 5 templates · all templates have unique IDs · all templates have base title … |
| `src/hooks/__tests__/canonical-next-action-contract.test.tsx` | 13 | Contrato real da próxima melhor ação · confirma pelo ID persistido enviado pelo produtor e mantém o escopo do contato · envia contactId e recupera o ID persistido quando o produtor não retorna ID · rejeita resposta incompatível sem anunciar sucesso: %j … |
| `src/lib/__tests__/carnegieMessageReview.test.ts` | 13 | revisarMensagemCarnegie · devolve null para texto vazio ou só com espaços · não inventa nota quando o texto não traz nenhum sinal · aponta ordens diretas e conta como ponto de atenção … |
| `src/test/providers.test.ts` | 13 | Provider Hierarchy Guard · validateProviderOrder · deve aceitar a ordem correta sem violações · deve detectar AuthProvider sem BrowserRouter acima … |
| `scripts/check-backend-linter-baseline.test.mjs` | 12 | o teto do script é o documentado em linter-baseline.md · no teto: aprova e mostra a comparação · acima do teto: exit 1 com a contagem no stderr · abaixo do teto: aprova e avisa para apertar o ratchet … |
| `scripts/lint-providers.test.mjs` | 12 | o repositório atual passa e o lint realmente encontra os providers · as dependências do lint são as mesmas de src/lib/providerGuard.ts · aprova a ordem certa num App.tsx só · reprova ${nome} … |
| `scripts/ci/check-claude-md-integrity.test.mjs` | 12 | passa sem alteração nenhuma no working tree · reprova quando AGENTS.md é apagado · reprova quando uma seção obrigatória desaparece (título alterado) · reprova quando o conjunto (AGENTS.md + docs/agentes/) encolhe mais de 30% … |
| `src/data/__tests__/triggerTemplatesVAK.test.ts` | 12 | VAK Trigger Templates · has at least 20 templates · all templates have unique IDs · all templates have required fields … |
| `src/hooks/__tests__/contact-contracts.test.ts` | 12 | contrato canônico de contatos · normaliza arrays legados e preserva a versão real · rejeita JSON de array inválido: %s · respeita arrays canônicos vazios em vez de ressuscitar aliases legados … |
| `src/lib/externalData.contract.test.ts` | 12 | escrita versionada distingue conflito de versão de transação abortada · permite nova tentativa com a mesma versão após %s · preserva metadados do CONCURRENT_EDIT estruturado · preserva o marcador legado sem JSON … |
| `src/lib/__tests__/validation-schemas.test.ts` | 12 | Validation Schemas Excellence · emailSchema · should validate a valid email · should normalize email to lowercase and trimmed … |
| `scripts/ci/check-test-inventory.test.mjs` | 11 | padroesDeWorkflow le os blocos run (dobrado, literal e de uma linha) · caminho citado fora de run (nome da etapa, comentario) nao cobre a suite · casaPadrao trata * como um nivel de diretorio e ** como qualquer nivel · suite Node fora dos blocos run vira orfa — e a allowlist a absolve … |
| `scripts/hardening/hardening-cluster.test.mjs` | 11 | hardening: veredito coerente com a configuração do servidor de teste · check-replication-config acusa exatamente as configurações divergentes · check-client-tls acusa servidor com ssl desligado · hardening: cluster descartável com TLS e replicação lógica … |
| `scripts/inventario/gerar-edge-tabela.test.mjs` | 11 | constantesDeString pega const de modulo e ignora const dentro de funcao · constantesDeString nao deixa chave desbalanceada dentro de string cegar os consts seguintes · constantesDeString ignora chave dentro de template literal de uma linha · extrairChamadas separa tabela de bucket e aceita a URL direta … |
| `scripts/migration/sql/sql.test.mjs` | 11 | create-reset-log: cria tudo, é idempotente (2ª e 3ª execução sem erro) e preserva os dados · create-reset-log: UNIQUE(user_id), CHECK de status, updated_at automático e RLS (só admin lê; authenticated não escreve) · create-reset-log: é atômico — sem has_role() falha e NÃO deixa tabela pela metade · mark-must-reset: marca só quem tem login por senha, preserva metadados e não aborta com valor estranho (antes:  … |
| `src/components/interactions/__tests__/SentimentQuickFilter.a11y.test.tsx` | 11 | SentimentQuickFilter — acessibilidade · expõe role=radiogroup com aria-label descritivo · todos os chips têm role=radio com aria-checked refletindo o estado · roving tabindex: somente o item ativo é alcançável por Tab … |
| `src/hooks/useMFAGuard.test.tsx` | 11 | MFA administrativo · permite configurar MFA em AAL1 e preserva a URL sem mostrar a administração · não monta a tela protegida durante o carregamento do guard ou da confirmação MFA · aguarda a consulta de papel antes de mostrar qualquer conteúdo protegido … |
| `src/hooks/__tests__/canonical-hook-contracts.test.tsx` | 11 | Contratos canônicos dos históricos de interação · preserva registros legados com tipo, canal e data nulos sem fabricar uma data · produz os aliases de domínio a partir dos campos reais da RPC · normaliza o retorno distinto da RPC de histórico unificado … |
| `src/hooks/__tests__/canonical-mutation-contracts.test.tsx` | 11 | Mesclagem valida overrides antes de qualquer operação · rejeita valores incompatíveis com o campo canônico · não permite sobrescrever a coluna gerada full_name · envia overrides validados à transação de mesclagem e auditoria … |
| `tests/integration/web-push-sender.test.ts` | 11 | allowlist de endpoint (anti-SSRF) · aceita %s · bloqueia %s · readVapidConfig … |
| `scripts/maintenance/tests/transaction.mjs` | 10 | gate baseline falha sem criar branch ou tocar clone sujo · patch isolado é validado, commitado localmente e não duplicado · gate após patch falha sem commit nem branch restante · formatter fora do escopo é descartado antes de commit … |
| `src/components/interactions/__tests__/IncrementalLoadStickyBar.test.tsx` | 10 | IncrementalLoadStickyBar · não renderiza quando total=0 · exibe estado de  · usa singular  … |
| `src/components/navigation/__tests__/ScrollToTopButton.test.tsx` | 10 | ScrollToTopButton · não fica visível com scrollY=0 (default threshold) · fica visível quando scrollY > 400 (default) · respeita threshold customizado … |
| `src/components/security/TwoFactorSetup.test.tsx` | 10 | Configuração e confirmação MFA · solicita código para um fator já cadastrado em uma sessão AAL1 · oferece confirmação explícita na recuperação mesmo que o SDK ainda retorne AAL2 · retoma configuração interrompida e não libera acesso com código inválido … |
| `src/data/__tests__/emotionalIntelligence.test.ts` | 10 | EQ Pillar Data Integrity · has exactly 5 Goleman pillars · includes all 5 pillars · Pillar %s … |
| `src/data/__tests__/triggerConflicts.test.ts` | 10 | Trigger Conflicts Matrix · has at least 30 conflicts · all conflicts have two triggers · trigger1 !== trigger2 (no self-conflicts) … |
| `src/hooks/__tests__/canonical-delivery-retry-contract.test.tsx` | 10 | Conclusão parcial não duplica a interação na mesma instância · repete apenas o update quando a interação já foi gravada · compartilha a gravação entre duas tentativas simultâneas · permite repetir a interação quando seu insert falhou … |
| `src/hooks/__tests__/confianca-metaprogramas.test.ts` | 10 | direcaoEConfianca · sem sinal nenhum, confiança é zero · empate técnico fica equilibrado em 50 · margem decidida aponta a direção e eleva a confiança … |
| `src/hooks/__tests__/contact-detail-partial-failures.test.tsx` | 10 | Política real de repetição da ficha · não repete erro permanente na carga inicial sem cache · limita a três retries mesmo quando a falha transitória persiste · Mensagens seguras da ficha … |
| `src/lib/externalData.read-audit.test.ts` | 10 | Auditoria de leitura · classifica leitura de %s como visualização de contato · não inventa criação de interação ao ler %s · registra o ID filtrado mesmo quando a seleção não retorna esse campo … |
| `src/pages/mapa/geocoding.test.ts` | 10 | geocode · valida coordenadas e reutiliza apenas resultados válidos do cache · retorna null somente para busca válida sem resultados · propaga falhas HTTP e permite tentar novamente sem cache de falha … |
| `scripts/ci/render-workflow-docs.test.mjs` | 9 | extrairDocs le os quatro campos e para na primeira linha que nao e comentario · extrairNaoEBug preserva aspas no meio da descricao · desencapar tira so o par de aspas que envolve todo o texto · nomeDe usa o name: do YAML e cai no nome do arquivo quando nao tem … |
| `scripts/docs/verificar-citacoes.test.mjs` | 9 | extrairCitacoes pega caminho, linha e range, e nao casa texto solto · extrairCitacoes nao repete a mesma citacao dentro do mesmo documento · listarDocs pega os .md da raiz e de docs/, e ignora gerado e dependencia · conferir separa arquivo inexistente de linha fora do arquivo … |
| `src/components/interactions/__tests__/PaginationBar.test.tsx` | 9 | PaginationBar · não renderiza quando total <= perPage · não renderiza quando total === 0 · botão Anterior desabilitado em page=1 … |
| `src/lib/externalData.circuit-isolation.test.ts` | 9 | Isolamento dos circuitos canônico e externo · não abre o circuito de atividades por erro HTTP %i · compartilha a pausa entre tabelas e RPCs externas por falha de %s · preserva a pausa de HTTP %i nos circuitos externo e canônico … |
| `src/lib/__tests__/behavioralAlertStats.test.ts` | 9 | computeAlertStats · retorna zeros quando não há alertas · separa reais de simulações e conta críticos · calcula MTTA médio apenas de alertas reais reconhecidos … |
| `src/lib/insights/__tests__/extractExcerpts.test.ts` | 9 | extractExcerpts · retorna excerto único quando há 1 keyword e 1 match · ordena por relevância (densidade desc) respeitando maxPerSource · escapa caracteres regex em keywords … |
| `tests/e2e/hubs-smoke.spec.ts` | 9 | Hubs — smoke E2E (Rodada 50/10) · /abm redireciona anônimo para /auth · /abm/campanhas redireciona anônimo para /auth · /intent redireciona anônimo para /auth … |
| `tests/e2e/navigation.spec.ts` | 9 | Autenticação e Navegação E2E · deve redirecionar usuário não autenticado para /auth · deve alternar entre Login e Cadastro no formulário · deve validar campos obrigatórios no login … |
| `scripts/check-publish-gates.test.mjs` | 8 | RLS falha com ${scenario}, preservando baseline${update ?  · RLS aprova coleta completa e distingue negação SQL de JWT inválido · RLS continua detectando aumento de exposição · RLS permite atualizar baseline somente após coleta completa … |
| `scripts/check-supabase-project-ref.test.mjs` | 8 | AGENTS.md declara o projeto Supabase canônico · supabase/config.toml aponta para o projeto canônico · supabase/.temp/linked-project.json aponta para o projeto canônico · a CSP do vite.config.ts permite conexão ao projeto canônico … |
| `scripts/ci/sla-code-scanning.test.mjs` | 8 | nível vem de security_severity_level; sem ele, error conta como alto (o defeito de rule.severity) · high vence com 15 dias; medium só depois de 30 · relatório: sem violação diz isso; com violação lista em bloco · CLI: lê o JSON do stdin, sai 1 com violação e 0 sem … |
| `scripts/inventario/banco.test.mjs` | 8 | banco.sql roda limpo em transação só-leitura e imprime UMA linha com UM JSON · resumo: contagens batem com a fixture · tabelas: RLS, policies, triggers, linhas, partição e citação no banco · nomes com caractere de regex/Markdown: consulta não cai e a citação é exata … |
| `scripts/inventario/gerar-repo.test.mjs` | 8 | edges.json: linhas, segredos lidos e quem chama cada função · tabelas-uso.json: conta .from() em src e edges e confere o types.ts · nomes hostis no stdin (começando com -, com regex, __proto__) não quebram nem viram opção do rg · repositório mínimo (sem src, e2e, migrations, workflows, types.ts) funciona … |
| `scripts/inventario/gerar-rotas.test.mjs` | 8 | extrairChamadas separa tabela, bucket, rpc e edge (inclusive por constante e por URL) · extrairChamadas nao resolve const declarada dentro de funcao · resolverImport: null para externo, caminho para alias @/ e undefined para local quebrado · lerUrls le path, componente, arquivo, acesso, parametro, skeleton e redirect … |
| `scripts/maintenance/tests/configuration.mjs` | 8 | CLI e config desconhecidas falham fechadas · tsconfig vazio impede doctor saudável · TypeScript 7 sem API usa CLI isolada e valida o patch · TypeScript 7 com CLI sem arquivos bloqueia doctor … |
| `scripts/maintenance/tests/locking.mjs` | 8 | trava atômica impede segundo executor · timeout mata grupo de subprocessos e distingue resultado · trava de pid morto é recuperada, trava recente sem dono fica bloqueante · namespace de rede impede acesso externo de todos os filhos … |
| `src/components/ficha-360/ProximaAcaoCTA.contract.test.tsx` | 8 | Registro da próxima ação com contrato de contato · registra %s no contato, sem inventar empresa · não anuncia sucesso sem a confirmação correta: %j · preserva o resumo quando o banco rejeita a gravação … |
| `src/components/interactions/__tests__/DateRangePopover.shortcut.test.tsx` | 8 | DateRangePopover · atalho Alt+D · chama applyDateRange(undefined, undefined) quando há datas aplicadas · aceita Alt+D em maiúsculas (case-insensitive) · é no-op silencioso quando não há datas aplicadas … |
| `src/components/interactions/__tests__/DensityChips.test.tsx` | 8 | DensityChips · renderiza dois botões com aria-pressed correto (comfortable ativo) · renderiza com aria-pressed refletindo compact quando ativo · expõe role= … |
| `src/components/triggers/advanced-triggers/__tests__/BundlesTab.test.tsx` | 8 | BundlesTab · abre no roteiro de objeção de preço, com abertura, passos e fechamento · não mostra a taxa de sucesso fixa do arquivo de dados · oferece as 8 situações e troca o roteiro ao escolher outra … |
| `src/data/__tests__/carnegieAppreciation.test.ts` | 8 | Carnegie Appreciation Templates · has at least 3 appreciation types · Type %s · has name … |
| `src/data/__tests__/copywritingData.test.ts` | 8 | FAB Templates Integrity · has at least 3 FAB templates · all templates have unique IDs · all templates have required fields … |
| `src/data/__tests__/neuromarketingData.test.ts` | 8 | Neuromarketing Data Integrity · has exactly 3 brain systems (triune model) · includes reptilian, limbic, and neocortex · all systems have required fields … |
| `src/hooks/__tests__/canonical-related-recovery-contracts.test.tsx` | 8 | Uploads privados compensam falhas posteriores · remove o mesmo objeto após falhar no %s · preserva a falha original e alerta quando a remoção também falha · Relações não enviam a carteira inteira na URL … |
| `src/lib/externalData.delete-audit.test.ts` | 8 | Auditoria única após exclusão confirmada · grava somente um evento para %s com contexto do dono · preserva o sucesso se a auditoria lançar uma exceção · não registra exclusão se a mutação falhar … |
| `src/lib/__tests__/triggerPlaybook.test.ts` | 8 | montarRoteiro · todo cenário tem roteiro, com um passo por gatilho do pacote · todo gatilho dos roteiros tem nome em português no catálogo · sem perfil escolhido não traz modelo de frase por perfil … |
| `src/pages/mapa/relationshipScores.contract.test.ts` | 8 | Score real de empresa no mapa · usa a medição mais recente e mantém score zero e ausência de score · não consulta a tabela global quando não há empresas autorizadas · pagina o histórico sem truncar empresas ainda não encontradas … |
| `scripts/apply-e2e.test.mjs` | 7 | ${script}: banco vazio → aplica tudo; reexecução é idempotente (mesmo banco, saída 0, zero falha) · o SQL impresso por --sql, executado pelo psql (divisor independente), dá o mesmo banco que --apply · fix-enums → retry-failed → apply-missing → apply-remaining reconstroem o banco; cada passo é idempotente · instrução inválida de verdade num lote: as vizinhas entram, a culpada é nomeada, saída 1 — e o resultado é estável … |
| `scripts/ci/workflow-invariants.test.mjs` | 7 | passa quando test:coverage aparece uma vez e nenhum job usa always() · R3: reprova test:coverage duplicado em dois passos · R5: reprova always() no nível do job de required check · R5: reprova quando o required check desaparece do ci.yml … |
| `scripts/maintenance/tests/dependencies.mjs` | 7 | dependências divergentes da referência bloqueiam reutilização · dependência vendor por link idêntico é reutilizada sem instalar pacotes · vendor sujo e referência com vendor diferente bloqueiam antes dos gates · link instalado para outro vendor divergente e file externo são recusados … |
| `src/components/campaigns/__tests__/CampaignDetailDrawer.test.tsx` | 7 | CampaignDetailDrawer · returns null when no campaign provided · renders campaign name, subject and computed metric percentages · shows the send CTA only for drafts and triggers mutation on click … |
| `src/components/interactions/__tests__/InfiniteScrollSentinel.density.test.tsx` | 7 | InfiniteScrollSentinel — densidade ambiente · usa  · lê  · DensityProvider tem prioridade sobre localStorage … |
| `src/data/__tests__/cognitiveBiasesData.test.ts` | 7 | Cognitive Biases Data Integrity · has at least 4 bias categories · all categories have required fields · all category colors are valid tailwind classes … |
| `src/hooks/__tests__/matriz-conflitos-gatilhos.test.ts` | 7 | união das matrizes de gatilhos · não perde nenhum conflito que já estava em uso · não perde nenhuma sinergia que já estava em uso · amplia de fato a cobertura de conflitos … |
| `src/hooks/__tests__/relacoes-estendidas-gatilhos.test.ts` | 7 | relações dos gatilhos estendidos · todo conflito estendido passa a ser detectado · toda sinergia estendida passa a ser detectada · não perde nem altera nenhuma relação que já estava em uso … |
| `src/hooks/__tests__/talk-ratio-medicao.test.ts` | 7 | analyzeTalkRatio · não devolve proporção de fala: ela exige os dois lados da conversa · separa pergunta aberta de fechada pelos padrões do módulo · conta escuta ativa e reconhecimento a partir do texto … |
| `src/lib/errorReporting.unload.test.ts` | 7 | Envio final autenticado de erros · inicia o envio em segundo plano sem consultar a sessão nem repetir no fechamento · descarta erros anteriores ao login sem descartar os capturados após autenticar · descarta lote anônimo se o login acontece durante a consulta da sessão … |
| `src/lib/__tests__/routePermissions.test.ts` | 7 | canAccessRoute · libera rota fora do mapa de permissoes · libera quando o usuario nao tem papel (fail-open) · libera enquanto o RBAC carrega … |
| `src/lib/insights/__tests__/pickTopPassages.test.ts` | 7 | pickTopPassages · retorna até MAX_TOTAL_CAP itens mesmo com totalCap maior · é determinística: mesma entrada → mesma saída · aplica round-robin entre fontes (distribui antes de aprofundar) … |
| `scripts/maintenance/tests/hooks.mjs` | 6 | hook ${name} bloqueante impede commit validado · hooks versionados rodam offline sem .env/segredo e commit inclui escopo obrigatório · hook que altera e adiciona o patch é rejeitado depois do commit isolado · hook que remove o escopo da mensagem não produz commit validado … |
| `src/components/interactions/__tests__/InfiniteScrollSentinel.test.tsx` | 6 | InfiniteScrollSentinel · não renderiza nada quando total=0 · exibe progressbar com aria-values e contador no estado hasMore · exibe estado final sem barra quando !hasMore … |
| `src/components/pipeline/CreateDealWidget.contract.test.tsx` | 6 | Criação de oportunidade com o contrato da RPC · envia título e valor %s com os nomes canônicos · mantém os campos e não invalida dados quando o banco recusa a chamada · não anuncia criação sem identificador confirmado: %j … |
| `src/components/sequences/SequencePausedEmails.test.tsx` | 6 | Retomada de email pausado · exige confirmação e envia a pausa e o progresso exibidos sem afirmar envio · mantém a pausa e a confirmação disponíveis após erro de persistência · expõe a falha da consulta e permite nova tentativa … |
| `src/hooks/useCSATSurveys.contract.test.tsx` | 6 | Contrato de pesquisas CSAT · consulta apenas CSAT do dono e contato, mantendo a escala de satisfação · cria uma pesquisa pendente sem inventar nota ou entrega · rejeita a nota inválida %s antes de gravar … |
| `src/hooks/useContacts.test.tsx` | 6 | useContacts CRUD & Pagination · should fetch first page of contacts (50 per page) · should fetch every page when the consumer requires the full dataset · should stop the full-dataset loading state when a later page fails … |
| `src/hooks/useImportantDates.test.tsx` | 6 | datas importantes respeitam o dia local · aniversário em %s ocorre em %s (%i dias) · mantém eventos recorrentes de hoje e distingue ontem e amanhã · preserva o dia do aniversário de um familiar … |
| `src/hooks/usePipeline.contract.test.tsx` | 6 | Contrato de negócios individuais do Pipeline · consulta registros do dono e preserva o fechamento e os nomes relacionados · preserva status vazio e exclui negócios perdidos e arquivados depois da consulta · carrega todas as páginas quando há mais de mil negócios … |
| `src/hooks/useProactiveIntelligence.test.tsx` | 6 | aniversários na Inteligência Proativa · não recomenda aniversário fora da janela: %s · prepara amanhã na virada do ano · reflete a data editada sem remontar a ficha … |
| `src/hooks/__tests__/canonical-rfm-day-contracts.test.tsx` | 6 | RFM conserva recomendações do produtor e metadados existentes · normaliza IDs locais estáveis e marca o impacto ausente sem inventar uma estimativa · Meu Dia distingue falha, carregamento e ausência de login · encerra carregamento ao falhar e recupera os dados após nova tentativa … |
| `src/hooks/__tests__/company-composite.contract.test.ts` | 6 | dados compostos da empresa no contrato canônico · converte os três formatos reais do formulário sem perder dados · identifica WhatsApp sem assumir um tipo de aparelho e mantém o enum canônico explícito · deduplica os aliases básicos sem substituir os metadados compostos … |
| `src/hooks/__tests__/contact-detail-external-retry.test.tsx` | 6 | Consulta do contato disponível apenas na fonte externa · limpa somente a ficha cuja ausência foi confirmada nas duas fontes; cache=%s · limita retries de indisponibilidade sem declarar ausência; cache=%s · Recuperação da ficha com o cliente externo real e transporte simulado … |
| `src/hooks/__tests__/create-task-contract.test.ts` | 6 | montarArgsCriarTarefa · usa apenas nomes de argumento que a RPC aceita · sempre envia os dois argumentos sem valor padrão · descarta campos do Task que a RPC não recebe … |
| `src/lib/pushNotifications.sw.test.ts` | 6 | A-007: service worker de push unificado · vite.config importa sw-push.js no SW gerado (sem precache duplicado) · main.tsx nunca cancela inscrição nem desregistra service worker · em produção usa serviceWorker.ready e NÃO registra /sw-push.js … |
| `src/lib/__tests__/logger.test.ts` | 6 | Logger Utility · deve gerar IDs de requisição únicos · deve formatar logs corretamente em desenvolvimento · deve persistir erros no banco de dados … |
| `src/lib/__tests__/providerGuard.test.ts` | 6 | Provider Guard & Hierarchy · deve validar corretamente uma ordem de providers válida · deve detectar violação quando AuthProvider vem antes de BrowserRouter · deve detectar violação quando AuthProvider vem antes de QueryClientProvider … |
| `src/lib/__tests__/rpcChurn.test.ts` | 6 | parseChurnWindow · aceita janelas válidas · cai no default para valores inválidos, nulos ou maliciosos · churnToCsv … |
| `src/pages/MapaEmpresas.batch.test.tsx` | 6 | geolocalização do mapa · limita o trabalho automático, conserva as empresas mapeadas e exige continuação manual · cancela a requisição em andamento ao sair do mapa · atualiza inclusões, exclusões e coordenadas no refetch sem iniciar outro lote … |
| `e2e/gap-modules-smoke.spec.ts` | 5 | Gap modules smoke (Rodada 28/10) · carrega ${label} (${path}) sem runtime error · Ask CRM: abre chat flutuante e envia pergunta · Landing page pública (Rodada 28/10) … |
| `scripts/apply-ddl-real.test.mjs` | 5 | apply-all.js = aplicação de referência (mesmos objetos, mesmas falhas) e reexecução idempotente · chunk-apply.js chega ao mesmo banco que o apply-all.js com muito menos requisições · o SQL de  · apply-migrations.js: arquivo com instrução inválida não entra pela metade; saída coerente; estável ao repetir … |
| `scripts/check-rls-profiles.test.mjs` | 5 | RLS rejeita JWT ${jwt ?  · RLS exige também os perfis declarados nos metadados · RLS não ignora perfil desconhecido no baseline · RLS permite coleta anônima quando somente esse perfil é exigido … |
| `scripts/maintenance/tests/formatting.mjs` | 5 | scan Prettier rejeita ${name} · generated e types.ts ficam fora de candidatos e alterações laterais são rejeitadas · formatter não pode mudar permissões ou remover arquivos rastreados · ESLint não aceita diretivas inline para regras fora da allowlist … |
| `scripts/migration/ddl/ddl.test.mjs` | 5 | 99_apply_all.sql: inclui 00–11 uma vez cada, na ordem que respeita as dependências, com \\ir; 12 fica de fora · dependências que justificam a ordem existem de fato no dump · fixture supabase-stubs.sql é idempotente · dump COMO ESTÁ: os únicos erros são os defeitos conhecidos do gerador e suas cascatas … |
| `src/components/auth/__tests__/RequirePermission.test.tsx` | 5 | RequirePermission · libera quando o usuário não tem papel atribuído (fail-open) · libera quando o papel tem a permissão · redireciona para a home quando o papel não tem a permissão … |
| `src/components/contact-detail/SoftDeletePanel.test.tsx` | 5 | confirmação da lixeira sem depender de realtime · fecha o diálogo e invalida somente a ficha correta após arquivamento confirmado · invalida a ficha após restauração confirmada · mantém o diálogo e não anuncia sucesso com resposta inválida: %j … |
| `src/components/interactions/__tests__/DateRangePopover.clear.integration.test.tsx` | 5 | DateRangePopover › Limpar período (integração com URL/hook) · remove  · remove apenas  · remove apenas  … |
| `src/components/interactions/__tests__/ViewModeChips.test.tsx` | 5 | ViewModeChips · renderiza 3 chips · chip ativo tem aria-pressed=true · click chama onChange com a key correta … |
| `src/components/pipeline/DealDetailDrawer.contract.test.tsx` | 5 | Fechamento de negócios e atualização dos relatórios · grava o status canônico e uma data válida ao fechar um negócio aberto · preserva o fechamento anterior de um negócio %s · não inventa data para um negócio histórico fechado sem timestamp … |
| `src/components/sequences/SequenceManualSteps.test.tsx` | 5 | Confirmação manual da sequência · só confirma após declaração explícita da execução e preserva a observação · mantém confirmação e observação disponíveis quando a gravação falha · diferencia falha da consulta de ausência de tarefas e permite nova tentativa … |
| `src/hooks/useNpsSurveys.contract.test.tsx` | 5 | Contrato de pesquisas NPS · cria um link NPS pendente sem simular entrega · usa a nota NPS zero nos indicadores e separa a consulta por tipo · não confirma resposta quando nenhuma linha é atualizada … |
| `src/hooks/useRFMAnalysis.persistence.test.tsx` | 5 | Persistência RFM do painel · envia segment_code e salva análise com histórico por uma única RPC · propaga erro da RPC sem invalidar dados como se houvesse sucesso · interrompe a análise quando a leitura de compras falha … |
| `src/hooks/__tests__/canonical-geo-contracts.test.tsx` | 5 | Geolocalização limita URLs, pagina endereços e preserva o escopo · não perde empresas depois do limite de mil registros do PostgREST · carrega três lotes e prefere o primário mesmo depois da primeira página · conta contatos além do limite padrão sem omitir vínculos na métrica … |
| `src/hooks/__tests__/dedup-relations.contract.test.ts` | 5 | Origem da deduplicação · exclui registros arquivados da consulta de %s · Relações da deduplicação · divide IDs em lotes, pagina relações e encontra o primário após a primeira página … |
| `src/lib/externalData.canonical-rpc.test.ts` | 5 | RPC RFM no banco canônico · envia um lote maior que 128 KiB em uma única chamada autenticada ao banco · propaga a recusa do banco sem confirmar persistência · não envia a chave pública como autenticação de usuário … |
| `src/lib/externalSearchFilter.contract.test.ts` | 5 | Busca composta pelo proxy externo · preserva a busca legada por frase inteira · exige todas as palavras, aceitando partes distribuídas entre nome e sobrenome · preserva nomes compostos e normaliza espaços, tabulação e quebra de linha … |
| `src/lib/pushNotifications.vapid.test.ts` | 5 | VAPID próprio · o código não carrega mais a chave de exemplo da web-push · assinatura feita com a chave de exemplo: cancela, reassina com a chave atual, grava a nova e SÓ então apaga a velha · assinatura já com a chave atual não é tocada; navegador que não informa a chave também não … |
| `src/lib/__tests__/leadScoreContract.test.ts` | 5 | persistência canônica da pontuação de leads · traduz %s e preserva leitura de %s · persiste inteiros, timestamps e factors sem aliases inexistentes · rejeita categoria e pontuação inválidas antes de gravar … |
| `src/lib/__tests__/rpcPlanDiff.test.ts` | 5 | rpcPlanDiff · lineariza a árvore com caminhos estáveis · tolera payloads inválidos · detecta regressão de Index Scan para Seq Scan … |
| `src/pages/Empresas.errors.test.tsx` | 5 | erros de consulta na carteira de empresas · permite limpar uma pesquisa que falhou sem registros em cache · distingue erro sem dados de carteira vazia e permite recuperar a consulta · preserva empresas confirmadas e avisa sobre falha na atualização … |
| `src/pages/PublicSurvey.test.tsx` | 5 | Resposta pública de pesquisa · usa os limites da pesquisa %s · envia NPS zero e só confirma após persistência · não confirma sucesso quando a RPC recusa a resposta … |
| `src/test/a11y/critical-components.test.tsx` | 5 | a11y — primitivas críticas · Button sem violações · Badge sem violações · EmptyState com ação acessível … |
| `tests/e2e/contacts.spec.ts` | 5 | Contatos CRUD & Filtros E2E · deve criar um novo contato e aparecer na lista · deve navegar para ficha 360 e validar rapport e histórico familiar · deve validar fluxo de aprovação de sugestões IA … |
| `e2e/contacts-rapport.spec.ts` | 4 | Contacts Rapport & Intelligence · CRUD de contatos com Hobbies e Interesses · Filtro por Hobbies e Interesses · Ficha 360: Edição Inline de Família e Histórico |
| `e2e/smoke.spec.ts` | 4 | SINGU Smoke Tests · jornada A: dashboard → criar contato · jornada B: pipeline → mover deal · jornada C: inbox → completar tarefa → desfazer |
| `src/components/analytics/DataHealthWidget.contract.test.tsx` | 4 | Contrato agregado da saúde dos dados · converte a escala de 0 a 10 e mostra os totais reais sem inventar tabelas · distingue pontuação ausente de zero real · distingue ausência de métricas de falha na consulta |
| `src/components/carnegie/__tests__/MessageReviewPanel.test.tsx` | 4 | MessageReviewPanel · começa vazio, com o botão desabilitado · mensagem sem problema não mostra ponto de atenção nem nota inventada · aponta os problemas e aplica a versão sugerida ao rascunho |
| `src/components/contact-detail/__tests__/LifeEventsTab.test.tsx` | 4 | LifeEventsTab · renders correctly and shows the title · displays the gap checklist tab · displays the audit trail tab |
| `src/components/crm/NextBestAction.contract.test.tsx` | 4 | Contrato canônico de conclusão de próxima ação · preserva o tipo permitido %s e informa canal e direção · registra %s como nota sem violar a constraint de tipo · não anuncia conclusão quando a gravação da interação falha |
| `src/components/sequences/SequenceEnrollDialog.contract.test.tsx` | 4 | Inscrição com busca e cache da carteira · impede fechar pelo X ou Escape durante uma inscrição pendente · repete o mesmo termo depois de falha transitória e oferece o contato recuperado · não inscreve um contato selecionado que desapareceu do cache após arquivamento |
| `src/hooks/useContactDetail.presence.test.tsx` | 4 | presença confirmada na recarga da ficha · retira a ficha anterior do cache quando ambas as fontes confirmam ausência · preserva a ficha se a consulta %s falhar e recupera no retry · mantém o contato da lixeira da fonte %s disponível para restauração |
| `src/hooks/useDailySummary.contract.test.tsx` | 4 | Contrato do dia e fuso do resumo diário · usa o dia brasileiro no instante %s · preserva a data selecionada ao consultar um dia anterior · expõe a falha da RPC sem apresentar dados de sucesso |
| `src/lib/errorReporting.auth.test.ts` | 4 | Relatórios de erros autenticados · envia o JWT e atribui os erros ao usuário da sessão · não tenta gravar com a chave pública quando não há sessão · descarta erros identificados como pertencentes a outra conta |
| `src/lib/externalQueryOrder.contract.test.ts` | 4 | Ordenação de páginas pelo proxy externo · preserva a ordenação legada e sua direção padrão · preserva o desempate por ID na ordem recebida · aceita consultas sem ordenação |
| `src/lib/externalSearchFilter.limits.test.ts` | 4 | Limites da busca composta · rejeita palavras excedentes sem descartar parte da pesquisa · aceita dez palavras e limita a expansão a cem predicados em dez colunas · preserva frases com mais palavras quando a busca composta não foi solicitada |
| `src/lib/resilientFetch.test.ts` | 4 | resilientFetch · não repete um POST que retornou erro do servidor · não repete um POST cuja resposta de rede foi perdida · mantém a tentativa adicional para consultas seguras |
| `src/pages/ContatoDetalhe.errors.test.tsx` | 4 | recuperação da ficha do contato · fecha a ficha anterior quando uma recarga confirma a ausência do contato · preserva a ficha e a aba aberta após falha de recarga e permite repetir a consulta · permite repetir uma carga inicial que falhou sem mostrar uma ficha inexistente |
| `src/pages/mapa/companyQueries.contract.test.ts` | 4 | carteira completa do mapa · busca mais de mil empresas pelo cursor do último ID e mantém escopo em cada página · não apresenta uma carteira parcial quando uma página falha · rejeita consulta sem usuário e encerra uma carteira vazia |
| `tests/contacts.spec.ts` | 4 | Contacts Module · should display the contacts list · should load more contacts on scroll · should open contact detail |
| `tests/contatos-excelencia.spec.ts` | 4 | Contatos e Rapport (Meta 10/10) · Fluxo completo: CRUD, Filtros por Hobbies e Rapport · Sincronização Social e Enriquecimento · Consistência Rapport e Metadata no Supabase |
| `tests/stress/thousand-scenarios.test.ts` | 4 | Meticulous Audit: Thousands of Scenarios · should handle 1000 unique rate limit keys efficiently · should validate 100 different phone formats · should simulate lead scoring matrix (100 permutations) |
| `e2e/interacoes-prefs-back-button.spec.ts` | 3 | /interacoes — preferências sobrevivem ao botão Voltar · aplicar prefs → ir pro dashboard → voltar → prefs restauradas · reload da rota com prefs na URL ainda restaura o estado |
| `src/components/admin/RequireAdmin.test.tsx` | 3 | Banner MFA administrativo · não anuncia ausência de MFA quando a consulta dos fatores está indisponível · mostra o aviso quando a ausência de fatores verificados foi confirmada |
| `src/components/contact-detail/ContactDetailHeader.test.tsx` | 3 | confirmação de estágio na ficha · não anuncia sucesso após uma atualização rejeitada e permite nova tentativa · libera o controle e mostra erro se a atualização lançar uma exceção |
| `src/components/dashboard/widgets/PendingFollowupsWidget.contract.test.tsx` | 3 | Prioridade canônica das pendências · distingue as quatro prioridades numéricas sem rebaixar as críticas · não apresenta falha de consulta como ausência de pendências |
| `src/components/enroll/EnrollContactDialog.contract.test.tsx` | 3 | Inscrição com busca e cache da carteira (dialógo genérico) · impede fechar pelo X ou Escape durante uma inscrição pendente · não inscreve um contato selecionado que desapareceu do cache após arquivamento |
| `src/components/erp/CompanyErpProposalsWidget.test.tsx` | 3 | Propostas ERP da empresa · propaga a falha de todas as origens e recupera os dados ao repetir · confirma ausência somente após uma consulta bem-sucedida, inclusive no fallback |
| `src/components/forms/company/CompanyFormSchema.contract.test.ts` | 3 | cores da marca no formulário canônico · valida o texto do formulário e grava o enum em lista · permite limpar as cores e rejeita valores fora do enum antes do envio |
| `src/components/pipeline/ForecastConfidencePanel.contract.test.tsx` | 3 | Previsão com duração de estágio desconhecida · não inventa duração nem receita prevista quando todos os negócios estão sem histórico · marca a estimativa como parcial e exclui apenas os dados sem duração |
| `src/hooks/useActivityLogger.test.tsx` | 3 | Eventos canônicos de auditoria · persiste eventos de %s aceitos pelo banco · não transforma uma falha de auditoria em falha da operação principal |
| `src/hooks/useContacts.cache.test.tsx` | 3 | edição na lista renova o detalhe sem depender de realtime · renova somente a ficha correta, ativa=%s, fora da primeira página · preserva a ficha após %s |
| `src/hooks/useDailyKpis.test.tsx` | 3 | useDailyKpis · não consulta métricas globais para usuário comum · consulta métricas globais para administrador |
| `src/hooks/useImportantDates.midnight.test.tsx` | 3 | calendário com as mesmas referências após mudança de dia · recalcula amanhã, hoje e o próximo ano por timer sem remontar · recalcula ao retomar uma aba suspensa por %s |
| `src/hooks/__tests__/canonical-competitor-save-contract.test.tsx` | 3 | gravação de concorrentes · não grava quando a consulta prévia das métricas falha · confirma a criação sem depender de uma consulta posterior de métricas |
| `src/hooks/__tests__/merge-company-name-override.test.tsx` | 3 | DB-01: nome obrigatório no override de empresa · rejeita %j antes da RPC · preserva o payload válido %j sem normalização |
| `src/hooks/__tests__/restore-response-contract.test.tsx` | 3 | Desfazer usa o envelope do wrapper externo real, com transporte simulado · HTTP 200 com data=%j não confirma restauração · HTTP 200 com registro correspondente mantém o sucesso |
| `src/lib/contactBehaviorAudit.test.ts` | 3 | Histórico comportamental canônico · preserva análises e validações humanas junto das alterações em ordem cronológica · expõe a falha de %s sem apresentar histórico parcial como completo |
| `src/lib/externalData.rpc-errors.test.ts` | 3 | Erros de RPC no envelope HTTP 200 · não bloqueia outra RPC após três recusas de contrato (%s) · contabiliza indisponibilidade do banco e interrompe a quarta tentativa |
| `src/lib/systemHealth.test.ts` | 3 | resolveHealthResponse · preserva a resposta 503 estruturada da Edge Function · propaga erro de transporte em vez de inferir estado saudável |
| `src/pages/Contatos.search.test.tsx` | 3 | Pesquisa efetiva dos contatos · aplica a URL imediatamente, inclusive após remount e retorno do detalhe · aplica a visualização salva à lista e mantém edição e limpeza funcionais |
| `src/pages/mapa/MapMarkerCluster.security.test.ts` | 3 | popup seguro do mapa · mostra o cadastro como texto literal sem gerar elementos HTML · mantém um link web seguro e distingue score zero de ausência |
| `supabase/functions/generate-insights/index.test.ts` | 3 | generate-insights: rejects unauthenticated requests · generate-insights: handles OPTIONS preflight · generate-insights: rejects GET method |
| `supabase/functions/health/index.test.ts` | 3 | health endpoint returns 200 with status · health endpoint handles OPTIONS (CORS preflight) · health endpoint includes database check |
| `supabase/functions/voice-agent/index.test.ts` | 3 | voice-agent: rejects unauthenticated requests · voice-agent: handles OPTIONS preflight · voice-agent: rejects non-POST methods |
| `tests/contacts-e2e.test.ts` | 3 | Contact Management · should create, filter and paginate contacts · should edit family info inline in Ficha 360 |
| `tests/contacts-rapport.spec.ts` | 3 | Contacts CRUD & Rapport · Complete flow: Create, Search, Filter, and Ficha 360 Rapport · Pagination (loadMore) flow |
| `tests/integration/auth-external-data.test.ts` | 3 | Integration: Auth + External Data · should include auth token in external data calls · should handle concurrent edit errors (409) correctly |
| `tests/integration/rate-limit.test.ts` | 3 | Integration: Edge Function Rate Limiting · should block requests exceeding the limit · should reset after the window expires |
| `tests/security/xss-sanitization.test.ts` | 3 | Security: XSS Sanitization · should sanitize malicious HTML scripts · should sanitize javascript: links |
| `scripts/check-deploy-timeout.test.mjs` | 2 | Prazo real dos health checks · Publicação com curl real e resposta local em ${seconds}s${TEMPO_REAL ?  |
| `scripts/lib/mgmt-mock.test.mjs` | 2 | mock sem banco: 201 [], 401 com token errado, 404 em rota desconhecida, falha injetada · mock com banco: linhas tipadas, erro 400 com SQLSTATE e lote atômico como na API real |
| `src/components/admin/conexoes/WebhookReplayButton.test.tsx` | 2 | WebhookReplayButton · envia replay administrativo autenticado sem expor o segredo HMAC |
| `src/components/admin/conexoes/webhookSnippetBuilders.test.ts` | 2 | buildPythonWebhookSnippet · carrega booleanos e nulos como JSON antes de serializar |
| `src/components/analytics/BehaviorAlertsPanel.contract.test.tsx` | 2 | recuperação da detecção de alertas · informa a falha, libera o botão e permite repetir a consulta |
| `src/components/company-detail/CompanyCommercialTab.test.tsx` | 2 | Contrato comercial de empresa · sinaliza o vínculo ausente sem consultar atividades por coluna inexistente |
| `src/components/csat/CSATPanel.contract.test.tsx` | 2 | Registro manual de satisfação · oferece criar uma pesquisa e mantém a nota selecionada até confirmar a gravação |
| `src/components/layout/Header.search.test.tsx` | 2 | Pesquisa contextual do cabeçalho · restaura o termo recebido e acompanha mudanças de contexto e limpeza |
| `src/hooks/useBulkImport.test.ts` | 2 | mapImportBatch · preserva o número original das linhas válidas após descartar uma linha inválida |
| `src/hooks/useContactDetail.sections.test.tsx` | 2 | falha em uma seção preserva a consulta composta da ficha · preserva o snapshot e recupera após falha de %s |
| `src/hooks/useContacts.pagination-deletion.test.tsx` | 2 | Paginação após excluir o último contato · não pede a página que deixou de existir após exclusão confirmada e refetch |
| `src/hooks/useErpData.partial-failure.test.tsx` | 2 | Indicadores ERP com falha parcial · preserva a origem saudável quando %s falha |
| `src/hooks/useIsAdmin.test.tsx` | 2 | Consulta de papel administrativo · diferencia falha de consulta e permite recuperar a permissão confirmada |
| `src/hooks/useRestoreEntity.test.tsx` | 2 | restauração do snapshot de um contato · preserva a identidade sem reenviar nome gerado nem alterar o snapshot original |
| `src/hooks/__tests__/auth-logger.contract.test.tsx` | 2 | Identidade global do logger · mantém o usuário em rotas sem AppLayout e limpa a identidade na troca e saída |
| `src/hooks/__tests__/company-history-null-contract.test.tsx` | 2 | Nulabilidade do histórico unificado de empresa · preserva todas as interações legadas com fallback de tipo e canal |
| `src/hooks/__tests__/dashboard-session.test.tsx` | 2 | cache de %s · não consulta sem login e separa as consultas após troca de conta |
| `src/lib/deployAllScript.test.ts` | 2 | deploy-all.sh · mantém %s com autenticação customizada |
| `src/pages/NPS.contract.test.tsx` | 2 | Pesquisas pendentes na tela NPS · inclui pending e sent na aba Pendentes e permite registrar uma resposta |
| `supabase/functions/external-data/index.test.ts` | 2 | external-data: rejects unauthenticated requests · external-data: handles OPTIONS preflight |
| `supabase/functions/voice-to-text/index.test.ts` | 2 | voice-to-text: rejects unauthenticated requests · voice-to-text: handles OPTIONS preflight |
| `tests/e2e/ai-gateway-card.spec.ts` | 2 | AI Gateway Health card · rota /admin/error-budget carrega sem chunk error |
| `tests/e2e/ai-gateway-heatmap.spec.ts` | 2 | AI Gateway heatmap · rota /admin/error-budget não quebra o bundle |
| `tests/stress/batch-processing.test.ts` | 2 | Stress: Batch Processing Simulation · should handle large batches without memory overflow (simulated) |
| `src/components/contact-detail/SalesActivitiesWidget.test.tsx` | 1 | informa que não existe vínculo com o contato sem consultar atividades por nome |
| `src/hooks/useModalHistory.test.tsx` | 1 | mantém uma entrada e fecha com o callback atual após rerender |
| `src/hooks/useSequenceProcessor.test.tsx` | 1 | não repete a mutação do processador após falha |
| `src/lib/externalData.sales-activity-audit.test.ts` | 1 | lê atividades existentes sem gravar uma criação de interação na auditoria |
| `tests/e2e/auth-parallel-refresh.spec.ts` | 1 | should handle parallel requests with token refresh |

## L. Eventos de webhook tratados (contratos com sistemas externos)

| Evento | Arquivo |
|---|---|
| `SKIP_WAITING` | `public/sw-push.js` |
| `dismiss` | `public/sw-push.js` |
| `health_alert` | `public/sw-push.js` |
| `insight` | `public/sw-push.js` |
| `meeting` | `public/sw-push.js` |
| `message` | `public/sw-push.js` |
| `snooze` | `public/sw-push.js` |
| `updated` | `src/hooks/useSlowQueryDetector.ts` |
| `updated` | `src/lib/queryErrorReporter.ts` |
| `messages.upsert` | `supabase/functions/evolution-bitrix-connector/index.ts` |
| `connection.update` | `supabase/functions/evolution-webhook/index.ts` |
| `contacts.upsert` | `supabase/functions/evolution-webhook/index.ts` |
| `messages.update` | `supabase/functions/evolution-webhook/index.ts` |
| `messages.upsert` | `supabase/functions/evolution-webhook/index.ts` |
| `presence.update` | `supabase/functions/evolution-webhook/index.ts` |
| `send.message` | `supabase/functions/evolution-webhook/index.ts` |
| `string` | `supabase/functions/external-data/index.ts` |

## M. Efeitos colaterais (e-mail, SMS, cobrança, fila — não são idempotentes por padrão)

| Chamada | Arquivo |
|---|---|
| `invoke(` | `src/components/admin/SystemHealthWidget.tsx` |
| `invoke(` | `src/components/admin/VoiceAITestPanel.tsx` |
| `invoke(` | `src/components/admin/conexoes/IncomingWebhookFormDialog.tsx` |
| `invoke(` | `src/components/admin/conexoes/SchemaDiscoveryCard.tsx` |
| `invoke(` | `src/components/contact-detail/ContactInteractionsTab.tsx` |
| `invoke(` | `src/components/crm/NextBestAction.tsx` |
| `notify_on_critical` | `src/components/dashboard/HealthAlertsPanel.tsx` |
| `notify_on_warning` | `src/components/dashboard/HealthAlertsPanel.tsx` |
| `invoke(` | `src/components/ficha-360/DadosPessoaisCard.tsx` |
| `.add('intel-aside-flash'` | `src/components/intel/IntelBookmarksNotesBadge.tsx` |
| `.add('search-focus-flash'` | `src/components/interactions/AdvancedSearchBar.tsx` |
| `notify` | `src/components/lead-scoring/AutomationCard.tsx` |
| `notify` | `src/components/lead-scoring/AutomationWizard.tsx` |
| `notify` | `src/components/lead-scoring/automation-templates.ts` |
| `invoke(` | `src/components/nlp/copywriting/CopywritingAiGeneratorTab.tsx` |
| `invoke(` | `src/components/nlp/copywriting/CopywritingObjectionTab.tsx` |
| `invoke(` | `src/components/search/VisualSearchButton.tsx` |
| `notify_new_device` | `src/components/security/PushNotificationSettings.tsx` |
| `notify_new_device` | `src/components/security/SecuritySettings.tsx` |
| `.add("theme-transitioning"` | `src/components/theme/ThemeProvider.tsx` |
| `invoke(` | `src/components/voice/VoiceInput.tsx` |
| `notifyDensityChange` | `src/contexts/DensityContext.tsx` |
| `invoke(` | `src/hooks/useABM.ts` |
| `invoke(` | `src/hooks/useAIWritingAssistant.ts` |
| `notify_new_device` | `src/hooks/useAccessSecurity.ts` |
| `invoke(` | `src/hooks/useAuditAnalytics.ts` |
| `invoke(` | `src/hooks/useAuth.tsx` |
| `invoke(` | `src/hooks/useBIAdvanced.ts` |
| `invoke(` | `src/hooks/useBehavioralProfile.ts` |
| `invoke(` | `src/hooks/useBulkRevalidate.ts` |
| `invoke(` | `src/hooks/useChurnRisk.ts` |
| `invoke(` | `src/hooks/useConnectionAnomalies.ts` |
| `invoke(` | `src/hooks/useConnections.ts` |
| `invoke(` | `src/hooks/useConversationIntel.ts` |
| `invoke(` | `src/hooks/useConversationalSearch.ts` |
| `invoke(` | `src/hooks/useDISCAutoAnalysis.ts` |
| `invoke(` | `src/hooks/useDealRooms.ts` |
| `invoke(` | `src/hooks/useEdgeFunctionActions.ts` |
| `invoke(` | `src/hooks/useEmailPipelineHealth.ts` |
| `invoke(` | `src/hooks/useEmailRefine.ts` |
| `invoke(` | `src/hooks/useEmailThreadSummary.ts` |
| `invoke(` | `src/hooks/useEnrichSocialProfiles.ts` |
| `invoke(` | `src/hooks/useEnrichmentSuite.ts` |
| `invoke(` | `src/hooks/useErrorBudget.ts` |
| `invoke(` | `src/hooks/useFicha360ConversationSummary.ts` |
| `invoke(` | `src/hooks/useForecasting.ts` |
| `invoke(` | `src/hooks/useHealthAlerts.ts` |
| `notify_on_critical` | `src/hooks/useHealthAlerts.ts` |
| `notify_on_warning` | `src/hooks/useHealthAlerts.ts` |
| `.add('intel-density-compact'` | `src/hooks/useIntelDensity.ts` |
| `.add('intel-presentation'` | `src/hooks/useIntelPresentation.ts` |
| `invoke(` | `src/hooks/useIntent.ts` |
| `invoke(` | `src/hooks/useInteractions.ts` |
| `invoke(` | `src/hooks/useLeadScoring.ts` |
| `invoke(` | `src/hooks/useLuxIntelligence.ts` |
| `invoke(` | `src/hooks/useMeetingSummary.ts` |
| `invoke(` | `src/hooks/useNextBestAction.ts` |
| `invoke(` | `src/hooks/useNurturingExecutions.ts` |
| `invoke(` | `src/hooks/usePlaybooks.ts` |
| `invoke(` | `src/hooks/useRevOps.ts` |
| `notify` | `src/hooks/useScoreAutomations.ts` |
| `invoke(` | `src/hooks/useSemanticSearch.ts` |
| `invoke(` | `src/hooks/useSequenceProcessor.ts` |
| `invoke(` | `src/hooks/useSmartNotifications.ts` |
| `notify` | `src/hooks/useSmartNotifications.ts` |
| `invoke(` | `src/hooks/useSmartReminders.ts` |
| `invoke(` | `src/hooks/useSmsCampaigns.ts` |
| `invoke(` | `src/hooks/useSocialIntelligence.ts` |
| `sendPush` | `src/hooks/useStakeholderAlerts.ts` |
| `notifyDensityChange` | `src/hooks/useTableDensity.ts` |
| `invoke(` | `src/hooks/useTemplateNotifications.ts` |
| `invoke(` | `src/hooks/useTerritoryOptimization.ts` |
| `invoke(` | `src/hooks/useValidationQueue.ts` |
| `invoke(` | `src/hooks/useVoiceAIHealth.ts` |
| `invoke(` | `src/hooks/useVoiceAgent.ts` |
| `invoke(` | `src/hooks/useWebhookDlq.ts` |
| `invoke(` | `src/hooks/useWeeklyReport.ts` |
| `sendEmail` | `src/hooks/useWeeklyReport.ts` |
| `invoke(` | `src/hooks/useWinLoss.ts` |
| `invoke(` | `src/hooks/commercial/useSocialSync.ts` |
| `notify` | `src/lib/keyboardShortcutRegistry.ts` |
| `invoke(` | `src/lib/supabaseInvoke.ts` |
| `invoke(` | `src/pages/AdminDashboard.tsx` |
| `invoke(` | `src/pages/DocsPage.tsx` |
| `.add('in_app'` | `src/pages/NotificacoesConfig.tsx` |
| `invoke(` | `src/pages/PublicForm.tsx` |
| `invoke(` | `src/pages/ResetPassword.tsx` |
| `invoke(` | `src/pages/StatusPage.tsx` |
| `invoke(` | `src/pages/admin/BehavioralRegenAudit.tsx` |
| `fcm.` | `supabase/functions/_shared/push.ts` |
| `notify` | `supabase/functions/_shared/push.ts` |
| `sendNotification` | `supabase/functions/_shared/push.ts` |
| `invoke(` | `supabase/functions/check-health-alerts/index.ts` |
| `notify_on_critical` | `supabase/functions/check-health-alerts/index.ts` |
| `notify_on_warning` | `supabase/functions/check-health-alerts/index.ts` |
| `sendWhatsAppAudio` | `supabase/functions/evolution-api/index.ts` |
| `invoke(` | `supabase/functions/evolution-webhook/messages.ts` |
| `notify` | `supabase/functions/lead-score-threshold-runner/index.ts` |
| `invoke(` | `supabase/functions/lead-scorer/index.ts` |
| `sendEmail` | `supabase/functions/sequence-processor/index.ts` |
| `notify` | `supabase/functions/smart-notify/index.ts` |
| `notify` | `supabase/functions/smart-notify/notification_state_test.ts` |
| `invoke(` | `supabase/functions/smart-notify/provider_config_test.ts` |
| `invoke(` | `supabase/functions/sync-social-interests/index.ts` |
| `sendEmail` | `supabase/functions/weekly-digest/index.ts` |
| `notify_on_critical` | `supabase/migrations/20260111181309_0d3ec51c-0121-4afe-a635-9223c46d26aa.sql` |
| `notify_on_warning` | `supabase/migrations/20260111181309_0d3ec51c-0121-4afe-a635-9223c46d26aa.sql` |
| `notify_at_risk_goals` | `supabase/migrations/20260321123053_salespro_batch1b_playbooks_cadences_achievements.sql` |
| `notify_inactive_clients` | `supabase/migrations/20260321123053_salespro_batch1b_playbooks_cadences_achievements.sql` |
| `notify_stagnant_deals` | `supabase/migrations/20260321123053_salespro_batch1b_playbooks_cadences_achievements.sql` |
| `notify_failed_login` | `supabase/migrations/20260321123327_salespro_batch4_tournaments_territories_final.sql` |
| `notify_new_device` | `supabase/migrations/20260321123327_salespro_batch4_tournaments_territories_final.sql` |
| `notify_password_change` | `supabase/migrations/20260321123327_salespro_batch4_tournaments_territories_final.sql` |
| `notify_role_change` | `supabase/migrations/20260321123327_salespro_batch4_tournaments_territories_final.sql` |
| `notify_at_risk_goals` | `supabase/migrations/20260321125738_salespro_mig_004_playbooks_cadences_leads.sql` |
| `notify_inactive_clients` | `supabase/migrations/20260321125738_salespro_mig_004_playbooks_cadences_leads.sql` |
| `notify_stagnant_deals` | `supabase/migrations/20260321125738_salespro_mig_004_playbooks_cadences_leads.sql` |
| `notify_failed_login` | `supabase/migrations/20260321125922_salespro_mig_007_security_bi_supply_remaining.sql` |
| `notify_new_device` | `supabase/migrations/20260321125922_salespro_mig_007_security_bi_supply_remaining.sql` |
| `notify_password_change` | `supabase/migrations/20260321125922_salespro_mig_007_security_bi_supply_remaining.sql` |
| `notify_role_change` | `supabase/migrations/20260321125922_salespro_mig_007_security_bi_supply_remaining.sql` |
| `notify_on_critical` | `supabase/migrations/20260321133652_create_singu_tables_batch1_of_3.sql` |
| `notify_on_warning` | `supabase/migrations/20260321133652_create_singu_tables_batch1_of_3.sql` |
| `notify_new_device` | `supabase/migrations/20260416180426_f322a48e-3a70-4ae3-a335-c840263904bf.sql` |
| `notify_on_new_device` | `supabase/migrations/20260416221418_singu_create_security_auth_module.sql` |
| `notify_on_new_location` | `supabase/migrations/20260416221418_singu_create_security_auth_module.sql` |
| `notify_new_device` | `supabase/migrations/20260416223701_singu_add_cols_batch_2.sql` |
| `notify` | `supabase/migrations/20260417004129_55991427-8b13-48b9-a9ac-702dec46887e.sql` |
| `notify_critical_next_action` | `supabase/migrations/20260417195323_b84a83b6-e3b8-4d98-be74-9c37a1bdfc21.sql` |
| `notify_connection_failures` | `supabase/migrations/20260420121651_b36d3337-3bfe-4477-b87d-9b3a39c72679.sql` |
| `notify_webhook_errors` | `supabase/migrations/20260420121651_b36d3337-3bfe-4477-b87d-9b3a39c72679.sql` |
| `notify_connection_failures` | `supabase/migrations/20260507194904_2c2619d2-100d-4166-8b79-ff93f6f0371d.sql` |
| `notify_critical_next_action` | `supabase/migrations/20260507194904_2c2619d2-100d-4166-8b79-ff93f6f0371d.sql` |
| `notify_webhook_errors` | `supabase/migrations/20260507194904_2c2619d2-100d-4166-8b79-ff93f6f0371d.sql` |
| `notify` | `supabase/migrations/20260512105729_9e0ffd45-400f-45c7-b371-7437029a5de3.sql` |
| `notify_admins_on_critical_behavioral_alert` | `supabase/migrations/20260713105306_9cd4c50d-43cf-4e26-8e96-4dd8a3794880.sql` |
| `notify_admins_on_critical_behavioral_alert` | `supabase/migrations/20260723103825_b485c6ef-1ff1-4d83-b7d6-c7a043d60dcc.sql` |
| `notify_connection_failures` | `supabase/migrations/20260723103825_b485c6ef-1ff1-4d83-b7d6-c7a043d60dcc.sql` |
| `notify_critical_next_action` | `supabase/migrations/20260723103825_b485c6ef-1ff1-4d83-b7d6-c7a043d60dcc.sql` |
| `notify_webhook_errors` | `supabase/migrations/20260723103825_b485c6ef-1ff1-4d83-b7d6-c7a043d60dcc.sql` |
| `notify_admins_on_critical_behavioral_alert` | `supabase/migrations/20260924143556_t202_fase1_revoke_secdef_triggers_and_internal_functions.sql` |
| `notify_connection_failures` | `supabase/migrations/20260924143556_t202_fase1_revoke_secdef_triggers_and_internal_functions.sql` |
| `notify_critical_next_action` | `supabase/migrations/20260924143556_t202_fase1_revoke_secdef_triggers_and_internal_functions.sql` |
| `notify_webhook_errors` | `supabase/migrations/20260924143556_t202_fase1_revoke_secdef_triggers_and_internal_functions.sql` |
| `notify` | `supabase/migrations/20261012010000_notification_delivery_claims.sql` |
| `notify` | `supabase/migrations/20261111210500_agenda_edge_functions_cron.sql` |

## N. Regras citadas em comentários do código

| Comentário | Arquivo |
|---|---|
| This override must appear AFTER the main config block so it wins. | `eslint.config.js` |
| SonarJS sinaliza padrões intencionais desses scripts: MD5 apenas para checksum de | `eslint.config.js` |
| and must not run under vitest. Vitest unit/integration tests live in src/ and | `vitest.config.ts` |
| • pushNotifications.ts must use navigator.serviceWorker.ready (the | `src/main.tsx` |
| requires the user to re-grant Notification permission — browser policy | `src/main.tsx` |
| * The UpdateAvailable component in NotificationAndMisc.tsx must | `src/main.tsx` |
| * Modal "O que há de novo" — apenas para usuários autenticados fora de /auth */ | `src/app/AppChrome.tsx` |
| após 800ms de idle, apenas para usuários autenticados. | `src/app/AppChrome.tsx` |
| Visível apenas para admins. Atualização propaga em ≤5 min (staleTime do hook). | `src/components/admin/MttaSlaThresholdEditor.tsx` |
| * Limite de latência aceitável (ms) — alinhado ao alerta RpcPerfDegradation. */ | `src/components/admin/RpcPlanChurnTimelineChart.tsx` |
| O webhook nativo não calcula HMAC SHA-256 e não deve chamar esta URL diretamente. | `src/components/admin/conexoes/WebhookSnippetsSheet.tsx` |
| * Guard de permissão por rota, sobre a matriz `permissions` x `role_permissions`. | `src/components/auth/RequirePermission.tsx` |
| possui a permissão pedida. | `src/components/auth/RequirePermission.tsx` |
| que existiam apenas como dados sem tela. | `src/components/carnegie/CarnegieExtendedLibrary.tsx` |
| Future Projection & Past Validation */} | `src/components/carnegie/IdentityLabelingPanel.tsx` |
| que difere do shape cru de `contacts`. Mapeamos apenas o que os hooks leem, | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| ').eq('contact_id', contact.id).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(5), | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| ').eq('contact_id', contact.id).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(1), | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| ').eq('contact_id', contact.id).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(1), | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| ').eq('contact_id', contact.id).eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1), | `src/components/contact-detail/ContactBehavioralTab.tsx` |
| ').eq('contact_id', contactId).eq('user_id', user!.id).order('analyzed_at', { ascending: false }).limit(1), | `src/components/contact-detail/ContactCommercialTab.tsx` |
| ').eq('contact_id', contactId).eq('user_id', user!.id).order('purchase_date', { ascending: false }).limit(20), | `src/components/contact-detail/ContactCommercialTab.tsx` |
| Basic validation | `src/components/contact-detail/data-tab/RelativeDialog.tsx` |
| 3c. Business Alerts + Strategic Accounts */} | `src/components/dashboard/tabs/OverviewTab.tsx` |
| Não bloqueia UI, apenas comunica atividade. | `src/components/feedback/GlobalSyncIndicator.tsx` |
| * Não tem interação por clique — apenas visualização. Esconde-se quando não | `src/components/ficha-360/ContagemPorTipoBar.tsx` |
| Validação do Modo de Testes: garante que sentimento e melhor horário/canal | `src/components/ficha-360/CopyScriptMenu.tsx` |
| Eventos (Somente Leitura por enquanto conforme plano) */} | `src/components/ficha-360/DadosPessoaisCard.tsx` |
| Sem LLM — apenas regras locais. | `src/components/intel/CrossRefInsightsPanel.tsx` |
| muda de tipo apenas limpa busca; histórico preserva | `src/components/intelligence/Entity360Tab.tsx` |
| * Total de grupos visíveis na página atual (apenas no modo agrupado). */ | `src/components/interactions/ActiveFiltersBar.tsx` |
| no dataset bruto se APENAS aquele filtro estivesse ativo. Usado para | `src/components/interactions/ActiveFiltersBar.tsx` |
| - Armazenar no atributo `data-last-caret` mantém o acoplamento mínimo: | `src/components/interactions/AdvancedSearchBar.tsx` |
| * Aparece apenas quando há ao menos um canal selecionado. | `src/components/interactions/AdvancedSearchBar.tsx` |
| (não é apenas o pending divergente do mount) e estamos em manual, | `src/components/interactions/CanaisQuickFilter.tsx` |
| nunca fez. Disparado APENAS na transição de modo (não em cada mudança | `src/components/interactions/CanaisQuickFilter.tsx` |
| ←/→ apenas quando o foco está no campo de busca de interações. | `src/components/interactions/CanaisQuickFilter.tsx` |
| Atalho global Alt+D: limpa APENAS o filtro de datas (de/ate), preservando | `src/components/interactions/DateRangePopover.tsx` |
| Item atualmente "checked" — usado para roving tabindex (apenas o ativo é | `src/components/interactions/SentimentQuickFilter.tsx` |
| Roving tabindex: somente o item ativo entra na ordem de Tab. | `src/components/interactions/SentimentQuickFilter.tsx` |
| * Shape mínimo aceito tanto por `TimelineGroup` (hook) quanto por | `src/components/interactions/TimelineGroupCard.tsx` |
| * Pontuação acumulada de relevância (apenas no sort 'relevance'). */ | `src/components/interactions/TimelineGroupCard.tsx` |
| * Quando true (default), inicia mostrando apenas o último evento do grupo | `src/components/interactions/TimelineGroupCard.tsx` |
| Indicador de relevância: visível apenas no sort 'relevance' e quando o grupo | `src/components/interactions/TimelineGroupCard.tsx` |
| Traduz o "periodo" (somente Insights) em range de datas (de/ate) usado pela Lista. | `src/components/interactions/insights/ObjectionsSpotlight.tsx` |
| ao fechar o drawer) — somente se a interação corrente foi por teclado, para | `src/components/interactions/insights/SentimentDistributionChart.tsx` |
| Primeira ativação (sem cursor e sem activeBucket) apenas posiciona no primeiro/último, | `src/components/interactions/insights/SentimentDistributionChart.tsx` |
| * USO: Apenas para exibição/formatação local (labels, UI). | `src/components/interactions/insights/weekUtils.ts` |
| conteúdo foi totalmente reescrito. O conceito de "regra de roteamento" | `src/components/lead-routing/tabs/RoutingRulesTab.tsx` |
| O tour não deve abrir sozinho no dashboard para não bloquear a interface. | `src/components/onboarding/OnboardingTourWrapper.tsx` |
| O badge mostra a probabilidade real do negocio. Quando ha leitura | `src/components/pipeline/NLPProbabilityBadge.tsx` |
| Notification Permission Request | `src/components/pwa/NotificationAndMisc.tsx` |
| Check current permission and subscription status | `src/components/settings/TourPreferencesPanel.tsx` |
| Request permission first | `src/components/settings/TourPreferencesPanel.tsx` |
| noop: persistência não deve quebrar a troca visual | `src/components/theme/ThemeProvider.tsx` |
| Mínimo de 44x44px conforme WCAG para melhor touch target mobile | `src/components/ui/button.tsx` |
| MISSED DEADLINE | `src/data/carnegieFaceSaving.ts` |
| * Validates if a transition between stages is business-compliant. | `src/domain/dealState.ts` |
| * O painel de Gatilhos Avançados (Analytics) detectava conflito entre apenas | `src/hooks/useAdvancedTriggers.ts` |
| o acesso (a EF é passiva e devolve apenas is_new/is_trusted). | `src/hooks/useAuth.tsx` |
| Business hours | `src/hooks/useBestTimeToContact.ts` |
| Mantém apenas combinações com >=1 canal (vazio == "todos", já é o default). | `src/hooks/useChannelHistory.ts` |
| Vencedor por estágio (maior taxa, mínimo 3 interações) | `src/hooks/useChannelPerformanceMatrix.ts` |
| depois da validação de todos os campos e relações, sem confiar no JSON do proxy. | `src/hooks/useCompanies.ts` |
| ').eq('contact_id', contactId!).eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50), | `src/hooks/useContactDetail.ts` |
| ').eq('contact_id', contactId!).eq('user_id', user!.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(20), | `src/hooks/useContactDetail.ts` |
| ').eq('contact_id', contactId!).eq('user_id', user!.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(10), | `src/hooks/useContactDetail.ts` |
| 2. Fetch company (depends on contactData.company_id — must be sequential) | `src/hooks/useContactDetail.ts` |
| JSON inválido ou de outra estrutura deve chegar ao caller como erro. | `src/hooks/useContacts.ts` |
| Validação completa antes da asserção única (inferência Zod com strictNullChecks=false). | `src/hooks/useContacts.ts` |
| Character limit check | `src/hooks/useCopywritingAdvanced.ts` |
| ').eq('user_id', user.id).order('analyzed_at', { ascending: false }).limit(10), | `src/hooks/useDISCAnalysis.ts` |
| Must have at least 2 vowels to be a real name | `src/hooks/useDashboardStats.ts` |
| ").eq("room_id", roomId!).order("created_at", { ascending: false }).limit(100); | `src/hooks/useDealRooms.ts` |
| preparar destinatários não comprova envio e não deve alterar status/sent_at da campanha. | `src/hooks/useEmailCampaigns.ts` |
| Carrega ao trocar entidade ou usuário (apenas read local). | `src/hooks/useEntityNotes.ts` |
| Nota: deletar logs geralmente exige permissão admin | `src/hooks/useErrorLogs.ts` |
| Retorna `true` apenas se a flag existir e estiver ativa. | `src/hooks/useFeatureFlag.ts` |
| Escopo: "interactions". Apenas density/perPage/view/sort — campos de | `src/hooks/useInteractionsAdvancedFilter.ts` |
| são mudanças de navegação intencionais e o botão "Voltar" deve revertê-las, | `src/hooks/useInteractionsAdvancedFilter.ts` |
| page nunca é persistida via applyAll: qualquer mudança em filtros deve voltar pra página 1. | `src/hooks/useInteractionsAdvancedFilter.ts` |
| * Limpa SOMENTE o intervalo de datas (`de` e `ate`) em uma única operação | `src/hooks/useInteractionsAdvancedFilter.ts` |
| * Restaura SOMENTE preferências de visualização (density, perPage, view, sort) | `src/hooks/useInteractionsAdvancedFilter.ts` |
| PostgREST nao encontrar a funcao. O `companyId` segue apenas governando | `src/hooks/useInteractionsRpc.ts` |
| A RPC canônica aceita somente p_company_id; contatos usam os mesmos campos reais. | `src/hooks/useInteractionsRpc.ts` |
| ')) throw new Error('URL do webhook deve usar HTTPS'); | `src/hooks/useLuxWebhookConfig.ts` |
| Busca apenas analyses cujo array `objections` contém algum item — filtro | `src/hooks/useMarkObjectionHandled.ts` |
| Calcula apenas as linhas que precisam realmente mudar (idempotente). | `src/hooks/useMarkObjectionHandled.ts` |
| dia calendário registra no máximo 1 snapshot por navegador. | `src/hooks/useMttaSlaBreachSnapshot.ts` |
| usuários não-admin apenas ignoram o insert. | `src/hooks/useMttaSlaBreachSnapshot.ts` |
| * Probabilidade final exibida: base do negócio + ajuste comportamental. */ | `src/hooks/useNLPClosingProbability.ts` |
| * Probabilidade do próprio negócio, como está no banco. */ | `src/hooks/useNLPClosingProbability.ts` |
| * Probabilidade de fechamento do negócio, com ajuste pela leitura | `src/hooks/useNLPClosingProbability.ts` |
| pontos — à probabilidade de qualquer negócio. O próprio comentário dizia | `src/hooks/useNLPClosingProbability.ts` |
| * Agora o número exibido é a probabilidade real do negócio (`deals.probabilidade`). | `src/hooks/useNLPClosingProbability.ts` |
| probabilidade do negócio e diz, no tooltip, que não há leitura. O badge não | `src/hooks/useNLPClosingProbability.ts` |
| * Peso máximo que a leitura comportamental pode somar à probabilidade do deal. */ | `src/hooks/useNLPClosingProbability.ts` |
| mapeamento, que não justifica mexer na probabilidade do negócio. | `src/hooks/useNLPClosingProbability.ts` |
| Uma falha no status não deve duplicar a interação na mesma instância do hook. | `src/hooks/useNextBestAction.ts` |
| * Trabalho 100% client-side: não há fetch envolvido — apenas evitamos pagar | `src/hooks/useNextPagePrefetch.ts` |
| Request notification permission and subscribe | `src/hooks/useNotifications.ts` |
| Não tenta novamente em 402 (créditos) ou 429 (rate limit) | `src/hooks/useObjectionContextSummary.ts` |
| * - SSR-safe: lê do storage apenas após o mount (evita mismatch de hidratação). | `src/hooks/usePersistentBoolean.ts` |
| - SECURITY: callers that store user-specific state MUST include the user ID in `key` | `src/hooks/usePersistentBoolean.ts` |
| ').in('id', companyIds).limit(200) | `src/hooks/usePreContactBriefing.ts` |
| ').eq('user_id', user!.id).order('priority', { ascending: true }).limit(20), | `src/hooks/useRFMSegmentConfig.ts` |
| ').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(1), | `src/hooks/useRFMSegmentConfig.ts` |
| tela. Idempotente: dispara apenas quando algum dos valores muda. | `src/hooks/useReportInfiniteScrollProgress.ts` |
| ').order('closer_nome', { ascending: true }).limit(500), | `src/hooks/useRodizioEquipe.ts` |
| ').order('sdr_nome', { ascending: true }).limit(500), | `src/hooks/useRodizioEquipe.ts` |
| `config_regras_negocio` (texto 'true'/'false'). Somente leitura por ora. | `src/hooks/useRodizioEquipe.ts` |
| * Substitui `useLeadRouting.ts` (regras de roteamento). O conceito de "regra" | `src/hooks/useRodizioOndas.ts` |
| * Aprova/rejeita uma linha de staging (apenas RASCUNHO → APROVADO/REJEITADO, aplicado no client). */ | `src/hooks/useRodizioOndas.ts` |
| * Não chama endpoint, sem `useEffect` para fetch — apenas lê/escreve estado client-side. | `src/hooks/useSavedViews.ts` |
| Respeita limite de 10. Retorna o preset criado ou null se limite atingido. | `src/hooks/useSearchPresets.ts` |
| * Importa presets em lote. Respeita limite de 10 e faz dedup de nomes. | `src/hooks/useSearchPresets.ts` |
| Retorna contagem de adicionados e ignorados (por limite). | `src/hooks/useSearchPresets.ts` |
| ').eq('contact_id', contactId).eq('user_id', user!.id).order('updated_at', { ascending: false }).limit(10), | `src/hooks/useSocialIntelligence.ts` |
| ').eq('contact_id', contactId).eq('user_id', user!.id).order('analysis_date', { ascending: false }).limit(1), | `src/hooks/useSocialIntelligence.ts` |
| ').eq('contact_id', contactId).eq('user_id', user!.id).eq('dismissed', false).order('created_at', { ascending: false }).limit(20), | `src/hooks/useSocialIntelligence.ts` |
| Check if permission is granted | `src/hooks/useStakeholderAlerts.ts` |
| Limit to 3 risks | `src/hooks/useStakeholderSimulator.ts` |
| (`assert_contact_access`) e devolve `SETOF tasks` ordenado por vencimento. | `src/hooks/useTasks.ts` |
| ').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50) | `src/hooks/useTriggerAnalytics.ts` |
| ').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50); | `src/hooks/useTriggerAnalytics.ts` |
| ').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(50) | `src/hooks/useTriggerAnalytics.ts` |
| ').eq('user_id', user!.id).order('created_at', { ascending: false }).limit(50); | `src/hooks/useTriggerAnalytics.ts` |
| ').eq('user_id', user!.id).order('success_rate', { ascending: false }).limit(20), | `src/hooks/useTriggerAnalytics.ts` |
| ').eq('user_id', user!.id).eq('contact_id', contactId).order('created_at', { ascending: false }).limit(30) | `src/hooks/useTriggerAnalytics.ts` |
| * @template T  Forma das preferências do escopo. Deve ser JSON-serializável. | `src/hooks/useUiPreferencesSync.ts` |
| * Sanitiza/normaliza o objeto `preferences` vindo do banco. Deve descartar | `src/hooks/useUiPreferencesSync.ts` |
| Silent — logging must never break the voice flow | `src/hooks/voice/logVoiceCommand.ts` |
| - Strict action validation | `src/hooks/voice/processTranscript.ts` |
| Caminho rápido: aceita apenas a parte da data se vier ISO completo. | `src/lib/civilDate.ts` |
| * Quantos itens do dataset bruto sobreviveriam se APENAS este filtro estivesse ativo. */ | `src/lib/computeIsolatedFilterCounts.ts` |
| se APENAS aquele filtro estivesse aplicado (microdetalhe "isolado"). | `src/lib/computeIsolatedFilterCounts.ts` |
| Patterns that identify internal technical error messages that must not reach users. | `src/lib/errorMessages.ts` |
| * Validação de magic bytes para garantir a integridade dos arquivos enviados. | `src/lib/fileValidation.ts` |
| Em prod, persistimos apenas se for aviso importante ou erro | `src/lib/logger.ts` |
| dá InvalidStateError. Cancela e refaz com a chave atual; a permissão já concedida é mantida (sem novo prompt). | `src/lib/pushNotifications.ts` |
| * Migra em silêncio quem já tem permissão e uma assinatura criada com outra chave VAPID. Barato: só olha a assinatura local. | `src/lib/pushNotifications.ts` |
| * Papéis sem nenhuma linha em `role_permissions`: não concedem nenhuma permissão. */ | `src/lib/roleAssignment.ts` |
| * `admin`, `manager` e `salesperson` têm permissão mapeada; `moderator` e `user` não. */ | `src/lib/roleAssignment.ts` |
| * Um admin não pode remover o próprio `admin`: sem ele a tela de papéis fica | `src/lib/roleAssignment.ts` |
| * Mapa rota -> permissao da matriz RBAC (`permissions` x `role_permissions`). | `src/lib/routePermissions.ts` |
| porque `existing` deve ser todos os presets já salvos. | `src/lib/searchPresetTransport.ts` |
| @param length Comprimento mínimo 32 caracteres | `src/lib/secretRotation.ts` |
| * Limite total de passagens retornadas. Sempre clampado em [1, MAX_TOTAL_CAP]. */ | `src/lib/insights/pickTopPassages.ts` |
| * Máximo de passagens por fonte antes do round-robin. */ | `src/lib/insights/pickTopPassages.ts` |
| * Limite máximo absoluto de passagens retornadas (requisito: até 5). */ | `src/lib/insights/pickTopPassages.ts` |
| ').eq('user_id', user.id).limit(50), | `src/pages/Insights.tsx` |
| ').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100), | `src/pages/Insights.tsx` |
| ').eq('user_id', user.id).limit(50), | `src/pages/Insights.tsx` |
| ').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100), | `src/pages/Insights.tsx` |
| Notification Permission Card */} | `src/pages/Notificacoes.tsx` |
| Registra a visualização pela RPC; acesso anônimo não pode atualizar a tabela diretamente. | `src/pages/PublicLandingPage.tsx` |
| ").eq("contact_id", id).eq("user_id", user.id).order("analyzed_at", { ascending: false }).limit(50), | `src/pages/RelatorioContato.tsx` |
| Executa sequencialmente com 600ms entre chamadas para não estourar rate limit. | `src/pages/admin/BehavioralRegenAudit.tsx` |
| Pausa entre chamadas para respirar (rate limit + LLM cost). | `src/pages/admin/BehavioralRegenAudit.tsx` |
| Sequencial + delay pequeno para evitar rate-limit da IA | `src/pages/admin/InsightFeedbackAnalytics.tsx` |
| (scrollIntoView usa block:'start' apenas no container, não move o caret). | `src/pages/interacoes/InteracoesContent.tsx` |
| nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(location)}`, | `src/pages/mapa/geocoding.ts` |
| - data limite opcional, mas se informada deve ser hoje ou no futuro. | `src/pages/tarefas/CreateTaskDialog.tsx` |
| Regra do pico-fim | `src/types/cognitive-biases.ts` |
| Beginning & End (Peak-End Rule) | `src/types/neuromarketing.ts` |
| ─── Config (kill switches, somente leitura) ─── */ | `src/types/rodizio.ts` |
| Regra pico-fim | `src/types/triggers-advanced.ts` |
| swallow — telemetry must never break the caller | `supabase/functions/_shared/aiGatewayLogger.ts` |
| Callers must await this function. | `supabase/functions/_shared/auth.ts` |
| to enforce the limit regardless of header spoofing. Returns a typed result | `supabase/functions/_shared/auth.ts` |
| Callers must await this function. | `supabase/functions/_shared/auth.ts` |
| "\x00" is the NUL byte; "a\x00" must not equal "a" | `supabase/functions/_shared/auth_test.ts` |
| * Deno isolates have a hard 60-second wall-clock limit per invocation, but a | `supabase/functions/_shared/fetch-utils.ts` |
| for the full duration — starving other requests. Always pass a deadline. | `supabase/functions/_shared/fetch-utils.ts` |
| * fetch() with a hard deadline via AbortSignal.timeout(). | `supabase/functions/_shared/fetch-utils.ts` |
| @param timeoutMs Deadline in milliseconds (default: API_TIMEOUT_MS = 30 s) | `supabase/functions/_shared/fetch-utils.ts` |
| * Convenience wrapper for AI gateway / LLM inference calls (45 s deadline). | `supabase/functions/_shared/fetch-utils.ts` |
| sem isso a negativa de permissão viraria `catch` e o corpo seguiria com o modelo antigo. */ | `supabase/functions/_shared/fetch-utils.ts` |
| telemetry must never break the caller | `supabase/functions/_shared/fetch-utils.ts` |
| * Convenience wrapper for external scraping API calls (90 s deadline). */ | `supabase/functions/_shared/fetch-utils.ts` |
| * Convenience wrapper for third-party REST API calls (30 s deadline). */ | `supabase/functions/_shared/fetch-utils.ts` |
| * Check if a key has exceeded the rate limit. | `supabase/functions/_shared/rate-limit.ts` |
| CORS headers may or may not echo the origin depending on allowlist, but must not throw | `supabase/functions/_shared/rate-limit_test.ts` |
| 1024) throw new Error("Corpo de requisição excede o limite permitido"); | `supabase/functions/_shared/safe-http.ts` |
| * Lightweight request body validation for Edge Functions. | `supabase/functions/_shared/validate.ts` |
| title: { type: 'string', required: true, maxLength: 200 }, | `supabase/functions/_shared/validate.ts` |
| score: { type: 'integer', required: true, min: 0, max: 10 }, | `supabase/functions/_shared/validate.ts` |
| A whitespace-only string is functionally empty — reject it as missing for required fields | `supabase/functions/_shared/validate.ts` |
| ── Rate limit (keyed by userId, not IP — avoids shared-NAT false positives) ── | `supabase/functions/ai-writing-assistant/index.ts` |
| Must start with SELECT | `supabase/functions/ask-crm/index.ts` |
| - Limite: BATCH_SIZE contatos por execução (protege budget de IA). | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| - Rate limit: DELAY_MS entre chamadas à edge function `generate-behavioral-profile`. | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| - Não retorna dados de contato — apenas contagens agregadas. | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| Debounce: só reanalisa se passou intervalo mínimo | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| Rate-limit gentle entre chamadas de IA | `supabase/functions/auto-rebatch-behavioral/index.ts` |
| guardBody always calls req.json() so it must not be used for form-urlencoded: | `supabase/functions/bitrix24-webhook/index.ts` |
| 🔒 Cron secret validation | `supabase/functions/check-notifications/index.ts` |
| clear-must-reset-flag | `supabase/functions/clear-must-reset-flag/index.ts` |
| ── Rate limit ── | `supabase/functions/disc-analyzer/index.ts` |
| F/F19: service-role caller deve fornecer userId no body; JWT caller usa userId do token | `supabase/functions/disc-analyzer/index.ts` |
| Atualiza somente contatos sem avatar personalizado (IS NULL) | `supabase/functions/evolution-webhook/events.ts` |
| Por que o cliente de usuário não pode ser criado. O JWT do usuário só vale | `supabase/functions/external-data/database.ts` |
| ─── RPC (call external database functions) — must run BEFORE table validation ─── | `supabase/functions/external-data/index.ts` |
| ─── Table validation (for non-RPC actions) ─── | `supabase/functions/external-data/index.ts` |
| o teste valida apenas o contrato de erro 401. | `supabase/functions/external-data/optimistic-locking_test.ts` |
| ").eq("period_id", period_id).order("forecasted_amount", { ascending: false }).limit(50); | `supabase/functions/forecast-narrative/index.ts` |
| ── Rate limit ── | `supabase/functions/generate-insights/index.ts` |
| retornou). Duplicata de re-geração é evitada pela UI (limite de recentes). | `supabase/functions/generate-insights/index.ts` |
| ').in('contact_id', contactIds).order('created_at', { ascending: false }).limit(100), | `supabase/functions/generate-offer-suggestions/index.ts` |
| Modos: { contact_id } -> recalcula 1, { batch: true, limit?: n } -> processa fila. | `supabase/functions/lead-scorer/index.ts` |
| Number(s.weight ?? 1) * decayFactor(ageDays, rule.decay_days); | `supabase/functions/lead-scorer/index.ts` |
| Rate limit: 120 req/min por token. Log de cada tool call em mcp_tool_calls. | `supabase/functions/mcp-server/index.ts` |
| Null guard: created_by must exist — system-created configs without an owner cannot execute tools | `supabase/functions/mcp-server/index.ts` |
| ').eq('contact_id', contactId).eq('user_id', userId).order('created_at', { ascending: false }).limit(10), | `supabase/functions/next-best-action/index.ts` |
| ').eq('contact_id', contactId).order('created_at', { ascending: false }).limit(5), | `supabase/functions/next-best-action/index.ts` |
| Idempotência: este step de e-mail já foi enviado; registra apenas a interação | `supabase/functions/nurturing-runner/index.ts` |
| Rate limit por IP | `supabase/functions/objection-context-summary/index.ts` |
| ").eq("active", true).limit(100), | `supabase/functions/playbook-recommender/index.ts` |
| ").eq("active", true).ilike("competitor_name", `%${escapedCompetitor}%`).limit(1).maybeSingle() | `supabase/functions/playbook-recommender/index.ts` |
| Service-role callers (crons) must specify userId | `supabase/functions/send-push-notification/index.ts` |
| sequence-processor; responde { ok: true, messageId } apenas quando o Resend aceita o envio. | `supabase/functions/send-transactional-email/index.ts` |
| 🔒 Cron secret validation | `supabase/functions/social-events-detector/index.ts` |
| O roadmap e validado a parte, com safeParse: um marco malformado nao pode | `supabase/functions/suggest-next-action/index.ts` |
| Roadmap: grava apenas o que o modelo devolveu. Antes desta mudanca, os | `supabase/functions/suggest-next-action/index.ts` |
| F/F60: página de status pública — rate limit por IP, sem exigência de autenticação | `supabase/functions/system-health/index.ts` |
| 🔒 Cron secret validation | `supabase/functions/template-success-notifications/index.ts` |
| F/F62: falha de RPC externa não pode virar lista vazia (mascara erro real) | `supabase/functions/territory-optimization/index.ts` |
| * Pela tela, e-mail só quando o usuário pede o teste; chave única por clique (o limite é 3/min). */ | `supabase/functions/weekly-digest/index.ts` |
| 267: o Supabase Preview aplica APENAS as migrations novas | `supabase/migrations/20260109144945_baseline_tabelas_fundadoras.sql` |
| 267: o Supabase Preview aplica APENAS as migrations novas | `supabase/migrations/20260110000002_baseline_compat_idempotente.sql` |
| FROM supplier_evaluations WHERE supplier_id = s.id ORDER BY data_avaliacao DESC LIMIT 5) se | `supabase/migrations/20260329182140_create_fn_supplier_stats.sql` |
| FROM supplier_score_history WHERE supplier_id = s.id ORDER BY measured_at DESC LIMIT 10) ssh | `supabase/migrations/20260329182140_create_fn_supplier_stats.sql` |
| FROM supplier_homologations sh2 WHERE sh2.supplier_id = s.id ORDER BY sh2.created_at DESC LIMIT 1 | `supabase/migrations/20260329203937_create_vw_supplier_homologation_queue.sql` |
| FROM carrier_evaluations WHERE carrier_id = c.id ORDER BY data_avaliacao DESC LIMIT 5) ce | `supabase/migrations/20260330121632_create_fn_carrier_stats.sql` |
| FROM carrier_score_history WHERE carrier_id = c.id ORDER BY measured_at DESC LIMIT 10) csh | `supabase/migrations/20260330121632_create_fn_carrier_stats.sql` |
| INTO v_customer FROM customers WHERE company_id = v_company_id AND deleted_at IS NULL LIMIT 1; | `supabase/migrations/20260401192532_create_rpc_contact_intelligence_by_phone_v2.sql` |
| INTO v_rfm FROM company_rfm_scores WHERE company_id = v_company_id ORDER BY calculated_at DESC LIMIT 1; | `supabase/migrations/20260401192532_create_rpc_contact_intelligence_by_phone_v2.sql` |
| FROM interactions WHERE contact_id = v_contact_id ORDER BY data_interacao DESC LIMIT 3) i; | `supabase/migrations/20260401192532_create_rpc_contact_intelligence_by_phone_v2.sql` |
| FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp | `supabase/migrations/20260409174932_zapp_history_110_master_dashboard.sql` |
| FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o | `supabase/migrations/20260409174932_zapp_history_110_master_dashboard.sql` |
| FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc | `supabase/migrations/20260409174932_zapp_history_110_master_dashboard.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409181150_zapp_history_119_master_dashboard_geo.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409181150_zapp_history_119_master_dashboard_geo.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409181150_zapp_history_119_master_dashboard_geo.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409181150_zapp_history_119_master_dashboard_geo.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409181150_zapp_history_119_master_dashboard_geo.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409183646_zapp_history_130_master_dashboard_segmentation.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409183646_zapp_history_130_master_dashboard_segmentation.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409183646_zapp_history_130_master_dashboard_segmentation.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409183646_zapp_history_130_master_dashboard_segmentation.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409183646_zapp_history_130_master_dashboard_segmentation.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409190803_zapp_history_138_intelligence360_v2.sql` |
| FROM zapp_history.v_churn_alerts LIMIT 10) c | `supabase/migrations/20260409190803_zapp_history_138_intelligence360_v2.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409190803_zapp_history_138_intelligence360_v2.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409190803_zapp_history_138_intelligence360_v2.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409190803_zapp_history_138_intelligence360_v2.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409190803_zapp_history_138_intelligence360_v2.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_customization_demand LIMIT 20) c), | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409205604_zapp_history_148_intelligence360_v3.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409205931_zapp_history_149_master_dashboard_disc.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409205931_zapp_history_149_master_dashboard_disc.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409205931_zapp_history_149_master_dashboard_disc.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409205931_zapp_history_149_master_dashboard_disc.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409205931_zapp_history_149_master_dashboard_disc.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409205931_zapp_history_149_master_dashboard_disc.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409210719_zapp_history_159_master_dashboard_v5.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409210719_zapp_history_159_master_dashboard_v5.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409210719_zapp_history_159_master_dashboard_v5.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409210719_zapp_history_159_master_dashboard_v5.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409210719_zapp_history_159_master_dashboard_v5.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409210719_zapp_history_159_master_dashboard_v5.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409211613_zapp_history_169_master_dashboard_v6.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409211613_zapp_history_169_master_dashboard_v6.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409211613_zapp_history_169_master_dashboard_v6.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409211613_zapp_history_169_master_dashboard_v6.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409211613_zapp_history_169_master_dashboard_v6.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409211613_zapp_history_169_master_dashboard_v6.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_proximas_respostas LIMIT 20) pr), | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409212244_zapp_history_179_master_dashboard_v7.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_proximas_respostas LIMIT 20) pr), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_produtos_demanda LIMIT 5) tp), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_objecoes_recorrentes LIMIT 5) o), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_top_contatos_potencial LIMIT 5) tc), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_demanda_por_cidade LIMIT 10) c), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_spam_log LIMIT 20) sl), | `supabase/migrations/20260409221035_zapp_history_189_master_dashboard_v8.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_proximas_respostas LIMIT 20) pr), | `supabase/migrations/20260409222519_zapp_history_199_master_dashboard_v9.sql` |
| FROM zapp_history.v_intelligence_360 WHERE recebido_em > NOW() - INTERVAL '24 hours' LIMIT 10) t | `supabase/migrations/20260409222519_zapp_history_199_master_dashboard_v9.sql` |
| ), '[]'::jsonb) FROM (SELECT * FROM zapp_history.v_churn_alerts LIMIT 10) c), | `supabase/migrations/20260409222519_zapp_history_199_master_dashboard_v9.sql` |
| … +58 linhas — lista completa em `context.json` | |
