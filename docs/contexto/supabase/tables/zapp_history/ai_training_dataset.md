# zapp_history.ai_training_dataset

| propriedade | valor |
|---|---|
| tipo | table |
| owner | postgres |
| RLS habilitado | sim |
| RLS forçado (owner) | não |
| policies | 1 |
| realtime (publication) | não |
| replica identity | default |
| vem de extensão | não |


## Colunas

| # | coluna | tipo | nullable | default | identity/generated | comentário |
|---|---|---|---|---|---|---|
| 1 | `id` | `uuid` | não | `gen_random_uuid()` |  |  |
| 2 | `source_type` | `text` | não |  |  | message_pair = pergunta cliente → resposta agente \| audio_transcription \| summary \| conversation_excerpt |
| 3 | `source_id` | `uuid` | sim |  |  |  |
| 4 | `contact_id` | `uuid` | sim |  |  |  |
| 5 | `conversation_id` | `uuid` | sim |  |  |  |
| 6 | `input_text` | `text` | não |  |  |  |
| 7 | `expected_output` | `text` | sim |  |  |  |
| 8 | `context` | `jsonb` | sim |  |  |  |
| 9 | `intent` | `text` | sim |  |  |  |
| 10 | `category` | `text` | sim |  |  |  |
| 11 | `sentiment` | `text` | sim |  |  |  |
| 12 | `entities` | `jsonb` | sim |  |  |  |
| 13 | `tags` | `text[]` | sim |  |  |  |
| 14 | `quality_score` | `integer` | sim |  |  | 1-5. Apenas score >= 4 e reviewed=TRUE entram no fine-tuning. |
| 15 | `reviewed` | `boolean` | não | `false` |  |  |
| 16 | `reviewed_by` | `uuid` | sim |  |  |  |
| 17 | `reviewed_at` | `timestamp with time zone` | sim |  |  |  |
| 18 | `review_notes` | `text` | sim |  |  |  |
| 19 | `contains_pii` | `boolean` | não | `false` |  | TRUE = detectada PII via ai.detect_pii. Bloqueia used_in_training até revisão humana. |
| 20 | `pii_fields` | `text[]` | sim |  |  |  |
| 21 | `pii_redacted_text` | `text` | sim |  |  | Versão do input_text com [CPF], [EMAIL], [PHONE] etc substituídos. |
| 22 | `used_in_training` | `boolean` | não | `false` |  |  |
| 23 | `training_run_id` | `text` | sim |  |  |  |
| 24 | `used_at` | `timestamp with time zone` | sim |  |  |  |
| 25 | `created_at` | `timestamp with time zone` | não | `now()` |  |  |
| 26 | `updated_at` | `timestamp with time zone` | não | `now()` |  |  |


## Constraints

| nome | tipo | definição | on delete | on update | validada |
|---|---|---|---|---|---|
| ai_training_dataset_contact_id_fkey | FOREIGN KEY | `FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| ai_training_dataset_conversation_id_fkey | FOREIGN KEY | `FOREIGN KEY (conversation_id) REFERENCES zapp_history.conversations(id) ON DELETE SET NULL` | SET NULL | NO ACTION | sim |
| ai_training_dataset_pkey | PRIMARY KEY | `PRIMARY KEY (id)` |  |  | sim |
| ai_training_dataset_quality_score_check | CHECK | `CHECK (quality_score >= 1 AND quality_score <= 5)` |  |  | sim |
| ai_training_dataset_source_type_check | CHECK | `CHECK (source_type = ANY (ARRAY['message_pair'::text, 'audio_transcription'::text, 'summary'::text, 'conversation_excerpt'::text]))` |  |  | sim |


## Índices

| nome | método | colunas | único | válido | predicado | definição |
|---|---|---|---|---|---|---|
| ai_training_dataset_pkey | btree | id | sim | sim |  | `CREATE UNIQUE INDEX ai_training_dataset_pkey ON zapp_history.ai_training_dataset USING btree (id)` |
| idx_ai_training_contact | btree | contact_id | não | sim |  | `CREATE INDEX idx_ai_training_contact ON zapp_history.ai_training_dataset USING btree (contact_id)` |
| idx_ai_training_conv | btree | conversation_id | não | sim |  | `CREATE INDEX idx_ai_training_conv ON zapp_history.ai_training_dataset USING btree (conversation_id)` |


## Policies (RLS)

### `atd_admin_read`

| campo | valor |
|---|---|
| comando | SELECT |
| tipo | PERMISSIVE |
| roles | public |
| USING | `(EXISTS ( SELECT 1    FROM zapp_history.admin_grants g   WHERE (g.user_id = ( SELECT auth.uid() AS uid))))` |
| WITH CHECK |  |


## Triggers

| nome | timing | eventos | nível | status | função |
|---|---|---|---|---|---|
| trg_atd_updated_at | BEFORE | UPDATE | ROW | enabled | zapp_history.update_updated_at_column |


## Grants

| role | privilégios |
|---|---|
| authenticated | SELECT |
| service_role | DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE |
