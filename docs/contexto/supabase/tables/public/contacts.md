# public.contacts

> Cadastro de pessoas/contatos comerciais vinculados opcionalmente a uma empresa. Reúne identificação, canais de contato, papéis de compra, atributos comportamentais e dados derivados. PK: id. company_id referencia public.companies.id; duplicate_of referencia public.contacts.id; assigned_by_id referencia public.users.id. Preferir as tabelas contact_emails, contact_phones e contact_social_media para múltiplos canais quando apropriado; não assumir que os campos legados equivalem a essas tabelas.

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 10 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_companies_metrics, public.v_contact_summary, public.v_daily_kpis, public.v_dashboard_kpis, public.v_entities, public.vw_active_alerts, public.vw_apelidos_progresso, public.vw_best_closing_moments, public.vw_carrier_data_quality, public.vw_churn_risk_ranking, public.vw_closing_score_alerts, public.vw_closing_score_ranking, public.vw_communication_dashboard, public.vw_companies_completo, public.vw_companies_duplicatas, public.vw_companies_stats, public.vw_contact_social_media, public.vw_contacts_completo, public.vw_contacts_contato, public.vw_contacts_full, public.vw_contacts_sem_apelido, public.vw_deal_velocity_benchmark, public.vw_deals_full, public.vw_disc_compatibility, public.vw_emotional_trend_by_contact, public.vw_eq_dashboard, public.vw_eq_evolution, public.vw_interacoes_sem_apelido, public.vw_interaction_timeline, public.vw_leads_full, public.vw_notification_dashboard, public.vw_pending_followups, public.vw_pending_notifications, public.vw_rapport_points, public.vw_satisfaction_trend, public.vw_search_contacts, public.vw_singu_communication_intel, public.vw_singu_contact_360, public.vw_singu_data_health, public.vw_singu_emotional_trend, public.vw_singu_lux_status, public.vw_singu_rapport_intel, public.vw_singu_readiness, public.vw_singu_usage_kpis, public.vw_social_media_stats, public.vw_supplier_data_quality, public.vw_todays_reminders, reporting.mv_daily_kpis, reporting.mv_daily_stats, zapp_history.contact_message_stats, zapp_history.v_churn_alerts, zapp_history.v_competitor_alerts, zapp_history.v_contact_360, zapp_history.v_conversas_aguardando, zapp_history.v_full_intelligence_stream, zapp_history.v_intelligence_360, zapp_history.v_pedidos_detectados, zapp_history.v_proximas_respostas, zapp_history.v_recent_summaries, zapp_history.v_routing_queue, zapp_history.v_top_contatos_potencial |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador UUID único do contato; PK, gerado por gen_random_uuid(). |
| 2 | `company_id` | `uuid` | sim |  |  | Empresa associada ao contato; FK para public.companies.id. Nulo quando não há empresa vinculada. |
| 3 | `bitrix_contact_id` | `integer` | sim |  |  | Identificador integer do contato no Bitrix24; opcional. |
| 4 | `first_name` | `text` | sim |  |  | Primeiro nome do contato; texto opcional. |
| 5 | `last_name` | `text` | sim |  |  | Sobrenome do contato; texto opcional. |
| 11 | `cargo` | `text` | sim |  |  | Cargo profissional do contato em texto livre. |
| 12 | `departamento` | `text` | sim |  |  | Departamento do contato. Valores aceitos: Compras, Marketing, RH, Diretoria, Financeiro, Comercial e Gestão; também pode ser NULL. |
| 13 | `cpf` | `text` | sim |  |  | CPF armazenado como texto. CHECK exige exatamente 11 dígitos após remover caracteres não numéricos; pontuação pode existir no valor armazenado. |
| 14 | `data_nascimento` | `date` | sim |  |  | Data de nascimento sem horário; tipo date. |
| 15 | `sexo` | `text` | sim |  |  | Classificação textual de sexo; valores permitidos não estão documentados no schema. |
| 18 | `assigned_by_id` | `integer` | sim |  |  | Identificador integer do usuário/colaborador que atribuiu o contato; FK para public.users.id. |
| 19 | `source` | `data_source` | sim |  |  | Origem do cadastro, enum data_source: CRM, SPA_CLIENTE, SPA_FORNECEDOR, SPA_TRANSPORTADORA, MERGED, MANUAL, LINKEDIN, LUSHA, LEADCONTACT ou WHATSAPP. |
| 20 | `extra_data` | `jsonb` | sim |  |  | Atributos adicionais do contato em JSONB; sem esquema fixo de chaves. |
| 21 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro no banco; DEFAULT now(), timestamptz. |
| 22 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada; DEFAULT now(). Atualização automática depende de trigger/aplicação. |
| 23 | `bitrix_created_at` | `timestamp with time zone` | sim |  |  | Data e hora de criação no Bitrix24, quando disponível. |
| 24 | `role` | `text` | sim |  |  | Papel do contato no processo de compra: owner, manager, buyer, contact, decision_maker ou influencer. |
| 25 | `hobbies` | `text[]` | sim | `'{}'::text[]` |  | Array textual de hobbies; DEFAULT vazio. |
| 26 | `interests_array` | `text[]` | sim | `'{}'::text[]` |  | Array textual de interesses; DEFAULT vazio. |
| 27 | `family_info` | `text` | sim |  |  | Informações familiares em texto livre; pode conter dados pessoais. |
| 28 | `personal_notes` | `text` | sim |  |  | Anotações pessoais em texto livre; pode conter dados pessoais. |
| 29 | `relationship_stage` | `text` | sim | `'unknown'::text` |  | Etapa do relacionamento: unknown, prospect, qualified_lead, opportunity, negotiation, customer, loyal_customer, advocate, at_risk ou lost. DEFAULT unknown. |
| 30 | `relationship_score` | `integer` | sim | `50` |  | Score inteiro de relacionamento de 0 a 100, conforme CHECK; DEFAULT 50. |
| 31 | `sentiment` | `text` | sim | `'neutral'::text` |  | Sentimento categórico: positive, neutral ou negative. DEFAULT neutral. |
| 32 | `behavior` | `jsonb` | sim | `'{"vakProfile": {"scores": {"visual": 0, "digital": 0, "auditory": 0, "kinesthetic": 0}, "primary": null}, "discProfile": null, "supportLevel": 5, "decisionPower": 5, "influencesIds": [], "needsApproval": false, "discConfidence": 0, "formalityLevel": 3, "competitorsUsed": [], "influencedByIds": [], "decisionCriteria": [], "preferredChannel": "whatsapp", "currentChallenges": [], "temperamentProfile": {"primary": null}}'::jsonb` |  | Perfil comportamental em JSONB. DEFAULT contém campos VAK/DISC e preferências; consultar o JSON efetivo para chaves e subestruturas. |
| 33 | `life_events` | `jsonb` | sim | `'[]'::jsonb` |  | Eventos de vida em JSONB; DEFAULT array JSON vazio. Não confundir com a tabela relacional public.life_events. |
| 34 | `tags_array` | `text[]` | sim | `'{}'::text[]` |  | Array textual de tags; DEFAULT vazio. |
| 35 | `birthday` | `date` | sim |  |  | Data de aniversário sem horário; pode diferir de data_nascimento caso seja usada apenas para lembretes. |
| 36 | `notes` | `text` | sim |  |  | Notas gerais em texto livre sobre o contato. |
| 37 | `user_id` | `uuid` | não |  |  | UUID do usuário proprietário/associado ao contato. NOT NULL no schema; não há FK declarada nesta coluna na inspeção. |
| 38 | `full_name` | `text` | sim | `TRIM(BOTH FROM ((COALESCE(first_name, ''::text) \|\| ' '::text) \|\| COALESCE(last_name, ''::text)))` | s | Nome completo gerado automaticamente a partir de first_name e last_name, com espaços aparados; coluna gerada. |
| 39 | `is_duplicate` | `boolean` | sim | `false` |  | Indicador de duplicidade. TRUE identifica registro marcado como duplicado; FALSE não marcado. DEFAULT false. |
| 40 | `duplicate_of` | `uuid` | sim |  |  | UUID do contato considerado registro canônico para este duplicado; FK autorreferente para public.contacts.id. |
| 42 | `deleted_at` | `timestamp with time zone` | sim |  |  | Data e hora da exclusão lógica do contato; NULL indica ausência de marca temporal de exclusão. |
| 43 | `deleted_by` | `uuid` | sim |  |  | UUID do usuário que registrou a exclusão lógica; não há FK declarada na inspeção. |
| 44 | `search_vector` | `tsvector` | sim |  |  | Vetor tsvector para busca textual; dado técnico derivado, não é conteúdo de exibição. |
| 45 | `nome_tratamento` | `character varying(100)` | sim |  |  | Nome recomendado para tratamento em automações; comentário existente diz que é preenchido a partir de full_name. |
| 46 | `apelido` | `character varying(100)` | sim |  |  | Apelido informal do contato, preenchido manualmente conforme comentário existente. |
| 47 | `assinatura_contato` | `character varying(150)` | sim |  |  | Forma de assinatura em documentos/e-mails; comentário existente indica nome abreviado ou de assinatura. |
| 48 | `role_title` | `text` | sim |  |  | Título profissional do contato em texto; distinto de cargo, sem regra de sincronização definida. |
| 49 | `email` | `text` | sim |  |  | E-mail principal/legado do contato em texto. Para múltiplos e-mails tipados, consultar public.contact_emails. |
| 50 | `phone` | `text` | sim |  |  | Telefone principal/legado em texto. Para múltiplos telefones tipados, consultar public.contact_phones. |
| 51 | `whatsapp` | `text` | sim |  |  | Número ou identificador de WhatsApp em texto; normalização não especificada. |
| 52 | `linkedin` | `text` | sim |  |  | URL ou identificador do perfil LinkedIn; formato não restringido pelo schema. |
| 53 | `instagram` | `text` | sim |  |  | URL ou identificador do perfil Instagram; formato não restringido pelo schema. |
| 54 | `twitter` | `text` | sim |  |  | URL ou identificador do perfil X/Twitter; formato não restringido pelo schema. |
| 55 | `avatar_url` | `text` | sim |  |  | URL do avatar/foto do contato. |
| 56 | `tags` | `text[]` | sim | `'{}'::text[]` |  | Array textual de tags; DEFAULT vazio. É distinta de tags_array e não possui catálogo definido. |
| 57 | `interests` | `text[]` | sim | `'{}'::text[]` |  | Array textual de interesses; distinta de interests_array, sem regra de sincronização documentada. |
| 58 | `vak_dominant` | `text` | sim |  |  | Modalidade VAK dominante em texto; valores e convenção não especificados pelo schema. |
| 59 | `motivation_direction` | `text` | sim |  |  | Direção motivacional em texto; valores permitidos não estão definidos na coluna. |
| 60 | `working_style` | `text` | sim |  |  | Estilo de trabalho textual; domínio não formalizado no schema. |
| 61 | `reference_frame` | `text` | sim |  |  | Referencial de avaliação/comunicação textual; domínio não formalizado. |
| 62 | `chunk_size` | `text` | sim |  |  | Preferência de granularidade da informação em texto; valores não enumerados. |
| 63 | `action_filter` | `text` | sim |  |  | Preferência/filtro de ação em texto; valores não enumerados. |
| 64 | `comparison_style` | `text` | sim |  |  | Estilo de comparação em texto; valores não enumerados. |
| 65 | `most_frequent_objection` | `text` | sim |  |  | Objeção mais frequente em texto livre. |
| 66 | `vak_profile` | `jsonb` | sim |  |  | Perfil VAK estruturado em JSONB; esquema interno não declarado. |
| 67 | `metaprogram_profile` | `jsonb` | sim |  |  | Perfil de metaprogramas estruturado em JSONB; esquema interno não declarado. |
| 68 | `emotional_state` | `text` | sim |  |  | Estado emocional em texto; catálogo não declarado. |
| 69 | `emotional_confidence` | `numeric(5,2)` | sim |  |  | Confiança numérica da análise emocional; escala/unidade não declarada. Não assumir intervalo 0–1 ou 0–100. |
| 70 | `emotional_trigger` | `text` | sim |  |  | Gatilho emocional associado, em texto livre. |
| 71 | `last_interaction_at` | `timestamp with time zone` | sim |  |  | Data e hora da última interação registrada para o contato, timestamptz. |
| 72 | `objection_patterns` | `jsonb` | sim |  |  | Padrões de objeções em JSONB; estrutura interna não formalizada. |
| 73 | `version` | `integer` | não | `0` |  | Contador inteiro de versão do registro; DEFAULT 0. Regra de incremento não declarada. |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_contacts_cpf_length | CHECK | `CHECK (cpf IS NULL OR length(regexp_replace(cpf, '\D'::text, ''::text, 'g'::text)) = 11)` |  |  | sim |
| chk_contacts_score_range | CHECK | `CHECK (relationship_score IS NULL OR relationship_score >= 0 AND relationship_score <= 100)` |  |  | sim |
| chk_departamento | CHECK | `CHECK (departamento IS NULL OR (departamento = ANY (ARRAY['Compras'::text, 'Marketing'::text, 'RH'::text, 'Diretoria'::text, 'Financeiro'::text, 'Comercial'::text, 'Gestão'::text])))` |  |  | sim |
| contacts_assigned_by_id_fkey | FOREIGN KEY | `FOREIGN KEY (assigned_by_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| contacts_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| contacts_duplicate_of_fkey | FOREIGN KEY | `FOREIGN KEY (duplicate_of) REFERENCES contacts(id)` | NO ACTION | NO ACTION | sim |
| contacts_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| contacts_relationship_score_check | CHECK | `CHECK (relationship_score >= 0 AND relationship_score <= 100)` |  |  | sim |
| contacts_relationship_stage_check | CHECK | `CHECK (relationship_stage = ANY (ARRAY['unknown'::text, 'prospect'::text, 'qualified_lead'::text, 'opportunity'::text, 'negotiation'::text, 'customer'::text, 'loyal_customer'::text, 'advocate'::text, 'at_risk'::text, 'lost'::text]))` |  |  | sim |
| contacts_role_check | CHECK | `CHECK (role = ANY (ARRAY['owner'::text, 'manager'::text, 'buyer'::text, 'contact'::text, 'decision_maker'::text, 'influencer'::text]))` |  |  | sim |
| contacts_sentiment_check | CHECK | `CHECK (sentiment = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.carrier_contacts | carrier_contacts_contact_id_fkey | contact_id | CASCADE |
| _dormant.client_values | client_values_contact_id_fkey | contact_id | CASCADE |
| _dormant.cognitive_bias_history | cognitive_bias_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.cognitive_biases | cognitive_biases_contact_id_fkey | contact_id | CASCADE |
| _dormant.communication_cadence | communication_cadence_contact_id_fkey | contact_id | CASCADE |
| _dormant.communication_preferences | communication_preferences_contact_id_fkey | contact_id | CASCADE |
| _dormant.compatibility_alerts | compatibility_alerts_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_availability | contact_availability_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_cadence | contact_cadence_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_compatibility | contact_compatibility_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_metaprograms | contact_metaprograms_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_preferences | contact_preferences_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_relationships | contact_relationships_contact_a_id_fkey | contact_a_id | CASCADE |
| _dormant.contact_relationships | contact_relationships_contact_b_id_fkey | contact_b_id | CASCADE |
| _dormant.contact_rfm_scores | contact_rfm_scores_contact_id_fkey | contact_id | CASCADE |
| _dormant.contact_time_analysis | contact_time_analysis_contact_id_fkey | contact_id | CASCADE |
| _dormant.customer_contacts | customer_contacts_contact_id_fkey | contact_id | CASCADE |
| _dormant.deals | deals_contact_id_fkey | contact_id | NO ACTION |
| _dormant.decision_criteria | decision_criteria_contact_id_fkey | contact_id | CASCADE |
| _dormant.disc_analysis_history | disc_analysis_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.disc_communication_logs | disc_communication_logs_contact_id_fkey | contact_id | CASCADE |
| _dormant.disc_interaction_signals | disc_interaction_signals_contact_id_fkey | contact_id | CASCADE |
| _dormant.emotional_anchors | emotional_anchors_contact_id_fkey | contact_id | CASCADE |
| _dormant.emotional_states | emotional_states_contact_id_fkey | contact_id | CASCADE |
| _dormant.emotional_states_history | emotional_states_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.eq_analysis_history | eq_analysis_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.health_alerts | health_alerts_contact_id_fkey | contact_id | CASCADE |
| _dormant.hidden_objections | hidden_objections_contact_id_fkey | contact_id | CASCADE |
| _dormant.inactivity_alerts | inactivity_alerts_contact_id_fkey | contact_id | CASCADE |
| _dormant.influence_network | influence_network_contact_id_fkey | contact_id | CASCADE |
| _dormant.insights | insights_contact_id_fkey | contact_id | CASCADE |
| _dormant.life_events | life_events_contact_id_fkey | contact_id | CASCADE |
| _dormant.notifications | notifications_contact_id_fkey | contact_id | SET NULL |
| _dormant.offer_suggestions | offer_suggestions_contact_id_fkey | contact_id | CASCADE |
| _dormant.purchase_history | purchase_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.rfm_analysis | rfm_analysis_contact_id_fkey | contact_id | CASCADE |
| _dormant.rfm_history | rfm_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.score_history | score_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.script_usage_log | script_usage_log_contact_id_fkey | contact_id | NO ACTION |
| _dormant.social_behavior_analysis | social_behavior_analysis_contact_id_fkey | contact_id | CASCADE |
| _dormant.social_life_events | social_life_events_contact_id_fkey | contact_id | CASCADE |
| _dormant.social_mentions | social_mentions_mentioned_contact_id_fkey | mentioned_contact_id | SET NULL |
| _dormant.social_mentions | social_mentions_mentioner_contact_id_fkey | mentioner_contact_id | CASCADE |
| _dormant.social_profiles | social_profiles_contact_id_fkey | contact_id | CASCADE |
| _dormant.social_scraping_schedule | social_scraping_schedule_contact_id_fkey | contact_id | CASCADE |
| _dormant.stakeholder_alerts | stakeholder_alerts_contact_id_fkey | contact_id | CASCADE |
| _dormant.supplier_contacts | supplier_contacts_contact_id_fkey | contact_id | CASCADE |
| _dormant.tasks | tasks_contact_id_fkey | contact_id | SET NULL |
| _dormant.template_performance | template_performance_contact_id_fkey | contact_id | NO ACTION |
| _dormant.time_analysis | time_analysis_contact_id_fkey | contact_id | CASCADE |
| _dormant.trigger_ab_tests | trigger_ab_tests_contact_id_fkey | contact_id | CASCADE |
| _dormant.trigger_channel_effectiveness | trigger_channel_effectiveness_contact_id_fkey | contact_id | CASCADE |
| _dormant.trigger_intensity_history | trigger_intensity_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.trigger_suggestions | trigger_suggestions_contact_id_fkey | contact_id | CASCADE |
| _dormant.vak_analysis_history | vak_analysis_history_contact_id_fkey | contact_id | CASCADE |
| _dormant.whatsapp_messages | whatsapp_messages_contact_id_fkey | contact_id | SET NULL |
| public.activities | activities_contact_id_fkey | contact_id | SET NULL |
| public.ai_recommendation_audit_logs_v2 | ai_recommendation_audit_logs_v2_contact_id_fkey | contact_id | SET NULL |
| public.alerts | alerts_contact_id_fkey | contact_id | CASCADE |
| public.behavioral_profile_regen_queue | behavioral_profile_regen_queue_contact_id_fkey | contact_id | CASCADE |
| public.brain_dominance_analysis | brain_dominance_analysis_contact_id_fkey | contact_id | CASCADE |
| public.cadence_enrollments | cadence_enrollments_contact_id_fkey | contact_id | SET NULL |
| public.calendar_events | calendar_events_contact_id_fkey | contact_id | NO ACTION |
| public.call_logs | call_logs_contact_id_fkey | contact_id | SET NULL |
| public.campaign_members | campaign_members_contact_id_fkey | contact_id | NO ACTION |
| public.campaign_recipients | campaign_recipients_contact_id_fkey | contact_id | CASCADE |
| public.churn_predictions | churn_predictions_contact_id_fkey | contact_id | CASCADE |
| public.client_values | client_values_contact_id_fkey | contact_id | CASCADE |
| public.closing_moment_analysis | closing_moment_analysis_contact_id_fkey | contact_id | CASCADE |
| public.cognitive_bias_history | cognitive_bias_history_contact_id_fkey | contact_id | CASCADE |
| public.communication_preferences | communication_preferences_contact_id_fkey | contact_id | CASCADE |
| public.company_stakeholder_map | company_stakeholder_map_access_via_contact_id_fkey | access_via_contact_id | NO ACTION |
| public.company_stakeholder_map | company_stakeholder_map_contact_id_fkey | contact_id | CASCADE |
| public.compatibility_alerts | compatibility_alerts_contact_id_fkey | contact_id | CASCADE |
| public.contact_addresses | contact_addresses_contact_id_fkey | contact_id | CASCADE |
| public.contact_cadence | contact_cadence_contact_id_fkey | contact_id | CASCADE |
| public.contact_communication_style | contact_communication_style_contact_id_fkey | contact_id | CASCADE |
| public.contact_decision_making | contact_decision_making_contact_id_fkey | contact_id | CASCADE |
| public.contact_emails | contact_emails_contact_id_fkey | contact_id | CASCADE |
| public.contact_eq_scores | contact_eq_scores_contact_id_fkey | contact_id | CASCADE |
| public.contact_family_history | contact_family_history_contact_id_fkey | contact_id | CASCADE |
| public.contact_influence | contact_influence_contact_id_fkey | contact_id | CASCADE |
| public.contact_metaprograms | contact_metaprograms_contact_id_fkey | contact_id | CASCADE |
| public.contact_next_actions | contact_next_actions_contact_id_fkey | contact_id | CASCADE |
| public.contact_notes | contact_notes_contact_id_fkey | contact_id | CASCADE |
| public.contact_objection_scripts | contact_objection_scripts_contact_id_fkey | contact_id | CASCADE |
| public.contact_personality | contact_personality_contact_id_fkey | contact_id | CASCADE |
| public.contact_phones | contact_phones_contact_id_fkey | contact_id | CASCADE |
| public.contact_predictive_roadmap | contact_predictive_roadmap_contact_id_fkey | contact_id | CASCADE |
| public.contact_preferences | contact_preferences_contact_id_fkey | contact_id | CASCADE |
| public.contact_relatives | contact_relatives_contact_id_fkey | contact_id | CASCADE |
| public.contact_social_media | contact_social_media_contact_id_fkey | contact_id | CASCADE |
| public.contact_time_analysis | contact_time_analysis_contact_id_fkey | contact_id | CASCADE |
| public.contact_trigger_preferences | contact_trigger_preferences_contact_id_fkey | contact_id | CASCADE |
| public.contact_values | contact_values_contact_id_fkey | contact_id | CASCADE |
| public.contacts | contacts_duplicate_of_fkey | duplicate_of | NO ACTION |
| public.crm_alerts | crm_alerts_contact_id_fkey | contact_id | CASCADE |
| public.crm_automation_logs | crm_automation_logs_contact_id_fkey | contact_id | CASCADE |
| public.crm_consent_audit_logs | crm_consent_audit_logs_contact_id_fkey | contact_id | CASCADE |
| public.crm_metric_overrides | crm_metric_overrides_contact_id_fkey | contact_id | CASCADE |
| public.crm_objection_intelligence | crm_objection_intelligence_contact_id_fkey | contact_id | CASCADE |
| public.crm_relationship_audit_logs | crm_relationship_audit_logs_contact_id_fkey | contact_id | CASCADE |
| public.cs_accounts | cs_accounts_contact_id_fkey | contact_id | SET NULL |
| public.cs_nps_responses | cs_nps_responses_contact_id_fkey | contact_id | SET NULL |
| public.csat_surveys | csat_surveys_contact_id_fkey | contact_id | CASCADE |
| public.customer_surveys | customer_surveys_contact_id_fkey | contact_id | SET NULL |
| public.deal_velocity_analysis | deal_velocity_analysis_contact_id_fkey | contact_id | CASCADE |
| public.deals | deals_contact_id_fkey | contact_id | SET NULL |
| public.decision_criteria | decision_criteria_contact_id_fkey | contact_id | CASCADE |
| public.disc_analysis_history | disc_analysis_history_contact_id_fkey | contact_id | CASCADE |
| public.disc_assessments | disc_assessments_contact_id_fkey | contact_id | CASCADE |
| public.disc_communication_logs | disc_communication_logs_contact_id_fkey | contact_id | CASCADE |
| public.email_logs | email_logs_contact_id_fkey | contact_id | NO ACTION |
| public.emotional_anchors | emotional_anchors_contact_id_fkey | contact_id | CASCADE |
| public.emotional_states_history | emotional_states_history_contact_id_fkey | contact_id | CASCADE |
| public.emotional_trend_snapshots | emotional_trend_snapshots_contact_id_fkey | contact_id | CASCADE |
| public.eq_analysis_history | eq_analysis_history_contact_id_fkey | contact_id | CASCADE |
| public.health_alerts | health_alerts_contact_id_fkey | contact_id | CASCADE |
| public.hidden_objections | hidden_objections_contact_id_fkey | contact_id | CASCADE |
| public.inactivity_alerts | inactivity_alerts_contact_id_fkey | contact_id | NO ACTION |
| public.insights | insights_contact_id_fkey | contact_id | CASCADE |
| public.interactions | interactions_contact_id_fkey | contact_id | SET NULL |
| public.lead_score_history | lead_score_history_contact_id_fkey | contact_id | CASCADE |
| public.lead_scores | lead_scores_contact_id_fkey | contact_id | CASCADE |
| public.leads | leads_contact_id_fkey | contact_id | NO ACTION |
| public.life_events | life_events_contact_id_fkey | contact_id | CASCADE |
| public.meetings | meetings_contact_id_fkey | contact_id | SET NULL |
| public.metaprogram_analysis | metaprogram_analysis_contact_id_fkey | contact_id | CASCADE |
| public.neuro_behavioral_history | neuro_behavioral_history_contact_id_fkey | contact_id | CASCADE |
| public.neuro_pnl_sessions | neuro_pnl_sessions_contact_id_fkey | contact_id | CASCADE |
| public.nlp_feedback | nlp_feedback_contact_id_fkey | contact_id | NO ACTION |
| public.notification_logs | notification_logs_contact_id_fkey | contact_id | CASCADE |
| public.nps_surveys | nps_surveys_contact_id_fkey | contact_id | SET NULL |
| public.objections | objections_contact_id_fkey | contact_id | CASCADE |
| public.offer_suggestions | offer_suggestions_contact_id_fkey | contact_id | CASCADE |
| public.pre_contact_briefings | pre_contact_briefings_contact_id_fkey | contact_id | CASCADE |
| public.proposals | proposals_contact_id_fkey | contact_id | SET NULL |
| public.psychographic_audit_log | psychographic_audit_log_contact_id_fkey | contact_id | CASCADE |
| public.purchase_history | purchase_history_contact_id_fkey | contact_id | CASCADE |
| public.rapport_score_history | rapport_score_history_contact_id_fkey | contact_id | CASCADE |
| public.relationship_score_history | relationship_score_history_contact_id_fkey | contact_id | CASCADE |
| public.rfm_analysis | rfm_analysis_contact_id_fkey | contact_id | CASCADE |
| public.rfm_history | rfm_history_contact_id_fkey | contact_id | CASCADE |
| public.satisfaction_scores | satisfaction_scores_contact_id_fkey | contact_id | CASCADE |
| public.sequence_email_reservations | sequence_email_reservations_contact_id_fkey | contact_id | RESTRICT |
| public.shared_interests | shared_interests_contact_id_fkey | contact_id | CASCADE |
| public.smart_reminders | smart_reminders_contact_id_fkey | contact_id | CASCADE |
| public.sms_campaign_recipients | sms_campaign_recipients_contact_id_fkey | contact_id | CASCADE |
| public.sms_opt_outs | sms_opt_outs_contact_id_fkey | contact_id | SET NULL |
| public.social_behavior_analysis | social_behavior_analysis_contact_id_fkey | contact_id | CASCADE |
| public.social_consent_audit | social_consent_audit_contact_id_fkey | contact_id | CASCADE |
| public.social_insights | social_insights_contact_id_fkey | contact_id | CASCADE |
| public.social_life_events | social_life_events_contact_id_fkey | contact_id | CASCADE |
| public.social_profiles | social_profiles_contact_id_fkey | contact_id | CASCADE |
| public.social_scraping_schedule | social_scraping_schedule_contact_id_fkey | contact_id | CASCADE |
| public.social_sync_queue | social_sync_queue_contact_id_fkey | contact_id | CASCADE |
| public.stakeholder_alerts | stakeholder_alerts_contact_id_fkey | contact_id | CASCADE |
| public.suggested_life_events | suggested_life_events_contact_id_fkey | contact_id | CASCADE |
| public.suggested_rapport_intel | suggested_rapport_intel_contact_id_fkey | contact_id | CASCADE |
| public.support_tickets | support_tickets_contact_id_fkey | contact_id | SET NULL |
| public.tasks | tasks_contact_id_fkey | contact_id | SET NULL |
| public.trigger_ab_tests | trigger_ab_tests_contact_id_fkey | contact_id | CASCADE |
| public.trigger_channel_effectiveness | trigger_channel_effectiveness_contact_id_fkey | contact_id | CASCADE |
| public.trigger_intensity_history | trigger_intensity_history_contact_id_fkey | contact_id | CASCADE |
| public.trigger_usage_log | trigger_usage_log_contact_id_fkey | contact_id | CASCADE |
| public.user_contacts_link | user_contacts_link_contact_id_fkey | contact_id | CASCADE |
| public.vak_analysis_history | vak_analysis_history_contact_id_fkey | contact_id | CASCADE |
| public.vak_profiles | vak_profiles_contact_id_fkey | contact_id | CASCADE |
| public.whatsapp_messages | whatsapp_messages_contact_id_fkey | contact_id | SET NULL |
| zapp_history.ai_cost_log | ai_cost_log_contact_id_fkey | contact_id | SET NULL |
| zapp_history.ai_training_dataset | ai_training_dataset_contact_id_fkey | contact_id | SET NULL |
| zapp_history.conversation_daily_summaries | conversation_daily_summaries_contact_id_fkey | contact_id | CASCADE |
| zapp_history.conversations | conversations_contact_id_fkey | contact_id | CASCADE |
| zapp_history.message_audio | message_audio_contact_id_fkey | contact_id | CASCADE |
| zapp_history.message_embeddings | message_embeddings_contact_id_fkey | contact_id | CASCADE |
| zapp_history.message_links | message_links_contact_id_fkey | contact_id | CASCADE |
| zapp_history.message_media | message_media_contact_id_fkey | contact_id | CASCADE |
| zapp_history.messages | messages_contact_id_fkey | contact_id | CASCADE |
| zapp_history.phone_to_contact | phone_to_contact_contact_id_fkey | contact_id | CASCADE |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| contacts_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX contacts_pkey ON public.contacts USING btree (id)` |
| idx_contacts_active | btree | id | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_contacts_active ON public.contacts USING btree (id) WHERE (deleted_at IS NULL)` |
| idx_contacts_assigned_by_id | btree | assigned_by_id | não | sim |  | `CREATE INDEX idx_contacts_assigned_by_id ON public.contacts USING btree (assigned_by_id)` |
| idx_contacts_company | btree | company_id | não | sim |  | `CREATE INDEX idx_contacts_company ON public.contacts USING btree (company_id)` |
| idx_contacts_company_deleted | btree | company_id | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_contacts_company_deleted ON public.contacts USING btree (company_id) WHERE (deleted_at IS NULL)` |
| idx_contacts_company_id | btree | company_id | não | sim | `(company_id IS NOT NULL)` | `CREATE INDEX idx_contacts_company_id ON public.contacts USING btree (company_id) WHERE (company_id IS NOT NULL)` |
| idx_contacts_company_user | btree | company_id, user_id | não | sim |  | `CREATE INDEX idx_contacts_company_user ON public.contacts USING btree (company_id, user_id)` |
| idx_contacts_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_contacts_created_at ON public.contacts USING btree (created_at DESC)` |
| idx_contacts_duplicate_of | btree | duplicate_of | não | sim |  | `CREATE INDEX idx_contacts_duplicate_of ON public.contacts USING btree (duplicate_of)` |
| idx_contacts_email_trgm | gin | email | não | sim | `(email IS NOT NULL)` | `CREATE INDEX idx_contacts_email_trgm ON public.contacts USING gin (email gin_trgm_ops) WHERE (email IS NOT NULL)` |
| idx_contacts_first_name_trgm | gin | first_name | não | sim | `(first_name IS NOT NULL)` | `CREATE INDEX idx_contacts_first_name_trgm ON public.contacts USING gin (first_name gin_trgm_ops) WHERE (first_name IS NOT NULL)` |
| idx_contacts_is_duplicate | btree | is_duplicate | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_contacts_is_duplicate ON public.contacts USING btree (is_duplicate) WHERE (deleted_at IS NULL)` |
| idx_contacts_last_name_trgm | gin | last_name | não | sim | `(last_name IS NOT NULL)` | `CREATE INDEX idx_contacts_last_name_trgm ON public.contacts USING gin (last_name gin_trgm_ops) WHERE (last_name IS NOT NULL)` |
| idx_contacts_relationship_score | btree | relationship_score | não | sim |  | `CREATE INDEX idx_contacts_relationship_score ON public.contacts USING btree (relationship_score)` |
| idx_contacts_relationship_stage | btree | relationship_stage | não | sim |  | `CREATE INDEX idx_contacts_relationship_stage ON public.contacts USING btree (relationship_stage)` |
| idx_contacts_sem_apelido | btree | company_id, full_name | não | sim | `((apelido IS NULL) AND (deleted_at IS NULL))` | `CREATE INDEX idx_contacts_sem_apelido ON public.contacts USING btree (company_id, full_name) WHERE ((apelido IS NULL) AND (deleted_at IS NULL))` |
| idx_contacts_sentiment | btree | sentiment | não | sim |  | `CREATE INDEX idx_contacts_sentiment ON public.contacts USING btree (sentiment)` |
| idx_contacts_updated_at | btree | updated_at | não | sim |  | `CREATE INDEX idx_contacts_updated_at ON public.contacts USING btree (updated_at)` |
| idx_contacts_user_created | btree | user_id, created_at | não | sim |  | `CREATE INDEX idx_contacts_user_created ON public.contacts USING btree (user_id, created_at DESC)` |
| idx_contacts_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_contacts_user_id ON public.contacts USING btree (user_id)` |


## Policies (RLS)

### `Users can access their own contacts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `Users can delete their own contacts`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own contacts`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own contacts`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own contacts`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `service_role_full_contacts`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `singu_contacts_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_contacts_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `singu_contacts_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_contacts_update`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| a_singu_normalize_contacts | BEFORE | INSERT OR UPDATE | ROW | enabled | public.singu_contacts_normalize_checks |
| audit_contacts | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| contact_sequence_archive_guard | BEFORE | DELETE OR UPDATE | ROW | enabled | public.guard_contact_sequence_archive |
| contacts_increment_version | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_contacts | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| tr_contacts_auto_nomes | BEFORE | INSERT | ROW | enabled | public.auto_preencher_nomes_contato |
| tr_contacts_search_vector | BEFORE | INSERT OR UPDATE | ROW | enabled | public.update_contact_search_vector |
| tr_contacts_update_nomes | BEFORE | UPDATE | ROW | enabled | public.auto_atualizar_nomes_contato |
| tr_increment_contact_version | BEFORE | UPDATE | ROW | enabled | public.increment_contact_version |
| tr_sync_contact_fields_dynamic | BEFORE | INSERT OR UPDATE | ROW | enabled | public.sync_contact_fields_dynamic |
| trg_auto_relationship_stage | BEFORE | UPDATE | ROW | enabled | public.auto_update_relationship_stage |
| trg_contacts_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at |
| trg_detect_contact_intel | AFTER | UPDATE | ROW | enabled | public.detect_contact_intel_changes |
| trg_enqueue_contact_validation | AFTER | INSERT OR UPDATE | ROW | enabled | public.enqueue_contact_validation |
| trg_log_contact_tag_changes | AFTER | UPDATE | ROW | enabled | public.log_contact_tag_changes |
| trg_record_family_history | AFTER | INSERT OR UPDATE | ROW | enabled | public.record_family_history |
| trg_singu_reverse_sync_contact | AFTER | INSERT OR UPDATE | ROW | enabled | public.singu_reverse_sync_contact |
| trigger_log_contact_relationship_changes | AFTER | UPDATE | ROW | enabled | public.log_contact_relationship_changes |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
