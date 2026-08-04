# 📖 Dicionário de Dados — SINGU CRM

> Gerado automaticamente em 2026-05-13

## 📋 Tabela: `abm_account_plans`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `account_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `template_type` | text | NO | 'strategic'::text |
| `goal` | text | YES |  |
| `objectives` | jsonb | NO | '[]'::jsonb |
| `strategies` | jsonb | NO | '[]'::jsonb |
| `key_stakeholders` | jsonb | NO | '[]'::jsonb |
| `milestones` | jsonb | NO | '[]'::jsonb |
| `status` | text | NO | 'draft'::text |
| `target_revenue` | numeric | YES |  |
| `start_date` | date | YES |  |
| `end_date` | date | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `abm_accounts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `external_company_id` | text | NO |  |
| `company_name` | text | NO |  |
| `parent_account_id` | uuid | YES |  |
| `tier` | text | NO | 'mid'::text |
| `account_score` | integer | NO | 0 |
| `score_breakdown` | jsonb | NO | '{}'::jsonb |
| `status` | text | NO | 'active'::text |
| `assigned_to` | uuid | YES |  |
| `target_revenue` | numeric | YES |  |
| `notes` | text | YES |  |
| `last_scored_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `abm_buying_committee`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `account_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `external_contact_id` | text | YES |  |
| `contact_name` | text | NO |  |
| `contact_email` | text | YES |  |
| `contact_role` | text | YES |  |
| `committee_role` | text | NO |  |
| `influence_level` | integer | NO | 5 |
| `engagement_score` | integer | NO | 0 |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `abm_campaigns`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `campaign_type` | text | NO |  |
| `target_account_ids` | ARRAY | NO | ARRAY[]::uuid[] |
| `channels` | ARRAY | NO | ARRAY[]::text[] |
| `status` | text | NO | 'draft'::text |
| `start_date` | date | YES |  |
| `end_date` | date | YES |  |
| `budget` | numeric | YES |  |
| `metrics` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `abm_whitespace_opportunities`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `account_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `opportunity_type` | text | NO |  |
| `product_category` | text | NO |  |
| `estimated_value` | numeric | YES |  |
| `confidence` | integer | NO | 50 |
| `rationale` | text | YES |  |
| `status` | text | NO | 'identified'::text |
| `identified_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `access_blocked_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | YES |  |
| `ip_address` | text | YES |  |
| `country_code` | text | YES |  |
| `city` | text | YES |  |
| `reason` | text | NO |  |
| `user_agent` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `access_security_settings`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `enable_ip_restriction` | boolean | YES | false |
| `enable_geo_blocking` | boolean | YES | false |
| `enable_device_detection` | boolean | YES | true |
| `notify_new_device` | boolean | YES | true |
| `max_sessions` | integer | YES | 5 |
| `session_timeout_minutes` | integer | YES | 480 |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `activities`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `type` | text | NO |  |
| `entity_type` | text | NO |  |
| `entity_id` | uuid | NO |  |
| `entity_name` | text | YES |  |
| `description` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `ai_chat_messages`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `thread_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `role` | text | NO |  |
| `content` | text | NO |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `tokens_used` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `ai_chat_threads`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `title` | text | NO | 'Nova conversa'::text |
| `context_entity_type` | text | YES |  |
| `context_entity_id` | uuid | YES |  |
| `pinned` | boolean | NO | false |
| `archived` | boolean | NO | false |
| `last_message_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `ai_recommendation_audit_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `score` | double precision | NO |  |
| `recommendation_type` | text | NO |  |
| `reasons` | ARRAY | NO | '{}'::text[] |
| `data_used` | jsonb | YES | '{}'::jsonb |
| `user_action` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `ai_recommendation_audit_logs_v2`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | text | YES |  |
| `user_id` | uuid | NO |  |
| `score` | integer | YES |  |
| `recommendation_type` | text | NO |  |
| `reasons` | ARRAY | YES |  |
| `data_used` | jsonb | YES | '{}'::jsonb |
| `user_action` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `ai_recommendation_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `recommendation_score` | double precision | NO |  |
| `recommendation_reasons` | jsonb | NO |  |
| `input_data_snapshot` | jsonb | NO |  |
| `user_action` | text | YES |  |
| `action_timestamp` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `type` | text | NO |  |
| `priority` | text | YES | 'medium'::text |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `action_url` | text | YES |  |
| `dismissed` | boolean | YES | false |
| `expires_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `applied_objection_responses`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `objection` | text | NO |  |
| `category` | text | YES |  |
| `response_text` | text | YES |  |
| `interaction_id` | uuid | YES |  |
| `note` | text | YES |  |
| `applied_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `attribution_models_cache`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `deal_id` | text | NO |  |
| `model` | text | NO |  |
| `allocations` | jsonb | NO | '[]'::jsonb |
| `total_value` | numeric | NO | 0 |
| `computed_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `attribution_touchpoints`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `deal_id` | text | YES |  |
| `touchpoint_type` | text | NO |  |
| `source` | text | YES |  |
| `medium` | text | YES |  |
| `campaign` | text | YES |  |
| `content` | text | YES |  |
| `term` | text | YES |  |
| `page_url` | text | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `occurred_at` | timestamp with time zone | NO | now() |
| `value_attributed` | numeric | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `audit_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `entity_type` | text | NO |  |
| `entity_id` | uuid | NO |  |
| `action` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `user_id` | uuid | NO |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `automation_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `rule_id` | uuid | NO |  |
| `trigger_entity_type` | text | NO |  |
| `trigger_entity_id` | uuid | NO |  |
| `actions_executed` | jsonb | NO | '[]'::jsonb |
| `success` | boolean | NO | true |
| `error_message` | text | YES |  |
| `executed_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `automation_rules`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `is_active` | boolean | NO | true |
| `trigger_type` | text | NO |  |
| `trigger_config` | jsonb | NO | '{}'::jsonb |
| `conditions` | jsonb | NO | '[]'::jsonb |
| `actions` | jsonb | NO | '[]'::jsonb |
| `execution_count` | integer | NO | 0 |
| `last_executed_at` | timestamp with time zone | YES |  |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `battle_cards`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `competitor_name` | text | NO |  |
| `competitor_logo_url` | text | YES |  |
| `summary` | text | YES |  |
| `our_strengths` | jsonb | NO | '[]'::jsonb |
| `their_strengths` | jsonb | NO | '[]'::jsonb |
| `weaknesses` | jsonb | NO | '[]'::jsonb |
| `pricing_comparison` | text | YES |  |
| `win_themes` | ARRAY | NO | ARRAY[]::text[] |
| `landmines` | ARRAY | NO | ARRAY[]::text[] |
| `proof_points` | jsonb | NO | '[]'::jsonb |
| `last_updated_by` | uuid | YES |  |
| `version` | integer | NO | 1 |
| `active` | boolean | NO | true |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `brain_dominance_analysis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `reptilian_score` | integer | YES | 0 |
| `limbic_score` | integer | YES | 0 |
| `neocortex_score` | integer | YES | 0 |
| `dominant_system` | text | YES |  |
| `recommendations` | jsonb | YES | '[]'::jsonb |
| `negotiation_tips` | jsonb | YES | '[]'::jsonb |
| `analyzed_at` | timestamp with time zone | YES | now() |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `call_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `direction` | text | YES |  |
| `status` | text | YES |  |
| `duration_seconds` | integer | YES | 0 |
| `audio_url` | text | YES |  |
| `transcription` | text | YES |  |
| `sentiment` | text | YES |  |
| `summary` | text | YES |  |
| `external_id` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `campaign_recipients`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `campaign_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `email` | text | NO |  |
| `status` | text | NO | 'pending'::text |
| `sent_at` | timestamp with time zone | YES |  |
| `opened_at` | timestamp with time zone | YES |  |
| `clicked_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `canned_responses`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `title` | text | NO |  |
| `content` | text | NO |  |
| `category` | text | YES | 'geral'::text |
| `shortcut` | text | YES |  |
| `usage_count` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `churn_risk_scores`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `risk_level` | text | NO | 'low'::text |
| `risk_score` | integer | NO | 0 |
| `risk_factors` | jsonb | NO | '[]'::jsonb |
| `recommendations` | ARRAY | YES | '{}'::text[] |
| `days_since_last_interaction` | integer | YES |  |
| `sentiment_trend` | text | YES |  |
| `score_trend` | text | YES |  |
| `analyzed_at` | timestamp with time zone | NO | now() |
| `expires_at` | timestamp with time zone | NO | (now() + '7 days'::interval) |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `city_whitelist`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `city` | text | NO |  |
| `state` | text | YES |  |
| `country_code` | text | YES | 'BR'::text |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `client_values`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `category` | text | NO |  |
| `value_name` | text | NO |  |
| `importance` | integer | YES | 5 |
| `detected_phrases` | ARRAY | YES |  |
| `frequency` | integer | YES | 1 |
| `last_mentioned` | timestamp with time zone | YES | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `coaching_scorecards`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `criteria` | jsonb | NO | '[]'::jsonb |
| `active` | boolean | NO | true |
| `is_default` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `cognitive_bias_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `detected_biases` | jsonb | NO |  |
| `category_distribution` | jsonb | YES |  |
| `dominant_biases` | ARRAY | YES |  |
| `vulnerabilities` | ARRAY | YES |  |
| `resistances` | ARRAY | YES |  |
| `sales_strategies` | jsonb | YES |  |
| `profile_summary` | text | YES |  |
| `analyzed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `communication_preferences`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `preferred_channel` | text | NO | 'whatsapp'::text |
| `preferred_days` | ARRAY | YES | '{}'::text[] |
| `preferred_time_start` | time without time zone | YES |  |
| `preferred_time_end` | time without time zone | YES |  |
| `contact_frequency` | text | YES | 'weekly'::text |
| `avoid_days` | ARRAY | YES | '{}'::text[] |
| `notes` | text | YES |  |
| `response_rate_by_channel` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `companies`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `industry` | text | YES |  |
| `website` | text | YES |  |
| `phone` | text | YES |  |
| `email` | text | YES |  |
| `address` | text | YES |  |
| `city` | text | YES |  |
| `state` | text | YES |  |
| `logo_url` | text | YES |  |
| `notes` | text | YES |  |
| `tags` | ARRAY | YES | '{}'::text[] |
| `financial_health` | text | YES | 'unknown'::text |
| `employee_count` | text | YES |  |
| `annual_revenue` | text | YES |  |
| `competitors` | ARRAY | YES | '{}'::text[] |
| `challenges` | ARRAY | YES | '{}'::text[] |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `cnpj` | text | YES |  |
| `cnpj_base` | text | YES |  |
| `razao_social` | text | YES |  |
| `nome_fantasia` | text | YES |  |
| `nome_crm` | text | YES |  |
| `nicho_cliente` | text | YES |  |
| `ramo_atividade` | text | YES |  |
| `capital_social` | numeric | YES |  |
| `status` | text | YES | 'ativo'::text |
| `situacao_rf` | text | YES |  |
| `situacao_rf_data` | date | YES |  |
| `porte_rf` | text | YES |  |
| `natureza_juridica` | text | YES |  |
| `natureza_juridica_desc` | text | YES |  |
| `data_fundacao` | date | YES |  |
| `grupo_economico` | text | YES |  |
| `grupo_economico_id` | uuid | YES |  |
| `is_customer` | boolean | YES | false |
| `is_supplier` | boolean | YES | false |
| `is_carrier` | boolean | YES | false |
| `is_matriz` | boolean | YES |  |
| `matriz_id` | uuid | YES |  |
| `tipo_cooperativa` | text | YES |  |
| `numero_cooperativa` | text | YES |  |
| `singular_id` | uuid | YES |  |
| `central_id` | uuid | YES |  |
| `confederacao_id` | uuid | YES |  |
| `inscricao_estadual` | text | YES |  |
| `inscricao_municipal` | text | YES |  |
| `cores_marca` | text | YES |  |
| `extra_data_rf` | jsonb | YES |  |
| `bitrix_company_id` | integer | YES |  |
| `search_vector` | tsvector | YES |  |
| `lat` | double precision | YES |  |
| `lng` | double precision | YES |  |
| `instagram` | text | YES |  |
| `linkedin` | text | YES |  |
| `facebook` | text | YES |  |
| `youtube` | text | YES |  |
| `twitter` | text | YES |  |
| `tiktok` | text | YES |  |
| `version` | integer | NO | 0 |
| `external_id` | text | YES |  |
| `vak_dominant` | text | YES |  |
| `motivation_direction` | text | YES |  |
| `working_style` | text | YES |  |
| `strategic_roadmap` | jsonb | YES | '[]'::jsonb |

## 📋 Tabela: `compatibility_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `compatibility_score` | integer | NO |  |
| `threshold` | integer | NO |  |
| `alert_type` | text | NO | 'below_threshold'::text |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `dismissed` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |
| `expires_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `compatibility_settings`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `alert_threshold` | integer | NO | 50 |
| `alert_only_important` | boolean | YES | true |
| `important_min_relationship_score` | integer | YES | 70 |
| `email_notifications` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `competitors`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `website` | text | YES |  |
| `strengths` | ARRAY | YES | ARRAY[]::text[] |
| `weaknesses` | ARRAY | YES | ARRAY[]::text[] |
| `typical_price_range` | text | YES |  |
| `win_rate_against` | numeric | YES | 0 |
| `notes` | text | YES |  |
| `active` | boolean | NO | true |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `connection_anomalies`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `webhook_id` | uuid | YES |  |
| `connection_id` | uuid | YES |  |
| `anomaly_type` | text | NO |  |
| `severity` | text | NO | 'medium'::text |
| `explanation` | text | NO |  |
| `metrics` | jsonb | NO | '{}'::jsonb |
| `window_start` | timestamp with time zone | NO |  |
| `window_end` | timestamp with time zone | NO |  |
| `detected_at` | timestamp with time zone | NO | now() |
| `acknowledged_at` | timestamp with time zone | YES |  |
| `acknowledged_by` | uuid | YES |  |
| `model_used` | text | YES |  |
| `confidence` | numeric | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `connection_configs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO |  |
| `connection_type` | text | NO |  |
| `description` | text | YES |  |
| `is_active` | boolean | NO | true |
| `config` | jsonb | NO | '{}'::jsonb |
| `secret_refs` | jsonb | NO | '{}'::jsonb |
| `last_tested_at` | timestamp with time zone | YES |  |
| `last_test_status` | text | YES |  |
| `last_test_latency_ms` | integer | YES |  |
| `last_test_message` | text | YES |  |
| `created_by` | uuid | NO |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `encrypted_config` | bytea | YES |  |
| `encryption_version` | smallint | NO | 1 |
| `discovered_schema` | jsonb | YES |  |
| `discovered_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `connection_quotas`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `webhook_id` | uuid | NO |  |
| `period_start` | date | NO | (date_trunc('month'::text, now()))::date |
| `calls_limit` | integer | NO | 10000 |
| `calls_used` | integer | NO | 0 |
| `overage_blocked` | boolean | NO | true |
| `alert_sent_80` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `connection_test_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `connection_id` | uuid | NO |  |
| `status` | text | NO |  |
| `latency_ms` | integer | YES |  |
| `message` | text | YES |  |
| `details` | jsonb | YES |  |
| `tested_by` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_analytical_profiles`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `preferences` | jsonb | YES | '[]'::jsonb |
| `recurrent_topics` | jsonb | YES | '[]'::jsonb |
| `communication_style` | text | YES |  |
| `sentiment_trend` | text | YES |  |
| `last_updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `contact_automation_settings`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `reminder_enabled` | boolean | YES | true |
| `escalation_enabled` | boolean | YES | false |
| `delay_hours` | integer | YES | 24 |
| `escalation_role` | text | YES | 'supervisor'::text |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `last_escalation_at` | timestamp with time zone | YES |  |
| `resolution_summary` | text | YES |  |

## 📋 Tabela: `contact_behavior`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `disc_primary` | text | YES |  |
| `disc_confidence` | integer | YES |  |
| `disc_notes` | text | YES |  |
| `vak_primary` | text | YES |  |
| `motivation_primary` | text | YES |  |
| `main_fear` | text | YES |  |
| `career_stage` | text | YES |  |
| `current_pressure` | text | YES |  |
| `professional_goals` | text | YES |  |
| `preferred_channel` | text | YES |  |
| `message_style` | text | YES |  |
| `response_time_avg` | interval | YES |  |
| `best_contact_window` | text | YES |  |
| `formality_level` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `vak_visual` | integer | YES | 0 |
| `vak_auditory` | integer | YES | 0 |
| `vak_kinesthetic` | integer | YES | 0 |
| `decision_speed` | text | YES |  |
| `decision_criteria` | ARRAY | YES |  |
| `needs_approval` | boolean | YES | false |
| `approver_id` | uuid | YES |  |
| `budget_authority` | boolean | YES | false |
| `decision_role` | text | YES |  |
| `decision_power` | integer | YES |  |
| `support_level` | integer | YES |  |
| `influencer_ids` | ARRAY | YES |  |
| `company_financial_health` | text | YES |  |
| `current_challenges` | ARRAY | YES |  |
| `current_competitors` | ARRAY | YES |  |
| `best_time_to_approach` | text | YES |  |
| `seasonal_notes` | text | YES |  |

## 📋 Tabela: `contact_business_context`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `financial_health` | text | YES |  |
| `current_challenges` | ARRAY | YES |  |
| `competitors_used` | ARRAY | YES |  |
| `best_moment_to_approach` | text | YES |  |
| `seasonal_notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_cadence`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `cadence_days` | integer | NO | 14 |
| `priority` | character varying | YES | 'medium'::character varying |
| `auto_remind` | boolean | YES | true |
| `last_contact_at` | timestamp with time zone | YES |  |
| `next_contact_due` | timestamp with time zone | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_cadence_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `cadence_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `operation` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_by` | uuid | YES | auth.uid() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `contact_decision_making`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `decision_speed` | text | YES |  |
| `decision_criteria` | ARRAY | YES |  |
| `needs_approval` | boolean | YES | false |
| `approver_id` | uuid | YES |  |
| `budget_authority` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_family_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `family_info` | text | YES |  |
| `changed_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_influence`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `decision_role` | text | YES |  |
| `decision_power` | integer | YES |  |
| `support_level` | integer | YES |  |
| `influencer_ids` | ARRAY | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_metaprograms`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `toward_score` | integer | YES |  |
| `away_from_score` | integer | YES |  |
| `internal_score` | integer | YES |  |
| `external_score` | integer | YES |  |
| `options_score` | integer | YES |  |
| `procedures_score` | integer | YES |  |
| `proactive_score` | integer | YES |  |
| `reactive_score` | integer | YES |  |
| `global_score` | integer | YES |  |
| `detail_score` | integer | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_next_actions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `action` | text | NO |  |
| `reason` | text | NO |  |
| `channel` | text | NO |  |
| `urgency` | text | NO | 'medium'::text |
| `suggested_script` | text | YES |  |
| `expected_outcome` | text | YES |  |
| `signals_snapshot` | jsonb | NO | '{}'::jsonb |
| `model` | text | YES |  |
| `generated_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `suggested_date` | timestamp with time zone | YES |  |
| `script_context` | jsonb | YES |  |
| `status` | text | YES | 'pending'::text |
| `completed_at` | timestamp with time zone | YES |  |
| `completion_notes` | text | YES |  |
| `edited_script` | text | YES |  |
| `contextual_tone` | text | YES |  |
| `completion_date` | timestamp with time zone | YES |  |
| `was_successful` | boolean | YES | true |

## 📋 Tabela: `contact_objection_scripts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `objection_type` | text | NO |  |
| `script_content` | text | NO |  |
| `neurological_bias` | text | YES |  |
| `effectiveness_score` | integer | YES | 0 |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `contact_personality`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `big_five_openness` | integer | YES |  |
| `big_five_conscientiousness` | integer | YES |  |
| `big_five_extraversion` | integer | YES |  |
| `big_five_agreeableness` | integer | YES |  |
| `big_five_neuroticism` | integer | YES |  |
| `big_five_confidence` | integer | YES |  |
| `mbti_type` | text | YES |  |
| `mbti_e_i_score` | integer | YES |  |
| `mbti_s_n_score` | integer | YES |  |
| `mbti_t_f_score` | integer | YES |  |
| `mbti_j_p_score` | integer | YES |  |
| `enneagram_type` | integer | YES |  |
| `enneagram_wing` | integer | YES |  |
| `enneagram_scores` | jsonb | YES |  |
| `temperament_primary` | text | YES |  |
| `temperament_secondary` | text | YES |  |
| `temperament_notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_predictive_roadmap`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `forecast_month` | date | NO |  |
| `predicted_need` | text | NO |  |
| `probability` | integer | YES |  |
| `suggested_offering` | text | YES |  |
| `rationale` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `contact_preferences`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `preferred_channel` | character varying | YES | 'whatsapp'::character varying |
| `preferred_days` | ARRAY | YES | '{}'::text[] |
| `preferred_times` | ARRAY | YES | '{}'::text[] |
| `avoid_days` | ARRAY | YES | '{}'::text[] |
| `avoid_times` | ARRAY | YES | '{}'::text[] |
| `restrictions` | text | YES |  |
| `personal_notes` | text | YES |  |
| `communication_tips` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_preferences_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `preference_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `operation` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_by` | uuid | YES | auth.uid() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `contact_rapport_strategy`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `visual_preference_score` | integer | YES |  |
| `auditory_preference_score` | integer | YES |  |
| `kinesthetic_preference_score` | integer | YES |  |
| `digital_preference_score` | integer | YES |  |
| `emotional_anchors` | ARRAY | YES |  |
| `resistance_triggers` | ARRAY | YES |  |
| `pacing_speed` | text | YES |  |
| `voice_tone_preferred` | text | YES |  |
| `mirroring_technique` | text | YES |  |
| `preferred_triggers` | ARRAY | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_relatives`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `name` | text | NO |  |
| `relationship_type` | text | NO |  |
| `age` | integer | YES |  |
| `birthday` | date | YES |  |
| `phone` | text | YES |  |
| `email` | text | YES |  |
| `occupation` | text | YES |  |
| `company` | text | YES |  |
| `notes` | text | YES |  |
| `is_decision_influencer` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_relatives_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `relative_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `change_type` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_at` | timestamp with time zone | NO | now() |
| `reason` | text | YES |  |

## 📋 Tabela: `contact_report_overrides`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `insights_data` | jsonb | YES | '{}'::jsonb |
| `custom_scripts` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | timezone('utc'::text, now()) |
| `updated_at` | timestamp with time zone | NO | timezone('utc'::text, now()) |

## 📋 Tabela: `contact_time_analysis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `day_of_week` | integer | NO |  |
| `hour_of_day` | integer | NO |  |
| `success_count` | integer | YES | 0 |
| `total_attempts` | integer | YES | 0 |
| `avg_response_time_minutes` | integer | YES |  |
| `last_updated` | timestamp with time zone | NO | now() |

## 📋 Tabela: `contact_time_analysis_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `analysis_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `operation` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_by` | uuid | YES | auth.uid() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `contacts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `company_id` | uuid | YES |  |
| `first_name` | text | NO |  |
| `last_name` | text | NO |  |
| `role` | text | YES | 'contact'::text |
| `role_title` | text | YES |  |
| `email` | text | YES |  |
| `phone` | text | YES |  |
| `whatsapp` | text | YES |  |
| `linkedin` | text | YES |  |
| `instagram` | text | YES |  |
| `twitter` | text | YES |  |
| `avatar_url` | text | YES |  |
| `birthday` | date | YES |  |
| `notes` | text | YES |  |
| `tags` | ARRAY | YES | '{}'::text[] |
| `hobbies` | ARRAY | YES | '{}'::text[] |
| `interests` | ARRAY | YES | '{}'::text[] |
| `family_info` | text | YES |  |
| `personal_notes` | text | YES |  |
| `relationship_stage` | text | YES | 'unknown'::text |
| `relationship_score` | integer | YES | 0 |
| `sentiment` | text | YES | 'neutral'::text |
| `behavior` | jsonb | YES | '{"discProfile": null, "supportLevel": 5, "decisionPower": 5, "influencesIds": [], "needsApproval": false, "discConfidence": 0, "formalityLevel": 3, "competitorsUsed": [], "influencedByIds": [], "decisionCriteria": [], "preferredChannel": "whatsapp", "currentChallenges": []}'::jsonb |
| `life_events` | jsonb | YES | '[]'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `version` | integer | NO | 0 |
| `external_id` | text | YES |  |
| `rapport_metadata` | jsonb | YES | '{}'::jsonb |
| `last_interaction_at` | timestamp with time zone | YES |  |
| `interactions_count` | integer | YES | 0 |
| `vak_dominant` | text | YES |  |
| `motivation_direction` | text | YES |  |
| `working_style` | text | YES |  |
| `reference_frame` | text | YES |  |
| `chunk_size` | text | YES |  |
| `action_filter` | text | YES |  |
| `comparison_style` | text | YES |  |
| `most_frequent_objection` | text | YES |  |
| `vak_profile` | jsonb | YES | '{}'::jsonb |
| `metaprogram_profile` | jsonb | YES | '{}'::jsonb |
| `objection_patterns` | jsonb | YES | '[]'::jsonb |
| `predictive_roadmap` | jsonb | YES | '[]'::jsonb |
| `future_needs_forecast` | jsonb | YES | '[]'::jsonb |

## 📋 Tabela: `conversation_analyses`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `interaction_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `deal_id` | uuid | YES |  |
| `duration_seconds` | integer | YES |  |
| `talk_ratio_rep` | numeric | YES |  |
| `talk_ratio_customer` | numeric | YES |  |
| `longest_monologue_seconds` | integer | YES |  |
| `questions_asked` | integer | YES | 0 |
| `sentiment_overall` | text | YES |  |
| `sentiment_timeline` | jsonb | NO | '[]'::jsonb |
| `topics` | jsonb | NO | '[]'::jsonb |
| `objections` | jsonb | NO | '[]'::jsonb |
| `action_items` | jsonb | NO | '[]'::jsonb |
| `key_moments` | jsonb | NO | '[]'::jsonb |
| `coaching_score` | integer | YES |  |
| `coaching_tips` | ARRAY | NO | '{}'::text[] |
| `next_best_action` | text | YES |  |
| `model_used` | text | YES |  |
| `analyzed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `conversation_topics_catalog`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `topic_key` | text | NO |  |
| `label` | text | NO |  |
| `category` | text | NO |  |
| `keywords` | ARRAY | NO | '{}'::text[] |
| `active` | boolean | NO | true |
| `sort_order` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `conversational_search_cache`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `query_hash` | text | NO |  |
| `query_text` | text | NO |  |
| `response` | jsonb | NO |  |
| `model` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `expires_at` | timestamp with time zone | NO | (now() + '00:05:00'::interval) |

## 📋 Tabela: `crm_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `type` | text | NO |  |
| `severity` | text | YES | 'medium'::text |
| `message` | text | NO |  |
| `suggested_action` | text | YES |  |
| `is_resolved` | boolean | YES | false |
| `created_at` | timestamp with time zone | YES | now() |
| `resolved_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `crm_automation_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `automation_name` | text | NO |  |
| `status` | text | NO |  |
| `payload` | jsonb | YES |  |
| `result` | jsonb | YES |  |
| `execution_time_ms` | integer | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `audit_context` | jsonb | YES | '{}'::jsonb |

## 📋 Tabela: `crm_automation_reprocess_queue`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `log_id` | uuid | YES |  |
| `retry_count` | integer | YES | 0 |
| `max_retries` | integer | YES | 3 |
| `next_retry_at` | timestamp with time zone | YES | now() |
| `status` | text | YES | 'pending'::text |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `crm_cadence_rules`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `relationship_stage` | text | NO |  |
| `frequency_days` | integer | NO |  |
| `priority` | text | YES | 'medium'::text |
| `suggested_actions` | ARRAY | YES |  |
| `is_active` | boolean | YES | true |
| `version` | integer | YES | 1 |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |
| `cadence_steps` | jsonb | YES | '[]'::jsonb |

## 📋 Tabela: `crm_consent_audit_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `consent_type` | text | NO |  |
| `status` | text | NO |  |
| `source` | text | NO |  |
| `ip_address` | text | YES |  |
| `platform` | text | YES |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `crm_metric_overrides`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `metric_type` | text | NO |  |
| `old_value` | text | YES |  |
| `new_value` | text | NO |  |
| `reason` | text | NO |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `crm_objection_intelligence`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `objection_type` | text | NO |  |
| `behavioral_profile` | text | YES |  |
| `suggested_strategy` | text | YES |  |
| `script_content` | text | YES |  |
| `success_rate` | numeric | YES | 0 |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `crm_relationship_audit_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `field_name` | text | NO |  |
| `old_value` | text | YES |  |
| `new_value` | text | YES |  |
| `change_source` | text | NO |  |
| `trigger_name` | text | YES |  |
| `reason` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `cs_accounts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `csm_owner_id` | uuid | YES |  |
| `account_name` | text | NO |  |
| `tier` | text | NO | 'mid'::text |
| `arr` | numeric | NO | 0 |
| `contract_start` | date | YES |  |
| `renewal_date` | date | YES |  |
| `lifecycle_stage` | text | NO | 'onboarding'::text |
| `health_score` | integer | NO | 50 |
| `health_trend` | text | YES | 'stable'::text |
| `notes` | text | YES |  |
| `last_health_recalc_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `cs_health_signals`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `account_id` | uuid | NO |  |
| `signal_type` | text | NO |  |
| `score` | numeric | NO | 0 |
| `weight` | numeric | NO | 1 |
| `source` | text | YES |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `captured_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `cs_nps_responses`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `account_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `score` | integer | NO |  |
| `category` | text | NO |  |
| `comment` | text | YES |  |
| `surveyed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `cs_qbrs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `account_id` | uuid | NO |  |
| `title` | text | NO |  |
| `scheduled_at` | timestamp with time zone | NO |  |
| `completed_at` | timestamp with time zone | YES |  |
| `status` | text | NO | 'scheduled'::text |
| `agenda` | jsonb | NO | '[]'::jsonb |
| `outcomes` | jsonb | NO | '[]'::jsonb |
| `next_steps` | jsonb | NO | '[]'::jsonb |
| `attendees` | jsonb | NO | '[]'::jsonb |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `cs_renewals`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `account_id` | uuid | NO |  |
| `renewal_date` | date | NO |  |
| `status` | text | NO | 'upcoming'::text |
| `forecasted_arr` | numeric | NO | 0 |
| `actual_arr` | numeric | YES |  |
| `risk_level` | text | NO | 'low'::text |
| `notes` | text | YES |  |
| `closed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `csat_surveys`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `ticket_id` | uuid | YES |  |
| `score` | integer | YES |  |
| `feedback` | text | YES |  |
| `channel` | text | YES | 'email'::text |
| `status` | text | NO | 'pending'::text |
| `sent_at` | timestamp with time zone | YES |  |
| `answered_at` | timestamp with time zone | YES |  |
| `expires_at` | timestamp with time zone | YES | (now() + '7 days'::interval) |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `public_token` | uuid | NO | gen_random_uuid() |

## 📋 Tabela: `csat_surveys_public`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `public_token` | uuid | YES |  |
| `channel` | text | YES |  |
| `status` | text | YES |  |
| `score` | integer | YES |  |
| `sent_at` | timestamp with time zone | YES |  |
| `expires_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `custom_field_values`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `custom_field_id` | uuid | NO |  |
| `entity_id` | uuid | NO |  |
| `value` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `custom_fields`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `entity_type` | text | NO |  |
| `field_name` | text | NO |  |
| `field_label` | text | NO |  |
| `field_type` | text | NO |  |
| `field_options` | jsonb | YES | '[]'::jsonb |
| `is_required` | boolean | YES | false |
| `display_order` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_forecasts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `deal_id` | text | NO |  |
| `deal_name` | text | YES |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `period_id` | uuid | NO |  |
| `category` | text | NO | 'pipeline'::text |
| `confidence_score` | integer | NO | 50 |
| `forecasted_amount` | numeric | NO | 0 |
| `forecasted_close_date` | date | YES |  |
| `stage` | text | YES |  |
| `risk_factors` | jsonb | NO | '[]'::jsonb |
| `health_score` | integer | NO | 50 |
| `last_activity_at` | timestamp with time zone | YES |  |
| `slip_count` | integer | NO | 0 |
| `ai_rationale` | text | YES |  |
| `notes` | text | YES |  |
| `analyzed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_room_activities`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `actor_side` | text | NO |  |
| `actor_label` | text | YES |  |
| `activity_type` | text | NO |  |
| `payload` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_room_comments`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `author_side` | text | NO |  |
| `author_label` | text | YES |  |
| `body` | text | NO |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_room_documents`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `title` | text | NO |  |
| `file_path` | text | NO |  |
| `file_type` | text | YES |  |
| `file_size` | bigint | YES |  |
| `uploaded_by_side` | text | NO | 'seller'::text |
| `view_count` | integer | NO | 0 |
| `last_viewed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_room_milestones`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `due_date` | date | YES |  |
| `status` | text | NO | 'pending'::text |
| `owner_side` | text | NO | 'both'::text |
| `sort_order` | integer | NO | 0 |
| `completed_at` | timestamp with time zone | YES |  |
| `completed_by_side` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_room_stakeholders`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `room_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `name` | text | NO |  |
| `email` | text | YES |  |
| `role_title` | text | YES |  |
| `side` | text | NO |  |
| `influence` | text | NO | 'user'::text |
| `engagement_score` | integer | NO | 50 |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deal_rooms`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `deal_id` | text | YES |  |
| `deal_name` | text | YES |  |
| `company_id` | uuid | YES |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `status` | text | NO | 'active'::text |
| `deal_value` | numeric | YES |  |
| `target_close_date` | date | YES |  |
| `share_token` | text | NO | replace((gen_random_uuid())::text, '-'::text, ''::text) |
| `share_enabled` | boolean | NO | false |
| `last_buyer_view_at` | timestamp with time zone | YES |  |
| `buyer_view_count` | integer | NO | 0 |
| `health_score` | integer | YES |  |
| `health_recommendations` | jsonb | NO | '[]'::jsonb |
| `health_analyzed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `deals`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `pipeline_id` | uuid | YES |  |
| `stage_id` | uuid | YES |  |
| `title` | text | NO |  |
| `value` | numeric | YES | 0 |
| `probability` | integer | YES | 10 |
| `expected_closing_date` | date | YES |  |
| `status` | text | NO | 'open'::text |
| `loss_reason` | text | YES |  |
| `notes` | text | YES |  |
| `priority` | text | YES | 'medium'::text |
| `tags` | ARRAY | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `decision_criteria`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `name` | text | NO |  |
| `priority` | integer | YES | 1 |
| `criteria_type` | text | NO |  |
| `detected_from` | text | YES |  |
| `how_to_address` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `device_login_notifications`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `device_id` | uuid | YES |  |
| `ip_address` | text | YES |  |
| `location` | text | YES |  |
| `is_read` | boolean | YES | false |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `disc_analysis_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `dominance_score` | integer | NO | 0 |
| `influence_score` | integer | NO | 0 |
| `steadiness_score` | integer | NO | 0 |
| `conscientiousness_score` | integer | NO | 0 |
| `primary_profile` | text | NO |  |
| `secondary_profile` | text | YES |  |
| `blend_profile` | text | YES |  |
| `stress_primary` | text | YES |  |
| `stress_secondary` | text | YES |  |
| `confidence` | integer | NO | 50 |
| `analysis_source` | text | NO | 'manual'::text |
| `detected_keywords` | jsonb | YES | '[]'::jsonb |
| `detected_phrases` | jsonb | YES | '[]'::jsonb |
| `behavior_indicators` | jsonb | YES | '[]'::jsonb |
| `analyzed_text` | text | YES |  |
| `analysis_notes` | text | YES |  |
| `profile_summary` | text | YES |  |
| `analyzed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `disc_analysis_history_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `analysis_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `operation` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_by` | uuid | YES | auth.uid() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `disc_communication_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `contact_disc_profile` | text | NO |  |
| `approach_adapted` | boolean | NO | false |
| `adaptation_tips_shown` | jsonb | YES | '[]'::jsonb |
| `tips_followed` | jsonb | YES | '[]'::jsonb |
| `communication_outcome` | text | YES |  |
| `outcome_notes` | text | YES |  |
| `effectiveness_rating` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `disc_conversion_metrics`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `disc_profile` | text | NO |  |
| `blend_profile` | text | YES |  |
| `total_contacts` | integer | NO | 0 |
| `total_opportunities` | integer | NO | 0 |
| `converted_count` | integer | NO | 0 |
| `lost_count` | integer | NO | 0 |
| `conversion_rate` | numeric | YES |  |
| `average_deal_size` | numeric | YES |  |
| `average_sales_cycle_days` | integer | YES |  |
| `average_relationship_score` | numeric | YES |  |
| `average_compatibility_score` | numeric | YES |  |
| `period_start` | date | NO |  |
| `period_end` | date | NO |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `disc_profile_config`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `profile_type` | text | NO |  |
| `name` | text | NO |  |
| `short_description` | text | NO |  |
| `detailed_description` | text | NO |  |
| `core_drive` | text | NO |  |
| `core_fear` | text | NO |  |
| `under_pressure` | text | NO |  |
| `ideal_environment` | text | NO |  |
| `communication_style` | jsonb | NO | '{}'::jsonb |
| `preferred_pace` | text | NO |  |
| `decision_making_style` | text | NO |  |
| `opening_strategies` | jsonb | NO | '[]'::jsonb |
| `presentation_tips` | jsonb | NO | '[]'::jsonb |
| `objection_handling` | jsonb | NO | '[]'::jsonb |
| `closing_techniques` | jsonb | NO | '[]'::jsonb |
| `follow_up_approach` | jsonb | NO | '[]'::jsonb |
| `power_words` | jsonb | NO | '[]'::jsonb |
| `avoid_words` | jsonb | NO | '[]'::jsonb |
| `detection_keywords` | jsonb | NO | '[]'::jsonb |
| `typical_phrases` | jsonb | NO | '[]'::jsonb |
| `compatibility_matrix` | jsonb | NO | '{}'::jsonb |
| `color_scheme` | jsonb | NO | '{}'::jsonb |
| `icon` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `document_signatures`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `document_id` | uuid | YES |  |
| `template_id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `signer_name` | text | NO |  |
| `signer_email` | text | NO |  |
| `rendered_html` | text | NO |  |
| `merge_data` | jsonb | NO | '{}'::jsonb |
| `status` | text | NO | 'pending'::text |
| `signature_token` | text | NO | encode(extensions.gen_random_bytes(24), 'hex'::text) |
| `signature_image` | text | YES |  |
| `signature_typed` | text | YES |  |
| `signed_ip` | text | YES |  |
| `signed_user_agent` | text | YES |  |
| `viewed_at` | timestamp with time zone | YES |  |
| `signed_at` | timestamp with time zone | YES |  |
| `declined_at` | timestamp with time zone | YES |  |
| `declined_reason` | text | YES |  |
| `expires_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `document_signatures_public`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `signature_token` | text | YES |  |
| `signer_name` | text | YES |  |
| `signer_email` | text | YES |  |
| `rendered_html` | text | YES |  |
| `status` | text | YES |  |
| `viewed_at` | timestamp with time zone | YES |  |
| `signed_at` | timestamp with time zone | YES |  |
| `expires_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `document_templates`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `document_type` | text | NO | 'contract'::text |
| `content_html` | text | NO |  |
| `merge_fields` | jsonb | NO | '[]'::jsonb |
| `category` | text | YES |  |
| `is_active` | boolean | NO | true |
| `usage_count` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `document_views`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `signature_id` | uuid | YES |  |
| `document_id` | uuid | YES |  |
| `viewer_ip` | text | YES |  |
| `viewer_user_agent` | text | YES |  |
| `viewer_email` | text | YES |  |
| `duration_seconds` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `documents`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `entity_type` | text | NO |  |
| `entity_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `document_type` | text | NO | 'other'::text |
| `file_url` | text | NO |  |
| `file_size` | integer | YES |  |
| `mime_type` | text | YES |  |
| `version` | integer | YES | 1 |
| `status` | text | YES | 'active'::text |
| `tags` | ARRAY | YES | '{}'::text[] |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `email_campaigns`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `subject` | text | NO |  |
| `content_html` | text | YES |  |
| `content_text` | text | YES |  |
| `status` | text | NO | 'draft'::text |
| `segment_filter` | jsonb | YES | '{}'::jsonb |
| `tags` | ARRAY | YES | '{}'::text[] |
| `scheduled_at` | timestamp with time zone | YES |  |
| `sent_at` | timestamp with time zone | YES |  |
| `total_recipients` | integer | YES | 0 |
| `total_opened` | integer | YES | 0 |
| `total_clicked` | integer | YES | 0 |
| `total_bounced` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `investment` | numeric | YES | 0 |
| `revenue` | numeric | YES | 0 |

## 📋 Tabela: `email_finder_results`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `full_name` | text | NO |  |
| `first_name` | text | YES |  |
| `last_name` | text | YES |  |
| `domain` | text | NO |  |
| `candidates` | jsonb | NO | '[]'::jsonb |
| `best_email` | text | YES |  |
| `best_confidence` | integer | NO | 0 |
| `sources` | jsonb | NO | '[]'::jsonb |
| `found_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `email_thread_summaries`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `thread_key` | text | NO |  |
| `interaction_ids` | ARRAY | NO | '{}'::uuid[] |
| `summary` | text | NO |  |
| `key_points` | ARRAY | NO | '{}'::text[] |
| `action_items` | jsonb | NO | '[]'::jsonb |
| `sentiment` | text | YES |  |
| `next_steps` | ARRAY | NO | '{}'::text[] |
| `generated_by_model` | text | NO | 'google/gemini-2.5-flash'::text |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `email_verifications`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `email` | text | NO |  |
| `status` | text | NO | 'unknown'::text |
| `score` | integer | NO | 0 |
| `mx_found` | boolean | NO | false |
| `smtp_check` | boolean | NO | false |
| `disposable` | boolean | NO | false |
| `role_account` | boolean | NO | false |
| `free_provider` | boolean | NO | false |
| `reasons` | ARRAY | NO | ARRAY[]::text[] |
| `provider` | text | NO | 'internal'::text |
| `raw` | jsonb | NO | '{}'::jsonb |
| `verified_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `emotional_anchors`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `anchor_type` | text | NO |  |
| `trigger_word` | text | NO |  |
| `emotional_state` | text | NO |  |
| `context` | text | YES |  |
| `strength` | integer | YES | 5 |
| `detected_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `emotional_states_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `emotional_state` | text | NO |  |
| `confidence` | integer | YES | 50 |
| `trigger` | text | YES |  |
| `context` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `eq_analysis_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `overall_score` | integer | NO |  |
| `overall_level` | text | NO |  |
| `confidence` | integer | YES |  |
| `pillar_scores` | jsonb | NO |  |
| `indicators` | jsonb | YES |  |
| `strengths` | ARRAY | YES |  |
| `areas_for_growth` | ARRAY | YES |  |
| `sales_implications` | jsonb | YES |  |
| `communication_style` | jsonb | YES |  |
| `profile_summary` | text | YES |  |
| `analyzed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `error_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `message` | text | NO |  |
| `stack` | text | YES |  |
| `context` | jsonb | YES | '{}'::jsonb |
| `user_id` | uuid | YES |  |
| `severity` | USER-DEFINED | NO | 'error'::error_severity |
| `url` | text | YES |  |
| `user_agent` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `favorite_templates`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `template_id` | text | NO |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `feature_flags`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `name` | text | NO |  |
| `enabled` | boolean | NO | false |
| `description` | text | YES |  |
| `roles` | ARRAY | NO | ARRAY[]::text[] |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `ficha360_conversation_summaries`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `filters_hash` | text | NO |  |
| `interaction_ids` | ARRAY | NO |  |
| `filters_summary` | jsonb | NO | '{}'::jsonb |
| `summary` | jsonb | NO |  |
| `model` | text | NO |  |
| `interactions_analyzed` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `follow_up_approvals`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `channel` | text | NO |  |
| `content` | text | NO |  |
| `status` | text | NO | 'pending'::text |
| `scheduled_for` | timestamp with time zone | YES |  |
| `approved_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `follow_up_approvals_v2`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | text | YES |  |
| `user_id` | uuid | NO |  |
| `content` | text | NO |  |
| `channel` | text | YES | 'whatsapp'::text |
| `status` | text | YES | 'pending'::text |
| `scheduled_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `forecast_categories_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `deal_forecast_id` | uuid | NO |  |
| `from_category` | text | YES |  |
| `to_category` | text | NO |  |
| `changed_by` | text | NO | 'user'::text |
| `reason` | text | YES |  |
| `changed_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `forecast_periods`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `period_type` | text | NO |  |
| `period_start` | date | NO |  |
| `period_end` | date | NO |  |
| `quota_amount` | numeric | NO | 0 |
| `actual_won_amount` | numeric | NO | 0 |
| `status` | text | NO | 'open'::text |
| `closed_at` | timestamp with time zone | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `forecast_quota_settings`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `default_monthly_quota` | numeric | NO | 0 |
| `default_quarterly_quota` | numeric | NO | 0 |
| `health_weight_activity` | integer | NO | 30 |
| `health_weight_stage_age` | integer | NO | 25 |
| `health_weight_engagement` | integer | NO | 25 |
| `health_weight_relationship` | integer | NO | 20 |
| `inactivity_threshold_days` | integer | NO | 14 |
| `slip_threshold_days` | integer | NO | 7 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `forecast_snapshots`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `period_id` | uuid | NO |  |
| `snapshot_date` | date | NO | CURRENT_DATE |
| `commit_total` | numeric | NO | 0 |
| `best_case_total` | numeric | NO | 0 |
| `pipeline_total` | numeric | NO | 0 |
| `weighted_total` | numeric | NO | 0 |
| `deal_count` | integer | NO | 0 |
| `snapshot_data` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `form_submissions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `form_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `data` | jsonb | NO | '{}'::jsonb |
| `routed_to` | uuid | YES |  |
| `utm_source` | text | YES |  |
| `utm_medium` | text | YES |  |
| `utm_campaign` | text | YES |  |
| `utm_content` | text | YES |  |
| `utm_term` | text | YES |  |
| `page_url` | text | YES |  |
| `user_agent` | text | YES |  |
| `ip_hash` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `forms`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `slug` | text | NO |  |
| `description` | text | YES |  |
| `fields` | jsonb | NO | '[]'::jsonb |
| `routing_rules` | jsonb | NO | '{"type": "round_robin", "members": []}'::jsonb |
| `nurturing_workflow_id` | uuid | YES |  |
| `redirect_url` | text | YES |  |
| `success_message` | text | YES | 'Obrigado! Recebemos seus dados.'::text |
| `is_published` | boolean | NO | false |
| `view_count` | integer | NO | 0 |
| `submission_count` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `forms_public`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `slug` | text | YES |  |
| `name` | text | YES |  |
| `description` | text | YES |  |
| `fields` | jsonb | YES |  |
| `redirect_url` | text | YES |  |
| `success_message` | text | YES |  |

## 📋 Tabela: `geo_allowed_countries`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `country_code` | text | NO |  |
| `country_name` | text | NO |  |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `handoff_requests`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `from_member_id` | uuid | NO |  |
| `to_member_id` | uuid | YES |  |
| `status` | text | NO | 'pending'::text |
| `qualification_data` | jsonb | NO | '{}'::jsonb |
| `handoff_reason` | text | YES |  |
| `notes` | text | YES |  |
| `rejection_reason` | text | YES |  |
| `sla_hours` | integer | NO | 4 |
| `accepted_at` | timestamp with time zone | YES |  |
| `rejected_at` | timestamp with time zone | YES |  |
| `expired_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `health_alert_settings`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `email_notifications` | boolean | YES | true |
| `push_notifications` | boolean | YES | true |
| `critical_threshold` | integer | YES | 30 |
| `warning_threshold` | integer | YES | 50 |
| `check_frequency_hours` | integer | YES | 24 |
| `notify_on_critical` | boolean | YES | true |
| `notify_on_warning` | boolean | YES | false |
| `email_address` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `health_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `alert_type` | text | NO | 'critical'::text |
| `health_score` | integer | NO |  |
| `previous_score` | integer | YES |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `factors` | jsonb | YES |  |
| `dismissed` | boolean | YES | false |
| `notified_via` | ARRAY | YES | '{}'::text[] |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `hidden_objections`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `objection_type` | text | NO |  |
| `indicator` | text | NO |  |
| `probability` | integer | YES | 50 |
| `severity` | text | NO |  |
| `possible_real_objection` | text | YES |  |
| `suggested_probe` | text | YES |  |
| `resolution_templates` | ARRAY | YES |  |
| `resolved` | boolean | YES | false |
| `resolved_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `incoming_webhook_dlq`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `webhook_id` | uuid | NO |  |
| `payload` | jsonb | NO | '{}'::jsonb |
| `source_ip` | text | YES |  |
| `user_agent` | text | YES |  |
| `attempts` | integer | NO | 0 |
| `max_attempts` | integer | NO | 5 |
| `next_retry_at` | timestamp with time zone | NO | now() |
| `last_error` | text | YES |  |
| `status` | text | NO | 'pending'::text |
| `resolved_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `incoming_webhook_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `webhook_id` | uuid | NO |  |
| `status` | text | NO |  |
| `http_status` | integer | YES |  |
| `payload` | jsonb | YES |  |
| `response` | jsonb | YES |  |
| `error_message` | text | YES |  |
| `source_ip` | text | YES |  |
| `user_agent` | text | YES |  |
| `latency_ms` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `incoming_webhooks`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `token` | text | NO |  |
| `target_entity` | text | NO |  |
| `is_active` | boolean | NO | true |
| `allowed_origins` | ARRAY | YES | ARRAY[]::text[] |
| `field_mapping` | jsonb | NO | '{}'::jsonb |
| `total_calls` | bigint | NO | 0 |
| `total_errors` | bigint | NO | 0 |
| `last_called_at` | timestamp with time zone | YES |  |
| `created_by` | uuid | NO |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `webhook_secret` | text | YES |  |
| `require_signature` | boolean | NO | false |
| `replay_window_seconds` | integer | NO | 300 |

## 📋 Tabela: `insights`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `category` | text | NO |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `confidence` | integer | YES | 50 |
| `source` | text | YES |  |
| `actionable` | boolean | YES | false |
| `action_suggestion` | text | YES |  |
| `expires_at` | timestamp with time zone | YES |  |
| `dismissed` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `intent_scores`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `scope` | text | NO |  |
| `scope_id` | text | NO |  |
| `intent_score` | integer | NO | 0 |
| `score_trend` | text | NO | 'stable'::text |
| `signal_count_30d` | integer | NO | 0 |
| `top_signals` | jsonb | NO | '[]'::jsonb |
| `computed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `intent_signals`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `external_company_id` | text | YES |  |
| `signal_type` | text | NO |  |
| `signal_source` | text | YES |  |
| `signal_value` | jsonb | NO | '{}'::jsonb |
| `weight` | integer | NO | 1 |
| `occurred_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `intent_tracking_pixels`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `pixel_key` | text | NO |  |
| `domain` | text | NO |  |
| `label` | text | YES |  |
| `active` | boolean | NO | true |
| `signal_count` | integer | NO | 0 |
| `last_signal_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `interaction_summaries`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `summary` | text | YES |  |
| `key_takeaways` | jsonb | YES | '[]'::jsonb |
| `next_steps` | text | YES |  |
| `negotiation_stage_summary` | text | YES |  |
| `last_interaction_id` | uuid | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `interactions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `company_id` | uuid | YES |  |
| `type` | text | NO |  |
| `title` | text | NO |  |
| `content` | text | YES |  |
| `audio_url` | text | YES |  |
| `transcription` | text | YES |  |
| `sentiment` | text | YES | 'neutral'::text |
| `tags` | ARRAY | YES | '{}'::text[] |
| `duration` | integer | YES |  |
| `attachments` | ARRAY | YES | '{}'::text[] |
| `initiated_by` | text | YES | 'us'::text |
| `response_time` | integer | YES |  |
| `key_insights` | ARRAY | YES | '{}'::text[] |
| `follow_up_required` | boolean | YES | false |
| `follow_up_date` | date | YES |  |
| `emotion_analysis` | jsonb | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `external_id` | text | YES |  |
| `nlp_analysis` | jsonb | YES | '{}'::jsonb |
| `transcription_metadata` | jsonb | YES | '{}'::jsonb |

## 📋 Tabela: `interactions_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `interaction_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `operation` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_by` | uuid | YES | auth.uid() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `ip_whitelist`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `ip_address` | text | NO |  |
| `label` | text | YES |  |
| `is_active` | boolean | YES | true |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `knowledge_base_articles`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `title` | text | NO |  |
| `content` | text | NO |  |
| `category` | text | NO | 'geral'::text |
| `tags` | ARRAY | YES | '{}'::text[] |
| `is_published` | boolean | YES | true |
| `views_count` | integer | YES | 0 |
| `helpful_count` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `landing_page_submissions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `landing_page_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `data` | jsonb | NO | '{}'::jsonb |
| `email` | text | YES |  |
| `name` | text | YES |  |
| `phone` | text | YES |  |
| `utm_source` | text | YES |  |
| `utm_medium` | text | YES |  |
| `utm_campaign` | text | YES |  |
| `ip_address` | text | YES |  |
| `user_agent` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `landing_pages`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `slug` | text | NO |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `blocks` | jsonb | NO | '[]'::jsonb |
| `theme` | jsonb | NO | '{}'::jsonb |
| `is_published` | boolean | NO | false |
| `view_count` | integer | NO | 0 |
| `submission_count` | integer | NO | 0 |
| `redirect_url` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `landing_pages_public`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `slug` | text | YES |  |
| `title` | text | YES |  |
| `description` | text | YES |  |
| `blocks` | jsonb | YES |  |
| `theme` | jsonb | YES |  |
| `redirect_url` | text | YES |  |

## 📋 Tabela: `lead_assignments`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `assigned_to` | uuid | NO |  |
| `assigned_by` | uuid | YES |  |
| `assignment_type` | text | NO | 'auto_round_robin'::text |
| `previous_owner` | uuid | YES |  |
| `status` | text | NO | 'active'::text |
| `routing_rule_id` | uuid | YES |  |
| `sla_deadline` | timestamp with time zone | YES |  |
| `first_contact_at` | timestamp with time zone | YES |  |
| `sla_met` | boolean | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_magnet_downloads`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `magnet_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `email` | text | YES |  |
| `name` | text | YES |  |
| `utm_source` | text | YES |  |
| `utm_medium` | text | YES |  |
| `utm_campaign` | text | YES |  |
| `downloaded_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_magnets`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `title` | text | NO |  |
| `slug` | text | NO |  |
| `description` | text | YES |  |
| `type` | text | NO | 'ebook'::text |
| `file_path` | text | YES |  |
| `external_url` | text | YES |  |
| `thumbnail_url` | text | YES |  |
| `gated` | boolean | NO | true |
| `form_id` | uuid | YES |  |
| `download_count` | integer | NO | 0 |
| `view_count` | integer | NO | 0 |
| `is_published` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_routing_rules`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `rule_type` | text | NO | 'round_robin'::text |
| `priority` | integer | NO | 1 |
| `conditions` | jsonb | NO | '{}'::jsonb |
| `team_pool` | ARRAY | YES | '{}'::uuid[] |
| `role_filter` | text | NO | 'any'::text |
| `is_active` | boolean | NO | true |
| `fallback_rule_id` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_score_config`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `weight_engagement` | numeric | NO | 0.30 |
| `weight_fit` | numeric | NO | 0.20 |
| `weight_intent` | numeric | NO | 0.25 |
| `weight_relationship` | numeric | NO | 0.25 |
| `grade_thresholds` | jsonb | NO | '{"hot": 60, "cold": 0, "warm": 30, "on_fire": 85}'::jsonb |
| `auto_recalculate` | boolean | NO | true |
| `recalculate_interval_hours` | integer | NO | 24 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_score_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `total_score` | numeric | NO |  |
| `grade` | text | NO |  |
| `engagement_score` | numeric | NO | 0 |
| `fit_score` | numeric | NO | 0 |
| `intent_score` | numeric | NO | 0 |
| `relationship_score` | numeric | NO | 0 |
| `recorded_at` | timestamp with time zone | NO | now() |
| `breakdown` | jsonb | NO | '{}'::jsonb |

## 📋 Tabela: `lead_score_recompute_queue`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `reason` | text | NO | 'manual'::text |
| `enqueued_at` | timestamp with time zone | NO | now() |
| `processed_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `lead_score_rules`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `dimension` | text | NO |  |
| `signal_key` | text | NO |  |
| `weight` | numeric | NO | 1 |
| `decay_days` | integer | NO | 30 |
| `active` | boolean | NO | true |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_score_threshold_automations`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `trigger_type` | text | NO |  |
| `grade_target` | text | YES |  |
| `score_target` | integer | YES |  |
| `action_type` | text | NO |  |
| `action_config` | jsonb | NO | '{}'::jsonb |
| `cooldown_hours` | integer | NO | 24 |
| `active` | boolean | NO | true |
| `last_fired_at` | timestamp with time zone | YES |  |
| `fired_count` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_score_threshold_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `automation_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `from_grade` | text | YES |  |
| `to_grade` | text | YES |  |
| `from_score` | numeric | YES |  |
| `to_score` | numeric | YES |  |
| `action_result` | jsonb | NO | '{}'::jsonb |
| `success` | boolean | NO | true |
| `fired_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_score_thresholds`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `grade` | text | NO |  |
| `min_score` | numeric | NO |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lead_scores`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `total_score` | numeric | NO | 0 |
| `grade` | text | NO | 'D'::text |
| `engagement_score` | numeric | NO | 0 |
| `fit_score` | numeric | NO | 0 |
| `intent_score` | numeric | NO | 0 |
| `relationship_score` | numeric | NO | 0 |
| `score_factors` | jsonb | NO | '[]'::jsonb |
| `weight_engagement` | numeric | NO | 0.30 |
| `weight_fit` | numeric | NO | 0.20 |
| `weight_intent` | numeric | NO | 0.25 |
| `weight_relationship` | numeric | NO | 0.25 |
| `last_calculated_at` | timestamp with time zone | NO | now() |
| `score_change` | numeric | YES | 0 |
| `previous_score` | numeric | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `computed_at` | timestamp with time zone | NO | now() |
| `decay_applied_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `life_events`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `event_type` | text | NO |  |
| `event_date` | timestamp with time zone | NO |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `recurring` | boolean | YES | false |
| `reminder_days_before` | integer | YES | 7 |
| `last_reminded_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `metadata` | jsonb | YES | '{}'::jsonb |

## 📋 Tabela: `life_events_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `life_event_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | YES |  |
| `event_type` | text | NO |  |
| `title` | text | NO |  |
| `event_date` | timestamp with time zone | NO |  |
| `recurring` | boolean | YES |  |
| `reminder_days_before` | integer | YES |  |
| `change_type` | text | NO |  |
| `reason` | text | YES |  |
| `changed_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `login_attempts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | YES |  |
| `email` | text | NO |  |
| `ip_address` | text | YES |  |
| `user_agent` | text | YES |  |
| `success` | boolean | YES | false |
| `blocked_reason` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `lux_intelligence`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `entity_type` | text | NO |  |
| `entity_id` | uuid | NO |  |
| `status` | text | NO | 'pending'::text |
| `request_type` | text | NO | 'full_scan'::text |
| `social_profiles` | jsonb | YES | '[]'::jsonb |
| `social_analysis` | jsonb | YES | '{}'::jsonb |
| `fiscal_data` | jsonb | YES | '{}'::jsonb |
| `stakeholders` | jsonb | YES | '[]'::jsonb |
| `audience_analysis` | jsonb | YES | '{}'::jsonb |
| `personal_profile` | jsonb | YES | '{}'::jsonb |
| `ai_report` | text | YES |  |
| `ai_summary` | text | YES |  |
| `fields_updated` | jsonb | YES | '[]'::jsonb |
| `error_message` | text | YES |  |
| `n8n_execution_id` | text | YES |  |
| `started_at` | timestamp with time zone | YES |  |
| `completed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `lux_webhook_config`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `entity_type` | text | NO |  |
| `webhook_url` | text | NO |  |
| `is_active` | boolean | YES | true |
| `timeout_ms` | integer | YES | 60000 |
| `max_retries` | integer | YES | 3 |
| `headers` | jsonb | YES | '{}'::jsonb |
| `last_test_at` | timestamp with time zone | YES |  |
| `last_test_status` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `marketing_campaign_stats`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `campaign_id` | uuid | YES |  |
| `entity_type` | text | NO |  |
| `entity_id` | uuid | NO |  |
| `date` | date | NO | CURRENT_DATE |
| `views` | integer | YES | 0 |
| `clicks` | integer | YES | 0 |
| `submissions` | integer | YES | 0 |
| `conversions` | integer | YES | 0 |
| `spend` | numeric | YES | 0 |
| `revenue` | numeric | YES | 0 |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `marketing_roi_data`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `channel` | text | NO |  |
| `investment` | numeric | NO | 0 |
| `period_start` | date | NO |  |
| `period_end` | date | NO |  |
| `leads_generated` | integer | YES | 0 |
| `customers_acquired` | integer | YES | 0 |
| `revenue_generated` | numeric | YES | 0 |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `mcp_tool_calls`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `connection_id` | uuid | YES |  |
| `tool_name` | text | NO |  |
| `arguments_summary` | jsonb | NO | '{}'::jsonb |
| `status` | text | NO |  |
| `error_message` | text | YES |  |
| `latency_ms` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `meeting_summaries`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `interaction_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `summary` | text | NO |  |
| `key_decisions` | ARRAY | YES | '{}'::text[] |
| `action_items` | jsonb | YES | '[]'::jsonb |
| `participants` | ARRAY | YES | '{}'::text[] |
| `sentiment_overview` | text | YES |  |
| `topics` | ARRAY | YES | '{}'::text[] |
| `next_steps` | ARRAY | YES | '{}'::text[] |
| `duration_minutes` | integer | YES |  |
| `generated_by_model` | text | YES | 'gemini-2.5-flash'::text |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `metaprogram_analysis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `toward_score` | integer | YES | 0 |
| `away_from_score` | integer | YES | 0 |
| `toward_words` | ARRAY | YES | '{}'::text[] |
| `away_from_words` | ARRAY | YES | '{}'::text[] |
| `internal_score` | integer | YES | 0 |
| `external_score` | integer | YES | 0 |
| `internal_words` | ARRAY | YES | '{}'::text[] |
| `external_words` | ARRAY | YES | '{}'::text[] |
| `options_score` | integer | YES | 0 |
| `procedures_score` | integer | YES | 0 |
| `options_words` | ARRAY | YES | '{}'::text[] |
| `procedures_words` | ARRAY | YES | '{}'::text[] |
| `analyzed_text` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `is_validated` | boolean | YES | false |
| `user_feedback` | text | YES |  |

## 📋 Tabela: `mql_classifications`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `criteria_id` | uuid | YES |  |
| `status` | text | NO | 'mql'::text |
| `qualified_at` | timestamp with time zone | NO | now() |
| `handoff_assignment_id` | uuid | YES |  |
| `handoff_to` | uuid | YES |  |
| `handoff_at` | timestamp with time zone | YES |  |
| `score_snapshot` | integer | YES |  |
| `reason` | text | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `mql_criteria`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `conditions` | jsonb | NO | '[]'::jsonb |
| `is_active` | boolean | NO | true |
| `auto_handoff` | boolean | NO | false |
| `handoff_to_role` | text | NO | 'sdr'::text |
| `priority` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `neuro_behavioral_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `dominance_data` | jsonb | YES |  |
| `neuromarketing_data` | jsonb | YES |  |
| `empathy_score` | numeric | YES |  |
| `recommendations` | ARRAY | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `empathy_trend` | jsonb | YES | '[]'::jsonb |
| `language_complexity_score` | double precision | YES | 0.0 |
| `response_synchronicity` | double precision | YES | 0.0 |

## 📋 Tabela: `neuro_pnl_sessions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `conversation_id` | text | YES |  |
| `session_date` | timestamp with time zone | YES | now() |
| `technique_used` | text | YES |  |
| `results_summary` | text | YES |  |
| `emotional_state_before` | text | YES |  |
| `emotional_state_after` | text | YES |  |
| `anchors_installed` | jsonb | YES | '[]'::jsonb |
| `next_steps` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `nlp_feedback`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `interaction_id` | uuid | YES |  |
| `analysis_type` | text | NO |  |
| `original_detection` | jsonb | YES |  |
| `adjusted_value` | jsonb | YES |  |
| `is_correct` | boolean | YES |  |
| `feedback_notes` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `notification_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `reminder_id` | text | NO |  |
| `contact_id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `channel` | text | NO |  |
| `sent_at` | timestamp with time zone | NO | timezone('utc'::text, now()) |

## 📋 Tabela: `notification_preferences`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `user_id` | uuid | NO |  |
| `quiet_hours_start` | smallint | NO | 22 |
| `quiet_hours_end` | smallint | NO | 8 |
| `weekend_silence` | boolean | NO | false |
| `enabled_channels` | ARRAY | NO | ARRAY['in_app'::text] |
| `min_urgency_email` | text | NO | 'high'::text |
| `min_urgency_push` | text | NO | 'critical'::text |
| `digest_mode` | text | NO | 'immediate'::text |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `nurturing_enrollments`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `workflow_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `current_step` | integer | YES | 0 |
| `status` | text | YES | 'active'::text |
| `enrolled_at` | timestamp with time zone | NO | now() |
| `completed_at` | timestamp with time zone | YES |  |
| `next_action_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `nurturing_executions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `workflow_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `current_step` | integer | NO | 0 |
| `status` | text | NO | 'active'::text |
| `next_action_at` | timestamp with time zone | YES |  |
| `last_action_at` | timestamp with time zone | YES |  |
| `started_at` | timestamp with time zone | NO | now() |
| `completed_at` | timestamp with time zone | YES |  |
| `error_message` | text | YES |  |
| `context` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `nurturing_workflows`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `trigger_type` | text | YES | 'manual'::text |
| `trigger_config` | jsonb | YES | '{}'::jsonb |
| `is_active` | boolean | YES | false |
| `steps` | jsonb | YES | '[]'::jsonb |
| `enrolled_count` | integer | YES | 0 |
| `completed_count` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `objection_example_feedback`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | auth.uid() |
| `objection` | text | NO |  |
| `category` | text | YES |  |
| `interaction_id` | uuid | YES |  |
| `is_useful` | boolean | NO | true |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `offer_suggestions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `offer_name` | text | NO |  |
| `offer_category` | text | YES |  |
| `reason` | text | NO |  |
| `confidence_score` | integer | YES | 50 |
| `status` | text | YES | 'pending'::text |
| `presented_at` | timestamp with time zone | YES |  |
| `result` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `expires_at` | timestamp with time zone | YES |  |
| `metadata` | jsonb | YES | '{}'::jsonb |

## 📋 Tabela: `password_reset_requests`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `email` | text | NO |  |
| `status` | text | NO | 'pending'::text |
| `approved_by` | uuid | YES |  |
| `reason` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `resolved_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `people_intelligence_events`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `event_type` | text | NO |  |
| `old_value` | text | YES |  |
| `new_value` | text | YES |  |
| `field_name` | text | YES |  |
| `source` | text | NO | 'system_trigger'::text |
| `confidence` | integer | NO | 100 |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `detected_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `permissions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `module` | text | NO |  |
| `action` | text | NO |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `phone_validations`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `phone_input` | text | NO |  |
| `phone_e164` | text | YES |  |
| `status` | text | NO | 'unknown'::text |
| `line_type` | text | YES |  |
| `country` | text | YES |  |
| `country_code` | text | YES |  |
| `carrier` | text | YES |  |
| `is_active` | boolean | YES |  |
| `reasons` | ARRAY | NO | ARRAY[]::text[] |
| `provider` | text | NO | 'libphonenumber'::text |
| `raw` | jsonb | NO | '{}'::jsonb |
| `validated_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `pipeline_stage_transitions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `from_stage` | text | NO |  |
| `to_stage` | text | NO |  |
| `allowed` | boolean | YES | true |
| `description` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `pipeline_stages`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `pipeline_id` | uuid | NO |  |
| `name` | text | NO |  |
| `probability` | integer | YES | 10 |
| `order_index` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `pipelines`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `is_default` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `playbook_usage_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `playbook_id` | uuid | YES |  |
| `battle_card_id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `deal_id` | text | YES |  |
| `action` | text | NO |  |
| `context` | jsonb | YES | '{}'::jsonb |
| `opened_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `profiles`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO |  |
| `first_name` | text | YES |  |
| `last_name` | text | YES |  |
| `avatar_url` | text | YES |  |
| `role_title` | text | YES |  |
| `company_name` | text | YES |  |
| `phone` | text | YES |  |
| `preferences` | jsonb | YES | '{"theme": "light", "language": "pt-BR", "notifications": true}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `nlp_profile` | jsonb | YES | '{"vakProfile": null, "discProfile": null, "metaprograms": {"chunkSize": null, "actionFilter": null, "workingStyle": null, "referenceFrame": null, "comparisonStyle": null, "motivationDirection": null}}'::jsonb |

## 📋 Tabela: `proximo_passo_feedback`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | text | NO |  |
| `passo_id` | text | NO |  |
| `outcome` | USER-DEFINED | NO |  |
| `channel_used` | text | YES |  |
| `notes` | text | YES |  |
| `executed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `psychographic_audit_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `changed_by` | uuid | YES |  |
| `change_type` | text | NO |  |
| `previous_values` | jsonb | YES |  |
| `new_values` | jsonb | YES |  |
| `changed_fields` | ARRAY | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `purchase_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `product_name` | text | NO |  |
| `product_category` | text | YES |  |
| `amount` | numeric | YES |  |
| `purchase_date` | timestamp with time zone | NO | now() |
| `renewal_date` | timestamp with time zone | YES |  |
| `cycle_months` | integer | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `push_subscriptions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `endpoint` | text | NO |  |
| `p256dh` | text | NO |  |
| `auth` | text | NO |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `push_subscriptions_safe`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `endpoint` | text | YES |  |
| `created_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `query_telemetry`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `operation` | text | NO |  |
| `table_name` | text | YES |  |
| `rpc_name` | text | YES |  |
| `duration_ms` | integer | NO | 0 |
| `record_count` | integer | YES |  |
| `query_limit` | integer | YES |  |
| `query_offset` | integer | YES |  |
| `count_mode` | text | YES |  |
| `severity` | text | NO | 'normal'::text |
| `error_message` | text | YES |  |
| `user_id` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `redistribution_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `from_member_id` | uuid | YES |  |
| `to_member_id` | uuid | YES |  |
| `reason` | text | NO | 'inactivity'::text |
| `auto_triggered` | boolean | NO | false |
| `inactivity_days` | integer | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `reframing_analysis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `objection` | text | NO |  |
| `objection_category` | text | YES |  |
| `pattern_used` | text | NO |  |
| `suggested_response` | text | NO |  |
| `confidence_score` | integer | YES | 0 |
| `status` | text | YES | 'pending'::text |
| `created_at` | timestamp with time zone | YES | now() |
| `feedback` | text | YES |  |
| `validation_feedback` | jsonb | YES | '{}'::jsonb |

## 📋 Tabela: `reframing_analysis_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `analysis_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `operation` | text | NO |  |
| `old_data` | jsonb | YES |  |
| `new_data` | jsonb | YES |  |
| `changed_by` | uuid | YES | auth.uid() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `revops_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `metric_key` | text | NO |  |
| `severity` | text | NO |  |
| `message` | text | NO |  |
| `current_value` | numeric | YES |  |
| `expected_value` | numeric | YES |  |
| `period` | date | YES |  |
| `dismissed` | boolean | NO | false |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `revops_benchmarks`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `metric_key` | text | NO |  |
| `target_value` | numeric | NO |  |
| `warning_threshold` | numeric | NO | 90 |
| `critical_threshold` | numeric | NO | 75 |
| `description` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `revops_snapshots`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `period` | date | NO |  |
| `funnel_stage` | text | NO |  |
| `count` | integer | NO | 0 |
| `conversion_rate` | numeric | YES |  |
| `avg_velocity_days` | numeric | YES |  |
| `total_value` | numeric | YES | 0 |
| `captured_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `rfm_analysis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `recency_score` | integer | NO |  |
| `frequency_score` | integer | NO |  |
| `monetary_score` | integer | NO |  |
| `rfm_score` | integer | YES |  |
| `total_score` | integer | YES |  |
| `days_since_last_purchase` | integer | YES |  |
| `days_since_last_interaction` | integer | YES |  |
| `total_purchases` | integer | YES | 0 |
| `total_interactions` | integer | YES | 0 |
| `total_monetary_value` | numeric | YES | 0 |
| `average_order_value` | numeric | YES | 0 |
| `segment` | text | NO |  |
| `segment_description` | text | YES |  |
| `segment_color` | text | YES |  |
| `recency_trend` | text | YES |  |
| `frequency_trend` | text | YES |  |
| `monetary_trend` | text | YES |  |
| `overall_trend` | text | YES |  |
| `predicted_next_purchase_date` | date | YES |  |
| `predicted_lifetime_value` | numeric | YES |  |
| `churn_probability` | numeric | YES |  |
| `recommended_actions` | jsonb | YES | '[]'::jsonb |
| `recommended_offers` | jsonb | YES | '[]'::jsonb |
| `communication_priority` | text | YES |  |
| `analyzed_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `rfm_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `recency_score` | integer | NO |  |
| `frequency_score` | integer | NO |  |
| `monetary_score` | integer | NO |  |
| `segment` | text | NO |  |
| `total_monetary_value` | numeric | YES |  |
| `recorded_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `rfm_metrics`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `period_start` | date | NO |  |
| `period_end` | date | NO |  |
| `period_type` | text | NO |  |
| `champions_count` | integer | YES | 0 |
| `loyal_count` | integer | YES | 0 |
| `potential_loyalist_count` | integer | YES | 0 |
| `recent_customers_count` | integer | YES | 0 |
| `promising_count` | integer | YES | 0 |
| `needing_attention_count` | integer | YES | 0 |
| `about_to_sleep_count` | integer | YES | 0 |
| `at_risk_count` | integer | YES | 0 |
| `cant_lose_count` | integer | YES | 0 |
| `hibernating_count` | integer | YES | 0 |
| `lost_count` | integer | YES | 0 |
| `total_contacts_analyzed` | integer | YES | 0 |
| `average_rfm_score` | numeric | YES |  |
| `average_monetary_value` | numeric | YES |  |
| `total_revenue` | numeric | YES |  |
| `segment_transitions` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `rfm_segment_config`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `segment_name` | text | NO |  |
| `segment_key` | text | NO |  |
| `description` | text | YES |  |
| `color` | text | YES |  |
| `icon` | text | YES |  |
| `recency_min` | integer | NO | 1 |
| `recency_max` | integer | NO | 5 |
| `frequency_min` | integer | NO | 1 |
| `frequency_max` | integer | NO | 5 |
| `monetary_min` | integer | NO | 1 |
| `monetary_max` | integer | NO | 5 |
| `recommended_actions` | jsonb | YES | '[]'::jsonb |
| `email_template` | text | YES |  |
| `priority` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `role_permissions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `role` | USER-DEFINED | NO |  |
| `permission_id` | uuid | NO |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `sales_playbooks`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `scenario` | text | NO |  |
| `stage_target` | text | YES |  |
| `industry_target` | text | YES |  |
| `persona_target` | text | YES |  |
| `content` | jsonb | NO | '{"sections": []}'::jsonb |
| `tags` | ARRAY | NO | ARRAY[]::text[] |
| `active` | boolean | NO | true |
| `usage_count` | integer | NO | 0 |
| `version` | integer | NO | 1 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sales_team_members`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `profile_user_id` | uuid | YES |  |
| `name` | text | NO |  |
| `email` | text | YES |  |
| `role` | text | NO | 'sdr'::text |
| `is_active` | boolean | NO | true |
| `weight` | integer | NO | 5 |
| `max_leads_day` | integer | NO | 10 |
| `max_leads_total` | integer | NO | 50 |
| `current_lead_count` | integer | NO | 0 |
| `leads_today` | integer | NO | 0 |
| `leads_today_reset_at` | date | YES | CURRENT_DATE |
| `last_assigned_at` | timestamp with time zone | YES |  |
| `territories` | ARRAY | YES | '{}'::text[] |
| `specializations` | ARRAY | YES | '{}'::text[] |
| `vacation_start` | date | YES |  |
| `vacation_end` | date | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `manager_id` | uuid | YES |  |

## 📋 Tabela: `schema_drift_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `error_type` | text | NO |  |
| `entity_type` | text | NO |  |
| `entity_name` | text | NO |  |
| `error_message` | text | YES |  |
| `stack_trace` | text | YES |  |
| `user_id` | uuid | YES |  |
| `resolved` | boolean | YES | false |
| `resolved_at` | timestamp with time zone | YES |  |
| `resolved_by` | uuid | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `score_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `score_type` | text | NO |  |
| `score_value` | numeric | NO |  |
| `previous_value` | numeric | YES |  |
| `factors` | jsonb | YES |  |
| `metadata` | jsonb | YES |  |
| `calculated_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `search_products_cache`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `external_id` | text | YES |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `category` | text | YES |  |
| `tags` | ARRAY | YES |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `image_url` | text | YES |  |
| `price` | numeric | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `secret_rotation_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `secret_name` | text | NO |  |
| `rotated_at` | timestamp with time zone | NO | now() |
| `rotated_by` | uuid | YES |  |
| `old_hash` | text | YES |  |
| `new_hash` | text | YES |  |
| `reason` | text | YES |  |
| `is_automatic` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `semantic_search_cache`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `query_hash` | text | NO |  |
| `query_text` | text | NO |  |
| `results` | jsonb | NO | '[]'::jsonb |
| `expires_at` | timestamp with time zone | NO |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sentiment_annotations`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `created_by` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `week_start` | date | NO |  |
| `category` | text | NO |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sequence_enrollments`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `sequence_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `status` | text | NO | 'active'::text |
| `current_step` | integer | NO | 1 |
| `next_action_at` | timestamp with time zone | YES |  |
| `enrolled_at` | timestamp with time zone | NO | now() |
| `completed_at` | timestamp with time zone | YES |  |
| `replied_at` | timestamp with time zone | YES |  |
| `last_step_executed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `last_step_sent_at` | timestamp with time zone | YES |  |
| `last_event_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `sequence_events`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `enrollment_id` | uuid | NO |  |
| `sequence_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `step_order` | integer | YES |  |
| `event_type` | text | NO |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sequence_send_log`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `enrollment_id` | uuid | NO |  |
| `step_id` | uuid | NO |  |
| `sequence_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `step_order` | integer | NO |  |
| `channel` | text | NO |  |
| `message_id` | text | YES |  |
| `tracking_token` | text | YES | encode(extensions.gen_random_bytes(16), 'hex'::text) |
| `status` | text | NO | 'sent'::text |
| `error_message` | text | YES |  |
| `opened_at` | timestamp with time zone | YES |  |
| `clicked_at` | timestamp with time zone | YES |  |
| `sent_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sequence_steps`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `sequence_id` | uuid | NO |  |
| `step_order` | integer | NO | 1 |
| `channel` | text | NO |  |
| `delay_days` | integer | NO | 1 |
| `delay_hours` | integer | NO | 0 |
| `subject` | text | YES |  |
| `message_template` | text | YES |  |
| `notes` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |
| `condition_type` | text | NO | 'always'::text |
| `condition_wait_hours` | integer | NO | 0 |
| `branch_on_yes_step` | integer | YES |  |
| `branch_on_no_step` | integer | YES |  |

## 📋 Tabela: `sequences`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `description` | text | YES |  |
| `status` | text | NO | 'draft'::text |
| `pause_on_reply` | boolean | NO | true |
| `pause_on_meeting` | boolean | NO | false |
| `max_enrollments` | integer | YES | 100 |
| `total_enrolled` | integer | NO | 0 |
| `total_completed` | integer | NO | 0 |
| `total_replied` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `slow_queries_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `query` | text | YES |  |
| `calls` | bigint | YES |  |
| `total_exec_seconds` | double precision | YES |  |
| `mean_exec_ms` | double precision | YES |  |
| `rows` | bigint | YES |  |

## 📋 Tabela: `smart_notifications`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `event_type` | text | NO |  |
| `entity_type` | text | YES |  |
| `entity_id` | text | YES |  |
| `title` | text | NO |  |
| `body` | text | YES |  |
| `payload` | jsonb | NO | '{}'::jsonb |
| `urgency` | text | NO | 'normal'::text |
| `decided_channel` | text | NO | 'in_app'::text |
| `decision_reason` | text | YES |  |
| `bundle_key` | text | YES |  |
| `bundle_count` | integer | NO | 1 |
| `status` | text | NO | 'pending'::text |
| `scheduled_for` | timestamp with time zone | NO | now() |
| `delivered_at` | timestamp with time zone | YES |  |
| `dismissed_at` | timestamp with time zone | YES |  |
| `clicked_at` | timestamp with time zone | YES |  |
| `snoozed_until` | timestamp with time zone | YES |  |
| `action_url` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sms_campaign_recipients`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `campaign_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `phone` | text | NO |  |
| `status` | text | NO | 'pending'::text |
| `provider_message_id` | text | YES |  |
| `error_message` | text | YES |  |
| `sent_at` | timestamp with time zone | YES |  |
| `delivered_at` | timestamp with time zone | YES |  |
| `failed_at` | timestamp with time zone | YES |  |
| `replied_at` | timestamp with time zone | YES |  |
| `cost_cents` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sms_campaigns`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `message` | text | NO |  |
| `sender_id` | text | YES |  |
| `status` | text | NO | 'draft'::text |
| `scheduled_at` | timestamp with time zone | YES |  |
| `sent_at` | timestamp with time zone | YES |  |
| `total_recipients` | integer | NO | 0 |
| `total_sent` | integer | NO | 0 |
| `total_delivered` | integer | NO | 0 |
| `total_failed` | integer | NO | 0 |
| `total_replies` | integer | NO | 0 |
| `total_opt_outs` | integer | NO | 0 |
| `cost_estimate_cents` | integer | NO | 0 |
| `segment_filter` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sms_opt_outs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `phone` | text | NO |  |
| `contact_id` | uuid | YES |  |
| `reason` | text | YES |  |
| `opted_out_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `sms_templates`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `body` | text | NO |  |
| `category` | text | YES |  |
| `variables` | jsonb | NO | '[]'::jsonb |
| `usage_count` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `social_behavior_analysis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `analysis_date` | timestamp with time zone | NO | now() |
| `personality_traits` | jsonb | YES |  |
| `communication_style` | jsonb | YES |  |
| `interests` | ARRAY | YES |  |
| `topics` | ARRAY | YES |  |
| `overall_sentiment` | text | YES |  |
| `sentiment_score` | numeric | YES |  |
| `active_hours` | jsonb | YES |  |
| `active_days` | ARRAY | YES |  |
| `influence_level` | text | YES |  |
| `influence_score` | numeric | YES |  |
| `keywords` | ARRAY | YES |  |
| `hashtags` | ARRAY | YES |  |
| `valuable_connections` | jsonb | YES |  |
| `sales_insights` | jsonb | YES |  |
| `executive_summary` | text | YES |  |
| `confidence` | numeric | YES | 0.7 |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `social_consent_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `network` | text | NO |  |
| `source_url` | text | YES |  |
| `consent_type` | text | YES | 'public_data_osint'::text |
| `ip_address` | text | YES |  |
| `user_agent` | text | YES |  |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `social_life_events`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `platform` | text | NO |  |
| `event_type` | text | NO |  |
| `event_title` | text | NO |  |
| `event_description` | text | YES |  |
| `event_date` | timestamp with time zone | YES |  |
| `previous_value` | text | YES |  |
| `new_value` | text | YES |  |
| `confidence` | numeric | YES | 0.8 |
| `metadata` | jsonb | YES |  |
| `notified` | boolean | YES | false |
| `dismissed` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `social_profiles`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `platform` | text | NO |  |
| `profile_url` | text | YES |  |
| `profile_data` | jsonb | YES |  |
| `headline` | text | YES |  |
| `current_company` | text | YES |  |
| `current_position` | text | YES |  |
| `location` | text | YES |  |
| `connections_count` | integer | YES |  |
| `followers_count` | integer | YES |  |
| `following_count` | integer | YES |  |
| `profile_image_url` | text | YES |  |
| `cover_image_url` | text | YES |  |
| `skills` | ARRAY | YES |  |
| `certifications` | ARRAY | YES |  |
| `education` | jsonb | YES |  |
| `experience` | jsonb | YES |  |
| `recent_posts` | jsonb | YES |  |
| `engagement_metrics` | jsonb | YES |  |
| `last_scraped_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `social_scraping_schedule`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `platform` | text | NO |  |
| `profile_url` | text | NO |  |
| `frequency_days` | integer | YES | 7 |
| `priority` | text | YES | 'normal'::text |
| `enabled` | boolean | YES | true |
| `last_run_at` | timestamp with time zone | YES |  |
| `next_run_at` | timestamp with time zone | YES |  |
| `consecutive_failures` | integer | YES | 0 |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `social_sync_queue`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `status` | text | NO | 'pending'::text |
| `retry_count` | integer | YES | 0 |
| `max_retries` | integer | YES | 3 |
| `error_log` | text | YES |  |
| `last_attempt` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `updated_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `stakeholder_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `alert_type` | text | NO |  |
| `severity` | text | NO | 'medium'::text |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `previous_value` | jsonb | YES |  |
| `current_value` | jsonb | YES |  |
| `recommended_action` | text | YES |  |
| `dismissed` | boolean | YES | false |
| `dismissed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `suggested_life_events`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `event_type` | text | NO |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `event_date` | timestamp with time zone | YES |  |
| `source_type` | text | NO |  |
| `confidence` | double precision | YES | 0.0 |
| `status` | text | NO | 'pending'::text |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `suggested_rapport_intel`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `type` | text | NO |  |
| `value` | text | NO |  |
| `source` | text | NO |  |
| `status` | text | NO | 'pending'::text |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `support_tickets`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `title` | text | NO |  |
| `description` | text | YES |  |
| `priority` | text | NO | 'medium'::text |
| `status` | text | NO | 'open'::text |
| `category` | text | YES | 'general'::text |
| `assigned_to` | uuid | YES |  |
| `sla_deadline` | timestamp with time zone | YES |  |
| `resolved_at` | timestamp with time zone | YES |  |
| `first_response_at` | timestamp with time zone | YES |  |
| `tags` | ARRAY | YES | '{}'::text[] |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `system_alerts`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `alert_type` | text | NO |  |
| `severity` | text | NO |  |
| `threshold_pct` | numeric | NO |  |
| `consumed_pct` | numeric | NO |  |
| `message` | text | NO |  |
| `metadata` | jsonb | NO | '{}'::jsonb |
| `acknowledged_at` | timestamp with time zone | YES |  |
| `acknowledged_by` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `system_health_snapshots`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `timestamp` | timestamp with time zone | NO | now() |
| `status` | text | NO |  |
| `total_latency_ms` | integer | YES |  |
| `components` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `ticket_comments`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `ticket_id` | uuid | NO |  |
| `user_id` | uuid | NO |  |
| `content` | text | NO |  |
| `is_internal` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `trigger_ab_tests`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `name` | text | NO |  |
| `disc_profile` | text | YES |  |
| `variant_a_trigger` | text | NO |  |
| `variant_a_template` | text | YES |  |
| `variant_a_uses` | integer | YES | 0 |
| `variant_a_conversions` | integer | YES | 0 |
| `variant_a_avg_rating` | numeric | YES | 0 |
| `variant_b_trigger` | text | NO |  |
| `variant_b_template` | text | YES |  |
| `variant_b_uses` | integer | YES | 0 |
| `variant_b_conversions` | integer | YES | 0 |
| `variant_b_avg_rating` | numeric | YES | 0 |
| `winner` | text | YES |  |
| `confidence` | numeric | YES | 0 |
| `is_active` | boolean | YES | true |
| `started_at` | timestamp with time zone | NO | now() |
| `completed_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `trigger_bundles`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `name` | text | NO |  |
| `scenario` | text | NO |  |
| `disc_profiles` | ARRAY | YES | '{}'::text[] |
| `vak_profiles` | ARRAY | YES | '{}'::text[] |
| `metaprograms` | ARRAY | YES | '{}'::text[] |
| `triggers` | ARRAY | NO |  |
| `sequence_timing` | jsonb | YES | '[]'::jsonb |
| `neural_path` | jsonb | YES | '{}'::jsonb |
| `success_rate` | numeric | YES | 0 |
| `total_uses` | integer | YES | 0 |
| `is_system_bundle` | boolean | YES | false |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `trigger_channel_effectiveness`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `trigger_type` | text | NO |  |
| `channel` | text | NO |  |
| `uses` | integer | YES | 0 |
| `successes` | integer | YES | 0 |
| `effectiveness_score` | numeric | YES | 0 |
| `last_used_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `trigger_intensity_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `trigger_type` | text | NO |  |
| `intensity_level` | integer | NO |  |
| `result` | text | YES |  |
| `notes` | text | YES |  |
| `interaction_id` | uuid | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `trigger_usage_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `trigger_type` | text | NO |  |
| `template_id` | text | YES |  |
| `template_title` | text | YES |  |
| `scenario` | text | YES |  |
| `channel` | text | YES |  |
| `context` | text | YES |  |
| `result` | text | YES |  |
| `notes` | text | YES |  |
| `effectiveness_rating` | integer | YES |  |
| `used_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `user_known_devices`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `device_fingerprint` | text | NO |  |
| `device_name` | text | YES |  |
| `browser` | text | YES |  |
| `os` | text | YES |  |
| `is_trusted` | boolean | YES | false |
| `last_used_at` | timestamp with time zone | YES | now() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `user_roles`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `role` | USER-DEFINED | NO |  |

## 📋 Tabela: `user_ui_preferences`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `scope` | text | NO |  |
| `preferences` | jsonb | NO | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `v_contact_behavior_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `analysis_type` | text | YES |  |
| `timestamp` | timestamp with time zone | YES |  |
| `analyzed_text` | text | YES |  |
| `is_validated` | boolean | YES |  |
| `user_feedback` | text | YES |  |

## 📋 Tabela: `v_contact_personality_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `timestamp` | timestamp with time zone | YES |  |
| `user_email` | character varying | YES |  |
| `change_source` | text | YES |  |
| `field_name` | text | YES |  |
| `old_value` | text | YES |  |
| `new_value` | text | YES |  |
| `reason` | text | YES |  |

## 📋 Tabela: `v_contact_relatives_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `relative_id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `change_type` | text | YES |  |
| `changed_at` | timestamp with time zone | YES |  |
| `relative_name` | text | YES |  |
| `relationship_type` | text | YES |  |
| `user_name` | text | YES |  |

## 📋 Tabela: `v_life_events_audit`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | YES |  |
| `life_event_id` | uuid | YES |  |
| `contact_id` | uuid | YES |  |
| `user_id` | uuid | YES |  |
| `user_name` | text | YES |  |
| `event_type` | text | YES |  |
| `title` | text | YES |  |
| `event_date` | timestamp with time zone | YES |  |
| `recurring` | boolean | YES |  |
| `reminder_days_before` | integer | YES |  |
| `change_type` | text | YES |  |
| `reason` | text | YES |  |
| `changed_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `vak_analysis_history`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | NO |  |
| `interaction_id` | uuid | YES |  |
| `visual_score` | numeric | YES | 0 |
| `auditory_score` | numeric | YES | 0 |
| `kinesthetic_score` | numeric | YES | 0 |
| `digital_score` | numeric | YES | 0 |
| `visual_words` | ARRAY | YES | '{}'::text[] |
| `auditory_words` | ARRAY | YES | '{}'::text[] |
| `kinesthetic_words` | ARRAY | YES | '{}'::text[] |
| `digital_words` | ARRAY | YES | '{}'::text[] |
| `analyzed_text` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `is_validated` | boolean | YES | false |
| `user_feedback` | text | YES |  |

## 📋 Tabela: `validation_queue`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `kind` | USER-DEFINED | NO |  |
| `value` | text | NO |  |
| `status` | USER-DEFINED | NO | 'pending'::validation_queue_status |
| `attempts` | integer | NO | 0 |
| `last_error` | text | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `processed_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `visit_checkins`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `company_id` | uuid | YES |  |
| `latitude` | double precision | NO |  |
| `longitude` | double precision | NO |  |
| `address` | text | YES |  |
| `notes` | text | YES |  |
| `photo_url` | text | YES |  |
| `visit_type` | text | YES | 'presencial'::text |
| `check_in_at` | timestamp with time zone | NO | now() |
| `check_out_at` | timestamp with time zone | YES |  |
| `duration_minutes` | integer | YES |  |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `vw_contacts_nlp`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `contact_id` | uuid | YES |  |
| `full_name` | text | YES |  |
| `visual_score` | numeric | YES |  |
| `auditory_score` | numeric | YES |  |
| `kinesthetic_score` | numeric | YES |  |
| `digital_score` | numeric | YES |  |
| `vak_dominant` | text | YES |  |
| `motivation_direction` | text | YES |  |
| `reference_frame` | text | YES |  |
| `working_style` | text | YES |  |

## 📋 Tabela: `webauthn_credentials`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `credential_id` | text | NO |  |
| `public_key` | text | NO |  |
| `label` | text | YES | 'Passkey'::text |
| `sign_count` | integer | YES | 0 |
| `transports` | ARRAY | YES |  |
| `created_at` | timestamp with time zone | YES | now() |
| `last_used_at` | timestamp with time zone | YES |  |

## 📋 Tabela: `weekly_report_settings`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `enabled` | boolean | YES | true |
| `send_day` | text | YES | 'monday'::text |
| `send_time` | text | YES | '09:00'::text |
| `email_address` | text | YES |  |
| `include_portfolio_summary` | boolean | YES | true |
| `include_at_risk_clients` | boolean | YES | true |
| `include_health_alerts` | boolean | YES | true |
| `include_upcoming_dates` | boolean | YES | true |
| `include_recommendations` | boolean | YES | true |
| `include_performance_metrics` | boolean | YES | true |
| `last_sent_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `weekly_reports`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `report_data` | jsonb | NO |  |
| `sent_via` | ARRAY | YES | '{}'::text[] |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `whatsapp_ingestion_logs`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `message_id` | text | YES |  |
| `event_type` | text | NO |  |
| `status` | text | NO |  |
| `details` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `whatsapp_instances`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `instance_name` | text | NO |  |
| `display_name` | text | YES |  |
| `phone_number` | text | YES |  |
| `status` | text | YES | 'disconnected'::text |
| `profile_pic_url` | text | YES |  |
| `webhook_url` | text | YES |  |
| `auto_read_messages` | boolean | YES | false |
| `auto_reply_enabled` | boolean | YES | false |
| `auto_reply_message` | text | YES |  |
| `settings` | jsonb | YES | '{}'::jsonb |
| `last_connected_at` | timestamp with time zone | YES |  |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `whatsapp_kpis`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `instance_name` | text | NO |  |
| `period_start` | timestamp with time zone | NO |  |
| `period_end` | timestamp with time zone | NO |  |
| `messages_sent` | integer | YES | 0 |
| `messages_received` | integer | YES | 0 |
| `messages_delivered` | integer | YES | 0 |
| `messages_read` | integer | YES | 0 |
| `avg_response_time_seconds` | integer | YES |  |
| `delivery_rate` | numeric | YES |  |
| `read_rate` | numeric | YES |  |
| `unique_contacts` | integer | YES | 0 |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `whatsapp_messages`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `contact_id` | uuid | YES |  |
| `instance_name` | text | NO |  |
| `remote_jid` | text | NO |  |
| `message_id` | text | YES |  |
| `from_me` | boolean | NO | false |
| `message_type` | text | NO | 'text'::text |
| `content` | text | YES |  |
| `media_url` | text | YES |  |
| `media_mimetype` | text | YES |  |
| `status` | text | YES | 'pending'::text |
| `sender_name` | text | YES |  |
| `quoted_message_id` | text | YES |  |
| `timestamp` | timestamp with time zone | NO | now() |
| `delivered_at` | timestamp with time zone | YES |  |
| `read_at` | timestamp with time zone | YES |  |
| `played_at` | timestamp with time zone | YES |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `whatsapp_messages_index`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `contact_id` | uuid | YES |  |
| `message_sid` | text | YES |  |
| `content` | text | YES |  |
| `message_type` | text | YES |  |
| `transcription` | text | YES |  |
| `sentiment` | text | YES |  |
| `intent` | text | YES |  |
| `neuro_tags` | jsonb | YES | '[]'::jsonb |
| `received_at` | timestamp with time zone | YES | now() |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `whatsapp_transcriptions`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `whatsapp_message_id` | uuid | NO |  |
| `content` | text | NO |  |
| `provider` | text | YES | 'openai'::text |
| `confidence` | double precision | YES |  |
| `metadata` | jsonb | YES | '{}'::jsonb |
| `created_at` | timestamp with time zone | YES | now() |

## 📋 Tabela: `win_loss_insights`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `period_start` | timestamp with time zone | NO |  |
| `period_end` | timestamp with time zone | NO |  |
| `insight_type` | text | NO |  |
| `title` | text | NO |  |
| `description` | text | NO |  |
| `severity` | text | NO | 'info'::text |
| `supporting_data` | jsonb | YES | '{}'::jsonb |
| `generated_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `win_loss_reasons`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `category` | text | NO |  |
| `label` | text | NO |  |
| `outcome_type` | text | NO | 'both'::text |
| `active` | boolean | NO | true |
| `sort_order` | integer | NO | 0 |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

## 📋 Tabela: `win_loss_records`

| Coluna | Tipo | Null | Padrão |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO |  |
| `deal_id` | text | NO |  |
| `outcome` | text | NO |  |
| `primary_reason_id` | uuid | YES |  |
| `secondary_reasons` | ARRAY | YES | ARRAY[]::text[] |
| `competitor_id` | uuid | YES |  |
| `deal_value` | numeric | YES |  |
| `sales_cycle_days` | integer | YES |  |
| `decision_maker_contact_id` | uuid | YES |  |
| `notes` | text | YES |  |
| `lessons_learned` | text | YES |  |
| `recorded_at` | timestamp with time zone | NO | now() |
| `created_at` | timestamp with time zone | NO | now() |
| `updated_at` | timestamp with time zone | NO | now() |

