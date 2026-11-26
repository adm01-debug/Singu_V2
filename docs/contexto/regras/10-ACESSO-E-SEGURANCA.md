# 10 · ACESSO E SEGURANÇA — quem pode o quê

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `e6a9b2af9c` · branch `main` · 2026-11-26 13:39 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Perfis / roles identificados

`admin`, `assistant`, `buyer`, `champion`, `closer`, `comprador`, `contact`, `decision_maker`, `default`, `denied`, `dono`, `employee_of`, `granted`, `hybrid`, `influencer`, `manager`, `moderator`, `other`, `owner`, `papel`, `parent`, `partner`, `role`, `salesperson`, `sdr`, `sponsor`, `subsidiary`, `supplier`, `user`

- Tabelas de perfil/permissão: `sales_team_members`, `campaign_members`, `economic_group_members`, `user_roles`, `permissions`, `role_permissions`
- Colunas de perfil: `ai_chat_messages.role` (text NOT NULL CHECK (role IN ('user','assistant','system','function','tool'))), `contacts.role` (TEXT CHECK (role IN ('owner', 'manager', 'buyer', 'contact', 'decision_maker', 'influencer')) DEFAULT 'contact'), `entity_relationships.role` (public.entity_relationship_role NOT NULL), `sales_team_members.role` (text NOT NULL CHECK (role IN ('sdr','closer','manager','admin'))), `workspace_accounts.is_admin` (bool NOT NULL DEFAULT false), `economic_group_members.role` (text DEFAULT 'member'::text), `salespeople.role` (public.salesperson_role NOT NULL DEFAULT 'hybrid'), `user_roles.role` (app_role NOT NULL), `role_permissions.role` (app_role NOT NULL), `chat_messages.role` (TEXT NOT NULL CHECK (role IN ('user','assistant')))
- Claims do JWT usados em políticas/funções: `aal`
- Funções usadas dentro de políticas RLS (a regra real está no corpo delas — veja `06`): `has_role`, `user_can_access_contact`

## Matriz tabela × operação → quem pode (derivada das políticas RLS)

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `_dormant.inactivity_alerts` | enabled | authenticated: (contact_id IS NOT NULL OR company_id IS NOT NULL) AND (contact_id IS NULL OR EXISTS (SELECT 1 FROM public.contacts c WHERE c | — | — | — |
| `_fk_orphans` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `_migration_cdc_checkpoint` | enabled | service_role: true | service_role: true | service_role: true | service_role: true |
| `_migration_schema_snapshot` | enabled | — | — | — | — |
| `_seq_gap_report` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `_stg_pac_nums` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `abm_account_plans` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: auth.uid() = user_id |
| `abm_accounts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `abm_buying_committee` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `abm_campaigns` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `abm_whitespace_opportunities` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `access_blocked_log` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: false | — | — |
| `access_denied_logs` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `access_security_settings` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `achievements` | enabled | public: true | public: true | public: true | public: true |
| `active_power_ups` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `active_sessions` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `activities` | enabled | public: ((select auth.uid()) = user_id)<br>public: true | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `activity_feed` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `activity_goals` | enabled | public: true | public: true | public: true | public: true |
| `ai_chat_messages` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `ai_chat_threads` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `ai_gateway_metrics` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>service_role: true | service_role: true | service_role: true | service_role: true |
| `ai_recommendation_audit_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `ai_recommendation_audit_logs_v2` | enabled | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id) |
| `ai_recommendation_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `ai_tone_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `alert_rules` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `alerts` | enabled | public: auth.uid() = user_id | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `applied_objection_responses` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: auth.uid() = user_id | authenticated: ((select auth.uid()) = user_id) |
| `asia_upload_mapping` | enabled | — | — | — | — |
| `attribution_models_cache` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `attribution_touchpoints` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `audit_log` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | — | — |
| `automation_executions` | enabled | — | — | — | — |
| `automation_logs` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `automation_rules` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `automations` | não encontrado | public: auth.uid() = created_by | public: auth.uid() = created_by | public: auth.uid() = created_by | public: auth.uid() = created_by |
| `available_spins` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `badges` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `battle_cards` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `battle_participants` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `behavioral_insight_feedback` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `behavioral_profile_regen_queue` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — |
| `bitrix24_sync_logs` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `blocked_ips` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `brain_dominance_analysis` | enabled | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid())) | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = brain_dominance_analysis.contact_id AND c.user_id = auth.uid() ) |
| `cadence_enrollments` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `cadence_steps` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `cadence_tasks` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `cadences` | enabled | public: true | public: true | public: true | public: true |
| `calendar_events` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `call_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `campaign_members` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `campaign_recipients` | enabled | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) |
| `campaigns` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `canned_responses` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `carrier_evaluations` | enabled | public: true | public: true | public: true | public: true |
| `carrier_homologations` | enabled | public: true | public: true | public: true | public: true |
| `carrier_qualification_config` | enabled | public: true | public: true | public: true | public: true |
| `carrier_score_history` | enabled | public: true | public: true | public: true | public: true |
| `carrier_scores` | enabled | public: true | public: true | public: true | public: true |
| `carriers` | enabled | public: true | public: true | public: true | public: true |
| `category_metrics` | enabled | public: true | — | — | — |
| `challenge_progress` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `chat_conversations` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `chat_messages` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `churn_predictions` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | sem RLS | sem RLS | sem RLS |
| `churn_risk_scores` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>service_role: true | public: ((select auth.uid()) = user_id)<br>service_role: true |
| `cidades` | enabled | authenticated: true | — | — | — |
| `circuit_breaker_events` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `city_whitelist` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `client_portfolio` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `client_values` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `clients` | enabled | public: true | public: true | public: true | public: true |
| `cnaes` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `coaching_scorecards` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cognitive_bias_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `collectible_badges` | enabled | public: true | public: true | public: true | public: true |
| `commission_rules` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `commissions` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `communication_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `companies` | enabled | public: ((select auth.uid()) = user_id)<br>public: true<br>public: true<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>public: true<br>public: true<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>public: true<br>public: true<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>public: true<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) |
| `company_addresses` | enabled | public: true<br>public: true | public: true | public: true | public: true |
| `company_cadences` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `company_cnaes` | enabled | public: true | public: true | public: true | public: true |
| `company_emails` | enabled | public: true<br>public: true | public: true | public: true | public: true |
| `company_phones` | enabled | public: true<br>public: true | public: true | public: true | public: true |
| `company_rfm_scores` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `company_social_media` | enabled | public: true | public: true | public: true | public: true |
| `company_stakeholder_map` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `compatibility_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `compatibility_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `competitive_chat_messages` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `competitive_seasons` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `competitors` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `config_regras_negocio` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `connection_anomalies` | enabled | public: has_role((select auth.uid()), 'admin'::app_role) | service_role: true | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) |
| `connection_configs` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `connection_quotas` | enabled | public: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (EXISTS ( SELECT 1 FROM incoming_webhooks w WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = (select auth.uid | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) |
| `connection_test_logs` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — | — |
| `connector_log` | enabled | authenticated: EXISTS (SELECT 1 FROM zapp_history.admin_grants g WHERE g.user_id = auth.uid()) | — | — | — |
| `contact_addresses` | enabled | public: true | public: true | public: true | public: true |
| `contact_analytical_profile_versions` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | — | — |
| `contact_analytical_profiles` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_automation_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_behavior` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true |
| `contact_business_context` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true |
| `contact_cadence` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_cadence_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contact_decision_making` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true |
| `contact_emails` | enabled | public: true<br>public: true | public: true | public: true | public: true |
| `contact_family_history` | enabled | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | — | — |
| `contact_influence` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true |
| `contact_metaprograms` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true |
| `contact_next_actions` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_notes` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `contact_objection_scripts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `contact_personality` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_rol<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) O<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) O<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) O<br>authenticated: true |
| `contact_phones` | enabled | public: true<br>public: true<br>authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del | public: true<br>authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del | public: true<br>authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del | public: true<br>authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del |
| `contact_predictive_roadmap` | enabled | public: ((select auth.uid()) = user_id)<br>public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = (select auth.uid())) OR (<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) |
| `contact_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_preferences_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contact_rapport_strategy` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true |
| `contact_relatives` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_relatives_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contact_report_overrides` | enabled | public: ((select auth.uid()) IS NOT NULL) | public: ((select auth.uid()) IS NOT NULL) | public: ((select auth.uid()) IS NOT NULL) | — |
| `contact_social_media` | enabled | public: true | public: true | public: true | public: true |
| `contact_time_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_time_analysis_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contacts` | enabled | public: ((select auth.uid()) = user_id)<br>public: true<br>public: true | public: ((select auth.uid()) = user_id)<br>public: true<br>public: true | public: ((select auth.uid()) = user_id)<br>public: true<br>public: true | public: ((select auth.uid()) = user_id)<br>public: true |
| `conversation_analyses` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `conversation_topics_catalog` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `conversational_search_cache` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `coop_sistemas` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `crm_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `crm_automation_logs` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `crm_automation_reprocess_queue` | enabled | public: ((select auth.uid()) IN ( SELECT crm_automation_logs.user_id FROM crm_automation_logs WHERE (crm_automation_logs.id = crm_automation | — | — | — |
| `crm_cadence_rules` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `crm_consent_audit_logs` | enabled | public: auth.uid() = user_id | public: ((select auth.uid()) = user_id) | — | — |
| `crm_metric_overrides` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `crm_objection_intelligence` | enabled | public: ((select auth.role()) = 'authenticated'::text)<br>public: ((select auth.role()) = 'authenticated'::text)<br>public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = crm_objection_intelligence.contact_id) AND ((c.user_id = (select auth.uid())) OR (<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text)<br>public: ((select auth.role()) = 'authenticated'::text) | public: ((select auth.role()) = 'authenticated'::text)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text)<br>public: ((select auth.role()) = 'authenticated'::text) | public: ((select auth.role()) = 'authenticated'::text)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text)<br>public: ((select auth.role()) = 'authenticated'::text) | public: ((select auth.role()) = 'authenticated'::text)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text)<br>public: ((select auth.role()) = 'authenticated'::text) |
| `crm_relationship_audit_logs` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `cron_secrets` | enabled | service_role: true | service_role: true | service_role: true | service_role: true |
| `cs_accounts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cs_health_signals` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cs_nps_responses` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cs_qbrs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cs_renewals` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `csat_surveys` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: public_token IS NOT NULL AND (expires_at IS NULL OR expires_at > now())<br>anon, authenticated: public_token IS NOT NULL<br>authenticated: (SELECT auth.uid()) = user_id | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id | public: ((select auth.uid()) = user_id)<br>anon, authenticated: public_token IS NOT NULL AND status = 'sent' AND (expires_at IS NULL OR expires_at > now())<br>anon: public_token IS NOT NULL AND status = 'pending'<br>authenticated: (SELECT auth.uid()) = user_id | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id |
| `custom_field_values` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: user_id IS NULL OR user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id |
| `custom_fields` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: user_id IS NULL OR user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id |
| `customer_ownership_history` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `customer_purchases` | enabled | — | — | — | — |
| `customer_rotation_state` | enabled | — | — | — | — |
| `customer_sdr_history` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `customers` | enabled | public: true<br>public: true | public: true | public: true | public: true |
| `daily_challenge_progress` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `daily_challenges` | enabled | public: true | public: true | public: true | public: true |
| `daily_metrics` | enabled | public: true | — | — | — |
| `daily_streak_achievements` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `dashboard_layouts` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `data_quality_audits` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `data_retention_policies` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true |
| `deal_chat_history` | enabled | public: true | public: true | public: true | public: true |
| `deal_competitors` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `deal_forecasts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_outcomes` | enabled | public: true | public: true | public: true | public: true |
| `deal_room_activities` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: actor_side = 'buyer' AND activity_type = 'view' AND EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND  | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_comments` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_documents` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_milestones` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_stakeholders` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_rooms` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: share_enabled = true | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: share_enabled = true | public: ((select auth.uid()) = user_id) |
| `deal_stage_history` | enabled | public: true | public: true | public: true | public: true |
| `deal_velocity_analysis` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | sem RLS | sem RLS | sem RLS |
| `deals` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `decision_criteria` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `demand_forecasts` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `device_login_notifications` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `digital_signatures` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `disc_analysis_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `disc_analysis_history_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `disc_communication_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `disc_conversion_metrics` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `disc_profile_config` | enabled | authenticated: true<br>service_role: true | service_role: true | service_role: true | service_role: true |
| `disc_templates` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `document_signatures` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `document_signers` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `document_templates` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `document_views` | enabled | public: (EXISTS ( SELECT 1 FROM document_signatures s WHERE ((s.id = document_views.signature_id) AND (s.user_id = (select auth.uid()))))) | authenticated: false | — | — |
| `documents` | enabled | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id | public: ((select auth.uid()) = user_id)<br>public: auth.uid() = user_id |
| `economic_group_members` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `economic_groups` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `email_campaigns` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_finder_results` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_logs` | enabled | public: true | public: true | — | — |
| `email_thread_summaries` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_tracking_events` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `email_verifications` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `embedding_configs` | enabled | authenticated: true | authenticated: true | authenticated: true | authenticated: true |
| `emotional_anchors` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `emotional_states_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `entity_relationships` | enabled | authenticated: created_by = auth.uid() | authenticated: ((select auth.uid()) IS NOT NULL) | authenticated: ((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role)) | authenticated: ((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role)) |
| `entity_versions` | enabled | public: true | — | — | — |
| `eq_analysis_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `error_logs` | enabled | public: has_role((select auth.uid()), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL AND user_id = auth.uid() | — | authenticated: public.has_role(auth.uid(), 'admin') |
| `estados` | enabled | authenticated: true | — | — | — |
| `external_data_audit_log` | enabled | public: public.has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `favorite_templates` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `favorites` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `feature_flags` | enabled | authenticated: true | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `feed_comments` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `feed_reactions` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `ficha360_conversation_summaries` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `follow_up_approvals` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) |
| `follow_up_approvals_v2` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) |
| `forecast_categories_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `forecast_periods` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `forecast_quota_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `forecast_snapshots` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `form_submissions` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.is_published = true AND f.user_id = form_submissions.user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `forms` | enabled | public: ((select auth.uid()) = user_id)<br>public: is_published = true<br>anon, authenticated: is_published = true | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: is_published = true | public: ((select auth.uid()) = user_id) |
| `geo_allowed_countries` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `grupos_economicos` | enabled | public: true | public: true | public: true | public: true |
| `guardrail_ml_logs` | enabled | authenticated: true | authenticated: true | — | — |
| `handoff_requests` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true |
| `health_alert_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `health_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `hidden_objections` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `icp_data` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `inactivity_alerts` | enabled | — | — | — | — |
| `incoming_webhook_dlq` | enabled | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) |
| `incoming_webhook_logs` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: false | — | — |
| `incoming_webhook_nonces` | enabled | service_role: true | service_role: true | service_role: true | service_role: true |
| `incoming_webhooks` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `insights` | enabled | public: ((select auth.uid()) = user_id)<br>public: true | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `integrations` | enabled | — | — | — | — |
| `intent_scores` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `intent_signals` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `intent_tracking_pixels` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `interaction_summaries` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `interaction_templates` | não encontrado | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) | authenticated: user_id = (SELECT auth.uid()) |
| `interactions` | enabled | public: ((select auth.uid()) = user_id)<br>public: true<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: true<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) |
| `interactions_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `inventory_levels` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `ip_whitelist` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `knowledge_base_articles` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `known_devices` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `kudos` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `lalamove_dead_letter` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `lalamove_drivers` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `lalamove_position_log` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `lalamove_route_cache` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `landing_page_submissions` | enabled | authenticated: ((select auth.uid()) = user_id) | anon, authenticated: EXISTS (SELECT 1 FROM public.landing_pages lp WHERE lp.id = landing_page_id AND lp.is_published = true AND lp.user_id = | — | — |
| `landing_pages` | enabled | authenticated: ((select auth.uid()) = user_id)<br>anon, authenticated: is_published = true<br>anon, authenticated: is_published = true | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `lead_assignments` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true |
| `lead_magnet_downloads` | enabled | public: ((select auth.uid()) = user_id) | public: EXISTS (SELECT 1 FROM public.lead_magnets m WHERE m.id = magnet_id AND m.is_published = true AND m.user_id = lead_magnet_downloads.u | — | — |
| `lead_magnets` | enabled | public: ((select auth.uid()) = user_id)<br>public: is_published = true | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: is_published = true | public: ((select auth.uid()) = user_id) |
| `lead_routing_log` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `lead_routing_rules` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true |
| `lead_score_config` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: (SELECT auth.uid()) = user_id<br>service_role: true |
| `lead_score_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `lead_score_recompute_queue` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `lead_score_rules` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lead_score_threshold_automations` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lead_score_threshold_log` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `lead_score_thresholds` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lead_scores` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | public: ((select auth.uid()) = user_id)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true |
| `lead_sources` | não encontrado | public: true | sem RLS | sem RLS | sem RLS |
| `life_events` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `life_events_history` | enabled | authenticated: ((select auth.uid()) = user_id) | — | — | — |
| `login_alerts` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `login_attempts` | enabled | authenticated: (user_id = (select auth.uid()))<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | service_role: true | — | — |
| `loss_reasons` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `lux_intelligence` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lux_webhook_config` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true | authenticated: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (SELECT auth.uid()) = user_id<br>service_role: true |
| `marketing_campaign_stats` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `marketing_roi_data` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `mcp_tool_calls` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | service_role: true | — | — |
| `meeting_summaries` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `meetings` | não encontrado | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `message_templates` | enabled | — | — | — | — |
| `metaprogram_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `mfa_verification_attempts` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `migration_password_reset_log` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | — | — | — |
| `model_pricing_v2` | enabled | authenticated: true | — | — | — |
| `mql_classifications` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `mql_criteria` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `neuro_behavioral_history` | enabled | — | public: auth.uid() = user_id | — | — |
| `neuro_pnl_sessions` | enabled | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) OR | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = neuro_pnl_sessions.contact_id AND c.user_id = auth.uid() ) |
| `nlp_extractions` | enabled | authenticated: true | authenticated: true | — | — |
| `nlp_feedback` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `notification_logs` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `notification_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `notifications` | enabled | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id |
| `nurturing_enrollments` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `nurturing_executions` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `nurturing_workflows` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `oauth_tokens` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| … +202 linhas — lista completa em `context.json` | | | | | |

> `—` com RLS ligado = ninguém além de service_role. `sem RLS` = qualquer chave anon lê/escreve tudo.

## Onde o RLS é IGNORADO (service_role) — 432 arquivo(s)

- `scripts/ai-context/cenarios.mjs`
- `scripts/ai-context/gerar.unit.mjs`
- `scripts/check_unified_comm.sql`
- `scripts/gen-supabase-types.mjs`
- `scripts/gen-supabase-types.test.mjs`
- `scripts/hardening/_pg-teste.mjs`
- `scripts/inventario/gerar-banco.mjs`
- `scripts/lib/mgmt-mock.test.mjs`
- `scripts/lib/sql-split.test.mjs`
- `scripts/migration/cdc/checkpoint.sql`
- `scripts/migration/cdc/replay.ts`
- `scripts/migration/cdc/replay_test.ts`
- `scripts/migration/compliance/lgpd-snapshot.ts`
- `scripts/migration/compliance/lgpd-snapshot_test.ts`
- `scripts/migration/ddl/05_grants.sql`
- `scripts/migration/ddl/07_policies.sql`
- `scripts/migration/ddl/08_functions.sql`
- `scripts/migration/ddl/tests/migrations-preamble.sql`
- `scripts/migration/ddl/tests/supabase-stubs.sql`
- `scripts/migration/reset-passwords.ts`
- `scripts/migration/reset-passwords_test.ts`
- `scripts/migration/sql/create-reset-log.sql`
- `scripts/migration/sql/sql.test.mjs`
- `scripts/migration/storage/_lib.ts`
- `scripts/migration/storage/_lib_test.ts`
- `scripts/migration/storage/copy-large.ts`
- `scripts/migration/storage/copy-large_test.ts`
- `scripts/migration/storage/copy-objects.ts`
- `scripts/migration/storage/copy-objects_test.ts`
- `scripts/migration/storage/create-buckets.ts`
- `scripts/migration/storage/create-buckets_test.ts`
- `scripts/migration/storage/list-buckets.ts`
- `scripts/migration/storage/verify-counts.ts`
- `scripts/migration/storage/verify-counts_test.ts`
- `scripts/migration/tests/lib/fixture-roles.sql`
- `scripts/migration/verify/dual-write-diverge.ts`
- `scripts/migration/verify/dual-write-diverge_test.ts`
- `scripts/migration/verify/grants-parity.sql`
- `scripts/migration/verify/statement-timeout-audit.sql`
- `scripts/migration/verify/storage-bytes.ts`
- `scripts/migration/verify/storage-bytes_test.ts`
- `scripts/migration/verify/storage-public-guard.ts`
- `scripts/recreate_data_health_view.sql`
- `scripts/recreate_unified_comm.sql`
- `scripts/regras_negocio/generate.py`
- `scripts/regras_negocio/test_generate_fatos.py`
- `scripts/sql-raiz.test.mjs`
- `scripts/supabase_snapshot/snapshot.py`
- `scripts/supabase_snapshot/test_snapshot_pg.py`
- `scripts/supabase_snapshot/test_snapshot_seguranca.py`
- `src/components/admin/conexoes/ConnectionFormDialog.tsx`
- `supabase/functions/_shared/aiGatewayLogger.ts`
- `supabase/functions/_shared/auth.ts`
- `supabase/functions/_shared/auth_test.ts`
- `supabase/functions/_shared/behavioral-retry-contract_test.ts`
- `supabase/functions/_shared/edge-test-harness.ts`
- `supabase/functions/_shared/evolution-ownership-contract_test.ts`
- `supabase/functions/_shared/fetch-utils.ts`
- `supabase/functions/_shared/lead-score-threshold-runner_test.ts`
- `supabase/functions/_shared/sdk-runtime-contract_test.ts`
- `supabase/functions/_shared/sequence-contract_test.ts`
- `supabase/functions/_shared/validation-contract_test.ts`
- `supabase/functions/_shared/validation-owner.ts`
- `supabase/functions/abm-account-scorer/index.ts`
- `supabase/functions/abm-whitespace-analyzer/index.ts`
- `supabase/functions/ai-assistant/index.ts`
- `supabase/functions/ask-crm/index.ts`
- `supabase/functions/attribution-calculator/index.ts`
- `supabase/functions/audit-analytics/index.ts`
- `supabase/functions/auto-rebatch-behavioral/index.ts`
- `supabase/functions/auto-regen-behavioral-profiles/index.ts`
- `supabase/functions/bitrix24-webhook/index.ts`
- `supabase/functions/bulk-revalidate/index.ts`
- `supabase/functions/check-health-alerts/index.ts`
- `supabase/functions/check-notifications/index.ts`
- `supabase/functions/clear-must-reset-flag/index.ts`
- `supabase/functions/client-notifications/index.ts`
- `supabase/functions/connection-anomaly-detector/index.ts`
- `supabase/functions/connection-introspect/index.ts`
- `supabase/functions/connection-tester/index.ts`
- `supabase/functions/connection-tester/index_test.ts`
- `supabase/functions/conversation-analyzer/index.ts`
- `supabase/functions/conversation-coaching-digest/index.ts`
- `supabase/functions/conversational-search/index.ts`
- `supabase/functions/crm-automation-monitor/index.ts`
- `supabase/functions/cs-health-recalc/index.ts`
- `supabase/functions/deal-room-buyer-view/index.ts`
- `supabase/functions/deal-room-health/index.ts`
- `supabase/functions/deal-room-share/index.ts`
- `supabase/functions/detect-churn-risk/index.ts`
- `supabase/functions/detect-new-device/index.ts`
- `supabase/functions/disc-analyzer/index.ts`
- `supabase/functions/dual-write-proxy/index.ts`
- `supabase/functions/email-finder/index.ts`
- `supabase/functions/enrich-contacts/index.ts`
- `supabase/functions/error-budget/index.ts`
- `supabase/functions/evolution-api/index.ts`
- `supabase/functions/evolution-bitrix-connector/index.ts`
- `supabase/functions/evolution-webhook/helpers.ts`
- `supabase/functions/evolution-webhook/index.ts`
- `supabase/functions/external-data/actor-writes_test.ts`
- `supabase/functions/external-data/audit.ts`
- `supabase/functions/external-data/database.ts`
- `supabase/functions/external-data/index.ts`
- `supabase/functions/ficha360-conversation-summary/index.ts`
- `supabase/functions/forecast-analyzer/index.ts`
- `supabase/functions/forecast-narrative/index.ts`
- `supabase/functions/forecast-snapshot-cron/index.ts`
- `supabase/functions/form-submit-handler/index.ts`
- `supabase/functions/generate-behavioral-profile/index.ts`
- `supabase/functions/generate-insights/index.ts`
- `supabase/functions/generate-offer-suggestions/index.ts`
- `supabase/functions/get-signature/index.ts`
- `supabase/functions/health-aggregate/index.ts`
- `supabase/functions/health/index.ts`
- `supabase/functions/incoming-webhook/index.ts`
- `supabase/functions/intent-aggregator/index.ts`
- `supabase/functions/intent-tracker/index.ts`
- `supabase/functions/lead-score-cron/index.ts`
- `supabase/functions/lead-score-threshold-runner/index.ts`
- `supabase/functions/lead-scorer/index.ts`
- `supabase/functions/lux-trigger/index.ts`
- `supabase/functions/lux-webhook/index.ts`
- `supabase/functions/mcp-server/index.ts`
- `supabase/functions/mql-evaluator/index.ts`
- `supabase/functions/next-best-action/index.ts`
- `supabase/functions/nurturing-runner/index.ts`
- `supabase/functions/objection-handler/index.ts`
- `supabase/functions/process-behavioral-regen-queue/index.ts`
- `supabase/functions/process-webhook-dlq/index.ts`
- `supabase/functions/retry-behavioral-profile/index.ts`
- `supabase/functions/revops-snapshot-builder/index.ts`
- `supabase/functions/rfm-analyzer/index.ts`
- `supabase/functions/send-push-notification/index.ts`
- `supabase/functions/send-sms-campaign/index.ts`
- `supabase/functions/sequence-processor/index.ts`
- `supabase/functions/sequence-track/index.ts`
- `supabase/functions/smart-notify/index.ts`
- `supabase/functions/smart-notify/notification_state_test.ts`
- `supabase/functions/smart-notify/provider_config_test.ts`
- `supabase/functions/smart-reminders/index.ts`
- `supabase/functions/social-events-detector/index.ts`
- `supabase/functions/submit-signature/index.ts`
- `supabase/functions/suggest-next-action/index.ts`
- `supabase/functions/sync-product-catalog/index.ts`
- `supabase/functions/sync-social-interests/index.ts`
- `supabase/functions/system-health/index.ts`
- `supabase/functions/template-success-notifications/index.ts`
- `supabase/functions/territory-optimization/index.ts`
- `supabase/functions/validate-access/index.ts`
- … +282 (lista completa em `context.json`)

## Funções SQL `SECURITY DEFINER` (rodam com privilégio do dono, ignoram RLS)

- `_connection_encryption_key`
- `activate_v6_enforcement`
- `add_item_to_deal`
- `add_tag`
- `aggregate_nlp_to_company`
- `alert_churn_critical`
- `alert_urgent_order_via_bitrix`
- `apply_retention_policies`
- `assert_alert_access`
- `assert_cadence_access`
- `assert_company_access`
- `assert_contact_access`
- `assert_customer_access`
- `assert_deal_access`
- `assert_event_access`
- `assert_goal_access`
- `assert_interaction_access`
- `assert_note_access`
- `assert_notification_access`
- `assert_opportunity_access`
- `assert_proposal_access`
- `assert_reminder_access`
- `assert_self_user_id`
- `assert_task_access`
- `assert_violation_access`
- `assert_visit_access`
- `audit_connection_changes`
- `audit_dashboard_v13`
- `audit_life_events`
- `audit_trigger_fn`
- `auto_ack_stale_mtta_sla_breaches`
- `auto_enrich_contact`
- `auto_resolve_ai_gateway_alerts`
- `auto_tag_contact_from_nlp`
- `bulk_add_tag`
- `bulk_update_companies`
- `bulk_update_status`
- `buyer_add_comment`
- `buyer_toggle_milestone`
- `calculate_bant_score`
- `calculate_conversion_probability`
- `calculate_interaction_response_time`
- `calculate_lead_score`
- `calculate_next_contact_due`
- `check_behavioral_regen_cron_staleness`
- `check_mtta_auto_ack_heartbeat`
- `cleanup_cron_job_run_details`
- `cleanup_old_data`
- `cleanup_old_health_snapshots`
- `cleanup_rpc_perf_samples`
- `cleanup_simulated_alerts`
- `clone_company`
- `clone_workflow_setup`
- `complete_reminder`
- `compute_attribution`
- `compute_revops_kpis`
- `confirm_sequence_manual_step`
- `connection_configs_encrypt_trigger`
- `connector_log_search`
- `create_economic_group`
- `create_notification`
- `create_smart_reminder`
- `create_template`
- `create_webhook`
- `dashboard_summary`
- `decrypt_connection_config`
- `definir_como_filial`
- `definir_hierarquia_cooperativa`
- `detect_contact_intel_changes`
- `detect_relationship_status`
- `dismiss_revops_alert`
- `dispatch_social_sync`
- `drop_old_ai_gateway_metrics_partitions`
- `encrypt_connection_config`
- `enqueue_behavioral_profile_regen`
- `enqueue_contact_validation`
- `enqueue_smart_notification`
- `enqueue_social_sync`
- `enroll_contact_in_workflow`
- `ensure_ai_gateway_metrics_partition`
- `ensure_audit_log_partition`
- `estimate_cost`
- `evaluate_ai_gateway_alerts`
- `evaluate_mql`
- `find_cheapest_model`
- `fn_apply_auto_tag_rules`
- `fn_cf_collect_sm_legacy_dispatch`
- `fn_cf_collect_sm_legacy_harvest`
- `fn_get_product_ai_context`
- `fn_ingest_asia_hg_batch`
- `fn_promote_kit_components_batch`
- `fn_set_novelty_updated_at`
- `fn_sm_promote_images_to_gold`
- `fn_sync_novelty_to_product`
- `fn_valida_dominio_signup`
- `gc_zombie_messages`
- `generate_daily_digest`
- `generate_pre_contact_briefing`
- `generate_rapport_suggestions`
- `get_ai_gateway_health`
- `get_ai_gateway_partition_stats`
- `get_behavioral_regen_cron_health`
- `get_companies_by_phones_batch`
- `get_config`
- `get_connection_metrics`
- `get_contact_360_by_phone`
- `get_contact_intelligence_by_phone`
- `get_contact_intelligence_v2`
- `get_contact_messages_for_summary`
- `get_contact_sidebar_by_phone`
- `get_contacts_with_activity`
- `get_conversation_intelligence`
- `get_duplicate_contacts`
- `get_full_intelligence_report`
- `get_instant_kpis`
- `get_marketing_funnel_stats`
- `get_notification_summary`
- `get_playbook_for_message`
- `get_public_csat_survey`
- `get_ragas_avg`
- `get_runtime_secret`
- `get_score_explicability`
- `get_system_config_num`
- `get_team_member_ids`
- `guard_contact_relation_write`
- `handle_new_user`
- `has_role`
- `health_check`
- `increment_landing_page_view`
- `increment_playbook_usage`
- `increment_version_column`
- `increment_webhook_quota`
- `ingest_evolution_event`
- `invoke_edge_function`
- `log_activity`
- `log_behavioral_change`
- `log_contact_tag_changes`
- `log_deal_forecast_category_change`
- `mark_deal_lost`
- `master_dashboard`
- `merge_companies`
- `merge_contacts`
- `merge_duplicate_companies`
- `merge_duplicate_contacts`
- `merge_records_atomically`
- `move_deal`
- `move_deal_atomic`
- `move_deal_to_stage`
- `move_to_pipeline_stage`
- `multiplix_count_audience`
- `multiplix_list_ramos`
- `multiplix_list_ufs`
- `multiplix_resolve_recipients`
- `multiplix_search_audience`
- `notify_admins_on_critical_behavioral_alert`
- `notify_connection_failures`
- `notify_critical_next_action`
- `notify_webhook_errors`
- `onboard_new_company`
- `parse_connector_log_to_messages`
- `process_contact_cadence_audit`
- `process_contact_preferences_audit`
- `process_contact_relatives_audit`
- `process_contact_time_analysis_audit`
- `process_disc_analysis_audit`
- `process_interactions_audit`
- `process_reframing_audit`
- `publish_mtta_sla_breach_alert`
- `recalculate_rfm_for_company`
- `reconcile_nlp_responses`
- `record_family_history`
- `record_nps_response`
- `record_rpc_perf_sample`
- `refresh_contact_stats`
- `refresh_daily_kpis`
- `refresh_daily_stats`
- `remove_company_tag`
- `remove_tag`
- `reprocess_connector_log`
- `request_classify`
- `request_embedding`
- `request_nlp`
- `request_transcription`
- `requeue_social_sync_stuck`
- `reset_daily_lead_counts`
- `resolve_alerts_batch`
- `resolve_company_from_cnpj`
- `respond_to_proposal`
- `restore_company`
- `rollback_v6_enforcement`
- `search_companies_semantic`
- `search_contact_messages_semantic`
- `search_contacts_advanced`
- `search_contacts_by_nlp`
- `search_contacts_semantic`
- `search_interactions_semantic`
- `search_messages_hybrid`
- `search_messages_hybrid_v2`
- `seed_conversation_topics`
- `seed_deal_room`
- `seed_forecast_period`
- `seed_playbook_defaults`
- `seed_win_loss_defaults`
- `sequence_event_to_intent_signal`
- `sequence_pause_on_interaction_reply`
- `simulate_behavioral_regen_alert`
- `singu_delete`
- `singu_insert`
- `singu_query`
- `singu_update`
- `smart_routing`
- `soft_delete_company`
- `soft_delete_contact`
- `submit_public_csat_survey`
- `submit_public_form`
- `sync_contact_last_interaction`
- `sync_interaction_from_zapp`
- `sync_message_nlp_to_interaction`
- `sync_nlp_to_contact`
- `sync_social_insight_from_analysis`
- `sync_summary_to_interaction`
- `tg_mprl_touch_updated_at`
- `track_magnet_download`
- `trg_auto_enqueue_transcription`
- `trg_auto_request_embedding`
- `trg_calculate_lead_score`
- `trg_connector_log_dedup`
- `trg_connector_log_rate_limit`
- `trg_connector_log_validate_secret`
- `trg_detect_content_flood`
- `trg_periodic_reconcile`
- `trg_set_priority_quadrant`
- `trg_set_response_window`
- `trg_set_technical_interest`
- `trg_short_message_auto_process`
- `trg_spam_quarantine`
- `trg_supplement_urgency`
- `trg_sync_summary_to_interaction`
- `trg_update_response_time`
- `trigger_aggregate_nlp_to_company`
- `trigger_backfill_summaries`
- `trigger_lead_score_recompute`
- `update_company_partial`
- `update_company_status`
- `update_deal_amount`
- `update_deal_status`
- `upsert_company`
- `upsert_company_google_maps`
- `user_can_access_contact`
- `vincular_empresa_grupo`
- `webhook_log_message`

## Edge functions públicas (sem JWT — qualquer um chama)

- `auto-rebatch-behavioral`
- `auto-regen-behavioral-profiles`
- `bitrix24-webhook`
- `check-health-alerts`
- `check-notifications`
- `client-notifications`
- `cs-health-recalc`
- `deal-room-buyer-view`
- `dual-write-proxy`
- `evolution-bitrix-connector`
- `evolution-webhook`
- `forecast-snapshot-cron`
- `form-submit-handler`
- `generate-behavioral-profile`
- `get-signature`
- `incoming-webhook`
- `intent-pixel-snippet`
- `intent-tracker`
- `lead-score-cron`
- `lux-webhook`
- `mcp-server`
- `mql-evaluator`
- `nurturing-runner`
- `process-behavioral-regen-queue`
- `process-webhook-dlq`
- `retry-behavioral-profile`
- `revops-snapshot-builder`
- `send-sms-campaign`
- `sequence-processor`
- `sequence-track`
- `smart-notify`
- `social-events-detector`
- `submit-signature`
- `sync-product-catalog`
- `sync-social-interests`
- `template-success-notifications`
- `validation-queue-worker`
- `weekly-digest`

## Rotas protegidas no front

| Rota | Guard | Roles | Arquivo |
|---|---|---|---|
| / | Protected |  | `scripts/inventario/gerar-rotas.test.mjs` |
| / | Protected |  | `src/app/AppRoutes.tsx` |
| /abm | Protected |  | `src/app/AppRoutes.tsx` |
| /abm/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /abm/campanhas | Protected |  | `src/app/AppRoutes.tsx` |
| /app | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
| /aprovacoes-follow-up | Protected |  | `src/app/AppRoutes.tsx` |
| /assistente | Protected |  | `src/app/AppRoutes.tsx` |
| /automacoes | Protected |  | `src/app/AppRoutes.tsx` |
| /bi | Protected |  | `src/app/AppRoutes.tsx` |
| /cadastro | Protected |  | `src/app/AppRoutes.tsx` |
| /campanhas | Protected |  | `src/app/AppRoutes.tsx` |
| /contatos | Protected |  | `scripts/inventario/gerar-rotas.test.mjs` |
| /contatos/:id | Protected |  | `scripts/inventario/gerar-rotas.test.mjs` |
| /conversation-intelligence | Protected |  | `src/app/AppRoutes.tsx` |
| /conversation-intelligence/setup | Protected |  | `src/app/AppRoutes.tsx` |
| /crm/copywriting | Protected |  | `src/app/AppRoutes.tsx` |
| /customer-success | Protected |  | `src/app/AppRoutes.tsx` |
| /customer-success/account/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /deal-rooms | Protected |  | `src/app/AppRoutes.tsx` |
| /deal-rooms/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /deduplicacao | Protected |  | `src/app/AppRoutes.tsx` |
| /documentos | Protected |  | `src/app/AppRoutes.tsx` |
| /enrichment | Protected |  | `src/app/AppRoutes.tsx` |
| /erp | Protected |  | `src/app/AppRoutes.tsx` |
| /forecasting | Protected |  | `src/app/AppRoutes.tsx` |
| /forecasting/setup | Protected |  | `src/app/AppRoutes.tsx` |
| /grupos-economicos | Protected |  | `src/app/AppRoutes.tsx` |
| /historico | Protected |  | `src/app/AppRoutes.tsx` |
| /inbox | Protected |  | `src/app/AppRoutes.tsx` |
| /intelligence | Protected |  | `src/app/AppRoutes.tsx` |
| /intelligence/auditoria | Protected |  | `src/app/AppRoutes.tsx` |
| /intelligence/relacionamento/auditoria | Protected |  | `src/app/AppRoutes.tsx` |
| /intent | Protected |  | `src/app/AppRoutes.tsx` |
| /intent/setup | Protected |  | `src/app/AppRoutes.tsx` |
| /knowledge-base | Protected |  | `src/app/AppRoutes.tsx` |
| /landing-pages | Protected |  | `src/app/AppRoutes.tsx` |
| /lead-scoring | Protected |  | `src/app/AppRoutes.tsx` |
| /lead-scoring/automations | Protected |  | `src/app/AppRoutes.tsx` |
| /lead-scoring/config | Protected |  | `src/app/AppRoutes.tsx` |
| /mapa-empresas | Protected |  | `src/app/AppRoutes.tsx` |
| /marketing | Protected |  | `src/app/AppRoutes.tsx` |
| /marketing/forms/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /marketing/lead-magnets/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /metas | Protected |  | `src/app/AppRoutes.tsx` |
| /notificacoes | Protected |  | `src/app/AppRoutes.tsx` |
| /notificacoes/configuracoes | Protected |  | `src/app/AppRoutes.tsx` |
| /nps | Protected |  | `src/app/AppRoutes.tsx` |
| /nurturing | Protected |  | `src/app/AppRoutes.tsx` |
| /onboarding | Protected |  | `src/app/AppRoutes.tsx` |
| /perfis-comportamentais | Protected |  | `src/app/AppRoutes.tsx` |
| /performance | Protected |  | `src/app/AppRoutes.tsx` |
| /pipeline | Protected |  | `src/app/AppRoutes.tsx` |
| /playbooks | Protected |  | `src/app/AppRoutes.tsx` |
| /playbooks/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /playbooks/battle-cards/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /relatorio/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /relatorios-customizaveis | Protected |  | `src/app/AppRoutes.tsx` |
| /report-builder | Protected |  | `src/app/AppRoutes.tsx` |
| /revops | Protected |  | `src/app/AppRoutes.tsx` |
| /seguranca | Protected |  | `scripts/inventario/gerar-rotas.test.mjs` |
| /seguranca | Protected |  | `src/app/AppRoutes.tsx` |
| /sequencias | Protected |  | `src/app/AppRoutes.tsx` |
| /sms-marketing | Protected |  | `src/app/AppRoutes.tsx` |
| /suporte | Protected |  | `src/app/AppRoutes.tsx` |
| /tarefas | Protected |  | `src/app/AppRoutes.tsx` |
| /territorios | Protected |  | `src/app/AppRoutes.tsx` |
| /territory-optimization | Protected |  | `src/app/AppRoutes.tsx` |
| /whatsapp | RequireAuth |  | `scripts/inventario/gerar-rotas.test.mjs` |
| /whatsapp | RequireAuth |  | `src/app/AppRoutes.tsx` |
| /whatsapp/importar | Protected |  | `src/app/AppRoutes.tsx` |
| /win-loss | Protected |  | `src/app/AppRoutes.tsx` |
| /win-loss/setup | Protected |  | `src/app/AppRoutes.tsx` |

Guards usados: Protected, ProtectedRoute, RequireAuth

Middleware matcher (Next.js): nenhum

## Grants / Revokes (agrupados por role e privilégio)

| Ação | Para/De | Privilégios | Objetos |
|---|---|---|---|
| grant | PUBLIC, anon | execute | `submit_public_form`, `get_deal_room_by_token`, `record_buyer_view`, `buyer_add_comment`, `buyer_toggle_milestone`, `get_buyer_document_path`, `increment_form_view`, `increment_magnet_view`, `immutable_unaccent` |
| grant | anon | execute | `get_contact_360_by_phone`, `search_contacts_advanced`, `get_companies_by_phones_batch`, `sync_interaction_from_zapp`, `get_contact_intelligence_by_phone`, `recalculate_rfm_for_company`, `get_deal_room_by_token`, `get_buyer_document_path`, `buyer_add_comment`, `buyer_toggle_milestone`, `record_buyer_view`, `submit_public_form`, `track_magnet_download`, `increment_form_view`, `increment_magnet_view` … +1 |
| grant | anon | insert | `deal_room_activities`, `landing_page_submissions`, `landing_page_submissions` |
| grant | anon | select | `csat_surveys`, `document_signatures`, `forms`, `landing_page_submissions`, `landing_pages`, `_dormant`, `deal_rooms`, `deal_room_milestones`, `deal_room_stakeholders`, `deal_room_documents`, `deal_room_comments`, `deal_room_activities`, `deal_room_comments`, `deal_room_documents`, `deal_room_milestones` … +7 |
| grant | anon | select, insert | `deal_room_activities` |
| grant | anon | select, update | `csat_surveys` |
| grant | anon, authenticated | all | `coop003_pending` |
| grant | anon, authenticated | execute | `coop003_batch_update`, `get_deal_room_by_token`, `record_buyer_view`, `buyer_toggle_milestone`, `buyer_add_comment`, `get_buyer_document_path`, `increment_magnet_view`, `track_magnet_download`, `increment_form_view`, `submit_public_form` |
| grant | anon, authenticated | select | `csat_surveys_public`, `forms_public`, `landing_pages_public`, `document_signatures_public`, `product_novelties` |
| grant | anon, authenticated, service_role | execute | `get_public_csat_survey`, `submit_public_csat_survey`, `increment_landing_page_view`, `get_public_csat_survey`, `submit_public_csat_survey` |
| grant | authenticated | execute | `get_contact_360_by_phone`, `search_contacts_advanced`, `get_companies_by_phones_batch`, `sync_interaction_from_zapp`, `get_contact_intelligence_by_phone`, `recalculate_rfm_for_company`, `zapp_history.get_contact_intelligence_v2`, `zapp_history.trigger_backfill_summaries`, `zapp_history.user_can_access_contact`, `zapp_history.get_contact_messages_for_summary`, `zapp_history.get_contact_intelligence_v2`, `zapp_history.trigger_backfill_summaries`, `zapp_history.get_embedding_config`, `zapp_history.detect_pii`, `zapp_history.connector_log_search` … +59 |
| grant | authenticated | select | `_dormant`, `zapp_history`, `connector_log`, `zapp_history.v_runtime_config_safe`, `zapp_history.v_pedidos_detectados`, `zapp_history.v_dashboard_atendimento`, `zapp_history.v_pedidos_detectados`, `zapp_history.v_dashboard_atendimento`, `zapp_history.v_funil_origem`, `zapp_history.v_top_produtos_demanda`, `zapp_history.v_top_produtos_demanda`, `zapp_history.v_funil_vendas`, `zapp_history.v_objecoes_recorrentes`, `zapp_history.v_sla_atendimento`, `zapp_history.v_conversas_aguardando` … +69 |
| grant | authenticated | select, insert | `audit_log`, `rfm_history` |
| grant | authenticated | select, insert, update | `migration_password_reset_log` |
| grant | authenticated | select, insert, update, delete | `abm_account_plans`, `abm_accounts`, `abm_buying_committee`, `abm_campaigns`, `abm_whitespace_opportunities`, `access_blocked_log`, `access_security_settings`, `activities`, `ai_chat_messages`, `ai_chat_threads`, `ai_recommendation_audit_logs`, `ai_recommendation_audit_logs_v2`, `ai_recommendation_logs`, `ai_tone_preferences`, `alerts` … +246 |
| grant | authenticated, service_role | execute | `zapp_history.webhook_log_message`, `zapp_history.health_check`, `zapp_history.get_config`, `zapp_history.ingest_evolution_event`, `zapp_history.request_nlp`, `zapp_history.reconcile_nlp_responses`, `zapp_history.dashboard_summary`, `zapp_history.extract_quantity_from_text`, `zapp_history.extract_deadline_from_text`, `zapp_history.dashboard_summary`, `zapp_history.extract_budget_from_text`, `zapp_history.extract_discovery_channel`, `zapp_history.normalize_product_name`, `zapp_history.extract_objections`, `zapp_history.detect_funnel_stage` … +97 |
| grant | authenticated, service_role | select | `vw_rodizio_carga_closers`, `vw_rodizio_carga_sdrs`, `vw_rodizio_execucoes`, `vw_rodizio_bloqueios`, `vw_rodizio_kpis`, `vw_rodizio_execucoes`, `vw_singu_data_health`, `_dormant.inactivity_alerts` |
| grant | service_role | all | `_migration_cdc_checkpoint`, `abm_account_plans`, `abm_accounts`, `abm_buying_committee`, `abm_campaigns`, `abm_whitespace_opportunities`, `access_blocked_log`, `access_security_settings`, `activities`, `ai_chat_messages`, `ai_chat_threads`, `ai_recommendation_audit_logs`, `ai_recommendation_audit_logs_v2`, `ai_recommendation_logs`, `ai_tone_preferences` … +267 |
| grant | service_role | execute | `zapp_history`, `zapp_history.request_embedding`, `zapp_history.request_transcription`, `zapp_history.request_classify`, `zapp_history.get_runtime_secret`, `increment_webhook_quota`, `execute_readonly_query`, `redistribute_admin_portfolio`, `fn_cf_collect_sm_legacy`, `fn_cf_collect_sm_legacy_dispatch`, `fn_cf_collect_sm_legacy_harvest`, `fn_get_product_ai_context`, `fn_promote_kit_components_batch`, `cleanup_behavioral_regen_queue`, `check_behavioral_regen_cron_staleness` … +100 |
| grant | service_role | insert | `connector_log` |
| grant | service_role | select, insert, delete | `incoming_webhook_nonces`, `incoming_webhook_nonces` |
| grant | service_role, authenticated | execute | `fn_apply_auto_tag_rules`, `ensure_audit_log_partition`, `ensure_audit_log_partition` |
| grant | service_role, authenticated | select | `zapp_history.v_audit_intelligence` |
| revoke | PUBLIC | all | `_migration_schema_snapshot`, `zapp_history.get_runtime_secret`, `get_connection_metrics`, `cleanup_behavioral_regen_queue`, `cleanup_simulated_alerts`, `assert_self_user_id`, `assert_self_user_id`, `assert_deal_access`, `assert_event_access`, `assert_interaction_access`, `assert_note_access`, `assert_reminder_access`, `assert_task_access`, `assert_self_user_id`, `assert_self_user_id` … +21 |
| revoke | PUBLIC | execute | `execute_readonly_query`, `handle_new_user`, `publish_mtta_sla_breach_alert`, `execute_readonly_query`, `claim_validation_batch`, `claim_regen_batch`, `net`, `net`, `update_company_fields`, `update_company_fields` |
| revoke | PUBLIC | select | `mv_daily_kpis`, `mv_daily_stats`, `mv_daily_kpis`, `mv_daily_stats` |
| revoke | PUBLIC, anon | all | `fn_apply_auto_tag_rules`, `auto_ack_stale_mtta_sla_breaches`, `get_system_config_num`, `assert_company_access`, `assert_contact_access`, `assert_deal_access`, `assert_event_access`, `assert_interaction_access`, `assert_note_access`, `assert_reminder_access`, `assert_task_access`, `assert_visit_access`, `assert_notification_access`, `assert_proposal_access`, `assert_goal_access` … +48 |
| revoke | PUBLIC, anon | execute | `ensure_audit_log_partition`, `ensure_audit_log_partition`, `get_ai_gateway_health`, `has_role`, `ativar_cliente`, `inativar_cliente`, `transferir_cliente`, `registrar_compra`, `sdr_qualificar_cliente`, `search_companies`, `search_contacts` |
| revoke | PUBLIC, anon, authenticated | all | `_connection_encryption_key`, `fn_get_product_ai_context`, `fn_promote_kit_components_batch`, `check_mtta_auto_ack_heartbeat`, `assert_alert_access`, `assert_cadence_access`, `assert_company_access`, `assert_contact_access`, `assert_customer_access`, `assert_deal_access`, `assert_event_access`, `assert_goal_access`, `assert_interaction_access`, `assert_note_access`, `assert_notification_access` … +101 |
| revoke | PUBLIC, anon, authenticated | execute | `evaluate_ai_gateway_alerts`, `set_updated_at`, `trg_normalizar_telefone`, `trg_normalizar_email`, `singu_sync_company_address`, `singu_sync_legacy_company_name` |
| revoke | PUBLIC, anon, authenticated | truncate, references, trigger | `public` |
| revoke | PUBLIC, anon, authenticated | update | `validation_queue`, `behavioral_profile_regen_queue` |
| revoke | PUBLIC, anon, authenticated, service_role | all | `guard_contact_relation_write` |
| revoke | PUBLIC, anon, service_role | all | `resume_sequence_email`, `merge_records_atomically`, `merge_records_atomically` |
| revoke | PUBLIC, authenticated | all | `cron_secrets` |
| revoke | PUBLIC, authenticated | execute | `ativar_cliente`, `inativar_cliente`, `registrar_compra`, `sdr_qualificar_cliente`, `transferir_cliente` |
| revoke | PUBLIC, authenticated | insert, update, delete | `login_attempts` |
| revoke | PUBLIC, authenticated, anon | execute | `public` |
| revoke | anon | all | `_dormant`, `public`, `assert_self_user_id`, `assert_self_user_id`, `public`, `assert_self_user_id`, `assert_self_user_id`, `get_contact_sidebar_by_phone`, `get_contact_sidebar_by_phone`, `public`, `public`, `get_contact_sidebar_by_phone`, `sync_social_insight_from_analysis` |
| revoke | anon | execute | `execute_readonly_query`, `handle_new_user`, `publish_mtta_sla_breach_alert`, `execute_readonly_query`, `net`, `create_deal`, `fn_cf_collect_sm_legacy_dispatch`, `fn_cf_collect_sm_legacy_harvest`, `fn_ingest_asia_hg_batch`, `fn_set_novelty_updated_at`, `fn_sm_promote_images_to_gold`, `fn_sync_novelty_to_product`, `net`, `check_behavioral_regen_cron_staleness`, `cleanup_behavioral_regen_queue` … +6 |
| revoke | anon | insert, update, delete | `deal_rooms`, `deal_room_milestones`, `deal_room_stakeholders`, `deal_room_documents`, `deal_room_comments`, `forms`, `lead_magnets`, `landing_pages` |
| revoke | anon | select | `document_signatures_public`, `csat_surveys_public` |
| revoke | anon | select, insert, update, delete | `form_submissions`, `lead_magnet_downloads`, `deal_room_activities` |
| revoke | anon | select, update, delete | `landing_page_submissions` |
| revoke | anon | update, delete | `deal_room_activities` |
| revoke | anon, authenticated | all | `incoming_webhook_nonces`, `incoming_webhook_nonces` |
| revoke | anon, authenticated, PUBLIC | execute | `tg_set_updated_at`, `touch_system_config`, `update_bpr_queue_updated_at`, `validate_entity_relationship`, `cleanup_behavioral_regen_queue`, `execute_readonly_query`, `increment_webhook_quota`, `publish_mtta_sla_breach_alert`, `reset_daily_lead_counts`, `compute_attribution` |
| revoke | anon, authenticated, public | all | `zapp_history`, `zapp_history`, `zapp_history` |
| revoke | authenticated | all | `_dormant`, `get_contact_sidebar_by_phone`, `get_contact_sidebar_by_phone`, `get_contact_sidebar_by_phone`, `sync_social_insight_from_analysis` |
| revoke | authenticated | execute | `execute_readonly_query`, `handle_new_user`, `redistribute_admin_portfolio`, `execute_readonly_query`, `net`, `fn_cf_collect_sm_legacy_dispatch`, `fn_cf_collect_sm_legacy_harvest`, `fn_ingest_asia_hg_batch`, `fn_set_novelty_updated_at`, `fn_sm_promote_images_to_gold`, `fn_sync_novelty_to_product`, `fn_promote_kit_components_batch`, `fn_apply_auto_tag_rules`, `redistribute_admin_portfolio`, `validate_data_batch` … +14 |
| revoke | authenticated | update | `public`, `public` |
| revoke | authenticated, PUBLIC | execute | `enqueue_behavioral_profile_regen`, `notify_admins_on_critical_behavioral_alert`, `check_behavioral_regen_cron_staleness`, `cleanup_simulated_alerts`, `get_behavioral_regen_cron_health`, `simulate_behavioral_regen_alert` |
| revoke | authenticated, anon, PUBLIC | execute | `audit_life_events`, `audit_trigger_fn`, `audit_connection_changes`, `calculate_interaction_response_time`, `calculate_next_contact_due`, `connection_configs_encrypt_trigger`, `detect_contact_intel_changes`, `enqueue_contact_validation`, `handle_new_user`, `increment_playbook_usage`, `increment_version_column`, `log_behavioral_change`, `log_contact_tag_changes`, `log_deal_forecast_category_change`, `notify_connection_failures` … +42 |
| revoke | public | all | `sync_social_insight_from_analysis` |
| revoke | service_role | execute | `confirm_sequence_manual_step` |

## Riscos de acesso detectados

| Tabela | Problema | Arquivos |
|---|---|---|
| `config_regras_negocio` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useRodizioEquipe.ts` |
| `crm_automation_logs` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| `crm_automation_reprocess_queue` | front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| `neuro_behavioral_history` | front faz SELECT mas nenhuma política RLS permite SELECT → vai falhar/retornar vazio para usuários | `src/components/contact-detail/NeuroEvolutionChart.tsx`<br>`src/components/crm/behavior/NeuromarketingTimeline.tsx`<br>`src/hooks/useUnifiedTimeline.ts` |
| `rodizio_distribuicao_staging` | RLS ligado sem nenhuma política → só service_role acessa | `src/hooks/useRodizioOndas.ts` |
| `territories` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useTerritories.ts` |
| `users` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useRodizioEquipe.ts` |

## Multi-tenancy

- Chave de tenant: **`company_id`** presente em 62 tabela(s): `ai_tone_preferences`, `alerts`, `call_logs`, `churn_risk_scores`, `contacts`, `cs_accounts`, `csat_surveys`, `deal_forecasts`, `deal_rooms`, `handoff_requests`, `intent_signals`, `interaction_summaries`, `interactions`, `lead_assignments`, `lead_score_history`, `meeting_summaries`, `neuro_pnl_sessions`, `redistribution_log`, `rfm_analysis`, `stakeholder_alerts`, `support_tickets`, `visit_checkins`, `whatsapp_messages`, `calendar_events`, `carriers`, `churn_predictions`, `company_addresses`, `company_cnaes`, `company_emails`, `company_phones`, `company_rfm_scores`, `company_social_media`, `company_stakeholder_map`, `deal_velocity_analysis`, `meetings`, `proposals`, `quick_notes`, `reminders`, `scheduled_visits`, `suppliers`, `workspace_accounts`, `cadence_enrollments`, `campaign_members`, `company_cadences`, `customers`, `economic_group_members`, `customer_ownership_history`, `customer_sdr_history`, `stg_portal_sicoob`, `stg_bcb_sicoob`, `stg_site_sicoob_pacs`, `pix_accounts`, `stg_pesquisa_singulares`, `staging_portal_sicoob`, `zapp_history.conversations`, `zapp_history.messages`, `zapp_history.conversation_daily_summaries`, `deals`, `inactivity_alerts`, `sales_opportunities`, `customer_purchases`, `_dormant.inactivity_alerts`
- Cobertura: 12% das tabelas. Abaixo de 60% — isolamento provavelmente por usuário (auth.uid()) ou misto; não flagado por tabela.

## Soft delete (registros 'apagados' continuam na tabela — filtre!)

| Tabela | Coluna |
|---|---|
| `automation_rules` | `is_active` |
| `battle_cards` | `active` |
| `city_whitelist` | `is_active` |
| `coaching_scorecards` | `active` |
| `competitors` | `active` |
| `connection_configs` | `is_active` |
| `contacts` | `deleted_at` |
| `conversation_topics_catalog` | `active` |
| `crm_cadence_rules` | `is_active` |
| `document_templates` | `is_active` |
| `geo_allowed_countries` | `is_active` |
| `incoming_webhooks` | `is_active` |
| `intent_tracking_pixels` | `active` |
| `lead_routing_rules` | `is_active` |
| `lead_score_rules` | `active` |
| `lead_score_threshold_automations` | `active` |
| `lux_webhook_config` | `is_active` |
| `mql_criteria` | `is_active` |
| `nurturing_workflows` | `is_active` |
| `phone_validations` | `is_active` |
| `sales_playbooks` | `active` |
| `sales_team_members` | `is_active` |
| `sequence_steps` | `is_active` |
| `sequences` | `is_active` |
| `sms_templates` | `is_active` |
| `trigger_ab_tests` | `is_active` |
| `win_loss_reasons` | `active` |
| `automations` | `is_active` |
| `commission_rules` | `is_active` |
| `company_social_media` | `is_active` |
| `contact_social_media` | `is_active` |
| `disc_templates` | `is_active` |
| `lead_sources` | `is_active` |
| `loss_reasons` | `is_active` |
| `sales_cadences` | `is_active` |
| `sla_rules` | `is_active` |
| `territories` | `is_active` |
| `users` | `is_active` |
| `workspace_accounts` | `is_active` |
| `coop_sistemas` | `is_active` |
| `customers` | `deleted_at` |
| `sdr_closer_assignments` | `ativo` |
| `alert_rules` | `is_active` |
| `uapi_sessions` | `is_active` |
| `pix_accounts` | `is_active` |
| `salespeople` | `is_active` |
| `sales` | `deleted_at` |
| `clients` | `deleted_at` |
| `teams` | `is_active` |
| `sales_activities` | `deleted_at` |
| `sales_tasks` | `deleted_at` |
| `cadences` | `is_active` |
| `weekly_challenges` | `is_active` |
| `daily_challenges` | `is_active` |
| `active_power_ups` | `is_active` |
| `sales_territories` | `is_active` |
| `ip_whitelist` | `is_active` |
| `rate_limit_settings` | `is_active` |
| `webauthn_credentials` | `is_active` |
| `dashboard_layouts` | `is_active` |
| `workflow_rules` | `is_active` |
| `supplier_qualification_config` | `is_active` |
| `carrier_qualification_config` | `is_active` |
| `product_novelties` | `is_active` |
| `integrations` | `is_active` |
| `message_templates` | `is_active` |
| `data_retention_policies` | `is_active` |

## Auditoria (colunas de rastreio)

| Tabela | Colunas |
|---|---|
| `abm_account_plans` | `created_at`, `updated_at` |
| `abm_accounts` | `created_at`, `updated_at` |
| `abm_buying_committee` | `created_at`, `updated_at` |
| `abm_campaigns` | `created_at`, `updated_at` |
| `abm_whitespace_opportunities` | `created_at`, `updated_at` |
| `access_blocked_log` | `created_at` |
| `access_security_settings` | `created_at`, `updated_at` |
| `activities` | `created_at` |
| `ai_chat_messages` | `created_at` |
| `ai_chat_threads` | `created_at`, `updated_at` |
| `ai_recommendation_audit_logs` | `created_at` |
| `ai_recommendation_audit_logs_v2` | `created_at` |
| `ai_recommendation_logs` | `created_at` |
| `ai_tone_preferences` | `created_at`, `updated_at` |
| `alerts` | `created_at` |
| `applied_objection_responses` | `created_at`, `updated_at` |
| `attribution_touchpoints` | `created_at` |
| `automation_rules` | `created_at`, `updated_at` |
| `battle_cards` | `created_at`, `updated_at` |
| `behavioral_insight_feedback` | `created_at`, `updated_at` |
| `behavioral_profile_regen_queue` | `created_at`, `updated_at` |
| `brain_dominance_analysis` | `created_at`, `updated_at` |
| `call_logs` | `created_at` |
| `campaign_recipients` | `created_at` |
| `canned_responses` | `created_at`, `updated_at` |
| `churn_risk_scores` | `created_at` |
| `city_whitelist` | `created_at` |
| `client_values` | `created_at`, `updated_at` |
| `coaching_scorecards` | `created_at`, `updated_at` |
| `cognitive_bias_history` | `created_at` |
| `communication_preferences` | `created_at`, `updated_at` |
| `companies` | `created_at`, `updated_at` |
| `compatibility_alerts` | `created_at` |
| `compatibility_settings` | `created_at`, `updated_at` |
| `competitors` | `created_at`, `updated_at` |
| `connection_anomalies` | `created_at` |
| `connection_configs` | `created_at`, `created_by`, `updated_at` |
| `connection_quotas` | `created_at`, `updated_at` |
| `connection_test_logs` | `created_at` |
| `contact_analytical_profile_versions` | `created_at` |
| `contact_automation_settings` | `created_at`, `updated_at` |
| `contact_behavior` | `created_at`, `updated_at` |
| `contact_business_context` | `created_at`, `updated_at` |
| `contact_cadence` | `created_at`, `updated_at` |
| `contact_cadence_audit` | `created_at` |
| `contact_decision_making` | `created_at`, `updated_at` |
| `contact_influence` | `created_at`, `updated_at` |
| `contact_metaprograms` | `created_at`, `updated_at` |
| `contact_next_actions` | `created_at`, `updated_at` |
| `contact_objection_scripts` | `created_at`, `updated_at` |
| `contact_personality` | `created_at`, `updated_at` |
| `contact_predictive_roadmap` | `created_at`, `updated_at` |
| `contact_preferences` | `created_at`, `updated_at` |
| `contact_preferences_audit` | `created_at` |
| `contact_rapport_strategy` | `created_at`, `updated_at` |
| `contact_relatives` | `created_at`, `updated_at` |
| `contact_report_overrides` | `created_at`, `updated_at` |
| `contact_time_analysis_audit` | `created_at` |
| `contacts` | `created_at`, `updated_at` |
| `conversation_analyses` | `created_at`, `updated_at` |
| `conversation_topics_catalog` | `created_at`, `updated_at` |
| `conversational_search_cache` | `created_at` |
| `crm_alerts` | `created_at` |
| `crm_automation_logs` | `created_at` |
| `crm_automation_reprocess_queue` | `created_at` |
| `crm_cadence_rules` | `created_at`, `updated_at` |
| `crm_consent_audit_logs` | `created_at` |
| `crm_metric_overrides` | `created_at` |
| `crm_objection_intelligence` | `created_at` |
| `crm_relationship_audit_logs` | `created_at` |
| `cron_secrets` | `created_at`, `updated_at` |
| `cs_accounts` | `created_at`, `updated_at` |
| `cs_health_signals` | `created_at` |
| `cs_nps_responses` | `created_at` |
| `cs_qbrs` | `created_at`, `updated_at` |
| `cs_renewals` | `created_at`, `updated_at` |
| `csat_surveys` | `created_at` |
| `custom_field_values` | `created_at`, `updated_at` |
| `custom_fields` | `created_at`, `updated_at` |
| `deal_forecasts` | `created_at`, `updated_at` |
| `deal_room_activities` | `created_at` |
| `deal_room_comments` | `created_at` |
| `deal_room_documents` | `created_at` |
| `deal_room_milestones` | `created_at`, `updated_at` |
| `deal_room_stakeholders` | `created_at`, `updated_at` |
| `deal_rooms` | `created_at`, `updated_at` |
| `decision_criteria` | `created_at`, `updated_at` |
| `device_login_notifications` | `created_at` |
| `disc_analysis_history` | `created_at` |
| `disc_analysis_history_audit` | `created_at` |
| `disc_communication_logs` | `created_at` |
| `disc_conversion_metrics` | `created_at`, `updated_at` |
| `disc_profile_config` | `created_at`, `updated_at` |
| `document_signatures` | `created_at`, `updated_at` |
| `document_templates` | `created_at`, `updated_at` |
| `documents` | `created_at`, `updated_at` |
| `email_campaigns` | `created_at`, `updated_at` |
| `email_finder_results` | `created_at`, `updated_at` |
| `email_thread_summaries` | `created_at`, `updated_at` |
| `email_verifications` | `created_at`, `updated_at` |
| `emotional_anchors` | `created_at` |
| `emotional_states_history` | `created_at` |
| `entity_relationships` | `created_at`, `created_by`, `updated_at` |
| `eq_analysis_history` | `created_at` |
| `error_logs` | `created_at` |
| `favorite_templates` | `created_at` |
| `feature_flags` | `created_at`, `updated_at` |
| `ficha360_conversation_summaries` | `created_at` |
| `follow_up_approvals` | `created_at`, `updated_at` |
| `follow_up_approvals_v2` | `created_at`, `updated_at` |
| `forecast_periods` | `created_at`, `updated_at` |
| `forecast_quota_settings` | `created_at`, `updated_at` |
| `forecast_snapshots` | `created_at` |
| `form_submissions` | `created_at` |
| `forms` | `created_at`, `updated_at` |
| `geo_allowed_countries` | `created_at` |
| `handoff_requests` | `created_at`, `updated_at` |
| `health_alert_settings` | `created_at`, `updated_at` |
| `health_alerts` | `created_at` |
| `hidden_objections` | `created_at` |
| `incoming_webhook_dlq` | `created_at`, `updated_at` |
| `incoming_webhook_logs` | `created_at` |
| `incoming_webhooks` | `created_at`, `created_by`, `updated_at` |
| `insights` | `created_at` |
| `intent_scores` | `created_at`, `updated_at` |
| `intent_signals` | `created_at` |
| `intent_tracking_pixels` | `created_at`, `updated_at` |
| `interaction_summaries` | `created_at`, `updated_at` |
| `interactions` | `created_at` |
| `interactions_audit` | `created_at` |
| `knowledge_base_articles` | `created_at`, `updated_at` |
| `landing_page_submissions` | `created_at` |
| `landing_pages` | `created_at`, `updated_at` |
| `lead_assignments` | `created_at`, `updated_at` |
| `lead_magnets` | `created_at`, `updated_at` |
| `lead_routing_rules` | `created_at`, `updated_at` |
| `lead_score_config` | `created_at`, `updated_at` |
| `lead_score_rules` | `created_at`, `updated_at` |
| `lead_score_threshold_automations` | `created_at`, `updated_at` |
| `lead_score_thresholds` | `created_at`, `updated_at` |
| `life_events` | `created_at`, `updated_at` |
| `lux_intelligence` | `created_at`, `updated_at` |
| `lux_webhook_config` | `created_at`, `updated_at` |
| `marketing_campaign_stats` | `created_at` |
| `marketing_roi_data` | `created_at` |
| `mcp_tool_calls` | `created_at` |
| `meeting_summaries` | `created_at`, `updated_at` |
| `metaprogram_analysis` | `created_at` |
| `mql_classifications` | `created_at`, `updated_at` |
| `mql_criteria` | `created_at`, `updated_at` |
| `neuro_behavioral_history` | `created_at` |
| `neuro_pnl_sessions` | `created_at`, `updated_at` |
| `nlp_feedback` | `created_at` |
| `nurturing_enrollments` | `created_at`, `updated_at` |
| `nurturing_executions` | `created_at`, `updated_at` |
| `nurturing_workflows` | `created_at`, `updated_at` |
| `objection_example_feedback` | `created_at`, `updated_at` |
| `offer_suggestions` | `created_at` |
| `people_intelligence_events` | `created_at` |
| `phone_validations` | `created_at`, `updated_at` |
| `profiles` | `created_at`, `updated_at` |
| `proximo_passo_feedback` | `created_at` |
| `psychographic_audit_log` | `created_at` |
| `purchase_history` | `created_at`, `updated_at` |
| `query_telemetry` | `created_at` |
| `redistribution_log` | `created_at` |
| `reframing_analysis` | `created_at` |
| `reframing_analysis_audit` | `created_at` |
| `revops_alerts` | `created_at` |
| `revops_benchmarks` | `created_at`, `updated_at` |
| `revops_snapshots` | `created_at` |
| `rfm_analysis` | `created_at`, `updated_at` |
| `rfm_history` | `created_at` |
| `rfm_metrics` | `created_at` |
| `rfm_segment_config` | `created_at`, `updated_at` |
| `sales_playbooks` | `created_at`, `updated_at` |
| `sales_team_members` | `created_at`, `updated_at` |
| `schema_drift_alerts` | `created_at` |
| `score_history` | `created_at` |
| `search_products_cache` | `created_at` |
| `secret_rotation_log` | `created_at` |
| `semantic_search_cache` | `created_at` |
| `sentiment_annotations` | `created_at`, `created_by`, `updated_at` |
| `sequence_enrollments` | `created_at`, `updated_at` |
| `sequence_events` | `created_at` |
| `sequence_send_log` | `created_at` |
| `sequence_steps` | `created_at`, `updated_at` |
| `sequences` | `created_at`, `updated_at` |
| `smart_notifications` | `created_at` |
| `sms_campaign_recipients` | `created_at` |
| `sms_campaigns` | `created_at`, `updated_at` |
| `sms_opt_outs` | `created_at` |
| `sms_templates` | `created_at`, `updated_at` |
| `social_behavior_analysis` | `created_at` |
| `social_consent_audit` | `created_at` |
| `social_life_events` | `created_at` |
| `social_profiles` | `created_at`, `updated_at` |
| `social_scraping_schedule` | `created_at`, `updated_at` |
| `social_sync_queue` | `created_at`, `updated_at` |
| `stakeholder_alerts` | `created_at` |
| `suggested_life_events` | `created_at`, `updated_at` |
| `suggested_rapport_intel` | `created_at`, `updated_at` |
| `support_tickets` | `created_at`, `updated_at` |
| `system_alerts` | `created_at` |
| `system_config` | `updated_at`, `updated_by` |
| `system_health_snapshots` | `created_at` |
| `ticket_comments` | `created_at`, `updated_at` |
| `trigger_ab_tests` | `created_at`, `updated_at` |
| `trigger_bundles` | `created_at`, `updated_at` |
| `trigger_channel_effectiveness` | `created_at`, `updated_at` |
| `trigger_intensity_history` | `created_at` |
| `trigger_usage_history` | `created_at` |
| `user_known_devices` | `created_at`, `updated_at` |
| `user_ui_preferences` | `created_at`, `updated_at` |
| `vak_analysis_history` | `created_at` |
| `validation_queue` | `created_at` |
| `visit_checkins` | `created_at`, `updated_at` |
| `weekly_report_settings` | `created_at`, `updated_at` |
| `weekly_reports` | `created_at` |
| `whatsapp_ingestion_logs` | `created_at` |
| `whatsapp_instances` | `created_at`, `updated_at` |
| `whatsapp_kpis` | `created_at` |
| `whatsapp_messages` | `created_at`, `updated_at` |
| `whatsapp_messages_index` | `created_at` |
| `whatsapp_transcriptions` | `created_at` |
| `win_loss_insights` | `created_at` |
| `win_loss_reasons` | `created_at`, `updated_at` |
| `win_loss_records` | `created_at`, `updated_at` |
| `migration_password_reset_log` | `created_at`, `updated_at` |
| `activity_feed` | `created_at` |
| `automations` | `created_at`, `created_by`, `updated_at` |
| `badges` | `created_at` |
| `calendar_events` | `created_at`, `updated_at` |
| `campaigns` | `created_at`, `created_by`, `updated_at` |
| `carriers` | `created_at`, `updated_at` |
| `churn_predictions` | `created_at`, `updated_at` |
| `cnaes` | `created_at` |
| `commission_rules` | `created_at` |
| `commissions` | `created_at` |
| `company_addresses` | `created_at`, `updated_at` |
| `company_cnaes` | `created_at`, `updated_at` |
| `company_emails` | `created_at`, `updated_at` |
| `company_phones` | `created_at`, `updated_at` |
| `company_rfm_scores` | `created_at`, `updated_at` |
| `company_social_media` | `created_at`, `created_by`, `updated_at`, `updated_by` |
| `company_stakeholder_map` | `created_at`, `updated_at` |
| `contact_emails` | `created_at`, `updated_at` |
| `contact_phones` | `created_at`, `updated_at` |
| `contact_social_media` | `created_at`, `created_by`, `updated_at`, `updated_by` |
| `deal_competitors` | `created_at` |
| `deal_velocity_analysis` | `created_at`, `updated_at` |
| `disc_templates` | `created_at`, `created_by`, `updated_at` |
| `economic_groups` | `created_at`, `updated_at` |
| `favorites` | `created_at` |
| `grupos_economicos` | `created_at`, `updated_at` |
| `interaction_templates` | `created_at`, `updated_at` |
| `lead_sources` | `created_at` |
| `loss_reasons` | `created_at` |
| `meetings` | `created_at` |
| `proposals` | `created_at`, `updated_at` |
| `quick_notes` | `created_at`, `updated_at` |
| `relationship_score_history` | `created_at` |
| `reminders` | `created_at` |
| `sales_cadences` | `created_at`, `created_by`, `updated_at` |
| `scheduled_visits` | `created_at` |
| `seller_daily_metrics` | `created_at` |
| `sla_rules` | `created_at` |
| `sla_violations` | `created_at` |
| `suppliers` | `created_at`, `updated_at` |
| `sync_log` | `created_at` |
| `territories` | `created_at` |
| `user_goals` | `created_at`, `updated_at` |
| `users` | `created_at`, `updated_at` |
| `workspace_accounts` | `created_at`, `updated_at` |
| `campaign_members` | `created_at` |
| `company_cadences` | `created_at`, `updated_at` |
| `contact_addresses` | `created_at`, `created_by`, `updated_at`, `updated_by` |
| `coop_sistemas` | `created_at`, `updated_at` |
| `customers` | `created_at`, `updated_at` |
| `sdr_closer_assignments` | `created_at`, `updated_at` |
| `customer_ownership_history` | `created_at`, `updated_at` |
| `customer_sdr_history` | `created_at`, `updated_at` |
| `config_regras_negocio` | `updated_at` |
| `alert_rules` | `created_at`, `created_by`, `updated_at` |
| `lalamove_drivers` | `created_at`, `updated_at` |
| `lalamove_position_log` | `created_at` |
| `lalamove_route_cache` | `created_at` |
| `lalamove_dead_letter` | `created_at` |
| `stg_portal_sicoob` | `created_at` |
| `stg_bcb_sicoob` | `created_at` |
| `uapi_sessions` | `created_at`, `updated_at` |
| `oauth_tokens` | `updated_at` |
| `connector_log` | `created_at` |
| `pix_accounts` | `created_at`, `created_by`, `updated_at`, `updated_by` |
| `saved_filters` | `created_at`, `updated_at` |
| `salespeople` | `created_at`, `updated_at` |
| `sales` | `created_at`, `deleted_by`, `updated_at` |
| `daily_metrics` | `created_at` |
| `category_metrics` | `created_at` |
| `sales_goals` | `created_at` |
| … +153 linhas — lista completa em `context.json` | |

## Dados pessoais / sensíveis (LGPD — cuidado em logs, exports, prompts de IA)

| Tabela | Coluna |
|---|---|
| `access_blocked_log` | `email` |
| `access_blocked_log` | `ip_address` |
| `activities` | `ip_address` |
| `campaign_recipients` | `email` |
| `companies` | `phone` |
| `companies` | `email` |
| `companies` | `address` |
| `companies` | `cnpj` |
| `contact_relatives` | `phone` |
| `contact_relatives` | `email` |
| `contacts` | `email` |
| `contacts` | `phone` |
| `contacts` | `whatsapp` |
| `crm_consent_audit_logs` | `ip_address` |
| `deal_room_stakeholders` | `email` |
| `device_login_notifications` | `ip_address` |
| `document_signatures` | `ip_address` |
| `document_views` | `ip_address` |
| `email_verifications` | `email` |
| `landing_page_submissions` | `ip_address` |
| `lead_magnet_downloads` | `email` |
| `profiles` | `phone` |
| `profiles` | `email` |
| `sms_campaign_recipients` | `phone` |
| `sms_opt_outs` | `phone` |
| `social_consent_audit` | `ip_address` |
| `visit_checkins` | `latitude` |
| `visit_checkins` | `longitude` |
| `visit_checkins` | `address` |
| `company_addresses` | `cep` |
| `company_addresses` | `logradouro` |
| `company_addresses` | `latitude` |
| `company_addresses` | `longitude` |
| `company_emails` | `email` |
| `contact_emails` | `email` |
| `users` | `email` |
| `workspace_accounts` | `email` |
| `contact_addresses` | `cep` |
| `contact_addresses` | `logradouro` |
| `contact_addresses` | `latitude` |
| `contact_addresses` | `longitude` |
| `staging_bitrix_companies` | `phone` |
| `staging_bitrix_companies` | `email` |
| `stg_portal_sicoob` | `logradouro` |
| `stg_portal_sicoob` | `cep` |
| `stg_portal_sicoob` | `email` |
| `stg_portal_sicoob` | `latitude` |
| `stg_portal_sicoob` | `longitude` |
| `stg_bcb_sicoob` | `cnpj` |
| `stg_bcb_sicoob` | `endereco` |
| `stg_bcb_sicoob` | `cep` |
| `stg_bcb_sicoob` | `telefone` |
| `stg_bcb_sicoob` | `email` |
| `stg_site_sicoob_pacs` | `endereco` |
| `stg_site_sicoob_pacs` | `cep` |
| `stg_site_sicoob_pacs` | `telefone` |
| `salespeople` | `email` |
| `clients` | `email` |
| `clients` | `phone` |
| `login_attempts` | `email` |
| `login_attempts` | `ip_address` |
| `blocked_ips` | `ip_address` |
| `ip_whitelist` | `ip_address` |
| `active_sessions` | `ip_address` |
| `login_alerts` | `ip_address` |
| `access_denied_logs` | `ip_address` |
| `security_alert_history` | `ip_address` |
| `mfa_verification_attempts` | `ip_address` |
| `reauthentication_requests` | `ip_address` |
| `password_reset_requests` | `email` |
| `password_reset_requests` | `ip_address` |
| `document_signers` | `email` |
| `staging_portal_sicoob` | `endereco` |
| `staging_portal_sicoob` | `cep` |
| `staging_portal_sicoob` | `email` |
| `staging_portal_sicoob` | `latitude` |
| `staging_portal_sicoob` | `longitude` |
| `cidades` | `latitude` |
| `cidades` | `longitude` |

## Colunas de dinheiro (tipo importa: numeric ✅ / float ❌)

| Tabela | Coluna | Tipo |
|---|---|---|
| `ai_chat_threads` | `total_messages` | `integer` |
| `ai_chat_threads` | `total_tokens` | `integer` |
| `attribution_models_cache` | `total_value` | `NUMERIC` |
| `contact_report_overrides` | `custom_scripts` | `JSONB` |
| `contact_time_analysis` | `total_attempts` | `INTEGER` |
| `csat_surveys` | `feedback` | `text` |
| `disc_conversion_metrics` | `total_contacts` | `INTEGER` |
| `disc_conversion_metrics` | `total_opportunities` | `INTEGER` |
| `email_campaigns` | `total_recipients` | `integer` |
| `email_campaigns` | `total_sent` | `integer` |
| `email_campaigns` | `total_delivered` | `integer` |
| `email_campaigns` | `total_opened` | `integer` |
| `email_campaigns` | `total_clicked` | `integer` |
| `email_campaigns` | `total_bounced` | `integer` |
| `email_campaigns` | `total_complained` | `integer` |
| `email_campaigns` | `total_unsubscribed` | `integer` |
| `incoming_webhooks` | `total_calls` | `BIGINT` |
| `incoming_webhooks` | `total_errors` | `BIGINT` |
| `landing_pages` | `total_views` | `integer` |
| `landing_pages` | `total_submissions` | `integer` |
| `lead_score_config` | `custom_factors` | `jsonb` |
| `lead_score_history` | `total_score` | `NUMERIC(5,2)` |
| `lux_webhook_config` | `custom_headers` | `jsonb` |
| `lux_webhook_config` | `total_calls` | `integer` |
| `lux_webhook_config` | `total_successes` | `integer` |
| `lux_webhook_config` | `total_failures` | `integer` |
| `marketing_roi_data` | `customers_acquired` | `INTEGER` |
| `nlp_feedback` | `feedback_notes` | `TEXT` |
| `nurturing_workflows` | `total_enrolled` | `integer` |
| `purchase_history` | `amount` | `DECIMAL(12,2)` |
| `reframing_analysis` | `feedback` | `TEXT` |
| `revops_snapshots` | `total_value` | `NUMERIC(14,2)` |
| `rfm_analysis` | `total_revenue` | `numeric(15,2)` |
| `rfm_history` | `total_monetary_value` | `DECIMAL(12,2)` |
| `rfm_metrics` | `total_contacts_analyzed` | `INTEGER` |
| `rfm_metrics` | `total_revenue` | `DECIMAL(12,2)` |
| `sales_team_members` | `total_cap` | `integer` |
| `sequences` | `total_steps` | `integer` |
| `sequences` | `total_enrolled` | `integer` |
| `sms_campaign_recipients` | `cost` | `numeric(10,4)` |
| `sms_campaigns` | `total_recipients` | `integer` |
| `sms_campaigns` | `total_sent` | `integer` |
| `sms_campaigns` | `total_delivered` | `integer` |
| `sms_campaigns` | `total_failed` | `integer` |
| `sms_campaigns` | `total_opt_outs` | `integer` |
| `sms_campaigns` | `cost` | `numeric(10,4)` |
| `sms_campaigns` | `total_replies` | `integer` |
| `system_health_snapshots` | `total_latency_ms` | `INTEGER` |
| `trigger_bundles` | `total_uses` | `INTEGER` |
| `commissions` | `commission_pct` | `numeric` |
| `commissions` | `commission_value` | `numeric` |
| `company_rfm_scores` | `total_value` | `numeric` |
| `economic_groups` | `total_revenue` | `numeric` |
| `economic_groups` | `total_companies` | `int4` |
| `lead_sources` | `custo_por_lead` | `numeric` |
| `proposals` | `valor_total` | `numeric` |
| `proposals` | `desconto_percentual` | `numeric` |
| `proposals` | `valor_final` | `numeric` |
| `proposals` | `discount_type` | `text` |
| `coop_sistemas` | `total_cooperados` | `int4` |
| `coop_sistemas` | `total_singulares` | `int4` |
| `coop_sistemas` | `total_centrais` | `int4` |
| `customers` | `total_pedidos` | `int4` |
| `customers` | `valor_total_compras` | `numeric` |
| `config_regras_negocio` | `valor` | `text` |
| `salespeople` | `commission_rate` | `numeric(5,2)` |
| `sales` | `amount` | `numeric(12,2)` |
| `daily_metrics` | `total_sales` | `INTEGER` |
| `clients` | `total_value` | `NUMERIC` |
| `products` | `price` | `NUMERIC` |
| `lead_scores` | `total_score` | `integer` |
| `salesperson_xp` | `total_xp` | `INTEGER` |
| `tournament_participants` | `total_score` | `NUMERIC(12,2)` |
| `sales_territories` | `total_revenue` | `NUMERIC(12,2)` |
| `quotes` | `subtotal` | `NUMERIC(12,2)` |
| `quotes` | `discount_percent` | `NUMERIC(5,2)` |
| `quotes` | `discount_amount` | `NUMERIC(12,2)` |
| `quotes` | `total` | `NUMERIC(12,2)` |
| `supplier_orders` | `total_amount` | `NUMERIC(12,2)` |
| `supplier_order_items` | `total_price` | `NUMERIC(12,2)` |
| `price_alerts` | `price_change_percent` | `NUMERIC` |
| `data_quality_audits` | `total_entidades` | `int` |
| `supplier_scores` | `total_avaliacoes` | `INTEGER` |
| `carrier_scores` | `total_avaliacoes` | `integer` |
| `model_pricing_v2` | `total_params` | `TEXT` |
| `zapp_history.conversations` | `total_messages` | `INTEGER` |
| `zapp_history.messages` | `customer_type` | `TEXT` |
| `zapp_history.messages` | `customization_extracted` | `JSONB` |
| `zapp_history.conversation_daily_summaries` | `total_chars` | `BIGINT` |
| `zapp_history.conversation_daily_summaries` | `total_audio_seconds` | `NUMERIC(10,2)` |
| `zapp_history.conversation_daily_summaries` | `customer_mood` | `TEXT` |
| `zapp_history.conversation_daily_summaries` | `customer_pain_points` | `TEXT[]` |
| `zapp_history.ai_cost_log` | `total_tokens` | `INTEGER` |
| `zapp_history.ai_cost_log` | `cost_cents` | `NUMERIC(10,4)` |
| `deals` | `valor` | `numeric` |
| `rpc_plan_snapshots` | `total_cost` | `numeric` |
| `customer_purchases` | `valor` | `numeric(14,2)` |
| `rodizio_execucoes` | `total_elegiveis` | `integer` |
| `rodizio_execucoes` | `total_rotacionados` | `integer` |
