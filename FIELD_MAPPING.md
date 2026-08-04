# Mapeamento Campo-a-Campo: Banco Local ↔ Banco Externo

> Última atualização: 2026-04-15  
> Referência técnica para manutenção do proxy `external-data` e hooks de dados.

---

## Tabela: companies

O mapeamento é feito em `src/hooks/useCompanies.ts` → `mapCompany()`.

| Campo Local (Supabase) | Campo Externo | Tipo | Transformação | Notas |
|---|---|---|---|---|
| `id` | `id` | UUID | — | PK |
| `name` | `nome_crm` / `nome_fantasia` / `razao_social` | TEXT | Fallback chain → primeiro não-nulo | Campo virtual, não existe no externo |
| `nome_fantasia` | `nome_fantasia` | TEXT | — | |
| `razao_social` | `razao_social` | TEXT | — | |
| `nome_crm` | `nome_crm` | TEXT | — | Nome principal no CRM |
| `cnpj` | `cnpj` | TEXT | — | 14 dígitos |
| `cnpj_base` | `cnpj_base` | TEXT | — | 8 primeiros dígitos |
| `industry` | `ramo_atividade` / `nicho_cliente` | TEXT | Fallback: ramo_atividade → nicho_cliente | Campo virtual |
| `ramo_atividade` | `ramo_atividade` | TEXT | — | |
| `nicho_cliente` | `nicho_cliente` | TEXT | — | |
| `tags` | `tags_array` | TEXT[] | Renomeado | Local: `tags`, Externo: `tags_array` |
| `city` | `city` | TEXT | `extractLocationFromName()` se null | Parsed do nome_crm |
| `state` | `state` | TEXT | `extractLocationFromName()` se null | Parsed do nome_crm |
| `status` | `status` | TEXT | — | Default: 'ativo' |
| `is_customer` | `is_customer` | BOOLEAN | Default false | |
| `is_carrier` | `is_carrier` | BOOLEAN | Default false | |
| `is_supplier` | `is_supplier` | BOOLEAN | Default false | |
| `is_matriz` | `is_matriz` | BOOLEAN | — | |
| `capital_social` | `capital_social` | NUMERIC | — | |
| `porte_rf` | `porte_rf` | TEXT | — | Receita Federal |
| `situacao_rf` | `situacao_rf` | TEXT | — | |
| `situacao_rf_data` | `situacao_rf_data` | DATE | — | |
| `natureza_juridica` | `natureza_juridica` | TEXT | — | |
| `natureza_juridica_desc` | `natureza_juridica_desc` | TEXT | — | |
| `data_fundacao` | `data_fundacao` | DATE | — | |
| `inscricao_estadual` | `inscricao_estadual` | TEXT | — | |
| `inscricao_municipal` | `inscricao_municipal` | TEXT | — | |
| `grupo_economico` | `grupo_economico` | TEXT | — | |
| `grupo_economico_id` | `grupo_economico_id` | UUID | — | |
| `tipo_cooperativa` | `tipo_cooperativa` | TEXT | — | |
| `numero_cooperativa` | `numero_cooperativa` | TEXT | — | |
| `matriz_id` | `matriz_id` | UUID | — | |
| `central_id` | `central_id` | UUID | — | |
| `singular_id` | `singular_id` | UUID | — | |
| `confederacao_id` | `confederacao_id` | UUID | — | |
| `website` | `website` | TEXT | — | |
| `financial_health` | `financial_health` | TEXT | Default: 'unknown' | |
| `annual_revenue` | `annual_revenue` | TEXT | — | |
| `employee_count` | `employee_count` | TEXT | — | |
| `logo_url` | `logo_url` | TEXT | — | |
| `bitrix_company_id` | `bitrix_company_id` | INTEGER | — | |
| `extra_data_rf` | `extra_data_rf` | JSONB | — | Dados extras da RF |
| `cores_marca` | `cores_marca` | TEXT | — | Cores da marca |
| `lead_score` | `lead_score` | INTEGER | — | Só no externo |
| `lead_status` | `lead_status` | TEXT | — | Só no externo |

### Campos LOCAL-ONLY (não existem no externo)

Os seguintes campos existem no schema local mas são **virtuais** (derivados de campos externos):

- `name` → derivado de `nome_crm || nome_fantasia || razao_social`
- `industry` → derivado de `ramo_atividade || nicho_cliente`
- `tags` → renomeado de `tags_array`
- `phone`, `email`, `address` → tabelas separadas no externo (`company_phones`, `company_emails`, `company_addresses`)
- `instagram`, `linkedin`, `facebook`, `youtube`, `twitter`, `tiktok` → tabela `company_social_media` no externo
- `notes` → não mapeado diretamente

### Campos EXTERNO-ONLY (não existem no local)

- `lead_score`, `lead_status`, `lead_score_updated_at`
- `bitrix_created_at`, `bitrix_updated_at`
- `created_by_id`, `deleted_at`, `deleted_by`

---

## Tabela: contacts

Os contatos são armazenados diretamente no Supabase local. O banco externo possui tabelas auxiliares de inteligência.

| Campo Local | Campo Externo (se aplicável) | Tipo | Notas |
|---|---|---|---|
| `id` | `id` | UUID | PK |
| `first_name` | `first_name` | TEXT | |
| `last_name` | `last_name` | TEXT | |
| `email` | — | TEXT | Local; externo usa `contact_emails` |
| `phone` | — | TEXT | Local; externo usa `contact_phones` |
| `company_id` | `company_id` | UUID | FK → companies |
| `role_title` | `role_title` | TEXT | |
| `relationship_score` | `relationship_score` | INTEGER | |
| `relationship_stage` | `relationship_stage` | TEXT | |
| `sentiment` | `sentiment` | TEXT | |
| `behavior` | `behavior` | JSONB | Inclui discProfile, supportLevel, etc. |
| `tags` | `tags` | TEXT[] | |
| `birthday` | `birthday` | DATE | |
| `interests` | `interests` | TEXT[] | |
| `hobbies` | `hobbies` | TEXT[] | |

---

## Tabela: interactions

| Campo Local | Campo Externo | Tipo | Notas |
|---|---|---|---|
| `id` | `id` | UUID | PK |
| `contact_id` | `contact_id` | UUID | FK → contacts |
| `company_id` | `company_id` | UUID | FK → companies |
| `title` | `title` | TEXT | |
| `type` | `type` | TEXT | email, phone, meeting, whatsapp, note |
| `content` | `content` | TEXT | |
| `sentiment` | `sentiment` | TEXT | |
| `created_at` | `created_at` | TIMESTAMPTZ | |
| `follow_up_required` | `follow_up_required` | BOOLEAN | |
| `follow_up_date` | `follow_up_date` | TIMESTAMPTZ | |
| `tags` | `tags` | TEXT[] | |
| `key_insights` | `key_insights` | TEXT[] | |
| `emotion_analysis` | `emotion_analysis` | JSONB | |

---

## RPCs Disponíveis (Banco Externo)

### Dashboard & KPIs

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `get_complete_dashboard` | `p_user_id` | JSON | Dashboard completo com todos KPIs |
| `get_executive_dashboard` | — | JSON | Visão executiva condensada |
| `get_instant_kpis` | — | JSON | KPIs em tempo real |
| `get_mini_dashboard` | — | JSON | Dashboard resumido |
| `get_seller_dashboard` | — | JSON | Dashboard do vendedor |
| `get_business_alerts` | — | JSON[] | Alertas de negócio ativos |
| `get_daily_summary` | — | JSON | Resumo do dia |
| `get_weekly_summary` | — | JSON | Resumo semanal |

### Contatos

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `search_contacts` | `p_query` | JSON[] | Busca simples por texto |
| `search_contacts_advanced` | `p_query, p_filters` | JSON[] | Busca com filtros avançados |
| `search_contacts_fuzzy` | `p_query` | JSON[] | Busca fuzzy (tolerante a erros) |
| `list_contacts_paginated` | `p_page, p_limit` | JSON[] | Listagem paginada |
| `get_contact_360_by_phone` | `p_phone` | JSON | Visão 360° por telefone |
| `get_contact_intelligence` | `p_contact_id` | JSON | Inteligência completa do contato |
| `get_contact_disc_profile` | `p_contact_id` | JSON | Perfil DISC calculado |
| `get_contact_effectiveness` | `p_contact_id` | JSON | Métricas de efetividade |
| `get_contact_engagement_score` | `p_contact_id` | JSON | Score de engajamento |
| `get_best_contact_time` | `p_contact_id` | JSON | Melhor horário para contato |
| `get_duplicate_contacts` | — | JSON[] | Contatos duplicados |
| `get_orphan_contacts` | — | JSON[] | Contatos sem empresa |
| `get_birthday_contacts` | — | JSON[] | Aniversariantes |

### Empresas

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `get_company_health_score` | `p_company_id` | JSON | Score de saúde da empresa |
| `get_company_360_view` | `p_company_id` | JSON | Visão 360° da empresa |
| `advanced_company_search` | `p_query, p_filters` | JSON[] | Busca avançada |
| `calculate_churn_risk` | `p_company_id` | JSON | Risco de churn |
| `calculate_propensity_score` | `p_company_id` | JSON | Propensão de compra |
| `get_strategic_accounts` | — | JSON[] | Contas estratégicas |
| `get_next_best_action` | `p_company_id` | JSON | Próxima melhor ação |

### Pipeline & Deals

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `create_deal` | `p_params` | JSON | Criar oportunidade |
| `get_deals_pipeline` | `p_user_id` | JSON[] | Pipeline de deals |
| `get_pipeline_summary` | `p_user_id` | JSON | Resumo do pipeline |
| `get_weighted_forecast` | — | JSON[] | Forecast ponderado |
| `get_stage_velocity` | — | JSON[] | Velocidade por estágio |
| `get_stalled_deals` | `p_days` | JSON[] | Deals parados |
| `get_velocity_metrics` | — | JSON | Métricas de velocidade |
| `move_deal_to_stage` | `p_deal_id, p_stage` | JSON | Mover deal |
| `predict_close_date` | `p_deal_id` | JSON | Previsão de fechamento |

### Analytics & Reports

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `get_rfm_dashboard` | — | JSON | Dashboard RFM |
| `get_cohort_analysis` | — | JSON | Análise de coorte |
| `get_seasonality_analysis` | — | JSON | Análise de sazonalidade |
| `get_conversion_funnel` | — | JSON | Funil de conversão |
| `get_pareto_customers` | — | JSON[] | Clientes Pareto (80/20) |
| `get_churn_risk_report` | — | JSON | Relatório de risco de churn |
| `get_loss_reason_analysis` | — | JSON | Análise de razões de perda |

### Metas & Gamificação

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `get_user_goals` | — | JSON[] | Metas do usuário |
| `get_goals_dashboard` | — | JSON | Dashboard de metas |
| `get_quota_status` | — | JSON | Status da cota |
| `get_leaderboard` | — | JSON[] | Ranking |
| `get_user_badges` | — | JSON[] | Badges conquistadas |

### Tarefas & Lembretes

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `create_task` | `p_params` | JSON | Criar tarefa |
| `get_pending_tasks` | — | JSON[] | Tarefas pendentes |
| `get_overdue_tasks` | — | JSON[] | Tarefas atrasadas |
| `get_all_tasks` | — | JSON[] | Todas as tarefas |
| `complete_task` | `p_task_id` | JSON | Completar tarefa |

### Territórios

| RPC | Parâmetros | Retorno | Descrição |
|---|---|---|---|
| `get_territories` | — | JSON[] | Listar territórios |
| `create_territory` | `p_params` | JSON | Criar território |
| `get_territory_performance` | — | JSON[] | Performance por território |
| `assign_territory` | `p_params` | JSON | Atribuir território |

---

## Tabelas Externas Auxiliares (sem mapeamento local direto)

| Tabela | Descrição | Acessada via |
|---|---|---|
| `company_phones` | Telefones da empresa | RPC / select |
| `company_emails` | Emails da empresa | RPC / select |
| `company_addresses` | Endereços da empresa | RPC / select |
| `company_social_media` | Redes sociais da empresa | RPC / select |
| `company_cnaes` | CNAEs da empresa | RPC / select |
| `company_rfm_scores` | Scores RFM | RPC |
| `company_stakeholder_map` | Mapa de stakeholders | RPC |
| `contact_phones` | Telefones do contato | RPC / select |
| `contact_emails` | Emails do contato | RPC / select |
| `contact_addresses` | Endereços do contato | RPC / select |
| `contact_social_media` | Redes sociais do contato | RPC / select |
| `deals` | Oportunidades/Deals | RPC |
| `tasks` | Tarefas | RPC |
| `proposals` | Propostas | RPC |
| `meetings` | Reuniões | RPC |
| `email_logs` | Logs de email | select |
| `nps_surveys` | Pesquisas NPS | select |
| `workspace_accounts` | Contas do workspace | select |
| `whatsapp_messages` | Mensagens WhatsApp | select |
| `sales_activities` | Atividades de vendas | select |

---

## Views Materializadas (Externo)

| View | Descrição |
|---|---|
| `vw_contacts_completo` | Contato com todos os dados relacionados |
| `vw_companies_completo` | Empresa com todos os dados relacionados |
| `vw_deals_full` | Deals com empresa e contato |
| `vw_singu_contact_360` | Visão 360° do contato para o SINGU |
| `vw_singu_communication_intel` | Intel de comunicação |
| `vw_singu_emotional_trend` | Tendência emocional |
| `vw_singu_rapport_intel` | Intel de rapport |
| `vw_singu_disc_dashboard` | Dashboard DISC |
| `vw_singu_data_health` | Saúde dos dados |
| `vw_singu_usage_kpis` | KPIs de uso |
| `mv_daily_kpis` | KPIs diários (materializada) |

---

## Arquitetura do Proxy

```
[Frontend] → queryExternalData() / callExternalRpc()
               ↓
         src/lib/externalData.ts
               ↓ (fetch com auth token)
         supabase/functions/external-data/index.ts
               ↓ (validação + rate limit)
         Banco Externo (pgxfvjmuubtbowutlide)
```

### Fluxo de dados:
1. Hook (ex: `useCompanies`) chama `queryExternalData()` ou `callExternalRpc()`
2. `externalData.ts` faz fetch para a Edge Function com JWT
3. Edge Function valida tabela/RPC contra allowlist
4. Edge Function conecta no banco externo via service_role
5. Dados retornam e são mapeados pelo hook (ex: `mapCompany()`)
