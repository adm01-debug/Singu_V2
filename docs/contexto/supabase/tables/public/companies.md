# public.companies

> Cadastro de empresas (clientes, fornecedores, transportadoras)

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 9 |
| realtime (publication) | sim |
| replica identity | default |
| vem de extensão | não |
| usada por views | public.v_companies_metrics, public.v_company_summary, public.v_contact_summary, public.v_daily_kpis, public.v_dashboard_kpis, public.v_deal_summary, public.v_entities, public.v_recent_interactions, public.vw_active_alerts, public.vw_alertas_pendentes_vendedor, public.vw_alertas_vendedor, public.vw_apelidos_progresso, public.vw_best_closing_moments, public.vw_carrier_alerts, public.vw_carrier_by_state, public.vw_carrier_data_quality, public.vw_carrier_evaluations_history, public.vw_carrier_homologation_control, public.vw_carrier_homologation_queue, public.vw_carrier_qualification_dashboard, public.vw_carrier_ranking, public.vw_carriers, public.vw_carriers_completo, public.vw_carteira_sdr, public.vw_churn_risk_ranking, public.vw_cliente_completo, public.vw_clientes_prioridade, public.vw_closing_score_alerts, public.vw_closing_score_ranking, public.vw_communication_dashboard, public.vw_companies_completo, public.vw_companies_contato, public.vw_companies_cores, public.vw_companies_duplicatas, public.vw_companies_stats, public.vw_company_addresses, public.vw_company_social_media, public.vw_contact_social_media, public.vw_contacts_completo, public.vw_contacts_full, public.vw_contacts_sem_apelido, public.vw_cooperativas_estrutura, public.vw_customers, public.vw_customers_ativos, public.vw_customers_completo, public.vw_deal_velocity_benchmark, public.vw_deals_full, public.vw_emotional_trend_by_contact, public.vw_empresa_historico_completo, public.vw_empresa_timeline_completa, public.vw_empresas_hierarquia, public.vw_eq_dashboard, public.vw_eq_evolution, public.vw_grupos_economicos_resumo, public.vw_historico_alertas, public.vw_historico_carteira, public.vw_historico_carteira_empresa, public.vw_historico_prospects, public.vw_historico_sdr_empresa, public.vw_interacoes_sem_apelido, public.vw_interaction_timeline, public.vw_leads_full, public.vw_matriz_filiais, public.vw_pending_followups, public.vw_pending_notifications, public.vw_pix_accounts, public.vw_primeiro_ativador, public.vw_quem_ativou, public.vw_quem_inativou, public.vw_rapport_points, public.vw_risco_inativacao, public.vw_rodizio_bloqueios, public.vw_satisfaction_trend, public.vw_search_contacts, public.vw_singu_contact_360, public.vw_singu_data_health, public.vw_singu_lux_status, public.vw_singu_readiness, public.vw_social_media_stats, public.vw_status_clientes, public.vw_supplier_alerts, public.vw_supplier_by_state, public.vw_supplier_data_quality, public.vw_supplier_evaluations_history, public.vw_supplier_homologation_control, public.vw_supplier_homologation_queue, public.vw_supplier_qualification_dashboard, public.vw_supplier_ranking, public.vw_timeline_cliente, public.vw_timeline_empresa, public.vw_todays_reminders, public.vw_top_clientes_vendedor, public.vw_ultimo_inativador, reporting.mv_daily_kpis, reporting.mv_daily_stats, zapp_history.contact_message_stats, zapp_history.v_churn_alerts, zapp_history.v_competitor_alerts, zapp_history.v_contact_360, zapp_history.v_full_intelligence_stream, zapp_history.v_intelligence_360, zapp_history.v_pedidos_detectados, zapp_history.v_recent_summaries, zapp_history.v_routing_queue, zapp_history.v_top_contatos_potencial |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `bitrix_company_id` | `integer` | sim |  |  |  |
| 6 | `is_customer` | `boolean` | sim | `false` |  |  |
| 7 | `is_supplier` | `boolean` | sim | `false` |  |  |
| 8 | `is_carrier` | `boolean` | sim | `false` |  |  |
| 9 | `nome_crm` | `text` | não |  |  |  |
| 10 | `razao_social` | `text` | sim |  |  |  |
| 11 | `nome_fantasia` | `text` | sim |  |  |  |
| 12 | `cnpj` | `text` | sim |  |  |  |
| 13 | `inscricao_estadual` | `text` | sim |  |  |  |
| 14 | `inscricao_municipal` | `text` | sim |  |  |  |
| 18 | `website` | `text` | sim |  |  |  |
| 31 | `ramo_atividade` | `text` | sim |  |  |  |
| 32 | `grupo_economico` | `text` | sim |  |  |  |
| 34 | `status` | `company_status` | sim | `'ativo'::company_status` |  |  |
| 36 | `logo_url` | `text` | sim |  |  |  |
| 37 | `merge_notes` | `jsonb` | sim |  |  |  |
| 38 | `created_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 39 | `updated_at` | `timestamp with time zone` | sim | `now()` |  |  |
| 40 | `bitrix_created_at` | `timestamp with time zone` | sim |  |  |  |
| 41 | `bitrix_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 42 | `created_by_id` | `integer` | sim |  |  | Usuário que cadastrou a empresa no sistema |
| 43 | `grupo_economico_id` | `uuid` | sim |  |  |  |
| 44 | `is_matriz` | `boolean` | sim | `true` |  | TRUE se é matriz, FALSE se é filial |
| 45 | `matriz_id` | `uuid` | sim |  |  | Se for filial, aponta para a matriz |
| 46 | `tipo_cooperativa` | `text` | sim |  |  | Tipo na hierarquia cooperativa |
| 47 | `central_id` | `uuid` | sim |  |  | Se for Singular ou PAC, aponta para a Central |
| 48 | `singular_id` | `uuid` | sim |  |  | Se for PAC, aponta para a Singular |
| 51 | `financial_health` | `text` | sim | `'unknown'::text` |  |  |
| 52 | `employee_count` | `text` | sim |  |  |  |
| 53 | `annual_revenue` | `text` | sim |  |  |  |
| 54 | `competitors` | `text[]` | sim | `'{}'::text[]` |  |  |
| 55 | `challenges` | `text[]` | sim | `'{}'::text[]` |  |  |
| 56 | `tags_array` | `text[]` | sim | `'{}'::text[]` |  |  |
| 61 | `deleted_at` | `timestamp with time zone` | sim |  |  |  |
| 62 | `deleted_by` | `uuid` | sim |  |  |  |
| 63 | `search_vector` | `tsvector` | sim |  |  |  |
| 64 | `cnpj_base` | `character varying(8)` | sim |  |  |  |
| 65 | `cores_marca` | `cor_grupo[]` | sim |  |  | Grupos de cores da marca/logo da empresa. Ex: {verde,azul,amarelo} para Sicoob. Usado para cruzamento com cores disponíveis nos produtos. |
| 66 | `confederacao_id` | `uuid` | sim |  |  | FK para a confederação à qual esta central/singular está filiada. Nível hierárquico: CONFEDERAÇÃO → CENTRAL → SINGULAR → PAC. Adicionado em 2026-02-19 para formalizar hierarquia cooperativista. |
| 67 | `nicho_cliente` | `text` | sim |  |  |  |
| 68 | `data_fundacao` | `date` | sim |  |  |  |
| 69 | `capital_social` | `numeric(15,2)` | sim |  |  |  |
| 70 | `natureza_juridica` | `character varying(10)` | sim |  |  |  |
| 71 | `natureza_juridica_desc` | `character varying(200)` | sim |  |  |  |
| 72 | `porte_rf` | `character varying(30)` | sim |  |  |  |
| 73 | `situacao_rf` | `character varying(20)` | sim |  |  |  |
| 74 | `situacao_rf_data` | `date` | sim |  |  |  |
| 75 | `extra_data_rf` | `jsonb` | sim |  |  |  |
| 78 | `numero_cooperativa` | `character varying(10)` | sim |  |  | Número da cooperativa no portal Sicoob/Sicredi/etc (ex: 1001, 3008). Chave de cruzamento com portais oficiais. |
| 79 | `user_id` | `uuid` | sim |  |  |  |
| 80 | `lead_score` | `integer` | sim | `0` |  |  |
| 81 | `lead_score_updated_at` | `timestamp with time zone` | sim |  |  |  |
| 82 | `lead_status` | `text` | sim | `'novo'::text` |  |  |
| 84 | `industry` | `text` | sim |  |  |  |
| 90 | `notes` | `text` | sim |  |  |  |
| 91 | `tags` | `text[]` | sim | `'{}'::text[]` |  |  |
| 100 | `logo_color_url` | `text` | sim |  |  | URL da logo COLORIDA em alta resolução (Cloudflare Images). Consumida pelo Gerador de Mockup (default) e exportações. Distinta de logo_url (baixa res, só avatar). fix_version: 2026-06-28 logo-hi-res |
| 101 | `logo_mono_url` | `text` | sim |  |  | URL da logo MONOCROMATICA / 1 cor em alta resolução (Cloudflare Images). Consumida pelo Gerador de Mockup em tecnicas mono (laser, gravacao 1 cor). fix_version: 2026-06-28 logo-hi-res |
| 102 | `vak_dominant` | `text` | sim |  |  |  |
| 103 | `motivation_direction` | `text` | sim |  |  |  |
| 104 | `working_style` | `text` | sim |  |  |  |
| 105 | `reference_frame` | `text` | sim |  |  |  |
| 106 | `chunk_size` | `text` | sim |  |  |  |
| 107 | `action_filter` | `text` | sim |  |  |  |
| 108 | `comparison_style` | `text` | sim |  |  |  |
| 109 | `most_frequent_objection` | `text` | sim |  |  |  |
| 110 | `vak_profile` | `jsonb` | sim |  |  |  |
| 111 | `metaprogram_profile` | `jsonb` | sim |  |  |  |
| 112 | `emotional_state` | `text` | sim |  |  |  |
| 113 | `emotional_confidence` | `numeric(5,2)` | sim |  |  |  |
| 114 | `emotional_trigger` | `text` | sim |  |  |  |
| 115 | `cnpj_normalizado_em` | `timestamp with time zone` | sim |  |  | Última normalização via CNPJ Já. NULL = pendente de processamento. |
| 116 | `brand_colors` | `jsonb` | sim |  |  |  |
| 117 | `social_media_searched_at` | `timestamp with time zone` | sim |  |  | Timestamp de quando a busca de redes sociais foi executada (encontrado ou não encontrado). NULL = ainda não processado. |
| 118 | `verificado_em` | `timestamp with time zone` | sim |  |  | Data/hora em que os dados foram comparados e sincronizados com a planilha DADOS_COMPLETOS_PORTAL_SICOOB_2026.xlsx |
| 119 | `numero_cooperativa_singular` | `character varying` | sim |  |  |  |
| 120 | `version` | `integer` | não | `0` |  |  |
| 121 | `nome_crm_atualizado_em` | `timestamp with time zone` | sim |  |  |  |
| 122 | `empresa_atualizada_em` | `timestamp with time zone` | sim |  |  |  |
| 123 | `regime_tributario` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_companies_no_self_reference | CHECK | `CHECK (matriz_id IS NULL OR matriz_id <> id)` |  |  | sim |
| companies_bitrix_company_id_key | UNIQUE | `UNIQUE (bitrix_company_id)` |  |  | sim |
| companies_central_id_fkey | FOREIGN KEY | `FOREIGN KEY (central_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| companies_confederacao_id_fkey | FOREIGN KEY | `FOREIGN KEY (confederacao_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| companies_created_by_id_fkey | FOREIGN KEY | `FOREIGN KEY (created_by_id) REFERENCES users(id)` | NO ACTION | NO ACTION | sim |
| companies_financial_health_check | CHECK | `CHECK (financial_health = ANY (ARRAY['growing'::text, 'stable'::text, 'cutting'::text, 'unknown'::text]))` |  |  | sim |
| companies_grupo_economico_id_fkey | FOREIGN KEY | `FOREIGN KEY (grupo_economico_id) REFERENCES grupos_economicos(id)` | NO ACTION | NO ACTION | sim |
| companies_matriz_id_fkey | FOREIGN KEY | `FOREIGN KEY (matriz_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| companies_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| companies_singular_id_fkey | FOREIGN KEY | `FOREIGN KEY (singular_id) REFERENCES companies(id)` | NO ACTION | NO ACTION | sim |
| companies_tipo_cooperativa_check | CHECK | `CHECK (tipo_cooperativa = ANY (ARRAY['CENTRAL'::text, 'SINGULAR'::text, 'PAC'::text, 'CONFEDERACAO'::text, 'ENTIDADE_SISTEMA'::text]))` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| _dormant.alertas_inativacao | alertas_inativacao_company_id_fkey | company_id | CASCADE |
| _dormant.deals | deals_company_id_fkey | company_id | NO ACTION |
| _dormant.health_alerts | health_alerts_company_id_fkey | company_id | CASCADE |
| _dormant.inactivity_alerts | inactivity_alerts_company_id_fkey | company_id | CASCADE |
| _dormant.insights | insights_company_id_fkey | company_id | CASCADE |
| _dormant.leads | leads_company_id_fkey | company_id | NO ACTION |
| _dormant.notifications | notifications_company_id_fkey | company_id | SET NULL |
| _dormant.pix_accounts | pix_accounts_company_id_fkey | company_id | CASCADE |
| _dormant.purchase_history | purchase_history_company_id_fkey | company_id | CASCADE |
| _dormant.satisfaction_scores | satisfaction_scores_company_id_fkey | company_id | SET NULL |
| _dormant.smart_reminders | smart_reminders_company_id_fkey | company_id | SET NULL |
| _dormant.stakeholder_alerts | stakeholder_alerts_company_id_fkey | company_id | CASCADE |
| _dormant.tasks | tasks_company_id_fkey | company_id | SET NULL |
| _dormant.user_companies_link | user_companies_link_company_id_fkey | company_id | CASCADE |
| public.activities | activities_company_id_fkey | company_id | SET NULL |
| public.alerts | alerts_company_id_fkey | company_id | CASCADE |
| public.cadence_enrollments | cadence_enrollments_company_id_fkey | company_id | CASCADE |
| public.calendar_events | calendar_events_company_id_fkey | company_id | NO ACTION |
| public.call_logs | call_logs_company_id_fkey | company_id | SET NULL |
| public.campaign_members | campaign_members_company_id_fkey | company_id | NO ACTION |
| public.carriers | carriers_company_id_fkey | company_id | RESTRICT |
| public.churn_predictions | churn_predictions_company_id_fkey | company_id | SET NULL |
| public.companies | companies_central_id_fkey | central_id | NO ACTION |
| public.companies | companies_confederacao_id_fkey | confederacao_id | SET NULL |
| public.companies | companies_matriz_id_fkey | matriz_id | NO ACTION |
| public.companies | companies_singular_id_fkey | singular_id | NO ACTION |
| public.company_addresses | company_addresses_company_id_fkey | company_id | CASCADE |
| public.company_cadences | company_cadences_company_id_fkey | company_id | NO ACTION |
| public.company_cnaes | company_cnaes_company_id_fkey | company_id | CASCADE |
| public.company_emails | company_emails_company_id_fkey | company_id | CASCADE |
| public.company_phones | company_phones_company_id_fkey | company_id | CASCADE |
| public.company_rfm_scores | company_rfm_scores_company_id_fkey | company_id | CASCADE |
| public.company_social_media | company_social_media_company_id_fkey | company_id | CASCADE |
| public.company_stakeholder_map | company_stakeholder_map_company_id_fkey | company_id | CASCADE |
| public.company_territories | company_territories_company_id_fkey | company_id | CASCADE |
| public.competitive_losses | competitive_losses_company_id_fkey | company_id | CASCADE |
| public.contacts | contacts_company_id_fkey | company_id | SET NULL |
| public.cs_accounts | cs_accounts_company_id_fkey | company_id | SET NULL |
| public.customer_events | customer_events_company_id_fkey | company_id | NO ACTION |
| public.customer_health_scores | customer_health_scores_company_id_fkey | company_id | CASCADE |
| public.customer_ownership_history | customer_ownership_history_company_id_fkey | company_id | NO ACTION |
| public.customer_purchases | customer_purchases_company_id_fkey | company_id | NO ACTION |
| public.customer_sdr_history | customer_sdr_history_company_id_fkey | company_id | NO ACTION |
| public.customer_surveys | customer_surveys_company_id_fkey | company_id | CASCADE |
| public.customers | customers_company_id_fkey | company_id | RESTRICT |
| public.deal_velocity_analysis | deal_velocity_analysis_company_id_fkey | company_id | SET NULL |
| public.deals | deals_company_id_fkey | company_id | CASCADE |
| public.economic_group_members | economic_group_members_company_id_fkey | company_id | CASCADE |
| public.economic_groups | economic_groups_main_company_id_fkey | main_company_id | NO ACTION |
| public.email_logs | email_logs_company_id_fkey | company_id | NO ACTION |
| public.inactivity_alerts | inactivity_alerts_company_id_fkey | company_id | NO ACTION |
| public.interactions | interactions_company_id_fkey | company_id | SET NULL |
| public.lead_score_history | lead_score_history_company_id_fkey | company_id | CASCADE |
| public.meetings | meetings_company_id_fkey | company_id | CASCADE |
| public.neuro_pnl_sessions | neuro_pnl_sessions_company_id_fkey | company_id | CASCADE |
| public.nps_surveys | nps_surveys_company_id_fkey | company_id | CASCADE |
| public.proposals | proposals_company_id_fkey | company_id | CASCADE |
| public.quick_notes | quick_notes_company_id_fkey | company_id | NO ACTION |
| public.reminders | reminders_company_id_fkey | company_id | NO ACTION |
| public.sales_opportunities | sales_opportunities_company_id_fkey | company_id | CASCADE |
| public.scheduled_visits | scheduled_visits_company_id_fkey | company_id | NO ACTION |
| public.stakeholder_alerts | stakeholder_alerts_company_id_fkey | company_id | CASCADE |
| public.suppliers | suppliers_company_id_fkey | company_id | RESTRICT |
| public.support_tickets | support_tickets_company_id_fkey | company_id | SET NULL |
| public.tasks | tasks_company_id_fkey | company_id | CASCADE |
| public.visit_checkins | visit_checkins_company_id_fkey | company_id | SET NULL |
| public.whatsapp_messages | whatsapp_messages_company_id_fkey | company_id | CASCADE |
| zapp_history.conversation_daily_summaries | conversation_daily_summaries_company_id_fkey | company_id | SET NULL |
| zapp_history.conversations | conversations_company_id_fkey | company_id | SET NULL |
| zapp_history.messages | messages_company_id_fkey | company_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| companies_bitrix_company_id_key | btree | bitrix_company_id | sim | sim |  | `CREATE UNIQUE INDEX companies_bitrix_company_id_key ON public.companies USING btree (bitrix_company_id)` |
| companies_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX companies_pkey ON public.companies USING btree (id)` |
| idx_companies_active | btree | id | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_companies_active ON public.companies USING btree (id) WHERE (deleted_at IS NULL)` |
| idx_companies_ativo | btree | id | não | sim | `(status = 'ativo'::company_status)` | `CREATE INDEX idx_companies_ativo ON public.companies USING btree (id) WHERE (status = 'ativo'::company_status)` |
| idx_companies_carrier | btree | is_carrier | não | sim | `(is_carrier = true)` | `CREATE INDEX idx_companies_carrier ON public.companies USING btree (is_carrier) WHERE (is_carrier = true)` |
| idx_companies_central | btree | central_id | não | sim |  | `CREATE INDEX idx_companies_central ON public.companies USING btree (central_id)` |
| idx_companies_cnpj | btree | cnpj | não | sim | `((cnpj IS NOT NULL) AND (cnpj <> ''::text))` | `CREATE INDEX idx_companies_cnpj ON public.companies USING btree (cnpj) WHERE ((cnpj IS NOT NULL) AND (cnpj <> ''::text))` |
| idx_companies_cnpj_base | btree | cnpj_base | não | sim | `(cnpj_base IS NOT NULL)` | `CREATE INDEX idx_companies_cnpj_base ON public.companies USING btree (cnpj_base) WHERE (cnpj_base IS NOT NULL)` |
| idx_companies_confederacao_id | btree | confederacao_id | não | sim | `(confederacao_id IS NOT NULL)` | `CREATE INDEX idx_companies_confederacao_id ON public.companies USING btree (confederacao_id) WHERE (confederacao_id IS NOT NULL)` |
| idx_companies_created_at | btree | created_at | não | sim |  | `CREATE INDEX idx_companies_created_at ON public.companies USING btree (created_at)` |
| idx_companies_created_by_id | btree | created_by_id | não | sim |  | `CREATE INDEX idx_companies_created_by_id ON public.companies USING btree (created_by_id)` |
| idx_companies_grupo_economico | btree | grupo_economico_id | não | sim | `(grupo_economico_id IS NOT NULL)` | `CREATE INDEX idx_companies_grupo_economico ON public.companies USING btree (grupo_economico_id) WHERE (grupo_economico_id IS NOT NULL)` |
| idx_companies_is_customer | btree | is_customer | não | sim | `((is_customer = true) AND (deleted_at IS NULL))` | `CREATE INDEX idx_companies_is_customer ON public.companies USING btree (is_customer) WHERE ((is_customer = true) AND (deleted_at IS NULL))` |
| idx_companies_lead_status | btree | lead_status | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_companies_lead_status ON public.companies USING btree (lead_status) WHERE (deleted_at IS NULL)` |
| idx_companies_matriz | btree | matriz_id | não | sim |  | `CREATE INDEX idx_companies_matriz ON public.companies USING btree (matriz_id)` |
| idx_companies_nome_crm_trgm | gin | nome_crm | não | sim |  | `CREATE INDEX idx_companies_nome_crm_trgm ON public.companies USING gin (nome_crm gin_trgm_ops)` |
| idx_companies_razao_social_trgm | gin | razao_social | não | sim |  | `CREATE INDEX idx_companies_razao_social_trgm ON public.companies USING gin (razao_social gin_trgm_ops)` |
| idx_companies_search | gin | search_vector | não | sim |  | `CREATE INDEX idx_companies_search ON public.companies USING gin (search_vector)` |
| idx_companies_singular | btree | singular_id | não | sim |  | `CREATE INDEX idx_companies_singular ON public.companies USING btree (singular_id)` |
| idx_companies_status | btree | status | não | sim |  | `CREATE INDEX idx_companies_status ON public.companies USING btree (status)` |
| idx_companies_status_deleted | btree | status | não | sim | `(deleted_at IS NULL)` | `CREATE INDEX idx_companies_status_deleted ON public.companies USING btree (status) WHERE (deleted_at IS NULL)` |
| idx_companies_supplier | btree | is_supplier | não | sim | `(is_supplier = true)` | `CREATE INDEX idx_companies_supplier ON public.companies USING btree (is_supplier) WHERE (is_supplier = true)` |
| idx_companies_tipo_coop | btree | tipo_cooperativa | não | sim |  | `CREATE INDEX idx_companies_tipo_coop ON public.companies USING btree (tipo_cooperativa)` |
| idx_companies_title | btree | nome_crm | não | sim |  | `CREATE INDEX idx_companies_title ON public.companies USING btree (nome_crm)` |
| idx_companies_updated_at | btree | updated_at | não | sim |  | `CREATE INDEX idx_companies_updated_at ON public.companies USING btree (updated_at)` |
| idx_companies_user_id | btree | user_id | não | sim |  | `CREATE INDEX idx_companies_user_id ON public.companies USING btree (user_id)` |


## Policies (RLS)

### `Users can delete their own companies`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can insert their own companies`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(auth.uid() = user_id)` |

### `Users can update their own companies`

| campo | valor |
|---|---|
| comando | UPDATE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `Users can view their own companies`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(auth.uid() = user_id)` |
| WITH CHECK |  |

### `service_role_full_companies`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | service_role |
| USING | `true` |
| WITH CHECK | `true` |

### `singu_companies_delete`

| campo | valor |
|---|---|
| comando | DELETE |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_companies_insert`

| campo | valor |
|---|---|
| comando | INSERT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING |  |
| WITH CHECK | `(( SELECT auth.uid() AS uid) = user_id)` |

### `singu_companies_select`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `(( SELECT auth.uid() AS uid) = user_id)` |
| WITH CHECK |  |

### `singu_companies_update`

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
| a_singu_normalize_companies | BEFORE | INSERT OR UPDATE | ROW | enabled | public.singu_companies_compat_sync |
| audit_companies | AFTER | INSERT OR DELETE OR UPDATE | ROW | enabled | public.audit_trigger_fn |
| companies_increment_version | BEFORE | UPDATE | ROW | enabled | public.increment_version_column |
| companies_search_vector_trigger | BEFORE | INSERT OR UPDATE | ROW | enabled | public.companies_search_vector_update |
| set_updated_at | BEFORE | UPDATE | ROW | enabled | public.set_updated_at |
| set_updated_at_companies | BEFORE | UPDATE | ROW | enabled | public.update_updated_at_column |
| trg_auto_lead_score | BEFORE | INSERT OR UPDATE | ROW | enabled | public.auto_calculate_lead_score |
| trg_companies_updated_at | BEFORE | UPDATE | ROW | enabled | public.update_updated_at |
| trg_company_insert_sync_carrier | AFTER | INSERT | ROW | enabled | public.trg_fn_sync_company_carrier |
| trg_company_insert_sync_supplier | AFTER | INSERT | ROW | enabled | public.trg_fn_sync_company_supplier |
| trg_company_sync_carrier | AFTER | UPDATE | ROW | enabled | public.trg_fn_sync_company_carrier |
| trg_company_sync_supplier | AFTER | UPDATE | ROW | enabled | public.trg_fn_sync_company_supplier |
| trg_create_deal_on_qualification | AFTER | UPDATE | ROW | enabled | public.trigger_create_deal_on_qualification |


## Grants

| role | privilégios |
|---|---|
| authenticated | DELETE, INSERT, SELECT, UPDATE |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
