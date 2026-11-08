# zapp_history.message_audio

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
| usada por views | zapp_history.contact_message_stats, zapp_history.v_dashboard_atendimento, zapp_history.v_pipeline_pending |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `message_id` | `uuid` | não |  |  |  |
| 3 | `contact_id` | `uuid` | não |  |  |  |
| 4 | `conversation_id` | `uuid` | sim |  |  |  |
| 5 | `storage_bucket` | `text` | não | `'audio-messages'::text` |  |  |
| 6 | `storage_path` | `text` | não |  |  |  |
| 7 | `file_size_bytes` | `bigint` | sim |  |  |  |
| 8 | `mime_type` | `text` | sim |  |  |  |
| 9 | `duration_seconds` | `numeric(8,2)` | sim |  |  |  |
| 10 | `hash_sha256` | `text` | sim |  |  |  |
| 11 | `speaker` | `text` | não | `'contact'::text` |  | contact = cliente falou \| agent = atendente falou \| system |
| 12 | `agent_id` | `uuid` | sim |  |  |  |
| 13 | `transcription` | `text` | sim |  |  |  |
| 14 | `transcription_language` | `text` | sim | `'pt-BR'::text` |  |  |
| 15 | `transcription_confidence` | `numeric(4,3)` | sim |  |  |  |
| 16 | `transcription_provider` | `text` | sim |  |  |  |
| 17 | `transcription_model` | `text` | sim |  |  |  |
| 18 | `transcription_word_timestamps` | `jsonb` | sim |  |  | Array JSONB [{word, start, end, confidence}] vindo do Whisper verbose_json. Permite alinhamento palavra-tempo. |
| 19 | `transcription_at` | `timestamp with time zone` | sim |  |  |  |
| 20 | `transcription_status` | `text` | não | `'pending'::text` |  |  |
| 21 | `transcription_error` | `text` | sim |  |  |  |
| 22 | `transcription_attempts` | `integer` | não | `0` |  |  |
| 23 | `detected_intent` | `text` | sim |  |  |  |
| 24 | `detected_entities` | `jsonb` | sim |  |  |  |
| 25 | `sentiment_score` | `numeric(3,2)` | sim |  |  |  |
| 26 | `emotion` | `text` | sim |  |  |  |
| 27 | `speaker_pace` | `text` | sim |  |  |  |
| 28 | `silence_ratio` | `numeric(3,2)` | sim |  |  |  |
| 29 | `embedding` | `vector(1536)` | sim |  |  | Vector(1536) do text-embedding-3-small aplicado sobre a transcrição. Habilita busca semântica em áudios. |
| 30 | `embedding_model` | `text` | sim |  |  |  |
| 31 | `embedding_at` | `timestamp with time zone` | sim |  |  |  |
| 32 | `is_training_eligible` | `boolean` | não | `true` |  | TRUE = áudio pode ir para o dataset de treino. Falso quando contém PII ou confidence < 0.5. |
| 33 | `training_quality_score` | `integer` | sim |  |  |  |
| 34 | `training_excluded_reason` | `text` | sim |  |  | Motivo da exclusão: contains_pii \| low_confidence \| low_audio_quality \| off_topic \| manual |
| 35 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 36 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |
| 37 | `embedding_1024` | `vector(1024)` | sim |  |  |  |
| 38 | `embedding_provider` | `text` | sim |  |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| chk_ma_attempts_positive | CHECK | `CHECK (transcription_attempts >= 0)` |  |  | sim |
| chk_ma_confidence_range | CHECK | `CHECK (transcription_confidence IS NULL OR transcription_confidence >= 0::numeric AND transcription_confidence <= 1::numeric)` |  |  | sim |
| chk_ma_duration_positive | CHECK | `CHECK (duration_seconds IS NULL OR duration_seconds >= 0::numeric)` |  |  | sim |
| chk_ma_sentiment_range | CHECK | `CHECK (sentiment_score IS NULL OR sentiment_score >= '-1'::integer::numeric AND sentiment_score <= 1::numeric)` |  |  | sim |
| message_audio_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_audio_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES zapp_history.conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| message_audio_message_id_fkey | FOREIGN KEY | `FOREIGN KEY (message_id) REFERENCES zapp_history.messages(id) ON DELETE CASCADE` | CASCADE | NO ACTION | sim |
| message_audio_message_id_key | UNIQUE | `UNIQUE (message_id)` |  |  | sim |
| message_audio_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| message_audio_speaker_check | CHECK | `CHECK (speaker = ANY (ARRAY['contact'::text, 'agent'::text, 'system'::text]))` |  |  | sim |
| message_audio_training_quality_score_check | CHECK | `CHECK (training_quality_score >= 1 AND training_quality_score <= 5)` |  |  | sim |
| message_audio_transcription_provider_check | CHECK | `CHECK (transcription_provider = ANY (ARRAY['whisper'::text, 'elevenlabs'::text, 'manual'::text]))` |  |  | sim |
| message_audio_transcription_status_check | CHECK | `CHECK (transcription_status = ANY (ARRAY['pending'::text, 'processing'::text, 'done'::text, 'failed'::text, 'skipped'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| idx_audio_conv | btree | conversation_id | não | sim |  | `CREATE INDEX idx_audio_conv ON zapp_history.message_audio USING btree (conversation_id)` |
| idx_ma_contact_created | btree | contact_id, created_at | não | sim |  | `CREATE INDEX idx_ma_contact_created ON zapp_history.message_audio USING btree (contact_id, created_at DESC)` |
| idx_ma_embedding | ivfflat | embedding | não | sim |  | `CREATE INDEX idx_ma_embedding ON zapp_history.message_audio USING ivfflat (embedding vector_cosine_ops) WITH (lists='100')` |
| idx_ma_embedding_1024 | ivfflat | embedding_1024 | não | sim | `(embedding_1024 IS NOT NULL)` | `CREATE INDEX idx_ma_embedding_1024 ON zapp_history.message_audio USING ivfflat (embedding_1024 vector_cosine_ops) WITH (lists='100') WHERE (embedding_1024 IS NOT NULL)` |
| idx_ma_pending_transcription | btree | created_at | não | sim | `((transcription_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (transcription_attempts < 5))` | `CREATE INDEX idx_ma_pending_transcription ON zapp_history.message_audio USING btree (created_at) WHERE ((transcription_status = ANY (ARRAY['pending'::text, 'failed'::text])) AND (transcription_attempts < 5))` |
| message_audio_message_id_key | btree | message_id | sim | sim |  | `CREATE UNIQUE INDEX message_audio_message_id_key ON zapp_history.message_audio USING btree (message_id)` |
| message_audio_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX message_audio_pkey ON zapp_history.message_audio USING btree (id)` |


## Policies (RLS)

### `ma_read`

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
| trg_auto_enqueue_audio | AFTER | INSERT | ROW | enabled | zapp_history.trg_auto_enqueue_transcription |
| trg_ma_autofill | BEFORE | INSERT | ROW | enabled | zapp_history.trg_autofill_contact_from_message |
| trg_ma_set_flag | AFTER | INSERT | ROW | enabled | zapp_history.trg_set_has_audio |
| trg_ma_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

_nenhum_
