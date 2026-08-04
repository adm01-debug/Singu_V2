# 📊 Análise Exaustiva do Banco de Dados - RelateIQ

> **Data da Análise:** 03/02/2026  
> **Versão:** 1.0  
> **Projeto:** RelateIQ - Sistema de CRM Comportamental  

---

## 📋 Sumário

1. [Resumo Executivo](#resumo-executivo)
2. [Inventário de Tabelas](#inventário-de-tabelas)
3. [Detalhamento por Categoria](#detalhamento-por-categoria)
4. [Funções do Banco](#funções-do-banco)
5. [Índices](#índices)
6. [Políticas RLS](#políticas-rls)
7. [Colunas JSONB](#colunas-jsonb)
8. [Contagem de Registros](#contagem-de-registros)
9. [Gaps e Problemas](#gaps-e-problemas)
10. [Recomendações](#recomendações)

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Total de Tabelas** | 51 |
| **Total de Colunas** | ~650 |
| **Funções Database** | 3 |
| **Triggers Ativos** | 0 ⚠️ |
| **Foreign Keys** | 0 ⚠️ |
| **Registros Totais** | ~56 |
| **Tamanho Total** | ~2.1 MB |

---

## Inventário de Tabelas

### Visão Geral Completa

| # | Tabela | Colunas | Registros | Tamanho | Categoria |
|---|--------|---------|-----------|---------|-----------|
| 1 | `contacts` | 28 | 12 | 104 kB | 👤 Core |
| 2 | `companies` | 20 | 5 | 48 kB | 🏢 Core |
| 3 | `interactions` | 20 | 7 | 80 kB | 💬 Core |
| 4 | `profiles` | 11 | 1 | 32 kB | 👤 Auth |
| 5 | `activities` | 8 | 0 | 32 kB | 📊 Analytics |
| 6 | `alerts` | 11 | 0 | 32 kB | 🔔 Notificações |
| 7 | `insights` | 13 | 0 | 32 kB | 💡 Intelligence |
| 8 | `life_events` | 12 | 0 | 32 kB | 📅 Eventos |
| 9 | `disc_analysis_history` | 23 | 3 | 80 kB | 🎯 DISC |
| 10 | `disc_communication_logs` | 12 | 2 | 48 kB | 🎯 DISC |
| 11 | `disc_conversion_metrics` | 17 | 0 | 32 kB | 🎯 DISC |
| 12 | `disc_profile_config` | 26 | 0 | 24 kB | 🎯 DISC |
| 13 | `vak_analysis_history` | 14 | 2 | 64 kB | 👁️ VAK |
| 14 | `metaprogram_analysis` | 18 | 0 | 32 kB | 🧠 NLP |
| 15 | `cognitive_bias_history` | 13 | 2 | 80 kB | 🧠 NLP |
| 16 | `eq_analysis_history` | 16 | 2 | 80 kB | 🧠 NLP |
| 17 | `emotional_anchors` | 10 | 0 | 24 kB | 🧠 NLP |
| 18 | `emotional_states_history` | 9 | 0 | 32 kB | 🧠 NLP |
| 19 | `rfm_analysis` | 30 | 7 | 144 kB | 📈 RFM |
| 20 | `rfm_history` | 10 | 12 | 64 kB | 📈 RFM |
| 21 | `rfm_metrics` | 22 | 0 | 32 kB | 📈 RFM |
| 22 | `rfm_segment_config` | 18 | 0 | 24 kB | 📈 RFM |
| 23 | `client_values` | 11 | 0 | 32 kB | 💎 Valores |
| 24 | `decision_criteria` | 10 | 0 | 24 kB | 🎯 Decisão |
| 25 | `hidden_objections` | 14 | 0 | 32 kB | 🚧 Objeções |
| 26 | `offer_suggestions` | 12 | 0 | 32 kB | 🎁 Ofertas |
| 27 | `communication_preferences` | 13 | 0 | 32 kB | 📞 Preferências |
| 28 | `contact_preferences` | 13 | 0 | 24 kB | 📞 Preferências |
| 29 | `contact_cadence` | 11 | 0 | 24 kB | 📞 Preferências |
| 30 | `contact_time_analysis` | 9 | 0 | 24 kB | 📞 Preferências |
| 31 | `health_alerts` | 12 | 0 | 16 kB | 🏥 Saúde |
| 32 | `health_alert_settings` | 12 | 0 | 24 kB | 🏥 Saúde |
| 33 | `compatibility_alerts` | 11 | 0 | 16 kB | ⚖️ Compatibilidade |
| 34 | `compatibility_settings` | 8 | 0 | 16 kB | ⚖️ Compatibilidade |
| 35 | `social_profiles` | 24 | 1 | 64 kB | 🌐 Social |
| 36 | `social_behavior_analysis` | 21 | 2 | 64 kB | 🌐 Social |
| 37 | `social_life_events` | 15 | 0 | 40 kB | 🌐 Social |
| 38 | `social_scraping_schedule` | 14 | 0 | 32 kB | 🌐 Social |
| 39 | `trigger_ab_tests` | 22 | 0 | 40 kB | 🧪 Triggers |
| 40 | `trigger_bundles` | 15 | 0 | 32 kB | 🧪 Triggers |
| 41 | `trigger_channel_effectiveness` | 11 | 0 | 40 kB | 🧪 Triggers |
| 42 | `trigger_intensity_history` | 9 | 0 | 32 kB | 🧪 Triggers |
| 43 | `trigger_usage_history` | 14 | 0 | 40 kB | 🧪 Triggers |
| 44 | `stakeholder_alerts` | 14 | 1 | 64 kB | 👥 Stakeholders |
| 45 | `purchase_history` | 12 | 0 | 32 kB | 💰 Compras |
| 46 | `score_history` | 10 | 0 | 56 kB | 📊 Histórico |
| 47 | `push_subscriptions` | 7 | 0 | 24 kB | 📱 Push |
| 48 | `favorite_templates` | 4 | 0 | 40 kB | ⭐ Templates |
| 49 | `weekly_reports` | 5 | 0 | 16 kB | 📄 Relatórios |
| 50 | `weekly_report_settings` | 15 | 0 | 24 kB | 📄 Relatórios |

---

## Detalhamento por Categoria

### 👤 CORE - Entidades Principais

#### `contacts` (28 colunas)
Tabela principal de contatos do CRM.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | Identificador único |
| `user_id` | uuid | NO | - | Proprietário do contato |
| `company_id` | uuid | YES | - | Empresa associada |
| `first_name` | text | NO | - | Primeiro nome |
| `last_name` | text | NO | - | Sobrenome |
| `email` | text | YES | - | Email |
| `phone` | text | YES | - | Telefone |
| `whatsapp` | text | YES | - | WhatsApp |
| `linkedin` | text | YES | - | LinkedIn URL |
| `instagram` | text | YES | - | Instagram |
| `twitter` | text | YES | - | Twitter/X |
| `avatar_url` | text | YES | - | URL do avatar |
| `birthday` | date | YES | - | Data de nascimento |
| `role` | text | YES | 'contact' | Papel (owner, manager, buyer, contact) |
| `role_title` | text | YES | - | Cargo |
| `notes` | text | YES | - | Notas gerais |
| `personal_notes` | text | YES | - | Notas pessoais |
| `family_info` | text | YES | - | Informações familiares |
| `tags` | text[] | YES | '{}' | Tags de categorização |
| `hobbies` | text[] | YES | '{}' | Hobbies |
| `interests` | text[] | YES | '{}' | Interesses |
| `relationship_stage` | text | YES | 'unknown' | Estágio do relacionamento |
| `relationship_score` | integer | YES | 0 | Score de relacionamento (0-100) |
| `sentiment` | text | YES | 'neutral' | Sentimento atual |
| `behavior` | jsonb | YES | (default complexo) | **Perfil comportamental completo** |
| `life_events` | jsonb | YES | '[]' | Eventos de vida |
| `created_at` | timestamptz | NO | now() | Data de criação |
| `updated_at` | timestamptz | NO | now() | Última atualização |

**Estrutura do campo `behavior` (JSONB):**
```json
{
  "discProfile": "D" | "I" | "S" | "C" | null,
  "discConfidence": 0-100,
  "vakProfile": {
    "primary": "V" | "A" | "K" | "D",
    "secondary": "V" | "A" | "K" | "D",
    "scores": { "visual": 0-100, "auditory": 0-100, "kinesthetic": 0-100, "digital": 0-100 }
  },
  "temperamentProfile": {
    "primary": "colerico" | "sanguineo" | "melancolico" | "fleumatico",
    "secondary": "...",
    "scores": { ... }
  },
  "mbtiProfile": {
    "type": "ENTJ" | "ENFP" | ...,
    "dimensions": { "E_I": {...}, "S_N": {...}, "T_F": {...}, "J_P": {...} }
  },
  "enneagramProfile": {
    "type": 1-9,
    "wing": 1-9,
    "scores": { ... }
  },
  "bigFiveProfile": {
    "openness": 0-100,
    "conscientiousness": 0-100,
    "extraversion": 0-100,
    "agreeableness": 0-100,
    "neuroticism": 0-100
  },
  "preferredChannel": "whatsapp" | "call" | "email" | "meeting",
  "formalityLevel": 1-5,
  "decisionPower": 1-10,
  "supportLevel": 1-10,
  "needsApproval": boolean,
  "decisionCriteria": ["price", "quality", "relationship", ...],
  "currentChallenges": ["..."],
  "competitorsUsed": ["..."],
  "influencedByIds": ["uuid", ...],
  "influencesIds": ["uuid", ...]
}
```

---

#### `companies` (20 colunas)
Empresas/organizações.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | Identificador único |
| `user_id` | uuid | NO | - | Proprietário |
| `name` | text | NO | - | Nome da empresa |
| `industry` | text | YES | - | Setor/Indústria |
| `website` | text | YES | - | Website |
| `email` | text | YES | - | Email corporativo |
| `phone` | text | YES | - | Telefone |
| `address` | text | YES | - | Endereço |
| `city` | text | YES | - | Cidade |
| `state` | text | YES | - | Estado |
| `logo_url` | text | YES | - | URL do logo |
| `notes` | text | YES | - | Notas |
| `tags` | text[] | YES | '{}' | Tags |
| `employee_count` | text | YES | - | Número de funcionários |
| `annual_revenue` | text | YES | - | Faturamento anual |
| `financial_health` | text | YES | - | Saúde financeira |
| `competitors` | text[] | YES | - | Concorrentes |
| `challenges` | text[] | YES | - | Desafios |
| `created_at` | timestamptz | NO | now() | Criação |
| `updated_at` | timestamptz | NO | now() | Atualização |

---

#### `interactions` (20 colunas)
Histórico de interações com contatos.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | Identificador único |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato relacionado |
| `company_id` | uuid | YES | - | Empresa relacionada |
| `type` | text | NO | - | Tipo (whatsapp, call, email, meeting, note) |
| `title` | text | NO | - | Título |
| `content` | text | YES | - | Conteúdo da interação |
| `audio_url` | text | YES | - | URL do áudio |
| `transcription` | text | YES | - | Transcrição |
| `sentiment` | text | YES | 'neutral' | Sentimento detectado |
| `tags` | text[] | YES | '{}' | Tags |
| `duration` | integer | YES | - | Duração em segundos |
| `attachments` | text[] | YES | '{}' | Anexos |
| `initiated_by` | text | YES | 'us' | Quem iniciou (us/them) |
| `response_time` | integer | YES | - | Tempo de resposta (min) |
| `key_insights` | text[] | YES | '{}' | Insights extraídos |
| `follow_up_required` | boolean | YES | false | Requer follow-up |
| `follow_up_date` | date | YES | - | Data do follow-up |
| `emotion_analysis` | jsonb | YES | - | Análise emocional |
| `created_at` | timestamptz | NO | now() | Data da interação |

---

#### `profiles` (11 colunas)
Perfis de usuários do sistema.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | - | ID do usuário (auth.users) |
| `first_name` | text | YES | - | Primeiro nome |
| `last_name` | text | YES | - | Sobrenome |
| `phone` | text | YES | - | Telefone |
| `company_name` | text | YES | - | Empresa do usuário |
| `role_title` | text | YES | - | Cargo |
| `avatar_url` | text | YES | - | Avatar |
| `nlp_profile` | jsonb | YES | - | Perfil NLP do vendedor |
| `preferences` | jsonb | YES | - | Preferências do sistema |
| `created_at` | timestamptz | NO | now() | Criação |
| `updated_at` | timestamptz | NO | now() | Atualização |

---

### 🎯 DISC - Análise Comportamental

#### `disc_analysis_history` (23 colunas)
Histórico de análises DISC.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato analisado |
| `interaction_id` | uuid | YES | - | Interação fonte |
| `primary_profile` | text | NO | - | Perfil primário (D/I/S/C) |
| `secondary_profile` | text | YES | - | Perfil secundário |
| `blend_profile` | text | YES | - | Perfil combinado (ex: "DI") |
| `dominance_score` | integer | NO | 0 | Score Dominância (0-100) |
| `influence_score` | integer | NO | 0 | Score Influência |
| `steadiness_score` | integer | NO | 0 | Score Estabilidade |
| `conscientiousness_score` | integer | NO | 0 | Score Conformidade |
| `confidence` | integer | NO | 50 | Confiança da análise |
| `stress_primary` | text | YES | - | Perfil sob stress |
| `stress_secondary` | text | YES | - | Secundário sob stress |
| `analyzed_text` | text | YES | - | Texto analisado |
| `detected_keywords` | jsonb | YES | '[]' | Palavras-chave detectadas |
| `detected_phrases` | jsonb | YES | '[]' | Frases detectadas |
| `behavior_indicators` | jsonb | YES | '[]' | Indicadores comportamentais |
| `profile_summary` | text | YES | - | Resumo do perfil |
| `analysis_notes` | text | YES | - | Notas da análise |
| `analysis_source` | text | NO | 'manual' | Fonte (manual/auto/ai) |
| `analyzed_at` | timestamptz | NO | now() | Data da análise |
| `created_at` | timestamptz | NO | now() | Criação |

---

#### `disc_profile_config` (26 colunas)
Configuração dos perfis DISC (lookup table).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `profile_type` | text | NO | - | Tipo (D/I/S/C) |
| `name` | text | NO | - | Nome (Dominante, Influente...) |
| `short_description` | text | NO | - | Descrição curta |
| `detailed_description` | text | NO | - | Descrição detalhada |
| `core_drive` | text | NO | - | Motivação principal |
| `core_fear` | text | NO | - | Medo principal |
| `under_pressure` | text | NO | - | Comportamento sob pressão |
| `ideal_environment` | text | NO | - | Ambiente ideal |
| `preferred_pace` | text | NO | - | Ritmo preferido |
| `decision_making_style` | text | NO | - | Estilo de decisão |
| `icon` | text | YES | - | Ícone |
| `communication_style` | jsonb | NO | '{}' | Estilo de comunicação |
| `opening_strategies` | jsonb | NO | '[]' | Estratégias de abertura |
| `presentation_tips` | jsonb | NO | '[]' | Dicas de apresentação |
| `objection_handling` | jsonb | NO | '[]' | Tratamento de objeções |
| `closing_techniques` | jsonb | NO | '[]' | Técnicas de fechamento |
| `follow_up_approach` | jsonb | NO | '[]' | Abordagem de follow-up |
| `power_words` | jsonb | NO | '[]' | Palavras de poder |
| `avoid_words` | jsonb | NO | '[]' | Palavras a evitar |
| `detection_keywords` | jsonb | NO | '[]' | Keywords para detecção |
| `typical_phrases` | jsonb | NO | '[]' | Frases típicas |
| `compatibility_matrix` | jsonb | NO | '{}' | Matriz de compatibilidade |
| `color_scheme` | jsonb | NO | '{}' | Esquema de cores |
| `created_at` | timestamptz | NO | now() | Criação |
| `updated_at` | timestamptz | NO | now() | Atualização |

---

#### `disc_communication_logs` (12 colunas)
Log de comunicações adaptadas ao DISC.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `interaction_id` | uuid | YES | - |
| `contact_disc_profile` | text | NO | - |
| `approach_adapted` | boolean | NO | - |
| `adaptation_tips_shown` | jsonb | YES | - |
| `tips_followed` | jsonb | YES | - |
| `effectiveness_rating` | integer | YES | - |
| `communication_outcome` | text | YES | - |
| `outcome_notes` | text | YES | - |
| `created_at` | timestamptz | NO | now() |

---

#### `disc_conversion_metrics` (17 colunas)
Métricas de conversão por perfil DISC.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `disc_profile` | text | NO | - |
| `blend_profile` | text | YES | - |
| `period_start` | date | NO | - |
| `period_end` | date | NO | - |
| `total_contacts` | integer | NO | 0 |
| `total_opportunities` | integer | NO | 0 |
| `converted_count` | integer | NO | 0 |
| `lost_count` | integer | NO | 0 |
| `conversion_rate` | numeric | YES | - |
| `average_deal_size` | numeric | YES | - |
| `average_sales_cycle_days` | integer | YES | - |
| `average_relationship_score` | numeric | YES | - |
| `average_compatibility_score` | numeric | YES | - |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

### 👁️ VAK - Sistema Representacional

#### `vak_analysis_history` (14 colunas)
Histórico de análises VAK (Visual-Auditivo-Kinestésico).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato |
| `interaction_id` | uuid | YES | - | Interação fonte |
| `visual_score` | numeric | YES | 0 | Score Visual |
| `auditory_score` | numeric | YES | 0 | Score Auditivo |
| `kinesthetic_score` | numeric | YES | 0 | Score Kinestésico |
| `digital_score` | numeric | YES | 0 | Score Digital |
| `visual_words` | text[] | YES | '{}' | Palavras visuais |
| `auditory_words` | text[] | YES | '{}' | Palavras auditivas |
| `kinesthetic_words` | text[] | YES | '{}' | Palavras kinestésicas |
| `digital_words` | text[] | YES | '{}' | Palavras digitais |
| `analyzed_text` | text | YES | - | Texto analisado |
| `created_at` | timestamptz | NO | now() | Data |

---

### 🧠 NLP - Programação Neurolinguística

#### `metaprogram_analysis` (18 colunas)
Análise de metaprogramas.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato |
| `interaction_id` | uuid | YES | - | Interação |
| `toward_score` | integer | YES | 0 | Direcionado a objetivos |
| `away_from_score` | integer | YES | 0 | Afastando de problemas |
| `internal_score` | integer | YES | 0 | Referência interna |
| `external_score` | integer | YES | 0 | Referência externa |
| `options_score` | integer | YES | 0 | Orientado a opções |
| `procedures_score` | integer | YES | 0 | Orientado a procedimentos |
| `toward_words` | text[] | YES | '{}' | Palavras "toward" |
| `away_from_words` | text[] | YES | '{}' | Palavras "away from" |
| `internal_words` | text[] | YES | '{}' | Palavras internas |
| `external_words` | text[] | YES | '{}' | Palavras externas |
| `options_words` | text[] | YES | '{}' | Palavras de opções |
| `procedures_words` | text[] | YES | '{}' | Palavras procedurais |
| `analyzed_text` | text | YES | - | Texto analisado |
| `created_at` | timestamptz | NO | now() | Data |

---

#### `cognitive_bias_history` (13 colunas)
Histórico de vieses cognitivos detectados.

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato |
| `interaction_id` | uuid | YES | - | Interação |
| `detected_biases` | jsonb | NO | - | Vieses detectados |
| `category_distribution` | jsonb | YES | - | Distribuição por categoria |
| `sales_strategies` | jsonb | YES | - | Estratégias de vendas |
| `dominant_biases` | text[] | YES | - | Vieses dominantes |
| `vulnerabilities` | text[] | YES | - | Vulnerabilidades |
| `resistances` | text[] | YES | - | Resistências |
| `profile_summary` | text | YES | - | Resumo |
| `analyzed_at` | timestamptz | NO | now() | Data da análise |
| `created_at` | timestamptz | NO | now() | Criação |

---

#### `eq_analysis_history` (16 colunas)
Análise de Inteligência Emocional (EQ).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato |
| `interaction_id` | uuid | YES | - | Interação |
| `overall_score` | integer | NO | - | Score geral EQ |
| `overall_level` | text | NO | - | Nível (baixo/médio/alto) |
| `pillar_scores` | jsonb | NO | - | Scores por pilar |
| `indicators` | jsonb | YES | - | Indicadores detectados |
| `strengths` | text[] | YES | - | Pontos fortes |
| `areas_for_growth` | text[] | YES | - | Áreas de melhoria |
| `communication_style` | jsonb | YES | - | Estilo de comunicação |
| `sales_implications` | jsonb | YES | - | Implicações para vendas |
| `profile_summary` | text | YES | - | Resumo |
| `confidence` | integer | YES | - | Confiança |
| `analyzed_at` | timestamptz | NO | now() | Data |
| `created_at` | timestamptz | NO | now() | Criação |

---

#### `emotional_anchors` (10 colunas)
Âncoras emocionais detectadas.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `anchor_type` | text | NO | - |
| `trigger_word` | text | NO | - |
| `emotional_state` | text | NO | - |
| `context` | text | YES | - |
| `strength` | integer | YES | 5 |
| `detected_at` | timestamptz | NO | now() |
| `created_at` | timestamptz | NO | now() |

---

#### `emotional_states_history` (9 colunas)
Histórico de estados emocionais.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `interaction_id` | uuid | YES | - |
| `emotional_state` | text | NO | - |
| `trigger` | text | YES | - |
| `context` | text | YES | - |
| `confidence` | integer | YES | 50 |
| `created_at` | timestamptz | NO | now() |

---

### 📈 RFM - Análise de Valor

#### `rfm_analysis` (30 colunas)
Análise RFM (Recência-Frequência-Monetário).

| Coluna | Tipo | Nullable | Default | Descrição |
|--------|------|----------|---------|-----------|
| `id` | uuid | NO | gen_random_uuid() | ID |
| `user_id` | uuid | NO | - | Proprietário |
| `contact_id` | uuid | NO | - | Contato |
| `recency_score` | integer | NO | - | Score Recência (1-5) |
| `frequency_score` | integer | NO | - | Score Frequência (1-5) |
| `monetary_score` | integer | NO | - | Score Monetário (1-5) |
| `rfm_score` | integer | YES | - | Score combinado |
| `total_score` | integer | YES | - | Score total |
| `segment` | text | NO | - | Segmento RFM |
| `segment_description` | text | YES | - | Descrição do segmento |
| `segment_color` | text | YES | - | Cor do segmento |
| `days_since_last_purchase` | integer | YES | - | Dias desde última compra |
| `days_since_last_interaction` | integer | YES | - | Dias desde última interação |
| `total_purchases` | integer | YES | 0 | Total de compras |
| `total_interactions` | integer | YES | 0 | Total de interações |
| `total_monetary_value` | numeric | YES | 0 | Valor monetário total |
| `average_order_value` | numeric | YES | 0 | Ticket médio |
| `predicted_next_purchase_date` | date | YES | - | Previsão próxima compra |
| `predicted_lifetime_value` | numeric | YES | - | LTV previsto |
| `churn_probability` | numeric | YES | - | Probabilidade de churn |
| `recency_trend` | text | YES | - | Tendência recência |
| `frequency_trend` | text | YES | - | Tendência frequência |
| `monetary_trend` | text | YES | - | Tendência monetária |
| `overall_trend` | text | YES | - | Tendência geral |
| `communication_priority` | text | YES | - | Prioridade de contato |
| `recommended_actions` | jsonb | YES | '[]' | Ações recomendadas |
| `recommended_offers` | jsonb | YES | '[]' | Ofertas recomendadas |
| `analyzed_at` | timestamptz | NO | now() | Data da análise |
| `created_at` | timestamptz | NO | now() | Criação |
| `updated_at` | timestamptz | NO | now() | Atualização |

---

#### `rfm_segment_config` (18 colunas)
Configuração de segmentos RFM.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `segment_name` | text | NO | - |
| `segment_key` | text | NO | - |
| `description` | text | YES | - |
| `color` | text | YES | - |
| `icon` | text | YES | - |
| `min_recency` | integer | YES | - |
| `max_recency` | integer | YES | - |
| `min_frequency` | integer | YES | - |
| `max_frequency` | integer | YES | - |
| `min_monetary` | integer | YES | - |
| `max_monetary` | integer | YES | - |
| `priority` | integer | YES | - |
| `recommended_actions` | jsonb | YES | '[]' |
| `communication_frequency` | text | YES | - |
| `retention_strategy` | text | YES | - |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

### 🧪 TRIGGERS - Gatilhos Mentais

#### `trigger_ab_tests` (22 colunas)
Testes A/B de gatilhos mentais.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | YES | - |
| `name` | text | NO | - |
| `disc_profile` | text | YES | - |
| `variant_a_trigger` | text | NO | - |
| `variant_a_template` | text | YES | - |
| `variant_b_trigger` | text | NO | - |
| `variant_b_template` | text | YES | - |
| `variant_a_uses` | integer | YES | 0 |
| `variant_a_conversions` | integer | YES | 0 |
| `variant_a_avg_rating` | numeric | YES | 0 |
| `variant_b_uses` | integer | YES | 0 |
| `variant_b_conversions` | integer | YES | 0 |
| `variant_b_avg_rating` | numeric | YES | 0 |
| `confidence` | numeric | YES | 0 |
| `winner` | text | YES | - |
| `is_active` | boolean | YES | true |
| `started_at` | timestamptz | NO | now() |
| `completed_at` | timestamptz | YES | - |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

#### `trigger_bundles` (15 colunas)
Pacotes de gatilhos por cenário.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `name` | text | NO | - |
| `description` | text | YES | - |
| `scenario` | text | NO | - |
| `disc_profile` | text | YES | - |
| `triggers` | jsonb | NO | '[]' |
| `sequence_order` | jsonb | YES | '[]' |
| `timing_rules` | jsonb | YES | '{}' |
| `success_rate` | numeric | YES | - |
| `uses_count` | integer | YES | 0 |
| `is_active` | boolean | YES | true |
| `is_public` | boolean | YES | false |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

#### `trigger_channel_effectiveness` (11 colunas)
Efetividade de gatilhos por canal.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `trigger_type` | text | NO | - |
| `channel` | text | NO | - |
| `disc_profile` | text | YES | - |
| `uses_count` | integer | YES | 0 |
| `success_count` | integer | YES | 0 |
| `avg_effectiveness` | numeric | YES | 0 |
| `last_used_at` | timestamptz | YES | - |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

#### `trigger_intensity_history` (9 colunas)
Histórico de intensidade de gatilhos.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `interaction_id` | uuid | YES | - |
| `trigger_type` | text | NO | - |
| `intensity_level` | integer | NO | - |
| `result` | text | YES | - |
| `notes` | text | YES | - |
| `created_at` | timestamptz | NO | now() |

---

#### `trigger_usage_history` (14 colunas)
Histórico de uso de gatilhos.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `trigger_type` | text | NO | - |
| `template_id` | text | YES | - |
| `template_title` | text | YES | - |
| `scenario` | text | YES | - |
| `channel` | text | YES | - |
| `context` | text | YES | - |
| `result` | text | YES | - |
| `effectiveness_rating` | integer | YES | - |
| `notes` | text | YES | - |
| `used_at` | timestamptz | NO | now() |
| `created_at` | timestamptz | NO | now() |

---

### 🌐 SOCIAL - Inteligência Social

#### `social_profiles` (24 colunas)
Perfis de redes sociais.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `platform` | text | NO | - |
| `profile_url` | text | YES | - |
| `headline` | text | YES | - |
| `location` | text | YES | - |
| `current_company` | text | YES | - |
| `current_position` | text | YES | - |
| `connections_count` | integer | YES | - |
| `followers_count` | integer | YES | - |
| `following_count` | integer | YES | - |
| `profile_image_url` | text | YES | - |
| `cover_image_url` | text | YES | - |
| `skills` | text[] | YES | - |
| `certifications` | text[] | YES | - |
| `education` | jsonb | YES | - |
| `experience` | jsonb | YES | - |
| `recent_posts` | jsonb | YES | - |
| `engagement_metrics` | jsonb | YES | - |
| `profile_data` | jsonb | YES | - |
| `last_scraped_at` | timestamptz | NO | now() |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

#### `social_behavior_analysis` (21 colunas)
Análise comportamental em redes sociais.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `social_profile_id` | uuid | YES | - |
| `posting_frequency` | text | YES | - |
| `primary_topics` | text[] | YES | - |
| `communication_tone` | text | YES | - |
| `engagement_level` | text | YES | - |
| `content_types` | jsonb | YES | - |
| `peak_activity_times` | jsonb | YES | - |
| `network_strength` | integer | YES | - |
| `influence_score` | integer | YES | - |
| `detected_interests` | text[] | YES | - |
| `personality_indicators` | jsonb | YES | - |
| `professional_focus` | text[] | YES | - |
| `values_detected` | text[] | YES | - |
| `communication_preferences` | jsonb | YES | - |
| `behavioral_insights` | jsonb | YES | - |
| `confidence` | integer | YES | 50 |
| `analyzed_at` | timestamptz | NO | now() |
| `created_at` | timestamptz | NO | now() |

---

### 📊 OUTRAS TABELAS

#### `activities` (8 colunas)
Log de atividades do sistema.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `type` | text | NO | - |
| `entity_type` | text | NO | - |
| `entity_id` | uuid | NO | - |
| `entity_name` | text | YES | - |
| `description` | text | YES | - |
| `created_at` | timestamptz | NO | now() |

---

#### `alerts` (11 colunas)
Sistema de alertas.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | YES | - |
| `type` | text | NO | - |
| `priority` | text | YES | 'medium' |
| `title` | text | NO | - |
| `description` | text | YES | - |
| `action_url` | text | YES | - |
| `dismissed` | boolean | YES | false |
| `expires_at` | timestamptz | YES | - |
| `created_at` | timestamptz | NO | now() |

---

#### `insights` (13 colunas)
Insights gerados pelo sistema.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `category` | text | NO | - |
| `title` | text | NO | - |
| `description` | text | YES | - |
| `source` | text | YES | - |
| `confidence` | integer | YES | 50 |
| `actionable` | boolean | YES | false |
| `action_suggestion` | text | YES | - |
| `dismissed` | boolean | YES | false |
| `expires_at` | timestamptz | YES | - |
| `created_at` | timestamptz | NO | now() |

---

#### `life_events` (12 colunas)
Eventos de vida dos contatos.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `event_type` | text | NO | - |
| `title` | text | NO | - |
| `description` | text | YES | - |
| `event_date` | timestamptz | NO | - |
| `recurring` | boolean | YES | false |
| `reminder_days_before` | integer | YES | 7 |
| `last_reminded_at` | timestamptz | YES | - |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

#### `purchase_history` (12 colunas)
Histórico de compras.

| Coluna | Tipo | Nullable | Default |
|--------|------|----------|---------|
| `id` | uuid | NO | gen_random_uuid() |
| `user_id` | uuid | NO | - |
| `contact_id` | uuid | NO | - |
| `product_name` | text | NO | - |
| `product_category` | text | YES | - |
| `amount` | numeric | YES | - |
| `purchase_date` | date | NO | - |
| `renewal_date` | date | YES | - |
| `cycle_months` | integer | YES | - |
| `notes` | text | YES | - |
| `created_at` | timestamptz | NO | now() |
| `updated_at` | timestamptz | NO | now() |

---

## Funções do Banco

### `handle_new_user()`
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$function$
```
**Propósito:** Cria automaticamente um registro na tabela `profiles` quando um novo usuário se registra.

---

### `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
```
**Propósito:** Atualiza automaticamente a coluna `updated_at` em qualquer UPDATE.

⚠️ **STATUS:** Função existe mas **NÃO está vinculada a nenhuma tabela via trigger**.

---

### `update_nlp_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION public.update_nlp_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
```
**Propósito:** Versão específica para tabelas NLP.

⚠️ **STATUS:** Função existe mas **NÃO está vinculada a nenhuma tabela via trigger**.

---

## Índices

### Índices por Tabela

| Tabela | Índice | Tipo | Colunas |
|--------|--------|------|---------|
| `activities` | `activities_pkey` | UNIQUE | id |
| `activities` | `idx_activities_created_at` | BTREE | created_at DESC |
| `activities` | `idx_activities_user_id` | BTREE | user_id |
| `alerts` | `alerts_pkey` | UNIQUE | id |
| `alerts` | `idx_alerts_dismissed` | BTREE PARTIAL | dismissed WHERE false |
| `alerts` | `idx_alerts_user_id` | BTREE | user_id |
| `contacts` | `contacts_pkey` | UNIQUE | id |
| `contacts` | `idx_contacts_user_id` | BTREE | user_id |
| `contacts` | `idx_contacts_company_id` | BTREE | company_id |
| `companies` | `companies_pkey` | UNIQUE | id |
| `companies` | `idx_companies_user_id` | BTREE | user_id |
| `interactions` | `interactions_pkey` | UNIQUE | id |
| `interactions` | `idx_interactions_contact_id` | BTREE | contact_id |
| `interactions` | `idx_interactions_created_at` | BTREE | created_at DESC |
| `disc_analysis_history` | `idx_disc_contact_analyzed` | BTREE | contact_id, analyzed_at DESC |
| `rfm_analysis` | `idx_rfm_contact_analyzed` | BTREE | contact_id, analyzed_at DESC |
| `cognitive_bias_history` | `idx_cognitive_bias_contact` | BTREE | contact_id |
| `vak_analysis_history` | `idx_vak_contact` | BTREE | contact_id |

---

## Políticas RLS

### Padrão de Segurança

Todas as tabelas seguem o padrão de RLS baseado em `user_id`:

```sql
-- SELECT
CREATE POLICY "Users can view their own [table]" 
ON public.[table] 
FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert their own [table]" 
ON public.[table] 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update their own [table]" 
ON public.[table] 
FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete their own [table]" 
ON public.[table] 
FOR DELETE 
USING (auth.uid() = user_id);
```

### Exceções

| Tabela | Políticas Especiais |
|--------|---------------------|
| `disc_profile_config` | Somente SELECT público (configuração global) |
| `rfm_segment_config` | Somente SELECT público (configuração global) |
| `activities` | Sem UPDATE/DELETE (log imutável) |
| `weekly_reports` | Sem UPDATE/DELETE (relatórios imutáveis) |
| `disc_analysis_history` | Sem UPDATE (histórico imutável) |
| `vak_analysis_history` | Sem UPDATE (histórico imutável) |
| `cognitive_bias_history` | Sem UPDATE (histórico imutável) |
| `metaprogram_analysis` | Sem UPDATE (histórico imutável) |
| `emotional_states_history` | Sem UPDATE (histórico imutável) |

---

## Colunas JSONB

### Estruturas Complexas

#### `contacts.behavior`
```typescript
interface ContactBehavior {
  // DISC
  discProfile: 'D' | 'I' | 'S' | 'C' | null;
  discConfidence: number; // 0-100
  discNotes?: string;
  
  // VAK
  vakProfile?: {
    primary: 'V' | 'A' | 'K' | 'D';
    secondary?: 'V' | 'A' | 'K' | 'D';
    confidence?: number;
    scores?: {
      visual: number;
      auditory: number;
      kinesthetic: number;
      digital?: number;
    };
  };
  
  // Temperamentos
  temperamentProfile?: {
    primary: 'colerico' | 'sanguineo' | 'melancolico' | 'fleumatico';
    secondary?: string;
    scores?: Record<string, number>;
  };
  
  // MBTI
  mbtiProfile?: {
    type: string; // Ex: "ENTJ"
    confidence?: number;
    dimensions?: {
      E_I: { E: number; I: number };
      S_N: { S: number; N: number };
      T_F: { T: number; F: number };
      J_P: { J: number; P: number };
    };
  };
  
  // Eneagrama
  enneagramProfile?: {
    type: number; // 1-9
    wing?: number;
    confidence?: number;
    scores?: Record<number, number>;
  };
  
  // Big Five
  bigFiveProfile?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    confidence?: number;
  };
  
  // Comunicação
  preferredChannel: 'whatsapp' | 'call' | 'email' | 'meeting' | 'video';
  messageStyle?: 'audio' | 'short_text' | 'long_text' | 'documents';
  formalityLevel: 1 | 2 | 3 | 4 | 5;
  avgResponseTimeHours?: number;
  bestContactWindow?: string;
  
  // Decisão
  decisionSpeed?: 'impulsive' | 'fast' | 'moderate' | 'slow';
  decisionCriteria: string[];
  decisionRole?: 'final_decision' | 'technical' | 'economic' | 'user' | 'blocker' | 'champion';
  decisionPower: number; // 1-10
  needsApproval: boolean;
  approverContactId?: string;
  budgetAuthority?: string;
  
  // Influência
  supportLevel: number; // 1-10
  influencedByIds: string[];
  influencesIds: string[];
  
  // Contexto
  currentChallenges: string[];
  competitorsUsed: string[];
  companyFinancialHealth?: 'growing' | 'stable' | 'cutting' | 'unknown';
  bestTimeToApproach?: string;
  seasonalNotes?: string;
  
  // Motivações
  primaryMotivation?: string;
  primaryFear?: string;
  careerStage?: 'early' | 'growth' | 'established' | 'transition' | 'senior';
  currentPressure?: string;
  professionalGoals?: string;
}
```

---

#### `cognitive_bias_history.detected_biases`
```typescript
interface DetectedBias {
  biasType: string;
  confidence: number;
  indicators: string[];
  salesImplication: string;
  suggestedApproach: string;
}
```

---

#### `rfm_analysis.recommended_actions`
```typescript
interface RecommendedAction {
  action: string;
  priority: 'high' | 'medium' | 'low';
  channel: string;
  timing: string;
  template?: string;
}
```

---

## Contagem de Registros

### Status Atual

| Tabela | Registros | Status |
|--------|-----------|--------|
| `contacts` | 12 | ✅ Com dados |
| `companies` | 5 | ✅ Com dados |
| `interactions` | 7 | ✅ Com dados |
| `profiles` | 1 | ✅ Com dados |
| `rfm_analysis` | 7 | ✅ Com dados |
| `rfm_history` | 12 | ✅ Com dados |
| `disc_analysis_history` | 3 | ✅ Com dados |
| `disc_communication_logs` | 2 | ✅ Com dados |
| `eq_analysis_history` | 2 | ✅ Com dados |
| `cognitive_bias_history` | 2 | ✅ Com dados |
| `vak_analysis_history` | 2 | ✅ Com dados |
| `social_behavior_analysis` | 2 | ✅ Com dados |
| `social_profiles` | 1 | ✅ Com dados |
| `stakeholder_alerts` | 1 | ✅ Com dados |
| `activities` | 0 | ⚠️ Vazia |
| `alerts` | 0 | ⚠️ Vazia |
| `insights` | 0 | ⚠️ Vazia |
| `life_events` | 0 | ⚠️ Vazia |
| `disc_profile_config` | 0 | 🔴 CRÍTICO - Config vazia |
| `rfm_segment_config` | 0 | 🔴 CRÍTICO - Config vazia |
| `metaprogram_analysis` | 0 | ⚠️ Vazia |
| `emotional_anchors` | 0 | ⚠️ Vazia |
| `emotional_states_history` | 0 | ⚠️ Vazia |
| `trigger_ab_tests` | 0 | ⚠️ Vazia |
| `trigger_bundles` | 0 | ⚠️ Vazia |
| `trigger_channel_effectiveness` | 0 | ⚠️ Vazia |
| `trigger_intensity_history` | 0 | ⚠️ Vazia |
| `trigger_usage_history` | 0 | ⚠️ Vazia |
| `purchase_history` | 0 | ⚠️ Vazia |
| *... outras 20+ tabelas* | 0 | ⚠️ Vazias |

---

## Gaps e Problemas

### 🔴 CRÍTICOS

| Problema | Descrição | Impacto | Solução |
|----------|-----------|---------|---------|
| **Triggers ausentes** | Funções `update_updated_at_column` existem mas não estão vinculadas | `updated_at` não atualiza automaticamente | Criar triggers para todas as tabelas |
| **Foreign Keys ausentes** | Nenhuma FK detectada | Integridade referencial não garantida | Adicionar FKs com ON DELETE CASCADE |
| **disc_profile_config vazia** | Tabela de configuração DISC sem dados | Funcionalidades DISC não funcionam corretamente | Popular com 4 perfis DISC |
| **rfm_segment_config vazia** | Tabela de segmentos RFM sem dados | Segmentação RFM não funciona | Popular com 11 segmentos padrão |

### 🟡 MODERADOS

| Problema | Descrição | Impacto | Solução |
|----------|-----------|---------|---------|
| **38 tabelas vazias** | Maioria das tabelas sem dados | Features incompletas | Popular com dados demo |
| **Extension em public** | Extensões no schema público | Segurança reduzida | Mover para schema dedicado |
| **Leaked password OFF** | Proteção contra senhas vazadas desabilitada | Senhas fracas permitidas | Ativar via Auth Settings |

### 🟢 OBSERVAÇÕES

| Item | Status | Nota |
|------|--------|------|
| RLS Policies | ✅ OK | Todas as tabelas protegidas |
| Índices | ✅ OK | Performance otimizada |
| UUIDs | ✅ OK | Todos usando gen_random_uuid() |
| Timestamps | ✅ OK | created_at/updated_at presentes |

---

## Recomendações

### Prioridade 1 - Urgente

1. **Criar Triggers para updated_at**
```sql
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Repetir para todas as tabelas com updated_at
```

2. **Popular disc_profile_config**
```sql
INSERT INTO disc_profile_config (profile_type, name, short_description, ...)
VALUES 
  ('D', 'Dominante', 'Direto, decisivo, focado em resultados', ...),
  ('I', 'Influente', 'Entusiasta, otimista, focado em pessoas', ...),
  ('S', 'Estável', 'Paciente, confiável, focado em segurança', ...),
  ('C', 'Conforme', 'Analítico, preciso, focado em qualidade', ...);
```

3. **Popular rfm_segment_config**
```sql
INSERT INTO rfm_segment_config (segment_key, segment_name, ...)
VALUES 
  ('champions', 'Campeões', ...),
  ('loyal', 'Fiéis', ...),
  ('potential_loyalist', 'Potenciais Fiéis', ...),
  -- ... outros 8 segmentos
```

### Prioridade 2 - Importante

4. **Adicionar Foreign Keys**
```sql
ALTER TABLE contacts
  ADD CONSTRAINT fk_contacts_company
  FOREIGN KEY (company_id) REFERENCES companies(id)
  ON DELETE SET NULL;

ALTER TABLE interactions
  ADD CONSTRAINT fk_interactions_contact
  FOREIGN KEY (contact_id) REFERENCES contacts(id)
  ON DELETE CASCADE;
```

5. **Ativar Leaked Password Protection**
- Acessar Auth Settings no Supabase Dashboard
- Habilitar "Leaked password protection"

### Prioridade 3 - Melhorias

6. **Popular tabelas vazias com dados demo**
7. **Criar índices adicionais para queries frequentes**
8. **Implementar soft delete onde apropriado**
9. **Adicionar constraints de validação**

---

## Diagrama ER (Simplificado)

```
┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │    companies    │
│─────────────────│       │─────────────────│
│ id (PK)         │       │ id (PK)         │
│ first_name      │       │ user_id (FK)    │
│ last_name       │       │ name            │
│ nlp_profile     │       │ industry        │
│ preferences     │       │ ...             │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │                         │
         │ 1:N                     │ 1:N
         │                         │
         ▼                         ▼
┌─────────────────────────────────────────────┐
│                  contacts                    │
│─────────────────────────────────────────────│
│ id (PK)                                      │
│ user_id (FK → profiles)                      │
│ company_id (FK → companies)                  │
│ first_name, last_name                        │
│ behavior (JSONB) ─────────────┐              │
│ relationship_score            │              │
│ ...                           │              │
└──────────────┬────────────────┼──────────────┘
               │                │
    ┌──────────┴─────┐    ┌─────┴─────┐
    │                │    │           │
    ▼                ▼    ▼           ▼
┌────────────┐ ┌────────────┐ ┌───────────────┐
│interactions│ │disc_history│ │cognitive_bias │
│────────────│ │────────────│ │───────────────│
│ id (PK)    │ │ id (PK)    │ │ id (PK)       │
│ contact_id │ │ contact_id │ │ contact_id    │
│ type       │ │ primary    │ │ detected_     │
│ content    │ │ scores     │ │   biases      │
│ sentiment  │ │ confidence │ │ strategies    │
└────────────┘ └────────────┘ └───────────────┘
```

---

## Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 03/02/2026 | 1.0 | Análise inicial completa |

---

> **Gerado automaticamente pelo sistema RelateIQ**  
> **Última atualização:** 03/02/2026
