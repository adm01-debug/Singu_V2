# zapp_history.conversation_daily_summaries

> Sumário diário (24h, dia civil BRT) por contato. Idempotente via UNIQUE(contact_id, summary_date). Sync com public.interactions para alimentar SINGU.

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
| usada por views | zapp_history.contact_message_stats, zapp_history.v_contact_360, zapp_history.v_pipeline_pending, zapp_history.v_recent_summaries |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `contact_id` | `uuid` | não |  |  |  |
| 3 | `company_id` | `uuid` | sim |  |  |  |
| 4 | `conversation_id` | `uuid` | sim |  |  |  |
| 5 | `summary_date` | `date` | não |  |  | Data do dia civil sumarizado (timezone America/Sao_Paulo). Junto com contact_id forma a UNIQUE. |
| 6 | `period_start` | `timestamp with time zone` | não |  |  |  |
| 7 | `period_end` | `timestamp with time zone` | não |  |  |  |
| 8 | `timezone` | `text` | não | `'America/Sao_Paulo'::text` |  |  |
| 9 | `message_count` | `integer` | não | `0` |  |  |
| 10 | `inbound_count` | `integer` | não | `0` |  |  |
| 11 | `outbound_count` | `integer` | não | `0` |  |  |
| 12 | `media_count` | `integer` | não | `0` |  |  |
| 13 | `audio_count` | `integer` | não | `0` |  |  |
| 14 | `link_count` | `integer` | não | `0` |  |  |
| 15 | `total_chars` | `bigint` | sim |  |  |  |
| 16 | `total_audio_seconds` | `numeric(10,2)` | sim |  |  |  |
| 17 | `summary_text` | `text` | sim |  |  |  |
| 18 | `summary_short` | `text` | sim |  |  |  |
| 19 | `key_points` | `text[]` | sim |  |  |  |
| 20 | `topics` | `text[]` | sim |  |  |  |
| 21 | `intents` | `text[]` | sim |  |  |  |
| 22 | `entities` | `jsonb` | sim |  |  |  |
| 23 | `next_steps` | `text[]` | sim |  |  |  |
| 24 | `open_questions` | `text[]` | sim |  |  |  |
| 25 | `agent_actions` | `text[]` | sim |  |  |  |
| 26 | `customer_mood` | `text` | sim |  |  |  |
| 27 | `customer_pain_points` | `text[]` | sim |  |  |  |
| 28 | `sentiment_overall` | `text` | sim |  |  |  |
| 29 | `sentiment_score` | `numeric(3,2)` | sim |  |  |  |
| 30 | `avg_response_time_seconds` | `integer` | sim |  |  |  |
| 31 | `max_response_time_seconds` | `integer` | sim |  |  |  |
| 32 | `resolved` | `boolean` | sim | `false` |  |  |
| 33 | `has_escalation` | `boolean` | sim | `false` |  |  |
| 34 | `conversion_signal` | `text` | sim |  |  | high_intent \| ready_to_buy \| objection_raised \| cooling_off \| NULL |
| 35 | `singu_signals` | `jsonb` | sim |  |  | JSONB com sinais para alimentar SINGU: {disc_hints, eq_hints, bias_hints, objections_hints}. |
| 36 | `generated_by_model` | `text` | sim |  |  |  |
| 37 | `generated_at` | `timestamp with time zone` | sim |  |  |  |
| 38 | `generation_cost_cents` | `numeric(8,4)` | sim |  |  | Custo em centavos USD da chamada OpenAI que gerou este sumário. Auditoria de custo. |
| 39 | `embedding` | `vector(1536)` | sim |  |  |  |
| 40 | `interaction_id` | `uuid` | sim |  |  | FK para a interaction criada no SINGU. Usado para join nos módulos DISC/EQ/vieses. |
| 41 | `synced_to_interactions` | `boolean` | não | `false` |  | Atualizado pelo trigger trg_auto_sync_summary após criar registro em public.interactions. |
| 42 | `synced_at` | `timestamp with time zone` | sim |  |  |  |
| 43 | `sync_error` | `text` | sim |  |  |  |
| 44 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 45 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 46 | `embedding_1024` | `vector(1024)` | sim |  |  |  |
| 47 | `embedding_provider` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_cds_counts_positive | CHECK | `CHECK (message_count >= 0 AND inbound_count >= 0 AND outbound_count >= 0 AND media_count >= 0 AND audio_count >= 0 AND link_count >= 0)` |  |  | sim |
| chk_cds_period_order | CHECK | `CHECK (period_end >= period_start)` |  |  | sim |
| chk_cds_sentiment_range | CHECK | `CHECK (sentiment_score IS NULL OR sentiment_score >= '-1'::integer::numeric AND sentiment_score <= 1::numeric)` |  |  | sim |
| conversation_daily_summaries_company_id_fkey | FOREIGN KEY | `FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| conversation_daily_summaries_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| conversation_daily_summaries_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES zapp_history.conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| conversation_daily_summaries_interaction_id_fkey | FOREIGN KEY | `FOREIGN KEY (interaction_id) REFERENCES interactions(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| conversation_daily_summaries_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| conversation_daily_summaries_sentiment_overall_check | CHECK | `CHECK (sentiment_overall = ANY (ARRAY['positive'::text, 'neutral'::text, 'negative'::text, 'mixed'::text]))` |  |  | sim |
| unique_contact_day | UNIQUE | `UNIQUE (contact_id, summary_date)` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| conversation_daily_summaries_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX conversation_daily_summaries_pkey ON zapp_history.conversation_daily_summaries USING btree (id)` |
| idx_cds_contact_date | btree | contact_id, summary_date | não | sim |  | `CREATE INDEX idx_cds_contact_date ON zapp_history.conversation_daily_summaries USING btree (contact_id, summary_date DESC)` |
| idx_cds_date | btree | summary_date | não | sim |  | `CREATE INDEX idx_cds_date ON zapp_history.conversation_daily_summaries USING btree (summary_date DESC)` |
| idx_cds_embedding | ivfflat | embedding | não | sim |  | `CREATE INDEX idx_cds_embedding ON zapp_history.conversation_daily_summaries USING ivfflat (embedding vector_cosine_ops) WITH (lists='100')` |
| idx_cds_embedding_1024 | ivfflat | embedding_1024 | não | sim | `(embedding_1024 IS NOT NULL)` | `CREATE INDEX idx_cds_embedding_1024 ON zapp_history.conversation_daily_summaries USING ivfflat (embedding_1024 vector_cosine_ops) WITH (lists='100') WHERE (embedding_1024 IS NOT NULL)` |
| idx_cds_pending_sync | btree | created_at | não | sim | `(synced_to_interactions = false)` | `CREATE INDEX idx_cds_pending_sync ON zapp_history.conversation_daily_summaries USING btree (created_at) WHERE (synced_to_interactions = false)` |
| idx_daily_summaries_company | btree | company_id | não | sim |  | `CREATE INDEX idx_daily_summaries_company ON zapp_history.conversation_daily_summaries USING btree (company_id)` |
| idx_daily_summaries_conv | btree | conversation_id | não | sim |  | `CREATE INDEX idx_daily_summaries_conv ON zapp_history.conversation_daily_summaries USING btree (conversation_id)` |
| idx_daily_summaries_interaction | btree | interaction_id | não | sim |  | `CREATE INDEX idx_daily_summaries_interaction ON zapp_history.conversation_daily_summaries USING btree (interaction_id)` |
| unique_contact_day | btree | contact_id, summary_date | sim | sim |  | `CREATE UNIQUE INDEX unique_contact_day ON zapp_history.conversation_daily_summaries USING btree (contact_id, summary_date)` |


## Policies (RLS)

### `cds_read`

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
| trg_auto_sync_summary | AFTER | INSERT OR UPDATE | ROW | enabled | zapp_history.trg_sync_summary_to_interaction |
| trg_cds_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

_nenhum_
