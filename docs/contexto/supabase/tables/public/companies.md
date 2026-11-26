# public.companies

> Cadastro mestre de organizações do CRM. Uma linha representa uma empresa, que pode atuar como cliente, fornecedor e/ou transportadora conforme os indicadores de papel. Centraliza identificação cadastral, vínculo com Bitrix24, hierarquia empresarial/cooperativista, dados de contato e atributos de qualificação comercial. PK: id. Relacionamentos confirmados: company_addresses.company_id, company_phones.company_id, company_emails.company_id, contacts.company_id, customers.company_id, suppliers.company_id, carriers.company_id e diversas tabelas operacionais apontam para companies.id. Valores monetários e métricas textuais devem ser interpretados conforme a unidade de origem; não inferir moeda ou escala quando não explicitadas.

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
| usada por views | public.v_companies_metrics, public.v_company_summary, public.v_contact_summary, public.v_daily_kpis, public.v_dashboard_kpis, public.v_deal_summary, public.v_entities, public.v_recent_interactions, public.vw_active_alerts, public.vw_alertas_pendentes_vendedor, public.vw_alertas_vendedor, public.vw_apelidos_progresso, public.vw_best_closing_moments, public.vw_carrier_alerts, public.vw_carrier_by_state, public.vw_carrier_data_quality, public.vw_carrier_evaluations_history, public.vw_carrier_homologation_control, public.vw_carrier_homologation_queue, public.vw_carrier_qualification_dashboard, public.vw_carrier_ranking, public.vw_carriers, public.vw_carriers_completo, public.vw_carteira_sdr, public.vw_churn_risk_ranking, public.vw_cliente_completo, public.vw_clientes_prioridade, public.vw_closing_score_alerts, public.vw_closing_score_ranking, public.vw_communication_dashboard, public.vw_companies_completo, public.vw_companies_contato, public.vw_companies_cores, public.vw_companies_duplicatas, public.vw_companies_stats, public.vw_company_addresses, public.vw_company_social_media, public.vw_contact_social_media, public.vw_contacts_completo, public.vw_contacts_full, public.vw_contacts_sem_apelido, public.vw_cooperativas_estrutura, public.vw_customers, public.vw_customers_ativos, public.vw_customers_completo, public.vw_deal_velocity_benchmark, public.vw_deals_full, public.vw_emotional_trend_by_contact, public.vw_empresa_historico_completo, public.vw_empresa_timeline_completa, public.vw_empresas_hierarquia, public.vw_eq_dashboard, public.vw_eq_evolution, public.vw_grupos_economicos_resumo, public.vw_historico_alertas, public.vw_historico_carteira, public.vw_historico_carteira_empresa, public.vw_historico_prospects, public.vw_historico_sdr_empresa, public.vw_interacoes_sem_apelido, public.vw_interaction_timeline, public.vw_leads_full, public.vw_matriz_filiais, public.vw_pending_followups, public.vw_pending_notifications, public.vw_pix_accounts, public.vw_primeiro_ativador, public.vw_quem_ativou, public.vw_quem_inativou, public.vw_rapport_points, public.vw_risco_inativacao, public.vw_rodizio_bloqueios, public.vw_satisfaction_trend, public.vw_search_contacts, public.vw_singu_contact_360, public.vw_singu_data_health, public.vw_singu_lux_status, public.vw_singu_readiness, public.vw_social_media_stats, public.vw_status_clientes, public.vw_supplier_alerts, public.vw_supplier_by_state, public.vw_supplier_data_quality, public.vw_supplier_evaluations_history, public.vw_supplier_homologation_control, public.vw_supplier_homologation_queue, public.vw_supplier_qualification_dashboard, public.vw_supplier_ranking, public.vw_timeline_cliente, public.vw_timeline_empresa, public.vw_todays_reminders, public.vw_top_clientes_vendedor, public.vw_ultimo_inativador, reporting.mv_daily_kpis, reporting.mv_daily_stats, zapp_history.contact_message_stats, zapp_history.v_churn_alerts, zapp_history.v_competitor_alerts, zapp_history.v_contact_360, zapp_history.v_full_intelligence_stream, zapp_history.v_intelligence_360, zapp_history.v_pedidos_detectados, zapp_history.v_recent_summaries, zapp_history.v_routing_queue, zapp_history.v_top_contatos_potencial |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  | Identificador interno único da empresa; UUID gerado automaticamente por gen_random_uuid(). Chave primária referenciada por tabelas relacionadas do CRM. |
| 2 | `bitrix_company_id` | `integer` | sim |  |  | Identificador numérico da empresa no Bitrix24; pode ser nulo e, quando informado, é único. Usado para integração e reconciliação com o CRM externo. |
| 6 | `is_customer` | `boolean` | sim | `false` |  | Indicador booleano de que a empresa exerce papel de cliente. TRUE indica cliente; FALSE indica que esse papel não está marcado. Não confundir com status comercial. |
| 7 | `is_supplier` | `boolean` | sim | `false` |  | Indicador booleano de que a empresa exerce papel de fornecedor. TRUE indica fornecedor; FALSE indica que esse papel não está marcado. |
| 8 | `is_carrier` | `boolean` | sim | `false` |  | Indicador booleano de que a empresa exerce papel de transportadora. TRUE indica transportadora; FALSE indica que esse papel não está marcado. |
| 9 | `nome_crm` | `text` | não |  |  | Nome de exibição/identificação da empresa no CRM; campo obrigatório. Não equivale necessariamente à razão social ou ao nome fantasia. |
| 10 | `razao_social` | `text` | sim |  |  | Razão social legal da empresa, quando conhecida; texto opcional. |
| 11 | `nome_fantasia` | `text` | sim |  |  | Nome fantasia comercial da empresa, quando conhecido; texto opcional. |
| 12 | `cnpj` | `text` | sim |  |  | CNPJ da empresa em texto; preserva zeros à esquerda e pode conter máscara. A coluna não informa por si só se o valor está normalizado ou validado. |
| 13 | `inscricao_estadual` | `text` | sim |  |  | Inscrição estadual informada para a empresa; texto opcional, sem regra de formato documentada no schema. |
| 14 | `inscricao_municipal` | `text` | sim |  |  | Inscrição municipal informada para a empresa; texto opcional, sem regra de formato documentada no schema. |
| 18 | `website` | `text` | sim |  |  | Endereço do site institucional da empresa, armazenado como texto/URL; campo opcional. |
| 31 | `ramo_atividade` | `text` | sim |  |  | Ramo de atividade da empresa em texto livre; não há domínio fechado documentado. |
| 32 | `grupo_economico` | `text` | sim |  |  | Nome textual de grupo econômico associado à empresa. Há também grupo_economico_id para vínculo relacional; não presumir equivalência ou sincronização entre os dois sem validar a aplicação. |
| 34 | `status` | `company_status` | sim | `'ativo'::company_status` |  | Situação cadastral no CRM. Domínio do tipo company_status: ativo, inativo ou suspenso. DEFAULT ativo. Não representa o papel de cliente/fornecedor/transportadora. |
| 36 | `logo_url` | `text` | sim |  |  | URL da imagem de logo usada como representação/avatar; comentário existente indica resolução menor. Não confundir com logo_color_url e logo_mono_url, destinados a arquivos de maior resolução. |
| 37 | `merge_notes` | `jsonb` | sim |  |  | Dados JSONB relacionados a merge/consolidação de registros. Estrutura interna não formalizada no schema; consultar payload antes de filtrar por chaves específicas. |
| 38 | `created_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora de criação do registro no banco, com fuso horário (timestamptz); DEFAULT now(). Não é necessariamente a data de criação no Bitrix24. |
| 39 | `updated_at` | `timestamp with time zone` | sim | `now()` |  | Data e hora da última atualização registrada no banco, com fuso horário. DEFAULT now(); a atualização automática depende de trigger ou da aplicação. |
| 40 | `bitrix_created_at` | `timestamp with time zone` | sim |  |  | Data e hora de criação do registro no Bitrix24, quando disponível; timestamptz opcional. |
| 41 | `bitrix_updated_at` | `timestamp with time zone` | sim |  |  | Data e hora da última atualização do registro no Bitrix24, quando disponível; timestamptz opcional. |
| 42 | `created_by_id` | `integer` | sim |  |  | Identificador integer do usuário/colaborador que cadastrou a empresa; FK para public.users.id. |
| 43 | `grupo_economico_id` | `uuid` | sim |  |  | Identificador UUID do grupo econômico associado; FK para public.grupos_economicos.id. |
| 44 | `is_matriz` | `boolean` | sim | `true` |  | Indica se a empresa é matriz. TRUE = matriz; FALSE = filial. DEFAULT TRUE. A matriz da filial é indicada em matriz_id. |
| 45 | `matriz_id` | `uuid` | sim |  |  | UUID da empresa matriz à qual esta empresa filial pertence; autorrelacionamento FK para public.companies.id. Nulo quando não há matriz informada. |
| 46 | `tipo_cooperativa` | `text` | sim |  |  | Categoria da entidade na hierarquia cooperativista. Valores permitidos: CENTRAL, SINGULAR, PAC, CONFEDERACAO, ENTIDADE_SISTEMA. Nulo quando não classificada. |
| 47 | `central_id` | `uuid` | sim |  |  | UUID da Central relacionada na hierarquia cooperativista; autorrelacionamento FK para public.companies.id. Comentário existente especifica uso para Singular ou PAC. |
| 48 | `singular_id` | `uuid` | sim |  |  | UUID da Singular relacionada na hierarquia cooperativista; autorrelacionamento FK para public.companies.id. Comentário existente especifica uso para PAC. |
| 51 | `financial_health` | `text` | sim | `'unknown'::text` |  | Classificação textual da saúde financeira: growing, stable, cutting ou unknown. DEFAULT unknown. Não é um valor monetário. |
| 52 | `employee_count` | `text` | sim |  |  | Informação de quantidade/porte de colaboradores armazenada como texto. O schema não define se contém número exato ou faixa; não converter para inteiro sem validar o conteúdo. |
| 53 | `annual_revenue` | `text` | sim |  |  | Informação textual de receita anual. O schema não define moeda, escala nem se o conteúdo é valor exato ou faixa; não tratar como numeric sem validar a origem. |
| 54 | `competitors` | `text[]` | sim | `'{}'::text[]` |  | Array PostgreSQL de textos com concorrentes associados à empresa; DEFAULT array vazio. Não há catálogo ou normalização documentados. |
| 55 | `challenges` | `text[]` | sim | `'{}'::text[]` |  | Array PostgreSQL de textos com desafios atribuídos à empresa; DEFAULT array vazio. Não há taxonomia fechada documentada. |
| 56 | `tags_array` | `text[]` | sim | `'{}'::text[]` |  | Array PostgreSQL de rótulos textuais da empresa; DEFAULT array vazio. Diferente de tabelas relacionais de tags. |
| 61 | `deleted_at` | `timestamp with time zone` | sim |  |  | Data e hora de exclusão lógica da empresa; NULL normalmente indica que não há marca de exclusão registrada. Timestamptz. |
| 62 | `deleted_by` | `uuid` | sim |  |  | UUID do usuário que registrou a exclusão lógica; FK para auth.users.id. |
| 63 | `search_vector` | `tsvector` | sim |  |  | Vetor tsvector para busca textual; campo técnico derivado/indexável, não é texto de exibição. |
| 64 | `cnpj_base` | `character varying(8)` | sim |  |  | Representação textual da base do CNPJ, usada para agrupamento/normalização; não contém regra de tamanho explicitada no schema. |
| 65 | `cores_marca` | `cor_grupo[]` | sim |  |  | Array do tipo cor_grupo com cores associadas à marca. Valores permitidos: branco, preto, cinza, prata, dourado, vermelho, laranja, amarelo, verde, azul, azul_marinho, roxo, rosa, marrom, bege, transparente e multicolor. |
| 66 | `confederacao_id` | `uuid` | sim |  |  | UUID da Confederação na hierarquia cooperativista; autorrelacionamento FK para public.companies.id. Comentário existente descreve a cadeia Confederação → Central → Singular → PAC. |
| 67 | `nicho_cliente` | `text` | sim |  |  | Nicho do cliente armazenado como texto livre; não há domínio fechado definido. |
| 68 | `data_fundacao` | `date` | sim |  |  | Data de fundação da empresa, sem horário; tipo date. |
| 69 | `capital_social` | `numeric(15,2)` | sim |  |  | Valor numérico do capital social. Unidade monetária e moeda não estão definidas na coluna; não presumir reais ou centavos sem confirmação da origem. |
| 70 | `natureza_juridica` | `character varying(10)` | sim |  |  | Código ou classificação textual da natureza jurídica; formato/catálogo não definido pela coluna. |
| 71 | `natureza_juridica_desc` | `character varying(200)` | sim |  |  | Descrição textual da natureza jurídica, complementar a natureza_juridica. |
| 72 | `porte_rf` | `character varying(30)` | sim |  |  | Porte da empresa conforme informação atribuída à Receita Federal; texto opcional. Valores concretos não estão enumerados no schema. |
| 73 | `situacao_rf` | `character varying(20)` | sim |  |  | Situação cadastral atribuída à Receita Federal; texto opcional. Não confundir com companies.status, que é a situação no CRM. |
| 74 | `situacao_rf_data` | `date` | sim |  |  | Data associada à situação cadastral na Receita Federal; tipo date. |
| 75 | `extra_data_rf` | `jsonb` | sim |  |  | Dados adicionais da Receita Federal em JSONB; estrutura variável, sem contrato de chaves definido no schema. |
| 78 | `numero_cooperativa` | `character varying(10)` | sim |  |  | Número de cooperativa informado por portais de sistemas cooperativistas; texto para preservar formatação/zeros. Comentário existente cita exemplos e uso em cruzamentos. |
| 79 | `user_id` | `uuid` | sim |  |  | UUID de usuário associado à empresa; não há FK declarada para esta coluna no schema consultado. Não presumir que seja equivalente a created_by_id. |
| 80 | `lead_score` | `integer` | sim | `0` |  | Pontuação inteira de lead, DEFAULT 0. O schema não define escala, algoritmo ou faixa permitida; interpretar como score e não como valor financeiro. |
| 81 | `lead_score_updated_at` | `timestamp with time zone` | sim |  |  | Data e hora da última atualização do lead_score, com fuso horário. |
| 82 | `lead_status` | `text` | sim | `'novo'::text` |  | Status textual do lead, DEFAULT novo. Não há CHECK constraint com a lista de estados válidos; não presumir transições ou valores além dos dados efetivamente usados. |
| 84 | `industry` | `text` | sim |  |  | Setor/indústria em texto livre; distinto de ramo_atividade e sem catálogo fechado documentado. |
| 90 | `notes` | `text` | sim |  |  | Observações gerais em texto livre sobre a empresa. |
| 91 | `tags` | `text[]` | sim | `'{}'::text[]` |  | Array PostgreSQL de tags textuais; DEFAULT array vazio. Não confundir com tags_array, que é outra coluna com finalidade possivelmente distinta não detalhada pelo schema. |
| 100 | `logo_color_url` | `text` | sim |  |  | URL da logo colorida em alta resolução; comentário existente indica uso em mockups e exportações. |
| 101 | `logo_mono_url` | `text` | sim |  |  | URL da logo monocromática/em uma cor em alta resolução; comentário existente indica uso em técnicas monocromáticas. |
| 102 | `vak_dominant` | `text` | sim |  |  | Rótulo textual de modalidade VAK dominante; valores possíveis e convenção de codificação não estão definidos no schema. |
| 103 | `motivation_direction` | `text` | sim |  |  | Rótulo textual sobre direção motivacional; valores e escala não estão definidos no schema. |
| 104 | `working_style` | `text` | sim |  |  | Descrição/categoria textual de estilo de trabalho; domínio não definido no schema. |
| 105 | `reference_frame` | `text` | sim |  |  | Rótulo textual de quadro de referência; valores permitidos não estão definidos no schema. |
| 106 | `chunk_size` | `text` | sim |  |  | Rótulo textual de preferência de granularidade de informação; valores permitidos não estão definidos no schema. |
| 107 | `action_filter` | `text` | sim |  |  | Rótulo textual de filtro de ação; sem domínio ou interpretação formal definidos no schema. |
| 108 | `comparison_style` | `text` | sim |  |  | Rótulo textual de estilo de comparação; valores permitidos não estão definidos no schema. |
| 109 | `most_frequent_objection` | `text` | sim |  |  | Texto que registra a objeção mais frequente associada à empresa; não há taxonomia fechada. |
| 110 | `vak_profile` | `jsonb` | sim |  |  | Perfil VAK da empresa em JSONB; estrutura de chaves não especificada pelo schema. |
| 111 | `metaprogram_profile` | `jsonb` | sim |  |  | Perfil de metaprogramas em JSONB; estrutura e escalas não especificadas pelo schema. |
| 112 | `emotional_state` | `text` | sim |  |  | Estado emocional textual atribuído à empresa/contato comercial; catálogo não definido pelo schema. |
| 113 | `emotional_confidence` | `numeric(5,2)` | sim |  |  | Confiança numérica associada à análise emocional. Faixa, unidade e interpretação não estão definidas; não assumir 0–1 ou 0–100. |
| 114 | `emotional_trigger` | `text` | sim |  |  | Texto de gatilho emocional associado à análise; sem domínio fechado. |
| 115 | `cnpj_normalizado_em` | `timestamp with time zone` | sim |  |  | Data e hora da última normalização do CNPJ; comentário existente informa NULL como pendente de processamento. |
| 116 | `brand_colors` | `jsonb` | sim |  |  | Cores da marca em JSONB; distinta de cores_marca, que usa array tipado cor_grupo. Estrutura JSON não está formalizada no schema. |
| 117 | `social_media_searched_at` | `timestamp with time zone` | sim |  |  | Data e hora em que foi executada a busca de redes sociais; comentário existente informa NULL como ainda não processado. |
| 118 | `verificado_em` | `timestamp with time zone` | sim |  |  | Data e hora da verificação/sincronização com a planilha indicada no comentário existente. |
| 119 | `numero_cooperativa_singular` | `character varying` | sim |  |  | Número de cooperativa singular em texto; formato e regra de preenchimento não estão definidos no schema. |
| 120 | `version` | `integer` | não | `0` |  | Contador inteiro de versão do registro, DEFAULT 0. O mecanismo de incremento não está definido pela coluna. |
| 121 | `nome_crm_atualizado_em` | `timestamp with time zone` | sim |  |  | Data e hora da última atualização de nome_crm, conforme convenção da aplicação. |
| 122 | `empresa_atualizada_em` | `timestamp with time zone` | sim |  |  | Data e hora da última atualização dos dados da empresa, conforme convenção da aplicação. |
| 123 | `regime_tributario` | `text` | sim |  |  | Regime tributário informado como texto; valores possíveis não estão enumerados no schema. |


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

### `companies_owner_or_admin`

| campo | valor |
|---|---|
| comando | ALL |
| tipo | PERMISSIVE |
| roles | authenticated |
| USING | `((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` |
| WITH CHECK | `((( SELECT auth.uid() AS uid) = user_id) OR ( SELECT has_role(( SELECT auth.uid() AS uid), 'admin'::app_role) AS has_role))` |

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
