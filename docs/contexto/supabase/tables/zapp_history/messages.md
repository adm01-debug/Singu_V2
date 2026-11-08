# zapp_history.messages

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | sim |
| replica identity | full |
| vem de extensão | não |
| usada por views | zapp_history.contact_message_stats, zapp_history.v_audit_intelligence, zapp_history.v_authority_funnel, zapp_history.v_bant_distribution, zapp_history.v_budget_sensitivity, zapp_history.v_buying_triggers, zapp_history.v_churn_alerts, zapp_history.v_company_sizes, zapp_history.v_competitor_alerts, zapp_history.v_complexity_distribution, zapp_history.v_conversas_aguardando, zapp_history.v_customization_demand, zapp_history.v_dashboard_atendimento, zapp_history.v_delivery_distribution, zapp_history.v_demanda_geografica, zapp_history.v_demanda_por_cidade, zapp_history.v_disc_distribution, zapp_history.v_disc_funnel_matrix, zapp_history.v_emotional_states, zapp_history.v_eventos_demanda, zapp_history.v_full_intelligence_stream, zapp_history.v_funil_origem, zapp_history.v_funil_vendas, zapp_history.v_hesitation_funnel, zapp_history.v_intelligence_360, zapp_history.v_intents_distribution, zapp_history.v_journey_funnel, zapp_history.v_language_distribution, zapp_history.v_melhores_horarios, zapp_history.v_objecoes_recorrentes, zapp_history.v_payment_preferences, zapp_history.v_pedidos_detectados, zapp_history.v_pipeline_pending, zapp_history.v_priority_matrix, zapp_history.v_proximas_respostas, zapp_history.v_question_topics, zapp_history.v_referral_sources, zapp_history.v_relationship_funnel, zapp_history.v_routing_queue, zapp_history.v_seasonality_demand, zapp_history.v_segmentacao_clientes, zapp_history.v_spam_log, zapp_history.v_speaker_roles, zapp_history.v_tom_comunicacao, zapp_history.v_top_contatos_potencial, zapp_history.v_top_produtos_demanda, zapp_history.v_topicos_recorrentes, zapp_history.v_units_distribution, zapp_history.v_volume_por_hora |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `conversation_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `company_id` | `uuid` | sim |  |  |  |
| 5 | `whatsapp_message_id` | `text` | sim |  |  | ID original do WhatsApp. UNIQUE para dedupe — webhook reentrante não duplica. |
| 6 | `evolution_message_id` | `text` | sim |  |  |  |
| 7 | `direction` | `text` | não |  |  | inbound = vindo do contato \| outbound = enviado pelo agente \| system = mensagem do sistema |
| 8 | `sent_by_user_id` | `uuid` | sim |  |  |  |
| 9 | `from_me` | `boolean` | não | `false` |  | Espelho de direction (compatibilidade com clientes WhatsApp). |
| 10 | `message_type` | `text` | não |  |  |  |
| 11 | `content` | `text` | sim |  |  |  |
| 12 | `quoted_message_id` | `uuid` | sim |  |  |  |
| 13 | `has_media` | `boolean` | não | `false` |  | TRUE quando existe row em message_media. Atualizado automaticamente pelo trigger trg_mm_set_flag. |
| 14 | `has_audio` | `boolean` | não | `false` |  | TRUE quando existe row em message_audio. Atualizado automaticamente pelo trigger trg_ma_set_flag. |
| 15 | `has_links` | `boolean` | não | `false` |  | TRUE quando existe row em message_links. Atualizado automaticamente pelo trigger trg_ml_increment. |
| 16 | `link_count` | `integer` | não | `0` |  |  |
| 17 | `word_count` | `integer` | sim |  |  |  |
| 18 | `language` | `text` | sim | `'pt-BR'::text` |  |  |
| 19 | `message_intent` | `text` | sim |  |  |  |
| 20 | `sentiment_score` | `numeric(3,2)` | sim |  |  |  |
| 21 | `embedding_status` | `text` | não | `'pending'::text` |  | pending → processing → done \| failed \| skipped. Cron embed-message processa pending. |
| 22 | `delivery_status` | `text` | sim |  |  |  |
| 23 | `delivered_at` | `timestamp with time zone` | sim |  |  |  |
| 24 | `read_at` | `timestamp with time zone` | sim |  |  |  |
| 25 | `failed_reason` | `text` | sim |  |  |  |
| 26 | `raw_payload` | `jsonb` | sim |  |  | Payload completo da Evolution API para debug e replay. |
| 27 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 28 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 29 | `nlp_entities` | `jsonb` | sim |  |  |  |
| 30 | `nlp_sentiment` | `text` | sim |  |  |  |
| 31 | `nlp_sentiment_score` | `numeric(5,4)` | sim |  |  |  |
| 32 | `nlp_structured_order` | `jsonb` | sim |  |  |  |
| 33 | `nlp_processed_at` | `timestamp with time zone` | sim |  |  |  |
| 34 | `nlp_request_id` | `bigint` | sim |  |  |  |
| 35 | `lead_score` | `integer` | sim |  |  |  |
| 36 | `lead_score_breakdown` | `jsonb` | sim |  |  |  |
| 37 | `discovery_channel` | `text` | sim |  |  |  |
| 38 | `budget_detected` | `numeric` | sim |  |  |  |
| 39 | `objections` | `text[]` | sim |  |  |  |
| 40 | `funnel_stage` | `text` | sim |  |  |  |
| 41 | `in_business_hours` | `boolean` | sim |  |  |  |
| 42 | `day_of_week` | `text` | sim |  |  |  |
| 43 | `contact_info_extracted` | `jsonb` | sim |  |  |  |
| 44 | `location_extracted` | `jsonb` | sim |  |  |  |
| 45 | `communication_tone` | `jsonb` | sim |  |  |  |
| 46 | `customer_type` | `text` | sim |  |  |  |
| 47 | `event_type` | `text` | sim |  |  |  |
| 48 | `buying_triggers` | `text[]` | sim |  |  |  |
| 49 | `churn_risk` | `jsonb` | sim |  |  |  |
| 50 | `disc_profile` | `jsonb` | sim |  |  |  |
| 51 | `payment_preferences` | `text[]` | sim |  |  |  |
| 52 | `customization_extracted` | `jsonb` | sim |  |  |  |
| 53 | `journey_stage` | `text` | sim |  |  |  |
| 54 | `topics` | `text[]` | sim |  |  |  |
| 55 | `primary_intent` | `text` | sim |  |  |  |
| 56 | `speaker_role` | `text` | sim |  |  |  |
| 57 | `order_complexity` | `jsonb` | sim |  |  |  |
| 58 | `priority_quadrant` | `text` | sim |  |  |  |
| 59 | `emotional_state` | `jsonb` | sim |  |  |  |
| 60 | `question_analysis` | `jsonb` | sim |  |  |  |
| 61 | `suggested_response_at` | `timestamp with time zone` | sim |  |  |  |
| 62 | `suggested_response_label` | `text` | sim |  |  |  |
| 63 | `language_info` | `jsonb` | sim |  |  |  |
| 64 | `hesitation` | `jsonb` | sim |  |  |  |
| 65 | `credibility` | `jsonb` | sim |  |  |  |
| 66 | `quarantined` | `boolean` | sim | `false` |  |  |
| 67 | `quarantine_reason` | `text` | sim |  |  |  |
| 68 | `company_size` | `jsonb` | sim |  |  |  |
| 69 | `seasonality` | `text[]` | sim |  |  |  |
| 70 | `relationship_status` | `jsonb` | sim |  |  |  |
| 71 | `budget_sensitivity` | `jsonb` | sim |  |  |  |
| 72 | `competitor_mention` | `jsonb` | sim |  |  |  |
| 73 | `unit_of_measure` | `text` | sim |  |  |  |
| 74 | `delivery_preference` | `jsonb` | sim |  |  |  |
| 75 | `referral_source` | `jsonb` | sim |  |  |  |
| 76 | `decision_authority` | `jsonb` | sim |  |  |  |
| 77 | `bant_score` | `jsonb` | sim |  |  |  |
| 78 | `technical_interest` | `jsonb` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_content_or_media | CHECK | `CHECK (content IS NOT NULL OR (message_type = ANY (ARRAY['audio'::text, 'image'::text, 'video'::text, 'document'::text, 'sticker'::text, 'location'::text, 'contact'::text])))` |  |  | sim |
| chk_direction_valid | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text]))` |  |  | sim |
| chk_lead_score_range | CHECK | `CHECK (lead_score IS NULL OR lead_score >= 0 AND lead_score <= 100)` |  |  | sim |
| chk_messages_link_count_positive | CHECK | `CHECK (link_count >= 0)` |  |  | sim |
| chk_messages_sentiment_range | CHECK | `CHECK (sentiment_score IS NULL OR sentiment_score >= '-1'::integer::numeric AND sentiment_score <= 1::numeric)` |  |  | sim |
| chk_messages_word_count_positive | CHECK | `CHECK (word_count IS NULL OR word_count >= 0)` |  |  | sim |
| chk_sentiment_score_range | CHECK | `CHECK (nlp_sentiment_score IS NULL OR nlp_sentiment_score >= '-1'::integer::numeric AND nlp_sentiment_score <= 1::numeric)` |  |  | sim |
| chk_text_has_content | CHECK | `CHECK (message_type <> 'text'::text OR content IS NOT NULL AND length(content) > 0)` |  |  | sim |
| messages_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| messages_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| messages_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES zapp_history.conversations(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| messages_direction_check | CHECK | `CHECK (direction = ANY (ARRAY['inbound'::text, 'outbound'::text, 'system'::text]))` |  |  | sim |
| messages_embedding_status_check | CHECK | `CHECK (embedding_status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text, 'skipped'::text]))` |  |  | sim |
| messages_message_type_check | CHECK | `CHECK (message_type = ANY (ARRAY['text'::text, 'image'::text, 'video'::text, 'audio'::text, 'document'::text, 'sticker'::text, 'location'::text, 'contact'::text, 'reaction'::text, 'system'::text, 'unknown'::text]))` |  |  | sim |
| messages_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| messages_quoted_message_id_fkey | FOREIGN KEY | `FOREIGN KEY (quoted_message_id) REFERENCES zapp_history.messages(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| messages_whatsapp_message_id_key | UNIQUE | `UNIQUE (whatsapp_message_id)` |  |  | sim |


## Referenciada por (FKs de outras tabelas)

| tabela | constraint | colunas | on delete |
|---|---|---|---|
| zapp_history.message_audio | message_audio_message_id_fkey | message_id | CASCADE |
| zapp_history.message_embeddings | message_embeddings_message_id_fkey | message_id | CASCADE |
| zapp_history.message_links | message_links_message_id_fkey | message_id | CASCADE |
| zapp_history.message_media | message_media_message_id_fkey | message_id | CASCADE |
| zapp_history.messages | messages_quoted_message_id_fkey | quoted_message_id | SET NULL |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_messages_auth | btree |  | não | sim | `(decision_authority IS NOT NULL)` | `CREATE INDEX idx_messages_auth ON zapp_history.messages USING btree (((decision_authority ->> 'level'::text))) WHERE (decision_authority IS NOT NULL)` |
| idx_messages_bant | btree |  | não | sim | `(bant_score IS NOT NULL)` | `CREATE INDEX idx_messages_bant ON zapp_history.messages USING btree (((bant_score ->> 'classification'::text))) WHERE (bant_score IS NOT NULL)` |
| idx_messages_budget | btree | budget_detected | não | sim | `(budget_detected IS NOT NULL)` | `CREATE INDEX idx_messages_budget ON zapp_history.messages USING btree (budget_detected DESC NULLS LAST) WHERE (budget_detected IS NOT NULL)` |
| idx_messages_budget_sens | btree |  | não | sim | `(budget_sensitivity IS NOT NULL)` | `CREATE INDEX idx_messages_budget_sens ON zapp_history.messages USING btree (((budget_sensitivity ->> 'sensitivity'::text))) WHERE (budget_sensitivity IS NOT NULL)` |
| idx_messages_business_hours | btree | in_business_hours | não | sim |  | `CREATE INDEX idx_messages_business_hours ON zapp_history.messages USING btree (in_business_hours)` |
| idx_messages_buying_triggers | gin | buying_triggers | não | sim | `((buying_triggers IS NOT NULL) AND (array_length(buying_triggers, 1) > 0))` | `CREATE INDEX idx_messages_buying_triggers ON zapp_history.messages USING gin (buying_triggers) WHERE ((buying_triggers IS NOT NULL) AND (array_length(buying_triggers, 1) > 0))` |
| idx_messages_churn_risk | btree |  | não | sim | `((churn_risk IS NOT NULL) AND ((churn_risk ->> 'risk'::text) <> 'none'::text))` | `CREATE INDEX idx_messages_churn_risk ON zapp_history.messages USING btree (((churn_risk ->> 'risk'::text))) WHERE ((churn_risk IS NOT NULL) AND ((churn_risk ->> 'risk'::text) <> 'none'::text))` |
| idx_messages_company_id | btree | company_id | não | sim |  | `CREATE INDEX idx_messages_company_id ON zapp_history.messages USING btree (company_id)` |
| idx_messages_company_size | btree |  | não | sim | `(company_size IS NOT NULL)` | `CREATE INDEX idx_messages_company_size ON zapp_history.messages USING btree (((company_size ->> 'size'::text))) WHERE (company_size IS NOT NULL)` |
| idx_messages_competitor | btree |  | não | sim | `(competitor_mention IS NOT NULL)` | `CREATE INDEX idx_messages_competitor ON zapp_history.messages USING btree (((competitor_mention ->> 'context'::text))) WHERE (competitor_mention IS NOT NULL)` |
| idx_messages_complexity | btree |  | não | sim | `(order_complexity IS NOT NULL)` | `CREATE INDEX idx_messages_complexity ON zapp_history.messages USING btree (((order_complexity ->> 'level'::text))) WHERE (order_complexity IS NOT NULL)` |
| idx_messages_contact_created | btree | contact_id, created_at | não | sim |  | `CREATE INDEX idx_messages_contact_created ON zapp_history.messages USING btree (contact_id, created_at DESC)` |
| idx_messages_contact_info_gin | gin | contact_info_extracted | não | sim | `(contact_info_extracted IS NOT NULL)` | `CREATE INDEX idx_messages_contact_info_gin ON zapp_history.messages USING gin (contact_info_extracted) WHERE (contact_info_extracted IS NOT NULL)` |
| idx_messages_content_fts | gin |  | não | sim |  | `CREATE INDEX idx_messages_content_fts ON zapp_history.messages USING gin (to_tsvector('portuguese'::regconfig, COALESCE(content, ''::text)))` |
| idx_messages_conversation | btree | conversation_id, created_at | não | sim |  | `CREATE INDEX idx_messages_conversation ON zapp_history.messages USING btree (conversation_id, created_at DESC)` |
| idx_messages_credibility | btree |  | não | sim | `(credibility IS NOT NULL)` | `CREATE INDEX idx_messages_credibility ON zapp_history.messages USING btree (((credibility ->> 'level'::text))) WHERE (credibility IS NOT NULL)` |
| idx_messages_customization | gin | customization_extracted | não | sim | `(customization_extracted IS NOT NULL)` | `CREATE INDEX idx_messages_customization ON zapp_history.messages USING gin (customization_extracted) WHERE (customization_extracted IS NOT NULL)` |
| idx_messages_delivery | btree |  | não | sim | `(delivery_preference IS NOT NULL)` | `CREATE INDEX idx_messages_delivery ON zapp_history.messages USING btree (((delivery_preference ->> 'method'::text))) WHERE (delivery_preference IS NOT NULL)` |
| idx_messages_direction | btree | direction, created_at | não | sim |  | `CREATE INDEX idx_messages_direction ON zapp_history.messages USING btree (direction, created_at DESC)` |
| idx_messages_disc | btree |  | não | sim | `(disc_profile IS NOT NULL)` | `CREATE INDEX idx_messages_disc ON zapp_history.messages USING btree (((disc_profile ->> 'dominant'::text))) WHERE (disc_profile IS NOT NULL)` |
| idx_messages_emotion | btree |  | não | sim | `(emotional_state IS NOT NULL)` | `CREATE INDEX idx_messages_emotion ON zapp_history.messages USING btree (((emotional_state ->> 'dominant'::text))) WHERE (emotional_state IS NOT NULL)` |
| idx_messages_event_type | btree | event_type | não | sim | `(event_type IS NOT NULL)` | `CREATE INDEX idx_messages_event_type ON zapp_history.messages USING btree (event_type) WHERE (event_type IS NOT NULL)` |
| idx_messages_funnel_stage | btree | funnel_stage | não | sim | `(funnel_stage IS NOT NULL)` | `CREATE INDEX idx_messages_funnel_stage ON zapp_history.messages USING btree (funnel_stage) WHERE (funnel_stage IS NOT NULL)` |
| idx_messages_hesitation | btree |  | não | sim | `(hesitation IS NOT NULL)` | `CREATE INDEX idx_messages_hesitation ON zapp_history.messages USING btree (((hesitation ->> 'level'::text))) WHERE (hesitation IS NOT NULL)` |
| idx_messages_intent | btree | primary_intent | não | sim | `(primary_intent IS NOT NULL)` | `CREATE INDEX idx_messages_intent ON zapp_history.messages USING btree (primary_intent) WHERE (primary_intent IS NOT NULL)` |
| idx_messages_journey | btree | journey_stage | não | sim | `(journey_stage IS NOT NULL)` | `CREATE INDEX idx_messages_journey ON zapp_history.messages USING btree (journey_stage) WHERE (journey_stage IS NOT NULL)` |
| idx_messages_lang | btree |  | não | sim | `(language_info IS NOT NULL)` | `CREATE INDEX idx_messages_lang ON zapp_history.messages USING btree (((language_info ->> 'lang'::text))) WHERE (language_info IS NOT NULL)` |
| idx_messages_lead_score | btree | lead_score | não | sim | `(lead_score IS NOT NULL)` | `CREATE INDEX idx_messages_lead_score ON zapp_history.messages USING btree (lead_score DESC NULLS LAST) WHERE (lead_score IS NOT NULL)` |
| idx_messages_location_gin | gin | location_extracted | não | sim | `(location_extracted IS NOT NULL)` | `CREATE INDEX idx_messages_location_gin ON zapp_history.messages USING gin (location_extracted) WHERE (location_extracted IS NOT NULL)` |
| idx_messages_nlp_entities | gin | nlp_entities | não | sim | `(nlp_entities IS NOT NULL)` | `CREATE INDEX idx_messages_nlp_entities ON zapp_history.messages USING gin (nlp_entities) WHERE (nlp_entities IS NOT NULL)` |
| idx_messages_nlp_order | gin | nlp_structured_order | não | sim | `(nlp_structured_order IS NOT NULL)` | `CREATE INDEX idx_messages_nlp_order ON zapp_history.messages USING gin (nlp_structured_order) WHERE (nlp_structured_order IS NOT NULL)` |
| idx_messages_nlp_sentiment | btree | nlp_sentiment | não | sim | `(nlp_sentiment IS NOT NULL)` | `CREATE INDEX idx_messages_nlp_sentiment ON zapp_history.messages USING btree (nlp_sentiment) WHERE (nlp_sentiment IS NOT NULL)` |
| idx_messages_objections | gin | objections | não | sim | `((objections IS NOT NULL) AND (array_length(objections, 1) > 0))` | `CREATE INDEX idx_messages_objections ON zapp_history.messages USING gin (objections) WHERE ((objections IS NOT NULL) AND (array_length(objections, 1) > 0))` |
| idx_messages_pending_embedding | btree | created_at | não | sim | `((embedding_status = 'pending'::text) AND (content IS NOT NULL))` | `CREATE INDEX idx_messages_pending_embedding ON zapp_history.messages USING btree (created_at) WHERE ((embedding_status = 'pending'::text) AND (content IS NOT NULL))` |
| idx_messages_priority_quad | btree | priority_quadrant | não | sim | `(priority_quadrant IS NOT NULL)` | `CREATE INDEX idx_messages_priority_quad ON zapp_history.messages USING btree (priority_quadrant) WHERE (priority_quadrant IS NOT NULL)` |
| idx_messages_question_type | btree |  | não | sim | `(question_analysis IS NOT NULL)` | `CREATE INDEX idx_messages_question_type ON zapp_history.messages USING btree (((question_analysis ->> 'type'::text))) WHERE (question_analysis IS NOT NULL)` |
| idx_messages_quoted_msg | btree | quoted_message_id | não | sim | `(quoted_message_id IS NOT NULL)` | `CREATE INDEX idx_messages_quoted_msg ON zapp_history.messages USING btree (quoted_message_id) WHERE (quoted_message_id IS NOT NULL)` |
| idx_messages_referral | btree |  | não | sim | `(referral_source IS NOT NULL)` | `CREATE INDEX idx_messages_referral ON zapp_history.messages USING btree (((referral_source ->> 'source'::text))) WHERE (referral_source IS NOT NULL)` |
| idx_messages_rel_status | btree |  | não | sim | `(relationship_status IS NOT NULL)` | `CREATE INDEX idx_messages_rel_status ON zapp_history.messages USING btree (((relationship_status ->> 'status'::text))) WHERE (relationship_status IS NOT NULL)` |
| idx_messages_speaker_role | btree | speaker_role | não | sim | `(speaker_role IS NOT NULL)` | `CREATE INDEX idx_messages_speaker_role ON zapp_history.messages USING btree (speaker_role) WHERE (speaker_role IS NOT NULL)` |
| idx_messages_suggested_response | btree | suggested_response_at | não | sim | `(suggested_response_at IS NOT NULL)` | `CREATE INDEX idx_messages_suggested_response ON zapp_history.messages USING btree (suggested_response_at) WHERE (suggested_response_at IS NOT NULL)` |
| idx_messages_tone | btree |  | não | sim | `(communication_tone IS NOT NULL)` | `CREATE INDEX idx_messages_tone ON zapp_history.messages USING btree (((communication_tone ->> 'tone'::text))) WHERE (communication_tone IS NOT NULL)` |
| idx_messages_topics | gin | topics | não | sim | `((topics IS NOT NULL) AND (array_length(topics, 1) > 0))` | `CREATE INDEX idx_messages_topics ON zapp_history.messages USING gin (topics) WHERE ((topics IS NOT NULL) AND (array_length(topics, 1) > 0))` |
| idx_messages_type | btree | message_type, created_at | não | sim |  | `CREATE INDEX idx_messages_type ON zapp_history.messages USING btree (message_type, created_at DESC)` |
| idx_messages_unit | btree | unit_of_measure | não | sim | `(unit_of_measure IS NOT NULL)` | `CREATE INDEX idx_messages_unit ON zapp_history.messages USING btree (unit_of_measure) WHERE (unit_of_measure IS NOT NULL)` |
| idx_msg_bant_classification | btree |  | não | sim |  | `CREATE INDEX idx_msg_bant_classification ON zapp_history.messages USING btree (((bant_score ->> 'classification'::text)))` |
| idx_msg_primary_intent | btree | primary_intent | não | sim | `(nlp_processed_at IS NOT NULL)` | `CREATE INDEX idx_msg_primary_intent ON zapp_history.messages USING btree (primary_intent) WHERE (nlp_processed_at IS NOT NULL)` |
| idx_msg_quarantined | btree | created_at | não | sim | `(quarantined = true)` | `CREATE INDEX idx_msg_quarantined ON zapp_history.messages USING btree (created_at DESC) WHERE (quarantined = true)` |
| idx_msg_sql_qualified_recent | btree | created_at | não | sim | `((lead_score >= 80) AND (quarantined = false))` | `CREATE INDEX idx_msg_sql_qualified_recent ON zapp_history.messages USING btree (created_at DESC) WHERE ((lead_score >= 80) AND (quarantined = false))` |
| idx_msg_unprocessed | btree | created_at | não | sim | `(nlp_processed_at IS NULL)` | `CREATE INDEX idx_msg_unprocessed ON zapp_history.messages USING btree (created_at) WHERE (nlp_processed_at IS NULL)` |
| messages_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX messages_pkey ON zapp_history.messages USING btree (id)` |
| messages_whatsapp_message_id_key | btree | whatsapp_message_id | sim | sim |  | `CREATE UNIQUE INDEX messages_whatsapp_message_id_key ON zapp_history.messages USING btree (whatsapp_message_id)` |


## Policies (RLS)

### `msg_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `zapp_history.user_can_access_contact(contact_id)` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_auto_embed_message | AFTER | INSERT | ROW | enabled | zapp_history.trg_auto_request_embedding |
| trg_auto_enrich_contact | AFTER | UPDATE | ROW | enabled | zapp_history.auto_enrich_contact |
| trg_auto_tag_contact | AFTER | UPDATE | ROW | enabled | zapp_history.auto_tag_contact_from_nlp |
| trg_bump_conversation_on_message | AFTER | INSERT | ROW | enabled | zapp_history.bump_conversation_on_message |
| trg_churn_alert | AFTER | UPDATE | ROW | enabled | zapp_history.alert_churn_critical |
| trg_content_flood | BEFORE | INSERT | ROW | enabled | zapp_history.trg_detect_content_flood |
| trg_lead_score_calc | AFTER | UPDATE | ROW | enabled | zapp_history.trg_calculate_lead_score |
| trg_messages_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |
| trg_msg_periodic_reconcile | AFTER | INSERT | ROW | enabled | zapp_history.trg_periodic_reconcile |
| trg_resolve_company_cnpj | AFTER | UPDATE | ROW | enabled | zapp_history.resolve_company_from_cnpj |
| trg_response_time_calc | AFTER | INSERT | ROW | enabled | zapp_history.trg_update_response_time |
| trg_set_business_hours | BEFORE | INSERT | ROW | enabled | zapp_history.trg_set_business_hours |
| trg_short_msg_auto_process | BEFORE | INSERT | ROW | enabled | zapp_history.trg_short_message_auto_process |
| trg_sync_msg_nlp_to_singu | AFTER | UPDATE | ROW | enabled | zapp_history.sync_message_nlp_to_interaction |
| trg_urgent_order_alert | AFTER | UPDATE | ROW | enabled | zapp_history.alert_urgent_order_via_bitrix |
| zzz2_trg_response_window | AFTER | UPDATE | ROW | enabled | zapp_history.trg_set_response_window |
| zzz3_trg_spam_quarantine | AFTER | UPDATE | ROW | enabled | zapp_history.trg_spam_quarantine |
| zzz4_trg_technical_interest | BEFORE | UPDATE | ROW | enabled | zapp_history.trg_set_technical_interest |
| zzz5_trg_supplement_urgency | BEFORE | UPDATE | ROW | enabled | zapp_history.trg_supplement_urgency |
| zzz_trg_priority_quadrant | AFTER | UPDATE | ROW | enabled | zapp_history.trg_set_priority_quadrant |


## Grants

_nenhum_
