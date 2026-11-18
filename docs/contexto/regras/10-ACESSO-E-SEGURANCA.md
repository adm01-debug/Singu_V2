# 10 · ACESSO E SEGURANÇA — quem pode o quê

> Gerado automaticamente por AI Context Sync v1.3.2 · commit `602a7f8dac` · branch `main` · 2026-11-18 17:58 UTC
> Não edite à mão — regras humanas vão em `manual/`.

## Perfis / roles identificados

`admin`, `assistant`, `buyer`, `champion`, `closer`, `contact`, `decision_maker`, `default`, `denied`, `employee_of`, `granted`, `hybrid`, `influencer`, `manager`, `moderator`, `other`, `owner`, `parent`, `partner`, `role`, `sdr`, `sponsor`, `subsidiary`, `supplier`, `user`

- Tabelas de perfil/permissão: `permissions`, `role_permissions`, `sales_team_members`, `user_roles`
- Colunas de perfil: `ai_chat_messages.role` (TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system'))), `contacts.role` (TEXT CHECK (role IN ('owner', 'manager', 'buyer', 'contact', 'decision_maker', 'influencer')) DEFAULT 'contact'), `entity_relationships.role` (public.entity_relationship_role NOT NULL), `role_permissions.role` (app_role NOT NULL), `sales_team_members.role` (TEXT NOT NULL DEFAULT 'sdr' CHECK (role IN ('sdr', 'closer', 'manager'))), `user_roles.role` (app_role NOT NULL), `salespeople.role` (public.salesperson_role NOT NULL DEFAULT 'hybrid')
- Claims do JWT usados em políticas/funções: `aal`
- Funções usadas dentro de políticas RLS (a regra real está no corpo delas — veja `06`): `has_role`

## Matriz tabela × operação → quem pode (derivada das políticas RLS)

| Tabela | RLS | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|---|
| `_dormant.inactivity_alerts` | enabled | authenticated: (contact_id IS NOT NULL OR company_id IS NOT NULL) AND (contact_id IS NULL OR EXISTS (SELECT 1 FROM public.contacts c WHERE c | — | — | — |
| `_fk_orphans` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `_migration_cdc_checkpoint` | enabled | service_role: true | service_role: true | service_role: true | service_role: true |
| `_migration_schema_snapshot` | enabled | — | — | — | — |
| `_seq_gap_report` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `abm_account_plans` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: auth.uid() = user_id |
| `abm_accounts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `abm_buying_committee` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `abm_campaigns` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `abm_whitespace_opportunities` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `access_blocked_log` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: false | — | — |
| `access_security_settings` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `activities` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `ai_chat_messages` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `ai_chat_threads` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `ai_gateway_metrics` | enabled | authenticated: has_role(auth.uid(), 'admin'::app_role)<br>service_role: true | service_role: true | service_role: true | service_role: true |
| `ai_recommendation_audit_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `ai_recommendation_audit_logs_v2` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `ai_recommendation_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `ai_tone_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `alerts` | enabled | public: auth.uid() = user_id | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `applied_objection_responses` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: auth.uid() = user_id | authenticated: ((select auth.uid()) = user_id) |
| `attribution_models_cache` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `attribution_touchpoints` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `audit_log` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | — | — |
| `automation_logs` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `automation_rules` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `battle_cards` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `behavioral_insight_feedback` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `behavioral_profile_regen_queue` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — |
| `brain_dominance_analysis` | enabled | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid())) | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = brain_dominance_analysis.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = brain_dominance_analysis.contact_id AND c.user_id = auth.uid() ) |
| `call_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `campaign_recipients` | enabled | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) | public: (EXISTS ( SELECT 1 FROM email_campaigns ec WHERE ((ec.id = campaign_recipients.campaign_id) AND (ec.user_id = (select auth.uid())))) |
| `canned_responses` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `churn_risk_scores` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cidades` | enabled | authenticated: true | — | — | — |
| `city_whitelist` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `client_values` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `coaching_scorecards` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `cognitive_bias_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `communication_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `companies` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) | public: auth.uid() = user_id<br>authenticated: user_id = (SELECT auth.uid())<br>authenticated: user_id = (SELECT auth.uid()) |
| `company_addresses` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `company_emails` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `company_phones` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `compatibility_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `compatibility_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `competitors` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `connection_anomalies` | enabled | public: has_role((select auth.uid()), 'admin'::app_role) | service_role: true | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) |
| `connection_configs` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `connection_quotas` | enabled | public: has_role((select auth.uid()), 'admin'::app_role)<br>authenticated: (EXISTS ( SELECT 1 FROM incoming_webhooks w WHERE ((w.id = connection_quotas.webhook_id) AND (w.created_by = (select auth.uid | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) |
| `connection_test_logs` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — | — |
| `contact_analytical_profile_versions` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | — | — |
| `contact_analytical_profiles` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_automation_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_behavior` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_behavior.contact_id) AND (c.user_id = (select auth.uid()))))) OR h<br>authenticated: true |
| `contact_business_context` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_business_context.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true |
| `contact_cadence` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_cadence_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contact_decision_making` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_decision_making.contact_id) AND (c.user_id = (select auth.uid())))<br>authenticated: true |
| `contact_emails` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `contact_family_history` | enabled | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | — | — |
| `contact_influence` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_influence.contact_id) AND (c.user_id = (select auth.uid()))))) OR <br>authenticated: true |
| `contact_metaprograms` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_metaprograms.contact_id) AND (c.user_id = (select auth.uid()))))) <br>authenticated: true |
| `contact_next_actions` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_objection_scripts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `contact_personality` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = auth.uid())))) OR has_rol<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) O<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) O<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_personality.contact_id) AND (c.user_id = (select auth.uid()))))) O<br>authenticated: true |
| `contact_phones` | não encontrado | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_phones.contact_id AND c.user_id = (SELECT auth.uid()) AND c.del |
| `contact_predictive_roadmap` | enabled | public: ((select auth.uid()) = user_id)<br>public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_predictive_roadmap.contact_id) AND ((c.user_id = (select auth.uid())) OR (<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) |
| `contact_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_preferences_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contact_rapport_strategy` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = contact_rapport_strategy.contact_id) AND (c.user_id = (select auth.uid()))<br>authenticated: true |
| `contact_relatives` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_relatives_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contact_report_overrides` | enabled | public: ((select auth.uid()) IS NOT NULL) | public: ((select auth.uid()) IS NOT NULL) | public: ((select auth.uid()) IS NOT NULL) | — |
| `contact_time_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `contact_time_analysis_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `contacts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `conversation_analyses` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `conversation_topics_catalog` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `conversational_search_cache` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
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
| `custom_field_values` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: user_id IS NULL OR user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `custom_fields` | enabled | public: ((select auth.uid()) = user_id)<br>authenticated: user_id IS NULL OR user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `customer_ownership_history` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `customer_purchases` | enabled | — | — | — | — |
| `customer_rotation_state` | enabled | — | — | — | — |
| `customer_sdr_history` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `data_retention_policies` | enabled | authenticated: public.has_role(auth.uid(), 'admin')<br>authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true | authenticated: public.has_role(auth.uid(), 'admin')<br>service_role: true |
| `deal_forecasts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_activities` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: actor_side = 'buyer' AND activity_type = 'view' AND EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND  | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_comments` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_documents` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_milestones` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_room_stakeholders` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: EXISTS (SELECT 1 FROM public.deal_rooms r WHERE r.id = room_id AND r.share_enabled = true) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `deal_rooms` | enabled | public: ((select auth.uid()) = user_id)<br>anon, authenticated: share_enabled = true | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: share_enabled = true | public: ((select auth.uid()) = user_id) |
| `deals` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `decision_criteria` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `device_login_notifications` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `disc_analysis_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `disc_analysis_history_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `disc_communication_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `disc_conversion_metrics` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `disc_profile_config` | enabled | authenticated: true | — | — | — |
| `document_signatures` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `document_templates` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `document_views` | enabled | public: (EXISTS ( SELECT 1 FROM document_signatures s WHERE ((s.id = document_views.signature_id) AND (s.user_id = (select auth.uid()))))) | authenticated: false | — | — |
| `documents` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_campaigns` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_finder_results` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_thread_summaries` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `email_verifications` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `emotional_anchors` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `emotional_states_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `entity_relationships` | enabled | authenticated: created_by = auth.uid() | authenticated: ((select auth.uid()) IS NOT NULL) | authenticated: ((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role)) | authenticated: ((created_by = (select auth.uid())) OR has_role((select auth.uid()), 'admin'::app_role)) |
| `eq_analysis_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `error_logs` | enabled | public: has_role((select auth.uid()), 'admin'::app_role) | authenticated: auth.uid() IS NOT NULL AND user_id = auth.uid() | — | authenticated: public.has_role(auth.uid(), 'admin') |
| `estados` | enabled | authenticated: true | — | — | — |
| `favorite_templates` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `feature_flags` | enabled | authenticated: true | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
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
| `handoff_requests` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `health_alert_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `health_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `hidden_objections` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `incoming_webhook_dlq` | enabled | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) | public: has_role((select auth.uid()), 'admin'::app_role) |
| `incoming_webhook_logs` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: false | — | — |
| `incoming_webhook_nonces` | enabled | — | — | — | — |
| `incoming_webhooks` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `insights` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `intent_scores` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `intent_signals` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `intent_tracking_pixels` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `interaction_summaries` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `interactions` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) |
| `interactions_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `ip_whitelist` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `knowledge_base_articles` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `landing_page_submissions` | enabled | authenticated: ((select auth.uid()) = user_id) | anon, authenticated: EXISTS (SELECT 1 FROM public.landing_pages lp WHERE lp.id = landing_page_id AND lp.is_published = true AND lp.user_id = | — | — |
| `landing_pages` | enabled | authenticated: ((select auth.uid()) = user_id)<br>anon, authenticated: is_published = true<br>anon, authenticated: is_published = true | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `lead_assignments` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `lead_magnet_downloads` | enabled | public: ((select auth.uid()) = user_id) | public: EXISTS (SELECT 1 FROM public.lead_magnets m WHERE m.id = magnet_id AND m.is_published = true AND m.user_id = lead_magnet_downloads.u | — | — |
| `lead_magnets` | enabled | public: ((select auth.uid()) = user_id)<br>public: is_published = true | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>anon, authenticated: is_published = true | public: ((select auth.uid()) = user_id) |
| `lead_routing_rules` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `lead_score_config` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `lead_score_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `lead_score_recompute_queue` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `lead_score_rules` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lead_score_threshold_automations` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lead_score_threshold_log` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `lead_score_thresholds` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lead_scores` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `life_events` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `life_events_history` | enabled | authenticated: ((select auth.uid()) = user_id) | — | — | — |
| `login_attempts` | enabled | authenticated: (user_id = (select auth.uid()))<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | service_role: true | — | — |
| `lux_intelligence` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `lux_webhook_config` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `marketing_campaign_stats` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `marketing_roi_data` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `mcp_tool_calls` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | service_role: true | — | — |
| `meeting_summaries` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `metaprogram_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `migration_password_reset_log` | enabled | authenticated: public.has_role(auth.uid(), 'admin') | — | — | — |
| `mql_classifications` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `mql_criteria` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `neuro_behavioral_history` | enabled | public: EXISTS (SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid()) | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_behavioral_history.contact_id) AND (c.user_id = (select auth.uid()))))) | — | — |
| `neuro_pnl_sessions` | enabled | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) OR | public: (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = neuro_pnl_sessions.contact_id) AND (c.user_id = (select auth.uid()))))) | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = neuro_pnl_sessions.contact_id AND c.user_id = auth.uid() ) |
| `nlp_feedback` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `notification_logs` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `notification_preferences` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `notifications` | enabled | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id |
| `nurturing_enrollments` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `nurturing_executions` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `nurturing_workflows` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `objection_example_feedback` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `offer_suggestions` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `ops_backup.acl_snapshot` | não encontrado | sem RLS | sem RLS | sem RLS | sem RLS |
| `password_reset_requests` | enabled | authenticated: (user_id = (select auth.uid()))<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `people_intelligence_events` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `permissions` | enabled | authenticated: true<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `phone_validations` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `pipeline_stage_transitions` | enabled | public: true<br>authenticated: true | — | — | — |
| `pipeline_stages` | enabled | public: EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid())<br>public: EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid()) | public: EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid()) | public: EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid()) | public: EXISTS (SELECT 1 FROM public.pipelines p WHERE p.id = pipeline_id AND p.user_id = auth.uid()) |
| `pipelines` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `playbook_usage_log` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `profiles` | enabled | public: ((select auth.uid()) = id) | public: ((select auth.uid()) = id) | public: ((select auth.uid()) = id) | authenticated: id = auth.uid() |
| `proximo_passo_feedback` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | — | authenticated: (user_id = (select auth.uid())) |
| `psychographic_audit_log` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = psychographic_audit_log.contact_id) AND (c.user_id = (select auth.uid()))) | — | — | — |
| `purchase_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `push_subscriptions` | enabled | authenticated: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) | public: ((select auth.uid()) = user_id)<br>authenticated: user_id = (SELECT auth.uid()) |
| `query_telemetry` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | — | authenticated: ((select auth.uid()) = user_id)<br>authenticated: public.has_role(auth.uid(), 'admin') |
| `redistribution_log` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | — | — |
| `reframing_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `reframing_analysis_audit` | enabled | public: ((select auth.uid()) = user_id) | — | — | — |
| `revops_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `revops_benchmarks` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `revops_snapshots` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `rfm_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `rfm_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `rfm_metrics` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `rfm_segment_config` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `rodizio_distribuicao_staging` | enabled | — | — | — | — |
| `rodizio_execucoes` | enabled | — | — | — | — |
| `role_permissions` | enabled | authenticated: true<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `rpc_perf_samples` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | — | — | — |
| `rpc_plan_snapshots` | enabled | authenticated: public.has_role(auth.uid(), 'admin'::app_role)<br>service_role: true | service_role: true | service_role: true | service_role: true |
| `sales` | não encontrado | authenticated: EXISTS ( SELECT 1 FROM public.salespeople sp WHERE sp.id = sales.salesperson_id AND sp.auth_user_id = (SELECT auth.uid()) ) | sem RLS | sem RLS | sem RLS |
| `sales_activities` | não encontrado | authenticated: EXISTS ( SELECT 1 FROM public.salespeople sp WHERE sp.id = sales_activities.salesperson_id AND sp.auth_user_id = (SELECT auth | sem RLS | sem RLS | sem RLS |
| `sales_playbooks` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `sales_team_members` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `salespeople` | não encontrado | authenticated: auth_user_id = (SELECT auth.uid()) | sem RLS | sem RLS | sem RLS |
| `schema_drift_alerts` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: ((select auth.uid()) = user_id) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — |
| `score_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `search_products_cache` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `secret_rotation_log` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `semantic_search_cache` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `sentiment_annotations` | enabled | authenticated: (((select auth.uid()) = created_by) OR (EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = sentiment_annotations.contact_id) AN | authenticated: ((select auth.uid()) = created_by) | authenticated: (((select auth.uid()) = created_by) OR has_role((select auth.uid()), 'admin'::app_role)) | authenticated: (((select auth.uid()) = created_by) OR has_role((select auth.uid()), 'admin'::app_role)) |
| `sequence_email_reservations` | enabled | authenticated: user_id = (SELECT auth.uid()) OR ( (SELECT public.has_role(auth.uid(), 'admin'::public.app_role)) AND (SELECT auth.jwt()->>'a | — | — | — |
| `sequence_enrollments` | enabled | authenticated: (user_id = (select auth.uid()))<br>authenticated: user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid()) AND EX | authenticated: (user_id = (select auth.uid()))<br>authenticated: user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid()) AND EX | authenticated: (user_id = (select auth.uid()))<br>authenticated: user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid()) AND EX | authenticated: (user_id = (select auth.uid()))<br>authenticated: user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.sequences s WHERE s.id = sequence_id AND s.user_id = auth.uid()) AND EX |
| `sequence_events` | enabled | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) |
| `sequence_send_log` | enabled | public: ((select auth.uid()) = user_id)<br>public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) | public: (((select auth.jwt()) ->> 'role'::text) = 'service_role'::text) |
| `sequence_steps` | enabled | authenticated: (EXISTS ( SELECT 1 FROM sequences s WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = (select auth.uid()))))) | authenticated: (EXISTS ( SELECT 1 FROM sequences s WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = (select auth.uid()))))) | authenticated: (EXISTS ( SELECT 1 FROM sequences s WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = (select auth.uid()))))) | authenticated: (EXISTS ( SELECT 1 FROM sequences s WHERE ((s.id = sequence_steps.sequence_id) AND (s.user_id = (select auth.uid()))))) |
| `sequences` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `smart_notifications` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `sms_campaign_recipients` | enabled | public: (EXISTS ( SELECT 1 FROM sms_campaigns c WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))) | public: (EXISTS ( SELECT 1 FROM sms_campaigns c WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))) | public: (EXISTS ( SELECT 1 FROM sms_campaigns c WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))) | public: (EXISTS ( SELECT 1 FROM sms_campaigns c WHERE ((c.id = sms_campaign_recipients.campaign_id) AND (c.user_id = (select auth.uid()))))) |
| `sms_campaigns` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `sms_opt_outs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `sms_templates` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `social_behavior_analysis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `social_consent_audit` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `social_insights` | enabled | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id | public: auth.uid() = user_id |
| `social_life_events` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `social_profiles` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `social_scraping_schedule` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `social_sync_queue` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = social_sync_queue.contact_id) AND (c.user_id = (select auth.uid()))))) OR  | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid() ) | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = contact_id AND c.user_id = auth.uid() ) | — |
| `stakeholder_alerts` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `suggested_life_events` | enabled | service_role: true<br>authenticated: (((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)) | service_role: true<br>authenticated: (((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)) | service_role: true<br>authenticated: (((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)) | service_role: true<br>authenticated: (((select auth.uid()) = user_id) OR has_role((select auth.uid()), 'admin'::app_role)) |
| `suggested_rapport_intel` | enabled | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | public: EXISTS (SELECT 1 FROM public.contacts WHERE id = contact_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `support_tickets` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `system_alerts` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: public.has_role(auth.uid(), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — |
| `system_config` | enabled | authenticated: true<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `system_health_snapshots` | enabled | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | — | — |
| `tasks` | enabled | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id | public: auth.uid() = user_id<br>public: auth.uid() = user_id |
| `ticket_comments` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `trigger_ab_tests` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `trigger_bundles` | enabled | authenticated: (((select auth.uid()) = user_id) OR (is_system_bundle = true)) | authenticated: (((select auth.uid()) = user_id) AND (COALESCE(is_system_bundle, false) = false)) | authenticated: (((select auth.uid()) = user_id) AND (is_system_bundle = false)) | authenticated: (((select auth.uid()) = user_id) AND (is_system_bundle = false)) |
| `trigger_channel_effectiveness` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `trigger_intensity_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `trigger_usage_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `user_known_devices` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `user_roles` | enabled | authenticated: ((select auth.uid()) = user_id)<br>authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) | authenticated: has_role((select auth.uid()), 'admin'::app_role) |
| `user_ui_preferences` | enabled | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `users` | não encontrado | authenticated: has_role(auth.uid(), 'admin'::app_role) | sem RLS | authenticated: has_role(auth.uid(), 'admin'::app_role) | sem RLS |
| `vak_analysis_history` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `validation_queue` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — |
| `visit_checkins` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `webauthn_credentials` | enabled | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) | authenticated: (user_id = (select auth.uid())) |
| `weekly_report_settings` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `weekly_reports` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) | authenticated: ((select auth.uid()) = user_id) |
| `whatsapp_ingestion_logs` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | — |
| `whatsapp_instances` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `whatsapp_kpis` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `whatsapp_messages` | enabled | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id)<br>public: ((select auth.uid()) = user_id) |
| `whatsapp_messages_index` | enabled | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = (select auth.uid()))) | authenticated: ((EXISTS ( SELECT 1 FROM contacts c WHERE ((c.id = whatsapp_messages_index.contact_id) AND (c.user_id = (select auth.uid()))) | — | authenticated: EXISTS ( SELECT 1 FROM public.contacts c WHERE c.id = whatsapp_messages_index.contact_id AND c.user_id = auth.uid() ) |
| `whatsapp_transcriptions` | enabled | public: (EXISTS ( SELECT 1 FROM whatsapp_messages m WHERE ((m.id = whatsapp_transcriptions.whatsapp_message_id) AND (m.user_id = (select aut | — | — | — |
| `win_loss_insights` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | — | public: ((select auth.uid()) = user_id) |
| `win_loss_reasons` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |
| `win_loss_records` | enabled | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) | public: ((select auth.uid()) = user_id) |

> `—` com RLS ligado = ninguém além de service_role. `sem RLS` = qualquer chave anon lê/escreve tudo.

## Onde o RLS é IGNORADO (service_role) — 290 arquivo(s)

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
- `supabase/functions/evolution-bitrix-connector/index.ts`
- `supabase/functions/evolution-webhook/helpers.ts`
- `supabase/functions/evolution-webhook/index.ts`
- `supabase/functions/external-data/actor-writes_test.ts`
- `supabase/functions/external-data/database.ts`
- `supabase/functions/external-data/index.ts`
- `supabase/functions/ficha360-conversation-summary/index.ts`
- `supabase/functions/forecast-analyzer/index.ts`
- `supabase/functions/forecast-narrative/index.ts`
- `supabase/functions/forecast-snapshot-cron/index.ts`
- `supabase/functions/form-submit-handler/index.ts`
- `supabase/functions/generate-behavioral-profile/index.ts`
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
- `supabase/functions/sync-social-interests/index.ts`
- `supabase/functions/system-health/index.ts`
- `supabase/functions/template-success-notifications/index.ts`
- `supabase/functions/territory-optimization/index.ts`
- `supabase/functions/validate-access/index.ts`
- `supabase/functions/validation-queue-worker/index.ts`
- `supabase/functions/voice-to-text/index.ts`
- `supabase/functions/weekly-digest/index.ts`
- `supabase/functions/whatsapp-import/index.ts`
- … +140 (lista completa em `context.json`)

## Funções SQL `SECURITY DEFINER` (rodam com privilégio do dono, ignoram RLS)

- `_connection_encryption_key`
- `add_tag`
- `aggregate_nlp_to_company`
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
- `audit_life_events`
- `audit_trigger_fn`
- `auto_ack_stale_mtta_sla_breaches`
- `auto_resolve_ai_gateway_alerts`
- `bulk_add_tag`
- `bulk_update_companies`
- `bulk_update_status`
- `buyer_add_comment`
- `buyer_toggle_milestone`
- `calculate_interaction_response_time`
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
- `create_economic_group`
- `create_notification`
- `create_smart_reminder`
- `create_template`
- `create_webhook`
- `decrypt_connection_config`
- `definir_como_filial`
- `definir_hierarquia_cooperativa`
- `detect_contact_intel_changes`
- `dismiss_revops_alert`
- `drop_old_ai_gateway_metrics_partitions`
- `encrypt_connection_config`
- `enqueue_behavioral_profile_regen`
- `enqueue_contact_validation`
- `enqueue_smart_notification`
- `enroll_contact_in_workflow`
- `ensure_ai_gateway_metrics_partition`
- `ensure_audit_log_partition`
- `evaluate_ai_gateway_alerts`
- `evaluate_mql`
- `fn_valida_dominio_signup`
- `generate_daily_digest`
- `generate_pre_contact_briefing`
- `generate_rapport_suggestions`
- `get_ai_gateway_health`
- `get_ai_gateway_partition_stats`
- `get_behavioral_regen_cron_health`
- `get_connection_metrics`
- `get_contact_sidebar_by_phone`
- `get_marketing_funnel_stats`
- `get_notification_summary`
- `get_public_csat_survey`
- `get_score_explicability`
- `get_system_config_num`
- `get_team_member_ids`
- `guard_contact_relation_write`
- `handle_new_user`
- `has_role`
- `increment_landing_page_view`
- `increment_playbook_usage`
- `increment_version_column`
- `increment_webhook_quota`
- `log_activity`
- `log_behavioral_change`
- `log_contact_tag_changes`
- `log_deal_forecast_category_change`
- `mark_deal_lost`
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
- `process_contact_cadence_audit`
- `process_contact_preferences_audit`
- `process_contact_relatives_audit`
- `process_contact_time_analysis_audit`
- `process_disc_analysis_audit`
- `process_interactions_audit`
- `process_reframing_audit`
- `publish_mtta_sla_breach_alert`
- `record_family_history`
- `record_nps_response`
- `record_rpc_perf_sample`
- `refresh_daily_kpis`
- `refresh_daily_stats`
- `remove_company_tag`
- `remove_tag`
- `reset_daily_lead_counts`
- `resolve_alerts_batch`
- `respond_to_proposal`
- `restore_company`
- `search_companies_semantic`
- `search_contacts_by_nlp`
- `search_contacts_semantic`
- `search_interactions_semantic`
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
- `soft_delete_company`
- `soft_delete_contact`
- `submit_public_csat_survey`
- `submit_public_form`
- `sync_contact_last_interaction`
- `sync_nlp_to_contact`
- `tg_mprl_touch_updated_at`
- `track_magnet_download`
- `trigger_aggregate_nlp_to_company`
- `trigger_lead_score_recompute`
- `update_company_partial`
- `update_company_status`
- `update_deal_amount`
- `update_deal_status`
- `upsert_company`
- `vincular_empresa_grupo`

## Edge functions públicas (sem JWT — qualquer um chama)

_nenhuma declarada em config.toml_

## Rotas protegidas no front

| Rota | Guard | Roles | Arquivo |
|---|---|---|---|
| / | Protected |  | `scripts/inventario/gerar-rotas.test.mjs` |
| / | Protected |  | `src/app/AppRoutes.tsx` |
| /abm | Protected |  | `src/app/AppRoutes.tsx` |
| /abm/:id | Protected |  | `src/app/AppRoutes.tsx` |
| /abm/campanhas | Protected |  | `src/app/AppRoutes.tsx` |
| /app | ProtectedRoute |  | `scripts/ai-context/gerar.unit.mjs` |
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
| grant | anon | execute | `get_deal_room_by_token`, `get_buyer_document_path`, `buyer_add_comment`, `buyer_toggle_milestone`, `record_buyer_view`, `submit_public_form`, `track_magnet_download`, `increment_form_view`, `increment_magnet_view`, `increment_landing_page_view` |
| grant | anon | insert | `deal_room_activities`, `landing_page_submissions`, `landing_page_submissions` |
| grant | anon | select | `csat_surveys`, `document_signatures`, `forms`, `landing_page_submissions`, `landing_pages`, `deal_rooms`, `deal_room_milestones`, `deal_room_stakeholders`, `deal_room_documents`, `deal_room_comments`, `deal_room_activities`, `deal_room_comments`, `deal_room_documents`, `deal_room_milestones`, `deal_room_stakeholders` … +6 |
| grant | anon | select, insert | `deal_room_activities` |
| grant | anon | select, update | `csat_surveys` |
| grant | anon, authenticated | execute | `get_deal_room_by_token`, `record_buyer_view`, `buyer_toggle_milestone`, `buyer_add_comment`, `get_buyer_document_path`, `increment_magnet_view`, `track_magnet_download`, `increment_form_view`, `submit_public_form` |
| grant | anon, authenticated | select | `csat_surveys_public`, `forms_public`, `landing_pages_public`, `document_signatures_public` |
| grant | anon, authenticated, service_role | execute | `get_public_csat_survey`, `submit_public_csat_survey`, `increment_landing_page_view`, `get_public_csat_survey`, `submit_public_csat_survey` |
| grant | authenticated | execute | `seed_deal_room`, `encrypt_connection_config`, `decrypt_connection_config`, `get_connection_metrics`, `compute_attribution`, `check_relationship_consistency`, `get_contact_behavior_gaps`, `validate_behavioral_consistency`, `get_contact_framework_gaps`, `get_contact_life_event_gaps`, `get_connection_metrics`, `seed_conversation_topics`, `compute_account_health`, `cs_renewal_pipeline`, `seed_forecast_period` … +35 |
| grant | authenticated | select | `v_life_events_audit`, `slow_queries_audit`, `v_entities`, `behavioral_profile_regen_queue`, `contact_analytical_profile_versions`, `system_config`, `document_signatures_public`, `csat_surveys_public`, `mv_daily_kpis`, `mv_daily_stats`, `data_retention_policies`, `ai_gateway_metrics`, `rpc_perf_samples`, `rpc_plan_snapshots`, `users_public` … +7 |
| grant | authenticated | select, insert | `audit_log`, `rfm_history` |
| grant | authenticated | select, insert, update | `migration_password_reset_log` |
| grant | authenticated | select, insert, update, delete | `abm_account_plans`, `abm_accounts`, `abm_buying_committee`, `abm_campaigns`, `abm_whitespace_opportunities`, `access_blocked_log`, `access_security_settings`, `activities`, `ai_chat_messages`, `ai_chat_threads`, `ai_recommendation_audit_logs`, `ai_recommendation_audit_logs_v2`, `ai_recommendation_logs`, `ai_tone_preferences`, `alerts` … +246 |
| grant | authenticated, service_role | execute | `get_system_config_num`, `assert_self_user_id`, `assert_self_user_id`, `assert_company_access`, `assert_contact_access`, `assert_deal_access`, `assert_event_access`, `assert_interaction_access`, `assert_note_access`, `assert_reminder_access`, `assert_task_access`, `assert_visit_access`, `assert_notification_access`, `assert_proposal_access`, `assert_goal_access` … +17 |
| grant | authenticated, service_role | select | `vw_rodizio_carga_closers`, `vw_rodizio_carga_sdrs`, `vw_rodizio_execucoes`, `vw_rodizio_bloqueios`, `vw_rodizio_kpis`, `vw_rodizio_execucoes`, `vw_singu_data_health`, `_dormant.inactivity_alerts` |
| grant | service_role | all | `_migration_cdc_checkpoint`, `abm_account_plans`, `abm_accounts`, `abm_buying_committee`, `abm_campaigns`, `abm_whitespace_opportunities`, `access_blocked_log`, `access_security_settings`, `activities`, `ai_chat_messages`, `ai_chat_threads`, `ai_recommendation_audit_logs`, `ai_recommendation_audit_logs_v2`, `ai_recommendation_logs`, `ai_tone_preferences` … +263 |
| grant | service_role | execute | `increment_webhook_quota`, `execute_readonly_query`, `cleanup_behavioral_regen_queue`, `check_behavioral_regen_cron_staleness`, `cleanup_simulated_alerts`, `auto_ack_stale_mtta_sla_breaches`, `check_mtta_auto_ack_heartbeat`, `execute_readonly_query`, `claim_validation_batch`, `claim_regen_batch`, `assert_alert_access`, `assert_cadence_access`, `assert_company_access`, `assert_contact_access`, `assert_customer_access` … +63 |
| grant | service_role | select, insert, delete | `incoming_webhook_nonces` |
| grant | service_role, authenticated | execute | `ensure_audit_log_partition`, `ensure_audit_log_partition` |
| revoke | PUBLIC | all | `_migration_schema_snapshot`, `get_connection_metrics`, `cleanup_behavioral_regen_queue`, `cleanup_simulated_alerts`, `assert_self_user_id`, `assert_self_user_id`, `assert_deal_access`, `assert_event_access`, `assert_interaction_access`, `assert_note_access`, `assert_reminder_access`, `assert_task_access`, `record_rpc_perf_sample`, `get_rpc_perf_stats`, `cleanup_rpc_perf_samples` … +11 |
| revoke | PUBLIC | execute | `execute_readonly_query`, `handle_new_user`, `publish_mtta_sla_breach_alert`, `execute_readonly_query`, `claim_validation_batch`, `claim_regen_batch`, `net` |
| revoke | PUBLIC | select | `mv_daily_kpis`, `mv_daily_stats` |
| revoke | PUBLIC, anon | all | `auto_ack_stale_mtta_sla_breaches`, `get_system_config_num`, `assert_company_access`, `assert_contact_access`, `assert_deal_access`, `assert_event_access`, `assert_interaction_access`, `assert_note_access`, `assert_reminder_access`, `assert_task_access`, `assert_visit_access`, `assert_notification_access`, `assert_proposal_access`, `assert_goal_access`, `assert_violation_access` … +29 |
| revoke | PUBLIC, anon | execute | `ensure_audit_log_partition`, `ensure_audit_log_partition`, `get_ai_gateway_health`, `has_role` |
| revoke | PUBLIC, anon, authenticated | all | `_connection_encryption_key`, `check_mtta_auto_ack_heartbeat`, `assert_alert_access`, `assert_cadence_access`, `assert_company_access`, `assert_contact_access`, `assert_customer_access`, `assert_deal_access`, `assert_event_access`, `assert_goal_access`, `assert_interaction_access`, `assert_note_access`, `assert_notification_access`, `assert_opportunity_access`, `assert_proposal_access` … +75 |
| revoke | PUBLIC, anon, authenticated | execute | `evaluate_ai_gateway_alerts`, `set_updated_at`, `trg_normalizar_telefone`, `trg_normalizar_email`, `singu_sync_company_address`, `singu_sync_legacy_company_name` |
| revoke | PUBLIC, anon, authenticated | truncate, references, trigger | `public` |
| revoke | PUBLIC, anon, authenticated | update | `validation_queue`, `behavioral_profile_regen_queue` |
| revoke | PUBLIC, anon, authenticated, service_role | all | `guard_contact_relation_write` |
| revoke | PUBLIC, anon, service_role | all | `resume_sequence_email`, `merge_records_atomically`, `merge_records_atomically` |
| revoke | PUBLIC, authenticated | all | `cron_secrets` |
| revoke | PUBLIC, authenticated | insert, update, delete | `login_attempts` |
| revoke | PUBLIC, authenticated, anon | execute | `public` |
| revoke | anon | all | `public`, `assert_self_user_id`, `assert_self_user_id`, `get_contact_sidebar_by_phone`, `public`, `public`, `get_contact_sidebar_by_phone` |
| revoke | anon | execute | `execute_readonly_query`, `handle_new_user`, `publish_mtta_sla_breach_alert`, `execute_readonly_query`, `net`, `check_behavioral_regen_cron_staleness`, `cleanup_behavioral_regen_queue`, `cleanup_simulated_alerts`, `enqueue_behavioral_profile_regen`, `get_behavioral_regen_cron_health`, `notify_admins_on_critical_behavioral_alert`, `simulate_behavioral_regen_alert`, `cleanup_cron_job_run_details` |
| revoke | anon | insert, update, delete | `deal_rooms`, `deal_room_milestones`, `deal_room_stakeholders`, `deal_room_documents`, `deal_room_comments`, `forms`, `lead_magnets`, `landing_pages` |
| revoke | anon | select | `document_signatures_public`, `csat_surveys_public` |
| revoke | anon | select, insert, update, delete | `form_submissions`, `lead_magnet_downloads`, `deal_room_activities` |
| revoke | anon | select, update, delete | `landing_page_submissions` |
| revoke | anon | update, delete | `deal_room_activities` |
| revoke | anon, authenticated | all | `incoming_webhook_nonces` |
| revoke | anon, authenticated, PUBLIC | execute | `tg_set_updated_at`, `touch_system_config`, `update_bpr_queue_updated_at`, `validate_entity_relationship`, `cleanup_behavioral_regen_queue`, `execute_readonly_query`, `increment_webhook_quota`, `publish_mtta_sla_breach_alert`, `reset_daily_lead_counts`, `compute_attribution` |
| revoke | authenticated | all | `get_contact_sidebar_by_phone`, `get_contact_sidebar_by_phone` |
| revoke | authenticated | execute | `execute_readonly_query`, `handle_new_user`, `execute_readonly_query`, `net`, `cleanup_cron_job_run_details` |
| revoke | authenticated | update | `public` |
| revoke | authenticated, PUBLIC | execute | `enqueue_behavioral_profile_regen`, `notify_admins_on_critical_behavioral_alert`, `check_behavioral_regen_cron_staleness`, `cleanup_simulated_alerts`, `get_behavioral_regen_cron_health`, `simulate_behavioral_regen_alert` |
| revoke | authenticated, anon, PUBLIC | execute | `audit_life_events`, `audit_trigger_fn`, `audit_connection_changes`, `calculate_interaction_response_time`, `calculate_next_contact_due`, `connection_configs_encrypt_trigger`, `detect_contact_intel_changes`, `enqueue_contact_validation`, `handle_new_user`, `increment_playbook_usage`, `increment_version_column`, `log_behavioral_change`, `log_contact_tag_changes`, `log_deal_forecast_category_change`, `notify_connection_failures` … +42 |
| revoke | service_role | execute | `confirm_sequence_manual_step` |

## Riscos de acesso detectados

| Tabela | Problema | Arquivos |
|---|---|---|
| `company_addresses` | acessada do front (3 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useBIAdvanced.ts`<br>`src/hooks/useConversationalSearch.ts`<br>`src/pages/MapaEmpresas.tsx` |
| `company_emails` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useDedupEngine.ts` |
| `company_phones` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useDedupEngine.ts` |
| `crm_automation_logs` | front faz UPDATE mas nenhuma política RLS permite UPDATE → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| `crm_automation_reprocess_queue` | front faz INSERT mas nenhuma política RLS permite INSERT → vai falhar/retornar vazio para usuários | `src/components/crm/CRMAutomationAuditLog.tsx` |
| `incoming_webhook_nonces` | RLS ligado sem nenhuma política → só service_role acessa |  |
| `rodizio_distribuicao_staging` | RLS ligado sem nenhuma política → só service_role acessa | `src/hooks/useRodizioOndas.ts` |
| `users` | acessada do front (1 arquivo(s)) sem RLS (não encontrado) | `src/hooks/useRodizioEquipe.ts` |

## Multi-tenancy

- Chave de tenant: **`company_id`** presente em 25 tabela(s): `ai_tone_preferences`, `call_logs`, `contacts`, `cs_accounts`, `deal_forecasts`, `deal_rooms`, `document_signatures`, `handoff_requests`, `intent_signals`, `interaction_summaries`, `interactions`, `lead_assignments`, `neuro_pnl_sessions`, `redistribution_log`, `rfm_analysis`, `stakeholder_alerts`, `support_tickets`, `visit_checkins`, `whatsapp_messages`, `deals`, `customer_purchases`, `company_phones`, `company_emails`, `company_addresses`, `_dormant.inactivity_alerts`
- Cobertura: 9% das tabelas. Abaixo de 60% — isolamento provavelmente por usuário (auth.uid()) ou misto; não flagado por tabela.

## Soft delete (registros 'apagados' continuam na tabela — filtre!)

| Tabela | Coluna |
|---|---|
| `ai_chat_threads` | `archived` |
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
| `ip_whitelist` | `is_active` |
| `lead_routing_rules` | `is_active` |
| `lead_score_rules` | `active` |
| `lead_score_threshold_automations` | `active` |
| `lux_webhook_config` | `is_active` |
| `mql_criteria` | `is_active` |
| `nurturing_workflows` | `is_active` |
| `phone_validations` | `is_active` |
| `sales_playbooks` | `active` |
| `sales_team_members` | `is_active` |
| `trigger_ab_tests` | `is_active` |
| `win_loss_reasons` | `active` |
| `data_retention_policies` | `is_active` |
| `salespeople` | `is_active` |
| `sales` | `deleted_at` |
| `sales_activities` | `deleted_at` |

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
| `churn_risk_scores` | `created_at`, `updated_at` |
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
| `csat_surveys` | `created_at`, `updated_at` |
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
| `document_views` | `created_at` |
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
| `ip_whitelist` | `created_at`, `updated_at` |
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
| `lead_scores` | `created_at`, `updated_at` |
| `life_events` | `created_at`, `updated_at` |
| `login_attempts` | `created_at` |
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
| `notification_preferences` | `created_at`, `updated_at` |
| `nurturing_enrollments` | `created_at` |
| `nurturing_executions` | `created_at`, `updated_at` |
| `nurturing_workflows` | `created_at`, `updated_at` |
| `objection_example_feedback` | `created_at`, `updated_at` |
| `offer_suggestions` | `created_at` |
| `password_reset_requests` | `created_at` |
| `people_intelligence_events` | `created_at` |
| `permissions` | `created_at` |
| `phone_validations` | `created_at`, `updated_at` |
| `pipeline_stages` | `created_at`, `updated_at` |
| `pipelines` | `created_at`, `updated_at` |
| `profiles` | `created_at`, `updated_at` |
| `proximo_passo_feedback` | `created_at` |
| `psychographic_audit_log` | `created_at` |
| `purchase_history` | `created_at`, `updated_at` |
| `push_subscriptions` | `created_at`, `updated_at` |
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
| `role_permissions` | `created_at` |
| `sales_playbooks` | `created_at`, `updated_at` |
| `sales_team_members` | `created_at`, `updated_at` |
| `schema_drift_alerts` | `created_at` |
| `score_history` | `created_at` |
| `search_products_cache` | `created_at`, `updated_at` |
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
| `ticket_comments` | `created_at` |
| `trigger_ab_tests` | `created_at`, `updated_at` |
| `trigger_bundles` | `created_at`, `updated_at` |
| `trigger_channel_effectiveness` | `created_at`, `updated_at` |
| `trigger_intensity_history` | `created_at` |
| `trigger_usage_history` | `created_at` |
| `user_known_devices` | `created_at` |
| `user_ui_preferences` | `created_at`, `updated_at` |
| `vak_analysis_history` | `created_at` |
| `validation_queue` | `created_at` |
| `visit_checkins` | `created_at` |
| `webauthn_credentials` | `created_at` |
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
| `deals` | `created_at`, `updated_at` |
| `pipeline_stage_transitions` | `created_at` |
| `audit_log` | `created_at` |
| `notifications` | `created_at` |
| `tasks` | `created_at`, `updated_at` |
| `social_insights` | `created_at`, `updated_at` |
| `data_retention_policies` | `created_at`, `updated_at` |
| `ai_gateway_metrics` | `created_at` |
| `rpc_perf_samples` | `created_at` |
| `customer_purchases` | `created_at` |
| `customer_rotation_state` | `updated_at` |
| `incoming_webhook_nonces` | `created_at` |
| `estados` | `created_at` |
| `cidades` | `created_at` |
| `company_phones` | `created_at`, `updated_at` |
| `company_emails` | `created_at`, `updated_at` |
| `company_addresses` | `created_at`, `updated_at` |
| `salespeople` | `created_at`, `updated_at` |
| `sales` | `created_at`, `deleted_by`, `updated_at` |
| `sales_activities` | `created_at`, `deleted_by` |
| `contact_emails` | `created_at`, `updated_at` |
| `contact_phones` | `created_at`, `updated_at` |
| `_dormant.inactivity_alerts` | `created_at` |
| `sequence_email_reservations` | `created_at` |

## Dados pessoais / sensíveis (LGPD — cuidado em logs, exports, prompts de IA)

| Tabela | Coluna |
|---|---|
| `access_blocked_log` | `ip_address` |
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
| `email_verifications` | `email` |
| `ip_whitelist` | `ip_address` |
| `landing_page_submissions` | `email` |
| `landing_page_submissions` | `phone` |
| `landing_page_submissions` | `ip_address` |
| `lead_magnet_downloads` | `email` |
| `login_attempts` | `email` |
| `login_attempts` | `ip_address` |
| `password_reset_requests` | `email` |
| `profiles` | `phone` |
| `profiles` | `email` |
| `sales_team_members` | `email` |
| `sms_campaign_recipients` | `phone` |
| `sms_opt_outs` | `phone` |
| `social_consent_audit` | `ip_address` |
| `visit_checkins` | `latitude` |
| `visit_checkins` | `longitude` |
| `visit_checkins` | `address` |
| `cidades` | `latitude` |
| `cidades` | `longitude` |
| `company_emails` | `email` |
| `company_addresses` | `cep` |
| `company_addresses` | `logradouro` |
| `company_addresses` | `latitude` |
| `company_addresses` | `longitude` |
| `salespeople` | `email` |
| `contact_emails` | `email` |

## Colunas de dinheiro (tipo importa: numeric ✅ / float ❌)

| Tabela | Coluna | Tipo |
|---|---|---|
| `attribution_models_cache` | `total_value` | `NUMERIC` |
| `contact_report_overrides` | `custom_scripts` | `JSONB` |
| `contact_time_analysis` | `total_attempts` | `INTEGER` |
| `csat_surveys` | `feedback` | `TEXT` |
| `disc_conversion_metrics` | `total_contacts` | `INTEGER` |
| `disc_conversion_metrics` | `total_opportunities` | `INTEGER` |
| `email_campaigns` | `total_recipients` | `INTEGER` |
| `email_campaigns` | `total_opened` | `INTEGER` |
| `email_campaigns` | `total_clicked` | `INTEGER` |
| `email_campaigns` | `total_bounced` | `INTEGER` |
| `incoming_webhooks` | `total_calls` | `BIGINT` |
| `incoming_webhooks` | `total_errors` | `BIGINT` |
| `lead_score_history` | `total_score` | `NUMERIC(5,2)` |
| `lead_scores` | `total_score` | `NUMERIC(5,2)` |
| `marketing_roi_data` | `customers_acquired` | `INTEGER` |
| `nlp_feedback` | `feedback_notes` | `TEXT` |
| `purchase_history` | `amount` | `DECIMAL(12,2)` |
| `reframing_analysis` | `feedback` | `TEXT` |
| `revops_snapshots` | `total_value` | `NUMERIC(14,2)` |
| `rfm_analysis` | `total_score` | `INTEGER` |
| `rfm_analysis` | `total_purchases` | `INTEGER` |
| `rfm_analysis` | `total_interactions` | `INTEGER` |
| `rfm_analysis` | `total_monetary_value` | `DECIMAL(12,2)` |
| `rfm_history` | `total_monetary_value` | `DECIMAL(12,2)` |
| `rfm_metrics` | `total_contacts_analyzed` | `INTEGER` |
| `rfm_metrics` | `total_revenue` | `DECIMAL(12,2)` |
| `search_products_cache` | `price` | `NUMERIC` |
| `sequences` | `total_enrolled` | `integer` |
| `sequences` | `total_completed` | `integer` |
| `sequences` | `total_replied` | `integer` |
| `sms_campaign_recipients` | `cost_cents` | `integer` |
| `sms_campaigns` | `total_recipients` | `integer` |
| `sms_campaigns` | `total_sent` | `integer` |
| `sms_campaigns` | `total_delivered` | `integer` |
| `sms_campaigns` | `total_failed` | `integer` |
| `sms_campaigns` | `total_replies` | `integer` |
| `sms_campaigns` | `total_opt_outs` | `integer` |
| `sms_campaigns` | `cost_estimate_cents` | `integer` |
| `system_health_snapshots` | `total_latency_ms` | `INTEGER` |
| `trigger_bundles` | `total_uses` | `INTEGER` |
| `deals` | `valor` | `numeric` |
| `rpc_plan_snapshots` | `total_cost` | `numeric` |
| `customer_purchases` | `valor` | `numeric(14,2)` |
| `rodizio_execucoes` | `total_elegiveis` | `integer` |
| `rodizio_execucoes` | `total_rotacionados` | `integer` |
| `salespeople` | `commission_rate` | `numeric(5,2)` |
| `sales` | `amount` | `numeric(12,2)` |
