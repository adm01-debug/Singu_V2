# SINGU CRM — Dicionário de Dados

> Mapeamento entre entidades de negócio e entidades técnicas.

---

## 🏢 Domínio: Gestão de Contatos

| Conceito de Negócio | Tabela | Campos-chave | Origem |
|---------------------|--------|-------------|--------|
| **Contato** (pessoa física) | `contacts` | first_name, last_name, email, phone, company_id | Local + Externo |
| **Empresa** (pessoa jurídica) | `companies` | name, cnpj, industry, is_customer | Local + Externo |
| **Interação** (reunião, call, email) | `interactions` | title, type, content, contact_id, sentiment | Local |
| **Familiar** do contato | `contact_relatives` | name, relationship_type, birthday | Local |
| **Preferência de comunicação** | `communication_preferences` | preferred_channel, preferred_days, preferred_time | Local |
| **Cadência de contato** | `contact_cadence` | cadence_days, next_contact_due, priority | Local |
| **Preferências pessoais** | `contact_preferences` | preferred_channel, preferred_times, restrictions | Local |
| **Evento de vida** | `life_events` | title, event_type, event_date, recurring | Local |

---

## 🧠 Domínio: Inteligência Comportamental

| Conceito de Negócio | Tabela | Campos-chave | Origem |
|---------------------|--------|-------------|--------|
| **Perfil DISC** | `disc_analysis_history` | primary_profile, dominance/influence/steadiness/conscientiousness_score | Local |
| **Log de comunicação DISC** | `disc_communication_logs` | contact_disc_profile, approach_adapted, effectiveness_rating | Local |
| **Métricas de conversão por DISC** | `disc_conversion_metrics` | disc_profile, conversion_rate, average_deal_size | Local |
| **Configuração de perfis DISC** | `disc_profile_config` | profile_type, communication_style, power_words, closing_techniques | Local |
| **Viés cognitivo** | `cognitive_bias_history` | detected_biases, dominant_biases, sales_strategies | Local |
| **Inteligência emocional** (EQ) | `eq_analysis_history` | overall_score, pillar_scores, overall_level | Local |
| **Estado emocional** | `emotional_states_history` | emotional_state, trigger, confidence | Local |
| **Âncora emocional** | `emotional_anchors` | trigger_word, emotional_state, anchor_type, strength | Local |
| **Valores do cliente** | `client_values` | value_name, category, importance, frequency | Local |
| **Critério de decisão** | `decision_criteria` | name, criteria_type, priority, how_to_address | Local |
| **Objeção oculta** | `hidden_objections` | objection_type, indicator, severity, suggested_probe | Local |

---

## 📊 Domínio: Analytics & Monitoramento

| Conceito de Negócio | Tabela/View | Campos-chave | Origem |
|---------------------|------------|-------------|--------|
| **Insight gerado por AI** | `insights` | title, category, confidence, action_suggestion | Local |
| **Alerta de negócio** | `alerts` | title, type, priority, dismissed | Local |
| **Alerta de compatibilidade** | `compatibility_alerts` | compatibility_score, threshold, alert_type | Local |
| **Alerta de saúde** | `health_alerts` | health_score, alert_type, factors | Local |
| **Análise de tempo de contato** | `contact_time_analysis` | day_of_week, hour_of_day, success_count | Local |
| **Histórico de score** | `score_history` | score, previous_score, change_reason | Local |
| **KPIs diários** | `mv_daily_kpis` (view) | total_companies, total_contacts, total_revenue | Externo |
| **Stats diários** | `mv_daily_stats` (view) | open_deals, pipeline_value, monthly_revenue | Externo |

---

## 🔐 Domínio: Segurança & Auditoria

| Conceito de Negócio | Tabela | Campos-chave | Origem |
|---------------------|--------|-------------|--------|
| **Perfil do usuário** | `profiles` | first_name, last_name, avatar_url, disc_profile | Local |
| **Role do usuário** (RBAC) | `user_roles` | user_id, role (admin/moderator/user) | Local |
| **Log de auditoria** | `audit_log` | entity_type, entity_id, action, old_data, new_data | Local |
| **Log de atividade** | `activities` | entity_type, entity_id, type, description | Local |
| **Regras de automação** | `automation_rules` | trigger_type, conditions, actions, is_active | Local |
| **Logs de automação** | `automation_logs` | rule_id, success, actions_executed | Local |

---

## 🤖 Domínio: Inteligência Artificial

| Conceito de Negócio | Tabela | Campos-chave | Origem |
|---------------------|--------|-------------|--------|
| **LUX Intelligence** (enriquecimento) | `lux_intelligence` | entity_type, request_type, status, ai_summary | Local |
| **Modelo de scoring** | `scoring_models` | name, dimension_weights, is_active | Local |
| **Resultado de scoring** | `scoring_results` | contact_id, model_id, total_score, dimension_scores | Local |
| **Template de mensagem** | `message_templates` | title, content, trigger_type, disc_profile | Local |
| **Template favorito** | `favorite_templates` | template_id, user_id | Local |
| **Preset de busca** | `search_presets` | name, entity_type, filters, is_pinned | Local |

---

## 🔗 Chaves de Relacionamento

```
contacts.company_id → companies.id
interactions.contact_id → contacts.id
interactions.company_id → companies.id
contact_relatives.contact_id → contacts.id
disc_analysis_history.contact_id → contacts.id
disc_analysis_history.interaction_id → interactions.id
insights.contact_id → contacts.id
alerts.contact_id → contacts.id
health_alerts.contact_id → contacts.id
audit_log.user_id → auth.users.id (via RLS)
profiles.id → auth.users.id
user_roles.user_id → auth.users.id
```

---

## 📝 Convenções

| Padrão | Regra |
|--------|-------|
| **Nomenclatura** | snake_case para tabelas e colunas |
| **IDs** | UUID v4 (`gen_random_uuid()`) |
| **Timestamps** | `TIMESTAMPTZ` com default `now()` |
| **Soft delete** | Campo `deleted_at` (nullable) |
| **Audit** | Trigger `audit_trigger_fn` em tabelas críticas |
| **RLS** | Todas as tabelas com `user_id = auth.uid()` |
| **Origem "Externo"** | Dados via Edge Function `external-data` proxy |
| **Origem "Local"** | Dados no Supabase local (Lovable Cloud) |
